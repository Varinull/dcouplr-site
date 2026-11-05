# <span class="dcouplr-wordmark"><span class="dcouplr-bracket">&lt;</span><span class="dcouplr-text">dcouplr</span><span class="dcouplr-bracket">/&gt;</span></span> Operations Runbook: In-VPC Capabilities Sizer & Deployment Wizard (`/setup`)

```
DOCUMENT ID:       RUN-IN-VPC-SETUP-SIZER-001
SECURITY LEVEL:    CLEARED_CUSTOMER_PUBLIC • IN-PERIMETER PRODUCTION OPERATION
CONSOLE TARGET:    /setup (http://localhost:8000/setup)
DELIVERY MODEL:    100% In-VPC Air-Gapped Sizing & Manifest Synthesis
AUDIT STANDARD:    SOC 2 Type II, ISO/IEC 27001, NIST SP 800-207 Zero Trust, HIPAA, PCI-DSS v4.0
VERSION:           v4.2.0-ENTERPRISE-SIZER
EFFECTIVE DATE:    November 2026
CANONICAL WORDMARK: <dcouplr/>
```

---

## 1. Operational Overview: What is `/setup`?

The **`/setup`** endpoint ([http://localhost:8000/setup](http://localhost:8000/setup)) is the **In-VPC Capabilities Sizer & Deployment Wizard** for **`<dcouplr/>`**.

When preparing cloud migrations or standardizing private observability infrastructure, engineering organizations encounter two friction points:
1. **Unpredictable SaaS Egress & Licensing Fees**: Legacy SaaS monitoring tools stream telemetry over the public internet, creating runaway Cloud WAN egress bills and escalating per-seat costs.
2. **Resource Allocation Guesswork**: SREs need exact CPU, memory, and container specifications before approving deployments into private subnets or edge clusters.

The `/setup` wizard resolves this by providing an interactive, client-side capacity calculator and multi-target manifest generator. Teams can select deployment profiles, toggle individual capabilities, view real-time memory allocations, and export production-ready manifests.

---

## 2. In-VPC Sizing Profiles (1-Click Presets)

The wizard includes four pre-calibrated deployment tiers:

| Preset Tier | RAM Allocation | Infrastructure Target | Active Capabilities |
| :--- | :---: | :--- | :--- |
| ⚡ **Minimal Core** | **35 MiB RAM** | Bare-metal, Edge nodes, Micro-VMs (`t4g.nano`, `f1-micro`) | Consensus & CDC replication engine (Module 1). |
| 📊 **Standard SRE** | **~85 MiB RAM** | General Cloud VMs (`t3.small`, `e2-small`) | Core Engine + Live SRE Dashboard (`/dashboard`) + 24x7 NOC Wallboard (`/wallboard`) + OTel Ingestion Gateway. |
| 🚀 **Full-Stack Enterprise** | **~365 MiB RAM** | Production App Clusters (`m5.large`, `c2-standard-4`) | Core + Wallboard + OTel + Jaeger/Tempo APM (`/traces`) + VictoriaLogs (`/logs`) + `cloaudit` FinOps bridge. |
| 📜 **Regulated Compliance** | **~445 MiB RAM** | FinServ, Healthcare, Audited Air-Gapped Enclaves | Full-Stack Enterprise + VictoriaMetrics Long-Term TSDB for 1-to-7 year regulatory compliance archives. |

---

## 3. Modular In-VPC Capabilities Breakdown

Operators can calibrate `<dcouplr/>`'s footprint by enabling or disabling specific modules:

1. **Core Consensus & Replication Engine (35 MiB RAM — Mandatory)**:
   * Change Data Capture (CDC) block replication lag, Go Raft quorum health, volatile lock-free ring buffers, and SHA-256 cryptographic state seals.
   * Port: `8000` | Protocol: gRPC / Raft
2. **Infrastructure Telemetry & 24x7 NOC Wallboard (+15 MiB RAM)**:
   * Sub-second CPU, RAM, and socket streaming; Live SRE HUD (`/dashboard`); 24x7 NOC Wallboard (`/wallboard`); and Living AST Compiler Studio (`/compiler`).
   * Protocol: 60 FPS Server-Sent Events (SSE)
3. **In-VPC OpenTelemetry (OTel) Collector Pipeline (+35 MiB RAM)**:
   * CNCF-compliant OTLP ingestion gateway. Receives telemetry directly from workloads without SaaS vendor agents.
   * Ports: `4317` (gRPC), `4318` (HTTP) | In-Memory PII Token Scrubbing
4. **Code-Level Distributed APM Tracing (+120 MiB RAM — Replaces Datadog APM)**:
   * In-VPC Jaeger / Tempo sidecar engine: request span tracing, database latency attribution, and flamegraphs (`/traces`).
   * Protocol: W3C TraceContext | Sampling: 100% In-VPC
5. **High-Throughput Log Search Engine (+150 MiB RAM — Replaces Datadog Logs)**:
   * In-VPC VictoriaLogs sidecar engine: sub-second regex queries, million-line-per-hour ingestion, and zero JVM indexing overhead (`/logs`).
   * Storage: Compressed Block Store
6. **Long-Term Historical Time-Series TSDB (+80 MiB RAM — GAP-06)**:
   * In-VPC VictoriaMetrics TSDB receiving metrics via Prometheus Remote-Write for multi-year regulatory audits.
   * Retention: 1 to 7 Years Configurable
7. **FinOps Cost Auditor Bridge (+10 MiB RAM — `cloaudit` integration)**:
   * Inter-process coordination with `cloaudit` (Port 3780) to detect unutilized downscaled capacity and prevent redundant NAT data transfer charges.
   * Protocol: Private IPC

---

## 4. Multi-Target Deployment Manifests

The right-hand panel of `/setup` dynamically generates deployment configuration code tailored to the active module selection:

* **Docker Compose** (`docker-compose.yml`): Complete multi-container deployment configured for host networking and shared volumes.
* **Kubernetes Helm / DaemonSet** (`dcouplr-values.yaml`): Helm values file declaring eBPF ring buffers, resource limits, and service ports.
* **Linux systemd** (`/etc/systemd/system/dcouplr.service`): Systemd unit file with strict `MemoryMax` boundaries, file descriptor limits, and non-root execution.
* **OpenTofu HCL** (`landing_zone.tf`): Infrastructure-as-code module provisioning private subnets, security groups, and IAM profiles with zero-egress enforcement.
* **1-Click Interactive CLI**: Rapid bootstrap script for local evaluation and automated provisioning.

---

## 5. Verification & Zero-WAN Egress Guarantee

Every manifest synthesized by `/setup` guarantees:
* **Cloud WAN Egress**: `$0.00 / mo` (Private mesh routing only; zero public internet traversal).
* **Data Sovereignty**: `100% In-VPC (RFC 1918)` (No customer data leaves the customer-controlled VPC).
* **Seat Licensing Overhead**: `$0 (Unlimited Users)` (No per-seat monitoring tax).

