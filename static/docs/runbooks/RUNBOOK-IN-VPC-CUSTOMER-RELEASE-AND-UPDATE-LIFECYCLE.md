# Master Engineering Runbook: In-VPC Customer Release, Software Update, and Database Migration Lifecycle

**Document ID:** RUN-IN-VPC-RELEASE-UPDATE-001  
**Revision:** 1.0.0 (Enterprise Air-Gapped Release & Sovereign Update Protocol)  
**Classification:** Enterprise System Architecture, Sovereign Release Engineering & SRE Operations  
**Target Audience:** Enterprise Infrastructure Architects, Principal Site Reliability Engineers (SRE), DevSecOps Leads, Release Engineers, Chief Information Security Officers (CISO), Compliance Auditors  
**Canonical Wordmark Standard:** `<dcouplr/>`  
**Last Updated:** November 2026  

---

## Executive Summary & Sovereign Boundary Principles

The enterprise software delivery model of <span class="dcouplr-wordmark"><span class="dcouplr-bracket">&lt;</span><span class="dcouplr-text">dcouplr</span><span class="dcouplr-bracket">/&gt;</span></span> is built upon a fundamental, non-negotiable architectural invariant: **100% In-Perimeter Sovereignty**. Both the application runtime appliance and its Single Source of Truth (SSOT) embedded database (`dcouplr_customer_db` SQLite 3 WAL) execute entirely inside the customer's private Virtual Private Cloud (VPC), Sovereign Cloud Perimeter, or on-premises data center.

Under this security boundary, traditional vendor-pushed SaaS updates, automatic cloud-based background updates, remote SSH backdoors, and phone-home telemetry are **strictly prohibited**. 

```
══════════════════════════════════════════════════════════════════════════════════════════════════════════
                                <dcouplr/> ENTERPRISE RELEASE & UPDATE LIFECYCLE
══════════════════════════════════════════════════════════════════════════════════════════════════════════
                                                                                                    
    VENDOR SECURE BUILD PLANE                            CUSTOMER IN-PERIMETER SOVEREIGN REALM      
  ┌───────────────────────────────┐                    ┌───────────────────────────────────────────┐
  │  <dcouplr/> CI/CD & Security  │                    │ Customer Private OCI Registry / Bastion   │
  │  • Hermetic Container Builds  │                    │ • Customer-Controlled Pull / Mirror       │
  │  • SLSA Level 3 Provenance    │                    │ • In-VPC Cosign Signature Verification    │
  │  • CycloneDX / SPDX SBOMs     │                    │ • Customer SecOps Pre-Admission Gate      │
  │  • Cosign ECDSA P-256 Sign    │                    └─────────────────────┬─────────────────────┘
  └──────────────┬────────────────┘                                          │                      
                 │                                                           ▼                      
                 ▼                                     ┌───────────────────────────────────────────┐
  ┌───────────────────────────────┐                    │ IN-VPC ORCHESTRATION & DEPLOYMENT         │
  │ SECURE DISTRIBUTION GATEWAY   │                    │ • Track A: GitOps (ArgoCD / Flux / Helm)  │
  │ • OCI Registry / Marketplaces │═══════════════════▶│ • Track B: Offline Air-Gap Tarball Bundle │
  │ • Air-Gap Tarball Bundles     │ Cryptographic Push │ • Track C: In-VPC VM / Systemd Appliance  │
  │ • Zero Telemetry Collection   │   or Data Diode    └─────────────────────┬─────────────────────┘
  └───────────────────────────────┘                                          │                      
                                                                             ▼                      
  ═══════════════════════════════════════════════════════════════════════════════════════════════════════   
  IN-VPC ZERO-DOWNTIME DATABASE PRESERVATION & ROLLING CUTOVER                                              
  ───────────────────────────────────────────────────────────────────────────────────────────────────────   
  Step 1: Hot Snapshot      ──▶ `VACUUM INTO 'data/backups/vpc_telemetry_pre_v2.4.0.db'` (Sub-50ms)         
  Step 2: Additive DDL      ──▶ `ALTER TABLE ... ADD COLUMN` (Zero Customer Data Loss)                      
  Step 3: Rolling Pod Swap  ──▶ `maxSurge: 1, maxUnavailable: 0` (Zero TCP Dropped Connections)            
  Step 4: Post-Verification ──▶ `PRAGMA integrity_check;` (Automatic Rollback on Error)                    
  ═══════════════════════════════════════════════════════════════════════════════════════════════════════   
```

### The Three Sovereign Release Invariants

1. **Zero-WAN Egress ($0.00 Data Transfer Surcharge):**
   The `<dcouplr/>` appliance never initiates outbound network connections across the public Internet to check for software versions, download patches, report installation telemetry, or ping vendor license servers. Billable public cloud WAN egress is mathematically guaranteed at **$0.00**.

2. **Zero Vendor Inbound Access (No Backdoors / Bastions):**
   `<dcouplr/>` personnel have no direct network access into customer production environments. There are no reverse tunnels, no vendor-managed jumpboxes, no open SSH listening ports, and no administrative backdoors. All updates are delivered as immutable, signed artifacts executed exclusively by authorized customer SRE and DevSecOps staff.

3. **Customer-Controlled Pull & Promotion Model:**
   Enterprise customers retain total autonomy over when, where, and how new versions are evaluated and promoted. Upgrades move through customer-governed promotion rings (e.g., Development VPC &rarr; Staging VPC &rarr; Production Mesh) aligned with internal maintenance windows and regulatory freeze periods (FINRA, HIPAA, DoD IL5/IL6, FedRAMP High, PCI-DSS Level 1).

---

## Part I: The Three Enterprise Release Delivery Tracks

`<dcouplr/>` supports three standardized enterprise delivery tracks tailored to modern cloud-native architectures, highly regulated air-gapped perimeters, and virtual appliances.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             THE 3 ENTERPRISE RELEASE DELIVERY TRACKS                             │
├──────────────────────┬───────────────────────────────┬───────────────────────────────────────────┤
│ Delivery Track       │ Target Environment            │ Deployment Tooling                        │
├──────────────────────┼───────────────────────────────┼───────────────────────────────────────────┤
│ Track A: GitOps &    │ AWS EKS, GCP GKE, Azure AKS,  │ ArgoCD, Flux CD, Helmfile,                │
│ Private OCI Mirror   │ Red Hat OpenShift, Kubernetes │ Harbor, AWS ECR Pull-Through Cache        │
├──────────────────────┼───────────────────────────────┼───────────────────────────────────────────┤
│ Track B: Air-Gapped  │ Sovereign Enclaves, DoD IL6,  │ `package_airgap_bundle.py`,               │
│ Cryptographic Bundle │ Isolated Bare-Metal DCs       │ Hardware Data Diode, `install_offline.sh` │
├──────────────────────┼───────────────────────────────┼───────────────────────────────────────────┤
│ Track C: In-VPC VM & │ Dedicated VMs (RHEL/Ubuntu/   │ Atomic Symlink Directory Cutover,         │
│ Systemd Bare-Metal   │ Windows Server), Edge Hubs    │ `systemd`, `run_server.py`                │
└──────────────────────┴───────────────────────────────┴───────────────────────────────────────────┘
```

---

### Track A: GitOps & Private OCI Registry Mirror (Cloud-Native Kubernetes)

For cloud-native enterprises running Kubernetes (EKS, GKE, AKS, OpenShift, or Rancher), updates follow standard GitOps pull-based continuous delivery:

```
[Vendor OCI Registry] ──(Customer Pull-Through Mirror)──▶ [Customer Private Registry: harbor.corp.internal]
                                                                      │
                                                                      ▼
[Customer GitOps Repo] ──(ArgoCD / Flux In-VPC Reconciler)──▶ [In-VPC K8s Cluster (Rolling Update)]
```

#### Step 1: Upstream Ingestion into Customer Private Registry
Customer mirror jobs (or Harbor / AWS ECR Pull-Through Cache) sync the newly released signed container images from `<dcouplr/>`'s distribution registry into the customer's private, in-perimeter OCI registry:

```bash
# Example: Customer SecOps Skopeo sync script into internal Harbor registry
skopeo copy \
  --src-creds="${DCOUPLR_PORTAL_USER}:${DCOUPLR_PORTAL_TOKEN}" \
  docker://registry.dcouplr.io/appliance:v2.4.0 \
  docker://harbor.internal.customer.net/dcouplr/appliance:v2.4.0
```

#### Step 2: In-Perimeter GitOps Manifest Promotion
The customer DevOps engineer updates the container tag and Helm chart version in their internal private Git repository (e.g., GitLab, GitHub Enterprise, Bitbucket Data Center):

```yaml
# values-prod.yaml (Customer Private GitOps Repo)
image:
  repository: harbor.internal.customer.net/dcouplr/appliance
  tag: v2.4.0
  pullPolicy: IfNotPresent

persistence:
  enabled: true
  storageClass: "gp3-encrypted"
  size: 50Gi
  mountPath: /var/lib/dcouplr/data

resources:
  requests:
    cpu: 2000m
    memory: 4Gi
  limits:
    cpu: 4000m
    memory: 8Gi

database:
  walMode: true
  autoVacuum: incremental
  preUpgradeSnapshot: true
```

#### Step 3: Zero-Downtime Rolling Update Execution
ArgoCD or Flux detects the Git commit and initiates a Kubernetes rolling update. The deployment specification mandates `maxSurge: 1` and `maxUnavailable: 0`:

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```

1. **Pod v2.4.0 boots in parallel:** Mounts the shared persistent volume or attaches to the replicated storage layer.
2. **Readiness Probe verifies database integrity:**
   ```yaml
   readinessProbe:
     httpGet:
       path: /v1/vpc-database/info
       port: 8000
     initialDelaySeconds: 5
     periodSeconds: 5
   ```
3. **Traffic Cutover:** Only when Pod v2.4.0 reports `status: "ONLINE"` and passes `PRAGMA integrity_check` does the Kubernetes Service route live VPC telemetry traffic to the new pod.
4. **Graceful Termination:** Pod v2.3.9 is sent `SIGTERM`, allows in-flight SQLite WAL transactions to flush (via 30-second graceful termination period), and terminates cleanly.

---

### Track B: Air-Gapped Cryptographic Tarball Bundle (High-Security / Sovereign Cloud)

For sovereign cloud environments, air-gapped enclaves, defense installations, and offline data centers with zero external WAN connectivity, releases are delivered as self-contained, cryptographically signed tarballs generated by `scripts/package_airgap_bundle.py`.

#### Anatomy of an Air-Gap Release Bundle (`dcouplr-airgap-bundle-v{version}.tar.gz`)

| Directory / File | Description | Purpose |
| :--- | :--- | :--- |
| `images/*.tar` | Pre-cached OCI container images | Contains `dcouplr/appliance:v{version}` and exporter images for `docker load` or `ctr images import` |
| `charts/dcouplr/` | Production Helm Chart | Offline-ready Helm chart with embedded templates and default values |
| `crds/` | Kubernetes CRDs | Custom Resource Definitions (`synccontroller-crd.yaml`, network policies) |
| `manifests/` | Standalone Kubernetes Manifests | Plain YAML deployment manifests for clusters without Helm |
| `sbom.cdx.json` | CycloneDX 1.5 JSON SBOM | Complete machine-readable inventory of all dependencies, licenses, and SHA-256 digests |
| `sbom.spdx.json` | SPDX 2.3 JSON SBOM | Standardized ISO/IEC 5962:2021 compliance Bill of Materials |
| `bundle.provenance.json` | SLSA Level 3 Provenance | In-toto attestation proving build hermeticity, git commit SHA, and builder authenticity |
| `cosign.pub` | Cosign ECDSA P-256 Public Key | Vendor public key used by customer SecOps to verify the bundle signature |
| `SHA256SUMS` & `.sig` | Cryptographic Checksums & Sig | SHA-256 digests of every file in the bundle, signed by vendor private key |
| `install_offline.sh` | Automated Turnkey Installer | Offline shell script executing validation, image import, and deployment |

#### In-VPC Deployment Procedure for Air-Gapped Environments

```bash
# 1. Transfer bundle across air-gap data diode / administrative bastion
scp dcouplr-airgap-bundle-v2.4.0.tar.gz admin@in-vpc-bastion.internal:/opt/staging/

# 2. Extract bundle within the secure perimeter
cd /opt/staging
tar -xzvf dcouplr-airgap-bundle-v2.4.0.tar.gz
cd dcouplr-airgap-bundle-v2.4.0

# 3. Customer SecOps Cryptographic Verification
sha256sum -c SHA256SUMS
cosign verify-blob \
  --key cosign.pub \
  --signature SHA256SUMS.sig \
  SHA256SUMS

# 4. Execute Turnkey Offline Installation
chmod +x install_offline.sh
./install_offline.sh
```

The `install_offline.sh` script automates:
1. Validating all SHA-256 file hashes against `SHA256SUMS`.
2. Loading container images into the local runtime (`docker load -i images/appliance-v2.4.0.tar` or `ctr -n k8s.io images import`).
3. Applying Kubernetes Custom Resource Definitions and Network Policies.
4. Performing an in-place `helm upgrade --install` with `--set global.offline=true`.

---

### Track C: In-VPC Virtual Appliance / Bare-Metal Systemd Deployment

For enterprises deploying `<dcouplr/>` directly onto Linux virtual machines (RHEL 8/9, Rocky Linux, Ubuntu LTS) or Windows Server, updates utilize atomic directory symlink switching.

```
/opt/dcouplr/
├── releases/
│   ├── v2.3.9/                   # Previous active release (instant fallback)
│   └── v2.4.0/                   # Newly installed release
├── current ──▶ releases/v2.4.0/  # Atomic filesystem symlink
└── data/                         # Persistent Database Volume (Decoupled)
    ├── vpc_telemetry.db          # Live SQLite 3 Database
    ├── vpc_telemetry.db-wal      # Write-Ahead Log
    └── backups/                  # Pre-flight VACUUM INTO snapshots
```

#### Step-by-Step Systemd Atomic Cutover

```bash
# 1. Unpack release into dedicated versioned directory
sudo mkdir -p /opt/dcouplr/releases/v2.4.0
sudo tar -xzvf dcouplr-bin-v2.4.0.tar.gz -C /opt/dcouplr/releases/v2.4.0/

# 2. Trigger pre-upgrade database hot snapshot (Zero Downtime)
curl -X POST http://localhost:8000/v1/vpc-database/backup

# 3. Atomically switch the active release symlink
sudo ln -sfn /opt/dcouplr/releases/v2.4.0 /opt/dcouplr/current

# 4. Gracefully restart the systemd service unit
sudo systemctl reload-or-restart dcouplr.service

# 5. Verify service health and consensus
sudo systemctl status dcouplr.service
curl -s http://localhost:8000/v1/vpc-database/integrity
```

---

## Part II: Cryptographic Supply Chain Security & Provenance Attestation

Every release artifact published by `<dcouplr/>` complies with **Supply-chain Levels for Software Artifacts (SLSA) Level 3** and the **NIST Secure Software Development Framework (SSDF SP 800-218)**.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         CRYPTOGRAPHIC SUPPLY CHAIN SECURITY MATRIX                              │
├─────────────────────┬───────────────────────────┬────────────────────────────────────────────────┤
│ Security Standard   │ Artifact Produced         │ Customer Verification Utility                  │
├─────────────────────┼───────────────────────────┼────────────────────────────────────────────────┤
│ SLSA Level 3        │ `bundle.provenance.json`  │ `slsa-verifier verify-artifact` / In-toto      │
├─────────────────────┼───────────────────────────┼────────────────────────────────────────────────┤
│ CycloneDX 1.5       │ `sbom.cdx.json`           │ OWASP Dependency-Track, Grype, Trivy           │
├─────────────────────┼───────────────────────────┼────────────────────────────────────────────────┤
│ SPDX 2.3            │ `sbom.spdx.json`          │ FOSSA, Snyk, Black Duck, ISO/IEC 5962:2021     │
├─────────────────────┼───────────────────────────┼────────────────────────────────────────────────┤
│ Cosign Signatures   │ `cosign.pub`, `*.sig`     │ `cosign verify-blob`, `cosign verify`          │
├─────────────────────┼───────────────────────────┼────────────────────────────────────────────────┤
│ SHA-256 Digest Tree │ `SHA256SUMS`              │ `sha256sum -c SHA256SUMS`                      │
└─────────────────────┴───────────────────────────┴────────────────────────────────────────────────┘
```

### Pre-Admission Verification for Customer SecOps

Before permitting any `<dcouplr/>` release artifact to enter the production VPC perimeter, customer SecOps engineers can execute the following automated validation script:

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "===> [Step 1] Auditing SHA-256 Integrity"
sha256sum -c SHA256SUMS

echo "===> [Step 2] Auditing Cosign Cryptographic Signature"
cosign verify-blob \
  --key cosign.pub \
  --signature SHA256SUMS.sig \
  SHA256SUMS

echo "===> [Step 3] Auditing Software Bill of Materials (SBOM) for CVEs"
# Scan the CycloneDX SBOM against customer's private internal vulnerability database
grype sbom:sbom.cdx.json --fail-on high

echo "===> [Step 4] Auditing SLSA Level 3 Build Provenance"
jq -e '.predicate.buildType == "https://dcouplr.io/slsa/v3/builder"' bundle.provenance.json >/dev/null
echo "Verification complete: All cryptographic release invariants satisfied."
```

---

## Part III: In-VPC Database Migration & Zero Data Loss Protocol

The customer In-VPC database (`dcouplr_customer_db` SQLite 3 WAL) stores all customer-specific node inventories, VPC CIDRs, technology stack discoveries, custom threshold overrides across the 7-Tier Full-Stack Matrix, and local cryptographic license state.

Updating `<dcouplr/>` **never causes data loss, truncation, or unintended overwrites of customer operational telemetry**.

### Architectural Decoupling: Storage vs. Application Binaries

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        DECOUPLED IN-VPC PERSISTENCE TOPOLOGY                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   [ Transient Application Layer ]                   [ Persistent Storage Volume ]      │
│   • Replaced on every release                       • Preserved across all upgrades    │
│   • Docker Container / Pod / VM                     • K8s PVC / AWS EBS gp3 / NVMe SAN │
│     ┌────────────────────────┐                        ┌──────────────────────────────┐ │
│     │ <dcouplr/> v2.4.0      │                        │ /var/lib/dcouplr/data/       │ │
│     │ • FastAPI REST Engine  │                        │ ├── vpc_telemetry.db         │ │
│     │ • Invariant Calculus   │────── Mounts Path ────▶│ ├── vpc_telemetry.db-wal     │ │
│     │ • Web Consoles / Static│                        │ ├── vpc_telemetry.db-shm     │ │
│     │ • Raft State Machine   │                        │ └── backups/                 │ │
│     └────────────────────────┘                        └──────────────────────────────┘ │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Step 1: Pre-Upgrade Atomic Hot Snapshot via `VACUUM INTO`

Before any schema migration code or updated container starts, the system creates an atomic, defragmented hot snapshot of the database using SQLite's native `VACUUM INTO` engine capability.

#### Why `VACUUM INTO` is the Gold Standard for In-VPC SQLite Backups:
1. **Sub-50ms Execution:** For typical telemetry databases (100 MB – 2 GB), `VACUUM INTO` completes in under 50 milliseconds.
2. **Zero Locking on Readers or Writers:** Operating in WAL mode, `VACUUM INTO` reads a consistent point-in-time transaction page state without interrupting incoming telemetry ingestion from monitored nodes.
3. **Atomic Consistency:** The target snapshot file is guaranteed to be 100% ACID compliant and self-contained; it does not require external `-wal` or `-shm` sidecar files to be read.

#### Execution Methods:

* **Via REST API (Recommended for Automation):**
  ```bash
  curl -s -X POST http://localhost:8000/v1/vpc-database/backup
  ```
  *Response:*
  ```json
  {
    "status": "success",
    "backup_file": "vpc_telemetry_prod_backup_1793596794.db",
    "backup_path": "/var/lib/dcouplr/data/backups/vpc_telemetry_prod_backup_1793596794.db",
    "size_bytes": 151552,
    "source_db": "vpc_telemetry_prod.db",
    "created_at": 1793596794,
    "zero_downtime": true
  }
  ```

* **Via CLI (Direct SQLite Command):**
  ```bash
  sqlite3 /var/lib/dcouplr/data/vpc_telemetry.db \
    "VACUUM INTO '/var/lib/dcouplr/data/backups/vpc_telemetry_pre_upgrade_$(date +%s).db';"
  ```

---

### Step 2: Transactional, Additive-Only Schema Migrations

On application startup, `<dcouplr/>` checks the current schema version stored in the `database_metadata` table:

```sql
SELECT value FROM database_metadata WHERE key = 'schema_version';
```

If the binary's target schema version is newer than the recorded version, `<dcouplr/>` applies the incremental migrations under strict non-destructive constraints:

#### Non-Destructive DDL Invariants
1. **No `DROP TABLE` or `DROP COLUMN`:** Existing telemetry columns and historical records are never dropped.
2. **Additive Columns Only:** New metrics and attributes are added via `ALTER TABLE ... ADD COLUMN ... DEFAULT ...`.
3. **Safe Upserts for Reference Tables:** When a release introduces new monitoring tiers, new components, or new standard metric definitions to the 7-Tier Invariant Matrix, they are inserted using idempotent upsert logic:
   ```sql
   INSERT OR IGNORE INTO monitoring_matrix_metrics 
     (metric_id, component_id, tier_id, metric_name, warning_threshold, critical_threshold, unit, evaluation_window_seconds)
   VALUES 
     ('new_metric_id', 'component_id', 'tier_id', 'New Invariant Metric', 80.0, 95.0, '%', 60);
   ```
4. **Preservation of Customer Customizations:** If a customer SRE customized a threshold (e.g., changed `active_lock_contention` warning threshold from 5 to 12), the migration engine **preserves the customer's custom value**. Customer overrides are never overwritten by factory defaults.
5. **Immediate Transaction Boundary:** All DDL and DML operations execute inside a single ACID immediate transaction (`BEGIN IMMEDIATE; ... COMMIT;`). If any migration step encounters an error, the entire transaction rolls back cleanly, the database remains in its pre-upgrade state, and the application aborts boot with an explicit diagnostic error.

---

### Step 3: Post-Migration Integrity Verification (`PRAGMA integrity_check`)

Immediately following migration, `<dcouplr/>` runs an in-memory page allocation and B-tree consistency check:

```sql
PRAGMA integrity_check;
PRAGMA foreign_key_check;
```

If and only if both checks return `ok` and `0 violations`:
1. `database_metadata` updates `schema_version` to the new version string.
2. The endpoint `GET /v1/vpc-database/integrity` reports `page_verification: "PASSED"`.
3. The application signals Kubernetes readiness (`HTTP 200`).

---

## Part IV: Customer SRE Step-by-Step Upgrade Runbook

This operational runbook provides the exact, production-tested sequence for customer SREs executing an update.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             UPGRADE PHASE SEQUENCE & TIMELINE                                    │
├───────────────────┬──────────────────────────────────┬───────────────────┬───────────────────────┤
│ Phase             │ Action                           │ Duration          │ Downtime Impact       │
├───────────────────┼──────────────────────────────────┼───────────────────┼───────────────────────┤
│ Phase 0           │ Pre-Flight Verification & Quorum │ 2 minutes         │ Zero Downtime         │
│ Phase 1           │ Pre-Upgrade Hot Snapshot         │ 10 - 50 ms        │ Zero Downtime         │
│ Phase 2           │ Staging Cluster Validation       │ 10 - 30 minutes   │ Isolated Staging Only │
│ Phase 3           │ Production Rolling Deployment    │ 1 - 3 minutes     │ Zero Downtime         │
│ Phase 4           │ Post-Upgrade Health Verification │ 2 minutes         │ Zero Downtime         │
└───────────────────┴──────────────────────────────────┴───────────────────┴───────────────────────┘
```

### Phase 0: Pre-Flight Verification

Before applying any update, verify that the current cluster is healthy and has sufficient storage:

```bash
# 1. Verify Raft Consensus Quorum and Appliance Leader
curl -s http://localhost:8000/v1/telemetry | jq '.consensus'
# Expected: { "role": "LEADER", "term": 4, "quorum": "HEALTHY" }

# 2. Verify Database Health and Integrity
curl -s http://localhost:8000/v1/vpc-database/integrity | jq .
# Expected: { "status": "success", "page_verification": "PASSED" }

# 3. Check persistent storage disk capacity (Ensure >= 20% free space for snapshots)
df -h /var/lib/dcouplr/data
```

### Phase 1: Pre-Upgrade Hot Snapshot

Create a named pre-upgrade snapshot before initiating deployment:

```bash
curl -s -X POST "http://localhost:8000/v1/vpc-database/backup?target_filename=vpc_telemetry_pre_v2.4.0.db" | jq .
```

Confirm that the backup file exists and has non-zero bytes in `/var/lib/dcouplr/data/backups/`.

### Phase 2: Production Rolling Deployment

* **For Kubernetes / GitOps:**
  ```bash
  # Trigger Helm upgrade via GitOps or direct Helm CLI
  helm upgrade --install dcouplr charts/dcouplr \
    --namespace dcouplr-system \
    --values values-prod.yaml \
    --set image.tag=v2.4.0

  # Monitor the rolling pod replacement in real-time
  kubectl rollout status deployment/dcouplr-appliance -n dcouplr-system --watch
  ```

* **For Linux Virtual Appliance / Systemd:**
  ```bash
  # Atomic symlink cutover and reload
  sudo ln -sfn /opt/dcouplr/releases/v2.4.0 /opt/dcouplr/current
  sudo systemctl reload-or-restart dcouplr.service
  ```

### Phase 3: Post-Upgrade Health Verification

Execute the following verification checklist to confirm operational stability:

```bash
# 1. Verify that the appliance reports the updated release version
curl -s http://localhost:8000/v1/setup/systemd | jq '.version'

# 2. Verify SSOT database integrity
curl -s http://localhost:8000/v1/vpc-database/integrity | jq .
# Ensure: page_verification == "PASSED", foreign_key_violations == 0

# 3. Verify that monitored node census counts match pre-upgrade totals
curl -s http://localhost:8000/v1/vpc-database/info | jq '{total_vpcs, total_nodes, status}'

# 4. Verify that Zero-WAN Egress invariant is maintained ($0.00 billable transfer)
curl -s http://localhost:8000/v1/telemetry | jq '.zero_egress_proof'
```

5. **Visual UI Inspection:**
   * Open `http://localhost:8000/dashboard`: Verify License Pill reflects current node count and active license tier.
   * Open `http://localhost:8000/config`: Check the SSOT Banner displays `● SQLITE 3 WAL MODE (ONLINE)`.
   * Open `http://localhost:8000/matrix`: Confirm all 7 tiers and 127 invariant metrics are online.
   * Open `http://localhost:8000/companyadmin`: Review the SRE audit log to verify the upgrade entry.

---

## Part V: Automated Rollback & Disaster Recovery Protocol

In the unlikely event that an update fails validation, experiences an unhandled exception, or fails customer acceptance tests, `<dcouplr/>` provides a **sub-15-second deterministic rollback procedure**.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   ROLLBACK DECISION MATRIX                                       │
├───────────────────────────────┬───────────────────────────────┬──────────────────────────────────┤
│ Failure Scenario              │ Primary Rollback Action       │ Recovery Time Objective (RTO)    │
├───────────────────────────────┼───────────────────────────────┼──────────────────────────────────┤
│ Pod CrashLoop / Startup Panic │ Kubernetes Rollout Reversion  │ < 10 seconds                     │
├───────────────────────────────┼───────────────────────────────┼──────────────────────────────────┤
│ Failed Database Migration     │ Automatic Transaction Abort   │ Instantaneous (0 ms)             │
├───────────────────────────────┼───────────────────────────────┼──────────────────────────────────┤
│ Corrupted Telemetry State     │ Restore Hot Snapshot Backup   │ < 15 seconds                     │
└───────────────────────────────┴───────────────────────────────┴──────────────────────────────────┘
```

### Scenario A: Binary / Container Rollback (Standard Reversion)

Because `<dcouplr/>` database migrations are strictly additive and backward-compatible, rolling back the application binary does not require reverting the database. The previous application release (e.g., v2.3.9) can run safely against the v2.4.0 database schema without errors.

* **On Kubernetes:**
  ```bash
  kubectl rollout undo deployment/dcouplr-appliance -n dcouplr-system
  kubectl rollout status deployment/dcouplr-appliance -n dcouplr-system
  ```

* **On Virtual Appliance (Systemd):**
  ```bash
  # Re-point the symlink back to previous version directory
  sudo ln -sfn /opt/dcouplr/releases/v2.3.9 /opt/dcouplr/current
  sudo systemctl reload-or-restart dcouplr.service
  ```

---

### Scenario B: Full Disaster Recovery (Database Snapshot Restoration)

If the active database file is damaged or corrupted due to unexpected host storage failures, restore from the pre-flight snapshot taken in Phase 1:

```bash
# 1. Stop the application service
sudo systemctl stop dcouplr.service
# Or for Kubernetes: kubectl scale deployment dcouplr-appliance --replicas=0 -n dcouplr-system

# 2. Archive the suspect database file and WAL logs for forensic analysis
TIMESTAMP=$(date +%s)
mv /var/lib/dcouplr/data/vpc_telemetry.db /var/lib/dcouplr/data/vpc_telemetry_corrupted_${TIMESTAMP}.db
rm -f /var/lib/dcouplr/data/vpc_telemetry.db-wal
rm -f /var/lib/dcouplr/data/vpc_telemetry.db-shm

# 3. Restore from the pre-upgrade hot snapshot
cp /var/lib/dcouplr/data/backups/vpc_telemetry_pre_v2.4.0.db /var/lib/dcouplr/data/vpc_telemetry.db

# 4. Verify database integrity before restarting
sqlite3 /var/lib/dcouplr/data/vpc_telemetry.db "PRAGMA integrity_check;"
# Must output: ok

# 5. Restart application service
sudo systemctl start dcouplr.service
# Or for Kubernetes: kubectl scale deployment dcouplr-appliance --replicas=1 -n dcouplr-system

# 6. Verify service health
curl -s http://localhost:8000/v1/vpc-database/integrity | jq .
```

---

## Part VI: Operational REST API Reference

The following endpoints are integrated into `<dcouplr/>` to support automated in-VPC CI/CD deployment pipelines and customer observability monitors:

| Endpoint | HTTP Method | Description | Sample Output |
| :--- | :--- | :--- | :--- |
| `/v1/vpc-database/info` | `GET` | Returns engine status, SQLite version, journal mode, and active node counts | `{"status": "ONLINE", "journal_mode": "WAL"}` |
| `/v1/vpc-database/integrity` | `GET` | Executes `PRAGMA integrity_check` and `foreign_key_check` | `{"page_verification": "PASSED"}` |
| `/v1/vpc-database/backup` | `POST` | Creates an atomic, non-blocking zero-downtime hot snapshot via `VACUUM INTO` | `{"backup_file": "...db", "zero_downtime": true}` |
| `/v1/database/profile` | `GET` | Reports active database profile (`demo` vs `production`) | `{"active_profile": "production"}` |
| `/v1/database/profile/switch` | `POST` | Switches between demo simulation and production Day-0 profile | `{"status": "success", "profile": "production"}` |
| `/v1/telemetry` | `GET` | Live telemetry stream, Raft consensus status, and zero-egress attestation | `{"consensus": {"role": "LEADER", "term": 4}}` |

---

## Summary of Enterprise Governance Guarantees

1. **Deterministic Sovereign Delivery:** Updates are pulled and verified by the customer, never pushed blindly by the vendor.
2. **Mathematical Zero WAN Egress:** The appliance never dials home; zero telemetry crosses the customer's perimeter.
3. **Continuous Uptime via WAL Mode:** Database snapshots and read queries execute concurrently with zero locks.
4. **Non-Destructive Additive Evolution:** Customer node censuses and custom invariant thresholds are perpetually preserved.
5. **Cryptographic Supply Chain Traceability:** SLSA Level 3 provenance and CycloneDX/SPDX SBOMs ensure total code integrity.
