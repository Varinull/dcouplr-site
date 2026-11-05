# Master Admin Dossier: Dual-Database Architecture, Single Source of Truth (SSOT), and Greenfield Day-0 Alignment Reference

**Document ID:** VA-SPEC-DUAL-DATABASE-SSOT-001  
**Revision:** 2.0.0 (Comprehensive Enterprise Architecture & Day-0 Governance Edition)  
**Classification:** Enterprise System Architecture, Sovereign Data Governance & Security Auditing  
**Target Audience:** Principal Systems Architects, Enterprise Administrators, SRE Directors, Chief Information Security Officers (CISO), Compliance Auditors  
**Canonical Wordmark Standard:** `<dcouplr/>`  
**Last Updated:** November 2026  

---

## Executive Summary & Boundary Demarcation

The enterprise data architecture of the <span class="dcouplr-wordmark"><span class="dcouplr-bracket">&lt;</span><span class="dcouplr-text">dcouplr</span><span class="dcouplr-bracket">/&gt;</span></span> platform establishes a strict, cryptographically auditable, and non-negotiable physical and operational demarcation between vendor-level multi-tenant commercial operations and customer-level in-perimeter telemetry observability.

Under no circumstances does customer operational telemetry, private node censuses, or internal alerting thresholds ever touch vendor cloud infrastructure. Telemetry never leaves the customer Virtual Private Cloud (VPC), Sovereign Cloud Perimeter, or private data center, guaranteeing a mathematical **$0.00 WAN Public Egress Invariant**.

```
══════════════════════════════════════════════════════════════════════════════════════════════════════════
                                    <dcouplr/> ENTERPRISE DATA ARCHITECTURE
══════════════════════════════════════════════════════════════════════════════════════════════════════════
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
             DATABASE 1: CENTRAL DB                                      DATABASE 2: CUSTOMER IN-VPC DB
           (`dcouplr_central_db`)                                           (`dcouplr_customer_db`)
       Multi-Tenant Vendor Control Plane                             Single-Tenant In-Perimeter Sovereign SSOT
       Hosted by <dcouplr/> Corporation                              100% Deployed in Customer VPC / Bare-Metal
       Recommended Engine: PostgreSQL 14+                            Recommended Engine: SQLite 3 (WAL Mode)
    ───────────────────────────────────────                       ─────────────────────────────────────────────
    • Enterprise Corporate Accounts                               • Multi-Cloud VPCs & On-Premises Topologies
    • Master Service Agreements & SLAs                            • Physical & Virtual Node Census Inventories
    • Product Catalog & SKU Matrix                                • ⚙️ 7-Tier Full-Stack Matrix (127 Metrics)
    • Cryptographic Ed25519 License Tokens                        • Core Observer Telemetry (10 Vital Metrics)
    • Day-0/Day-1 CapEx vs Day-2 OpEx                             • Active In-VPC License Attestation & Quota
    • Proration & Overage Settlement                              • In-Perimeter Sliding Windows & Alert Rules
    • STRICTLY ZERO Customer Telemetry Access                     • STRICTLY ZERO Public WAN Egress ($0.00)
══════════════════════════════════════════════════════════════════════════════════════════════════════════
```

---

## Part I: Database 1 — `<dcouplr/>` Central Enterprise Database (`dcouplr_central_db`)

### 1. Architectural Purpose & Tenancy Model
The Central Database is the vendor-operated management plane for <span class="dcouplr-wordmark"><span class="dcouplr-bracket">&lt;</span><span class="dcouplr-text">dcouplr</span><span class="dcouplr-bracket">/&gt;</span></span> corporate operations. It maintains global commercial tenancy, contractual commitments, cryptographic customer license keys, SKU entitlement definitions, and billing settlement records.

It operates strictly on the vendor side of the boundary and is accessed exclusively by `<dcouplr/>` billing microservices, license provisioning pipelines, and executive management portals.

### 2. Recommended Database Engine: PostgreSQL 14+ (Aurora / Cloud SQL)
After thorough architectural evaluation between PostgreSQL, MySQL, and DynamoDB, **PostgreSQL 14+** (deployed on AWS Aurora PostgreSQL or GCP Cloud SQL) is the authoritative recommendation:

1. **ACID Serializable Transaction Isolation:** Customer seat licensing requires strict serializable isolation to prevent race conditions during concurrent license key allocations, seat pool expansions, or subscription renewals.
2. **JSONB Semi-Structured Indexing:** Enterprise contracts feature variable terms, custom SLAs, dynamic add-on module feature flags, and bespoke compliance riders. PostgreSQL's GIN-indexed JSONB columns allow high-performance querying without complex schema migrations.
3. **Multi-Tenant Row-Level Security (RLS):** Native PostgreSQL RLS provides cryptographically partitioned tenant isolation across multiple global accounts within shared administrative tables.
4. **Cloud Managed Maturity:** Aurora PostgreSQL and Cloud SQL provide automated point-in-time recovery (PITR), cross-region read replicas, and PgBouncer connection pooling.
5. **Local Development Fallback:** The codebase includes an automated abstraction layer (`central_database.py`) that falls back to embedded SQLite (`data/dcouplr_central.db`) when run offline or in local testing environments.

### 3. Core Schema & Entity Specifications

| Table Name | Primary Key | Description | Key Attributes |
| :--- | :--- | :--- | :--- |
| `customers` | `customer_id` | Enterprise corporate account records | `company_name`, `contact_email`, `security_domain`, `account_tier`, `status` |
| `contracts` | `contract_id` | Master commercial services agreements | `contract_number`, `suite_edition`, `lifecycle_phase`, `effective_date`, `renewal_date`, `sla_tier`, `annual_contract_value_usd` |
| `product_skus` | `sku_id` | Official platform product catalog | `name`, `suite_edition`, `billing_mode`, `base_node_quota`, `overage_rate_per_node_usd`, `features_json` |
| `customer_licenses` | `license_id` | Cryptographic node entitlement keys | `customer_id`, `sku_id`, `license_key_jwt`, `signature_algorithm` (Ed25519), `max_nodes`, `permitted_clusters`, `expires_at` |
| `billing_prorations` | `invoice_id` | Node overage and settlement records | `billing_period`, `base_fee_usd`, `peak_monitored_nodes`, `overage_nodes`, `overage_charge_usd`, `total_due_usd` |

---

## Part II: Database 2 — Customer In-VPC Single Source of Truth (`dcouplr_customer_db`)

### 1. Architectural Purpose & Sovereignty
The Customer In-VPC Database is the **Single Source of Truth (SSOT)** for all infrastructure state, network topology, monitored node censuses, technology stacks, 7-Tier Full-Stack Invariant Matrix configurations, Core Engine Telemetry, and local licensing attestations.

It resides **100% inside the customer's private network perimeter** (local NVMe, encrypted EBS, or SAN volumes). It has zero inbound or outbound network egress to `<dcouplr/>` or any third-party SaaS provider.

### 2. Standard Database Engine: SQLite 3 in WAL Mode with SQLCipher AES-256 Encryption at Rest
After comprehensive analysis between client-server databases (PostgreSQL/MySQL) and embedded file databases, **SQLite 3 in WAL (Write-Ahead Logging) mode with SQLCipher AES-256 encryption at rest** is the mandatory production standard for `<dcouplr/>`:

1. **Application-Tier Database Cryptography at Rest (SQLCipher AES-256):** To protect sensitive customer infrastructure topologies, node IPs, technology stacks, credentials, and telemetry streams from cold storage extraction, volume snapshot cloning, or unauthorized disk access, the customer database is encrypted using SQLCipher 4.x. Every 4,096-byte database page (including B-tree tables, indexes, and WAL journal logs) is encrypted via OpenSSL-backed AES-256-CBC with PBKDF2-HMAC-SHA512 key derivation (256,000 iterations) and per-page HMAC tamper detection. Standard plaintext `SQLite format 3` magic headers are completely absent from disk.
2. **Microsecond In-Process Latency:** Telemetry collectors and eBPF ring buffers process tens of thousands of metric samples per second. SQLite is linked directly into the application memory space, eliminating TCP network latency, socket context switches, and IPC serialization overhead.
3. **Zero Inbound Open Network Ports:** Traditional databases require listening on TCP ports 5432 or 3306, expanding attack surfaces in customer subnets. SQLite does not bind to any network socket—making it completely immune to subnet port scanning or credential brute-forcing.
4. **Strict Zero-WAN Egress Invariant ($0.00 Public Egress):** All data files reside on customer-owned storage (local NVMe, EBS, SAN, persistent disks). No data packets ever cross the public Internet.
5. **100% OS Agnostic & Self-Contained:** Runs identically across Linux (RHEL, Ubuntu, Rocky, Alpine), Windows Server 2019/2022, macOS, container images (Docker, Podman), and air-gapped kiosk devices without requiring external package installations (`apt`, `yum`) or daemon service supervisors (`systemd`).
6. **Zero-Daemon Overhead:** Eliminates the risk of background database daemon crashes, socket leaks, or memory runaway.
7. **Single-File Operational Simplicity:** Encrypted hot backups and disaster recovery snapshots are executed with a single atomic command: `VACUUM INTO 'backup.db'`.
8. **Online Zero-Downtime Key Rotation:** Keys can be safely rotated without service interruption via `PRAGMA rekey = '...'` or through the `/admin` Security & Encryption console.

### 3. Core Schema & Entity Specifications

| Table Name | Primary Key | Description | Contents / Purpose |
| :--- | :--- | :--- | :--- |
| `vpcs` | `id` | Monitored VPCs & physical data centers | CIDRs, regions, clouds (AWS, GCP, Azure, On-Prem) |
| `nodes` | `id` | Monitored physical and virtual servers | Hostnames, IPs, roles, environments, OS, agent status |
| `node_technologies` | `(node_id, tech_id)` | Technology stacks running on nodes | Installed software stacks (Postgres, Redis, Oracle, SAP, etc.) |
| `monitoring_matrix_tiers` | `tier_id` | The 7 monitoring tiers | Tier names, descriptions, display order |
| `monitoring_matrix_components` | `component_id` | Infrastructure and application components | 25 distinct monitored components across 7 layers |
| `monitoring_matrix_metrics` | `(metric_id, component_id, tier_id)` | Invariant checks, thresholds, windows, runbooks | 127 mathematical metric definitions & alert boundaries |
| `core_engine_telemetry` | `indicator_key` | Observer engine health indicators | 10 vital health indicators of the `<dcouplr/>` appliance |
| `customer_license_state` | `license_id` | Local cryptographic license status | Active tier, seat ID, machine fingerprint, base quota |
| `database_metadata` | `key` | Engine metadata and schema versioning | SQLite version, journal mode, schema revision |

---

## Part III: Database Profiles — `vpc_telemetry_demo.db` vs. `vpc_telemetry_prod.db`

Both database files are physical instances of `dcouplr_customer_db` (the In-VPC SQLite 3 SSOT engine), managed by `vpc_database.py`. The system provides an automated profile switcher to toggle between two operational states:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE PROFILE MATRIX: DEMO VS. PRODUCTION                          │
├───────────────────────────────┬────────────────────────────────┬────────────────────────────────┤
│ Feature / Attribute           │ Demo Profile (`demo.db`)       │ Production Profile (`prod.db`) │
├───────────────────────────────┼────────────────────────────────┼────────────────────────────────┤
│ Physical Storage Path         │ `data/vpc_telemetry_demo.db`   │ `data/vpc_telemetry_prod.db`   │
│ Target Environment            │ Sales Demos, CI Testing, SRE   │ Live Enterprise VPC Deployment │
│ Total Monitored Nodes         │ 75 Nodes (Pre-Seeded)          │ 0 Nodes (Day-0 Blank Slate)    │
│ Total Staged VPCs / Networks  │ 5 Networks (Pre-Seeded)        │ 0 VPCs (Day-0 Greenfield)      │
│ Total Node Technology Stacks  │ 87 Stacks (Pre-Seeded)         │ 0 Stacks (Awaiting Discovery)  │
│ 7-Tier Invariant Matrix Tiers │ 7 Tiers (100% Pre-Seeded)      │ 7 Tiers (100% Pre-Seeded)      │
│ Monitored Components          │ 25 Components (100% Pre-Seeded)│ 25 Components (100% Pre-Seeded)│
│ Mathematical Metric Invariants│ 127 Metrics (100% Pre-Seeded)  │ 127 Metrics (100% Pre-Seeded)  │
│ Core Observer Indicators      │ 10 Indicators (100% Pre-Seeded)│ 10 Indicators (100% Pre-Seeded)│
│ Incident Simulation Engine    │ Active (P1 Postgres, P2 HAProxy) Standby (Zero False Alarms)    │
│ Enterprise License Tier       │ Cluster Medium (75/75 Nodes)   │ Cluster Medium (0/75 Nodes)    │
└───────────────────────────────┴────────────────────────────────┴────────────────────────────────┘
```

### 1. `vpc_telemetry_demo.db` (Interactive Demo & Sales Simulator)
* **Purpose:** Built for executive walkthroughs, sales demonstrations, and automated CI test suites.
* **Pre-Seeded Topologies:** 
  * `vpc-aws-prod-01`: AWS US-East-1 Production (15 nodes)
  * `vpc-aws-stage-02`: AWS US-West-2 Staging (6 nodes)
  * `vpc-gcp-analytics-03`: GCP us-central1 Analytics Mesh (18 nodes)
  * `dc-onprem-core-01`: Legacy Datacenter Chicago DC1 Bare-Metal (32 nodes)
  * `vpc-azure-east-04`: Azure East-US App Tier (4 nodes)
* **Incident Injection:** Pre-wired with realistic failure states for demonstration:
  * PostgreSQL lock contention on `node-vpc-db-01` (`10.100.20.44`).
  * HAProxy spine drop buffer saturation on `node-dc1-bm-08` (`172.16.1.18`).

### 2. `vpc_telemetry_prod.db` (Production Ready Day-0 Blank Slate)
* **Purpose:** Greenfield enterprise production deployment.
* **Invariant Preservations:** All reference schemas, lookup tables, and invariant specifications are **100% pre-seeded**:
  * 7 Infrastructure Tiers
  * 25 Monitored Components
  * 127 Invariant Metrics with Mathematical Thresholds
  * 10 Core Engine Telemetry Indicators
  * Enterprise License Quota & Tier definition (Cluster Medium: 75 node capacity)
* **Day-0 Blank Slate Invariant:** Strictly **0 customer nodes and 0 customer VPCs** (`DELETE FROM nodes; DELETE FROM vpcs; DELETE FROM node_technologies;`).
* **Operational Readiness:** Ready for network auto-discovery, eBPF probe connections, or manual VPC registration via the API.

---

## Part IV: Appliance Internal HA Quorum vs. Customer Monitored Nodes

A fundamental point of architectural clarity for SREs and auditors is distinguishing between the two classes of nodes in `<dcouplr/>`:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                    NODE CLASSIFICATION: CUSTOMER WORKLOADS VS. APPLIANCE QUORUM                 │
├───────────────────────────────────┬─────────────────────────────────────────────────────────────┤
│ Class 1: Customer Monitored Nodes │ Class 2: <dcouplr/> Internal Appliance Control Plane Quorum │
├───────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ • Customer databases (PostgreSQL) │ • 3-Node Embedded Raft Consensus Appliance Mesh             │
│ • Application servers (Node, Go)  │ • Leader Election & Term Coordination (LEADER • Term 4)     │
│ • Bare-metal servers & hypervisors│ • Circular Write-Ahead Log (WAL) Compaction State Machine   │
│ • Day-0 Count: 0 Nodes Active     │ • Day-0 Count: 3 Appliance Nodes in Quorum (Active)         │
│ • Monitored via eBPF / Exporters  │ • Internal State Daemon (Zero External Dependencies)        │
└───────────────────────────────────┴─────────────────────────────────────────────────────────────┘
```

### Why "Embedded Raft Consensus & WAL Compaction" Shows Data on Day-0
* In air-gapped or high-security VPCs, `<dcouplr/>` operates with **zero external dependencies**—it does not rely on ZooKeeper, etcd, or Consul.
* To provide high availability (HA) and sub-millisecond failover, `<dcouplr/>` appliance instances run an **embedded Raft consensus state machine** amongst themselves.
* **`LEADER • Term 4`** and **`WAL Log Compaction Monitor`** reflect the health of the `<dcouplr/>` appliance's internal coordination layer.
* **Conclusion:** Seeing `LEADER • Term 4` on Day-0 confirms that the appliance cluster is healthy, synchronized, and operational—even when 0 customer workloads have been onboarded.

---

## Part V: The In-VPC Single Source of Truth (SSOT) Banner

The configuration console (`/config`) and administrator vault (`/admin`) display the authoritative SSOT Sovereign Database Banner:

```
🛡️ IN-VPC SINGLE SOURCE OF TRUTH (SSOT) • EMBEDDED SOVEREIGN DATABASE
● SQLITE 3 WAL MODE (ONLINE) │ ZERO-WAN EGRESS ($0.00) │ OS AGNOSTIC
📁 Storage: data/vpc_telemetry_prod.db
Census Records in SSOT: 0 VPCs • 0 Nodes • 0 Stacks
🔄 Verify SSOT Engine Integrity
```

### Architectural Purpose & Compliance Value
1. **Cryptographic Proof of Zero Egress:** Proves to security compliance officers that all node inventories, VPC topologies, and threshold tuning persist locally with zero outbound network calls ($0.00 billable data transfer).
2. **Day-0 Proof:** Confirms that the database profile is truly clean, displaying `0 VPCs • 0 Nodes • 0 Stacks`.
3. **Engine Integrity Verification:** The **Verify SSOT Engine Integrity** button executes an in-memory `PRAGMA integrity_check` on the SQLite database, validating page allocation tables and B-tree consistency before workloads are staged.

---

## Part VI: Greenfield Day-0 Alignment Across Interfaces

When the active profile is set to **Production Ready (Day-0 Blank Slate)**, all platform consoles reflect the following synchronized states:

### 1. Dashboard (`http://localhost:8000/dashboard`)
* **Header License Pill:** Displays **`Medium • 0/75 Nodes ↗`**.
* **License & Census Modal:** Clicking the header pill opens `#modal-license-census`:
  * Total Active Installations: **`0 Installed Nodes / Agents`**
  * Available Licenses: **`75 Available`** (`75 Base + 0 Overage Pool Available`)
  * Purchased Overages: **`0 Nodes`**
  * FinOps Invoicing: **`$3,500.00 / mo`** (`0 Uncommitted Overages ($0.00)`)
* **VPC Architecture & Ingress Details:**
  * Displays **`No Monitored VPCs (Day-0 Blank Slate)`** with badge **`Blank Slate`**.
  * Agent status: **`No In-VPC Agents Connected (Awaiting Discovery)`**.
  * Subnets, Load Balancers, and Anycast Accelerators: all **`0`**.
* **Core Functions Strip:** Displays **`0 Networks Staged (Blank Slate)`**.

### 2. Compiler Studio (`http://localhost:8000/compiler`)
* **Monitored VPC Selector:** Dropdown displays **`No Monitored VPCs Registered (Day-0 Blank Slate)`**.
* **Capture Monitors Action:** Safely reports that 0 VPCs are registered and provides guidance to onboard networks.

### 3. Configuration Console (`http://localhost:8000/config`)
* **Top Header Pill:** Displays **`🖥️ 0 Monitored Nodes (Day-0 Blank Slate)`**.
* **KPI Card 4 (Monitored Node Census):** Displays **`0 Nodes Active`** across **`0 Staged Networks (Day-0 Blank Slate)`**.
* **Technology Census (Tab 2):** Network filter bar dynamically shows **`🌐 All Networks (0 Nodes)`**, selection badge shows **`Selected: 0 / 0 Nodes`**, and fleet quota meter shows **`0 / 75 Quota`**.

---

## Part VII: SRE Operational Runbook & API Reference

### 1. Profile Management Endpoints

#### Check Active Profile Status
```http
GET /v1/vpc-database/profile
Host: localhost:8000
```
**Response:**
```json
{
  "status": "success",
  "profile_info": {
    "active_profile": "production",
    "active_db_path": "vpc_telemetry_prod.db",
    "profiles": {
      "demo": { "node_count": 75, "vpc_count": 5, "metrics_count": 127 },
      "production": { "node_count": 0, "vpc_count": 0, "metrics_count": 127 }
    }
  }
}
```

#### Switch to Production Blank Slate
```http
POST /v1/vpc-database/profile/switch
Content-Type: application/json

{ "profile": "production" }
```

#### Switch to Demo Simulator
```http
POST /v1/vpc-database/profile/switch
Content-Type: application/json

{ "profile": "demo" }
```

#### Reset Demo State (Factory 75 Nodes)
```http
POST /v1/vpc-database/profile/reset-demo
```

#### Purge Production State (Day-0 Blank Slate)
```http
POST /v1/vpc-database/profile/reset-production
```

### 2. CLI Integrity Check & Inventory Validation
Run the following PowerShell / Bash command on the host appliance:

```powershell
python -c "from migration_tools.api.vpc_database import get_vpc_database; db = get_vpc_database(); print('Active Profile:', db.get_active_profile()); print('Nodes:', len(db.list_nodes())); print('VPCs:', len(db.list_vpcs())); print('Integrity:', db.verify_integrity())"
```

Expected Output in Production Blank Slate:
```text
Active Profile: production
Nodes: 0
VPCs: 0
Integrity: {'status': 'success', 'integrity_check': 'ok', 'wal_mode': True}
```

### 3. Atomic Database Backup (Zero-Downtime Hot Backup)
To snapshot the in-VPC SQLite database without pausing writes:

```powershell
python -c "import sqlite3; conn = sqlite3.connect('data/vpc_telemetry_prod.db'); conn.execute(\"VACUUM INTO 'data/backup_day0_' + str(int(__import__('time').time())) + '.db'\"); conn.close(); print('[OK] Hot backup complete.')"
```

---

## Part VIII: Appendix — Complete 7-Tier Invariant Metric Hierarchy (127 SSoT Metrics)

All 127 metrics are stored in the `monitoring_matrix_metrics` table of `dcouplr_customer_db`:

* **Tier 1: Physical Data Center Infrastructure (Bare Metal & On-Prem)**
  * Compute / Bare Metal Servers (10 metrics: CPU load, RAM, disk IOPS, temperatures, fans, PSU redundancy, ECC errors)
  * DCIM & IPMI Infrastructure (5 metrics: PDU power draw, rack temperatures, humidity, UPS load, door alarms)
  * Physical Top-of-Rack Switches (5 metrics: port drops, buffer queue depth, CRC errors, BGP peer state, transceiver DOM power)
* **Tier 2: Core Networking & Spine Interconnects**
  * Core Ingress Spine & VRRP Interconnects (5 metrics: Spine buffer drops, VRRP failover events, MTU mismatch, route flapping, flow export rate)
  * Inter-VPC Peering & Cloud Interconnects (5 metrics: DirectConnect/ExpressRoute latency, BGP prefix count, packet drop %, bandwidth saturation, QinQ VLAN errors)
  * DNS & Internal Name Resolution (5 metrics: query latency P99, SERVFAIL rate, NXDOMAIN bursts, cache hit %, recursion pool saturation)
  * Network Firewalls & Perimeter Edge (5 metrics: state table usage, drop rate %, session setup latency, threat signatures, syn flood drops)
* **Tier 3: Cloud & VPC Virtual Infrastructure**
  * Hyperscaler Virtual Private Clouds (5 metrics: VPC flow log drop rate, ENI link saturation, security group rejection count, NAT gateway port exhaustion, route table churn)
  * Managed Cloud Ingress & Load Balancing (5 metrics: HTTP 502/504 errors, surge queue length, backend healthy host %, TLS negotiation duration, connection pool starvation)
  * Cloud Object Storage & In-VPC Endpoints (5 metrics: Gateway endpoint latency, 403 authorization bursts, 503 SlowDown rate, multipart upload aborts, replication lag)
* **Tier 4: Virtualization & Container Orchestration**
  * Hypervisors & Virtual Machines (5 metrics: CPU steal %, balloon driver inflation, VM snapshot age, hypervisor memory overcommit, disk queue length)
  * Kubernetes Control Plane & Nodes (6 metrics: API server request duration, etcd leader elections, kubelet eviction count, node NotReady count, crashlooping pods, schedule queue latency)
  * Container Runtime & Pod Life Cycle (5 metrics: OOMKilled container count, image pull backoff duration, container restart rate, cgroup throttling %, volume mount timeout)
* **Tier 5: Middleware, Databases & Cache Engines**
  * PostgreSQL Database Engines (7 metrics: active lock count, replication lag bytes, dead tuple bloat, connection pool saturation, cache hit ratio, long-running transactions, checkpoint duration)
  * Oracle Database 19c RAC (6 metrics: SGA/PGA hit ratio, active sessions vs PROCESSES, redo log space waits, Data Guard standby lag, tablespace capacity, buffer busy waits)
  * Microsoft SQL Server 2022 (6 metrics: page life expectancy, sql compilations/sec, AG replica recovery queue, tempdb space, latch waits, full scans)
  * Distributed Caches & In-Memory Stores (5 metrics: cache eviction rate, memory fragmentation ratio, hit ratio %, blocked clients, keyspace hit/miss)
  * Message Brokers & Streaming Queues (5 metrics: consumer group lag, under-replicated partitions, offline partitions, broker disk space, message backlog duration)
* **Tier 6: Application & Process Layer (APM & Distributed Tracing)**
  * Application Performance & APM (6 metrics: P50/P95/P99 latency, HTTP 5xx error rate, thread pool saturation, JVM GC pause duration)
  * SAP ERP & Salesforce CRM Adapters (5 metrics: RFC DIA work process utilization, IDoc backlog, SAP short dumps, Salesforce API daily limit %, batch job breach)
  * Distributed Tracing & Service Mesh (4 metrics: span drop rate, service dependency error %, circuit breaker trip state, mesh mTLS handshake errors)
  * Synthetic Transactions & Real-User Monitoring (4 metrics: critical journey success %, step timeout failures, Core Web Vitals LCP, DNS resolution time)
* **Tier 7: Logs, Events & Security (SIEM / Auditing)**
  * Centralized In-Guest Logging (5 metrics: log ingestion rate EPS, buffer fill %, log parsing error rate, storage retention headroom, disk spool backpressure)
  * SIEM & Security Auditing Relays (5 metrics: failed auth burst rate, privilege escalation events, unauthorized API mutations, SPIFFE SVID validation failures, TLS cipher downgrade attempts)
  * File Integrity & Kernel Audit (4 metrics: system binary drift events, eBPF probe injection failures, rootkit signature alerts, auditd backlog drops)

---

*Authored by Enterprise Systems Architecture & Sovereign Infrastructure Committee.*  
*Canonical Reference: `docs/runbooks/RUNBOOK-DUAL-DATABASE-ARCHITECTURE-AND-SSOT-REFERENCE.md`.*
