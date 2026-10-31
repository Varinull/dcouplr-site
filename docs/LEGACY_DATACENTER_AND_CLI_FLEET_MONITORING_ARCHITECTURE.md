# Engineering Architecture Specification: Legacy Datacenter Ingestion & CLI Fleet Monitoring

**Document ID:** `SPEC-ENG-DATACENTER-CLI-001`  
**Classification:** Core System Architecture Specification  
**Status:** Approved for Production (`<dcouplr/>` Full-Stack Suite)  
**Target Audience:** SREs, Datacenter Infrastructure Engineers, System Architects  

---

## 1. Executive Summary & Problem Space

Enterprise legacy datacenters present fundamental architectural differences compared to hyperscaler cloud environments (AWS, GCP, Azure):
1. **Network Boundary & Air-Gap Demarcation:** Management VLANs, SANs, and bare-metal racks frequently operate with zero outbound Internet egress (no direct SaaS endpoints like Datadog, New Relic, or Slack).
2. **Heterogeneous Protocols:** Infrastructure state is signaled via raw Syslog (RFC 3164/5424), SNMP Traps (v2c/v3), IPMI/Redfish, and proprietary appliance telemetry (F5 BIG-IP, Cisco NX-OS, VMware vSphere).
3. **Agent Invasiveness Concerns:** Installing custom third-party agents on every legacy bare-metal host, database server, or certified appliance is strictly prohibited by security and change-management policies.

`<dcouplr/>` addresses this through an **Autonomous In-Perimeter Gateway Topology**: the daemon cluster runs on a minimal 3-node Raft management quorum within the datacenter boundary. Monitored hosts and appliances stream standard telemetry to this gateway without requiring `<dcouplr/>` binaries on individual workload servers.

---

## 2. Telemetry Ingestion & Protocol Normalization

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                   DATACENTER HARDWARE & APPLIANCES                     │
  │                                                                        │
  │  [Core Switches / Routers]       [F5 BIG-IP / HAProxy]   [Bare-Metal]  │
  │  (SNMP Traps / Syslog UDP 514)   (Syslog / Health)       (iDRAC/IPMI)  │
  └───────────────────┬──────────────────────┬─────────────────────┬───────┘
                      │                      │                     │
                      ▼                      ▼                     ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                 IN-PERIMETER NORMALIZATION ADAPTERS                    │
  │                                                                        │
  │  • Syslog RFC 5424 / SNMP Trap Receiver Engine                         │
  │  • OpenTelemetry Ingestion Endpoints (:4318 HTTP / :4317 gRPC)        │
  │  • Prometheus Remote Write Receiver & Node Exporter Scraper            │
  └──────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │               <dcouplr/> IN-DATACENTER AUTONOMOUS CLUSTER              │
  │                                                                        │
  │  • 3-Node Embedded Raft Consensus Quorum (Zero Cloud Dependency)      │
  │  • Memory-Mapped Volatile Ring Buffer (< 20 MiB RAM Ceiling)           │
  │  • Transpiled Prometheus Alertmanager & Grafana 11 Alerting Engine     │
  │  • Dead-Man's Watchdog Heartbeat Monitor                               │
  └──────────────────────────────────┬─────────────────────────────────────┘
                                     │
            ┌────────────────────────┴────────────────────────┐
            ▼                                                 ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────────────┐
│     AIR-GAPPED / LOCAL CHANNELS       │ │        WAN / HYBRID CHANNELS          │
│  (Operates even during total ISP cut) │ │     (When WAN / VPN Link is Active)   │
│                                       │ │                                       │
│ • 24x7 NOC Wallboard (PulseCast/Kiosk)│ │ • PagerDuty / Opsgenie API            │
│ • Internal SMTP Mail Relay (Exchange) │ │ • Slack / Teams Webhooks              │
│ • On-Prem ServiceNow / Jira Server    │ │ • Cloud Pub/Sub / AWS SNS Bridges    │
│ • Hardware SMS GSM Cellular Modem     │ │ • Cross-Cloud SRE Orchestrator        │
└───────────────────────────────────────┘ └───────────────────────────────────────┘
```

### Protocol Normalization Table

| Source Asset | Raw Protocol | Gateway Adapter | Normalized `<dcouplr/>` Internal Type |
| :--- | :--- | :--- | :--- |
| **Cisco / Arista Switches** | Syslog UDP/TCP 514 | `OTLPLogReceiver` | Structured `LogRecord` with severity & regex clustering |
| **UPS / PDU / CRAC Units** | SNMP Traps (UDP 162) | SNMP Trap Translator | Severity-mapped Alert Frame with OID translation |
| **Dell iDRAC / HPE iLO** | IPMI SEL / Redfish REST | Node Scraper | Hardware health metric (`node_hw_status`) |
| **F5 BIG-IP / NetScaler** | Syslog / SNMP / Stats | Transpiler Engine | Native Prometheus alerting threshold |
| **Linux / Windows Hosts** | OTLP / Node Exporter | Embedded HTTP `:4318` | `TraceSpan` & `MetricSeries` in RAM ring buffer |

---

## 3. Two Deployment Topologies

### Topology A: Centralized Gateway Cluster (Recommended)
* **Installation Target:** Exactly 3 lightweight virtual machines or management hosts.
* **Workloads Monitored:** 50, 150, 500, or unlimited instances.
* **Mechanism:**
  1. The 3 nodes execute `dcouplr run --config /etc/decoupler/bootstrap.json` forming a Raft quorum (`bootstrap_expect: 3`).
  2. The cluster binds internal IP addresses (`10.240.0.10:8000`, `10.240.0.11:8000`, `10.240.0.12:8000`).
  3. All datacenter servers, hypervisors, and appliances point their syslog forwarders, OTel exporters, or Prometheus scrapers to the cluster VIP.
  4. **Host Agent Footprint:** Zero software installed on monitored hosts.

### Topology B: Host-Level Dedicated Sidecar (`systemd`)
* **Installation Target:** Sensitive standalone bare-metal appliances or edge nodes requiring local eBPF zero-egress enforcement.
* **Generation Command:**
  ```bash
  dcouplr setup --profile infra --systemd
  ```
* **Output:**
  - `dcouplr.service` systemd unit file (strictly constrained to `< 50 MiB` RAM).
  - `install_systemd.sh` automated installation script.

---

## 4. How the Monitored Nodes Count is Determined

`<dcouplr/>` calculates and tracks active node inventory using three non-intrusive techniques:

### 1. Dynamic Telemetry Stream Extraction (Runtime)
As payloads enter the in-memory receivers (`OTLPTraceReceiver` and `OTLPLogReceiver`), the ingestion engine parses standard host tags:
- `resource.attributes["host.name"]`
- `resource.attributes["host.id"]`
- `resource.attributes["cloud.instance.id"]`
- Source IPv4/IPv6 socket origin.

These are aggregated in a bounded LRU hash set. The active inventory is streamed live to `/dashboard` and `/v1/telemetry/metrics`.

### 2. AST Manifest Parsing (Static Preflight)
When translating legacy configuration files:
```bash
dcouplr translate -i datadog_monitors.json -s datadog -t prometheus
```
The AST parser inspects query grouping facets (e.g. `by {host}`, `FACET hostName`, `by (instance)`). It computes the target fleet cardinality and verifies quota eligibility before applying transformations.

### 3. Static Cluster Peer Declarations
In `deploy/bootstrap.json`:
```json
{
  "cluster_id": "dc-onprem-core-01",
  "bootstrap_expect": 3,
  "static_peers": [
    { "node_id": "dc-node-01", "address": "10.240.0.10:8300", "voter": true },
    { "node_id": "dc-node-02", "address": "10.240.0.11:8300", "voter": true },
    { "node_id": "dc-node-03", "address": "10.240.0.12:8300", "voter": true }
  ]
}
```

---

## 5. Offline Commercial Licensing & Hardware Fingerprinting

To preserve strict zero-exfiltration compliance, `<dcouplr/>` never connects to an external license validation API.

### Hardware Fingerprint Calculation
The engine derives a salted cryptographic hash entirely in volatile memory:
- **Linux:** `/etc/machine-id` or `/var/lib/dbus/machine-id`
- **Windows:** Registry `HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid`
- **macOS:** `IOPlatformUUID`

$$\text{Fingerprint} = \text{SHA256}(\text{SALT} \parallel \text{Raw Machine Identifier})[:32]$$

### Tier Capacity Structure

| License Tier | Included Base Nodes | Max Tier Cap | Overage Handling | Support SLA |
| :--- | :---: | :---: | :---: | :--- |
| **Community Core** | 1 Node | 1 Node | None ($0 Apache 2.0) | Community GitHub |
| **Developer Pro** | 25 Nodes | 25 Nodes | Soft Warning | 48h Email SLA |
| **Cluster Small** | 25 Nodes | 50 Nodes | +$60/node/mo | 4h Priority Business |
| **Cluster Medium** | 75 Nodes | 150 Nodes | +$45/node/mo | 2h Critical 24/7 |
| **Cluster Large** | 200 Nodes | 500 Nodes | +$45/node/mo flat | 1h War-Room SLA |
| **Custom Enterprise** | Unlimited | Unlimited | Custom Air-Gap MSA | 15m Instant TAM |

---

## 6. Datacenter Notification Routing: Air-Gapped vs WAN Hybrid

### 1. Air-Gapped / Isolated Mode (No Internet)
* **Local SMTP Relay:** The Alertmanager engine directs emails to on-prem MTAs (Postfix / Exchange) on internal subnets.
* **On-Prem ITSM Webhooks:** Emits REST webhooks to internal ServiceNow MID Servers or Jira Data Center.
* **NOC Wallboard PulseCast:** Headless Chrome kiosks run locally:
  ```bash
  chrome --kiosk --disable-gpu http://10.240.0.10:8000/wallboard
  ```
* **Hardware GSM Modems:** Out-of-band serial modems dial SMS alerts over cellular networks if datacenter fiber connectivity drops.

### 2. Hybrid Mode (With Internet/Proxy)
* **Public Webhooks:** `@pagerduty`, `@opsgenie`, `@slack`, and `@teams`.
* **Cross-Cloud Dead-Man's Watchdog:** Inverted heartbeat sent to external cloud witness; triggers automated failover cutover if the datacenter stops reporting.

---

## 7. Step-by-Step SRE Deployment Runbook

```bash
# 1. Unpack Enterprise Air-Gapped Bundle
tar -xvf dcouplr-enterprise-v1.0.0.tar.gz
cd dcouplr-enterprise

# 2. Run Preflight Hardware & Port Diagnostics
dcouplr doctor

# 3. Activate Offline License Key
dcouplr license activate DCL-CLUS-MD-ENTERPRISE-948A2

# 4. Generate Systemd Units (if running as host service)
dcouplr setup --profile infra --systemd
sudo bash install_systemd.sh

# 5. Start the Seed Node
dcouplr run --config /etc/decoupler/bootstrap.json

# 6. Join Peer Nodes to Form 3-Node Quorum
dcouplr join --peer 10.240.0.10:8300 --node-id dc-node-02
dcouplr join --peer 10.240.0.10:8300 --node-id dc-node-03

# 7. Verify Cluster Consensus & Monitored Inventory
dcouplr status --cluster
```

