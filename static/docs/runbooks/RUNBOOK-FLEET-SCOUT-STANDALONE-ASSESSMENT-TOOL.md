# <span class="dcouplr-wordmark"><span class="dcouplr-bracket">&lt;</span><span class="dcouplr-text">dcouplr</span><span class="dcouplr-bracket">/&gt;</span></span> Master User Guide & Operational Runbook: Fleet Scout Assessment Studio (`/assess`)

| Metadata Property | Specification Detail |
| :--- | :--- |
| **Document ID** | `VA-RUNBOOK-ASSESS-001` |
| **Classification** | Master Enterprise Operations & Architecture Guide |
| **Product Component** | `<dcouplr/> Fleet Scout Assessment Studio` &bull; `dcouplr assess` CLI |
| **Access URLs** | Primary Web Studio: [`http://localhost:8000/assess`](http://localhost:8000/assess) &bull; Aliases: `/assessment`, `/scout` |
| **CLI Command** | `dcouplr assess [--gui] [--customer <org>] [--cidr <cidr>] [--baremetal <ip>] [--output <file>] [--format table\|markdown\|json]` |
| **API Endpoints** | `GET /assess`, `POST /v1/assessment/scan`, `POST /v1/assessment/report` |
| **Target Roles** | Enterprise Buyers, FinOps Architects, Infrastructure Directors, SRE Managers, DBAs, Field Sales Engineers |
| **Security Invariant** | **100% In-Perimeter Offline Execution &bull; Zero Public WAN Egress ($0.00) &bull; Zero Cloud Telemetry Leakage** |
| **Product Model** | **Strictly Either / Or Architecture** (Turnkey Migration Suite **or** Full-Stack All-In-One Observability Suite) |
| **Status** | Production Approved Reference Guide & Runbook |

---

## 1. Executive Summary & The "Day -1" Dilemma

Prior to signing an enterprise contract or deploying software into production, prospective buyers and infrastructure teams face two recurring challenges:

### 1.1 The "Unknown Estate" Problem
Modern enterprise infrastructure is highly fragmented across disparate silos:
* AWS Virtual Private Clouds (VPCs) running managed Kubernetes (EKS) and serverless workers.
* Google Cloud Platform (GCP) enclaves running BigQuery and Spark analytics pipelines.
* Microsoft Azure Virtual Networks (VNets) hosting internal enterprise line-of-business applications.
* VMware vSphere private clusters running legacy monolithic workloads.
* On-premises bare-metal colocation racks hosting high-IOPS transactional databases (Oracle RAC, SQL Server).

Because asset inventories, CMDBs, and cloud billing tags are frequently out of date, **engineering leadership rarely knows the exact count of active physical and virtual nodes requiring licensing**.

### 1.2 The "Zero-Trust" Security Barrier
Because `<dcouplr/>` is being evaluated prior to formal procurement approval, corporate security and CISOs will **not** allow:
1. Installing intrusive root agents, eBPF probes, or proprietary daemons on production machines.
2. Granting write-level cloud IAM credentials or Kubernetes `cluster-admin` service accounts.
3. Permitting ANY internal network topologies, hostnames, private IP addresses, or security posture details to be uploaded or transmitted to an external vendor SaaS backend.

### 1.3 How `<dcouplr/> Fleet Scout` Solves Both Problems
**`<dcouplr/> Fleet Scout`** is a standalone, zero-footprint capacity sizer and commercial evaluation studio. It executes **100% within the customer's local perimeter** (on a jump host, bastion server, or an engineer's laptop). It scans defined subnets, counts active nodes, models overage vs. tier economics, and generates an air-gapped cryptographic certification token—all with **$0.00 public WAN egress and absolute zero data leakage**.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│             <dcouplr/> FLEET SCOUT: IN-PERIMETER PRE-FLIGHT CAPACITY ASSESSMENT STUDIO                 │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [🛡️ 100% IN-PERIMETER SCAN]  [🔒 ZERO PUBLIC WAN EGRESS ($0.00)]  [📜 CRYPTOGRAPHIC TOKEN ATTESTATION]  │
├────────────────────────────────────────────────────┬───────────────────────────────────────────────────┤
│ Target Network CIDRs & Datacenter Subnets (Input): │ Real-Time Estate Census (Computed in Memory):     │
│ ────────────────────────────────────────────────── │ ───────────────────────────────────────────────── │
│ [x] 10.100.0.0/22   [AWS VPC]        (180 hosts)   │ Total Discovered Nodes:   375 Nodes               │
│ [x] 10.200.0.0/23   [GCP VPC]        ( 90 hosts)   │ • Cloud Virtual Machines: 171 Hosts               │
│ [x] 192.168.10.0/24 [Bare Metal Rack]( 60 hosts)   │ • Kubernetes Workers:      75 Hosts               │
│ [x] 172.16.50.0/24  [VMware Cluster] ( 45 hosts)   │ • Bare Metal Servers & DB: 107 Hosts              │
│                                                    │                                                   │
│ [ + Add Subnet / CIDR ]  [ ⚡ Run Offline Scan ]   │ Cryptographic Token:                              │
│                                                    │ [ DCL-TOKEN-52D747FBFD6567DDB1D6DCC8-375N ] [📋]  │
├────────────────────────────────────────────────────┴───────────────────────────────────────────────────┤
│ Decision Matrix: Current Tier + Overage vs. Tier Step-Up Trade-Offs                                   │
│ Option A: Air-Gap + 75 Overage ($202,500/yr) vs. Option B: Unlimited Site License ($360,000/yr)        │
│ Verdict: Step Up to Next Tier for Uncapped Headroom & 24/7 Air-Gapped SLA                              │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Strictly Either / Or Suite Evaluation (Full-Stack Includes 100% of Migration Suite at $0 Extra Cost):  │
│ [ Option 1: Turnkey Migration Suite ($138,000/yr) ] vs [ Option 2: Full-Stack Suite ($202,500/yr) ]   │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Accessing & Deploying the Assessment Studio

`<dcouplr/> Fleet Scout` is delivered through two synchronized interfaces: the interactive browser studio and the headless terminal CLI.

### 2.1 Browser Web Studio (`/assess`)
When the `<dcouplr/>` daemon or binary is active on your host (port 8000 by default), navigate to:
```
http://localhost:8000/assess
```
*(The studio is also accessible via alias routes `http://localhost:8000/assessment` and `http://localhost:8000/scout`)*.

### 2.2 CLI Launcher (`dcouplr assess --gui`)
To launch the browser studio directly from your terminal session:
```bash
dcouplr assess --gui
```
This prints the security invariant notice and automatically opens your default system browser to the assessment interface.

### 2.3 Headless CLI Mode (`dcouplr assess`)
For automated discovery in CI/CD pipelines, Ansible playbooks, or air-gapped jump hosts without a desktop environment:
```bash
dcouplr assess \
  --customer "Acme Financial Corp" \
  --cidr "10.100.0.0/22" \
  --cidr "10.200.0.0/23" \
  --baremetal "192.168.10.0/24" \
  --baremetal "172.16.50.0/24" \
  --output ./assessment-report.md \
  --format markdown
```

---

## 3. Step-by-Step Studio Workflow

The `/assess` interface is divided into seven intuitive, interconnected operational zones:

```
[1. Organization & Subnets] ──> [2. In-Perimeter Scan] ──> [3. Discovery Radar & Census]
                                                                     │
[6. Export & /wizard Launch] <── [5. Either/Or Suites] <── [4. Decision Matrix & Simulator]
```

### Step 1: Organization & Subnet Target Input
In the left-hand panel **Target Infrastructure & Discovery Boundaries**:
1. **Organization Name:** Enter the legal name or evaluation identifier of the prospective organization (e.g., `Acme Financial Technologies`). This is embedded into the cryptographic token and proposal export.
2. **Subnet Rows:** Add the network CIDR blocks or IP ranges representing your infrastructure footprint:
   * **Environment Selector:** Choose from `AWS VPC`, `GCP VPC`, `Azure VNet`, `Bare Metal Datacenter`, `VMware vSphere`, or `Edge / Air-Gapped Enclave`.
   * **Subnet CIDR / Range:** Enter the network definition (e.g., `10.100.0.0/22` or `192.168.1.1-192.168.1.150`).
   * **Region / Datacenter Label:** Designate the physical or logical facility (e.g., `us-east-1 Primary`, `Equinix Ashburn DC-01`).
   * **Estimated Active Nodes:** Input known host counts, or leave blank to rely on discovery sweeps.
3. **Load Sample Architecture:** Click this button at any time to instantly populate a realistic, mixed enterprise estate (180 AWS nodes, 90 GCP nodes, 60 Bare-Metal servers, 45 VMware hypervisors = 375 total nodes).

### Step 2: Executing the In-Perimeter Discovery Scan
Click the large primary button:
```
⚡ Run In-Perimeter Discovery Scan
```
#### What Happens Under the Hood:
* The browser issues a `POST /v1/assessment/scan` call to the local backend.
* The `FleetScoutEngine` sweeps the defined CIDR ranges using non-intrusive TCP ping probes, local ARP table inspections, and reverse DNS PTR queries.
* **Security & Non-Intrusiveness Guarantee:**
  * Zero root probes or kernel hooks.
  * Zero packets leave the local gateway or traverse public WAN links.
  * Sweep execution completes in under 500 milliseconds for up to 10,000 IP addresses.

### Step 3: Inspecting the Discovery Radar & Estate Census
Upon scan completion, the right-hand panel instantly updates:
* **Total Discovered Compute Nodes:** Authoritative aggregate node count (e.g., `375`).
* **Cloud Virtual Machines (VMs):** Discovered EC2, GCE, and Azure compute instances (e.g., `171`).
* **Kubernetes Worker Nodes:** Discovered container cluster nodes (e.g., `75`).
* **Bare Metal Servers & Hypervisors:** Physical servers, ESXi hosts, and database appliances (e.g., `107`).
* **Estate Breakdown by Environment:** Detailed itemization of host distribution across AWS, GCP, on-prem racks, and VMware enclaves.

### Step 4: Using the Live Capacity Simulator & Overage Stress-Tester
At the top of the interface, the **Live Capacity Simulator Bar** allows you to test "what-if" expansion scenarios:
* **Preset Buttons:** Quickly stress-test canonical fleet milestones:
  * `25 Nodes (Base)`: Minimum single-node / pilot deployment.
  * `35 Nodes (10 Overage)`: Illustrates base tier overage cost.
  * `55 Nodes (Step-Up Cheaper!)`: Demonstrates where stepping up a tier is cheaper than paying overage.
  * `75 Nodes (Mission-Critical)`: Cluster Medium base tier.
  * `85 Nodes (10 Overage)`: Cluster Medium overage comparison.
  * `150 Nodes (Cluster Large)`: Mid-sized multi-VPC estate.
  * `375 Nodes (Air-Gap Overage)`: Enterprise Air-Gap tier with overage.
  * `500 Nodes (Air-Gapped Private)`: Enterprise Air-Gap base tier.
  * `850 Nodes (Unlimited Site)`: Unlimited Enterprise Site License threshold.
* **Custom Node Counter:** Enter any arbitrary integer in the input box (e.g., `420`) and press Enter to instantly recalculate all pricing, overage, and decision matrices.

---

## 4. The Decision Matrix: Overage vs. Tier Step-Up Analysis

When a customer's node count falls between standard tier boundaries, they face a critical financial dilemma: **Should we pay for overage nodes on our current tier, or step up to the next tier?**

`/assess` resolves this with a real-time, side-by-side trade-off matrix:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CAPACITY SIZING & PROACTIVE UPGRADE MATRIX                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  Current Discovered Capacity: 375 Active Nodes                                         │
│  Strategic Verdict: Step Up to Next Tier for Uncapped Headroom & 24/7 Air-Gapped SLA   │
├────────────────────────────────────────────┬───────────────────────────────────────────┤
│ OPTION A: Current Tier + Overage           │ OPTION B: Step Up to Next Tier            │
│ Enterprise Air-Gap (+75 Overage Nodes)     │ Unlimited Enterprise Site License         │
├────────────────────────────────────────────┼───────────────────────────────────────────┤
│ Annual Cost:    $202,500 / yr              │ Annual Cost:    $360,000 / yr             │
│ Breakdown:      Base $180k + $22.5k Overage│ Breakdown:      100% Uncapped Nodes       │
│ Effective /mo:  $16,875 / month            │ Effective /mo:  $30,000 / month           │
│ Unit Cost:      $45.00 / node / month      │ Headroom:       Uncapped Headroom         │
│ Headroom:       0 Nodes (Exact Fit)        │ Headroom Delta: +325 to Unlimited Nodes   │
│ SLA Tier:       Air-Gapped 15m             │ SLA Tier:       Executive Air-Gap 15m     │
├────────────────────────────────────────────┼───────────────────────────────────────────┤
│ PROS:                                      │ PROS:                                     │
│ • Lowest Day-1 out-of-pocket cash commit   │ • Complete peace of mind; 100% uncapped   │
│ • No unused node allocation on Day 1       │ • Eliminates monthly overage billing      │
│ • Seamless transition when growth stops    │ • Predictable, fixed annual budget        │
│                                            │ • Highest priority 24/7 SLA               │
│ CONS:                                      │ CONS:                                     │
│ • Overage penalty ($25/node/mo)            │ • Higher initial dollar commitment        │
│ • Zero buffer for unexpected fleet surges  │ • Requires procurement signoff for uncapped│
│ • Exceeding 450 nodes forces immediate tier│                                           │
├────────────────────────────────────────────┼───────────────────────────────────────────┤
│ Best For: Controlled, stagnant estates     │ Best For: Aggressively scaling multi-cloud│
└────────────────────────────────────────────┴───────────────────────────────────────────┘
```

### 4.1 The Break-Even Mathematical Formula
The studio automatically computes the mathematical crossover point:
$$\text{Break-Even Overage Nodes} = \frac{\text{Next Tier Base Annual Price} - \text{Current Tier Base Annual Price}}{\text{Annual Per-Node Overage Rate}}$$

* **Example (35 to 55 Nodes):**
  * Current Tier (Cluster Small 25 nodes): Base $36,000/yr. Overage = $35/node/mo ($420/node/yr).
  * Next Tier (Cluster Medium 75 nodes): Base $54,000/yr.
  * Price difference = $18,000/yr.
  * Break-even overage = $18,000 / $420 = **42.8 nodes** (i.e., 25 + 43 = 68 nodes).
  * At **55 nodes**, Option A costs $48,600/yr, but only provides 55 nodes with zero headroom. Stepping up to Cluster Medium costs $54,000/yr, providing **20 spare nodes of headroom** and upgrading the SLA to 24/7 Critical.
  * The verdict banner dynamically highlights: *"Step Up to Next Tier for Headroom & 24/7 SLA."*

---

## 5. The "Strictly Either / Or" Product Architecture

Enterprise customers **never purchase both suites or combine them into a dual-suite bundle**:

```
                                  <dcouplr/> ENTERPRISE PLATFORM
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
       OPTION 1: Turnkey Migration Suite                           OPTION 2: Full-Stack Suite
        "Day-0 to Day-1 Project Engine"                    "Day-0 through Day-2+ Operational Backbone"
             (Migration & Cutover)                            (100% of Migration Suite INCLUDED + 
                                                              24x7 In-VPC Monitoring, Raft & NOC)
```

### 5.1 Option 1: Turnkey Migration Suite
* **Operational Mode:** Project-based, active during infrastructure refactoring and cutover windows (3–12 months).
* **Primary Mission:** High-velocity cloud migration, schema transpilation, and zero-downtime cutover.
* **Primary UIs:** Living AST Compiler Studio (`/compiler`), CLI Transpiler (`dcouplr migrate`), Lift-and-Shift Studio (`/liftnshift`), Staged Cutover (`/stage-migration`).
* **Tangible ROI:** Displaces third-party systems integration consulting ($400–$500 per alert or $150k+ per migration project).
* **Target Budget:** Project CapEx, Cloud Modernization Initiatives.

### 5.2 Option 2: Full-Stack All-In-One Observability Suite
* **Operational Mode:** Permanent 24x7 in-VPC monitoring, zero-egress telemetry, distributed consensus, and incident response.
* **THE ALL-INCLUSIVE INVARIANT:** **Full-Stack includes 100% of the Turnkey Migration Suite capabilities at $0 additional cost.**
  * Customers purchasing Full-Stack get the complete Living AST compiler, multi-vendor query parsers, IaC synthesizer, and CDC state relocator included.
  * After cutover, the software is not discarded—it permanently monitors the newly migrated infrastructure with zero egress fees.
* **Primary UIs:** Day-0 Web Wizard (`/wizard`), Authoritative Admin Desk (`/AdminDesk`), Cluster Console (`/companyadmin`), DBA Desk (`/DBADesk`), 7-Tier Matrix (`/matrix`), Live SRE Dashboard (`/dashboard`), NOC Wallboard (`/wallboard`), Air-Gapped Kiosk (`/kiosk`), In-VPC Log Search (`/logs`), Distributed APM Traces (`/traces`).
* **Tangible ROI:** Displaces recurring Datadog, New Relic, and Splunk Cloud bills ($15–$23/host/mo + $0.09/GB WAN egress $\approx$ $360/host/year), saving $135,000 to $948,000+ per year.
* **Target Budget:** Permanent Annual OpEx.

---

## 6. Complete Functional Inventory Reference

Both suites are exhaustively inventoried below with exact functional specifications:

### 6.1 Turnkey Migration Suite (25 Capabilities)

| # | Feature / Capability | Functional Specification & Day-0 Purpose |
| :-: | :--- | :--- |
| **1** | **Datadog JSON Alert Parser** | Ingests Datadog monitor JSON definitions and extracts threshold queries, evaluation windows, and severity rules into AST format. |
| **2** | **Splunk SPL Alert Ingestion** | Parses raw Splunk Search Processing Language (`search ... \| stats ... \| where ...`) into structured event triggers. |
| **3** | **Prometheus YAML Parser** | Ingests Prometheus alerting rule blocks and PromQL expressions. |
| **4** | **New Relic NRQL Transpiler** | Deconstructs NRQL queries (`SELECT ... FACET ...`) into standard AST metric evaluators. |
| **5** | **Dynatrace Query Importer** | Converts Dynatrace entity selector metrics and threshold conditions. |
| **6** | **CloudWatch Alarm Converter** | Parses AWS CloudWatch Alarm MetricDataQueries and comparison operators. |
| **7** | **AST Normalization Engine** | Unifies diverse vendor query languages into an intermediate canonical Abstract Syntax Tree. |
| **8** | **Cross-Engine Transpilation** | Compiles normalized AST rules directly into target monitoring and runtime configurations. |
| **9** | **In-Memory Secret Sanitizer** | Scans IaC templates and queries in volatile RAM to strip hardcoded API keys, passwords, and tokens. |
| **10** | **PII & Sensitive Token Redaction**| Automatically detects and masks emails, credit card patterns, and identity tokens prior to template generation. |
| **11** | **Living AST Studio (`/compiler`)** | Browser-based side-by-side IDE for real-time legacy source transpilation into target IaC with live syntax highlighting. |
| **12** | **AST Transpilation CLI** | Terminal-driven pipeline compiler (`dcouplr migrate`) for headless CI/CD automation. |
| **13** | **Terraform / OpenTofu Synthesis** | Emits production-grade HCL2 modules (`.tf`) with variables, outputs, and cloud provider bindings. |
| **14** | **AWS CloudFormation Generation** | Synthesizes native AWS CloudFormation templates (`.yaml`/`.json`) with parameter sections and resource blocks. |
| **15** | **Azure Bicep / ARM Generator** | Emits modern Azure Bicep definitions and ARM schemas. |
| **16** | **Kubernetes Helm Chart Synthesis** | Generates complete Helm chart structures (`Chart.yaml`, `values.yaml`, templates) for containerized workloads. |
| **17** | **CDC State Relocation Engine** | Executes real-time Change Data Capture replication across databases with zero cutover downtime. |
| **18** | **Staged Cutover (`/stage-migration`)**| Manages phased multi-stage infrastructure cutovers with automated traffic weighting. |
| **19** | **Lift-and-Shift Studio (`/liftnshift`)**| Visual side-by-side reconciliation console displaying source vs. target deployment drift. |
| **20** | **Mathematical Invariant Engine** | Validates that cloud state transitions strictly conform to non-negotiable operational invariants. |
| **21** | **Kirchhoff Sum Verifier** | Proves incoming data flows equal outgoing flows plus delta ($\sum I_{\text{in}} = \sum I_{\text{out}} + \Delta S$), guaranteeing zero record loss. |
| **22** | **Welford Numerical Stability** | Uses Welford's algorithm to compute running variance without catastrophic floating-point cancellation. |
| **23** | **Synthetic Invariant Replay** | Replays historical workload spikes against transpiled infrastructure before cutover. |
| **24** | **Pre-Cutover Delta Diff Ledger** | Generates an immutable cryptographic audit ledger proving target parity against source systems. |
| **25** | **Rollback Canary Validation** | Continuously evaluates canary health during migration cutover to trigger automated rollback if error thresholds are breached. |

---

### 6.2 Full-Stack All-In-One Observability Suite (47 Capabilities)

| # | Feature / Capability | Functional Specification & Day-0 Purpose |
| :-: | :--- | :--- |
| **1–25** | **100% Migration Suite Included** | **All 25 Turnkey Migration capabilities above are included at $0 additional licensing cost.** |
| **26** | **First-Run Web Wizard (`/wizard`)** | Visual 5-step Day-0 browser guide for preflight checks, offline license activation, admin provisioning, and topology sizing. |
| **27** | **Admin Control Desk (`/AdminDesk`)** | Central console for Application Administrators (`Obs-Admins`) to manage users, RBAC roles, license keys, and audit trails. |
| **28** | **Cluster Admin (`/companyadmin`)** | Operational cockpit for Cluster Administrators to govern local node allocations, active licenses, and upgrade paths. |
| **29** | **DBA Desk (`/DBADesk`)** | Specialized read-only SQL scratchpad and schema inspector for Database Administrators (`Obs-DBA`). |
| **30** | **Offline Ed25519 Licensing** | Validates license entitlements entirely offline with $0.00 WAN egress. |
| **31** | **Central System Config SSOT** | Authoritative single-source-of-truth configuration ledger with cryptographic rollback history. |
| **32** | **Tier 1: Physical Host Invariants** | Verifies CPU temperature, ECC memory errors, NVMe endurance, fan speeds, and power supply redundancy. |
| **33** | **Tier 2: In-Guest OS & Memory Rings**| Monitors kernel slab allocations, context switch rates, thread scheduling jitter, and ring buffer saturation. |
| **34** | **Tier 3: Ingress/Mesh Telemetry** | Tracks interface packet drops, TCP retransmits, SYN floods, socket exhaustion, and VPC peering latency. |
| **35** | **Tier 4: Distributed Raft Consensus**| 3–5 node cluster quorum verification, leader heartbeat drift, and automated split-brain isolation. |
| **36** | **Tier 5: App Runtime Latencies** | Monitors GC pause times, thread pool queue depths, event loop lag, and p99.9 latency envelopes. |
| **37** | **Tier 6: Database & CDC Queues** | Tracks write-ahead log replication lag, table lock contention, checkpoint stalls, and connection pool exhaustion. |
| **38** | **Tier 7: Security SIEM Relays** | Audits root escalation attempts, unauthorized config changes, failed authentication spikes, and TLS expirations. |
| **39** | **Native OTLP Ingest (4317/4318)** | In-VPC collector accepting OpenTelemetry gRPC and HTTP traces/metrics directly without external agents. |
| **40** | **In-Guest Log Search (`/logs`)** | High-speed regex and structured JSON log search running over in-memory sliding ring buffers with zero disk thrashing. |
| **41** | **APM Trace Waterfall (`/traces`)** | Visual microservice transaction tracing with waterfall spans and Jaeger-compatible flamegraphs. |
| **42** | **Dual-Dispatch Enriched Relays** | Forwards critical, enriched incident telemetry to Splunk HEC, Syslog SIEM relays, PagerDuty, or ServiceNow. |
| **43** | **Zero WAN Cloud Ingestion Surcharges**| Keeps 100% of telemetry data inside the customer's VPC, avoiding high Datadog/Splunk cloud ingestion fees ($0.00 egress). |
| **44** | **In-Memory Sliding Ring Buffers** | Zero-allocation circular memory buffers ensuring deterministic microsecond-level telemetry processing. |
| **45** | **SRE Fleet Telemetry (`/dashboard`)**| Real-time node census, fleet health radar, and cluster telemetry graphs. |
| **46** | **24x7 NOC Wallboard (`/wallboard`)** | High-contrast wallboard display designed for big-screen Network Operations Center monitoring. |
| **47** | **Air-Gapped Kiosk (`/kiosk`)** | Clean, unattended full-screen status display for secure server room kiosks. |
| **48** | **2-Way NOC Desk (`/NOCDesk`)** | Interactive incident triage console allowing operators to acknowledge alerts, trigger runbooks, and silence nodes. |
| **49** | **SRE Incident Desk (`/SREDesk`)** | Deep diagnostics view showing real-time logs, trace context, and root-cause indicators during an active outage. |
| **50** | **Deployment Manifest Sizer (`/setup`)**| Generates production Docker Compose and systemd manifests tailored to cluster sizing. |

---

## 7. The Cryptographic Capacity Certificate Token

### 7.1 Anatomy Breakdown
```
  DCL-TOKEN  ─  49DA76870960433D1DB92FF7  ─  375N
  ─────────     ────────────────────────     ────
   Prefix        HMAC SHA-256 Digest          Certified Capacity
```

* **`DCL-TOKEN` (Prefix):** Designates an authentic `<dcouplr/>` Capacity Certificate Token.
* **`49DA76870960433D1DB92FF7` (Digest):** A 24-character hexadecimal HMAC SHA-256 digest calculated over:
  * Discovered node counts and hardware categories.
  * Discovered VPC CIDRs and subnet hashes.
  * Evaluation timestamp.
  * Client organization identifier.
* **`375N` (Capacity Suffix):** Certified total compute node capacity (e.g., 375 Nodes).

### 7.2 Security Invariant: Zero Topology Disclosure
The token allows prospective customers to share their verified capacity with `<dcouplr/>` Sales, Solutions Architects, or Procurement **without disclosing**:
* Internal IP addresses or VPC CIDRs.
* Hostnames, machine labels, or server roles.
* Internal cloud accounts or project IDs.

### 7.3 Day-0 Offline License Activation
Once procurement issues the enterprise license key matching the certified node count, the administrator activates the cluster completely offline:
```bash
dcouplr license activate --token DCL-TOKEN-49DA76870960433D1DB92FF7-375N
```
Or paste the token into Step 2 of the First-Run Web Wizard ([`http://localhost:8000/wizard`](http://localhost:8000/wizard)).

---

## 8. Exporting & Transitioning to Production

### 8.1 Exporting the Executive Markdown Dossier
Clicking the **"📄 Export Assessment Dossier"** button (`#btn-export-markdown`) generates a fully formatted, executive-ready markdown proposal.
* **Contents:** Executive summary, estate census, radar statistics, decision matrix, break-even math, and cryptographic token.
* **Audience:** Ready to be delivered directly to the CFO, VP of Infrastructure, or Procurement Review Board.

### 8.2 Launching the First-Run Installation Wizard
Clicking the **"🚀 Launch Day-0 Web Wizard"** button (`#btn-launch-wizard`) immediately transitions from the assessment phase into Day-0 deployment:
* Navigates to `http://localhost:8000/wizard`.
* Transfers the verified node count (e.g. `375`) and cryptographic token into the wizard context.
* Guides the administrator through preflight checks, offline license activation, application administrator provisioning, and topology generation.

---

## 9. Verification & CLI Command Cheat Sheet

### Common CLI Invocations:

```bash
# 1. Interactive GUI launcher
dcouplr assess --gui

# 2. Automated scan of AWS and GCP CIDRs with console summary
dcouplr assess \
  --customer "Acme Technologies" \
  --cidr "10.100.0.0/22" \
  --cidr "10.200.0.0/23"

# 3. Comprehensive multi-cloud + on-prem scan with markdown export
dcouplr assess \
  --customer "Global Financial Corp" \
  --cidr "10.100.0.0/22" \
  --cidr "10.200.0.0/23" \
  --baremetal "192.168.10.0/24" \
  --baremetal "172.16.50.0/24" \
  --output ./evaluation-dossier.md \
  --format markdown

# 4. JSON export for automated Terraform / Ansible provisioning
dcouplr assess \
  --customer "FinTech Cloud" \
  --cidr "10.0.0.0/16" \
  --output ./capacity.json \
  --format json
```

### Verification Tests:
To verify that all assessment endpoints, models, and calculation routines remain strictly compliant with reference benchmarks, run:
```bash
pytest tests/test_fleet_scout_assessment_tool.py
```
*(All 6 unit and integration tests verify $0.00 WAN egress, Either/Or suite integrity, and cryptographic token generation)*.
