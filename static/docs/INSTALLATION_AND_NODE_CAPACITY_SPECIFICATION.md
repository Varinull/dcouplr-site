# 📦 `<dcouplr/>` Installation, Licensing & Node Capacity Specification
**Document ID:** `VA-DOC-INSTALL-NODE-CAPACITY-001`  
**Classification:** Enterprise Architecture, Distribution & Entitlement Specification  
**Security Guarantee:** Zero-Egress In-VPC Offline Evaluation ($0 Network Egress Guaranteed)  
**Release Target:** v1.0.0 GA  
**Canonical Domain:** `https://dcouplr.com`  

---

## 📑 1. Architectural Philosophy: The Zero-Egress License Boundary

Most SaaS infrastructure products enforce licensing by having agents or compilers phone home to a centralized cloud licensing server (`https://license.vendor.com/verify`) on every invocation, reporting internal IP addresses, hostnames, and MAC addresses.

In `<dcouplr/>`, **phone-home network egress is strictly prohibited**:
1. Customers choose `<dcouplr/>` specifically to guarantee that infrastructure code (Terraform HCL, CloudWatch alarms, Datadog monitors, and network CIDRs) never leaves the customer's private VPC.
2. In air-gapped banking enclaves and defense networks, outbound WAN access is physically blocked at the firewall.
3. Therefore, `<dcouplr/>` uses a **unified binary engine** where licensing, installation binding, and node quotas are verified **100% offline inside volatile memory (RAM)** using deterministic Ed25519 cryptographic tokens and AST entity counting.

---

## 2. 🐧 Free Community Core Installation & Gating

### Installation Commands
The Free Community Core is distributed with static, zero-dependency installers:

* **Linux & macOS (POSIX Shell):**
  ```bash
  curl -fsSL https://dcouplr.com/install.sh | sh && dcouplr doctor
  ```
* **Windows (PowerShell):**
  ```powershell
  irm https://dcouplr.com/install.ps1 | iex
  ```

### What is Installed
* Installs the native `<dcouplr/>` CLI engine into `/usr/local/bin/dcouplr` (or `$env:LOCALAPPDATA\Programs\dcouplr`).
* Automatically initializes the default offline license configuration at `~/.dcouplr/license.json` pointing to `Community Core (Free Tier)`.

### How 1 Node is Determined & Enforced
In Community Core, **1 Node** is strictly defined as:
> **The single local workstation or execution agent where the CLI is running (`localhost` / `127.0.0.1` / local host PID).**

The free tier enforces this 1-node boundary through four independent mechanisms:
1. **System Preflight Diagnostics (`dcouplr doctor` Check 7):**
   Explicitly verifies that the execution context is bound to `127.0.0.1`:
   `Strict 1-Node Local Boundary (<hostname>: 127.0.0.1) | Community Core (Free Tier)`
2. **Compile-Time AST Quota Gating (`dcouplr translate` & `dcouplr state-plan`):**
   The compiler parses the input configuration and tallies total compute resources and monitors:
   ```python
   total_entities = len(graph.monitors) + len(graph.resources)
   ```
   If `total_entities > 1`, compilation halts with exit code `2` and an entitlement alert:
   ```
   Compiler Gating Triggered: Target workload defines 48 nodes/resources,
   which exceeds your active 'Community Core (Free Tier)' entitlement limit of 1 node(s).
   ```
3. **Local Daemon Isolation (`dcouplr serve`):**
   The built-in telemetry daemon binds strictly to local loopback (`127.0.0.1:8000`). Distributed multi-node clustering (Raft consensus peers across servers) is disabled in the free tier.
4. **Machine Hardware Fingerprint:**
   Binds the installation seat to the local machine GUID (`~/.dcouplr/seat_lease.json`).

---

## 3. 💼 Paid Commercial & Enterprise Installations

Commercial subscriptions (**Developer Pro, Cluster Small, Cluster Medium, Cluster Large, and Custom Enterprise**) unlock multi-node cluster compilation, multi-VPC mesh topology discovery, and guaranteed support SLAs.

### 4-Step Onboarding Workflow

```
1. Subscribe to Tier     2. Receive Signed Key    3. One-Line Activation      4. Air-Gapped Distribution
   dcouplr.com/#pricing  ==> Ed25519 Offline Token ==> install-enterprise.sh ==> dcouplr-enterprise-v1.0.0.tar.gz
   or AWS/GCP Market         (DCL-PRO-ACME-8821B47C9)  or DCOUPLR_LICENSE_KEY     (Containers, Helm, SBOM)
```

### Installation Commands

#### Method A: Turnkey Commercial Installer (Interactive Prompt)
* **Linux & macOS:**
  ```bash
  curl -fsSL https://dcouplr.com/install-enterprise.sh | sh
  ```
* **Windows (PowerShell):**
  ```powershell
  irm https://dcouplr.com/install-enterprise.ps1 | iex
  ```
*Prompts the operator to paste their commercial license key (e.g. `DCL-PRO-ACME-8821B47C9`), validates the Ed25519 signature offline, installs the binary, and prints `dcouplr auth status`.*

#### Method B: Automated CI/CD / Docker Deployment (Non-Interactive)
Inject the license key via environment variable:
* **Linux & macOS:**
  ```bash
  DCOUPLR_LICENSE_KEY="DCL-PRO-ACME-8821B47C9" curl -fsSL https://dcouplr.com/install-enterprise.sh | sh
  ```
* **Windows (PowerShell):**
  ```powershell
  $env:DCOUPLR_LICENSE_KEY="DCL-PRO-ACME-8821B47C9"; irm https://dcouplr.com/install-enterprise.ps1 | iex
  ```

#### Method C: Air-Gapped Offline Distribution Bundle (Tarball)
For disconnected enterprise data centers and sovereign cloud VPCs:
* Direct Download: `https://dcouplr.com/dcouplr-enterprise-v1.0.0.tar.gz`
* Contents (37 offline artifacts):
  1. Offline container images (`images/*.tar`)
  2. Kubernetes CRDs (`crds/synccontroller-crd.yaml`)
  3. Production Helm Chart (`charts/dcouplr/`)
  4. CycloneDX 1.5 JSON SBOM (`sbom-cyclonedx.json`)
  5. SPDX 2.3 JSON SBOM (`sbom-spdx.json`)
  6. SLSA Level 3 In-toto Provenance Attestation (`slsa-provenance.json`)
  7. Cosign public key (`cosign.pub`)
  8. Offline installer script (`install.sh`)
  9. Cryptographic `SHA256SUMS`

---

## 4. 📊 Node Capacity, Base Pricing & Overage Rates Matrix

The following matrix defines the exact pricing, included node quotas, linear overage rates, and tier caps enforced by `<dcouplr/>`:

| Tier Classification | Monthly Base | Included Nodes | Expansion Overage Rate | Max Tier Cap | SLA & Support Channel | Clustering & Raft |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Tier 0: Community Core** | **$0** / mo | **1 Node** (Local CLI) | *None* ($0 overage) | **1 Node** | Self-Service (GitHub & Docs) | Standalone Loopback Only |
| **Tier 1: Developer Pro** | **$300** / mo | **10 Nodes** (or 25 pilot) | *None* (Fixed flat tier) | **10 Nodes** | Standard Email (48h SLA) | Workstation & Dev Cluster |
| **Tier 2: Cluster Small** | **$1,500** / mo | **25 Nodes** | **+$60** / node / mo | **60 Nodes** ($3,600/mo cap) | 9x5 NBD Business Portal | Dual-Stack Mirroring & Raft |
| **Tier 3: Cluster Medium** | **$3,500** / mo | **75 Nodes** | **+$45** / node / mo | **90 Nodes** ($4,175/mo cap) | 24x7 P1 (2-Hr) Shared Slack | Multi-Region Mesh & Consensus |
| **Tier 4: Cluster Large** | **Flat $45** / node / mo | **91 to 300 Nodes** | **Flat $45** / node / mo | **300 Nodes** ($13,500/mo) | 24x7 P1 (1-Hr) Dedicated TAM | Multi-Cloud Fleet Governance |
| **Tier 5: Custom Enterprise** | Custom / Annual PO | **300+ Nodes** | **Volume Tiered** | **Unlimited** ($999,999$) | 24x7 P1 (15-Min) Dedicated SRE | Air-Gapped Sovereign Fleet |

### 💡 Financial Crossover Savings & Overage Optimization
To prevent punitive billing spikes, `<dcouplr/>` incorporates built-in pricing crossover thresholds:
1. **Tier 2 to Tier 3 Crossover (At 59–60 Nodes):**
   * On Tier 2 expansion, 59 nodes cost `$1,500 + (34 × $60) = $3,540/mo`, and 60 nodes cost `$3,600/mo`.
   * Upgrading to **Tier 3 Base ($3,500/mo)** immediately *saves $40 to $100/month* while expanding capacity to 75 nodes and upgrading the SLA to 24x7 P1 2-Hour Shared Slack!
2. **Tier 3 to Tier 4 Crossover (At 90 Nodes):**
   * On Tier 3 expansion, 90 nodes cost `$3,500 + (15 × $45) = $4,175/mo`.
   * Migrating to **Tier 4 Cluster Large (91 × $45 = $4,095/mo)** immediately *saves $80 to $125/month* while unlocking Dedicated TAM & War-Room Bridge!

---

### 4.1. 🛡️ How to Deal With Overages (Operational & Billing Playbook)

Infrastructure migrations and real-time monitoring are mission-critical. A production cluster must **never halt unexpectedly** simply because an engineering team deployed three canary nodes during a sprint. `<dcouplr/>` enforces overages through a structured, predictable 3-zone model:

```
[ ZONE 1: INCLUDED BASE ] ===> [ ZONE 2: EXPANSION OVERAGE BAND ] ===> [ ZONE 3: HARD CEILING ]
  Nodes <= Base Quota            Base < Nodes <= Max Tier Cap           Nodes > Max Tier Cap
  $0 Additional Cost             Metered (+ $60 / + $45 / node / mo)     Hard Stop (Exit 2)
  Normal Execution               Advisory Notice (Execution Unblocked)   Block Compilation
```

#### Operational Playbook by Customer Purchasing Channel

1. **Hyperscaler Marketplace Subscriptions (AWS Marketplace & GCP Marketplace):**
   * **In-VPC Private Metering:** When running inside AWS or GCP, the `<dcouplr/>` daemon queries the hyperscaler's internal metadata endpoint (`BatchMeterUsage` on AWS Marketplace or Cloud Commerce API on GCP) every 6 hours over a private IAM endpoint.
   * **Zero WAN Egress:** The metering API call is routed via private AWS VPC Endpoint or Google Private Service Connect. Zero telemetry leaves the cloud boundary to `<dcouplr/>`.
   * **Consolidated Invoicing:** Overages automatically accrue as dimension line items on the customer's monthly AWS/GCP cloud bill.

2. **Direct Purchase Order & Annual Master Service Agreement (MSA) Accounts:**
   * **Offline True-Up Attestations:** For enterprise customers with custom PO contracts or air-gapped sovereign VPCs, overages are reconciled at the end of each billing cycle (monthly or quarterly).
   * **Verifiable Audit Records:** The customer operator runs:
     ```bash
     dcouplr auth overage --json > overage_report.json
     dcouplr auth audit >> overage_report.json
     ```
     This exports a cryptographic SLSA-attested utilization token that is transmitted to `<dcouplr/>` finance via email or billing portal for invoicing.

3. **Proactive Crossover Upgrades (FinOps Recommendation):**
   * When a customer's workload enters the upper 85% of their expansion band (e.g., 55+ nodes on Cluster Small or 85+ nodes on Cluster Medium), `<dcouplr/>` proactively displays crossover savings tips in both the CLI and web dashboard.
   * Customers can execute a self-service upgrade at `https://dcouplr.com/#pricing` or contact their Technical Account Manager (TAM) to apply the higher tier base, instantly dropping monthly costs while expanding quotas and support SLAs.

4. **Remediation for Hard Tier Ceiling Breaches (Zone 3):**
   * If a customer attempts to compile or monitor more nodes than their tier's hard ceiling (e.g. 61 nodes on Cluster Small):
     * The compiler halts with exit code `2` and displays actionable remediation paths.
     * **Option A:** Upgrade to the next tier online or request a temporary emergency overage waiver from support.
     * **Option B:** Scope down the input file using `--input` filtering or canary tagging to compile subnets incrementally.
     * **Option C:** Request an Enterprise unmetered sovereign license (`DCL-ENT-...`).

---

## 5. 🔍 How to Determine, Check & Verify Active Node Capacity & Overages

Operators, FinOps analysts, and auditors have four distinct tools to inspect node quotas, calculate overages, and audit licenses:

### 1. Check Workload Overages via CLI (`dcouplr auth overage`)

The `dcouplr auth overage` command provides real-time workload modeling and overage calculations:

#### Mode A: Evaluate Arbitrary Hypothetical or Target Node Counts
```bash
dcouplr auth overage --nodes 58
```
*Output Table:*
```
                <dcouplr/> Workload Quota & Overage Evaluation                 
+-----------------------------------------------------------------------------+
| Property                     | Value                                        |
|------------------------------+----------------------------------------------|
| Active License Tier          | Cluster Small                                |
| Licensed Organization        | Acme Fintech Corp                            |
| Evaluated Node Count         | 58 Nodes                                     |
| Base Nodes Included          | 25 Nodes                                     |
| Evaluation Status            | ZONE 2: EXPANSION OVERAGE BAND               |
| Base Monthly Rate            | $1,500.00 / mo                               |
| Expansion Overage Nodes      | +33 Nodes                                    |
| Expansion Overage Rate       | +$60.00 / node / mo                          |
| Monthly Overage Surcharge    | $1,980.00 / mo                               |
| Total Estimated Monthly      | $3,480.00 / mo                               |
| Hard Tier Ceiling            | 60 Nodes                                     |
| [TIP] Crossover Opportunity  | Tier 3 Crossover: Upgrading to Tier 3 Base   |
|                              | ($3,500/mo) saves up to $100/mo with 75      |
|                              | nodes and 24x7 P1 SLA!                       |
+-----------------------------------------------------------------------------+
```

#### Mode B: Automatically Parse Infrastructure IaC Files Before Deployment
Operators can scan Terraform HCL or Datadog monitor files to compute exact AST entities and evaluate overages before running `terraform apply`:
```bash
dcouplr auth overage --input infrastructure/production_cluster.tf
```

#### Mode C: Automated CI/CD & FinOps Pipeline Ingestion (`--json`)
FinOps teams can run `dcouplr auth overage` in automated cost-governance pipelines:
```bash
dcouplr auth overage --nodes 59 --json
```
*Machine-Readable Output:*
```json
{
  "allowed": true,
  "status": "EXPANSION_OVERAGE",
  "node_count": 59,
  "base_nodes": 25,
  "overage_nodes": 34,
  "overage_rate": 60.0,
  "estimated_overage_monthly": 2040.0,
  "base_monthly_price": 1500.0,
  "total_estimated_monthly": 3540.0,
  "max_tier_cap": 60,
  "guidance": "Expansion Overage: Workload targets 59 nodes (34 over 25-node base). Metered at +$60/node/mo (Est. $2,040/mo overage).\n[TIP] Tier 3 Crossover: Upgrading to Tier 3 Base ($3,500/mo) saves up to $100/mo with 75 nodes and 24x7 P1 SLA!",
  "crossover_tip": "Tier 3 Crossover: Upgrading to Tier 3 Base ($3,500/mo) saves up to $100/mo with 75 nodes and 24x7 P1 SLA!"
}
```

---

### 2. Inspect Active Entitlements & Hardware Seat (`dcouplr auth status`)
```bash
dcouplr auth status
```
*Confirms active tier, authorized node ceiling, machine fingerprint, and seat lease.*

---

### 3. Verify System Preflight Boundary (`dcouplr doctor`)
```bash
dcouplr doctor
```
*Inspects Check 7 to ensure runtime execution conforms to the licensed loopback or multi-VPC cluster boundary.*

---

### 4. Live In-App Telemetry Dashboard FinOps Widget (`http://127.0.0.1:8000/dashboard`)
The built-in web dashboard provides real-time in-VPC FinOps tracking:
* Visual gauge showing active cluster nodes vs. base quota.
* Live expansion overage meter and accrued estimated monthly spend.
* Dynamic crossover savings alerts when nearing the cost threshold of the next tier.

---

### 5. Generate Cryptographic Audit Record (`dcouplr auth audit`)
```bash
dcouplr auth audit
```
Generates a verifiable, zero-egress audit attestation summarizing the host hardware fingerprint, active tier, authorized node quota, and seat signature:
```
+----------------------- Offline License Audit Record ------------------------+
| <dcouplr/> Zero-Egress Offline Audit Attestation                            |
|                                                                             |
| Timestamp: 2026-10-27T02:55:30Z                                             |
| Host Hardware Fingerprint: bf039bd88ffc16b31d35aa2a5c86a8b0                 |
| Active License Tier: Cluster Small                                          |
| Authorized Node Quota: 50 Nodes                                             |
| Licensed Organization: Acme Fintech Corp                                    |
| Air-Gap Audit Verdict: PASS (Zero Cloud Egress Guaranteed)                  |
| Installation Seat Sig: seat-a984f18c2910d8a1                                 |
|                                                                             |
| Include this cryptographic token in your annual license true-up or SOC2     |
| audit.                                                                      |
+-----------------------------------------------------------------------------+
```


---

## 6. 🛡️ In-VPC Cluster Gossip Counting (No External Egress)

When `<dcouplr serve>` runs as a cluster service across multiple nodes in a customer's VPC:
1. Daemons discover each other strictly inside the private VPC subnet via mDNS or Raft consensus.
2. The Raft cluster leader maintains an in-memory census of registered node UUIDs:
   ```python
   active_nodes = len(raft_cluster.healthy_peers)
   if active_nodes > active_license.max_nodes:
       # Trigger in-VPC quota alert in dashboard
       # Switch cluster to Read-Only mode
   ```
3. **Network Egress: $0.** Not a single packet leaves the customer's private subnet, preserving strict regulatory compliance and air-gapped security.

---

## 7. ⚙️ Detailed CLI Installation Architecture by Licensed Node Capacity

The `<dcouplr/>` unified binary behaves dynamically based on the licensed node capacity encoded in the offline entitlement token or environment:

```
+-------------------------------------------------------------------------------------------------------------+
|                                    <dcouplr/> UNIFIED BINARY ENGINE                                         |
+------------------------------------+-----------------------------------+------------------------------------+
|  1 NODE (Community Core)           |  10 - 25 NODES (Developer Pro)    |  25 - 300+ NODES (Cluster/Ent)     |
|  - Loopback 127.0.0.1:8000 only    |  - Loopback + Dev VPC subnets     |  - Distributed Raft Mesh (Port 8300)|
|  - Standalone in-memory AST        |  - Up to 25 AST compute targets   |  - Dual-Stack Mirroring & Gossip   |
|  - Hard stop on AST count > 1      |  - 0 Raft consensus clustering    |  - Linear Overage Zones (2 & 3)    |
|  - $0 Egress Guarantee             |  - 48h Email SLA Desk             |  - 1h/15m War-Room Bridge & TAM    |
+------------------------------------+-----------------------------------+------------------------------------+
```

### Node Capacity Behavioral Matrix

| Licensed Node Capacity | Active Tier | Installation Profile | Loopback / Binding | Raft Clustering | AST Compiler Node Gating | Overage Enforcement |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1 Node** | Community Core | Workstation Local (`curl ... install.sh`) | `127.0.0.1:8000` (Loopback only) | Disabled (Standalone) | **Hard stop** if AST entities > 1 | None ($0) |
| **10 to 25 Nodes** | Developer Pro | Workstation + Dev VPC (`install-enterprise.sh`) | Host IP / Local Subnet | Disabled (Standalone) | **Hard stop** if AST entities > 25 | Fixed flat tier |
| **25 to 60 Nodes** | Cluster Small | Node Agent / Daemon (`install-enterprise.sh`) | Dual-Stack Private VPC Subnet | Enabled (2-3 Raft peers) | Base: 25; Soft overage up to 60 | **Zone 2:** +$60/node/mo; **Zone 3:** Hard stop at 60 |
| **75 to 90 Nodes** | Cluster Medium | Multi-VPC Cluster Daemon | Multi-Region Private VPC Mesh | Enabled (3-5 Raft peers) | Base: 75; Soft overage up to 90 | **Zone 2:** +$45/node/mo; **Zone 3:** Hard stop at 90 |
| **91 to 300 Nodes** | Cluster Large | Multi-Cloud Fleet Daemon | Multi-Cloud Transit VPC Mesh | Enabled (5+ Raft peers) | Base: 91; Soft overage up to 300 | **Zone 2:** Flat $45/node/mo; **Zone 3:** Hard stop at 300 |
| **300+ to Unlimited** | Custom Enterprise | Air-Gapped Sovereign Bundle (`tar.gz`) | Air-Gapped High-Sec Enclave | Enabled (Hierarchical Raft) | Unlimited (999,999) | Custom Enterprise MSA / Volume Tiering |

### What Happens During Installation on the Host

When the installer runs (`install.sh`, `install.ps1`, `install-enterprise.sh`, or `install-enterprise.ps1`):
1. **Binary Placement:** Places the compiled native binary in the system path (`/usr/local/bin/dcouplr` on Linux/macOS, `$env:LOCALAPPDATA\Programs\dcouplr` on Windows).
2. **Machine Hardware Fingerprint Derivation:** Computes a deterministic 32-character hardware fingerprint using OS-native unique identifiers without network calls:
   * **Linux:** `/etc/machine-id` or `/var/lib/dbus/machine-id`
   * **macOS:** `IOPlatformUUID` via `ioreg -rd1 -c IOPlatformExpertDevice`
   * **Windows:** `MachineGuid` from `HKLM\SOFTWARE\Microsoft\Cryptography`
   * **Salted Hash:** `SHA256("DCOUPLR-ED25519-ENTITLEMENT-V1-ZERO-EGRESS:" + <raw_id>)[:32]`
3. **Seat Lease Recording:** Writes `~/.dcouplr/seat_lease.json` containing the host fingerprint, active tier, licensed node capacity, and cryptographic seat attestation signature (`seat-<sig[:16]>`).
4. **License File Initialization:**
   * If a commercial license key is provided (via prompt or `DCOUPLR_LICENSE_KEY`), it validates the signature offline and writes `~/.dcouplr/license.json`.
   * If no key is provided, it writes the default `Community Core (Free Tier)` license file with `max_nodes = 1`.
5. **System Preflight Diagnostic Check (`dcouplr doctor`):**
   * Check 7 tests `node_entitlement_boundary`. If Community Core, it asserts that execution is confined to `127.0.0.1`. If commercial, it prints the authorized node count and organization name.

---

## 8. 🔐 Internal Team License Code Generation Architecture

The `<dcouplr/>` internal operations and sales engineering teams generate and sign customer license keys using [`scripts/generate_customer_license.py`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/scripts/generate_customer_license.py).

### Dual-Format Key Structure

Every commercial customer is issued both a **Primary Structured Key** (for human operators and CLI logins) and a **Base64 Signed JWT Blob** (for air-gapped CI/CD and container environments):

```
+-------------------------------------------------------------------------------------------------------+
| 1. PRIMARY STRUCTURED KEY (Human-Readable CLI Key)                                                    |
|                                                                                                       |
|    DCL - CLUS-SM - ACME-FINTECH - 8F3B2C1A                                                           |
|     ^        ^            ^           ^                                                               |
|     |        |            |           +--- Deterministic 8-char HMAC-SHA256 signature                |
|     |        |            +--------------- Alphanumeric Customer Org Slug (max 16 chars)              |
|     |        +---------------------------- Tier Prefix (PRO, CLUS-SM, CLUS-MD, CLUS-LG, ENT)          |
|     +------------------------------------- Product Prefix (<dcouplr/> Core)                           |
+-------------------------------------------------------------------------------------------------------+
| 2. SIGNED BASE64 JWT BLOB (Air-Gapped Entitlement Token)                                             |
|                                                                                                       |
|    eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJzdWIiOiAiZGNvdXBsci1saWNlbnNlIiwgImlzcyI...          |
|    [ Header: HS256 ] . [ Payload Claims: org, tier, max_nodes, sla, support, expires ] . [ Sig ]    |
+-------------------------------------------------------------------------------------------------------+
```

### Cryptographic Signing Mechanics
* **Cryptographic Anchor:** `LICENSE_SALT = "DCOUPLR-ED25519-ENTITLEMENT-V1-ZERO-EGRESS"`
* **Structured Key Signature Formula:**
  ```python
  raw_payload = f"{prefix}:{slug}:{LICENSE_SALT}"
  sig = hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()[:8].upper()
  structured_key = f"{prefix}-{slug}-{sig}"
  ```
* **JWT Token Signature Formula:**
  ```python
  signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
  sig = hmac.new(LICENSE_SALT.encode("utf-8"), signing_input, hashlib.sha256).digest()
  jwt_token = f"{header_b64}.{payload_b64}.{sig_b64}"
  ```
* **Zero-Egress Guarantee:** The verification engine inside [`migration_tools/licensing.py`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/migration_tools/licensing.py) contains the matching public verification routine. It computes the identical signature in local volatile RAM in `< 1ms` with $0 network traffic.

---

## 9. 🗄️ Internal Team Storage, Customer Registry & Delivery Artifacts

When a license is generated by the `<dcouplr/>` team, the generator script automatically persists the entitlement records in two internal locations:

```
c:\Users\JenniferCletaLee\.gemini\antigravity-ide\MigrationToolsAPI\
└── licenses/
    ├── customer_registry.jsonl          <--- Central append-only ledger for all issued licenses
    └── issued/
        ├── ACME-FINTECH/                <--- Customer directory by sanitized slug
        │   ├── license.json             <--- Full metadata bundle with both keys and SLA details
        │   └── dcouplr.lic              <--- Formatted air-gap entitlement token for dispatch
        ├── GLOBAL-BANK-NA/
        │   ├── license.json
        │   └── dcouplr.lic
        └── SOVEREIGN-CLOUD-EU/
            ├── license.json
            └── dcouplr.lic
```

### 1. Central Master Ledger (`licenses/customer_registry.jsonl`)
An append-only JSON Lines file tracking every license ever minted. Each line represents an immutable issuance event:
```json
{
  "organization": "Acme Fintech Corp",
  "tier": "Cluster Small",
  "structured_key": "DCL-CLUS-SM-ACME-FINTECH-8F3B2C1A",
  "signed_jwt_blob": "eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9...",
  "max_nodes": 50,
  "sla_level": "Priority Business (4h SLA)",
  "support_channel": "support-priority@dcouplr.com",
  "expires_at": "2027-12-31",
  "issued_at": "2026-10-27",
  "verification_status": "VALID_OFFLINE_VERIFIED"
}
```

### 2. Customer Delivery Bundle (`licenses/issued/<SLUG>/`)
* **`license.json`**: Complete, machine-readable entitlement payload used by automated enterprise provisioning scripts.
* **`dcouplr.lic`**: The standard offline license file sent directly to customer engineers or attached to welcome emails.

---

## 10. 📋 Step-by-Step Operator Runbook for the Internal Team

### Scenario A: Minting a Standard Commercial License
For customers subscribing via `https://dcouplr.com/#pricing` or enterprise sales:

```bash
# Developer Pro (25 Nodes)
python scripts/generate_customer_license.py --org "Acme Fintech Corp" --tier pro

# Cluster Small (50 Base Nodes, expandable to 60)
python scripts/generate_customer_license.py --org "Acme Fintech Corp" --tier cluster_small

# Cluster Medium (150 Base Nodes, expandable to 90/150)
python scripts/generate_customer_license.py --org "Starlight Media" --tier cluster_medium

# Cluster Large (500 Base Nodes, expandable to 300/500)
python scripts/generate_customer_license.py --org "Apex Cloud Services" --tier cluster_large
```

### Scenario B: Custom Enterprise Contract / High Node Count
For sovereign cloud, government, or Fortune 500 accounts requiring custom node counts and custom expiry dates:

```bash
python scripts/generate_customer_license.py \
  --org "Global Sovereign Bank NA" \
  --tier enterprise \
  --nodes 2500 \
  --expiry 2028-12-31
```

### Scenario C: Automated CI/CD or Cloud Marketplace Webhook Integration
When a customer purchases through AWS Marketplace or GCP Marketplace, the backend billing webhook executes the generator with `--json-output`:

```bash
python scripts/generate_customer_license.py \
  --org "Marketplace Customer 4882" \
  --tier cluster_small \
  --json-output > /tmp/license_payload.json
```
The resulting JSON is automatically emailed to the customer technical contact and recorded in the append-only registry.

---

## 11. 🔎 Customer-Facing Verification & Support Troubleshooting

When a customer contacts `<dcouplr/>` support regarding node capacity or compilation gating, the support engineer instructs the customer to run the following diagnostic commands:

1. **Verify Active Quota & Seat Binding:**
   ```bash
   dcouplr auth status
   ```
   *Confirms active tier, licensed node capacity, host hardware fingerprint, and seat lease.*

2. **Verify System Preflight Boundaries:**
   ```bash
   dcouplr doctor
   ```
   *Inspects Check 7 (`node_entitlement_boundary`) to verify whether loopback or cluster mesh is active.*

3. **Obtain Cryptographic SOC2 / True-Up Token:**
   ```bash
   dcouplr auth audit
   ```
   *Customer pastes the output into a support ticket; support verifies the signature against `licenses/customer_registry.jsonl` with $0 network access.*

---

## 12. 📊 The Dashboard as the Secondary Verification Location for Installation & Overage Auditing

While the `<dcouplr/>` CLI (`dcouplr auth status`, `dcouplr auth overage`, `dcouplr auth audit`) serves as the **primary location** for systems engineers and automated CI/CD gating, the native in-app dashboard (`http://127.0.0.1:8000/dashboard` or internal private VPC ingress) acts as the **secondary location** for platform directors, FinOps controllers, and compliance auditors to visually verify:

1. **Total Number of Active Installations:** Live count of installed agent daemons and cluster nodes across all monitored VPCs.
2. **License Availability Status:** Instant confirmation of whether available license headroom remains, if capacity is fully saturated, or if uncommitted overages are active.
3. **Purchased Overage Licenses:** Clear accounting of how many extra overage licenses were pre-purchased (e.g. committed add-on packs), how much of the purchased pool is currently utilized, and what remains before uncommitted expansion rates take effect.

```
+-------------------------------------------------------------------------------------------------------------------------------+
|                       <dcouplr/> SECONDARY VERIFICATION HUB: IN-VPC LICENSE & INSTALLATION CENSUS                             |
+-----------------------------+-----------------------------+-----------------------------+-------------------------------------+
| TOTAL ACTIVE INSTALLATIONS  | LICENSE AVAILABILITY STATUS | PURCHASED OVERAGE LICENSES  | TOTAL PAID CAPACITY                 |
| 24 Active Nodes / Agents    | 11 Available Licenses       | +10 Nodes Purchased         | 35 Total Licensed Nodes             |
| [██████████████████░░░] 68% | 🟢 Licenses Available       | 0 / 10 Pool Used (10 Free)  | 25 Base + 10 Purchased Pack         |
+-----------------------------+-----------------------------+-----------------------------+-------------------------------------+
| LICENSED TIER & CUSTOMER    | INSTALLATION SEAT LEASE     | FINOPS MONTHLY INVOICING    | EVALUATION ZONE                     |
| Cluster Small               | seat-a984f18c2910d8a1       | $1,500.00 / mo              | Zone 1: Included Base Allocation    |
| Acme Fintech Corp           | HW: bf039bd88ffc16b3...     | $0.00 Uncommitted Overages  | (Zero Exfiltration / Air-Gapped)    |
+-----------------------------+-----------------------------+-----------------------------+-------------------------------------+
| 🛡️ SECONDARY VERIFICATION: All 24 node installations verified in-VPC via Raft consensus. Primary verification: CLI (dcouplr auth)  |
+-------------------------------------------------------------------------------------------------------------------------------+
```

### 1. Key Verification Metrics on the Dashboard Panel (`#panel-license-census`)

| UI Metric Card | Purpose & Audit Calculation | Verification Criteria |
| :--- | :--- | :--- |
| **Total Active Installations** | Live count of all active `<dcouplr>` node agents registered in the in-VPC Raft consensus mesh (`monitored_nodes`). | Reconciles against the customer's cloud infrastructure inventory (AWS EC2, GCP GCE, Azure VMs). |
| **License Availability Status** | Shows remaining license capacity: `available_licenses = total_licensed_capacity - monitored_nodes`. | Displays `🟢 Available` (if `> 0`), `🟡 Capacity Saturated` (if `= 0`), or `🔴 Deficit: N Nodes` (if exceeded). |
| **Purchased Overage Licenses** | Displays pre-purchased committed overage packs (`purchased_overage_nodes`) and pool utilization (`purchased_overage_used / purchased_overage_nodes`). | Shows exact count of purchased expansion licenses bought upfront at discounted contract rates. |
| **Licensed Tier & Customer** | Authenticated commercial tier name (`Cluster Small`, `Cluster Medium`, `Enterprise`) and legal organization name. | Prevents license key misuse across different business entities. |
| **Installation Seat Lease** | Local machine hardware fingerprint (`HW: bf039b...`) and cryptographic seat lease ID (`seat-a984f...`). | Confirms that this dashboard instance is anchored to an authorized installation node. |
| **FinOps Monthly Invoicing** | Real-time invoice calculation: Base monthly price + uncommitted overage fees (`uncommitted_overages * overage_rate`). | Guarantees zero surprise cloud bills by clearly distinguishing prepaid pools from metered overages. |

---

### 2. Backend Real-Time APIs for Dashboard & FinOps Pipelines

The dashboard queries and streams installation data via dedicated zero-egress REST endpoints:

| Endpoint | Method | Response Payload | Use Case |
| :--- | :--- | :--- | :--- |
| `/v1/license/status` | `GET` | Complete license metadata, purchased overages, seat lease, and capacity census | Dashboard initialization & FinOps auditing |
| `/v1/nodes/capacity` | `GET` | Active node count, total licensed capacity, available licenses, and hard ceiling | Kubernetes HPA & automated scaling policies |
| `/v1/telemetry/stream` | `GET (SSE)` | Persistent Server-Sent Events push stream broadcasting live 1-second telemetry ticks including `"licensing"` payload | Live 60 FPS dashboard updates |

#### Sample `/v1/license/status` JSON Response:
```json
{
  "tier": "Cluster Small",
  "organization": "Acme Fintech Corp",
  "max_nodes": 50,
  "is_commercial": true,
  "sla_level": "Priority Business (4h SLA)",
  "support_channel": "support-priority@dcouplr.com",
  "expires_at": "2027-12-31",
  "machine_fingerprint": "bf039bd88ffc16b31d35aa2a5c86a8b0",
  "seat_id": "seat-a984f18c2910d8a1",
  "registered_at": "2026-10-27T02:55:30Z",
  "monitored_nodes": 24,
  "base_nodes": 25,
  "purchased_overage_nodes": 10,
  "total_licensed_capacity": 35,
  "available_licenses": 11,
  "available_base_licenses": 1,
  "available_purchased_overage_licenses": 10,
  "purchased_overage_used": 0,
  "uncommitted_overage_nodes": 0,
  "has_available_licenses": true,
  "availability_status": "AVAILABLE",
  "overage_nodes": 0,
  "overage_rate": 60.0,
  "estimated_overage_monthly": 0.0,
  "base_monthly_price": 1500.0,
  "total_estimated_monthly": 1500.0,
  "max_tier_cap": 60,
  "status": "INCLUDED_BASE",
  "crossover_tip": null,
  "utilization_pct": 68.6
}
```

---

## 13. 🔒 Strict Production Isolation: Forbidding Internal Endpoints on Public Web

A fundamental architectural mandate of `<dcouplr/>` is that **internal operational tooling, dashboards, admin vaults, and compiler studios MUST NEVER be exposed on the public production website (`https://dcouplr.com`)**.

```
+---------------------------------------------------------------------------------------------------------------+
|                                      ARCHITECTURE BOUNDARY MATRIX                                             |
+-----------------------------------------------+---------------------------------------------------------------+
| PUBLIC PRODUCTION INTERNET (https://dcouplr.com)| PRIVATE IN-VPC APPLIANCE BOUNDARY (http://127.0.0.1:8000)   |
+-----------------------------------------------+---------------------------------------------------------------+
| ✅ Public Landing Page (/)                     | 🔒 In-App Telemetry & Node Census (/dashboard)                |
| ✅ Architecture & Tech Docs (/docs)           | 🔒 Central Operations & Config Vault (/configuration)             |
| ✅ OpenAPI & Interactive Swagger UI (/swagger)| 🔒 AST Compiler & Transpiler Studio (/compiler)               |
| ✅ Legal Terms & Security Notices (/legal/*)  | 🔒 Live Telemetry SSE Push Stream (/v1/telemetry/stream)      |
| ✅ CLI Installers (install.sh, install.ps1)   | 🔒 Real-time License Status API (/v1/license/status)          |
| ❌ NO /dashboard (Enforced 404 Not Found)     | 🔒 Node Capacity Query API (/v1/nodes/capacity)               |
| ❌ NO Privileged Endpoints (Enforced 404 Not Found)         | 🔒 Storage Log Compaction & Snapshot Triggers (/v1/storage/*) |
| ❌ NO /compiler (Enforced 404 Not Found)      | 🔒 Dynamic Raft Peer Registration (/v1/raft/cluster/join)     |
+-----------------------------------------------+---------------------------------------------------------------+
```

### 3-Layer Defense-in-Depth Enforcement:

1. **Build & Bundling Layer (`scripts/export_hostinger_bundle.py`):**
   * The static site bundler strictly excludes all internal operational assets (`dashboard.*`, `admin.*`, `compiler.*`, `support.*`, `presentation.*`, `pitch.*`) from entering `dist/hostinger-site/` or the production `dcouplr-hostinger-site.zip`.
   * Files cannot be requested because they do not exist on the web hosting filesystem.

2. **Web Server Rewrite Layer (Hostinger Apache / LiteSpeed `.htaccess`):**
   * Hard rewrite rules explicitly reject all attempts to reach appliance routes:
     ```apache
     # Strict In-VPC Boundary Protection
     RewriteRule ^(dashboard|admin|compiler|telemetry|support|pitch|presentation|dossier)(/.*)?$ - [R=404,L]
     RewriteRule ^(dashboard|admin|compiler|support|pitch|presentation)\.(html|js|css)$ - [R=404,L]
     ```
   * Any web browser or scanner attempting to access `https://dcouplr.com/dashboard` receives an immediate HTTP 404.

3. **Application Host Header Guard (`verify_not_public_production_host`):**
   * Inside [`migration_tools/api/app.py`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/migration_tools/api/app.py), all internal route handlers inspect the incoming `Host` header:
     ```python
     def verify_not_public_production_host(request: Request):
         host = (request.headers.get("host") or "").lower().split(":")[0].strip()
         if host in ("dcouplr.com", "www.dcouplr.com"):
             raise HTTPException(
                 status_code=404,
                 detail="Not Found: In-VPC appliance consoles are strictly forbidden on the public production website.",
             )
     ```
   * Even if a reverse proxy accidentally forwards public traffic to the API daemon, the application layer itself halts the request.



