# Engineering Runbook: Outside-VPC Hubs Deployment & Cloudflare Zero Trust Ingress Tunnels

**Document Identifier:** `VA-RUNBOOK-ENG-HUBS-001`  
**Classification:** SRE & DevOps Implementation Guide & Operational Specification  
**Target Audience:** Site Reliability Engineers (SRE), Network Operations Center (NOC) Engineers, Cloud Security Architects, Systems Administrators  
**Supported Platforms:** Linux (Ubuntu 20.04/22.04/24.04, Debian 11/12, RHEL 8/9, Rocky Linux 8/9, Amazon Linux 2023), Windows Server 2019/2022/2025, Docker, Kubernetes  
**Network Perimeter Policy:** Strictly Inbound-Dark (`0.0.0.0/0:ANY` Ingress Blocked on VPC Security Groups)  
**Transport Security:** Outbound-Only QUIC (UDP 7844) / TLS 1.3 (TCP 443)  

---

## 1. Architecture Overview: How Outside-VPC Projection Works

Enterprise infrastructure monitoring requires visual, real-time displays across remote Network Operations Centers (NOC), Site Reliability Engineering (SRE) war-rooms, office TV walls, and executive kiosks. However, internal Virtual Private Clouds (VPCs) must remain isolated with zero public IPs and zero open inbound firewall ports.

`<dcouplr/>` solves this through **Outside-VPC Hubs Architecture**: four operational endpoints projected securely outside the VPC using **Cloudflare Zero Trust Tunnels (`cloudflared`)** without compromising VPC network boundaries.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                IN-VPC PROTECTED SUBNET (10.100.0.0/16)                           │
│                                                                                                  │
│   ┌────────────────────────────────────────┐         ┌───────────────────────────────────────┐   │
│   │     <dcouplr/> Core Engine Daemon      │         │       cloudflared Ingress Daemon      │   │
│   │        127.0.0.1:8000 (Internal)       │◄───────┤         (Outbound Tunnel Client)      │   │
│   └────────────────────────────────────────┘         └───────────────────┬───────────────────┘   │
│                                                                          │                       │
│   AWS Security Group / GCP Firewall Policy:                              │ Outbound-Only         │
│   • Inbound:  DENY ALL (0.0.0.0/0:* = BLOCKED)                           │ QUIC (UDP 7844) /     │
│   • Outbound: ALLOW UDP 7844 / TCP 443 to Cloudflare Edge                │ TLS 1.3 (TCP 443)     │
└──────────────────────────────────────────────────────────────────────────┼───────────────────────┘
                                                                           │
                                                                           ▼
                                                    ┌──────────────────────────────────────────────┐
                                                    │         Cloudflare Global Edge Network       │
                                                    │         (Anycast Ingress & DDoS Shield)      │
                                                    └──────────────────────┬───────────────────────┘
                                                                           │
                                 ┌─────────────────────────────────────────┴─────────────────────────────────────────┐
                                 │                                                                                    │
                                 ▼                                                                                    ▼
                  [ PATTERN A: 2-WAY INTERACTIVE ]                                                     [ PATTERN B: 1-WAY AIR-GAPPED ]
                  Cloudflare Access (SSO / IdP / MFA)                                                  Edge Token / IP Allowlist / CDN Cache
                                 │                                                                                    │
                 ┌───────────────┴───────────────┐                                                    ┌───────────────┴───────────────┐
                 ▼                               ▼                                                    ▼                               ▼
     ┌───────────────────────┐       ┌───────────────────────┐                            ┌───────────────────────┐       ┌───────────────────────┐
     │       /NOCDesk        │       │       /SREDesk        │                            │      /wallboard       │       │        /kiosk         │
     │  2-Way NOC Command    │       │  2-Way SRE / DBA      │                            │  1-Way Passive Wall   │       │  1-Way Topology Map   │
     │  Replica of /dashboard│       │  Console of /matrix   │                            │  Fluid Zero-Scroll    │       │  Lobby Kiosk Display  │
     └───────────────────────┘       └───────────────────────┘                            └───────────────────────┘       └───────────────────────┘
```

---

## 2. The 4 Outside-VPC Displays: Component Breakdown & Invariants

```
┌────────────────────┬───────────┬───────────────────────────────┬─────────────────────────────────┐
│ Operational Hub    │ Mode      │ In-VPC Projection Source      │ Target Audience                 │
├────────────────────┼───────────┼───────────────────────────────┼─────────────────────────────────┤
│ 1. /NOCDesk        │ 2-Way     │ Exact Replica of /dashboard   │ 24x7 NOC Operators & Commanders │
│ 2. /SREDesk        │ 2-Way     │ Specialized Console of /matrix│ DBAs, SREs, Network, SecOps     │
│ 3. /wallboard      │ 1-Way     │ Fluid Matrix of /matrix       │ Operations Center TV Walls      │
│ 4. /kiosk          │ 1-Way     │ Topology Map of /dashboard    │ Lobbies & Overhead Kiosks       │
└────────────────────┴───────────┴───────────────────────────────┴─────────────────────────────────┘
```

### Display 1: `/NOCDesk` — 2-Way Interactive NOC Command Center
* **Projection Source:** Exact replica of the in-VPC `/dashboard`.
* **Communication Model:** **Bidirectional (2-Way Interactive)**.
* **Component Inventory:**
  1. **Interactive Multi-VPC Topology Map:** Full SVG visualization of AWS Production (`vpc-aws-prod-01`), AWS Staging (`vpc-aws-stage-02`), GCP Analytics (`vpc-gcp-anal-03`), and Chicago Datacenter (`dc-onprem-core-01`).
  2. **Live SSE Telemetry Stream:** Continuous 1-second Server-Sent Events stream updating node states, packet rates, and network drops without polling.
  3. **Cluster Census Table:** Real-time status of all 71 monitored nodes across physical bare-metal, virtualized hypervisors, and cloud instances.
  4. **Granular Subnet & Load Balancer Inspection:** Dedicated alarm tags indicating impacted subnets (e.g. `private-db-1b`) and degraded load balancers (e.g. `prod-internal-nlb`).
  5. **Disaster Simulation Triggers:** In-browser scenario toggles for P1 Critical, P2 Warning, and Multi-Cascade drills.
  6. **`Reset to Nominal (Healthy)` Global Action:** Allows NOC commanders to acknowledge and clear cluster alarms with a single click, transmitting an authenticated POST signal back to the in-VPC daemon (`/v1/telemetry/simulation`).
* **Target Path:** `http://127.0.0.1:8000/NOCDesk` (routed via tunnel to `https://noc.yourcompany.com/NOCDesk`).
* **Access Control:** Cloudflare Access (IdP Group: `NOC-Engineers` + FIDO2 / WebAuthn MFA).

---

### Display 2: `/SREDesk` — 2-Way Specialized Engineering & DBA Console
* **Projection Source:** Specialized operational console derived from `/matrix`.
* **Communication Model:** **Bidirectional (2-Way Interactive)**.
* **Component Inventory:**
  1. **7-Tier Full-Stack Operational Health Matrix:** Real-time visibility into all 7 layers:
     - Tier 1: Physical Datacenter (Bare Metal, DCIM, SAN)
     - Tier 2: Networking (Core Spines, BGP, Optics, Leaf Switches)
     - Tier 3: Cloud & VPC (VPC Flow Logs, Subnets, Gateways, Load Balancers)
     - Tier 4: Compute & Hypervisors (Kubernetes, KVM, Pods, Runtimes)
     - Tier 5: Middleware & Databases (PostgreSQL, Redis, Kafka, Replication)
     - Tier 6: Application Logic (APM Traces, REST APIs, Microservices)
     - Tier 7: Governance & SIEM (Audit Logs, OPA Invariants, SOC 2 Proofs)
  2. **High-Priority Incident & Operational Triage Board:** Real-time incident list prioritized by severity (`P1 > P2 > P3 > P4`) with exact invariant breach rules (e.g. `INV-05 Database Transaction Lock Duration`).
  3. **Deep Node Diagnostics Table:** Detailed inventory of failing or suspect nodes:
     - `HostName & Node ID`: e.g. `node-vpc-db-01` (`ip-10-100-20-44.ec2.internal`)
     - `Private IP Address`: e.g. `10.100.20.44`
     - `Role / Workload`: e.g. `PostgreSQL Master Database`
     - `Network & Subnet CIDR`: e.g. `vpc-aws-prod-01` &bull; `private-db-1b (10.100.20.0/24)`
     - `Operating System & Kernel`: e.g. `Amazon Linux 2023 (Linux 6.1.72-96.166.amzn2023.x86_64)`
     - `Software Stacks`: e.g. `PostgreSQL 16.2, PgBouncer 1.22, eBPF Observer`
     - `Direct Observability Deep-Links`: Instant 1-click links to in-VPC `/logs?node_id=...` and `/traces?node_id=...`
  4. **Bidirectional Reset & Invariant Calibration:** Allows engineers to acknowledge root-cause clearing and calibrate alert thresholds directly from the outside console.
* **Target Path:** `http://127.0.0.1:8000/SREDesk` (routed via tunnel to `https://sre.yourcompany.com/SREDesk`).
* **Access Control:** Cloudflare Access (IdP Group: `SRE-DBA-Core` + Hardware MFA).

---

### Display 3: `/wallboard` — 1-Way Fluid Operations Center Projection
* **Projection Source:** Fluid 1-way out-VPC projection of `/matrix`.
* **Communication Model:** **Unidirectional (1-Way Passive Wallboard)**.
* **Component Inventory:**
  1. **Fluid Zero-Scroll Layout (`100vw × 100vh`):** Engineered specifically for 1080p, 1440p, and 4K wall-mounted TV monitors with `overflow: hidden;` to eliminate vertical and horizontal page scrollbars under all incident conditions.
  2. **Glance Health Banner:** Prominent high-contrast status banner displaying `ALL 7 TIERS FULLY OPERATIONAL` (in green) or active incident alerts with pulsating red/amber borders during outages.
  3. **7-Tier Small Surface Area Strip:** Compact 60px horizontal strip showing live KPI metrics (CPU %, Packet Drops %, Pod Health %, DB Connections, Latency p50, SIEM Compliance) across all 7 infrastructure tiers.
  4. **Side-by-Side Main Split (2-Column Grid):**
     - **Left Column:** High-Priority Incident Triage Board with self-contained overflow scrolling, impacted subnets, and load balancers.
     - **Right Column:** Architectural Alert & Triage Engine Blueprint featuring the centered dispatch root node, stepped bus wiring, and a 3×2 grid of 6 alert hubs (ITSM, ChatOps, On-Call Paging, Out-of-Band & Voice, Event Store & MQ, Wallboards & Sinks).
  5. **Compatibility Strip:** Continuous verification of monitored subnets (`public-1a`, `private-app-1a`, `private-db-1b`, `bare-metal-kvm-racks`) and load balancers (`prod-public-alb`, `prod-internal-nlb`, `internal-haproxy-vrrp`).
  6. **Self-Healing Reconnect Loop:** Automatically re-establishes streaming connection if local network drops occur, requiring zero manual keyboard or mouse intervention.
* **Target Path:** `http://127.0.0.1:8000/wallboard` (routed via tunnel to `https://wallboard.yourcompany.com/wallboard`).
* **Access Control:** Edge Token, IP Allowlist, or Read-Only Cloudflare Edge Access rule.

---

### Display 4: `/kiosk` — 1-Way Air-Gapped Multi-VPC Topology Kiosk
* **Projection Source:** Standalone topology kiosk of `/dashboard`.
* **Communication Model:** **Unidirectional (1-Way Air-Gapped)**.
* **Component Inventory:**
  1. **Animated Multi-VPC Topology Visualizer:** High-level topology diagram of cross-cloud VPC clusters with live health pulses.
  2. **1.14 KB Sanitized Pulse Consumption:** Fetches state exclusively from the lightweight sanitized endpoint (`/v1/telemetry/topology-pulse`).
  3. **Zero Sensitive Data Exposure:** Emits no database credentials, raw log lines, internal routing tables, or customer data. Safe for public reception areas.
  4. **Pure Client-Side Rendering:** Uses lightweight browser SVG rendering with sub-1% CPU consumption on low-power display appliances (Raspberry Pi, Intel NUC, Smart TV browser).
* **Target Path:** `http://127.0.0.1:8000/kiosk` (routed via tunnel to `https://kiosk.yourcompany.com/kiosk`).
* **Access Control:** Public Edge CDN or Read-Only Kiosk Token.

---

## 3. Why Outside the VPC & Why Cloudflare Zero Trust Tunnels?

### Technical & Security Rationale

1. **Perimeter Ingress Elimination (Zero Open Inbound Ports):**
   - Traditional reverse proxies (NGINX, HAProxy, AWS ALB) require allocating public IPs and opening ports 80/443 in VPC Security Groups (`0.0.0.0/0:80` and `0.0.0.0/0:443`).
   - Cloudflare Tunnel (`cloudflared`) makes **outbound-only connections** to Cloudflare Edge over UDP 7844 (QUIC) or TCP 443 (TLS 1.3).
   - Inbound firewall rules remain strictly set to **DENY ALL**. External port scanners (Shodan, Censys) see a completely dark IP address.

2. **Why Client VPNs Fail on Wallboards and Kiosks:**
   - VPN software (OpenVPN, WireGuard, Cisco AnyConnect) on physical TV wall controllers frequently drops on sleep, network re-keying, or DHCP renewal.
   - VPN profiles expire and require interactive password/MFA prompts, breaking 24x7 unattended operation at 3:00 AM.
   - Granting VPN access to a lobby kiosk mini-PC creates an unacceptable lateral movement vector into the internal VPC network.

3. **Edge-Terminated Identity & Access Management (Cloudflare Access):**
   - Ingress requests for 2-way consoles (`/NOCDesk` and `/SREDesk`) terminate at the Cloudflare Edge before traffic enters the tunnel.
   - Authentication is validated against your corporate Identity Provider (Okta, Microsoft Entra ID, Google Workspace) with mandatory hardware MFA.
   - Unauthenticated requests are dropped at the edge; zero unauthenticated packets ever touch the in-VPC daemon.

4. **Zero Billable Cloud Network Egress:**
   - Streaming raw metrics or logs to external SaaS platforms across AWS NAT Gateways incurs high hourly and bandwidth charges ($0.045/GB NAT + $0.09/GB egress).
   - Cloudflare Zero Trust Tunnels provide unmetered data transfer, and `<dcouplr/>` evaluates invariants inside VPC volatile memory, keeping WAN egress strictly at zero billable bytes.

---

## 4. Automated 1-Command Turnkey Installers

`<dcouplr/>` includes production-ready automated deployment scripts for both Linux and Windows environments that provision the complete Outside-VPC Hubs tunnel architecture in under 60 seconds.

### Linux Automated Deployment (Bash)
Execute directly on the in-VPC `<dcouplr/>` controller host:

```bash
curl -sSL http://127.0.0.1:8000/install-outside-vpc-hubs.sh | sudo bash -s -- \
  --token "<YOUR-CLOUDFLARE-TUNNEL-TOKEN>" \
  --domain "noc.yourcompany.com"
```

#### Available Command-Line Arguments:
| Flag | Description | Default |
| :--- | :--- | :--- |
| `--token`, `-t` | Cloudflare Tunnel Secret Token | `""` (Prompts interactively if omitted) |
| `--domain`, `-d` | Base domain name for hub endpoints | `noc.yourcompany.com` |
| `--port`, `-p` | Local `<dcouplr/>` API port | `8000` |
| `--help`, `-h` | Display help message and exit | — |

#### Automated Actions Performed by Linux Installer:
1. Detects OS package manager (`apt`, `dnf`, `yum`, or `apk`) and system architecture (`amd64`, `arm64`).
2. Installs verified `cloudflared` binary from official repositories.
3. Generates `/etc/cloudflared/config.yml` with path routing for all 4 hubs.
4. Generates and registers `/etc/systemd/system/dcouplr-hubs-tunnel.service`.
5. Enables and starts the systemd unit (`systemctl enable --now dcouplr-hubs-tunnel`).
6. Runs local pre-flight checks against `http://127.0.0.1:8000/v1/hubs/status`.

---

### Windows Server Automated Deployment (PowerShell)
Open an elevated PowerShell prompt (**Run as Administrator**) and execute:

```powershell
& ([scriptblock]::Create((irm http://127.0.0.1:8000/install-outside-vpc-hubs.ps1))) `
  -TunnelToken "<YOUR-CLOUDFLARE-TUNNEL-TOKEN>" `
  -Domain "noc.yourcompany.com" `
  -InstallService $true
```

#### Available Parameters:
| Parameter | Type | Description | Default |
| :--- | :--- | :--- | :--- |
| `-TunnelToken` | String | Cloudflare Tunnel Secret Token | `""` |
| `-Domain` | String | Base domain name for hub endpoints | `noc.yourcompany.com` |
| `-LocalPort` | Integer | Local `<dcouplr/>` API port | `8000` |
| `-InstallService` | Switch | Register as a Windows Service | `$true` |

#### Automated Actions Performed by Windows Installer:
1. Verifies elevated Administrator privileges.
2. Creates installation directories: `C:\Program Files\dcouplr\hubs\` and `C:\Program Files\cloudflared\`.
3. Downloads the official `cloudflared-windows-amd64.exe` binary.
4. Adds the installation directory to the Machine `PATH` environment variable.
5. Generates `config.yml` with path matching for `/NOCDesk`, `/SREDesk`, `/wallboard`, and `/kiosk`.
6. Registers and starts `cloudflared` as a native Windows Service with automatic restart recovery.

---

### Offline / Air-Gapped Package Execution
For air-gapped environments where direct internet access is restricted on the in-VPC controller:

1. Download the enterprise tarball on a connected machine:
   ```bash
   curl -sSL -O http://<controller-ip>:8000/dcouplr-enterprise-v1.0.0.tar.gz
   ```
2. Verify integrity against `SHA256SUMS`:
   ```bash
   sha256sum -c <(grep dcouplr-enterprise-v1.0.0.tar.gz SHA256SUMS)
   ```
3. Transfer the tarball via approved jump host to the target in-VPC node.
4. Extract and run the installer offline:
   ```bash
   tar -xzf dcouplr-enterprise-v1.0.0.tar.gz
   cd dcouplr-enterprise/
   sudo ./install-outside-vpc-hubs.sh --token "<TOKEN>" --domain "noc.yourcompany.com"
   ```

---

## 5. Step-by-Step Manual Implementation Guide

If your infrastructure enforces manual change control, Ansible playbooks, or Terraform automation, follow these sequential steps:

### Step 1: Create the Tunnel in Cloudflare Zero Trust
1. Log in to the [Cloudflare One Dashboard](https://one.dash.cloudflare.com/).
2. Navigate to **Networks** &rarr; **Tunnels** &rarr; **Create a Tunnel**.
3. Choose **Cloudflare Tunnel (cloudflared)** &rarr; Name the tunnel: `dcouplr-outside-vpc-hubs`.
4. Copy the generated Tunnel Token (a base64 string starting with `eyJ...`).

Alternatively, create the tunnel using the `cloudflared` CLI on an authorized workstation:
```bash
cloudflared tunnel login
cloudflared tunnel create dcouplr-outside-vpc-hubs
```

---

### Step 2: Install the `cloudflared` Binary
#### On Ubuntu / Debian:
```bash
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared bookworm main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt-get update && sudo apt-get install -y cloudflared
```

#### On RHEL 8/9, Rocky Linux, or Amazon Linux 2023:
```bash
sudo dnf install -y https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-x86_64.rpm
```

#### On Windows Server:
```powershell
$cfPath = "C:\Program Files\cloudflared"
New-Item -ItemType Directory -Force -Path $cfPath
Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "$cfPath\cloudflared.exe"
```

---

### Step 3: Multi-Ingress Configuration (`config.yml`)
Create the configuration file at `/etc/cloudflared/config.yml` (Linux) or `C:\Program Files\cloudflared\config.yml` (Windows):

```yaml
# ==============================================================================
# <dcouplr/> Outside-VPC Hubs: Cloudflare Tunnel Multi-Ingress Configuration
# ==============================================================================
tunnel: <YOUR-TUNNEL-UUID-OR-TOKEN>
credentials-file: /etc/cloudflared/<YOUR-TUNNEL-UUID>.json

ingress:
  # 1. NOC Desk (2-Way Interactive Command Center)
  - hostname: noc.yourcompany.com
    path: ^/NOCDesk.*
    service: http://127.0.0.1:8000
    originRequest:
      connectTimeout: 5s
      noTLSVerify: true

  # 2. SRE Desk (2-Way Specialized Engineering & DBA Console)
  - hostname: noc.yourcompany.com
    path: ^/SREDesk.*
    service: http://127.0.0.1:8000
    originRequest:
      connectTimeout: 5s
      noTLSVerify: true

  # 3. 7-Tier Wallboard (1-Way Fluid Matrix Display)
  - hostname: noc.yourcompany.com
    path: ^/wallboard.*
    service: http://127.0.0.1:8000
    originRequest:
      connectTimeout: 5s
      noTLSVerify: true

  # 4. Multi-VPC Kiosk (1-Way Air-Gapped Kiosk)
  - hostname: noc.yourcompany.com
    path: ^/kiosk.*
    service: http://127.0.0.1:8000
    originRequest:
      connectTimeout: 5s
      noTLSVerify: true

  # Static Assets & API Routes required by Hub Frontends
  - hostname: noc.yourcompany.com
    path: ^/(static|v1)/.*
    service: http://127.0.0.1:8000
    originRequest:
      connectTimeout: 5s
      noTLSVerify: true

  # Fallback rule for base domain
  - hostname: noc.yourcompany.com
    service: http://127.0.0.1:8000

  # Catch-all rule (Mandatory for Cloudflare Tunnel ingress)
  - service: http_status:404
```

---

### Step 4: Systemd Service Unit Installation (Linux)
Create `/etc/systemd/system/dcouplr-hubs-tunnel.service`:

```ini
[Unit]
Description=<dcouplr/> Outside-VPC Hubs Cloudflare Zero Trust Ingress Tunnel
Documentation=https://github.com/varinull/dcouplr
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=notify
TimeoutStartSec=0
Restart=always
RestartSec=5s
ExecStart=/usr/local/bin/cloudflared --config /etc/cloudflared/config.yml run
NonBlocking=true

# Security Hardening Directives
ProtectSystem=full
ProtectHome=true
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Reload and start the systemd daemon:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now dcouplr-hubs-tunnel.service
sudo systemctl status dcouplr-hubs-tunnel.service
```

---

### Step 5: Windows Service Registration (Windows Server)
Run in an administrative PowerShell prompt:

```powershell
& "C:\Program Files\cloudflared\cloudflared.exe" service install
Start-Service "cloudflared"
Get-Service "cloudflared"
```

---

### Step 6: Docker Compose Alternative Deployment
For environments utilizing containerized runtimes:

```yaml
version: "3.8"

services:
  dcouplr-core:
    image: dcouplr/controller:latest
    container_name: dcouplr-core
    restart: unless-stopped
    ports:
      - "127.0.0.1:8000:8000"
    environment:
      - DCOUPLR_ENV=production
      - DCOUPLR_PORT=8000

  cloudflared-tunnel:
    image: cloudflare/cloudflared:latest
    container_name: dcouplr-tunnel
    restart: unless-stopped
    network_mode: "host"
    command: tunnel --no-autoupdate run --token ${CLOUDFLARE_TUNNEL_TOKEN}
    depends_on:
      - dcouplr-core
```

---

## 6. Ingress Routing & Path Matching Rules

When configuring DNS and routing rules, use the following mapping structure:

```
https://<domain>/NOCDesk    ──► Local: http://127.0.0.1:8000/NOCDesk    (2-Way NOC Command Console)
https://<domain>/SREDesk    ──► Local: http://127.0.0.1:8000/SREDesk    (2-Way Specialized SRE Console)
https://<domain>/wallboard  ──► Local: http://127.0.0.1:8000/wallboard  (1-Way Fluid Matrix Wallboard)
https://<domain>/kiosk      ──► Local: http://127.0.0.1:8000/kiosk      (1-Way Topology Kiosk)
https://<domain>/static/*   ──► Local: http://127.0.0.1:8000/static/*   (CSS, JS, Fonts, Icons)
https://<domain>/v1/*       ──► Local: http://127.0.0.1:8000/v1/*       (SSE Stream & Telemetry APIs)
```

---

## 7. Operational Verification & Testing Commands

Execute these verification commands to validate end-to-end functionality:

```bash
# 1. Verify Local In-VPC Controller Health
curl -sI http://127.0.0.1:8000/v1/hubs/status | head -n 1
# Expected output: HTTP/1.1 200 OK

# 2. Inspect Tunnel Process Status on Linux Host
sudo systemctl is-active dcouplr-hubs-tunnel.service
# Expected output: active

# 3. Verify Live Tunnel Connections to Cloudflare Edge
sudo journalctl -u dcouplr-hubs-tunnel.service -n 20 --no-pager | grep "Registered tunnel connection"
# Expected: 4 active connections over QUIC to Cloudflare Edge

# 4. Test External Resolution from Outside the VPC
curl -sI https://noc.yourcompany.com/NOCDesk | head -n 1
# Expected: HTTP/2 200 (or HTTP/2 302 redirecting to Cloudflare Access login)

# 5. Verify 1.14 KB Topology Pulse JSON Exporter
curl -s http://127.0.0.1:8000/v1/telemetry/topology-pulse | jq -r .cluster.status
# Expected: "HEALTHY" (or "CRITICAL" / "WARNING" if an incident is active)

# 6. Verify Server-Sent Events (SSE) Stream Connectivity
curl -N -H "Accept: text/event-stream" http://127.0.0.1:8000/v1/telemetry/stream | head -n 5
# Expected: event stream with periodic data: payloads
```

---

## 8. Operational Troubleshooting & Runbook Actions

| Symptom | Root Cause | Engineering Remediation Step |
| :--- | :--- | :--- |
| **`502 Bad Gateway` at Cloudflare Edge** | Local `<dcouplr/>` daemon on port 8000 is stopped or listening on incorrect interface. | 1. Test local port: `curl http://127.0.0.1:8000/health`.<br>2. Check `<dcouplr/>` service: `systemctl status dcouplr`.<br>3. Verify binding in `netstat -tlpn \| grep 8000`. |
| **Tunnel Service Fails to Start (`Exit Code 1`)** | Tunnel token is invalid, expired, or DNS route is misconfigured. | 1. Inspect logs: `journalctl -u dcouplr-hubs-tunnel.service -n 50`.<br>2. Verify tunnel exists: `cloudflared tunnel list`.<br>3. Check token validity in Cloudflare Zero Trust Dashboard. |
| **SSE Stream Disconnects on `/NOCDesk` or `/wallboard`** | Cloudflare Edge proxy buffer timeout or intermediate corporate proxy drop. | 1. Ensure `originRequest.connectTimeout: 5s` and `noTLSVerify: true` are set in `config.yml`.<br>2. Cloudflare Tunnel handles HTTP/2 and HTTP/3 multiplexing natively; verify client browser supports modern HTTP/2 streams. |
| **`404 Not Found` when loading CSS/JS assets** | Ingress rules in `config.yml` lack static asset path routing. | 1. Verify `path: ^/(static\|v1)/.*` is present in `/etc/cloudflared/config.yml`.<br>2. Ensure the catch-all `http_status:404` rule is placed **last** in the ingress list. |
| **SSO Login Redirect Loop on `/NOCDesk`** | Cloudflare Access session cookie mismatch or domain mismatch. | 1. Clear browser cookies for `*.yourcompany.com`.<br>2. Confirm the user's email domain matches the IdP configuration in Cloudflare Zero Trust. |
| **Display Freezes on Physical TV Monitor** | TV browser memory leak or power management sleep event. | 1. The `/wallboard` frontend has built-in auto-recovery and memory cycle safeguards.<br>2. For dedicated kiosk appliances, enable a daily reboot cron (`0 4 * * * /sbin/reboot`). |

---

## 9. Quick-Reference Deployment Cheat Sheet

```bash
# ------------------------------------------------------------------------------
# LINUX 1-COMMAND DEPLOYMENT
# ------------------------------------------------------------------------------
curl -sSL http://127.0.0.1:8000/install-outside-vpc-hubs.sh | sudo bash -s -- \
  --token "<YOUR-TOKEN>" --domain "noc.yourcompany.com"

# ------------------------------------------------------------------------------
# WINDOWS 1-COMMAND DEPLOYMENT
# ------------------------------------------------------------------------------
& ([scriptblock]::Create((irm http://127.0.0.1:8000/install-outside-vpc-hubs.ps1))) `
  -TunnelToken "<YOUR-TOKEN>" -Domain "noc.yourcompany.com" -InstallService $true

# ------------------------------------------------------------------------------
# SERVICE LIFECYCLE COMMANDS (LINUX)
# ------------------------------------------------------------------------------
sudo systemctl restart dcouplr-hubs-tunnel.service
sudo systemctl stop dcouplr-hubs-tunnel.service
sudo journalctl -u dcouplr-hubs-tunnel.service -f
```
