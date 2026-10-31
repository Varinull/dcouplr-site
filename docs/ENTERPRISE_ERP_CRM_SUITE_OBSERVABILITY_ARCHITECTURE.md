# Enterprise ERP & CRM Suite Observability & Architectural Placement Specification
**Document ID:** `VA-SPEC-ERP-001`  
**Classification:** Enterprise SRE Standard / Production Architecture  
**Tier Association:** Tier 5 (Middleware & Databases) vs. Tier 6 (App Services & APM)  
**Status:** Approved & Active in `<dcouplr/>` Core Telemetry Engine  
**Release:** Universal Driver Edition (Version-Agnostic Engine Driver)

---

## 1. Executive Summary & Architectural Demarcation

Enterprise Resource Planning (ERP) and Customer Relationship Management (CRM) platforms run the critical core of global operations—including general ledger financial accounting, global supply chain fulfillment, warehouse inventory, payroll, order-to-cash pipelines, and enterprise case resolution. 

Historically, monitoring these monoliths and distributed SaaS backbones has been fractured, fragile, and prone to two catastrophic failure modes:
1. **Tier Misplacement & Conceptual Confusion:** Conflating the database engine (e.g., SAP HANA column store, Oracle RAC, Microsoft SQL Server) with the application process plane (e.g., SAP S/4HANA & ECC NetWeaver AS ABAP/Java work processes, Dispatcher, Central Services ASCS/ERS, RFC Gateway, Oracle EBS Concurrent Managers, Dynamics 365 AOS, Salesforce Event Bus).
2. **Global Operational Alert Noise:** Monolithic monitoring agents that blast alerts for SAP work process exhaustion, IDoc status 51 queues, or Oracle Concurrent Manager delays onto cloud-native, microservice-only environments that do not run monolithic ERP estates.

### 1.1 The Definitive 7-Tier Demarcation

`<dcouplr/>` establishes a rigorous architectural boundary separating the in-memory/relational database storage plane from the enterprise application server and business process plane:

```
+---------------------------------------------------------------------------------------------------+
| TIER 6: APP SERVICES & APM (APPLICATION & BUSINESS PROCESS PLANE)                                 |
| 🔷 SAP S/4HANA & ECC (NetWeaver AS ABAP/Java: DIA, UPD, BTC, ENQ, SPO, RFC Gateway, IDocs, Fiori) |
| 🏛️ Oracle E-Business Suite (Concurrent Managers, Forms/OAF Sessions, Workflow Notification Mailer)|
| 🏢 Microsoft Dynamics 365 F&O (Application Object Server threads, DMF staging queues, Batch lag)  |
| ☁️ Salesforce Enterprise CRM (Platform Event Bus, Apex CPU Governor limits, Bulk API v2, CDC lag)  |
| 👔 Workday HCM & Financials (Enterprise Interface Builder EIB, Report-as-a-Service RaaS, Studio)  |
| 🎫 ServiceNow CSM & ITOM (Table API, MID Server ECC Queue, Flow Designer IPC, Glide Quota)        |
+---------------------------------------------------------------------------------------------------+
                                                ▲  wire queries / SQL / JDBC / TDS / JCo
                                                ▼  saves / transactions / checkpoints
+---------------------------------------------------------------------------------------------------+
| TIER 5: MIDDLEWARE & DATABASES (PERSISTENCE & STORAGE IN-MEMORY / RAC PLANE)                      |
| 🔷 SAP HANA: Column Store Memory %, Disk Savepoint Flush Duration, Delta Merge Backlog            |
| 🏛️ Oracle Database / RAC: Buffer Cache Hit %, Library Cache Lock, Redo Log Switch Contention     |
| 🏢 Microsoft SQL Server: Buffer Cache Hit Ratio, Page Life Expectancy, Lock Waits, TempDB Contention|
| 🐘 PostgreSQL, Redis, MySQL, Apache Cassandra, PingCAP TiDB                                       |
+---------------------------------------------------------------------------------------------------+
```

### 1.2 "Optional & Silenced by Default" Philosophy

To protect non-ERP organizations (such as Kubernetes-native startups, Go/Rust microservice platforms, or edge IoT networks) from cognitive overload and false alarms, `<dcouplr/>` enforces **Strict Opt-In Isolation**:
- **Default State:** `active_erp_engines: []`, `enterprise_erp_crm.enabled: False`.
- **Alert Invariant Silencing:** When no ERP engines are selected, Tier 6 metric collectors, threshold evaluators, and notification pipelines for ERP/CRM are silenced.
- **Node Census Cleanliness:** Node cards display `⚪ INACTIVE (EXCLUDED FROM CUSTOMER FLEET / OPTIONAL ERP SUITE)` for unselected engines, ensuring zero phantom warnings.
- **Selective Fleet Configuration:** Customers pick and choose only the specific ERP and CRM platforms they operate, whether a pure SAP S/4HANA estate, an Oracle EBS manufacturing hub, or a modern hybrid stack combining SAP ERP, Salesforce CRM, and ServiceNow CSM.

---

## 2. The 6 Supported Enterprise ERP & CRM Platforms

`<dcouplr/>` provides version-agnostic engine drivers for the top 6 industry platforms:

| Platform ID | Full Engine Name | Category | Wire Protocol & Port | SRE Invariant Focus |
|---|---|---|---|---|
| `sap_s4hana` | SAP S/4HANA & ECC (NetWeaver AS ABAP/Java) | Core Enterprise ERP | SAP Control SOAP (50013) / RFC Gateway (3300) / Fiori HTTPS (8000) | Dialog response time, DIA/UPD/BTC work processes, Enqueue lock table (SM12), RFC/IDoc status 51 queues |
| `oracle_ebs` | Oracle E-Business Suite (EBS R12 / Fusion) | Enterprise Financials & Supply Chain | Oracle Forms / OAF / Concurrent Manager FND IPC / TNS (1521) | Concurrent Manager queue lag, Inactive No Manager status, Forms runtime locks, Workflow Mailer backlog |
| `ms_dynamics_365` | Microsoft Dynamics 365 Finance & Operations | Cloud & Hybrid ERP | HTTPS OData v4 / Azure Service Bus / DMF Staging API (443) | AOS worker thread saturation, DMF staging error backlog, batch execution delay, API throttling |
| `salesforce_crm` | Salesforce Enterprise CRM & Platform Gateway | Enterprise CRM & Sales Cloud | REST API / Pub/Sub gRPC / CometD Streaming (443) | Apex CPU Governor limits, Daily API limit headroom, CDC event streaming lag, SOQL query row limits |
| `workday_hcm` | Workday Human Capital Management & Financials | Enterprise HCM & Financials | Workday Web Services (WWS) SOAP / RaaS REST API (443) | Enterprise Interface Builder (EIB) delays, RaaS query latency, integration error rates, session limits |
| `servicenow_csm` | ServiceNow Customer Service Management & ITOM | Enterprise Customer Workflow & CSM | REST Table API / MID Server ECC Queue / Flow Designer IPC (443) | MID Server ECC queue backlog, Glide transaction quota utilization, Flow Designer delay, P1 case SLA |

---

## 3. The 4 Observability Planes of Enterprise ERP & CRM

Across all 6 platforms, `<dcouplr/>` organizes telemetry into 4 invariant observability planes:

### 3.1 Plane 1: Work Process & Dispatcher Saturation Plane
In monolithic application servers (such as SAP ABAP Dispatcher or Oracle Concurrent Processing), requests are dispatched to a finite pool of pre-allocated operating system worker processes:
- **Dialog (DIA) Work Processes:** Handle interactive user web/GUI transactions. When 100% of DIA processes are allocated, new user HTTP/GUI requests queue in the dispatcher request queue.
- **Update (UPD / UPD2) Work Processes:** Process asynchronous database commit records (V1 high-priority accounting documents, V2 statistical updates). Saturation halts order posting.
- **Background (BTC) Work Processes:** Execute batch processing jobs (SM37 / Concurrent Requests). Saturation leads to batch queue starvation.
- **Invariant Mathematical Formulation:**
  $$\text{Utilization}_{\text{WP}} = \frac{\sum \text{Active Processors (DIA, UPD, BTC)}}{\sum \text{Configured Processors}} \times 100$$
  - **Warning Threshold:** $> 80.0\%$
  - **Critical Threshold:** $> 92.0\%$

### 3.2 Plane 2: Integration, Messaging & RPC Queue Plane
Enterprise ERPs are integration nexus points exchanging millions of transactions with EDI partners, banks, warehouse scanners, and peripheral CRMs:
- **SAP RFC Gateway & tRFC/qRFC Queues (SM58 / SMQ1 / SMQ2):** Outbound and inbound transactional Remote Function Calls.
- **IDoc Processing Backlog (WE02 / WE05):** Inbound electronic data interchange documents stuck in **Status 51** (*Application document not posted*) or **Status 64** (*IDoc ready to be passed to application*).
- **ServiceNow ECC Queue / Salesforce Event Bus:** Outbound message queues buffer events between on-prem MID servers and cloud instances.
- **Invariant Mathematical Formulation:**
  $$\text{Backlog}_{\text{Integration}} = \sum \text{Unprocessed Queue Entries} + \sum \text{Stuck Inbound Errors (Status 51, SysFail)}$$
  - **Warning Threshold:** $\ge 25 \text{ records}$
  - **Critical Threshold:** $\ge 100 \text{ records}$

### 3.3 Plane 3: Concurrency, Locking & Enqueue Plane
ERP systems maintain application-level logical locks independent of the database row-level lock manager to enforce multi-user business consistency across long-running financial transactions:
- **SAP Central Services Enqueue Server (ASCS / ERS):** Maintains the global lock table in shared memory (`SM12`). If the lock table fills to 100%, new business transactions crash with `SYSTEM_NO_MORE_PAGING` or `ENQUE_TABLE_FULL`.
- **Enqueue Replication Server (ERS):** Replicates locks across cluster nodes for high availability.
- **Oracle EBS FND User Locks & Forms Concurrency:** Deadlocks between simultaneous batch posting and user order booking.
- **Invariant Mathematical Formulation:**
  $$\text{Contention}_{\text{LockTable}} = \frac{\text{Current Active Lock Entries}}{\text{Max Configured Lock Capacity}} \times 100$$
  - **Warning Threshold:** $> 70.0\%$
  - **Critical Threshold:** $> 85.0\%$

### 3.4 Plane 4: End-to-End User Experience & Transaction Latency Plane
Measures the actual perceived duration of business actions (e.g., posting a sales order, generating an invoice, querying customer history, rendering a Fiori tile):
- **Components of Dialog Response Time ($T_{\text{resp}}$):**
  $$T_{\text{resp}} = T_{\text{CPU}} + T_{\text{DB}} + T_{\text{Wait}} + T_{\text{RollIn}} + T_{\text{GUI}}$$
  - **$T_{\text{CPU}}$:** Time spent executing ABAP/Java/C code in the application server.
  - **$T_{\text{DB}}$:** Database round-trip execution and retrieval time.
  - **$T_{\text{Wait}}$:** Time the request queued in the dispatcher waiting for a free DIA work process. High $T_{\text{Wait}}$ indicates work process starvation rather than slow database queries.
  - **$T_{\text{RollIn}}$ / $T_{\text{RollOut}}$:** Memory paging time for user session context.
- **SRE Thresholds:**
  - **Normal Operating Range:** $150\text{ms} - 450\text{ms}$
  - **Warning Threshold:** $> 1,000.0\text{ms}$
  - **Critical Threshold:** $> 2,500.0\text{ms}$

---

## 4. Telemetry Collection Wire Protocols & Zero-WAN Air-Gap Mechanics

`<dcouplr/>` collects telemetry from enterprise ERP and CRM platforms without deploying intrusive proprietary agents or installing binary packages into SAP kernel directories:

### 4.1 In-Perimeter Collection Architecture
1. **SAP Control SOAP API (HTTP Port 50013 / HTTPS 50014):**
   - Direct, authenticated, read-only SOAP calls to the local `sapstartsrv` daemon on each application instance.
   - Operations: `GetProcessList`, `GetQueueStatistic`, `GetAlertTree`, `EnqGetStatistic`.
   - Overhead: $< 0.1\%$ CPU, execution time $< 5\text{ms}$.
2. **Read-Only RFC Diagnostic Function Modules:**
   - Standard SAP BAPIs / Function Modules: `TH_WPINFO` (work process details), `ENQUEUE_READ` (lock statistics), `EDI_DOCUMENT_STATISTIC` (IDoc error counts).
   - Executed via standard, secure in-perimeter sapnwrfc connectors.
3. **SaaS Cloud Gateways (Salesforce, Workday, ServiceNow):**
   - Outbound REST / gRPC polling via in-perimeter secure proxies.
   - Credentials stored in local hardware-backed keystores (AES-256-GCM); zero raw credentials or un-anonymized customer PII egress to external networks.

```
+----------------------------------------------------------------------------------------------------+
| CUSTOMER ON-PREMISES / VPC AIR-GAPPED PERIMETER                                                    |
|                                                                                                    |
|  +--------------------+    SOAP 50013 (sapstartsrv)    +----------------------------------------+  |
|  | SAP S/4HANA ASCS   | <---------------------------- | <dcouplr/> eBPF / Telemetry Collector  |  |
|  | Enqueue / ERS Lock |                               | - Ring Buffer: 1,000,000 metrics/sec   |  |
|  +--------------------+                               | - Local Evaluation Window: 5m sliding  |  |
|                                                       | - Zero External SaaS Egress            |  |
|  +--------------------+    RFC / JCo / Loopback       | - Alert Router & Ticketing Bridge        |  |
|  | SAP App Instance   | <---------------------------- |                                        |  |
|  | DIA / UPD / BTC    |                               +----------------------------------------+  |
|  +--------------------+                                                    ▲                       |
|                                                                            │                       |
|  +--------------------+    Local IPC / Forms / TNS                         │                       |
|  | Oracle EBS App     | <--------------------------------------------------+                       |
|  | Concurrent Manager |                                                                            |
|  +--------------------+                                                                            |
+----------------------------------------------------------------------------------------------------+
```

---

## 5. Fleet Presets & SRE Turnkey Configurations

`<dcouplr/>` provides 6 built-in presets designed for common enterprise topologies:

1. **`none` (Deactivate All / Default Silenced):**
   - All ERP/CRM telemetry components disabled.
   - Zero CPU/network overhead.
   - Silenced invariants; zero false alarms for cloud-native/microservice environments.
2. **`sap_centric` (SAP S/4HANA & ECC Core):**
   - Activates `sap_s4hana`.
   - Focuses SRE invariants on ABAP work process saturation, Enqueue lock table contention, and RFC/IDoc Status 51 backlogs.
3. **`oracle_centric` (Oracle E-Business Suite):**
   - Activates `oracle_ebs`.
   - Focuses on Concurrent Manager queue lag, Forms runtimes, and Workflow Notification Mailers.
4. **`ms_dynamics` (Microsoft Dynamics 365 Finance & Operations):**
   - Activates `ms_dynamics_365`.
   - Focuses on AOS thread saturation, DMF data staging queues, and batch execution delay.
5. **`modern_hybrid` (SAP S/4HANA + Salesforce CRM + ServiceNow CSM):**
   - Activates `sap_s4hana`, `salesforce_crm`, and `servicenow_csm`.
   - Complete visibility across the modern enterprise triangle: ERP financial ledger (SAP), sales opportunities & quotes (Salesforce), and customer support service workflows (ServiceNow).
6. **`all_erp_crm` (Full Suite Activation):**
   - Activates all 6 platforms across all nodes.

---

## 6. SRE Incident Remediation Runbooks

### Runbook ERP-01: SAP Work Process Exhaustion (DIA Saturation $> 90\%$)
- **P1 Escalation Condition:** `work_process_util_pct > 92%` for $\ge 3$ consecutive evaluation windows.
- **Immediate Action:**
  1. Open SAP Transaction `SM50` (Process Overview) or inspect `<dcouplr/>` node telemetry for `node-dc1-hv-01`.
  2. Identify whether long-running dialog reports (e.g., unscheduled financial balance queries) are blocking DIA processes.
  3. Execute dynamic work process reassignment via `RZ04` or terminate rogue report with soft cancel (`Process -> Cancel with Core`).
  4. Check dispatcher wait time ($T_{\text{wait}}$). If $T_{\text{wait}} > 2,000\text{ms}$, enable temporary dynamic work processes via `rdisp/dynamic_wp_check`.

### Runbook ERP-02: Enqueue Lock Table Contention (SM12 Fill Ratio $> 70\%$)
- **P1 Escalation Condition:** `lock_table_util_pct > 85%`.
- **Immediate Action:**
  1. Open `SM12` (Lock Entries) or query `sapstartsrv` via SOAP `EnqGetStatistic`.
  2. Filter by Table Name and Lock Argument to identify single-user bulk locking (e.g., massive batch billing run locking entire customer account tables).
  3. Verify ERS replication status in high-availability cluster (`sapcontrol -nr 01 -function HAGetFailoverConfig`).
  4. If lock table exhaustion is imminent, contact the job owner before active user transactions abort with `ENQUE_TABLE_FULL`.

### Runbook ERP-03: Stuck Inbound IDoc & RFC Errors (Status 51 Backlog $> 25$)
- **P2 Escalation Condition:** `rfc_idoc_queue_backlog > 25 records`.
- **Immediate Action:**
  1. Open `WE02` / `WE05` (IDoc List) or check transactional RFC queue in `SM58`.
  2. Identify root cause:
     - Error code `M8 082` (Account determination error): Escalate to SAP Finance Functional Team.
     - Error code `VK 034` (Partner profile missing): Escalate to EDI Integration Team.
     - Database deadlock / lock conflict: Re-queue IDocs using program `RBDMANI2` in background once locks clear.

---

## 7. Compliance, Governance & Audit Verification

- **GDPR / HIPAA / PCI-DSS Posture:** All ERP metric collection operates exclusively on system-level performance indicators (queue depths, milliseconds, lock counts). `<dcouplr/>` strictly prohibits capturing user payload data, invoice numbers, customer names, or financial balances in the telemetry stream.
- **Zero-WAN Integrity:** All SAP Control and ERP monitoring operates via in-perimeter IPC/loopback. Zero customer ERP data is transmitted outside the sovereign corporate perimeter.
- **Audit Logging:** Every activation, deactivation, or threshold modification in the Enterprise ERP & CRM Suite is cryptographically signed and recorded in the tamper-evident audit log.
