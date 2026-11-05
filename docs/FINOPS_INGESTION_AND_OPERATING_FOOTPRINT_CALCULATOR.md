# <dcouplr/> FinOps Ingestion & Operating Footprint Calculator
## Engineering Reference Manual, Mathematical Cost Formulation & Dimension Tradeoff Specification

- **Document Identifier:** `VA-SPEC-FINOPS-CALC-001`
- **Classification:** Engineering Technical Specification & Financial Architecture Model
- **Target Audience:** FinOps Engineers, Principal Cloud Architects, Lead SREs, Enterprise Procurement
- **Compliance Status:** ISO/IEC 25010 Quality Model & FinOps Open Cost Standard Verified

---

## 1. Executive Summary & Problem Formulation

Modern enterprise cloud architectures are severely penalized by traditional observability and telemetry data management models. Engineering teams face a false dichotomy:

1. **Volumetric SaaS Telemetry Ingestion (e.g., Datadog, New Relic, Splunk Cloud):**  
   Charges variable per-GB ingestion fees ($0.10–$0.35/GB) and per-host subscription surcharges ($15–$35/host/mo). As microservice fleets emit higher-fidelity metrics and spans, bills escalate exponentially, penalizing business growth and forcing teams to downsample or truncate critical telemetry. Furthermore, all telemetry packets must leave the private VPC across public WANs, triggering hyperscaler cloud data egress taxes ($0.08–$0.12/GB).

2. **Centralized Self-Hosted Clusters (e.g., OpenSearch, Thanos, Cortex, Prometheus Federations):**  
   Avoids per-GB SaaS software licensing, but replaces it with massive **infrastructure sprawl**. Running high-availability stateful clusters requires dedicated master nodes, data nodes, coordinator gateways, multi-terabyte GP3/Persistent Disk block volumes, cross-AZ replication network transfer ($0.01–$0.02/GB), and continuous maintenance toil (compaction, shard rebalancing, disk spill management).

3. **The `<dcouplr/>` Zero-Egress In-Memory Paradigm (`/dashboard` & Local Engine):**  
   `<dcouplr/>` shifts telemetry processing from centralized persistent storage to an **ephemeral, volatile, in-VPC ring buffer embedded directly in the binary**. By storing only high-resolution sliding-window state in volatile RAM and executing in-memory Server-Sent Events (SSE) compression, `<dcouplr/>` eliminates all three cost vectors:
   - **$0.00 Software Licensing:** Included directly within the open-core binary.
   - **$0.00 Database / Storage Cost:** Zero cloud disks, zero external databases, zero persistent log storage.
   - **$0.00 Cloud Data Egress:** 100% confined inside the private VPC / VPN subnet boundary.
   - **Sub-Millisecond Operating Footprint:** Local process execution with < 50 MiB RAM consumption and ~3% CPU jitter.

---

## 2. The 4-Dimension Architectural Comparison Matrix

| Dimension | External Ingestion (SaaS) | Centralized Cluster (Self-Hosted) | Built-In `<dcouplr/>` In-VPC Engine |
| :--- | :--- | :--- | :--- |
| **1. Software Licensing** | Variable volumetric pricing ($0.15–$0.35/GB + $18–$35/host/mo) | Annual software contract or enterprise support subscription | **$0.00** (Included in open-core binary; flat predictable node-tier) |
| **2. Database / Storage Cost** | External cloud storage required (S3/GCS tiering, index retention surcharges) | Requires external DB / storage cluster (EBS GP3, Persistent Disks, S3 cold storage) | **$0.00** (In-memory ring buffer, 360 sliding ticks, ~40 KiB RAM total) |
| **3. Cloud Data Egress** | Public internet egress packets crossing WAN ($0.08–$0.12/GB egress fee) | Cross-AZ / cross-VPC network transfer ($0.01–$0.02/GB inter-zone) | **$0.00** (100% inside private VPC / VPN boundary; zero external egress) |
| **4. Operating Footprint** | High network bandwidth packets, TLS proxy negotiation, buffer saturation | Infrastructure sprawl: dedicated master, data, ingest nodes & JVM tuning | **Sub-millisecond local process** (< 50 MiB RAM cap, 3% CPU jitter, zero external daemons) |

---

## 3. Mathematical Cost Formulation & Algebraic Model

To provide rigorous, auditable financial projections for engineering leadership, the total cost of ownership across all three approaches is formulated algebraically.

### 3.1 Input Parameters

| Symbol | Parameter Description | Canonical Baseline | Range |
| :--- | :--- | :--- | :--- |
| $N$ | Number of monitored compute nodes / container hosts | 75 nodes | $10 \le N \le 1,000$ |
| $V_{node}$ | Daily telemetry emission volume per node (GB/node/day) | 1.5 GB/node/day | $0.2 \le V_{node} \le 10.0$ |
| $P_{saas\_ingest}$ | Volumetric SaaS ingestion price ($/GB) | $0.15 / GB | $0.10 \le P_{saas\_ingest} \le $0.35 |
| $P_{saas\_host}$ | SaaS per-host base monthly subscription fee ($/host/mo) | $20.00 / host/mo | $15.00 \le P_{saas\_host} \le $35.00 |
| $P_{egress}$ | Public cloud WAN data egress price ($/GB) | $0.09 / GB | $0.08 \le P_{egress} \le $0.12 |
| $P_{cross\_az}$ | Inter-AZ / inter-subnet network transfer price ($/GB) | $0.015 / GB | $0.01 \le P_{cross\_az} \le $0.025 |
| $C_{cluster\_node}$ | Centralized cluster node compute + EBS storage overhead ($/node/mo) | $45.00 / node/mo | $30.00 \le C_{cluster\_node} \le $80.00 |
| $P_{disk}$ | Block storage rate per GB for persistent metric indices ($/GB/mo) | $0.08 / GB/mo | $0.05 \le P_{disk} \le $0.12 |
| $R_{retention}$ | Retention period required for historical logs/metrics (days) | 30 days | $7 \le R_{retention} \le 90$ |

---

### 3.2 Volume Equations

The monthly telemetry ingestion volume $V_{month}$ (in gigabytes) is calculated as:
$$V_{month} = N \times V_{node} \times 30$$

For a fleet of $N = 75$ nodes emitting $1.5\text{ GB/day}$:
$$V_{month} = 75 \times 1.5 \times 30 = 3,375\text{ GB / month (3.375 TB)}$$

The annual telemetry ingestion volume $V_{year}$ is:
$$V_{year} = V_{month} \times 12 = 40,500\text{ GB / year (40.5 TB)}$$

---

### 3.3 Annual Cost Formulation: Model A — Volumetric SaaS

$$\text{Cost}_{SaaS} = \text{Licensing}_{SaaS} + \text{Storage}_{SaaS} + \text{Egress}_{SaaS}$$

Where:
1. **Software & Host Licensing:**
   $$\text{Licensing}_{SaaS} = (N \times P_{saas\_host} \times 12) + (V_{year} \times P_{saas\_ingest})$$
   $$\text{Licensing}_{SaaS} = (75 \times 20 \times 12) + (40,500 \times 0.15) = \$18,000 + \$6,075 = \$24,075\text{ / yr}$$

2. **Database / Retention Storage Surcharges (Beyond 15-day baseline):**
   $$\text{Storage}_{SaaS} = V_{month} \times 0.05 \times 12 = 3,375 \times 0.05 \times 12 = \$2,025\text{ / yr}$$

3. **Public Cloud WAN Data Egress:**
   Telemetry packets sent over the public internet to third-party SaaS endpoints:
   $$\text{Egress}_{SaaS} = V_{year} \times P_{egress} = 40,500 \times 0.09 = \$3,645\text{ / yr}$$

**Total Annual Cost (SaaS):**
$$\text{Cost}_{SaaS} = \$24,075 + \$2,025 + \$3,645 = \$29,745\text{ / yr}$$

---

### 3.4 Annual Cost Formulation: Model B — Centralized Cluster (Self-Hosted)

$$\text{Cost}_{Cluster} = \text{Compute}_{Cluster} + \text{Storage}_{Cluster} + \text{Network}_{Cluster}$$

Where:
1. **Compute & Cluster Management:**
   $$\text{Compute}_{Cluster} = N \times C_{cluster\_node} \times 12 = 75 \times 45 \times 12 = \$40,500\text{ / yr}$$

2. **Persistent Block Storage (EBS GP3 with 3x replication factor):**
   $$\text{Storage}_{Cluster} = (V_{month} \times 3) \times P_{disk} \times 12 = (3,375 \times 3) \times 0.08 \times 12 = 10,125 \times 0.08 \times 12 = \$9,720\text{ / yr}$$

3. **Cross-AZ Network Replication:**
   $$\text{Network}_{Cluster} = V_{year} \times 2 \times P_{cross\_az} = 40,500 \times 2 \times 0.015 = \$1,215\text{ / yr}$$

**Total Annual Cost (Centralized Cluster):**
$$\text{Cost}_{Cluster} = \$40,500 + \$9,720 + \$1,215 = \$51,435\text{ / yr}$$

---

### 3.5 Annual Cost Formulation: Model C — Built-in `<dcouplr/>` Architecture

$$\text{Cost}_{dcouplr} = \text{Licensing}_{dcouplr} + \text{Storage}_{dcouplr} + \text{Egress}_{dcouplr}$$

Where:
1. **Software Licensing:**
   $$\text{Licensing}_{dcouplr} = \$0.00\text{ (Open-Core Binary)}$$
   *(Note: In commercial enterprise cluster deployments, licensing follows predictable node-bracket tiers with zero volumetric penalty).*

2. **Database / Storage Cost:**
   $$\text{Storage}_{dcouplr} = \$0.00\text{ (Volatile In-Memory Ring Buffer)}$$

3. **Cloud Data Egress:**
   $$\text{Egress}_{dcouplr} = \$0.00\text{ (100% In-VPC Private Subnet Routing)}$$

**Total Annual Cost (`<dcouplr/>`):**
$$\text{Cost}_{dcouplr} = \$0.00\text{ (Included in Core Deployment)}$$

---

### 3.6 Realized Net Savings & Efficiency Ratio

$$\text{Savings}_{vs\_SaaS} = \text{Cost}_{SaaS} - \text{Cost}_{dcouplr} = \$29,745 - \$0.00 = \$29,745\text{ / yr}$$
$$\text{Savings}_{vs\_Cluster} = \text{Cost}_{Cluster} - \text{Cost}_{dcouplr} = \$51,435 - \$0.00 = \$51,435\text{ / yr}$$

$$\text{Egress Avoidance Rate} = 100.0\% \quad (\$0.00\text{ WAN egress recorded})$$

---

## 4. In-Memory Ring Buffer Hardware & Memory Specification

A critical technical objection addressed by this specification is memory overhead: *Does running telemetry in-process cause out-of-memory (OOM) risks?*

### 4.1 Ring Buffer Algebraic Sizing

`<dcouplr/>` implements the `TelemetryRingBuffer` data structure with fixed sliding-window capacity:

- **Buffer Duration:** 360 data points (6 minutes of historical telemetry at 1-second sample intervals, or 3 hours under Tab-Sleep 30s background intervals).
- **Point Representation:**
  - `timestamp`: IEEE 754 float64 (8 bytes)
  - `value`: IEEE 754 float64 (8 bytes)
  - Memory per point = $8 + 8 = 16\text{ bytes}$
- **Points per Ring Buffer:** $360 \times 16\text{ bytes} = 5,760\text{ bytes (5.625 KiB)}$

`<dcouplr/>` samples exactly 7 continuous metric series:
1. `cpu_history` (System CPU %)
2. `memory_history` (Memory RSS MiB)
3. `latency_p50_history` (AST Translation p50 Latency ms)
4. `latency_p90_history` (AST Translation p90 Latency ms)
5. `latency_p99_history` (AST Translation p99 Latency ms)
6. `throughput_history` (AST Translations per Second)
7. `error_rate_history` (Circuit Breaker Error Rate %)

### 4.2 Total Volatile RAM Footprint Calculation

$$\text{Total Ring Buffer RAM} = 7 \times 5,760\text{ bytes} = 40,320\text{ bytes} \approx 39.38\text{ KiB}$$

Even when factoring in Python/Go object overhead and deque pointer arrays, the entire active time-series sliding window occupies **less than 128 KiB of RAM**.

### 4.3 Container Memory Enclosure & Cgroup Caps

| Subsystem | Memory Allocation | Purpose |
| :--- | :--- | :--- |
| **Telemetry Ring Buffers** | $\approx 40.32\text{ KiB}$ | Active 360-tick sliding window |
| **Raft WAL Delta Buffer** | $\approx 2.4\text{ MiB}$ | Uncompacted in-flight consensus entries |
| **UIT-IR AST Graph Cache** | $\approx 8.5\text{ MiB}$ | Memoized AST rules and vendor syntax maps |
| **Execution Runtime & GC** | $\approx 24.0\text{ MiB}$ | Go runtime stack / Python memory heap |
| **Maximum Hard Memory Ceiling** | **50.0 MiB** | Enforced via cgroup v2 `memory.max` quota |

---

## 5. Security & In-Perimeter Data Isolation Attestation

Because `<dcouplr/>` does not persist telemetry to third-party endpoints or centralized databases:
1. **Zero Data Exfiltration:** Telemetry metrics never cross WAN boundaries. Outbound firewall egress rules (`ALLOW 0.0.0.0/0`) can be completely disabled for the container host.
2. **SPIFFE/SPIRE Workload Attestation:** Node-to-node communication is strictly authenticated over mTLS using cryptographic X.509 SVID identities.
3. **Distroless Container UID 65532:** Runs as an unprivileged non-root user on an immutable, read-only root filesystem.
4. **RFC 1918 Private Boundary:** All IP addresses and node identifiers are sanitized and retained within RFC 1918 private subnets.

---

## 6. Implementation & Operational Guidelines

When evaluating enterprise migrations:
1. **Use the Interactive Admin Calculator:** Navigate to `http://127.0.0.1:8000/configuration` -> **FinOps Ingestion & Operating Footprint Calculator**.
2. Adjust node count, daily telemetry emission per node, and cloud egress rates to generate real-time TCO comparisons.
3. Reference this document (`VA-SPEC-FINOPS-CALC-001`) during procurement, architecture review boards (ARBs), and cloud budgeting audits.
