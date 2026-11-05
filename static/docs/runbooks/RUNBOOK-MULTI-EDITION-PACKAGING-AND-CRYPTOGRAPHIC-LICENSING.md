# 📦 `<dcouplr/>` Multi-Edition Packaging & Cryptographic License Distribution Runbook

**Document ID:** `RUNBOOK-DCL-PKG-LIC-001`  
**Classification:** Enterprise Operational Architecture & Commercial Distribution Runbook  
**Target Audience:** Enterprise Solutions Architects, Distribution Engineering, Lead SREs, Customer Operations  
**Effective Date:** November 2026  
**Status:** **Active / Production-Grade & Air-Gap Certified**  

---

## 1. Executive Summary & Distribution Architecture

`<dcouplr/>` employs a **Self-Contained Cryptographic Licensing & Packaging Architecture** designed to control distribution across sovereign enterprise, air-gapped, and open-core environments with **strictly zero wide-area network (zero-WAN) data egress ($0.00)**.

The software is packaged into **four distinct distributable editions**:
* **Two Free Community Editions** (serving the dual-database architecture: Suite A Simulation vs. Suite B Day-0 Blank Slate).
* **Two Paid Commercial Editions** (serving mid-market clusters and sovereign defense/finance enterprises).

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 <dcouplr/> 4-EDITION DISTRIBUTION MATRIX                               │
├───────────────────────┬──────────────┬──────────────┬──────────────┬──────────────────┬────────────────┤
│ Package Name          │ Edition Type │ Target Suite │ Pre-set Mode │ Node Capacity    │ Commercial Fee │
├───────────────────────┼──────────────┼──────────────┼──────────────┼──────────────────┼────────────────┤
│ Free Simulation Suite │ Free         │ Suite A      │ demo         │ 75 Mock Nodes    │ $0.00 (Free)   │
│ Free Community Starter│ Free         │ Suite B      │ production   │ 10 Live Nodes    │ $0.00 (Free)   │
│ Cluster Pro Commercial│ Paid         │ Enterprise   │ production   │ 50 Live Nodes    │ $1,500 / month │
│ Enterprise Sovereign  │ Paid         │ Air-Gap      │ production   │ Unlimited (100k+)│ Custom Contract│
└───────────────────────┴──────────────┴──────────────┴──────────────┴──────────────────┴────────────────┤
```

Each package is compiled into standalone `.tar.gz` and `.zip` archives incorporating:
1. **Pre-Embedded License Credentials:** `LICENSE.key` (structured key) and `license.json` (HMAC-SHA256 signed JWT token).
2. **Deterministic Database Profile Anchoring:** `active_db_profile.json` (`demo` vs `production`).
3. **Turnkey Air-Gap Installers:** `install.sh` (Linux/macOS) and `install.ps1` (Windows PowerShell).
4. **Hardware Seat Lease Registration:** Binds to local non-volatile host identifiers (`MachineGuid` / `/etc/machine-id`) without exfiltration.
5. **Cryptographic Checksum Manifest:** `SHA256SUMS` and `SHA256SUMS.sig`.

---

## 2. The Four Packaged Editions in Detail

### 2.1 Package 1: Free Simulation Suite (Suite A)
* **Archive Artifacts:**
  * `dist/packages/dcouplr-v1.0.0-free-simulation-suite.tar.gz` (1.42 MB)
  * `dist/packages/dcouplr-v1.0.0-free-simulation-suite.zip` (1.49 MB)
* **Target Audience:** Pre-sales evaluations, architecture testing, university labs, SRE sandbox drills.
* **Pre-Seeded Profile:** `demo` (75 simulated nodes, 5 VPCs, chaos traffic injection, mock microservices).
* **Incorporated License Key:** `DCL-FREE-SIM-COMMUNITY-SANDBO-6A22312DA`
* **Entitlement Limits:** 75 nodes, evaluation SLA, perpetual sandbox validity.

### 2.2 Package 2: Free Community Starter (Suite B)
* **Archive Artifacts:**
  * `dist/packages/dcouplr-v1.0.0-free-community-starter.tar.gz` (4.32 MB)
  * `dist/packages/dcouplr-v1.0.0-free-community-starter.zip` (4.39 MB)
* **Target Audience:** Small engineering teams, single VPC deployments, Kubernetes edge clusters.
* **Pre-Seeded Profile:** `production` (Day-0 Blank Slate, 0 unverified nodes, clean topological slate).
* **Authoritative Reference Matrix:** Pre-seeded with the authoritative 127 monitoring matrix invariants across 7 tiers.
* **Incorporated License Key:** `DCL-FREE-DAY0-COMMUNITY-PRODUC-E62E34FB1`
* **Entitlement Limits:** 10 nodes included ($0), community GitHub support, perpetual open-core license.

### 2.3 Package 3: Cluster Pro Commercial (Paid)
* **Archive Artifacts:**
  * `dist/packages/dcouplr-v1.0.0-paid-cluster-pro.tar.gz` (13.00 MB)
  * `dist/packages/dcouplr-v1.0.0-paid-cluster-pro.zip` (13.07 MB)
* **Target Audience:** Mid-market production workloads, multi-VPC clusters, commercial compliance.
* **Pre-Seeded Profile:** `production` (Day-0 Blank Slate).
* **Included Premium Features:**
  * SQLCipher 4.x transparent database encryption at rest (`_smart_connect` with `PRAGMA key`).
  * Automated zero-downtime hot database backups (`VACUUM INTO ?` with SHA-256 attestation).
  * Outside-VPC Hub Integration (Wallboard, Kiosk, NOCDesk, SREDesk via Cloudflare Tunnels).
* **Incorporated License Key:** `DCL-CLUS-SM-COMMERCIAL-PRO-E-DA86FCB2B`
* **Entitlement Limits:** 50 nodes included (+ $60/node overage), Priority 4-Hour SLA support bridge.

### 2.4 Package 4: Enterprise Sovereign (Air-Gap Unlimited)
* **Archive Artifacts:**
  * `dist/packages/dcouplr-v1.0.0-paid-enterprise-sovereign.tar.gz` (39.06 MB)
  * `dist/packages/dcouplr-v1.0.0-paid-enterprise-sovereign.zip` (39.13 MB)
* **Target Audience:** Defense, aerospace, central banks, healthcare, sovereign government clouds.
* **Pre-Seeded Profile:** `production` (Day-0 Blank Slate).
* **Included Premium Features:**
  * Unlimited node capacity (999,999 nodes).
  * 100% Air-Gapped offline deployment bundle with pre-cached assets.
  * Dual-SBOM (CycloneDX 1.5 JSON + SPDX 2.3 JSON) & In-Toto SLSA Level 3 build provenance.
  * Outside-VPC Unidirectional Pulse Engine (< 2 KB compressed telemetry diode).
  * Instant War-Room SRE SLA (15-Minute Response) with Dedicated Technical Account Manager (TAM).
* **Incorporated License Key:** `DCL-ENT-SOVEREIGN-ENTERP-43B7DB723`
* **Entitlement Limits:** Unlimited, perpetual air-gap contract.

---

## 3. Package Generation & Build Pipeline

The master packaging script automates the deterministic build, license incorporation, checksumming, and compression:

```bash
python scripts/package_commercial_and_free_editions.py
```

### Build Artifact Layout (Inside Each Extracted Package)
```
dcouplr-v1.0.0-<edition>/
├── LICENSE                         # Apache 2.0 or Commercial Enterprise Agreement
├── LICENSE.key                     # Raw structured license key string
├── license.json                    # Cryptographically signed JWT blob & entitlements
├── active_db_profile.json          # Pre-configured profile ("demo" or "production")
├── dcouplr.env                     # Pre-configured 12-factor environment variables
├── install.sh                      # Turnkey Linux/macOS offline installer (chmod +x)
├── install.ps1                     # Turnkey Windows PowerShell installer
├── verify_license.py               # Standalone zero-egress offline license verifier
├── run.sh                          # Instant bash server startup script
├── run.ps1                         # Instant PowerShell server startup script
├── pyproject.toml                  # Python package specifications
├── requirements.txt                # Locked dependencies
├── migration_tools/                # Full application codebase & static web UI
├── scripts/                        # Operational scripts (run_server.py, etc.)
├── docs/                           # Engineer User Manual & architecture runbooks
├── SHA256SUMS                      # Checksum manifest of all files
├── SHA256SUMS.sig                  # Cryptographic signature of checksum manifest
└── RELEASE_NOTES.md                # Edition-specific feature and SLA specification
```

---

## 4. In-Place License Activation & Real-Time Upgrades

Customers running the **Free Community Starter** can upgrade in-place to **Cluster Pro** or **Enterprise Sovereign** without reinstalling the software or interrupting continuous telemetry ingestion:

### Method 1: Portal UI Activation via `/companyadmin`
1. Navigate to `/companyadmin`.
2. Click the **🔑 Licensing & Packages (4 Editions)** tab.
3. In the **Activate Commercial License / In-Place Upgrade** card:
   - Enter Customer Organization Name (e.g. `Acme Financial Corp`).
   - Paste the Commercial License Key (structured `DCL-...` or Base64 JWT token).
4. Click **✨ Activate License**.
5. The portal immediately upgrades the active entitlement badge, expands the node capacity meter, and persists the key to disk with zero downtime.

### Method 2: REST API Activation
```bash
curl -X POST http://localhost:8000/v1/license/activate \
  -H "Content-Type: application/json" \
  -d '{
    "license_key": "DCL-CLUS-SM-ACME-CORP-DA86FCB2B",
    "organization": "Acme Financial Corp"
  }'
```

### Method 3: Cloud-Native Environment Variable (Container / Helm)
```bash
export DCOUPLR_LICENSE_KEY="DCL-CLUS-SM-ACME-CORP-DA86FCB2B"
export DCOUPLR_CUSTOMER_ORG="Acme Financial Corp"
export DCOUPLR_PROFILE="production"
```

---

## 5. REST API Specifications

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/v1/license/current` | Returns active license details, hardware seat lease, and 3-zone quota evaluation. |
| `GET` | `/v1/license/status` | Returns active license entitlements and cluster census. |
| `POST`| `/v1/license/activate` | Activates a new license key or purchases committed overage capacity in-place. |
| `GET` | `/v1/packages/list` | Lists all 4 distribution packages with download URLs, sizes, and incorporated keys. |
| `GET` | `/v1/packages/verify/{id}`| Verifies SHA-256 file integrity and incorporated license key offline for a package. |
| `GET` | `/static/packages/{name}` | Direct static download endpoint for `.tar.gz` and `.zip` archives. |

---

## 6. Verification and Audit

The multi-edition packaging and licensing suite is validated using the automated QA script:
```bash
python scripts/test_packaging_and_licensing_suite.py
```

### Verification Checks:
* **Test 1:** Checksum and archive presence for all 4 `.tar.gz` and 4 `.zip` bundles (100% SHA-256 match).
* **Test 2:** Offline cryptographic validation of all 4 incorporated license keys without internet access.
* **Test 3:** REST API endpoint validation (`/v1/packages/list`, `/v1/packages/verify/{id}`, `/v1/license/current`, `/v1/license/activate`).
* **Test 4:** Headless Chrome CDP UI audit of `/companyadmin?tab=licensing`, ensuring all 4 cards render cleanly with zero console errors. Screenshot saved to [`companyadmin_licensing_packages_tab.png`](file:///C:/Users/JenniferCletaLee/.gemini/antigravity/brain/95792f6e-b2a3-46fa-ab48-b9cfe040172b/companyadmin_licensing_packages_tab.png).
