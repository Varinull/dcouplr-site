# <dcouplr/> Source-to-Target Monitoring Lift & Shift Guide

## Cross-Cloud Observability Transpilation, Dynamic Threshold Recalibration & In-VPC Packaging

This guide specifies how `<dcouplr/>` migrates, translates, and packages existing observability configurations during a cloud lift-and-shift migration. Whether an enterprise is running an existing open-source **Prometheus + Grafana** stack at the source or commercial SaaS suites (**Datadog**, **New Relic**, **Dynatrace**, **Splunk Cloud**, **AWS CloudWatch**, or **Azure Monitor**), this document details the migration difficulty, failure modes, automated translation engines, and packaging mechanisms into an air-gapped, zero-egress in-VPC monitoring bundle.

---

## 1. Executive Summary & The Lift-and-Shift Dilemma

During an enterprise cloud lift-and-shift, compute workloads (VMs, containers, databases, networks) are migrated from on-premises datacenters or source cloud VPCs to target cloud VPCs (AWS, GCP, or Azure). However, **observability is frequently treated as an afterthought**, resulting in catastrophic operational blind spots:

```
+----------------------------------------------------------------------------------------------------+
|                               THE MONITORING MIGRATION RISK SPECTRUM                                |
|                                                                                                    |
|   MANUAL RE-ENGINEERING (HIGH RISK)                 <dcouplr/> AUTOMATED TRANSPILATION (SAFE)       |
|   - 2 to 4 weeks of manual SRE rewriting             - < 30 seconds deterministic AST compilation   |
|   - Broken scrape targets & IP hardcoding           - Automated VPC CIDR & DNS remapping           |
|   - Alert false negatives from tag mismatch         - Universal UIT-IR AST normalization           |
|   - Threshold distortion from VM resizing           - Dynamic Tier Scale Factor recalibration      |
|   - Grafana datasource UID invalidation             - In-VPC datasource UID binding                |
|   - Public WAN egress costs ($0.09/GB egress)        - 100% In-VPC Zero-Egress Guarantee ($0.00)   |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. What Happens When the Source Has Prometheus & Grafana?

A common enterprise misconception is that if the source environment already runs **Prometheus + Grafana**, migrating to a target cloud is trivial ("just copy the YAML files"). 

In practice, a direct lift-and-shift of Prometheus and Grafana without transpilation **fails in production** due to five critical failure modes:

### Failure Mode 1: Network Topology & Scrape Target Invalidation
* **The Symptom:** All targets in target Prometheus show `DOWN` with `context deadline exceeded` or `connection refused`.
* **The Root Cause:** Source `prometheus.yml` scrape configurations contain hardcoded source IPs (e.g. `targets: ['172.16.1.15:9100']`), on-premises DNS names (`node1.corp.internal`), or AWS EC2 service discovery (`ec2_sd_configs`). In the target VPC, the subnet CIDRs and instance IPs are completely different (e.g. `10.200.10.15:9100`).
* **`<dcouplr/>` Remediation:** `<dcouplr/>` parses the source scrape configuration, cross-references the lift-and-shift subnet and DNS remapping table (`target_subnets` and `dns_remapping`), and rewrites all scrape targets to target in-VPC private DNS records (`*.mesh.internal`).

### Failure Mode 2: Label Context Drift (Silent Alert Extinction)
* **The Symptom:** Applications crash in the target VPC, but zero alerts fire (100% false negatives).
* **The Root Cause:** PromQL alert expressions rely on source metadata labels:
  ```promql
  # Source rule:
  avg(rate(node_cpu_seconds_total{cloud="aws", region="us-east-1", vpc="vpc-01a2b3c"}[5m])) > 85
  ```
  In the target VPC (e.g. Google Cloud `us-central1` or target VPC `vpc-target-gcp`), these labels match zero series. The query returns an empty vector, so the alert condition never triggers.
* **`<dcouplr/>` Remediation:** `<dcouplr/>` strips legacy environment-specific label filters and replaces them with target VPC identifiers (`vpc="target-vpc"`, `region="us-central1"`), preserving monitoring coverage with zero silent dropouts.

### Failure Mode 3: The VM Downscaling Threshold Distortion Trap
* **The Symptom:** Constant false alarm paging storms OR total failure to alert on memory/IOPS exhaustion.
* **The Root Cause:** Cloud migrations frequently involve right-sizing or downscaling over-provisioned source instances (e.g. downscaling an on-premises 32 GB RAM server to a cost-effective 8 GB `e2-standard-2` or `Standard_B2s` instance). An alert rule configured for the source:
  ```promql
  # Source rule (calibrated for 32 GB RAM):
  node_memory_MemAvailable_bytes < 8589934592  # Alert if free memory < 8 GB
  ```
  On an 8 GB target instance, free memory is **never** above 8 GB! The alert triggers immediately upon deployment and stays permanently firing. Conversely, percentage alerts on downscaled CPUs leave inadequate headroom during traffic bursts.
* **`<dcouplr/>` Remediation:** `<dcouplr/>` executes `calculate_tier_scale_factor(orig_tier, target_tier)` and automatically recalibrates thresholds:
  * Absolute memory/disk/connection limits are scaled by the capacity factor (e.g., $8\,\text{GB} \times 0.25 = 2048\,\text{MB}$).
  * Percentage headroom is tightened on downscaled compute instances (e.g., 85% threshold adjusted to 75% or 80%) to account for reduced burst absorption.

### Failure Mode 4: Grafana Datasource UID Fragmentation
* **The Symptom:** Imported Grafana dashboards display empty panels with `Data source not found` errors.
* **The Root Cause:** Grafana 8+ binds panels to datasources using internal unique identifiers (`datasource: { uid: "prom-src-prod-01" }`). In a newly provisioned Grafana instance in the target VPC, those source UIDs do not exist.
* **`<dcouplr/>` Remediation:** `<dcouplr/>`’s generator traverses the dashboard JSON AST, replaces orphaned datasource references with the target in-VPC VictoriaMetrics UID (`dcouplr-victoriametrics`), and rewrites template variable query filters.

### Failure Mode 5: Zero-Egress Webhook & Alertmanager Breaches
* **The Symptom:** Alertmanager fails to deliver notifications, or causes security compliance violations.
* **The Root Cause:** Source Alertmanager configurations route alerts to public internet SaaS endpoints (PagerDuty, Slack, Opsgenie, public webhook URLs). In an enterprise air-gapped or zero-egress target VPC, outbound WAN connections are dropped by firewall rules.
* **`<dcouplr/>` Remediation:** `<dcouplr/>` redirects alert routing to in-VPC notification relays, local SRE wallboards (`/wallboard`), or secure private transit endpoints, enforcing strict zero-egress compliance ($0.00 cloud egress fees).

---

## 3. Multi-Vendor Translation Difficulty & Feasibility Analysis

Below is an exhaustive comparison of the translation complexity across all seven major observability ecosystems:

| Source Observability Platform | Query Language & Format | Manual Translation Difficulty | Risk of Blind Spots | <dcouplr/> Transpilation Engine | Automated Migration Time |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Prometheus + Grafana** | PromQL, YAML, Grafana JSON | **Moderate** (3–5 days) | High (UIDs, CIDRs, static thresholds) | `PrometheusRuleParser` & `GrafanaAlertGenerator` | **< 30 seconds** |
| **Datadog** | Datadog Query syntax, Monitor JSON | **Extremely High** (2–3 weeks) | Severe (multi-window alerts, notification syntax) | `DatadogMonitorParser` & `alert_transpiler.py` | **< 2 minutes** |
| **New Relic** | NRQL (SQL-like), NerdGraph | **Extremely High** (2–3 weeks) | Severe (SQL-to-Vector mismatch, facet logic) | `NewRelicNRQLParser` | **< 2 minutes** |
| **Dynatrace** | Davis AI profiles, Metric Events | **Very High** (3–4 weeks) | Severe (proprietary AI baseline translation) | `DynatraceParser` & Holt-Winters Statistical Synthesis | **< 3 minutes** |
| **Splunk Cloud** | SPL (Search Processing Language) | **Very High** (3–4 weeks) | Severe (SPL pipe parsing into metric vs log stream) | `SplunkAlertParser` & LogQL/PromQL dual-path compiler | **< 3 minutes** |
| **AWS CloudWatch** | CloudWatch Metric Math, Namespaces | **Moderate–High** (1–2 weeks) | Moderate (metric math, AWS namespace remapping) | `CloudWatchAlarmParser` | **< 1 minute** |
| **Azure Monitor** | KQL (Kusto Query Language), ARM | **Moderate–High** (1–2 weeks) | Moderate (KQL summarize/bin syntax to PromQL) | `AzureMonitorParser` | **< 1 minute** |

---

## 4. Deep Technical Breakdown: How <dcouplr/> Translates Each Platform

`<dcouplr/>` achieves deterministic translation by decoupling vendor syntax from telemetry semantics through the **Universal Infrastructure & Telemetry Intermediate Representation (`UIT-IR`)**.

```
[ Vendor Source Format ]       [ UIT-IR Graph ]              [ Target In-VPC Artifacts ]
  Prometheus YAML        -->                                   --> Prometheus Alertmanager YAML
  Datadog JSON           -->                                   --> Grafana Unified Alerting YAML
  New Relic NRQL         -->   Normalized Metric Target AST    --> Grafana Dashboards JSON
  Dynatrace Events       -->   (Metric, Tags, Math, Threshold) --> In-VPC OTel Collector YAML
  Splunk SPL             -->                                   --> OpenTofu / Bicep Monitoring IaC
  AWS CloudWatch         -->                                   --> Dual-Run Shadow Sync Config
  Azure Monitor KQL      --> 
```

### 4.1. Prometheus + Grafana &rarr; Target In-VPC
* **Source AST:** Ingested via `PrometheusRuleParser`. Extracts alert expression, duration (`for`), labels, and annotations.
* **Transformation:** Resolves CIDR boundaries and instance IPs to the target subnet topology. Applies `calculate_tier_scale_factor` to memory and disk thresholds.
* **Target Output:** Re-calibrated `PrometheusRule` manifests and Grafana dashboard JSON with updated datasource UIDs.

### 4.2. Datadog &rarr; Target In-VPC
* **Source AST:** Ingested via `DatadogMonitorParser`. Parses Datadog grammar:
  ```datadog
  avg(last_5m):system.cpu.user{environment:prod} by {host} > 85
  ```
* **Transformation:** Maps `system.cpu.user` &rarr; `node_cpu_utilization_user`. Extracts `options.thresholds.critical` and `warning`. Resolves notification tags (`@slack-sre`, `@pagerduty`) into Alertmanager route trees.
* **Target Output:**
  ```yaml
  alert: HighCPUUsage_Host
  expr: avg(node_cpu_utilization_user{environment="production"}) by (host) > 85.0
  for: 5m
  labels:
    severity: critical
  ```

### 4.3. New Relic (NRQL) &rarr; Target In-VPC
* **Source AST:** Ingested via `NewRelicNRQLParser`. Regex/lexical parser extracts SQL-style clauses:
  ```sql
  SELECT average(cpuUsedPercent) FROM SystemSample WHERE environment = 'production' FACET hostname
  ```
* **Transformation:** Translates `SystemSample` to Prometheus node metrics, maps SQL aggregation (`average`) to PromQL `avg()`, maps `FACET` to PromQL `by (hostname)`, and converts duration terms to PromQL range vectors.
* **Target Output:**
  ```promql
  avg by (hostname) (node_cpu_utilization_user{environment="production"}) > 85.0
  ```

### 4.4. Dynatrace &rarr; Target In-VPC
* **Source AST:** Ingested via `DynatraceParser`. Handles both static metric events (`builtin:host.cpu.usage`) and Davis AI Auto-Adaptive baselines.
* **Transformation:** Static events translate directly to threshold rules. Auto-adaptive anomaly models are transpiled into PromQL dynamic statistical baseline approximations using standard deviation envelopes:
  ```promql
  abs(avg by (host) (builtin_service_response_time) - avg_over_time(builtin_service_response_time[1d])) > (2.5 * stddev_over_time(builtin_service_response_time[1d]))
  ```
* **Target Output:** Mathematical parity with Dynatrace anomaly triggers without requiring proprietary SaaS runtimes.

### 4.5. Splunk Cloud &rarr; Target In-VPC
* **Source AST:** Ingested via `SplunkAlertParser`. Parses Splunk Search Processing Language (SPL) pipe syntax:
  ```spl
  index=os sourcetype=cpu | stats avg(cpu) by host | where avg > 85
  ```
* **Transformation:** Dissects SPL pipes into metric aggregation stages. Metric queries are converted to PromQL; log-grep and pattern alerts (e.g. `index=web status>=500`) are compiled to VictoriaLogs LogQL / regular expressions.
* **Target Output:** Dual-path output: TSDB metric rules for Prometheus/VictoriaMetrics and LogQL stream filters for VictoriaLogs.

### 4.6. AWS CloudWatch &rarr; Target In-VPC
* **Source AST:** Ingested via `CloudWatchAlarmParser`. Handles standard alarms, namespace dimensions, and CloudWatch Metric Math:
  ```json
  {"Expression": "m2 / m1 * 100", "Label": "ErrorRatio"}
  ```
* **Transformation:** Maps `AWS/EC2`, `AWS/RDS`, `AWS/ApplicationELB` namespaces to canonical Prometheus metric names (`node_exporter`, `blackbox_exporter`, OTel host metrics). Evaluates Metric Math formulas into PromQL arithmetic division.
* **Target Output:** Native PromQL ratio alerts matching CloudWatch alarm semantics.

### 4.7. Azure Monitor &rarr; Target In-VPC
* **Source AST:** Ingested via `AzureMonitorParser`. Supports both ARM metricAlerts and Log Analytics Scheduled Query Rules (Kusto Query Language / KQL):
  ```kql
  requests | where resultCode >= 500 | summarize count() by bin(timestamp, 5m)
  ```
* **Transformation:** Maps KQL `summarize count()` to PromQL `sum(rate(http_requests_total{status=~"5.."}[5m]))`. Remaps Azure dimension filters (e.g. `VMName`) to target node labels.
* **Target Output:** Native Grafana Unified Alerting and Alertmanager YAML.

---

## 5. The In-VPC Monitoring Migration Pipeline (5 Steps)

```
[ Step 1: Ingest & Inspect ]
       |
       v
[ Step 2: AST Normalization (UIT-IR) ]
       |
       v
[ Step 3: Dynamic Threshold Recalibration ]
       |
       v
[ Step 4: Multi-Artifact Bundle Synthesis ]
       |
       v
[ Step 5: Dual-Run Shadow Verification & Cutover ]
```

1. **Ingest & Inspect (Zero-Agent Ingestion):**
   * Connect via read-only API or load exported JSON/YAML files.
   * Run `dcouplr check` or `dcouplr inspect` to identify unmapped metrics or orphaned channels.
2. **AST Normalization into UIT-IR:**
   * Raw vendor queries are parsed into structured AST nodes.
   * Tags are sanitized and stripped of legacy CIDR/IP assumptions.
3. **Dynamic Threshold Recalibration:**
   * `calculate_tier_scale_factor` compares source VM hardware specs (vCPU, RAM, IOPS) to target VM specifications.
   * Tightens safety buffers on downscaled tiers; rescales absolute memory and connection limits.
4. **Multi-Artifact Bundle Synthesis:**
   * Synthesizes Alertmanager rules, Grafana alerting YAML, Grafana dashboards, OTel Collector pipelines, and OpenTofu IaC manifests.
5. **Dual-Run Shadow Verification & Cutover:**
   * Deploy `<dcouplr/>` in-VPC monitoring sidecars inside the target private VPC.
   * `ShadowSyncEngine` runs both source and target alerting in parallel for 24–48 hours.
   * Calculates parity score, average latency skew, and verifies zero missed events.
   * Once parity $\ge 95\%$, run `cutover_monitoring.sh` to decommission the legacy system.

---

## 6. How We Package This: The In-VPC Monitoring Migration Bundle

`<dcouplr/>` packages all migrated monitoring assets into a self-contained, turnkey archive (`monitoring-bundle-<vpc_id>.tar.gz`).

### 6.1. Archive File Structure
```text
monitoring-bundle-<vpc_id>/
├── manifest.json                       # Package metadata, scale factors, SHA-256 signatures
├── rules/
│   ├── prometheus_alertrules.yaml      # Transpiled Alertmanager alerting rules
│   └── grafana_unified_alerts.yaml     # Grafana 10+ Unified Alerting YAML
├── dashboards/
│   ├── grafana_dashboards.json         # Re-targeted Grafana dashboard panels
│   └── dcouplr_wallboard_preset.json   # Native <dcouplr/> NOC Wallboard preset
├── otel/
│   └── otel_collector_config.yaml      # In-VPC OpenTelemetry Collector pipeline
├── iac/
│   ├── monitoring_stack.tf             # OpenTofu HCL for in-VPC VictoriaMetrics/Grafana
│   └── monitoring_stack.bicep          # Azure Bicep alternative (if target is Azure)
├── shadow/
│   └── shadow_sync_config.json         # Dual-run correlation rules for shadow_engine.py
└── cutover/
    ├── verify_telemetry_parity.sh      # Pre-cutover automated equivalence verification
    └── cutover_monitoring.sh           # Safe cutover & legacy agent teardown script
```

### 6.2. Command-Line Packaging Interface (CLI)

Generate and package an in-VPC monitoring bundle with a single command:

```bash
# Example: Migrate Datadog monitors to a GCP target VPC with downscaled e2-standard-4 instances
dcouplr migrate-monitoring \
  --source datadog \
  --target-vpc dc-onprem-core-01 \
  --target-cloud GCP \
  --target-tier e2-standard-4 \
  --package
```

CLI Output:
```text
         In-VPC Monitoring Migration Bundle: dc-onprem-core-01          
+----------------------------------------------------------------------+
| Property                | Value                                      |
|-------------------------+--------------------------------------------|
| Source Platform         | DATADOG                                    |
| Target Cloud            | GCP                                        |
| Target Compute Tier     | e2-standard-4                              |
| Capacity Scale Factor   | 0.25x (Dynamic Threshold Recalibration)    |
| Alert Rules Transpiled  | 5                                          |
| Zero-Egress Enforcement | 100% In-VPC ($0.00 Egress)                 |
| Bundle Directory        | monitoring-bundle-dc-onprem-core-01        |
| Archive File            | monitoring-bundle-dc-onprem-core-01.tar.gz |
+----------------------------------------------------------------------+
[OK] Monitoring migration bundle successfully packaged for dc-onprem-core-01!
```

### 6.3. REST API Interface

Capture and download the bundle programmatically via HTTP:

```http
GET /v1/telemetry/vpcs/dc-onprem-core-01/monitoring-bundle
X-API-Key: dcouplr-dev-2026
```

### 6.4. Web UI Interface
Available in `<dcouplr/>`’s interactive Cockpit:
* **Interactive Capabilities Checklist:** `http://localhost:8000/setup`
* **Compiler Studio:** `http://localhost:8000/compiler`
* **SRE Live Telemetry Dashboard:** `http://localhost:8000/dashboard`
* **24x7 NOC Wallboard:** `http://localhost:8000/wallboard`

---

## 7. Mathematical Parity & Verification Guarantee

Before cutover, `<dcouplr/>` guarantees mathematical equivalence between source alerts and target alerts:

$$\Phi(q_{\text{source}}, t) \equiv \Psi(q_{\text{target}}, t)$$

Where:
* $\Phi$ is the legacy evaluation function (Datadog, New Relic, Dynatrace, CloudWatch, Azure Monitor, Splunk).
* $\Psi$ is the target PromQL / Alertmanager evaluation function.
* The `ShadowSyncEngine` continuously asserts:
  $$\text{Parity} = \frac{N_{\text{matched}}}{N_{\text{source}}} \ge 95.0\%, \quad \Delta t_{\text{avg}} < 120\,\text{s}, \quad N_{\text{unmatched\_source}} = 0$$

If any alert disparity is detected during the parallel run, `<dcouplr/>` halts the cutover, identifies the offending dimension or threshold skew, and offers an automated recalibration patch.

---

## 8. Summary

Migrating monitoring is no longer a multi-week roadblock or a source of post-migration outages. By pairing AST-level query compilation with dynamic threshold recalibration and turnkey in-VPC packaging, `<dcouplr/>` provides a complete, risk-free path to modernize enterprise observability while keeping 100% of telemetry data inside your private VPC with **$0.00 billable cloud egress**.

