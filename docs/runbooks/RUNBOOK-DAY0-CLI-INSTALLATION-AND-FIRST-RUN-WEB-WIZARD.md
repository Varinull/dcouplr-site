# &lt;dcouplr/&gt; Day-0 CLI Installation, Post-Install Usability &amp; First-Run Web Wizard Runbook

**Document Control:** Authoritative Operations Dossier  
**Target Environments:** Enterprise In-VPC (AWS, GCP, Azure, On-Premises Bare Metal, Air-Gapped Sovereign Enclaves)  
**Security Invariant:** Zero External WAN Egress ($0.00) &bull; Complete Sovereign In-VPC Operation  

---

## 1. Is http://localhost:8000/AdminDesk Usable During/After CLI Installation?

**Yes, absolutely.**

When an administrator installs `<dcouplr/>` via the CLI installer, the installation script places the self-contained binary package, Python environment, SQLite SSOT databases, and all bundled static web consoles directly into the local VPC host. Once the daemon is launched (`dcouplr serve --port 8000`, Docker container, or Linux systemd service), **`http://localhost:8000/AdminDesk` is immediately usable on Day 0**.

In fact, the CLI installs a complete sovereign in-VPC console suite that requires **zero external cloud CDNs, zero third-party cloud assets, and zero internet access**:

| Console URL | Persona / Role | Day-0 Purpose &amp; Capabilities |
| :--- | :--- | :--- |
| **`http://localhost:8000/AdminDesk`** | **Application Administrator (`Obs-Admins`)** | **Authoritative central control desk**: user management, RBAC role assignment, corporate SSO identity sync, node licensing toggle ledger, audit logs, and system configuration SSOT. |
| **`http://localhost:8000/companyadmin`** | **Cluster Administrator (`CompanyAdmins`)** | In-VPC cluster administration and sovereign governance console. |
| **`http://localhost:8000/DBADesk`** | **Database Administrator (`Obs-DBA`)** | Sovereign in-VPC SQLite SSOT inspection console with safe read-only SQL scratchpad and auto-backup management. |
| **`http://localhost:8000/dashboard`** | **SRE / DevOps** | Real-time node census, fleet telemetry metrics, and cluster health overview. |
| **`http://localhost:8000/setup`** | **Infrastructure Architect** | In-VPC capabilities sizer, preset profile tuner, and deployment manifest generator. |
| **`http://localhost:8000/wizard`** | **Lead Systems Engineer / IT Director** | Interactive 5-step First-Run Web Installation Wizard for guided browser onboarding. |
| **`http://localhost:8000/docs`** | **All Teams** | Offline, air-gapped runbooks, API references, and architecture dossiers. |

---

## 2. Walkthrough: From Purchase to First Install

Here is the exact chronological journey of an enterprise customer from purchase to running `<dcouplr/>` in production:

```
┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
│  Step 1: Commercial Order │      │  Step 2: CLI Installation │      │ Step 3: Offline License   │
│  & Zero-Knowledge Handoff │ ───► │  (curl / PowerShell Script)│ ───► │ Activation & HW Key Deriv.│
└───────────────────────────┘      └───────────────────────────┘      └───────────────────────────┘
                                                                                    │
                                                                                    ▼
┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
│ Step 6: Production Ops    │      │  Step 5: Daemon Activation│      │ Step 4: Admin Provisioning│
│ (/AdminDesk & Wallboards) │ ◄─── │  & First-Boot Login       │ ◄─── │ (Interactive / Wizard)    │
└───────────────────────────┘      └───────────────────────────┘      └───────────────────────────┘
```

### Step 1: Commercial Order &amp; Zero-Knowledge Handoff
1. The customer sizes their node fleet on the Commercial Pricing Calculator (e.g. 50 nodes &rarr; Cluster Small).
2. Once the commercial agreement is confirmed or payment completes (Stripe/PayPal or enterprise PO invoice), `<dcouplr/>` issues an offline **Ed25519 cryptographic entitlement key** (e.g., `DCL-CLUS-2026-X892A...`).
3. For enterprise security compliance, keys are **never transmitted over plaintext email**; instead, an encrypted one-time SSO connection link is dispatched to the customer's IT administrator.

### Step 2: CLI Engine Installation
The customer executes the one-line sovereign installer on their target VPC Linux/macOS or Windows host:

```bash
# Linux / macOS (Air-Gapped or Connected VPC):
curl -fsSL https://dcouplr.com/install-enterprise.sh | sh

# Windows (PowerShell Administrator):
irm https://dcouplr.com/install-enterprise.ps1 | iex
```

The script deploys:
- The compiled `dcouplr` CLI binary into `/usr/local/bin` (or `%LOCALAPPDATA%\Programs\dcouplr`).
- The Python virtual runtime and FastAPI engine.
- Bundled offline web console assets in `static/` (zero external CDN requests).
- Local SQLite database files in `./data/vpc_telemetry_db.db`.

### Step 3: Offline License Activation &amp; Hardware Key Derivation
1. The installer parses and verifies the Ed25519 entitlement token completely offline with **\$0.00 cloud egress**.
2. It auto-derives the hardware-bound transmission secret key in `~/.dcouplr/hub_transmission.key`, used to cryptographically sign heartbeats across Outside-VPC Hubs without leaking payload telemetry.

### Step 4: Application Administrator Provisioning (Interactive Prompt)
The installer explicitly prompts for administrator credentials:
```text
==> Step 3c of 5: Provisioning Application Administrator Account...
    Select Account Type [1=Organizational User, 2=Local Dedicated Admin]: 1
    Application Administrator Username [default: companyadmin]: jennifer.lee
    Administrator Display Name: Jennifer Lee (Lead Systems Architect)
    Application Administrator Email: jennifer.lee@yourcompany.com
    Application Administrator Password: ****************
    Confirm Password: ****************
    RBAC Role Assigned [default: Obs-Admins]: Obs-Admins
```

**Flexible Identity Selection:**
- **Organizational User**: Links an existing identity from Active Directory / LDAP / Okta (e.g., `jennifer.lee`).
- **Dedicated Local System Administrator**: Creates a standalone system identity (e.g., `companyadmin` or `svc-dcouplr-admin`).

Under the hood, this executes:
```bash
dcouplr auth admin-user --username "jennifer.lee" --role "Obs-Admins" --email "jennifer.lee@yourcompany.com"
```
This writes the user to the in-VPC SQLite SSOT table `rbac_users` with role `Obs-Admins` (Application Administrator) and records an immutable audit log.

### Step 5: Daemon Activation &amp; First Login
The administrator launches the background daemon:
```bash
dcouplr serve --port 8000
```
Visiting `http://localhost:8000/AdminDesk` allows the newly created administrator to immediately log in, configure VPC subnets, and activate monitored nodes.

---

## 3. Interactive First-Run Web Wizard (`/wizard`)

### Purpose &amp; Architecture
While DevOps teams love automated silent installs via Terraform or Ansible (`DCOUPLR_ADMIN_USER=...` and `DCOUPLR_LICENSE_KEY=...`), IT directors, DBAs, and enterprise systems architects prefer a **visual browser-guided First-Run Installation Wizard**.

Accessible at:
- **`http://localhost:8000/wizard`**
- **`http://localhost:8000/setup?mode=first-run`**

### Wizard Step Progression

```
[1. Preflight Checks] ── [2. License Key] ── [3. Admin User] ── [4. Sizing] ── [5. Launch]
```

1. **Step 1: Preflight Environment Checks**
   - Validates in-VPC SQLite storage write permissions.
   - Tests volatile in-memory ring buffer allocation.
   - Verifies zero-WAN egress network isolation boundary ($0.00 invariant).
   - Validates port 8000 daemon socket health.

2. **Step 2: License Key Entitlement &amp; Activation**
   - Input field for Ed25519 offline license key token.
   - One-click evaluation option: "Evaluate Community Core (1 Node Free)".
   - Real-time cryptographic tier recognition (Developer Pro, Cluster Small, Mission-Critical, Sovereign Air-Gap).

3. **Step 3: Provision Authoritative Application Administrator**
   - Selector for Account Type:
     - `(•) Organizational User (Existing LDAP / Okta / Corporate SSO Username)`
     - `( ) Dedicated Local System Administrator (e.g. 'svc-dcouplr-admin')`
   - Inputs: Username, Display Name, Work Email, Password, Confirm Password.
   - Role dropdown: `Obs-Admins (Application Administrator)` [Default] or `CompanyAdmins (Cluster Administrator)`.

4. **Step 4: Fleet Sizing &amp; Telemetry Configuration**
   - Initial Monitored Node Fleet capacity (e.g., 25, 50, 75).
   - Target VPC Subnet / CIDR range (e.g., `10.0.0.0/16`).
   - Telemetry Buffer Mode: In-Memory Ring Buffer + SQLite SSOT.

5. **Step 5: Launch &amp; Database Finalization**
   - Complete configuration review card.
   - Single-click action button: `🚀 Initialize In-VPC Engine & Launch Admin Desk ➔`.
   - Provisions database, sets `wizard_completed = 'true'` in `system_configuration_ssot`, creates session token, and automatically redirects to `http://localhost:8000/AdminDesk`.

---

## 4. First-Boot Redirect Logic

1. **Fresh Installation Detection**:
   - On server startup, if `wizard_completed != 'true'` and zero admin users exist in `rbac_users`, any browser navigation to `http://localhost:8000/AdminDesk` or `http://localhost:8000/setup` automatically redirects to `http://localhost:8000/wizard`.
2. **Bypass / Headless Override**:
   - Passing `?bypass_wizard=1` or having pre-configured admin accounts (via environment variables `DCOUPLR_ADMIN_USER` and `DCOUPLR_ADMIN_PASSWORD`) bypasses the redirect, ensuring silent CI/CD automation is never interrupted.
3. **Replay Capability**:
   - Calling `POST /v1/wizard/reset` or visiting `/wizard` directly allows administrators to re-run the wizard or inspect Day-0 provisioning settings at any time.

