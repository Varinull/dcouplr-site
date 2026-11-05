# 📘 `<dcouplr/>` Day-0 Post-Purchase & CLI Installation Lifecycle Runbook
**Document ID:** `VA-RUN-DAY0-INSTALL-ADMIN-001`  
**Classification:** Enterprise Operational Architecture & Administrator Onboarding  
**Security Guarantee:** Zero-Cloud-Exfiltration ($0.00 WAN Egress Guaranteed)  
**Target Release:** v1.0.0 GA  
**Canonical Domain:** `https://dcouplr.com`  

---

## Executive Summary

This runbook establishes the authoritative, end-to-end lifecycle following enterprise purchase of `<dcouplr/>`, covering the initial CLI installation, automated Application Administrator credentials provisioning, and Day-0 web component usability.

### Key Architectural Answers:
1. **Is `http://localhost:8000/AdminDesk` one of the few components usable immediately during/after CLI installation?**  
   **YES.** The `<dcouplr/>` distribution is an all-in-one, self-contained, air-gapped appliance binary. The CLI engine, the embedded SQLite Single Source of Truth (SSOT), and the web application desks (`/AdminDesk`, `/companyadmin`, `/DBADesk`, `/dashboard`, `/matrix`, `/compiler`) are bundled directly into the installation package. Before any downstream telemetry agents, worker nodes, or VPC collectors are connected, the Application Administrator boots `dcouplr serve --port 8000` to access `/AdminDesk` for initial license activation, capacity sizing, encryption key generation, and RBAC user provisioning.
2. **When does Application Administrator credential setup occur?**  
   **During the CLI installation itself.** Step 3c of the enterprise installer (`install-enterprise.sh` / `install-enterprise.ps1`) prompts the operator to configure the Application Administrator username and password (or ingests them via `DCOUPLR_ADMIN_USER` and `DCOUPLR_ADMIN_PASSWORD`). The CLI immediately provisions the administrator into the in-VPC SQLite SSOT (`rbac_users` and `system_configuration_ssot`) with full `Obs-Admins` authority before the web server ever starts.

---

## 1. End-to-End Post-Purchase Timeline (Chronological Flow)

```mermaid
flowchart TD
    subgraph Phase1["Phase 1: Purchase & Entitlement Issuance"]
        A[Commercial Subscription / PO Signed] --> B[Ed25519 Cryptographic Token Issued<br/>DCL-CLUS-SM-COMMERCIAL-PRO-E-DA86FCB2B]
        B --> C[Air-Gap Release Bundle / Installer Delivery<br/>install-enterprise.sh / dcouplr-enterprise.tar.gz]
    end

    subgraph Phase2["Phase 2: CLI Installation Execution"]
        C --> D[Run Enterprise Installer<br/>curl -fsSL https://dcouplr.com/install-enterprise.sh | sh]
        D --> E[Step 1: Install Engine Binary to /usr/local/bin/dcouplr]
        E --> F[Step 2: Enter Commercial License Key]
        F --> G[Step 3: Offline Ed25519 Signature Verification<br/>Zero WAN Egress / ~/.dcouplr/license.json]
    end

    subgraph Phase3["Phase 3: Cryptographic & Admin Provisioning"]
        G --> H[Step 3b: Generate Hardware Machine Fingerprint<br/>Provision Hub Transmission Key ~/.dcouplr/hub_transmission.key]
        H --> I[Step 3c: Provision Application Administrator Account<br/>Prompts for Admin User & Pass / dcouplr auth admin-user]
        I --> J[Initialize in-VPC SQLite SSOT Database<br/>Seed rbac_users & system_configuration_ssot]
    end

    subgraph Phase4["Phase 4: Daemon Startup & Day-0 Usability"]
        J --> K[Step 4: Inspect Active Entitlement Status<br/>dcouplr auth status]
        K --> L[Operator Launches In-VPC Daemon<br/>dcouplr serve --port 8000]
        L --> M[Access http://localhost:8000/AdminDesk<br/>Login with Provisioned Admin Credentials]
    end

    Phase1 --> Phase2
    Phase2 --> Phase3
    Phase3 --> Phase4
```

---

## 2. Detailed Lifecycle Walkthrough

### Phase 1: Commercial Purchase & Entitlement Fulfillment
1. **Subscription Options:**
   - **Marketplace:** Subscribed via AWS Marketplace or GCP Cloud Commerce.
   - **Direct Enterprise PO:** Executed Master Services Agreement (MSA) with Varinull Operations.
2. **Entitlement Delivery:**
   - The customer receives an authoritative Ed25519 cryptographic license key (e.g. `DCL-CLUS-SM-COMMERCIAL-PRO-E-DA86FCB2B`).
   - The license key contains self-attesting cryptographic claims: Tier (`Cluster Pro`), Licensed Node Capacity (`50 Nodes`), SLA Level (`Priority Business 4-Hour Response`), and Expiration.
   - Customer receives the offline distribution package or curl-to-shell installer URL.

---

### Phase 2: CLI Installation Execution

#### Linux & macOS Installation:
```bash
# Interactive Mode (Prompts for License Key & Admin Credentials):
curl -fsSL https://dcouplr.com/install-enterprise.sh | sh

# Non-Interactive / Unattended CI/CD Mode:
DCOUPLR_LICENSE_KEY="DCL-CLUS-SM-COMMERCIAL-PRO-E-DA86FCB2B" \
DCOUPLR_ADMIN_USER="companyadmin" \
DCOUPLR_ADMIN_PASSWORD="MySecureAdminPass2026!" \
curl -fsSL https://dcouplr.com/install-enterprise.sh | sh
```

#### Windows (PowerShell) Installation:
```powershell
# Interactive Mode:
irm https://dcouplr.com/install-enterprise.ps1 | iex

# Non-Interactive Mode:
$env:DCOUPLR_LICENSE_KEY="DCL-CLUS-SM-COMMERCIAL-PRO-E-DA86FCB2B"
$env:DCOUPLR_ADMIN_USER="companyadmin"
$env:DCOUPLR_ADMIN_PASSWORD="MySecureAdminPass2026!"
irm https://dcouplr.com/install-enterprise.ps1 | iex
```

---

### Phase 3: Cryptographic & Administrator Account Provisioning

During Step 3c of the installer, the installation script invokes:
```bash
dcouplr auth admin-user \
    --username "${ADMIN_USER:-companyadmin}" \
    --password "${ADMIN_PASS:-comp-admin-2026}" \
    --email "${ADMIN_EMAIL:-companyadmin@enterprise.internal}"
```

#### What Happens Internally:
1. **In-VPC SQLite Database Initialization:**
   - Connects to the local database file (`data/vpc_telemetry.db` / `~/.dcouplr/corp_central_vault.db`).
   - Ensures the authoritative `rbac_users`, `system_configuration_ssot`, and `audit_logs` tables exist with PRAGMA integrity verification.
2. **RBAC Record Insertion (`rbac_users`):**
   - Injects the administrator with `user_id = <username>`, role `Obs-Admins`, team scope `*`, and authentication provider `local_ssot`.
3. **Password Configuration (`system_configuration_ssot`):**
   - Securely stores the administrator's password in the SSOT configuration table (`auth_user_pass_<username>`).
4. **Audit Logging:**
   - Writes an immutable audit trail entry into `audit_logs`:
     `actor_username="cli-installer", action="ADMIN_PROVISIONED", target_resource="rbac_users:<username>"`
5. **Zero-WAN Egress Guarantee:**
   - All credentials and hashes remain strictly inside the local host disk and RAM. Zero bytes are exfiltrated to the internet ($0.00 WAN egress).

---

### Phase 4: Daemon Startup & Immediate Day-0 Access

Once the installer completes, the administrator executes:
```bash
dcouplr serve --port 8000
```
*(Or enables the Linux systemd daemon via `systemctl enable --now dcouplr`)*.

The FastAPI web engine initializes in less than 50 milliseconds, immediately exposing all embedded management consoles.

---

## 3. Day-0 Component Usability Matrix

The following matrix distinguishes between components that are **usable immediately on Day-0** (zero nodes or external agents required) versus components that activate on Day-1/Day-2 once cluster nodes begin reporting telemetry:

| Component / Console URL | Usability Status | Day-0 Purpose & Capabilities | External Ingestion Required? |
| :--- | :--- | :--- | :--- |
| **`http://localhost:8000/AdminDesk`** | **IMMEDIATELY USABLE (Flagship)** | Authoritative 2-Way Enterprise Control Desk. Configure license keys, node census quotas, encryption keys, anti-flap audit trails, and financial reconciliation. | **NO (100% Standalone)** |
| **`http://localhost:8000/companyadmin`** | **IMMEDIATELY USABLE** | In-VPC Company Administrator Console. Local identity management, SQLCipher database encryption rotation, data retention, and backup snapshots. | **NO (100% Standalone)** |
| **`http://localhost:8000/DBADesk`** | **IMMEDIATELY USABLE** | Database Administrator Inspection Console. Fluid zero-egress console, live SQLite PRAGMA storage health, schema explorer, and read-only SQL scratchpad with 403 mutation guardrails. | **NO (100% Standalone)** |
| **`http://localhost:8000/dashboard`** | **IMMEDIATELY USABLE** | SRE Live Observability Dashboard. Renders host ring-buffers, in-memory CPU/RAM gauges, and simulated traffic topologies. | **NO (Pre-seeded with Local Host Metrics)** |
| **`http://localhost:8000/matrix`** | **IMMEDIATELY USABLE** | 7-Tier Full-Stack Invariant Matrix. Interactive verification of 127 architectural invariants across compute, networking, and data tiers. | **NO (Pre-seeded SSOT Rules)** |
| **`http://localhost:8000/compiler`** | **IMMEDIATELY USABLE** | Living AST Migration Compiler Studio. Interactive transpilation of Datadog, CloudWatch, and Terraform HCL into Prometheus rules and OpenTofu. | **NO (Local File & AST Parsing)** |
| **`http://localhost:8000/docs`** | **IMMEDIATELY USABLE** | Self-Hosted Air-Gapped TechDocs. Full architectural whitepapers, patent disclosures, and compliance runbooks. | **NO (Embedded Markdown & Swagger)** |
| **`http://localhost:8000/traces` (APM Flamegraphs)** | *Day-1 / Day-2 Active* | Displays live distributed traces and Jaeger flamegraphs once application microservices emit OpenTelemetry spans to port 4318. | **YES (Requires OTLP Ingestion)** |
| **`http://localhost:8000/logs` (High-Throughput)** | *Day-1 / Day-2 Active* | Displays clustered log error patterns once cluster nodes stream loglines to port 9428 or `/v1/logs`. | **YES (Requires Node Log Stream)** |

---

## 4. Administrator Authentication Verification Protocol

To verify that the provisioned credentials function properly across all entry points:

### 1. Verification via CLI:
```bash
dcouplr auth status
```
*Displays active tier, licensed nodes, hardware fingerprint, and Outside-VPC Hub Transmission Key.*

### 2. Verification via REST API:
```bash
curl -X POST http://localhost:8000/v1/admin/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "username": "companyadmin",
    "passcode": "comp-admin-2026",
    "portal": "companyadmin"
  }'
```
*Expected Response (HTTP 200 OK):*
```json
{
  "status": "authenticated",
  "username": "companyadmin",
  "token": "session_admin_token_2026",
  "role": "Obs-Admins",
  "token_type": "Bearer",
  "expires_in": 86400,
  "two_factor_verified": false
}
```

### 3. Verification via Browser:
1. Open `http://localhost:8000/AdminDesk` or `http://localhost:8000/companyadmin`.
2. Enter the provisioned username (`companyadmin` or your custom user) and password.
3. Upon authentication, the gate unlocks immediately, revealing the full 7-tab control desk.

---

## 5. Security & Air-Gap Attestation

| Security Vector | Implementation Detail | Guarantee |
| :--- | :--- | :--- |
| **Cloud Phone-Home** | Zero outbound HTTP/HTTPS calls made to vendor servers | **$0.00 WAN Egress Guaranteed** |
| **Credential Storage** | Local SQLite SSOT (`vpc_telemetry.db`) protected by OS permissions (0600) | **Zero Cloud Exfiltration** |
| **Cryptographic Attestation** | Ed25519 signature verified in volatile memory | **Tamper-Proof Offline Enforcement** |
| **Mutation Guardrails** | DBA console rejects all `DROP`, `DELETE`, `UPDATE`, `ALTER` with HTTP 403 | **Zero Accidental Data Destruction** |

