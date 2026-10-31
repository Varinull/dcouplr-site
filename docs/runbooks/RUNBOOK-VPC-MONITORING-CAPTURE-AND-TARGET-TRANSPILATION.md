# <dcouplr/> Engineering SOP & Architecture Guide: In-VPC Monitoring Capture, Cross-Vendor AST Transpilation & Target VPC Deployment

**Document ID:** `VA-SOP-VPC-MONITOR-MIGRATION-001`  
**Classification:** Standard Operating Procedure (SOP) / Field Engineering & System Architecture  
**Version:** `2.0.0 GA`  
**Date:** October 28, 2026  
**Status:** Approved for Production Migration Operations  
**Audience:** Site Reliability Engineers (SRE), Cloud Architects, DevOps Engineers, NOC Operators, and FinOps Practitioners  

---

## Executive Overview & Architectural Invariants

When enterprise workloads migrate across VPCs, clouds, or on-premises boundaries, traditional operations teams spend **3 to 8 weeks manually rewriting monitoring rules, alert thresholds, and dashboard expressions** from proprietary vendor syntax (Datadog JSON monitors, New Relic NRQL, AWS CloudWatch alarms, Azure Monitor KQL, Splunk SPL) into open cloud-native standards (Prometheus, Grafana 10+, OpenTofu HCL, Azure Bicep).

`<dcouplr/>` eliminates manual rewrites through an **automated in-memory AST (Abstract Syntax Tree) pipeline**:

```
+─────────────────────────────────────────────────────────────────────────────────────────────────────+
│                                    PRIVATE VPC BOUNDARY (ZERO WAN EGRESS)                           │
│                                                                                                     │
│  [Source VPC Inventory]                                                                             │
│  - Compute Nodes & Subnets                                                                          │
│  - Multi-Tool Active Monitors (Datadog, CloudWatch, Prometheus, Dynatrace, New Relic)               │
│           │                                                                                         │
│           ▼                                                                                         │
│  GROUP 3: "Capture VPC Monitors"  ──▶ Discovers multi-tool inventory in volatile RAM (< 15ms)        │
│           │                           Organizes 30 monitors into 3 Groups (10 Infra, 10 App, 10 SRE)│
│           ▼                                                                                         │
│  GROUP 4: "Load into Editor"      ──▶ Injects all 30 JSON monitors into Source Studio Editor        │
│           │                           4-Point Cross-Validation across Badges & Target Manifests     │
│           ▼                                                                                         │
│  GROUP 5: Select "TARGET" Tool    ──▶ Selects Grafana 10+, Prometheus, OpenTofu, or <dcouplr/> AST  │
│           │                                                                                         │
│           ▼                                                                                         │
│  GROUP 6: "Metric & CIDR Remap"   ──▶ Scrubs RFC 1918 IPs, maps metrics to target VPC topology      │
│           │                                                                                         │
│           ▼                                                                                         │
│  GROUP 6: "Compile AST" (⌘↵)      ──▶ Translates query math & thresholds in volatile RAM (< 20ms)   │
│           │                                                                                         │
│           ▼                                                                                         │
│  GROUP 6: "Download & Deploy"     ──▶ Generates validated production manifests for target VPC       │
│           │                                                                                         │
│           ▼                                                                                         │
│  [Target Modernized VPC]          ──▶ `kubectl apply -f rules.yaml` or `tofu apply` ($0 Egress)     │
+─────────────────────────────────────────────────────────────────────────────────────────────────────+
```

### Architectural Guarantees & Invariants
1. **Volatile RAM Only (Zero Disk):** Raw monitor payloads, query strings, and threshold configurations are processed strictly in volatile RAM. No secrets, credentials, or metrics touch persistent host disk.
2. **Zero WAN Egress ($0.00 Egress Fees):** Outbound WAN sockets (`0.0.0.0/0`) are mathematically blocked. No telemetry or configuration logic leaves the private VPC perimeter.
3. **Mathematical Parity Verification:** The compiler validates query equivalence ($\Phi(q) \equiv \Psi(\text{Target})$) to guarantee zero alert silence or false alarms post-migration.

---

## GROUP 1: Architectural Separation of Concerns (Compiler Studio vs. Operational Dashboard)

To ensure operational clarity across teams, `<dcouplr/>` draws a strict, non-overlapping boundary between the **Compiler Studio** and the **Operational Dashboard**:

```
┌────────────────────────────────────────────────────────┐
│             <dcouplr/> System Architecture             │
├───────────────────────────┬────────────────────────────┤
│   COMPILER STUDIO         │   OPERATIONAL DASHBOARD    │
│   (/compiler)             │   (/dashboard & /v2)       │
├───────────────────────────┼────────────────────────────┤
│ • AST Code Transpilation  │ • Live Topology Mapping    │
│ • Volatile RAM Sandboxing │ • Cluster Consensus (Raft) │
│ • Metric Remapping        │ • Sub-ms Latency Metrics   │
│ • Target Manifest Export  │ • FinOps & Licensing Quotas│
│   (Code & Rule Level)     │   (Fleet & Network Level)  │
└───────────────────────────┴────────────────────────────┘
```

### 1.1 Responsibility Matrix

| Capability / Responsibility | Compiler Studio (`/compiler`) | Operational Dashboard (`/dashboard` & `/v2`) |
| :--- | :---: | :---: |
| **Primary Plane** | **Code & Syntax Transpilation** | **Operations & Telemetry Fleet** |
| **Primary Personas** | Migration Engineers, DevOps, SREs | Lead Architects, NOC Operators, FinOps |
| **Operational Scope** | Single VPC or rule payload (code-level) | Global multi-cloud estate (fleet-level) |
| **AST Parsing & Code Synthesis** | **YES** ($\le 20\text{ ms}$, in-memory) | **NO** (Displays metrics & health only) |
| **Live Multi-VPC Network Map** | **NO** (Scoped to selected VPC only) | **YES** (Interactive AWS/Azure/GCP/OnPrem graph) |
| **Metric Remapping Table** | **YES** (Alias overrides & tag edits) | **NO** |
| **Raft Consensus Health & WAL** | **NO** | **YES** (Leader election, quorum, WAL sync) |
| **Commercial License Quota / FinOps**| **NO** (Gate enforcement only) | **YES** (Node capacity calculator, proration) |
| **Manifest Export (`.yaml`, `.tf`)** | **YES** (1-click download & copy) | **NO** |

---

## GROUP 2: Presets Architecture & Classification System

The `<dcouplr/>` preset engine is partitioned into three distinct tiers:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          <dcouplr/> PRESETS TAXONOMY                            │
├──────────────────────┬────────────────────────────┬─────────────────────────────┤
│ 1. BUILT-IN GOLDEN   │ 2. LIVE CAPTURED VPC       │ 3. USER-SAVED CUSTOM        │
│    REFERENCE PRESETS │    BUNDLE PRESET           │    ENTERPRISE PRESETS       │
├──────────────────────┼────────────────────────────┼─────────────────────────────┤
│ • Pre-packaged       │ • Generated dynamically    │ • Created by engineer via   │
│   industry standards │   when capturing a VPC     │   "+ Save Custom" button    │
│ • Universal samples: │ • Named:                   │ • Persisted in local memory │
│   Datadog, NRQL,     │   "⚡ Captured VPC Bundle   │   and browser localStorage  │
│   CloudWatch, KQL,   │   (30 Monitors • 3 Groups)"│ • Stores custom remaps, tag │
│   Dynatrace, Splunk  │ • Scoped 100% to selected  │   sanitizations, and source │
│ • Independent of VPC │   VPC inventory            │   targets for team reuse    │
└──────────────────────┴────────────────────────────┴─────────────────────────────┘
```

1. **Built-in Golden Reference Presets (Known Templates):**
   - Pre-packaged cross-vendor standards (Datadog Multi-Threshold Web, New Relic Fleet CPU NRQL, AWS CloudWatch RDS Low Storage, Azure Monitor 5xx KQL, Dynatrace Davis AI, Splunk SPL, Terraform AWS $\rightarrow$ OpenTofu GCP).
   - **Always available** in the `PRESET:` dropdown regardless of which VPC is selected.
   - Purpose: Immediate syntax testing, PromQL translation inspection, and zero-egress AST velocity benchmarking without live VPC credentials.
2. **The Captured VPC Bundle (`captured_vpc_bundle`):**
   - Generated dynamically when clicking **`Capture VPC Monitors`** $\rightarrow$ **`📥 Load Monitors into Editor`**.
   - Added to the dropdown as `⚡ Captured VPC Bundle (30 Monitors • 3 Groups of 10)`.
   - **100% based on what is read from that specific VPC's inventory and active monitoring tools**.
3. **User-Saved Custom Presets (`+ Save Custom`):**
   - Allows engineers to save remapped metric dictionaries, sanitized tag rules, and target configurations into an enterprise preset library (stored in encrypted browser localStorage / in-memory cache) for repeat migrations.

---

## GROUP 3: Live VPC Monitoring Discovery & Capture Engine

### 3.1 Monitored VPC Scope Selection
In the primary toolbar, the **`MONITORED VPC:`** dropdown binds the compiler to a specific network topology boundary:
- `dc-onprem-core-01` (`172.16.0.0/16` • OnPrem Core DC)
- `vpc-production-mesh` (`10.100.0.0/16` • AWS US-East-1)
- `vpc-staging-cell` (`10.200.0.0/16` • Azure WestUS2)
- `analytics-gcp-mesh` (`10.240.0.0/16` • GCP us-central1)

### 3.2 The 4-Layer In-VPC Multi-Tool Auto-Discovery Engine
Brownfield enterprise VPCs rarely use a single monitoring tool. `<dcouplr/>` interrogates the VPC inventory across four discovery layers simultaneously:
- **Layer 1: In-Guest OS & Daemon Discovery:** Scans systemd daemons and listening sockets across compute instances (`datadog-agent` :8125, `newrelic-infra` :8001, `splunkd` :9997, `dynatrace-oneagent`).
- **Layer 2: Kubernetes Workload & CRD Inspection:** Interrogates container subnets for Prometheus Operator CRDs (`ServiceMonitor`, `PrometheusRule`), OpenTelemetry Collector sidecars (:4317/:4318), and Datadog K8s DaemonSets.
- **Layer 3: Cloud Provider API & Infrastructure Scans:** Connects via private in-VPC endpoints to scrape AWS CloudWatch Alarms, Azure Monitor metric rules, or GCP Cloud Monitoring policies bound to the VPC's subnets and load balancers.
- **Layer 4: In-VPC IaC & GitOps Discovery:** Scans Terraform/OpenTofu `.tfstate` and HCL manifests in CI/CD runners to extract declarative monitoring resource definitions.

### 3.3 The 30 Active Monitors Partitioned into 3 Tiers (10 Monitors Each)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        30 ACTIVE MONITORS • 3 OPERATIONAL TIERS                        │
├────────────────────────────┬────────────────────────────┬──────────────────────────────┤
│ GROUP 1: INFRASTRUCTURE &  │ GROUP 2: APPLICATION &     │ GROUP 3: SRE RELIABILITY,    │
│ HOST TIER (IDs 1001-1010)  │ API GATEWAY (IDs 1011-1020)│ SECURITY & CONSENSUS (1021+) │
├────────────────────────────┼────────────────────────────┼──────────────────────────────┤
│ 1001: Host CPU Saturation  │ 1011: HTTP 5xx Error Surge │ 1021: Zero-Egress Perimeter  │
│ 1002: Physical RAM Exhaust │ 1012: P99 Latency SLA      │ 1022: Raft Consensus Split   │
│ 1003: Root Disk Depletion  │ 1013: 504 Gateway Timeouts │ 1023: Circuit Breaker Trip   │
│ 1004: Disk Write Latency   │ 1014: DB Pool Starvation   │ 1024: Anycast VIP Health     │
│ 1005: Interface Drop Rate  │ 1015: Redis Cache Eviction │ 1025: TLS Certificate Expiry │
│ 1006: File Descriptor Cap  │ 1016: Kafka Consumer Lag   │ 1026: WAF Anomaly Burst      │
│ 1007: 15m Load Average     │ 1017: gRPC Error Rate      │ 1027: Peering Mesh RTT Drift │
│ 1008: Swap Memory Churn    │ 1018: K8s CrashLoopBackOff │ 1028: Storage Burst Deplete  │
│ 1009: Kernel OOM Kills     │ 1019: JVM GC Pause Burst   │ 1029: CoreDNS Request Loss   │
│ 1010: NTP Clock Drift      │ 1020: Ingress Rate Drop    │ 1030: Ring Buffer Congestion │
└────────────────────────────┴────────────────────────────┴──────────────────────────────┘
```

---

## GROUP 4: Studio Editor Ingestion & 4-Point Parity Cross-Validation

### 4.1 The `📥 Load Monitors into Editor` Action
When the engineer clicks **`📥 Load Monitors into Editor`**:
1. All 30 raw monitor definitions are loaded into `sourceInput` as a formatted JSON array.
2. The `SOURCE:` selector automatically locks to `Datadog Monitor (JSON)`.
3. The `PRESET:` dropdown appends and selects `⚡ Captured VPC Bundle (30 Monitors • 3 Groups of 10)`.
4. The AST compiler automatically transpiles the full bundle in volatile memory.

### 4.2 Four-Point Parity Cross-Validation Guide

Engineers can count and cross-validate that all 30 monitors across all 3 tiers are accurately represented:

| Validation Point | UI Element / File Location | Expected Value | Verification Detail |
| :--- | :--- | :--- | :--- |
| **Point 1: Modal View** | Inspection Modal | `30 ACTIVE MONITORS` | 3 group divider banners, 10 cards each with `#01/10` to `#10/10` tags. |
| **Point 2: Source Badge** | Editor Header Badge | `30 Monitors (10 Infra • 10 App • 10 SRE)` | Cyan badge above Source Editor confirms JSON array length. |
| **Point 3: Target Output** | Synthesized Target Manifest | `3 Distinct Alert Groups` | Grafana / Prometheus YAML outputs 3 separate `groups:`, each containing exactly 10 alert rules (30 rules total). |
| **Point 4: Studio Footer** | Bottom Telemetry Bar | `Entities: 30` | Footer confirms 30 processed entities with `100.0% Parity Fidelity`. |

---

## GROUP 5: Target Platforms & `<dcouplr/>` Native AST (Unified IR JSON)

### 5.1 Supported Target Platforms
The `TARGET:` dropdown allows transpilation into all major open standards:

| If the Target Observability Tool Is... | Select Target Option | Output Synthesized by `<dcouplr/>` |
| :--- | :--- | :--- |
| **`<dcouplr/>` Normalized AST** | **`⚡ <dcouplr/> AST (Unified IR JSON)`** | Canonical decoupled intermediate representation AST |
| **Grafana 10 / 11 (Self-Hosted, Mimir, Loki)** | `Grafana 10+ (Unified Alerting YAML)` | Standard Grafana provisioning alerts with notification policies |
| **Grafana Advanced Pipelines** | `Grafana 10+ (Multi-Threshold RefId A-D)` | Multi-condition evaluation nodes (A $\rightarrow$ B $\rightarrow$ C $\rightarrow$ D) |
| **Prometheus / Alertmanager** | `Prometheus (Alertmanager Rules YAML)` | Native PromQL alert expressions (`expr:`, `for:`, `labels:`, `annotations:`) |
| **VictoriaMetrics / Thanos / Cortex** | `Prometheus (Alertmanager Rules YAML)` | Standard PromQL rules compatible with all open-standard telemetry engines |
| **OpenTofu / Terraform (GCP or AWS)** | `OpenTofu GCP (HCL)` or `OpenTofu Azure (HCL)` | Declarative IaC monitoring resource blocks (`google_monitoring_alert_policy`) |
| **Azure Monitor** | `Azure Bicep (.bicep)` or `OpenTofu Azure (HCL)` | Native ARM/Bicep metric alerts and action groups |
| **Two-Way Synchronization** | `Datadog Monitor (JSON) [2-Way]` | Bi-directional synchronization for phased hybrid cutovers |

### 5.2 Deep Inspector Tabs

```
[Target Code]  [PromQL Vectors]  [Security Audit]  [Multi-Threshold]
```

- **Target Code:** Displays the synthesized deployable manifest (Prometheus YAML, Grafana YAML, OpenTofu HCL, or `<dcouplr/> AST` JSON).
- **PromQL Vectors:** Displays side-by-side original queries versus translated PromQL vectors with exact semantic parity proof.
- **Security Audit:** Displays zero-egress attestation and count of scrubbed tokens/hostnames.
- **Multi-Threshold:** Visualizes the evaluation pipeline across instant query nodes, mathematical expressions, and alerting conditions.

### 5.3 How <dcouplr/> Works as a Target

When you select **`⚡ <dcouplr/> AST (Unified IR JSON)`** as the **`TARGET:`**:

1. **What is synthesized:** `<dcouplr/>` generates a canonical **Normalized AST Manifest (`dcouplr-manifest.json`)**.
2. **What it contains:** All 30 monitors decoupled into vendor-neutral mathematical AST nodes (metric formulas, threshold windows, dimension groupings, evaluation intervals, and sanitized labels) without vendor lock-in.
3. **How it executes in the Target VPC:**
   - In the new target VPC perimeter, `<dcouplr/>` runs as an in-VPC native telemetry cluster daemon (listening on port 8000 or custom port).
   - When this manifest is loaded into `<dcouplr/>`, the target engine evaluates and arms these rules natively in **volatile memory** ($\le 20\text{ ms}$, zero persistent disk, and **$0.00 external WAN egress**).

### 5.4 Loading from Source VPC to Target VPC (The Upload Function & Cross-VPC Lifecycle)

The **`Upload`** button in the Compiler Studio is the built-in bridge between the Source VPC and the Target VPC.

In enterprise migrations, Source VPCs (e.g., On-Premises Core `dc-onprem-core-01`) and Target VPCs (e.g., AWS `vpc-production-mesh` or GCP `analytics-gcp-mesh`) are typically separated by air-gaps, firewalls, or sovereign boundaries with zero direct routability.

#### The Cross-VPC Ingestion Lifecycle

```
[SOURCE VPC]                                                    [TARGET VPC]
dc-onprem-core-01                                               vpc-production-mesh
┌───────────────────────────┐                                   ┌───────────────────────────┐
│ 1. Capture 30 Monitors    │                                   │ 4. Open Target Studio     │
│ 2. Target: <dcouplr/> AST │                                   │    Click "Upload" button  │
│ 3. Click "⬇️ Download"    │                                   │    Select manifest file   │
│    (dcouplr-manifest.json)│ ──[ Air-Gap / Bastion Handoff ]──▶│    Instant In-Memory Ingest│
└───────────────────────────┘                                   │ 5. Armed in Local RAM     │
                                                                └───────────────────────────┘
```

1. **In the Source VPC Studio (`http://<source-vpc>:8000/compiler`):**
   - Select **`MONITORED VPC:`** `dc-onprem-core-01`.
   - Click **`Capture VPC Monitors`** $\rightarrow$ **`📥 Load Monitors into Editor`**.
   - Select **`TARGET:`** `⚡ <dcouplr/> AST (Unified IR JSON)` (or Prometheus / Grafana).
   - Click **`⬇️ Download`** or **`💾 Export Bundle (.json)`** to save `dcouplr-manifest.json`.

2. **Air-Gap / Bastion Handoff:**
   - Transfer `dcouplr-manifest.json` across your air-gap, jump host, or approved deployment bastion to the target environment.

3. **In the Target VPC Studio (`http://<target-vpc>:8000/compiler`):**
   - Open the Compiler Studio running inside the Target VPC perimeter.
   - In the secondary utility ribbon, click the **`Upload`** button.
   - Select your downloaded `dcouplr-manifest.json` (or `captured_vpc_bundle.json`).
   - **Smart Auto-Ingestion:** The compiler's lexer recognizes the bundle, loads all 30 monitors, displays the verification badge:
     ```text
     30 Monitors Loaded (Source VPC Import)
     ```
   - It binds them directly to the Target VPC's volatile memory and automatically synthesizes the target format.

---

## GROUP 6: Step-by-Step Operator Runbook for Migration Engineers

### Step 1: Select the Source VPC & Capture All Active Monitors
1. Open the Compiler Studio: `http://localhost:8000/compiler`.
2. In the `MONITORED VPC:` dropdown, select your migration source (e.g., `vpc-production-mesh (10.100.0.0/16 • AWS)`).
3. Click the cyan **`Capture VPC Monitors`** button.
4. Review the modal: verify 30 monitors across 3 groups (10 Infra, 10 App, 10 SRE).

### Step 2: Load the Captured Monitors into Compiler Studio
1. Click **`📥 Load Monitors into Editor`** at the bottom of the modal.
2. Confirm the editor count badge reads: `30 Monitors (10 Infra • 10 App • 10 SRE)`.
3. Confirm the footer updates to `Entities: 30`.

### Step 3: Choose the New Observability Target
In the `TARGET:` dropdown, select the target platform matching the new VPC architecture:
- If moving to Prometheus / Mimir / VictoriaMetrics: Select `Prometheus (Alertmanager Rules YAML)`.
- If moving to Grafana Alerting: Select `Grafana 10+ (Unified Alerting YAML)`.
- If inspecting the normalized AST model: Select `⚡ <dcouplr/> AST (Unified IR JSON)`.
- If migrating cloud infrastructure: Select `OpenTofu GCP (HCL)` or `OpenTofu Azure (HCL)`.

### Step 4: Map Metrics & Sanitize Network Topologies
1. Click **`Metric Remap`** on the secondary toolbar.
2. Verify or add metric aliases (e.g., `system.cpu.user` $\rightarrow$ `node_cpu_seconds_total`).
3. Click **`Apply & Recompile`**.
4. The in-memory anonymizer automatically strips old private IPs, hostnames, and AWS ARNs, replacing them with sanitized hashes or new VPC target CIDRs.

### Step 5: Compile AST in Volatile Memory
1. Click **`Compile AST`** (or press `⌘↵` / `Ctrl+Enter`).
2. AST compilation completes in under 20 milliseconds in volatile RAM.
3. The Target Code pane populates with the synthesized production rules.
4. Verify that the **Parity Fidelity** gauge displays $\ge 95\% - 100\%$.

### Step 6: Save & Deploy to Target VPC Perimeter

In `<dcouplr/>`, deployment into the target perimeter supports both **cloud-native open tools** (Prometheus, Grafana, OpenTofu) and **native `<dcouplr/>` In-VPC telemetry clusters**:

1. In the right pane toolbar, click **`⬇️ Download`** (or **`Save Artifact`**) to export the generated manifest (`dcouplr-manifest.json`, `prometheus-rules.yaml`, `grafana-alerts.yaml`, or `main.tf`).
2. Deploy the manifest directly into the target VPC perimeter using the appropriate method below:

#### Method A: <dcouplr/> In-VPC Native Telemetry Engine (Zero Egress • Sub-ms)
If the Target VPC runs the `<dcouplr/>` in-VPC telemetry agent or cluster:
```bash
# 1. Apply directly via the in-VPC <dcouplr/> CLI
dcouplr apply -f dcouplr-manifest.json --vpc vpc-production-mesh

# 2. Or push directly to the target VPC daemon socket / REST API ($0 Egress):
curl -X POST http://dcouplr.target.vpc:8000/v1/telemetry/rules \
  -H "Content-Type: application/json" \
  -d @dcouplr-manifest.json

# 3. Verify active rule ingestion in volatile memory
curl -s http://dcouplr.target.vpc:8000/v1/telemetry/rules | jq '.total_active_rules'
```

#### Method B: Target VPC Compiler Studio (Browser Upload Ingestion)
In strictly air-gapped sovereign environments where the Source and Target VPCs have no direct route or WAN access:
1. Open the `<dcouplr/>` Compiler Studio hosted inside the Target VPC perimeter: `http://<target-vpc-ip>:8000/compiler`.
2. On the secondary utility toolbar, click the **`Upload`** button.
3. Select the exported `dcouplr-manifest.json` (or `captured_bundle.json`) from your local machine.
4. The Target Studio's smart lexer automatically detects the `<dcouplr/>` bundle format, loads all 30 active monitors across the 3 groups, displays the verification badge `30 Monitors Loaded (Source VPC Import)`, and activates them in target volatile memory!

#### Method C: Kubernetes / Prometheus Alertmanager
```bash
# Apply Prometheus Alertmanager rules into the target Kubernetes cluster
kubectl apply -f prometheus-rules.yaml -n monitoring

# Verify Prometheus hot-reloaded the rule groups without downtime
curl -s http://prometheus.monitoring.svc.cluster.local:9090/api/v1/rules | jq '.data.groups[].name'
```

#### Method D: Grafana Unified Alerting
```bash
# Copy to Grafana provisioning directory in target VPC
cp grafana-alerts.yaml /etc/grafana/provisioning/alerting/rules.yaml

# Or push via Grafana HTTP API in-VPC ($0 Egress)
curl -X POST -H "Content-Type: application/yaml" \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  --data-binary @grafana-alerts.yaml \
  http://grafana.internal.vpc:3000/api/v1/provisioning/alert-rules
```

#### Method E: OpenTofu / Terraform Landing Zone
```bash
# Initialize and apply declarative monitoring blocks in target cloud VPC
tofu init && tofu plan -out=monitoring.tfplan && tofu apply monitoring.tfplan
```

---

## Validation & Verification Checklist

Before closing the migration ticket, verify the following operational gates:

| Gate | Check | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :---: |
| **G-01** | Rule Count Parity | Count of target rules matches active source monitors exactly (30 rules) | [ ] |
| **G-02** | Group Partitioning | Output manifests partitioned into 3 distinct operational tiers (10 per tier) | [ ] |
| **G-03** | Threshold Integrity | Alert thresholds (`critical`, `warning`) match source values exactly | [ ] |
| **G-04** | Evaluation Windows | Window lengths (`5m`, `15m`, `1h`) match source duration math | [ ] |
| **G-05** | Label/Tag Retention | All routing labels (`team`, `service`, `severity`) preserved | [ ] |
| **G-06** | Zero Egress Proof | Egress attestation proves 0.00 B/s outbound WAN traffic | [ ] |
| **G-07** | Target Verification | Output verified in target engine (Prometheus, Grafana, or OpenTofu) | [ ] |

---

## Document Control & Administrative Links

- **Document Path:** `docs/runbooks/RUNBOOK-VPC-MONITORING-CAPTURE-AND-TARGET-TRANSPILATION.md`
- **Mirror Path:** `ProjectAssistant/admin-runbooks/ADMIN-RUNBOOK-VPC-MONITORING-CAPTURE-AND-TARGET-TRANSPILATION.md`
- **SRE Configuration Hub:** [http://localhost:8000/configuration](http://localhost:8000/configuration)
- **Web Reader (Formatted HTML):** [http://localhost:8000/docs/runbooks/RUNBOOK-VPC-MONITORING-CAPTURE-AND-TARGET-TRANSPILATION.html](http://localhost:8000/docs/runbooks/RUNBOOK-VPC-MONITORING-CAPTURE-AND-TARGET-TRANSPILATION.html)
- **Architecture Blueprint:** [http://localhost:8000/docs/COMPILER_STUDIO_AND_OPERATIONAL_DASHBOARD_ARCHITECTURE_AND_RUNBOOK.html](http://localhost:8000/docs/COMPILER_STUDIO_AND_OPERATIONAL_DASHBOARD_ARCHITECTURE_AND_RUNBOOK.html)
