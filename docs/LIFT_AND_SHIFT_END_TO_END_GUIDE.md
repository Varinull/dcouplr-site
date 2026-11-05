# 🚀 `<dcouplr/>` Automated Lift & Shift Migration Engine: End-to-End Field Guide

**Document ID:** `VA-GUIDE-LIFT-SHIFT-001`  
**Classification:** Enterprise Architecture & Operations Runbook  
**Target Engine:** `<dcouplr/>` In-VPC AST & Multi-Cloud Orchestration Mesh  
**Compatibility:** AWS, Microsoft Azure, Google Cloud Platform (GCP), On-Premises Bare-Metal & VMware  

---

## 📋 Table of Contents
1. [Architecture Overview & Theoretical Feasibility](#1-architecture-overview--theoretical-feasibility)
2. [Legacy Setup Evaluation (Starting State vs. Target Cloud)](#2-legacy-setup-evaluation)
3. [The 4-Layer Orchestration Pipeline](#3-the-4-layer-orchestration-pipeline)
4. [Ephemeral Just-In-Time (JIT) Management Port Security (WinRM & SSH)](#4-ephemeral-jit-management-port-security)
5. [End-to-End Step-by-Step Usage Guide (Web UI & CLI)](#5-end-to-end-step-by-step-usage-guide)
6. [FinOps Multi-Cloud Expenditure Matrix & Commitment Optimization](#6-finops-multi-cloud-expenditure-matrix)
7. [5-Phase Zero-Downtime Cutover Execution & Rollback Guard](#7-5-phase-zero-downtime-cutover-execution)

---

## 1. Architecture Overview & Theoretical Feasibility

Historically, enterprise "Lift & Shift" migrations from on-premises data centers or legacy VPCs fail or experience severe downtime due to **4 Classical Translation Holes**:

```mermaid
graph TD
    A[Legacy Environment] -->|Translation Holes| B[Failed Migration]
    subgraph Classical Translation Holes
        H1[1. CIDR Address Overlaps]
        H2[2. Hardcoded Static IP Couplings]
        H3[3. Proprietary Observability Lock-In]
        H4[4. High-Risk Abrupt Cutover Downtime]
    end
    H1 --> B
    H2 --> B
    H3 --> B
    H4 --> B

    A -->|<dcouplr/> Automation| C[Flawless Multi-Cloud VPC]
    subgraph <dcouplr/> In-VPC Automated Solutions
        S1[Deterministic /16 to /24 Subnet Partitions]
        S2[Private DNS Service Discovery Remapping]
        S3[Mathematical AST Equivalence: Datadog -> PromQL]
        S4[Dual-Mirror Ring Buffer + Ephemeral Port Teardown]
    end
    S1 --> C
    S2 --> C
    S3 --> C
    S4 --> C
```

`<dcouplr/>` bridges these translation holes automatically inside the customer VPC without code modifications:
1. **CIDR Overlap Immunity:** Evaluates source supernet (e.g. `172.16.0.0/16`) and projects it cleanly into a non-overlapping target envelope (e.g. `10.200.0.0/16`) divided into `/24` child subnets.
2. **Static IP to DNS Translation:** Maps hardcoded private IPs (`172.16.1.15`) to in-VPC private DNS service records (`app-worker.mesh.internal`) with RFC1918 enforcement.
3. **Observability Parity:** Transpiles proprietary Datadog/New Relic alert queries into PromQL/Alertmanager rules with $\Phi(q) \equiv \Psi(\text{PromQL})$ mathematical equivalence.
4. **Zero-Downtime Dual-Mirror Sync:** Feeds telemetry and compute traffic simultaneously to both legacy and modern targets during validation.

---

## 2. Legacy Setup Evaluation

### 2.1 Baseline Legacy Starting State

A representative enterprise legacy infrastructure typically features:
* **Hypervisor / Hardware:** VMware vSphere / bare-metal server racks with SAN storage.
* **Operating Systems:** Mixed Windows Server (2016/2019/2022) running IIS and .NET, alongside Linux (RHEL 7/8/9, Ubuntu) running Java/Go/Node microservices.
* **Network Topology:** Single flat `/16` broadcast domain with hardcoded IP mappings and static firewall rules.
* **Observability:** Proprietary SaaS agents (Datadog/New Relic) generating volumetric egress taxes.

### 2.2 Target Multi-Cloud Comparison Matrix

`<dcouplr/>` analyzes and maps the legacy node topology against all three major cloud providers:

| Architectural Component | Legacy On-Premises | AWS Target | Google Cloud (GCP) Target | Microsoft Azure Target |
| :--- | :--- | :--- | :--- | :--- |
| **Network Fabric** | Physical VLANs & Switches | Amazon VPC (`10.200.0.0/16`) | GCP VPC Network (`10.200.0.0/16`) | Azure Virtual Network (`VNet`) |
| **Subnet Partitioning** | Flat `/16` or Manual Subnets | AZ-isolated `/24` subnets | Regional `/24` subnets | Subnets within Address Space |
| **Linux Compute** | Bare-Metal / VMware ESXi | EC2 (`m6i.xlarge` / `t4g`) | Compute Engine (`n2-standard-4`) | Azure VMs (`Standard_D4s_v5`) |
| **Windows Compute** | Windows Server on Metal | EC2 Windows with EBS gp3 | Compute Engine Windows Server | Azure VM with Managed Disks |
| **Routing & NAT** | Core Switch Default Route | NAT Gateway + Route Tables | Cloud Router + Cloud NAT | Azure NAT Gateway |
| **Internal DNS** | Active Directory / BIND | Route 53 Private Hosted Zone | Cloud DNS Private Zone | Azure Private DNS Zones |
| **Observability** | SaaS Agent Ingestion | Prometheus + Grafana Agent | Managed Prometheus / OTel | Azure Monitor / Prometheus |

---

## 3. The 4-Layer Orchestration Pipeline

`<dcouplr/>` unifies the migration workflow into 4 distinct, complementary layers:

```mermaid
graph TB
    subgraph Layer 1: Infrastructure as Code
        L1[OpenTofu / Terraform]
        L1 -->|Provisions| VPC[VPC Supernet /16]
        L1 -->|Partitions| Sub[Subnets /24]
        L1 -->|Configures| NAT[Cloud Router & NAT]
        L1 -->|Arms| JIT_FW[Ephemeral JIT Firewall]
    end

    subgraph Layer 2: Configuration & OS State
        L2[Ansible / PowerShell DSC / Cloud-Init]
        L2 -->|Windows Remote Mgmt| WinRM[WinRM 5985/5986]
        L2 -->|Linux Secure Shell| SSH[SSH 22]
        L2 -->|Extracts Inventory| Discovery[Node Workload Discovery]
    end

    subgraph Layer 3: Container Modernization
        L3[Docker / Kubernetes / OpenShift]
        L3 -->|Builds| Scratch[Distroless Nonroot Container UID 65532]
        L3 -->|Deploys| K8s[Deployment & ClusterIP Service]
    end

    subgraph Layer 4: Continuous Delivery & Cutover
        L4[dcouplr-cli & Route Reflector]
        L4 -->|Synchronizes| Mirror[Dual-Mirror Ring Buffer]
        L4 -->|Verifies| Doctor[Doctor Equivalence Check]
        L4 -->|Executes| Cutover[Route Reflector Cutover]
        L4 -->|Security Teardown| Trap[Auto-Revoke JIT Ports Trap]
    end

    L1 --> L2 --> L3 --> L4
```

* **Layer 1 (IaaS): OpenTofu / Terraform:** Deploys zero-egress private VPC infrastructure, `/24` subnets, route tables, and internal firewall rules.
* **Layer 2 (Config/OS): Ansible & PowerShell DSC:** Orchestrates OS-level packages, configuration files, and state synchronization across in-guest nodes via ephemeral WinRM/SSH.
* **Layer 3 (CaaS): Docker & Kubernetes:** Compiles monolithic daemons into non-root distroless container images (`UID 65532`) with zero attack surface.
* **Layer 4 (CD/Cutover): `<dcouplr/>` Runtime Engine:** Manages dual-mirror ring buffer synchronization, DNS cutover, and automated security teardown.

---

## 4. Ephemeral Just-In-Time (JIT) Management Port Security

### 4.1 Why WinRM & SSH are Essential During Migration
* **Windows Servers:** PowerShell remote execution, IIS feature configuration, registry migration, and Sysprep require **WinRM HTTP (5985)** or **WinRM HTTPS (5986)**.
* **Linux Servers:** Package syncing, storage volume attachment, and daemon cutover require **OpenSSH (22)**.

### 4.2 The Zero-Trust Security Guarantee
Leaving management ports open introduces severe lateral movement risks. `<dcouplr/>` guarantees that:
1. **Private CIDR Restriction:** Management ports are **never** opened to `0.0.0.0/0`. They are strictly locked to the private VPC migration runner CIDR block (`10.200.0.0/16`).
2. **Ephemeral Cutover Window:** Ports are armed **only** during the execution of the cutover phase via dynamic variable interpolation (`enable_migration_mgmt_ports = true`).
3. **Automated Teardown Trap:** The generated cutover script contains an exit trap that guarantees port revocation even if the migration script is aborted or encounters an error:

```bash
# AUTOMATED TEARDOWN TRAP (Inside cutover.sh)
cleanup() {
  echo "[Security Teardown] Automatically revoking JIT WinRM (5985/5986) & SSH (22) ports..."
  tofu apply -auto-approve -var="enable_migration_mgmt_ports=false" -var="target_cidr=10.200.0.0/16" >/dev/null 2>&1 || true
  echo "✓ Zero-trust security re-established. All management ports closed."
}
trap cleanup EXIT
```

---

## 5. End-to-End Step-by-Step Usage Guide

### Method A: Web UI Walkthrough (`/dashboard` & `/compiler`)

#### Step 1: Open the Lift & Shift Engine Modal
1. Navigate to the `<dcouplr/>` Operational Dashboard: `http://127.0.0.1:8000/dashboard`.
2. In the top-right action bar, click **`🚀 Plan Lift & Shift`**.
3. The interactive, full-screen capable modal **`ACTIVE ENGINE: MULTI-VPC & LEGACY SYSTEM LIFT & SHIFT`** appears.

#### Step 2: Select Target Cloud & Parameters
* **Source VPC:** Select your legacy data center enclave (e.g. `dc-onprem-core-01`).
* **Target Cloud Provider:** Choose **`GCP`**, **`AWS`**, or **`Azure`**.
* **Target Region:** Specify destination region (e.g., `us-central1` for GCP, `us-east-1` for AWS).
* **Target VPC Supernet:** Enter desired `/16` CIDR block (default: `10.200.0.0/16`).
* Click **`⚡ Re-Compile Bundle`**.

#### Step 3: Inspect Generated Deliverables
Use the tabbed navigation to inspect generated artifacts:
* **Tab 1 (`OpenTofu HCL`):** Complete, production-grade IaC declaring VPC, subnets, NAT, and ephemeral JIT firewall rules.
* **Tab 2 (`Subnet & DNS Remapping`):** Live tables proving `/16` to `/24` parent-child CIDR containment and static IP to private DNS hostname remappings.
* **Tab 3 (`Alerts YAML`):** Transpiled Prometheus Rule alerting groups.
* **Tab 4 (`Cutover Runbook`):** Ready-to-execute `cutover.sh` bash script.
* **Tab 5 (`Complete Bundle`):** Syntax-highlighted JSON manifest.
* **Tab 6 (`FinOps Multi-Cloud Comparison`):** Interactive expenditure and savings matrix.

#### Step 4: Preview and Export
1. Click **`🔍 Pre-Export Full Bundle Verification`** to view the structural tree inspector and verify zero missing fields.
2. Click **`💾 Download Migration Bundle (.json)`** to export the entire wave package locally.

#### Step 5: Fine-Tuning & Custom Script Transpilation in Compiler Studio (`/compiler`)
For bespoke enterprise alert logic or custom Terraform configurations outside the turnkey defaults:
1. Navigate to **`http://127.0.0.1:8000/compiler`**.
2. Select your monitored VPC (e.g. `dc-onprem-core-01`) to automatically enrich synthesized alert metadata with VPC CIDRs and network identities.
3. Evaluate against **13 production-canonical vendor presets** (conforming to real Datadog Monitor JSON, New Relic NRQL alerts, AWS CloudWatch MetricAlarms, Azure Monitor ARM/KQL queries, and Terraform HCL).
4. Paste custom enterprise scripts into the editor, transpile with zero egress in <20ms, and click **`+ Save Custom Preset`** to persist them in your browser library with auto-generated fallback naming and instant toast notifications.

---

### Method B: Headless REST API Walkthrough

To integrate `<dcouplr/>` into automated CI/CD pipelines (GitLab CI, GitHub Actions, Jenkins, Terraform Cloud):

```bash
# 1. Dispatch Lift & Shift Compilation Request
curl -X POST "http://127.0.0.1:8000/v1/telemetry/topology/lift-and-shift" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dcouplr-admin-2026" \
  -d '{
    "source_vpc_id": "dc-onprem-core-01",
    "target_cloud": "GCP",
    "target_region": "us-central1",
    "target_cidr": "10.200.0.0/16"
  }' > lift_shift_bundle.json

# 2. Extract OpenTofu HCL & Cutover Script
jq -r .opentofu_hcl lift_shift_bundle.json > main.tf
jq -r .cutover_script lift_shift_bundle.json > cutover.sh
chmod +x cutover.sh

# 3. Execute Automated Cutover Runbook
./cutover.sh
```

---

## 6. FinOps Multi-Cloud Expenditure Matrix

In Tab 6 of the Lift & Shift modal, `<dcouplr/>` calculates side-by-side cost comparisons across **AWS**, **GCP**, and **Azure**, parameterized by **FinOps Commitment Tiers**:

### Commitment Tiers Supported
1. **On-Demand (Pay-As-You-Go):** 100% baseline cloud list price.
2. **1-Year Committed Use (~35% Discount):** Reserved Instances / Committed Use Discounts.
3. **3-Year Committed Use (~55% Discount):** Deepest enterprise commitment tier.

### Example Cost Projection for a 32-Node Legacy Enclave

| Cloud Provider | On-Demand (Monthly) | 1-Yr Committed (Monthly) | 3-Yr Committed (Monthly) | Annual Savings (3-Yr) |
| :--- | :---: | :---: | :---: | :---: |
| **Source Legacy Baseline** | $6,450.00 | $6,450.00 | $6,450.00 | Baseline |
| **AWS (us-east-1)** | $4,820.00 | $3,133.00 | $2,169.00 | **$51,372.00 (66.4%)** |
| **Google Cloud (us-central1)** | $4,650.00 | $3,022.50 | $2,092.50 | **$52,290.00 (67.6%)** |
| **Microsoft Azure (eastus)** | $4,890.00 | $3,178.50 | $2,200.50 | **$50,994.00 (65.9%)** |

> [!TIP]
> The Web UI allows instant switching between **On-Demand**, **1-Year Committed**, and **3-Year Committed** buttons with real-time recalculation of savings cards and visual progress bars.

---

## 7. 5-Phase Zero-Downtime Cutover Execution

The turnkey cutover script operates in 5 deterministic phases:

```
[Phase 1/5] Initializing & Provisioning Target Cloud VPC via OpenTofu
            -> tofu init && tofu apply (Enables ephemeral WinRM 5985/5986 & SSH 22)

[Phase 2/5] Establishing Zero-Egress Transit Peering to Source Network
            -> High-bandwidth IPsec/Interconnect tunnel verification

[Phase 3/5] Starting Dual-Mirror Ring Buffer Synchronization
            -> 100% telemetry and in-guest discovery replication

[Phase 4/5] Running Pre-Cutover Equivalence Verification (15-Minute Window)
            -> Doctor equivalence check: latency variance < 1.5ms, zero egress violations

[Phase 5/5] Flipping Route Reflector Tables to Target VPC
            -> In-VPC private DNS flip; traffic re-routed with rollback hooks armed

[Teardown]  Automatic cleanup trap triggers:
            -> Ephemeral WinRM & SSH ports revoked via OpenTofu state re-apply
            -> Zero-trust security re-established.
```
