# 🗄️ <dcouplr/>: Selective Database Fleet Configuration & Version-Agnostic Architecture

**Document Identifier:** `VA-SPEC-DB-001`  
**Category:** Database Observability, Telemetry Isolation & Version-Agnostic Engine Architecture  
**System Title:** `<dcouplr/>`: Universal Multi-Engine Database Fleet Monitoring & Selective Isolation  
**Approved Baseline:** Version 1.0.0 (October 2026)  
**Classification:** Enterprise Engineering, SRE Operations & System Administration Standard  
**Maintainers:** Core Architecture Board, Database Reliability Engineering (DBRE), SRE Operations  

---

## 1. Executive Summary & Problem Statement

In enterprise heterogeneous infrastructure environments, databases span decades of technology iterations (e.g., Oracle 11g through 23ai RAC, SQL Server 2012 through 2022 Always On, PostgreSQL 11 through 17+, MySQL 5.7/8.x, Redis clusters, Apache Cassandra, and TiDB).

Legacy SaaS monitoring tools (such as Datadog and Dynatrace) introduce two major operational failure modes:
1. **Brittle Point-Release Coupling:** Agents break or fail validation when point releases or minor patch versions update (e.g., PostgreSQL 15.3 vs 16.1), creating maintenance friction and false-alarm outages.
2. **Global Alert Noise / False Positive Storms:** If an observability tool scans for every possible database technology by default, customer environments that do not deploy Oracle or Microsoft SQL Server are flooded with alert noise, artificial component degradation in Tier 5 dashboards, and phantom incident tickets.

To solve this, `<dcouplr/>` implements **Selective Database Fleet Configuration & Version-Agnostic Universal Engine Architecture**.

---

## 2. Core Architectural Principles

### 2.1 The Invariant Philosophy (Version-Agnostic Monitoring)
Site Reliability Engineering (SRE) invariants for data engines are fundamental mathematical properties that remain constant across versions:
- **Cache Hit Ratios:** (Buffer cache, SGA, shared buffers, InnoDB buffer pool hit ratios $> 95\%$)
- **Connection Pool Headroom:** (Active client sessions vs maximum allocated worker threads $< 80\%$)
- **Replication Lag:** (Binlog seconds behind master, WAL byte lag, Data Guard archiver delay, or Always On replica redo queues)
- **Deadlock Velocity:** (Transaction deadlock occurrence rate $= 0$)
- **Disk Flush Duration:** (Checkpoint completion and write times within safe limits)

`<dcouplr/>` targets these universal mathematical invariants via native ANSI SQL system catalog views, standard administrative wire protocols, and high-performance management interfaces—completely eliminating brittle dependencies on vendor-specific point-release schemas.

### 2.2 Dynamic Fleet-Wide Isolation (False Alarm Elimination)
When an enterprise operator configures their active database fleet:
1. **Tier 5 Monitoring Matrix Suppression:** Unselected database components (e.g., `databases_oracle`, `databases_mssql`) are cleanly marked `enabled: false`. Their synthetic degradation is suppressed and excluded from overall health rollup calculations.
2. **71-Node Census Technology Toggling:** Every physical datacenter server, cloud VM, and container host in the 71-node census automatically marks excluded database technologies as `enabled: false` and `active_in_fleet: false` with a status note: `INACTIVE (EXCLUDED FROM CUSTOMER FLEET)`.
3. **Zero Alert Dispatch:** No incident tickets, notifications, or PagerDuty/Slack pages are ever triggered for engines excluded from the customer's fleet.

---

## 3. Catalog of Supported Universal Database Engines

`<dcouplr/>` ships with native, version-agnostic support for 8 universal enterprise database engines:

| Engine | Icon | Default Port | Wire Protocol / Telemetry Interface | Supported Versions | Monitored Mathematical Invariants |
| :--- | :---: | :---: | :--- | :--- | :--- |
| **PostgreSQL** | 🐘 | `5432` | ANSI SQL • PostgreSQL Frontend/Backend Protocol (`pg_stat_database`, `pg_stat_activity`) | Universal (v11, 12, 13, 14, 15, 16, 17+) | Shared Buffers Hit Ratio ($>95\%$), Connection Pool Saturation ($<80\%$), Replication Lag ($<1\text{MB}$), Deadlocks ($=0$) |
| **Oracle Database** | 🏛️ | `1521` | Oracle Net TNS / OCI (`v$sysmetric`, `v$session`, `v$system_event`, AWR) | Universal (11g, 12c, 18c, 19c, 21c, 23ai RAC & Multitenant) | SGA Cache Hit Ratio ($>95\%$), PGA Workarea Ratio ($>90\%$), Active Sessions vs PROCESSES ($<75\%$), Data Guard Lag ($<5\text{m}$) |
| **Microsoft SQL Server** | 🏢 | `1433` | Tabular Data Stream (TDS) (`sys.dm_os_performance_counters`, `sys.dm_exec_requests`) | Universal (2012, 2014, 2016, 2017, 2019, 2022+ & Azure SQL) | Buffer Cache Hit Ratio ($>95\%$), Page Life Expectancy ($>300\text{s}$), Worker Connections ($<80\%$), AG Redo Queue ($<50\text{MB}$) |
| **MySQL & MariaDB** | 🐬 | `3306` | MySQL Client/Server Protocol (`performance_schema`, `sys.metrics`) | Universal (MySQL 5.7, 8.0, 8.4 LTS, MariaDB 10.x/11.x, Percona) | InnoDB Buffer Pool Hit Ratio ($>95\%$), Thread Concurrency ($<80\%$), Replica Lag ($<1\text{s}$), Aborted Connects ($=0$) |
| **Redis** | ⚡ | `6379` | REdis Serialization Protocol (RESP) (`INFO stats`, `INFO memory`, `CLIENT LIST`) | Universal (Redis 5.0, 6.0, 6.2, 7.0, 7.2, 7.4+ & Valkey) | Instantaneous Hit Rate ($>90\%$), Maxmemory Utilization ($<85\%$), Blocked Clients ($=0$), Replication Link Status ($=\text{up}$) |
| **Apache Cassandra** | 👁️ | `9042` | CQL Native Protocol / JMX MBeans (`org.apache.cassandra.metrics`) | Universal (Cassandra 3.11, 4.0, 4.1, 5.0+ & ScyllaDB) | Key Cache Hit Rate ($>85\%$), Mutation Drop Rate ($=0$), Compaction Queue ($<10$), Read P99 Latency ($<15\text{ms}$) |
| **TiDB** | 🪐 | `4000` | MySQL Protocol / TiKV gRPC (`information_schema.cluster_info`, TiKV Coprocessor) | Universal (TiDB 6.x, 7.x, 8.x Cloud & On-Premises) | Coprocessor Request Duration ($<50\text{ms}$), Raft Log Lag ($=0$), Storage Space ($<80\%$), Transaction Retries ($<1\%$) |
| **SAP HANA** | 💎 | `39015` | SAP HANA SQL Client / JDBC (`SYS.M_SERVICE_STATISTICS`, `SYS.M_CS_TABLES`) | Universal (SPS 04, 05, 06, 07+ & HANA Cloud) | Column Store Allocation ($<80\%$), Savepoint Flush Duration ($<60\text{s}$), Delta Merge Pending ($<5$), System Replication ($=\text{OK}$) |

---

## 4. Pre-Built Operational Presets

To streamline enterprise onboarding, `<dcouplr/>` provides 7 turnkey fleet configuration presets:

1. **`postgres_only` (Modern Lean):** Activates PostgreSQL as the sole primary database engine.
2. **`postgres_redis` (Cloud-Native Standard):** Modern microservice pattern pairing relational persistence with an in-memory cache layer.
3. **`oracle_enterprise` (Legacy Core):** Dedicated Oracle RAC & Multitenant mission-critical database profile.
4. **`mssql_stack` (Microsoft Enterprise):** Windows Server and SQL Server ecosystem with Always On Availability Groups.
5. **`lamp_stack` (Web Scale):** High-volume MySQL / MariaDB relational cluster paired with Redis cache.
6. **`all_engines` (Full Multi-Engine Fleet):** Enables all 8 universal database engines simultaneously.
7. **`clear_all` (No Databases):** Deactivates all database monitoring for compute-only, networking-only, or stateless edge nodes.

---

## 5. REST API Interface & Telemetry Contracts

### 5.1 Retrieve Database Technologies Catalog & Fleet Status
```http
GET /v1/telemetry/database/technologies
```
**Response (200 OK):**
```json
{
  "status": "success",
  "version_agnostic_mode": true,
  "version_philosophy": "SRE invariants (cache hit ratios, deadlocks, connection saturation, replication lag) are universal mathematical invariants across all engine versions.",
  "total_supported": 8,
  "active_count": 2,
  "inactive_count": 6,
  "active_database_engines": [
    "postgres",
    "redis"
  ],
  "supported_technologies": [ ... ],
  "presets": { ... }
}
```

### 5.2 Select Active Customer Database Fleet
```http
POST /v1/telemetry/database/technologies/select
Content-Type: application/json

{
  "selected_engines": ["postgres", "redis"]
}
```
**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Database fleet selection applied: 2 active engine(s), 6 excluded/inactive.",
  "active_database_engines": ["postgres", "redis"],
  "active_count": 2,
  "total_supported": 8,
  "affected_nodes_count": 42,
  "version_agnostic_mode": true
}
```

### 5.3 Retrieve Node Technologies Inventory
```http
GET /v1/telemetry/nodes/technologies
```
Returns node-by-node technology allocations across all 71 census instances. Inactive engines carry `"enabled": false` and `"status_note": "INACTIVE (EXCLUDED FROM CUSTOMER FLEET)"`.

---

## 6. User Interface Integration

1. **Configuration Hub (`/configuration`):**
   - **Interactive Database Fleet Selector Card:** Displays checkboxes for all 8 supported engines with icon badges, category tags, wire protocols, and default service ports.
   - **Turnkey Preset Buttons:** 1-click preset triggers (`Postgres Only`, `Postgres + Redis`, `Oracle Enterprise`, `MSSQL Stack`, `All Engines`, `Clear All`).
   - **Live Save & Fleet Dispatch:** `btn-save-db-fleet` immediately dispatches configuration to the runtime daemon and synchronizes the 71-node census.
2. **Operational Matrix Dashboard (`/matrix`):**
   - **Glance Header Chips:** Displays active universal database engine pills in real time.
   - **Tier 5 Matrix Row:** Displays active database engines while cleanly dimming and disabling unselected technologies.

---

## 7. Verification & Compliance Standard

Fleet selection and isolation is continuously verified in the automated CI test suite via:
- [`tests/test_database_technologies_selection.py`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/tests/test_database_technologies_selection.py)
  - `test_get_database_technologies_catalog`: Asserts 8 supported engines, version-agnostic metadata, and presets.
  - `test_select_database_technologies_isolation`: Asserts Tier 5 matrix component suppression and 71-node census isolation.
  - `test_ui_database_fleet_selector_elements`: Asserts presence of interactive selectors and buttons in HTML.
