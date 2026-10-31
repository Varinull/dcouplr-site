# Operations Runbook: Cloud-Native Block Replication Staging, Host Push & Wave Cutover

**Document Identifier:** `RUNBOOK-DCOUPLR-REPL-001`  
**Classification:** Field Engineering Standard Operating Procedure (SOP)  
**Applicability:** Cloud Engineers, Migration Architects, SREs, and DevOps Operators  
**Supported Engines:** AWS Application Migration Service (MGN), Google Cloud Migrate to Virtual Machines (M4CE), Azure Migrate  
**Full Architectural Blueprint:** Available in Admin Vault at `ProjectAssistant/admin-runbooks/ADMIN-RUNBOOK-REPLICATION-MIGRATION-MASTER.md`

---

## 1. Quick Overview

`<dcouplr/>` acts as the zero-egress **Control Plane Brain** for enterprise infrastructure migrations. While native hyperscaler engines (**AWS MGN**, **GCP M4CE**, **Azure Migrate**) mirror raw disk blocks over TLS 443, `<dcouplr/>` automatically generates the surrounding infrastructure:
1. **Target Landing Zone IaC:** Generates non-overlapping VPCs, subnets, and route tables in < 15ms.
2. **Observability Transpilation:** Translates proprietary Datadog and New Relic monitors into native Prometheus alert rules.
3. **Split-Horizon DNS & IP Decoupling:** Generates eBPF diversion tables and private mesh DNS (`*.mesh.internal`).

This runbook provides step-by-step instructions on **where to get** migration staging scripts, **where to place them**, **what tools are required**, and **how to execute** the migration wave safely.

---



---

## 1.1 Dashboard Navigation Demystified: View Docs, Workflow Steps & Copy Checklist

On the `<dcouplr/>` SRE Live Telemetry Dashboard (`http://localhost:8000/dashboard`), inside the **Cloud-Native Block Replication Orchestrator** panel, operators encounter three key controls:

```text
+-----------------------------------------------------------------------------------------------+
| ⚙️ Cloud-Native Block Replication Orchestrator: Phase 1 Ready                                 |
| [📖 Engineer's Script Runbook: Where & What to Change] [RUNBOOK-DCOUPLR-REPL-001]             |
|                                                                                               |
|   [📄 View Docs]     [Show Workflow Steps]     [📋 Copy Checklist]                           |
+-----------------------------------------------------------------------------------------------+
```

### Why These Three Controls Exist and How to Use Them:

1. **`[📄 View Docs]` (Full Architectural SOP):**
   - **What it does:** Direct link opening this complete technical runbook document (`RUNBOOK-DCOUPLR-REPLICATION-MIGRATION.md`).
   - **When to use it:** When an engineer, auditor, or architect needs full technical explanations, deep architectural failure mode analysis, rollback triggers, and troubleshooting command syntax.
2. **`Show Workflow Steps` (Inline Operator Accordion):**
   - **What it does:** An interactive toggle on the dashboard that reveals an inline 5-phase execution summary right above the generated scripts.
   - **When to use it:** During live terminal execution so operators do not have to flip back and forth between multiple browser tabs while running commands.
3. **`📋 Copy Checklist` (Change Management & CAB Clipboard):**
   - **What it does:** Copies a formatted Markdown checklist of all required script parameters, file paths, and phased execution steps directly to your system clipboard.
   - **When to use it:** Paste directly into your enterprise **ServiceNow Change Request**, Jira migration ticket, or Slack incident war-room channel for full audit compliance.

---

## 1.2 Deep-Dive Parameter Matrix: Why It's There, What is the Use & Prerequisites

Operators must never blindly copy scripts. Here is the exact technical explanation of every parameter flagged by `<dcouplr/>`:

### 1. `TARGET_PROJECT` / `AWS_ACCOUNT_ID` / `AZURE_RESOURCE_GROUP`
* **Location in Script:** `provider_cli_execution_script` (top parameter block, lines 15–20).
* **Classification:** `[REQUIRED]`
* **Why It Is There:** `<dcouplr/>` generates shell commands that configure replication subnets and launch templates. However, `<dcouplr/>` cannot guess your enterprise cloud subscription or billing account number without user input.
* **What is the Technical Purpose:** Anchors the target replication engine (AWS MGN, GCP M4CE, Azure Migrate) to the correct hyperscaler tenant, preventing accidental provisioning into development or wrong organization boundaries.
* **Prerequisites to check before checking off:**
  1. The target cloud account or project ID exists and is active.
  2. Cloud CLI authentication is active with required IAM permissions:
     - **AWS:** `AWSApplicationMigrationFullAccess` (verify with `aws sts get-caller-identity`).
     - **GCP:** `roles/vmmigration.admin` (verify with `gcloud config get-value project`).
     - **Azure:** `Contributor` or `Azure Migrate Administrator` (verify with `az account show`).

### 2. `DCOUPLR_JIT_SESSION_TOKEN`
* **Location in Script:** `agent_push_script_bash` / `agent_push_script_powershell` (shell environment variable).
* **Classification:** `[REQUIRED]`
* **Why It Is There:** Hyperscaler replication agents (AWS MGN Agent, Google Migrate Agent) require a short-lived registration token to pair a source operating system with the cloud replication manager.
* **What is the Technical Purpose:** Authenticates the agent payload with the hyperscaler control plane, enabling it to stream encrypted disk changes over outbound TLS port 443 into staging storage.
* **Prerequisites to check before checking off:**
  1. Generate an ephemeral installation token from your target cloud console (e.g. AWS MGN → Settings → Initialize Service, or GCP Migrate to VMs → Sources).
  2. Export the variable in your current terminal session: `export DCOUPLR_JIT_SESSION_TOKEN="mgn-reg-token-abc123xyz"`.
  3. Confirm the token has not expired (registration tokens typically expire after 1–24 hours).

### 3. `SSH_USER` & `SSH_KEY_PATH` (Linux Fleets)
* **Location in Script:** `agent_push_script_bash` (lines 14–18).
* **Classification:** `[REQUIRED]`
* **Why It Is There:** `<dcouplr/>` automates concurrent agent installation across all source Linux VMs in the selected VPC cohort via temporary SSH connections.
* **What is the Technical Purpose:** Provides administrative credentials allowing the bootstrap script to mount the replication kernel driver (`aws-replication-agent` / `m4ce-agent`) without human intervention.
* **Prerequisites to check before checking off:**
  1. Private key permissions are locked down: `chmod 600 <path_to_key.pem>`.
  2. Smoke test SSH connectivity to at least one source Linux VM: `ssh -i $SSH_KEY_PATH $SSH_USER@<source_ip> "echo OK"`.
  3. Verify the SSH user has passwordless `sudo` privileges to execute package installations.

### 4. `$WinRMCredential` (Windows Fleets)
* **Location in Script:** `agent_push_script_powershell` (lines 18–22).
* **Classification:** `[REQUIRED]`
* **Why It Is There:** Windows servers do not natively use SSH for fleet orchestration; they utilize PowerShell Remoting over HTTPS WinRM (Port 5986).
* **What is the Technical Purpose:** Authenticates against Windows nodes to trigger `Invoke-Command`, installing the Windows Volume Shadow Copy Service (VSS) disk replication driver.
* **Prerequisites to check before checking off:**
  1. WinRM service is running on the source Windows servers (`Get-Service WinRM`).
  2. The service account belongs to the `Local Administrators` group on source servers.
  3. HTTPS port 5986 (or HTTP 5985) is temporarily reachable from your migration runner.

### 5. `TARGET_REGION`
* **Location in Script:** All scripts (top parameter block).
* **Classification:** `[AUTO-SET / OPTIONAL]`
* **Why It Is There:** Automatically populated by `<dcouplr/>` based on your migration wave topology (e.g. `us-east-1`, `us-central1`, `westeurope`).
* **What is the Technical Purpose:** Dictates the geographical destination for staging disks, VPC subnets, and compute instances.
* **Prerequisites to check before checking off:** Verify this value matches your target architecture. Only modify if executing a Disaster Recovery (DR) drill to an alternate secondary region.

### 6. `TARGET_NODES` / `$TargetNodes`
* **Location in Script:** `agent_push_script_bash` / `agent_push_script_powershell` (target array).
* **Classification:** `[AUTO-SET / OPTIONAL]`
* **Why It Is There:** Automatically populated with all discovered source IP addresses in the selected VPC.
* **What is the Technical Purpose:** Allows operators to trim down the array to test a single **Canary Host** before executing a wave push across 50+ nodes.
* **Prerequisites to check before checking off:** Confirm whether you are deploying to the entire wave cohort simultaneously or performing a pilot test on 1 or 2 canary nodes.


## 2. Tools & Prerequisites Checklist

Verify the following tools and permissions on your local workstation or bastion migration runner before proceeding:

| Category | Requirement | Verification Command | Notes / Purpose |
| :--- | :--- | :--- | :--- |
| **Command Runner** | Linux (Ubuntu, RHEL, Amazon Linux) or Windows Server | `uname -a` or `[System.Environment]::OSVersion` | Machine that orchestrates the migration dispatch. |
| **HTTP Client** | `curl` (v7.68+) or PowerShell `Invoke-WebRequest` | `curl --version` | Downloads staging scripts from `<dcouplr/>` appliance. |
| **JSON Parser** | `jq` (v1.6+) | `jq --version` | Parses migration metadata and wave outputs. |
| **Cloud CLI** | AWS CLI v2 / gcloud CLI / Azure CLI | `aws --version` / `gcloud --version` / `az --version` | Pre-stages target launch configurations and VPC bindings. |
| **OpenSSH Client** | `ssh` (v8.0+) | `ssh -V` | Pushes JIT agent bootstrap to Linux hosts (Port 22). |
| **PowerShell Core** | `pwsh` (v7.2+) | `pwsh --version` | Pushes JIT agent bootstrap to Windows hosts via WinRM (Port 5986). |
| **Network Egress** | Outbound TCP Port `443` | `nc -zv mgn.us-east-1.amazonaws.com 443` | Source servers need outbound port 443 to provider endpoints. **Zero inbound ports required.** |
| **IAM Privileges** | Target Cloud Migration Admin | `aws sts get-caller-identity` | Requires `AWSApplicationMigrationFullAccess`, GCP `roles/vmmigration.admin`, or Azure `Contributor`. |

---

## 3. Where to Get It (Artifacts & Staging Scripts)

All migration staging and host push scripts are compiled directly inside volatile memory by `<dcouplr/>`. Retrieve them using one of the following methods:

### Method A: Direct In-VPC Download (Recommended)
Download directly from your running `<dcouplr/>` in-VPC appliance:

```bash
# 1. Provider CLI Staging Script (AWS MGN, GCP M4CE, or Azure Migrate)
curl -sSL http://127.0.0.1:8000/v1/migration/scripts/provider_cli_staging.sh -o ./provider_cli_staging.sh

# 2. Linux SSH Agent Push Script (Ephemeral JIT Port 22)
curl -sSL http://127.0.0.1:8000/v1/migration/scripts/agent_push_ssh.sh -o ./agent_push_ssh.sh

# 3. Windows WinRM Agent Push Script (Ephemeral JIT HTTPS WinRM)
curl -sSL http://127.0.0.1:8000/v1/migration/scripts/agent_push_winrm.ps1 -o ./agent_push_winrm.ps1
```

### Method B: Extract from Offline Enterprise Bundle
If operating in a fully air-gapped subnet without HTTP access to port 8000:
```bash
# Extract pre-compiled scripts from local release archive
tar -zxvf /opt/dcouplr/dcouplr-enterprise-v1.0.0.tar.gz -C ./ scripts/
```

---

## 4. Where to Put It (Target Destination Paths & Permissions)

Place all staging and execution scripts in the designated deployment directories with strict filesystem access controls:

### On the Migration Runner / Bastion Host:

```
/opt/dcouplr/migration/
├── provider_cli_staging.sh      (Permissions: chmod 700, Owner: $USER)
├── agent_push_ssh.sh            (Permissions: chmod 700, Owner: $USER)
├── agent_push_winrm.ps1         (Permissions: chmod 700, Owner: $USER)
└── target_launch_template.json  (Permissions: chmod 600, Owner: $USER)
```

#### Windows Runner Path:
```powershell
New-Item -ItemType Directory -Path "C:\dcouplr\migration" -Force
Move-Item -Path ".\agent_push_winrm.ps1" -Destination "C:\dcouplr\migration\"
```

#### Linux Setup Command:
```bash
sudo mkdir -p /opt/dcouplr/migration
sudo chown -R $USER:$USER /opt/dcouplr/migration
chmod 700 /opt/dcouplr/migration
cd /opt/dcouplr/migration
```

> [!IMPORTANT]
> **No Permanent Footprint on Source Servers:** The replication agent bootstrap runs ephemerally. Once registered with your target cloud provider, all temporary bootstrap scripts are purged automatically via `trap cleanup EXIT`.

---



---

## 4.1 Monitoring Lift-and-Shift Packaging & Target Movement Pipeline

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│               MONITORING LIFT-AND-SHIFT PACKAGING & TARGET TRANSIT FLOW                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. INGESTION & PARSING   --> Extracts source monitors (Datadog, New Relic, Dynatrace,  │
│                              Splunk, CloudWatch, Azure Monitor, Prometheus).           │
│ 2. AST RECALIBRATION     --> Transpiles to PromQL & recalibrates downscaled hardware.  │
│ 3. PHASE 2 PACKAGING     --> Sealed into 'monitoring-bundle-<target_vpc>.tar.gz'.      │
│ 4. PRIVATE TRANSIT       --> Moved via VPC Peering, DirectConnect, or S3 VPC Endpoint. │
│ 5. SHADOW RUN ON TARGET  --> Deployed on target in shadow mode (dual-run validation).  │
│ 6. FINAL CUTOVER HOOK    --> Promoted to primary target alerting upon DNS switch.      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### When is Monitoring Configuration Packaged?
Packaging occurs during **Phase 2 (Pre-Cutover Preparation / Migration Wave Staging)**—well *before* any compute cutover is initiated:
1. Operator runs `dcouplr migrate-monitoring --source <vendor> --target-vpc <vpc_id> --target-cloud <cloud> --package` or triggers `POST /v1/telemetry/monitoring/migrate`.
2. `<dcouplr/>` parses source monitors into Unified Intermediate Telemetry Representation (UIT-IR).
3. Dynamic Hardware Recalibration scales down fixed thresholds (e.g. 32 GB RAM downscaled to 16 GB VM) to eliminate false alert paging.
4. Generates sealed tarball: `monitoring-bundle-<target_vpc>.tar.gz`.

### How Do We Move That to the New Target VPC?
To ensure **$0.00 cloud egress**, the package is moved via one of three private transit paths:
1. **Option A (Private Cloud Transit / VPC Peering / DirectConnect):** Direct bastion-to-bastion transfer (`scp -i target_bastion.pem ./monitoring-bundle-<vpc>.tar.gz user@10.100.1.10:/opt/dcouplr/`).
2. **Option B (Private Object Storage via VPC Endpoint):** Staged in S3/GCS via private Gateway Endpoint ($0 egress) and pulled onto target nodes.
3. **Option C (Internal Enterprise GitOps):** Committed to internal GitLab/GitHub and reconciled into the target cluster via ArgoCD/Flux.

### How is it Unpacked and Armed on Target?
```bash
cd /opt/dcouplr
tar -zxvf monitoring-bundle-<target_vpc>.tar.gz
cd monitoring-bundle-<target_vpc>
./scripts/deploy-target-monitoring.sh
```
This deploys the in-VPC OpenTelemetry Collector, Prometheus rules, and Grafana dashboards in **Shadow Mode**, running dual-stack verification against source metrics for 48–72 hours prior to cutover.


## 5. Step-by-Step Implementation Procedure

Follow this sequential procedure to execute a migration wave:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      MIGRATION WAVE EXECUTION STEPS                      │
├─────────┬───────────────────────────────┬────────────────────────────────┤
│ Step 1  │ Configure Environment & JIT   │ Export API tokens & target IDs │
│ Step 2  │ Run Provider Staging Script   │ Pre-stage VPCs & templates     │
│ Step 3  │ Dispatch Agent Bootstrap      │ Push agent to source servers   │
│ Step 4  │ Monitor Replication Sync      │ Verify lag < 60 seconds        │
│ Step 5  │ Execute Synchronized Cutover  │ Final delta flush & DNS switch │
└─────────┴───────────────────────────────┴────────────────────────────────┘
```

### Step 1: Export Target Cloud Credentials & JIT Session Token

In your migration runner terminal, export the necessary credentials. **Never hardcode credentials in script files.**

```bash
# For AWS MGN Target:
export AWS_REGION="us-east-1"
export AWS_DEFAULT_REGION="us-east-1"
export DCOUPLR_JIT_SESSION_TOKEN="mgn-reg-token-abc123xyz"
export SSH_USER="ubuntu"
export SSH_KEY_PATH="$HOME/.ssh/migration_bastion_key.pem"

# For GCP M4CE Target:
export CLOUDSDK_CORE_PROJECT="migrated-workloads-prod"
export CLOUDSDK_COMPUTE_REGION="us-central1"
export DCOUPLR_JIT_SESSION_TOKEN="gcp-m4ce-install-token"
```

### Step 2: Execute Provider CLI Staging Script

Run the staged launch configuration script to initialize the target cloud replication environment:

```bash
chmod +x ./provider_cli_staging.sh
./provider_cli_staging.sh
```

**Expected Console Output:**
```text
[INFO] <dcouplr/> Migration Engine v1.0.0
[INFO] Validating AWS API connection in region us-east-1... OK
[INFO] Verifying target VPC vpc-0a1b2c3d4e5f6... Verified
[INFO] Synthesizing non-overlapping subnets (10.100.0.0/24)... OK
[INFO] Registering AWS MGN Replication Launch Template: lt-0987654321fedcba... Created
[SUCCESS] Provider Staging Complete. Ready for Agent Dispatch.
```

### Step 3: Dispatch Ephemeral Agent Bootstrap

Push the replication agent to the fleet of source servers:

#### For Linux Fleets (via SSH):
```bash
chmod +x ./agent_push_ssh.sh
./agent_push_ssh.sh
```

**Expected Console Output:**
```text
[DISPATCH] Starting concurrent bootstrap across 12 source Linux nodes...
[NODE 10.0.1.15] JIT SSH port open -> Uploading agent installer... Done.
[NODE 10.0.1.15] Installing AWS Replication Agent in quiet mode... Installed.
[NODE 10.0.1.15] TLS 443 outbound stream active. Closing JIT SSH port.
[NODE 10.0.1.16] JIT SSH port open -> Uploading agent installer... Done.
[NODE 10.0.1.16] Installing AWS Replication Agent in quiet mode... Installed.
[SUCCESS] All 12 Linux nodes registered. Security teardown completed.
```

#### For Windows Fleets (via WinRM):
```powershell
pwsh -File ./agent_push_winrm.ps1
```

### Step 4: Monitor Continuous Replication Lag & Baseline Sync

Continuous block replication begins immediately. Monitor the replication sync until lag drops below 60 seconds:

```bash
# Query replication state on AWS MGN:
aws mgn describe-source-servers \
  --query 'items[*].{ServerID:sourceServerID,Hostname:identificationHints.hostname,Status:dataReplicationInfo.dataReplicationState,Lag:dataReplicationInfo.lagDuration}' \
  --output table
```

**Expected Console Output:**
```text
-------------------------------------------------------------------------------------
|                               DescribeSourceServers                               |
+----------------------+--------------------+---------------------+-----------------+
|       Hostname       |       Lag          |      ServerID       |     Status      |
+----------------------+--------------------+---------------------+-----------------+
|  app-server-prod-01  |  0.42s             |  s-1234567890abcdef |  CONTINUOUS     |
|  app-server-prod-02  |  0.38s             |  s-abcdef1234567890 |  CONTINUOUS     |
|  db-server-prod-01   |  0.89s             |  s-567890abcdef1234 |  CONTINUOUS     |
+----------------------+--------------------+---------------------+-----------------+
```

> [!IMPORTANT]
> **Cutover Ready Condition:** Do NOT initiate cutover until `Status` displays `CONTINUOUS` and `Lag` is **< 60 seconds**.

### Step 5: Execute Synchronized Cutover Hook

When your maintenance window opens:

```bash
# 1. Initiate final delta block flush
aws mgn start-cutover --source-server-ids "s-1234567890abcdef" --region "us-east-1"

# 2. Switch In-VPC Split-Horizon DNS to target cloud instances
dcouplr-cli dns switch --zone mesh.internal --apply-records

# 3. Arm Open-Source Monitoring & Alert Rules (Zero Observability Blind Spots)
kubectl apply -f /opt/dcouplr/migration/alertmanager_rules.yaml
```

---

## 6. Verification & What to Look Out For

Once cutover completes, perform these three mandatory operational health checks:

1. **Service Port Reachability:**
   ```bash
   curl -I http://app.mesh.internal:8080/health
   # Expected: HTTP/1.1 200 OK
   ```
2. **Prometheus Alerting Ingestion:**
   ```bash
   curl -s http://127.0.0.1:9090/api/v1/rules | jq '.data.groups[].rules[].name'
   # Expected: Transpiled Datadog rules are active in Prometheus
   ```
3. **WAN Egress Attestation:**
   ```bash
   curl -s http://127.0.0.1:8000/v1/telemetry/metrics | jq '.egress_attestation'
   # Expected: { "status": "ZERO_EGRESS_VERIFIED", "wan_fees": "$0.00" }
   ```

---

## 7. Disconnection & Fast Recovery (Troubleshooting)

| Failure Mode | Root Cause | Immediate Remediation Command |
| :--- | :--- | :--- |
| **Agent Bootstrap Connection Timed Out** | Local firewall (`iptables` / Windows Defender) blocking JIT SSH/WinRM. | Add temporary host allowlist rule: `sudo iptables -I INPUT -p tcp --dport 22 -s <bastion-ip> -j ACCEPT` |
| **Replication Lag Stalls (> 5 min)** | Source disk write throughput exceeds network upload rate. | Exclude non-critical swap/temp directories in provider replication settings. |
| **Target Cloud Instance Fails Boot** | Missing hypervisor drivers (virtio / ENA) in source kernel. | `<dcouplr/>` auto-injects drivers in launch template: verify `EnableInstanceMetadataTags=true`. |
| **Emergency Abort & Rollback** | Target application fails smoke testing. | Revert DNS immediately: `dcouplr-cli dns switch --zone mesh.internal --revert`. Source servers were never modified and remain intact. |
