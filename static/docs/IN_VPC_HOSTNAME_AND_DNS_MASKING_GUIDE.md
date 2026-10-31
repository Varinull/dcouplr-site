# Operations Guide: In-VPC Hostname Resolution & URL Masking

**Document Identifier:** `VA-GUIDE-DNS-MASKING-001`  
**Governing Architectural Standard:** `VA-SPEC-WALLBOARD-OBS-001` / `D-44` / `D-51`  
**Classification:** Standard Operating Procedure (SOP) & Enterprise Infrastructure Guide  
**Target Audience:** DevOps Engineers, Cloud Platform Architects, SREs, Security Administrators  
**Compliance Standards:** SOC-2 Type II, ISO 27001, In-VPC Zero-Egress Invariant

---

## 1. Executive Summary & Problem Statement

By default, `<dcouplr/>` binds its high-performance in-VPC telemetry daemon to `0.0.0.0:8000` (accessible locally via `http://127.0.0.1:8000`). While ideal for initial container startup, exposing raw loopback IPs (`127.0.0.1`) and non-standard ports (`:8000`) introduces significant enterprise friction:
- **Developer & Executive Experience**: Navigating to `http://127.0.0.1:8000/dashboard` looks like raw internal developer scaffolding rather than an enterprise-grade platform.
- **Single Sign-On (SSO) & Cookie Constraints**: Enterprise Identity Providers (Okta, Entra ID, Google Workspace) restrict callback redirects on raw IP addresses under strict OAuth2/OIDC security policies.
- **Multi-VPC & Team Accessibility**: Engineers across private subnets cannot easily share loopback links.

This guide provides turnkey, production-tested configurations to mask `http://127.0.0.1:8000` with **clean, branded, valid domain names** across local workstations, cloud VPCs, Kubernetes clusters, and 24x7 NOC wall displays.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                           IN-VPC HOSTNAME MASKING TOPOLOGIES                                    │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  [1. Local Workstation]           [2. Enterprise VPC]              [3. 24x7 NOC Wallboard]      │
│  ┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐  │
│  │ http://dcouplr.local/   │      │ https://dashboard.      │      │ https://noc.            │  │
│  │ dashboard               │      │ dcouplr.internal        │      │ yourcompany.com         │  │
│  └────────────┬────────────┘      └────────────┬────────────┘      └────────────┬────────────┘  │
│               │                                │                                │               │
│               ▼                                ▼                                ▼               │
│  ┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐  │
│  │ Windows hosts file +    │      │ Route 53 Private Zone + │      │ <dcouplr/> AirLock™     │  │
│  │ netsh portproxy (pt 80) │      │ Internal ALB / Ingress  │      │ Cloudflare Zero Trust   │  │
│  └────────────┬────────────┘      └────────────┬────────────┘      └────────────┬────────────┘  │
│               │                                │                                │               │
│               └────────────────────────────────┼────────────────────────────────┘               │
│                                                ▼                                                │
│                                 ┌──────────────────────────────┐                                │
│                                 │ <dcouplr/> Engine (Port 8000)│                                │
│                                 │ 100% In-VPC • Zero WAN Egress│                                │
│                                 └──────────────────────────────┘                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Local Workstation Setup (Windows, macOS, Linux)

### 2.1 Option A: Hostname Masking (`dcouplr.local:8000`)
Every modern operating system includes a local DNS resolution table (`hosts` file). Adding a domain mapping binds any custom name to `127.0.0.1`.

#### Windows (Run PowerShell as Administrator):
```powershell
Add-Content -Path "$env:SystemRoot\System32\drivers\etc\hosts" -Value "`n127.0.0.1  dcouplr.local app.dcouplr.local dashboard.dcouplr.local"
```

#### macOS / Linux:
```bash
echo "127.0.0.1  dcouplr.local app.dcouplr.local dashboard.dcouplr.local" | sudo tee -a /etc/hosts
```

**Result:** Navigating to `http://dcouplr.local:8000/dashboard` immediately displays the live cluster telemetry.

---

### 2.2 Option B: Dropping the `:8000` Port Completely (`http://dcouplr.local/dashboard`)
To eliminate the port number completely so the application runs on standard HTTP port `80`:

#### Windows Native Port-Forwarding (PowerShell as Administrator):
Windows includes a built-in kernel-level TCP port forwarding proxy (`netsh`):
```powershell
netsh interface portproxy add v4tov4 listenport=80 listenaddress=127.0.0.1 connectport=8000 connectaddress=127.0.0.1
```
*To verify active proxy:*
```powershell
netsh interface portproxy show all
```

**Result:** You can now type **`http://dcouplr.local/dashboard`** directly into Chrome, Edge, or Firefox without specifying `:8000`!

---

### 2.3 Option C: Zero-Config Local TLS (`https://dcouplr.local/dashboard`)
For environments requiring local HTTPS (e.g., testing WebRTC war-rooms or camera/microphone permissions):

Create a `Caddyfile` in your workspace:
```caddy
dcouplr.local {
    reverse_proxy 127.0.0.1:8000
    tls internal
}
```
Run `caddy run`. Caddy automatically generates and installs a trusted local CA certificate into the Windows Certificate Store, serving **`https://dcouplr.local/dashboard`** with a green lock icon.

---

## 3. Enterprise VPC Private DNS (AWS, GCP, Azure)

In enterprise cloud perimeters, `<dcouplr/>` is accessed across hundreds of VPC-peered developer subnets using Cloud Private DNS.

### 3.1 AWS Route 53 Private Hosted Zone
1. **Create Private Hosted Zone**: `dcouplr.internal` associated with your application VPCs.
2. **Provision Internal Application Load Balancer (ALB)**:
   - Scheme: `internal` (RFC 1918 private subnets only).
   - Listener: Port 443 with corporate ACM wildcard certificate (`*.dcouplr.internal`).
   - Target Group: Port 8000 pointing to `<dcouplr/>` EC2 instances or container tasks.
3. **Create Route 53 Alias Record**:
   - `dashboard.dcouplr.internal` $\rightarrow$ DualStack ALB DNS name.
4. **End-User URL**:
   👉 **`https://dashboard.dcouplr.internal`**

### 3.2 Google Cloud DNS Private Zone
1. **Create Private Zone**: `dcouplr.corp` authorized for your VPC network.
2. **Deploy Internal HTTP(S) Load Balancer**:
   - Frontend: Private IPv4 VIP on your internal subnet.
   - Backend Service: Instance Group running `<dcouplr/>` on port 8000 with health check on `GET /v1/health`.
3. **Add DNS A-Record**:
   - `dashboard.dcouplr.corp` $\rightarrow$ Internal LB VIP.

### 3.3 Azure Private DNS Zone
1. **Create Private DNS Zone**: `privatelink.dcouplr.internal` linked to target Virtual Networks.
2. **Deploy Azure Application Gateway (Private Frontend IP)**:
   - HTTP Setting: Backend port 8000.
   - Listener: Private HTTPS on port 443.
3. **Add A-Record**:
   - `dashboard.privatelink.dcouplr.internal` $\rightarrow$ App Gateway Private IP.

---

## 4. Kubernetes Ingress Controller (Helm / GitOps)

For Kubernetes deployments (EKS, GKE, AKS, OpenShift), the official Helm chart (`deploy/helm/`) includes ingress declarations:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: dcouplr-ingress
  namespace: dcouplr-system
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
spec:
  rules:
  - host: dcouplr.internal
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: dcouplr-api
            port:
              number: 8000
  tls:
  - hosts:
    - dcouplr.internal
    secretName: dcouplr-tls-cert
```

**End-User Access**: Engineers on the company VPN or within the cluster network navigate to:  
👉 **`https://dcouplr.internal/dashboard`**

---

## 5. Zero-Trust Ingress Tunnel: `<dcouplr/> AirLock™`

For remote SREs and 24x7 NOC wallboards located outside the physical VPC perimeter, `<dcouplr/> AirLock™` eliminates the need for VPN clients while maintaining **0 open inbound firewall ports**:

1. **Deploy In-VPC Tunnel Daemon**:
   ```bash
   ./scripts/deploy_wallboard_tunnel.sh dcouplr-airlock noc.yourcompany.com 8000
   ```
2. **Configure Cloudflare Access Service Token**:
   - Create non-expiring Service Token (`CF-Access-Client-Id` and `CF-Access-Client-Secret`).
   - Bind wallboard kiosk browsers or developer browser sessions to validate token.
3. **End-User & TV Wall URL**:  
   👉 **`https://noc.yourcompany.com`**

---

## 6. Pre-Configured CORS & Allowed Origins

The `<dcouplr/>` API engine has been pre-configured in `migration_tools/api/app.py` to allow cross-origin requests from all standard masked hostnames:

```python
ALLOWED_ORIGINS = [
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "http://dcouplr.local:8000",
    "http://dcouplr.local",
    "http://app.dcouplr.internal:8000",
    "http://app.dcouplr.internal",
    "http://dashboard.dcouplr.local:8000",
    "http://dashboard.dcouplr.local",
    "https://dcouplr.local",
    "https://app.dcouplr.internal"
]
```

Any request routed through these hostnames is recognized as an authorized internal origin with full cookie and session preservation.
