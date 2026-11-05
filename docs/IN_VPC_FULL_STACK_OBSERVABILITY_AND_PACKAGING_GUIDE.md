# <dcouplr/> In-VPC Full-Stack Observability & Commercial Packaging Guide
**Document ID:** `VA-GUIDE-OBS-PACKAGING-001`  
**Classification:** Enterprise Engineering, Field Operations & Commercial FinOps Strategy  
**Audience:** Enterprise Customers, Cloud Architects, SRE Leads, and Commercial Operations  

---

## 1. Executive Summary: The Modular In-VPC Observability Architecture

`<dcouplr/>` introduces a **Modular Capabilities Checklist** that transforms installation from a one-size-fits-all binary into a tailored, scalable in-VPC observability deployment.

Customers configure their exact operational footprint during installation:
- **Low Footprint (< 50 MiB RAM):** Core Consensus, Replication, Host Metrics, and 24x7 NOC Wallboard.
- **Enterprise Max (~385 MiB RAM):** Full-Stack Observability Suite including OpenTelemetry OTLP Ingestion, Code-Level APM Tracing (request flamegraphs), and High-Throughput Log Search.

```
+----------------------------------------------------------------------------------------------------+
|                                    PRIVATE VPC BOUNDARY (10.0.0.0/16)                             |
|                                                                                                    |
|                              CUSTOMER SRE / NOC WEB BROWSER                                        |
|                                            |                                                       |
|                                            v                                                       |
|                        +---------------------------------------+                                   |
|                        |   <dcouplr/> Unified Gateway (:8000)  |                                   |
|                        +---------------------------------------+                                   |
|                                 |       |       |       |                                          |
|      +--------------------------+       |       |       +--------------------------+               |
|      |                                  |       |                                  |               |
|      v                                  v       v                                  v               |
|  /dashboard & /wallboard             /compiler  /traces                            /logs           |
|  [Built-in SRE HUD & NOC]            [AST Rule] [In-VPC Jaeger / Tempo Sidecar]    [In-VPC Victoria|
|                                                 - Method execution flamegraphs      Logs Sidecar]  |
|                                                 - Distributed request spans        - Millions of   |
|                                                                                      lines/hr      |
|                                                                                    - Fast grep UI  |
|                                                                                                    |
|   INCOMING APPLICATION TELEMETRY (Private Subnet):                                                 |
|   App Services ======> OTLP Port 4317 (gRPC) / 4318 (HTTP) ======> In-VPC OTel Collector Sidecar   |
|                                                                                                    |
|   PUBLIC INTERNET (0.0.0.0/0): [BLOCKED / ZERO PACKETS / $0.00 BILLABLE CLOUD EGRESS]              |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Capabilities Checklist Matrix

| # | Capability Module | Engine / Sidecar | RAM Footprint | Operational Role |
| :- | :--- | :--- | :--- | :--- |
| **1** | **Consensus & CDC Replication** | Go Raft In-Memory | ~35 MiB RAM | Change Data Capture (CDC) block replication lag, Raft quorum health, SHA-256 zero-egress attestation. *(Mandatory Core)* |
| **2** | **Host Metrics & 24x7 Wallboard** | In-App Ring Buffers | +15 MiB RAM | Host CPU, RAM, network I/O, socket descriptors, Live SRE Dashboard (`/dashboard`), 24x7 NOC Wallboard (`/wallboard`). *(Recommended)* |
| **3** | **Living AST Alert Compiler** | In-Memory AST Engine | Negligible | Transpiles Datadog, New Relic NRQL, and CloudWatch alerts into calibrated Prometheus/Grafana rules (`/compiler`). |
| **4** | **In-VPC OTel Collector Pipeline** | OTel Core Sidecar | +35 MiB RAM | Standard CNCF OTLP v1.0 ingestion receivers (gRPC port 4317, HTTP port 4318) for native application frameworks. |
| **5** | **Code-Level APM Tracing** | In-VPC Jaeger Sidecar | +120 MiB RAM | End-to-end distributed span tracing, SQL query latency, and method execution flamegraphs (`/traces`). Replaces Datadog APM & New Relic. |
| **6** | **High-Throughput Log Search** | In-VPC VictoriaLogs | +150 MiB RAM | Millions of stdout/syslog lines/hour with instant regex grep and zero Lucene indexing overhead (`/logs`). Replaces Datadog Logs & Loki. |
| **7** | **Long-Term Cold TSDB (GAP-06)** | In-VPC VictoriaMetrics | +80 MiB RAM | Prometheus Remote-Write protocol with Snappy Protobuf compression for 1-to-7 year regulatory retention. |

---

## 3. Deployment Profiles & Installation

### Profile A: Core (`--profile core`)
- **Modules Enabled:** 1
- **Footprint:** ~35 MiB RAM
- **Use Case:** Headless database state replication nodes and consensus bridge agents.

### Profile B: Infra (`--profile infra`) — Default
- **Modules Enabled:** 1, 2, 3
- **Footprint:** ~50 MiB RAM
- **Use Case:** Standard production cluster nodes, NOC wallboard monitoring, Datadog alert migration.

### Profile C: Full Observability (`--profile full-observability`)
- **Modules Enabled:** 1, 2, 3, 4, 5, 6, 7
- **Footprint:** ~385 MiB RAM
- **Use Case:** Full replacement of Datadog, New Relic, Grafana, and Prometheus.

```bash
# Configure via CLI:
dcouplr setup --profile full-observability --compose

# Or run interactive web checklist:
http://localhost:8000/setup
```

---

## 4. Commercial Packaging & Value Assessment: Should the Cost Increase?

### A. The Core Value Shift: "Migration Tool" vs. "Permanent Observability Platform"
- **Before This Capability:** `<dcouplr/>` was purchased primarily as a **one-time migration utility**. Migration budgets are typically discretionary project expenses capped at $15,000–$25,000.
- **With This Capability:** `<dcouplr/>` becomes a **Permanent Operational Observability Platform**. It replaces Datadog ($15–$23/host/mo base + $0.10/GB logs + APM fees = ~$120/host/mo blended) and New Relic ($0.35/GB + user seats).

### B. Enterprise Cost Comparison (100 Production Nodes)

| Cost Component | Datadog + AWS Cloud | New Relic + AWS Cloud | <dcouplr/> Full Suite |
| :--- | :--- | :--- | :--- |
| **Base Infrastructure Agents** | $27,600 / yr ($23/host) | $18,000 / yr | Included in Tier |
| **APM Distributed Tracing** | $37,200 / yr ($31/host) | Included in GB pricing | Included in Tier |
| **Log Management (5 TB/mo)** | $30,000 / yr ($0.50/GB) | $21,000 / yr ($0.35/GB) | Included in Tier |
| **Cloud NAT Gateway Egress** | $18,000 / yr ($0.09/GB) | $18,000 / yr ($0.09/GB) | **$0.00 (Zero Egress)** |
| **Total Annual Cost** | **$112,800 / year** | **$78,000 / year** | **$36,000 – $48,000 / year** |
| **Customer Net Savings** | — | — | **57% – 68% Annual Savings** |

### C. Recommended Commercial Packaging Strategy
Do not apply an indiscriminate flat price hike. Instead, use a **Modular Value-Tier Multiplier**:

1. **Base Tier (Cluster Small / Medium / Large):**
   - Retains current competitive pricing ($1,500/mo, $3,500/mo, $45/node/mo).
   - Covers Core Consensus, Replication, Host Metrics, and 24x7 NOC Wallboard.
2. **Full-Stack Observability Add-On (+ $30/node/month or +$1,500/mo package):**
   - Unlocks the In-VPC OpenTelemetry Collector, Jaeger APM, and VictoriaLogs orchestration.
   - Total customer price moves to **$75/node/month**—still **37% below Datadog's $120/host blended rate**, while increasing `<dcouplr/>` contract values from $42,000 to **$90,000 ARR**.
3. **Enterprise Site License ($120,000/year flat):**
   - Unlimited nodes, full-stack APM & Log Search, and dedicated FinOps support with `cloaudit`.

