# SRE Engineering Runbook: Technology-Specific Node Monitoring & Universal Alert Routing

**Document ID:** `VA-RUNBOOK-TECH-ROUTING-001`  
**Classification:** Enterprise Internal / Class 4 Baseline  
**Target Systems:** `<dcouplr/>` In-Perimeter Observer Mesh, Bare-Metal Datacenter Hosts, Cloud VPC Nodes, Enterprise Ticketing Tools  
**Target Audience:** Site Reliability Engineers (SRE), Systems Administrators, Network Operations Center (NOC), Platform Engineers  
**Status:** `VERIFIED & OPERATIONAL`  

---

## 1. Executive Summary & Purpose

Modern enterprise environments host heterogeneous workloads across bare-metal datacenter servers and cloud VPC instances. A generic operating-system-level observer (monitoring only CPU and memory) fails to detect application-level brownouts such as database lock escalation, Kafka consumer lag accumulation, JVM garbage-collection pauses, or proxy buffer exhaustion.

`<dcouplr/>` introduces the **Technology-Specific Node Discovery & Monitoring Engine** combined with the **Universal Alerting, Routing & Enterprise Ticketing Connector Framework**. This system:
1. **Discovers and monitors technology-specific installations on each host node** without external agents or WAN dependencies, evaluating real-time operational metrics against mathematical thresholds.
2. **Routes alerts to any enterprise ticketing, paging, or ChatOps tool** (ServiceNow, Jira Service Management, PagerDuty, ChatOps webhooks, RFC 5424 Syslog, and Local Air-Gapped Spools).
3. **Provides native, in-perimeter integration with your Enterprise Ticketing Tool (ServiceNow, Jira Service Management, or custom internal ticketing systems)** via a local loopback bridge (`http://127.0.0.1:9000/v1/support/receiver/ingest`) and zero-WAN atomic disk spool (`./data/incident_spool/`), operating under a **Minimal Connectivity / Full Coverage** paradigm (zero external cloud egress, < 1.5 KB payload, complete diagnostic context, and SHA-256 attestation).

```
+---------------------------------------------------------------------------------------------------+
|                                      <dcouplr/> HOST NODE                                         |
|                                                                                                   |
|  +---------------------+  +----------------------+  +---------------------+  +-----------------+  |
|  | Oracle DB / Postgres|  | Kafka / RabbitMQ     |  | Redis / In-Memory   |  | Nginx / Envoy   |  |
|  | Port 1521 / 5432    |  | Port 9092 / 5672     |  | Port 6379           |  | Port 443 / 10000|  |
|  +----------+----------+  +----------+-----------+  +----------+----------+  +--------+--------+  |
|             |                        |                         |                      |           |
|             +------------------------+-------------------------+----------------------+           |
|                                                  |                                                |
|                                      [ In-Perimeter eBPF ]                                        |
|                                  [ Procfs & Socket Inspector ]                                    |
|                                                  |                                                |
|                                   <dcouplr/> Unified Observer                                     |
+--------------------------------------------------+------------------------------------------------+
                                                   |
                        +--------------------------+--------------------------+
                        |                                                     |
             [ Primary In-Perimeter ]                               [ Air-Gap Fallback ]
                        |                                                     |
                        v                                                     v
          +----------------------------+                        +---------------------------+
          |  Enterprise Ticketing Tool |                        | Atomic Local JSON Spool   |
          |  (ServiceNow/Jira/Bridge)  |                        |  ./data/incident_spool/   |
          |   http://127.0.0.1:9000    |                        | (Zero Network Required)   |
          +----------------------------+                        +---------------------------+
                        |
                        +---> Auto-Ticket (P0/P1/P2) -> SLA Countdown -> Auto-Resolve on Recovery
```

---

## 2. Technology-Specific Monitoring Architecture

`<dcouplr/>` continuously inspects local nodes across 6 major technology domains covering 24 enterprise software stacks:

### 2.1 Domain Overview & Default Port Census

| Domain | Technology Stack | Default Ports | Process Signature | Key Observability Focus |
|---|---|---|---|---|
| **Relational & Distributed SQL** | Oracle Database 19c RAC | `1521` | `ora_pmon_*` | SGA Hit Ratio, Redo Log Latency, Tablespace Full % |
| | PostgreSQL 16 | `5432` | `postgres` | WAL Rate, Active Backends %, Autovacuum Backlog, Replication Lag |
| | MySQL / MariaDB | `3306` | `mysqld` | InnoDB Buffer Pool %, Slow Queries/sec, Seconds Behind Source |
| | TiDB Distributed SQL | `4000`, `20160` | `tidb-server`, `tikv-server` | Coprocessor Wait, Raftstore CPU, 2PC Commit Latency |
| **NoSQL & In-Memory Stores** | Apache Cassandra | `9042`, `7000` | `org.apache.cassandra` | SSTables per Read, Compactions Pending, Write P99 Latency |
| | MongoDB | `27017` | `mongod` | WiredTiger Cache Saturation, Oplog Window, Current Connections |
| | Redis / KeyDB | `6379`, `16379` | `redis-server` | Memory Fragmentation Ratio, Evicted Keys/s, Instantaneous Ops |
| | Memcached | `11211` | `memcached` | Slab Allocation Limit, Cache Eviction Rate, Hit Ratio |
| **Event Streaming & Queues** | Apache Kafka | `9092`, `9093` | `kafka.Kafka` | Under-Replicated Partitions, Consumer Group Lag, ISR Shrink |
| | RabbitMQ | `5672`, `15672` | `beam.smp` | Queue Total Depth, Unacknowledged Messages, Memory Alarm |
| | Apache Pulsar | `6650`, `8080` | `pulsar` | Backlog Quota, Publish Latency, Cursor Backlog |
| **Web Servers & Ingress Proxies** | NGINX Plus / Open Source | `80`, `443` | `nginx: worker` | Active TCP Connections, Upstream 5xx %, SSL Handshake P99 |
| | Envoy Proxy | `10000`, `9901` | `envoy` | Downstream Cx Active, Request Overflow, Circuit Breakers |
| | Apache HTTP Server | `80`, `443` | `httpd`, `apache2` | Scoreboard Worker Allocation, Busy/Idle Ratio |
| | HAProxy | `8080`, `8443` | `haproxy` | Frontend Session Saturation, Backend Queue Depth, Server Health |
| **Runtimes & Virtual Machines** | OpenJDK / HotSpot JVM | `8080`, `9999` | `java -jar` | Tenured Heap Allocation, G1/ZGC Pause P99 ms, Live Threads |
| | Node.js Runtime | `3000` | `node server.js` | libuv Event Loop Lag P99 ms, V8 Heap Used %, Active Handles |
| | Go Runtime (Golang) | `8081` | `./service` | Goroutines Count, GC CPU Fraction %, Heap Alloc Size |
| | Python Runtime | `8000` | `gunicorn`, `uvicorn` | GIL Contention Latency, RSS Growth Rate, Worker Health |
| **Enterprise Storage & Compute** | SAP HANA 2.0 In-Memory | `30015` | `hdbdaemon` | Column Store Saturation %, Savepoint Flush Sec, Delta Merge |
| | Ceph Storage SDS | `6789`, `6800` | `ceph-osd` | OSDs Down/Degraded, Placement Group Degraded %, Scrub Latency |
| | Docker / Containerd | `2375` | `dockerd` | Container Crash Rate, Kernel OOM Events, Daemon Socket Latency |
| | Kubernetes Node (Kubelet) | `10250` | `kubelet` | PLEG Relist Duration Sec, Pod Evictions/hr, CFS Throttled % |

---

## 3. Mathematical Foundations & Operational Thresholds

Each technology metric monitored by `<dcouplr/>` evaluates against mathematically proven thresholds:

### 3.1 Oracle Database 19c RAC Buffer Cache Hit Ratio
$$\text{Hit Ratio} = 1 - \left( \frac{\text{Physical Reads}}{\text{DB Block Gets} + \text{Consistent Gets}} \right)$$
* **Warning Threshold:** $< 95.0\%$  
* **Critical Threshold:** $< 90.0\%$  
* **Alert Level:** `P1 - Critical`  
* **Remediation:** Inspect SQL query execution plans for unindexed full table scans (`V$SQL_PLAN`); increase `DB_CACHE_SIZE` within the System Global Area (SGA).

### 3.2 Apache Kafka Consumer Lag Drift Velocity
$$\Delta \text{Lag}(t) = \frac{d}{dt} \Big( \text{LogEndOffset}(t) - \text{CurrentConsumerOffset}(t) \Big)$$
* **Warning Threshold:** $> 5,000\text{ messages}$ (or $\Delta \text{Lag} > 250\text{ msgs/sec}$)  
* **Critical Threshold:** $> 25,000\text{ messages}$ (or $\Delta \text{Lag} > 1,500\text{ msgs/sec}$)  
* **Alert Level:** `P1 - Critical`  
* **Remediation:** Autoscale consumer pod replicas or rebalance partitions. Check consumer group thread deadlocks via JMX.

### 3.3 Redis Memory Fragmentation Ratio
$$\text{Fragmentation Ratio} = \frac{\text{used\_memory\_rss}}{\text{used\_memory}}$$
* **Warning Threshold:** $> 1.5$ (or $< 0.9$ indicating OS swapping)  
* **Critical Threshold:** $> 2.0$  
* **Alert Level:** `P2 - Major`  
* **Remediation:** Trigger online active defragmentation (`CONFIG SET activedefrag yes`) or restart memory allocator (Jemalloc arena purging).

### 3.4 JVM GC Pause Duration & CPU Overhead
$$\text{GC Overhead Ratio} = \frac{\sum_{i=1}^n t_{\text{pause}, i}}{T_{\text{evaluation}}} \times 100\%$$
* **Warning Threshold:** Pause P99 $> 100\text{ ms}$ (Overhead $> 5\%$)  
* **Critical Threshold:** Pause P99 $> 500\text{ ms}$ (Overhead $> 15\%$)  
* **Alert Level:** `P2 - Major`  
* **Remediation:** Transition heap to ZGC or generational Shenandoah; inspect survivor space sizing and tenuring thresholds (`-XX:MaxTenuringThreshold`).

### 3.5 PostgreSQL WAL Generation Rate
$$\dot{W}_{\text{WAL}} = \frac{\Delta \text{WAL Bytes}}{\Delta t}$$
* **Warning Threshold:** $> 80\text{ MB/s}$  
* **Critical Threshold:** $> 150\text{ MB/s}$  
* **Alert Level:** `P1 - Critical`  
* **Remediation:** Detect runaway batch bulk inserts or unvacuumed table bloat; verify archive command throughput to avoid disk saturation in `pg_wal`.

---

## 4. Universal Alerting & Routing Framework

`<dcouplr/>` decouples alert generation from downstream notification tools using an in-memory, zero-heap routing matrix.

### 4.1 Supported Connectors

1. **Enterprise Ticketing Tool / Local Spool** (`varinull_operations_engine` connector):
   * Protocol: Local HTTP socket `http://127.0.0.1:9000/v1/support/receiver/ingest` or local spool fallback.
   * Auto-ticket creation for `P0`, `P1`, and `P2` incidents with SLA tracking and SHA-256 cryptographic attestation.
2. **Generic HTTP/REST Webhook** (`generic_webhook`):
   * Custom endpoints, custom headers, payload template interpolation (`{alert_id}`, `{severity}`, `{title}`, `{node_id}`).
3. **ServiceNow ITSM** (`servicenow`):
   * REST Table API (`/api/now/table/incident`) with assignment group and CMDB CI mapping.
4. **Jira Service Management** (`jira_service_management`):
   * Atlassian REST API v3 with project key, custom fields, and transition workflows.
5. **PagerDuty Events v2** (`pagerduty`):
   * Direct dispatch to `/v2/enqueue` with deduplication keys and client links.
6. **ChatOps** (`slack_teams`):
   * Rich markdown attachments formatted for Slack, Microsoft Teams, Mattermost, and Discord.
7. **Syslog RFC 5424 SIEM Relay** (`syslog_relay`):
   * UDP/TCP syslog packets to Splunk, Elastic, QRadar, or local syslogd.
8. **Air-Gapped Zero-Egress JSON Spool** (`local_spool`):
   * 100% offline file drop (`./data/alerts_spool/`) with atomic writes for air-gapped enclaves.

---

## 5. In-Perimeter Integration with Enterprise Ticketing Tools & Local Spooling

### 5.1 Enterprise Ticketing & Incident Management Overview
Enterprise platforms require robust, reliable incident routing to your team's **enterprise ticketing tool**—whether your organization uses **ServiceNow**, **Jira Service Management (Jira/JSM)**, or an internal ITSM pipeline. `<dcouplr/>` integrates with your ticketing infrastructure using an in-perimeter **Edge Ingest Bridge** on port 9000 (`/v1/support/receiver/ingest`) and a local atomic spool (`./data/incident_spool/`):
* **Ticketing System Flexibility:** Dispatches structured incident records directly to ServiceNow, Jira, or custom webhook endpoints with standard ITIL priority mappings.
* **In-Perimeter Edge Ingest Bridge:** For high-security datacenter and VPC environments where `<dcouplr/>` operates under a strict **Zero-Egress Invariant (Zero WAN Egress)**, the ingest bridge accepts local JSON envelopes over loopback HTTP and atomic disk spools.
* **Air-Gapped Sovereign Mode:** In disconnected environments, tickets buffer safely to local disk without dropped events or external WAN dependencies.

### 5.2 Minimal Connectivity / Full Coverage Specification

| Requirement | Implementation in `<dcouplr/>` |
|---|---|
| **Minimal Connectivity** | Strictly in-perimeter. Default address is `http://127.0.0.1:9000/v1/support/receiver/ingest`. Zero public WAN packets are emitted. |
| **Payload Compactness** | Payload size is under 1.5 KB, containing only essential diagnostic keys. |
| **Air-Gap Spool Fallback** | If port 9000 is offline or isolated, `<dcouplr/>` writes an atomic `.tmp` -> `.json` file to `./data/incident_spool/TICKET-SPOOL-<timestamp>-<rand>.json`. Zero errors are raised; zero tickets are dropped. |
| **Full Diagnostic Coverage** | Ingest payload contains: `app_id: "dcouplr"`, `title`, `priority`, `category`, Markdown-formatted `description`, `affected_nodes`, plus `metadata` containing `node_id`, `tech_id`, `metric_key`, `metric_value`, `threshold`, `runbook_url`, and `cli_diagnostic`. |
| **Cryptographic Attestation** | Each ticket contains a SHA-256 signature generated over the incident parameters, ensuring verifiable audit trails. |
| **Priority Mapping** | `<dcouplr/>` severity maps directly to standard ITIL priority standards: `P0` -> `P0 - Blocker`, `P1` -> `P1 - Critical`, `P2` -> `P2 - Major`, `P3/P4` -> `P3 - Minor`. |

### 5.2 Incident Ingest JSON Schema

```json
{
  "app_id": "dcouplr",
  "company_name": "Enterprise Operations",
  "title": "[ALERT] P1 - Critical in oracle_db on node-dc1-bm-01",
  "priority": "P1 - Critical",
  "category": "Infrastructure Incident / Tier Breach",
  "description": "### <dcouplr/> Autonomous Telemetry Incident Report\n...",
  "affected_nodes": 1,
  "metadata": {
    "incident_id": "INC-1793288393893-4182",
    "node_id": "node-dc1-bm-01",
    "tech_id": "oracle_db",
    "metric_key": "sga_buffer_cache_hit_ratio",
    "metric_value": 88.4,
    "threshold": 90.0,
    "runbook_url": "/docs/RUNBOOK-TECHNOLOGY-SPECIFIC-NODE-MONITORING-AND-ALERT-ROUTING.html#oracle_db",
    "cli_diagnostic": "dcouplr node tech check --node node-dc1-bm-01 --tech oracle_db",
    "attestation_sha256": "4a71b128c7f9e8a379d4608c0ef28bf3d8338f0e5726fa487b9292a4de80ef02",
    "connectivity_profile": "minimal_in_perimeter",
    "zero_egress_verified": true
  }
}
```

---

## 6. SRE Operational Procedures & CLI Diagnostics

### 6.1 Inspect Installed Technologies on a Node
```bash
# Query the live inventory across all nodes
curl -s http://127.0.0.1:8000/v1/telemetry/nodes/technologies | jq .

# Filter for a specific bare-metal or cloud node
curl -s "http://127.0.0.1:8000/v1/telemetry/nodes/technologies?node_id=node-dc1-bm-01" | jq .
```

### 6.2 Trigger Autonomous Discovery Scan on a Node
```bash
curl -X POST http://127.0.0.1:8000/v1/telemetry/nodes/node-dc1-bm-01/technologies/scan | jq .
```

### 6.3 Update Metric Thresholds on a Node Technology
```bash
curl -X POST http://127.0.0.1:8000/v1/telemetry/nodes/node-dc1-bm-01/technologies/configure \
  -H "Content-Type: application/json" \
  -d '{
    "tech_id": "oracle_db",
    "alert_level": "P1",
    "evaluation_window": "1m",
    "metrics": {
      "sga_buffer_cache_hit_ratio": {
        "warning": 96.0,
        "critical": 92.0
      }
    }
  }' | jq .
```

### 6.4 Test Dispatch to Enterprise Ticketing Tool
```bash
curl -X POST http://127.0.0.1:8000/v1/telemetry/alerting/connectors/voe/sync \
  -H "Content-Type: application/json" \
  -d '{
    "node_id": "node-dc1-bm-01",
    "tech_id": "oracle_db",
    "priority": "P1 - Critical",
    "title": "[SRE TEST] Verification of Enterprise Ticketing Queue Dispatch",
    "metric_key": "sga_buffer_cache_hit_ratio",
    "metric_value": 88.2,
    "threshold": 90.0
  }' | jq .
```

### 6.5 Review Ticket History Dispatched to Local Ticketing Spool
```bash
curl -s http://127.0.0.1:8000/v1/telemetry/alerting/connectors/voe/tickets | jq .
```

---

## 7. Zero-Egress Attestation & Air-Gap Verification

To verify that the observer mesh emits zero bytes to public clouds or third-party networks:
1. Run the local eBPF filter verification:
   ```bash
   dcouplr check --tier tier_7_siem_audit --component security_compliance
   ```
2. Verify that `ebpf_blocked_wan_packets == 0` and `airgap_drift_pct == 0.00%`.
3. Inspect `attestation_sha256` in all dispatched ticket payloads. All hashes are generated using deterministic SHA-256 over incident identifiers, node state, and timestamps.

