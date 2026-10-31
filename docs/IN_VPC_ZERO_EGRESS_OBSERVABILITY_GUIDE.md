# <dcouplr/> In-VPC Zero-Egress Observability Guide
**Classification:** Public Engineering & Architecture Reference  
**Scope:** Replaces Datadog, Grafana, and Prometheus with In-VPC Zero-Egress Observability  

---

## Overview

When enterprise teams migrate their infrastructure, databases, and application services into a new private VPC, they face a critical architectural decision:
- Continue paying thousands of dollars monthly for **Datadog** (with recurring SaaS subscriptions and heavy cloud NAT gateway egress fees).
- Deploy and operate a complex self-hosted stack of **Prometheus**, Alertmanager, Thanos, and **Grafana** (with persistent operational and maintenance overhead).
- **OR** activate **`<dcouplr/>` as the unified In-VPC Zero-Egress Observability Platform**.

`<dcouplr/>` accomplishes what Prometheus, Grafana, and Datadog provide, but executes entirely inside the customer's private subnet with **zero billable cloud egress ($0.00 egress)**.

---

## 1. How `<dcouplr/>` Delivers the Observability Trinity

### A. The Prometheus Role: In-Memory Metric Collection & High-Speed Ring Buffers
- **Zero-Hop Sampling:** Metrics are collected directly in-process via lock-free volatile ring buffers (`InAppTelemetryCollector`).
- **High Resolution:** Pushes sub-second delta ticks (200ms–1000ms) rather than waiting for 15-to-60-second Prometheus scrape cycles.
- **Bounded Footprint:** Guaranteed memory ceiling under 50 MiB RAM, preventing memory leaks or OOM crashes.
- **Long-Term Storage (Optional):** Integrated **GAP-06 Prometheus Remote-Write Exporter** (`/v1/telemetry/remote-write/configure`) streams metrics using pure-Python Snappy-compressed Protobuf to in-VPC VictoriaMetrics, Mimir, or Thanos.

### B. The Grafana Role: Dual-Tier Zero-Egress Visualization
- **Live SRE Dashboard (`http://localhost:8000/dashboard`):** Real-time interactive canvas with Server-Sent Events (SSE) streaming, topology graph, FinOps cost analysis, and synthetic incident testing.
- **24x7 NOC Wallboard (`http://localhost:8000/wallboard`):** High-contrast TV display with canonical neon-green `<` and `/>` branding (`#39ff14`), live Raft consensus gauges, and automatic offline freeze protection.
- **Standalone CDN Distribution (`dist/pulsecast-cdn/index.html`):** Single-file bundle that can be hosted on private internal NGINX or S3 with zero external internet dependencies.

### C. The Datadog Role: The Compiler as the Living In-VPC Alerting Engine
- **AST Rule Transpilation (`http://localhost:8000/compiler`):** Takes legacy Datadog monitors, CloudWatch alarms, and NRQL alert definitions and transpiles them into clean Prometheus Alertmanager YAML, Grafana Unified Alerting, or OpenTelemetry configurations.
- **Dynamic VM Sizing Recalibration:** Automatically scales CPU, memory, and IOPS alert thresholds to match target VPC instance sizes.
- **In-VPC Execution:** Eliminates Datadog agent overhead and keeps 100% of telemetry data within the VPC private CIDR block.

---

## 2. Quick Comparison

| Feature | Prometheus | Grafana | Datadog | <dcouplr/> In-VPC |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Role** | Metric Scraper & TSDB | Visualization Frontend | SaaS Observability | Unified In-VPC Observability & Consensus |
| **Data Collection** | Pull-model scraping | Connects to external DBs | Push-model SaaS agent | In-memory ring buffer & SSE stream |
| **Visualization** | Basic console | Rich multi-source dashboards | Full SaaS dashboards | Built-in SRE Dashboard & 24x7 NOC Wallboard |
| **Rule Compiler** | Manual YAML authoring | Alert rule builder | Proprietary DSL monitors | Built-in AST Transpiler & Auto-Threshold Scaler |
| **Cloud Egress Cost** | Low (if internal) | Low (if internal) | **High** ($0.09/GB NAT egress) | **$0.00 Guaranteed (Zero Egress)** |
| **Hosting** | Self-hosted TSDB | Self-hosted or Cloud | Third-party vendor cloud | **100% In-VPC Private Subnet** |

---

## 3. Operational Runbook

For complete step-by-step installation instructions, tool prerequisites, exact file paths, and field troubleshooting procedures, see:
- [RUNBOOK-IN-VPC-ZERO-EGRESS-OBSERVABILITY.md](/docs/runbooks/RUNBOOK-IN-VPC-ZERO-EGRESS-OBSERVABILITY.md) (Interactive View Mode)
- [WALLBOARD_OPTIONS_BUILD_AND_DEPLOYMENT_RUNBOOK.md](/docs/runbooks/WALLBOARD_OPTIONS_BUILD_AND_DEPLOYMENT_RUNBOOK.md) (NOC Deployment Runbook)
- [RUNBOOK-DCOUPLR-REPLICATION-MIGRATION.md](/docs/runbooks/RUNBOOK-DCOUPLR-REPLICATION-MIGRATION.md) (Migration & Replication Runbook)
