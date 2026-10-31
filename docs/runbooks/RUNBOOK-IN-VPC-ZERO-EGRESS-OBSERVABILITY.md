# <dcouplr/> Runbook: Operating In-VPC Zero-Egress Observability Post-Migration
**Document ID:** `VA-RUNBOOK-OBSERVABILITY-001`  
**Classification:** Standard Operating Procedure (SOP) / Field Engineering  
**Scope:** In-VPC Operational Monitoring, Live Compiler Alerting, and Zero-Egress Telemetry  
**Audience:** Site Reliability Engineers (SRE), DevOps Engineers, Cloud Architects, and NOC Operators  

---

## Executive Overview & Architectural Value

Once your cloud infrastructure and databases have successfully completed cross-VPC replication and migration, you do **not** need to maintain expensive legacy SaaS monitoring subscriptions (such as Datadog, New Relic, or Dynatrace), nor do you need to operate complex, fragile clusters of external Prometheus servers and Grafana nodes.

`<dcouplr/>` provides a **unified, self-contained In-VPC Observability Platform** that combines the core capabilities of Prometheus, Grafana, and Datadog directly inside your private subnet boundary with **$0.00 billable cloud egress**:

```
+----------------------------------------------------------------------------------------------------+
|                                    PRIVATE VPC BOUNDARY (10.0.0.0/16)                             |
|                                                                                                    |
|  +---------------------------+     Sub-second Delta Ticks     +---------------------------------+  |
|  |   <dcouplr/> Telemetry    | =============================> |  <dcouplr/> Live Dashboard      |  |
|  |   Collector & Engine      |        (SSE / Zero Hops)       |  (http://<internal-ip>:8000/    |  |
|  |   - In-Memory Ring Buffer |                                |   dashboard)                    |  |
|  |   - Raft Consensus Bridge |                                +---------------------------------+  |
|  |   - Bounded < 50 MiB RAM  |                                                                     |
|  +---------------------------+     Air-Gapped Resilient Poll  +---------------------------------+  |
|                |                   =========================> |  <dcouplr/> 24x7 NOC Wallboard  |  |
|                |                     (/topology-pulse.json)   |  (http://<internal-ip>:8000/    |  |
|                v                                              |   wallboard)                    |  |
|  +---------------------------+                                +---------------------------------+  |
|  |   <dcouplr/> Compiler     |                                                                     |
|  |   - Transpiles Datadog    |                                                                     |
|  |   - In-VPC Rule Evaluator |     GAP-06 Remote-Write (Opt)  +---------------------------------+  |
|  |   - Circuit Breaker Chaos | =============================> |  In-VPC Long-Term Storage       |  |
|  +---------------------------+       (Snappy / Protobuf)      |  (VictoriaMetrics / Mimir / S3) |  |
|                                                               +---------------------------------+  |
|                                                                                                    |
|  PUBLIC INTERNET (0.0.0.0/0): [BLOCKED / ZERO PACKETS / $0.00 BILLABLE EGRESS]                     |
+----------------------------------------------------------------------------------------------------+
```

### The Observability Trinity: Traditional Stack vs. `<dcouplr/>`

| Capability | Traditional Prometheus Stack | Traditional Datadog SaaS | `<dcouplr/>` In-VPC Engine |
| :--- | :--- | :--- | :--- |
| **Primary Role** | Metric Collector & TSDB | All-in-one SaaS Platform | Autonomous In-VPC Consensus & Observability |
| **Data Collection** | Pull-model HTTP scraping | Push-model proprietary agent daemon | Lock-free in-memory ring buffer (sub-second delta ticks) |
| **Visualization** | Requires external Grafana server | Proprietary cloud UI | Built-in Dual Tier: Live Dashboard (`/dashboard`) + 24x7 NOC Wallboard (`/wallboard`) |
| **Alert Rule Engine** | PromQL Alertmanager YAML | Datadog proprietary DSL monitors | Live AST Compiler (`/compiler`): Transpiles & evaluates rules locally |
| **Data Sovereignty** | Self-hosted (internal compute cost) | Third-party cloud vendor storage | **100% In-VPC Private Memory** (no external telemetry leakage) |
| **Egress Cost** | Low (if kept in-VPC) | **Extremely High** ($0.09/GB NAT Gateway + SaaS egress) | **$0.00 Guaranteed** (Mathematical Egress Attestation) |
| **Memory Footprint**| 4 GiB - 32 GiB TSDB RAM | 250 MiB - 1 GiB agent daemon | **Strictly bounded < 50 MiB RAM ceiling** |

---

## Section 1: Prerequisites & Tooling Checklist

Before activating in-VPC observability on your migrated instances, verify that your environment satisfies these operational prerequisites:

- [ ] **Private Subnet Access:** Workstation or bastion must have network route to port `8000/TCP` on the migrated instance.
- [ ] **Python Runtime:** Python 3.10+ installed on the host node (`python3 --version`).
- [ ] **Curl / Wget:** Standard command-line HTTP utility installed (`curl --version`).
- [ ] **Firewall / Security Group:**
  - Ingress `8000/TCP`: Allowed from corporate VPN / internal NOC CIDR (`10.0.0.0/8` or `172.16.0.0/12`).
  - Egress `0.0.0.0/0`: **Restricted / Blocked** (confirms zero-egress compliance).
- [ ] **Modern Web Browser:** Chrome 100+, Edge 100+, or Firefox 95+ (supports CSS Grid and Server-Sent Events).

---

## Section 2: Where to Get It & Where to Put It

### 1. File Locations on Migrated Nodes

All components run out of the standard `<dcouplr/>` deployment root:

| Component | Absolute File Path | Description |
| :--- | :--- | :--- |
| **Service Entrypoint** | `/opt/dcouplr/migration_tools/api/app.py` | FastAPI in-VPC telemetry & compiler daemon |
| **Telemetry Collector**| `/opt/dcouplr/migration_tools/api/telemetry.py` | In-memory ring buffer & Raft consensus telemetry |
| **Rule Compiler** | `/opt/dcouplr/migration_tools/semantic/alert_transpiler.py` | AST rule converter and threshold scaler |
| **NOC Wallboard** | `/opt/dcouplr/migration_tools/api/static/wallboard.html` | High-visibility dark-mode operations canvas |
| **Live Dashboard** | `/opt/dcouplr/migration_tools/api/static/dashboard.html` | Interactive SRE triage console with SSE streaming |
| **Systemd Service** | `/etc/systemd/system/dcouplr-observability.service` | Linux daemon auto-restart configuration |

### 2. Standalone Wallboard Static Bundle (For Air-Gapped NOCs)

If your NOC video wall runs on an air-gapped display controller (e.g. Raspberry Pi, Chromebox, Smart TV) that cannot reach the API server directly, use the pre-built single-file static bundle:

```bash
# Source path in repository:
dist/pulsecast-cdn/index.html

# Target path on private NOC HTTP server / S3 bucket:
/var/www/html/wallboard/index.html
```

---

## Section 3: Step-by-Step Transition: Decommissioning Datadog & Activating `<dcouplr/>`

Follow this 5-step procedure to transition from legacy SaaS to internal zero-egress observability:

### Step 3.1: Export Legacy Datadog Monitors to JSON

From your legacy Datadog workspace or Terraform state, export your production monitor definitions:

```bash
# Export using Datadog API (executed once prior to SaaS cutover):
curl -s -X GET "https://api.datadoghq.com/api/v1/monitor" \
  -H "DD-API-KEY: ${DD_API_KEY}" \
  -H "DD-APPLICATION-KEY: ${DD_APP_KEY}" \
  > /tmp/legacy_datadog_monitors.json
```

### Step 3.2: Transpile Rules Using the `<dcouplr/>` In-VPC Compiler

Navigate to the Compiler Studio or invoke the in-VPC compilation API:

```bash
# Transpile Datadog monitors into Prometheus Alertmanager and Grafana Unified Alerting:
curl -s -X POST "http://127.0.0.1:8000/v1/compiler/transpile-alert-rules" \
  -H "Content-Type: application/json" \
  -d '{
    "source_format": "datadog_json",
    "target_format": "prometheus_rules_yaml",
    "target_tier": "t4g.xlarge",
    "rules": [
      {
        "name": "High CPU Utilization",
        "query": "avg(last_5m):avg:system.cpu.user{*} by {host} > 85",
        "message": "CPU usage exceeds 85% on {{host.name}}",
        "thresholds": {"critical": 85, "warning": 75}
      }
    ]
  }' | jq .
```

**Expected JSON Response:**
```json
{
  "status": "success",
  "transpiled_rules_count": 1,
  "zero_egress_attested": true,
  "manifest_yaml": "groups:\n  - name: dcouplr-in-vpc-alerts\n    rules:\n      - alert: HighCPUUtilization\n        expr: avg by(instance) (rate(node_cpu_seconds_total{mode=\"user\"}[5m])) * 100 > 85\n        for: 5m\n        labels:\n          severity: critical\n          vpc: target-vpc-prod\n        annotations:\n          summary: CPU usage exceeds 85% on target instance"
}
```

### Step 3.3: Verify Systemd Service is Running

Ensure the `<dcouplr/>` observability daemon is enabled and active on the host:

```bash
sudo systemctl status dcouplr-observability
```

**Expected Console Output:**
```
● dcouplr-observability.service - <dcouplr/> In-VPC Observability Engine
     Loaded: loaded (/etc/systemd/system/dcouplr-observability.service; enabled; vendor preset: enabled)
     Active: active (running) since Wed 2026-10-28 02:30:00 UTC; 18min ago
   Main PID: 1420 (uvicorn)
      Tasks: 4 (limit: 4681)
     Memory: 38.4M (limit: 50.0M)
        CPU: 1.210s
     CGroup: /system.slice/dcouplr-observability.service
             └─1420 /opt/dcouplr/.venv/bin/python3 -m uvicorn migration_tools.api.app:app --host 0.0.0.0 --port 8000
```

### Step 3.4: Decommission the Legacy Datadog Agent

Once `<dcouplr/>` is actively collecting metrics, stop and purge the Datadog agent to immediately eliminate SaaS license consumption and internet outbound traffic:

```bash
# Ubuntu / Debian:
sudo systemctl stop datadog-agent
sudo apt-get purge -y datadog-agent
sudo rm -rf /etc/datadog-agent /var/log/datadog

# RHEL / Rocky Linux:
sudo systemctl stop datadog-agent
sudo yum remove -y datadog-agent
sudo rm -rf /etc/datadog-agent /var/log/datadog
```

---

## Section 4: Operating the In-VPC Visualization Tier

### 1. In-VPC Live SRE Dashboard (`/dashboard`)

The SRE Dashboard provides interactive, real-time telemetry streaming for active engineering triage:

- **URL:** `http://<internal-ip>:8000/dashboard`
- **Features:**
  - **Sub-second SSE Streaming:** Real-time updates pushed via `/v1/telemetry/stream` without page refreshes.
  - **Multi-VPC Topology Visualizer:** Displays live health, replication status, and cross-VPC latency.
  - **FinOps Cost Real-Time Comparison:** Live ticker tracking eliminated SaaS fees and zero-egress savings.
  - **Synthetic Incident Trigger:** On-demand circuit-breaker chaos drill testing.

### 2. 24x7 NOC Wallboard (`/wallboard`)

The NOC Wallboard is optimized for wall-mounted TV monitors and continuous unattended display:

- **URL:** `http://<internal-ip>:8000/wallboard`
- **Branding Specification (`VA-BRAND-001`):** Features the high-contrast neon-green `<` and `/>` (`#39ff14`) with crisp white sans-serif `dcouplr` typography for optical clarity from across the operations room.
- **Fail-Safe Operation:** Automatically freezes metrics and presents an amber warning if the local agent stops pulsing for more than 10 seconds, then seamlessly reconnects without operator intervention.

---

## Section 5: In-VPC Long-Term Storage (Optional GAP-06 Integration)

If your enterprise retention policy requires storing numerical time-series metrics for 1–7 years (e.g. SOC2, FedRAMP, HIPAA), configure `<dcouplr/>`'s built-in **Prometheus Remote-Write Exporter** to push to an in-VPC database:

```bash
# Configure the remote-write target (e.g. in-VPC VictoriaMetrics or Mimir):
curl -s -X POST "http://127.0.0.1:8000/v1/telemetry/remote-write/configure" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dcouplr-dev-2026" \
  -d '{
    "endpoint_url": "http://victoriametrics.internal.vpc:8428/api/v1/write",
    "batch_size": 100,
    "flush_interval_sec": 5.0,
    "max_retries": 3,
    "compression": "snappy"
  }' | jq .
```

**Key Security Guarantees:**
- Pure in-VPC networking (private DNS resolution).
- Bounded memory queue: Discards oldest samples if the destination is unavailable, strictly enforcing the `< 50 MiB` RAM ceiling.
- Exponential backoff and fail-fast circuit breaker preventing memory exhaustion.

---

## Section 6: Zero-Egress Cryptographic Attestation

To prove to security auditors and executive stakeholders that no telemetry data escapes the VPC perimeter, query the Egress Attestation endpoint:

```bash
curl -s "http://127.0.0.1:8000/v1/telemetry/vpcs/vpc-target-prod/egress-attestation" | jq .
```

**Sample Attestation Output:**
```json
{
  "attestation_id": "attest-dc-8942-prod",
  "vpc_id": "vpc-target-prod",
  "timestamp_utc": "2026-10-28T02:45:00Z",
  "in_vpc_metrics_samples_collected": 1420890,
  "public_internet_egress_bytes": 0,
  "billable_cloud_egress_usd": 0.00,
  "airgap_compliance_status": "CERTIFIED_ZERO_EGRESS",
  "sha256_audit_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

---

## Section 7: Troubleshooting & Field Diagnostics

### Issue 1: Dashboard or Wallboard Shows "Connection Stalled"
- **Symptom:** Wallboard pulse dot turns amber, badge displays `FEED STALLED`.
- **Diagnostic Command:**
  ```bash
  curl -I http://127.0.0.1:8000/v1/telemetry/topology-pulse
  ```
- **Remediation:** If HTTP 200 is returned, verify browser network settings. If connection refused, check systemd daemon: `sudo systemctl restart dcouplr-observability`.

### Issue 2: Compiler Transpilation Returns Validation Error
- **Symptom:** POST `/v1/compiler/transpile-alert-rules` returns HTTP 422.
- **Root Cause:** Malformed input query string or unsupported custom aggregation function.
- **Remediation:** Run the query through the built-in query validator:
  ```bash
  curl -s -X POST "http://127.0.0.1:8000/v1/compiler/validate-query" \
    -H "Content-Type: application/json" \
    -d '{"query": "avg:system.cpu.user{*} by {host}"}' | jq .
  ```

---

## Document Control & Verification

- **Lead Engineer:** Cloud Infrastructure & SRE Core Team
- **Approved For:** Enterprise Production Deployments
- **Zero-Egress Invariant:** Enforced by Kernel iptables & AWS VPC Security Group rules.
