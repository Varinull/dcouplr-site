# <dcouplr/> Support Tiers & Incident SLAs Specification

**Document ID:** VA-SPEC-SUPPORT-SLA-001  
**Version:** 1.0.0 (GA Enterprise Specification)  
**Date:** 2026-10-27  
**Classification:** Public Specification & Enterprise Master Service Agreement (MSA) Appendix  
**Target Audience:** SREs, Platform Engineers, DevOps Leads, Procurement & Legal Teams  
**Published Reference:** [https://dcouplr.com/docs#support-slas](https://dcouplr.com/docs#support-slas)  

---

## 1. Executive Summary & The Zero-Egress Support Paradigm

`<dcouplr/>` is an open-core, in-perimeter observability and infrastructure-as-code transpilation engine designed to operate 100% inside private VPCs, Kubernetes clusters, and air-gapped on-premises datacenters. Because `<dcouplr/>` enforces a mathematical zero-egress guarantee ($Egress_{WAN} \equiv 0.00\text{ KB}$), our support and incident management model is deliberately architected for **zero-trust security**:

1. **No External Credentials or Data Ingestion:** `<dcouplr/>` support engineers never request, store, or receive customer production credentials, private keys, database connection strings, or unredacted metric feeds.
2. **In-Perimeter Diagnostic Pairing:** Technical troubleshooting takes place inside the customer's perimeter via live in-VPC screen sharing or private, ephemeral WebRTC video war-rooms.
3. **Deterministic AST Linters:** Diagnostic data shared during support engagements is processed through local HMAC-SHA256 anonymization filters (`LocalTokenAnonymizer`), ensuring zero IP or hostname disclosure.
4. **Radical Transparency:** Every tier's entitlements, guaranteed response times, resolution targets, and contractual financial remedies are codified publicly and objectively measured.

---

## 2. Tier-by-Tier Support Entitlements Matrix

The table below outlines the service boundaries, coverage windows, support channels, and engineering allocation across all six commercial licensing tiers:

| Attribute | Tier 0: Community Core | Tier 1: Developer Pro | Tier 2: Cluster Small | Tier 3: Cluster Medium | Tier 4: Cluster Large | Tier 5: Custom Enterprise |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Pricing Model** | **$0 / month** (Free) | **$300 / month** | **$1,500 / month** | **$3,500 / month** | **$45 / node / month** | **Custom Annual Contract** |
| **Monitored Capacity** | 1 Local CLI / 10 Nodes | 25 Monitored Nodes | 50 Monitored Nodes | 150 Monitored Nodes | 91 to 500+ Nodes | Unlimited Enterprise Nodes |
| **License Type** | Apache 2.0 Open-Core | Commercial In-VPC | Commercial In-VPC | Commercial Multi-VPC | Commercial Fleet Mesh | Air-Gapped Perpetual |
| **Coverage Hours** | Asynchronous (Volunteer) | 9×5 Local Business | 12×5 Extended (UTC) | 24×7×365 for P1 / 12×5 for P2–P4 | 24×7×365 Continuous Priority | 24×7×365 Follow-the-Sun |
| **P1 First Response SLA** | **Best Effort** | **24 Hours** (Bus. Days) | **4 Hours** | **2 Hours** (24/7 Guaranteed) | **1 Hour** (24/7 Guaranteed) | **15 Minutes** (Ultra-Priority) |
| **Support Intake Channels** | GitHub Discussions & Issues | Priority Email Desk (`support@dcouplr.com`) | CLI Ticket Dispatch & Priority Desk | Shared Slack / Teams Channel + Priority Email | Direct PagerDuty / Opsgenie + Slack Connect | 24/7 Emergency Hotline + Private Slack Grid |
| **Incident War-Room Bridge** | — | — | Ad-hoc Screen-Share (1/qtr) | Dedicated On-Demand Bridge (< 30m) | Live Video War-Room (< 15m) + PagerDuty | Instant War-Room Cell (< 5m) + Dedicated On-Call |
| **Account Management** | Community Forums | Shared Support Queue | Pooled Technical Support | Designated Associate TAM | Dedicated Named Senior TAM | Dedicated Principal TAM & Solutions Architect |
| **Custom Parser SLAs** | Community PRs | Roadmap Requests | Roadmap Priority | 30-Day Parser Commit | 14-Day Bespoke Grammar Delivery | 5-Day Bespoke Parser Sprint |
| **Financial SLA Remedy** | — | — | — | Included (5%–15% Credits) | Included (10%–30% Credits) | Custom MSA Penalties |

---

## 3. Incident Severity Classification & Response SLA Matrix

Incoming incident tickets are categorized by operational severity. Response times represent the maximum guaranteed duration between ticket submission and active hands-on triage by a certified `<dcouplr/>` Site Reliability Engineer:

### 3.1 Severity Classifications

- **Severity 0 (P0) — Catastrophic Disaster / Cluster Failure (Tier 5 Exclusive):**
  - *Criteria:* Total collapse of observability or migration orchestrator across production cluster; unrecoverable split-brain in Raft consensus; catastrophic data corruption risk.
  - *Mitigation Target:* **< 4 Hours**
  - *Status Update Cadence:* Every 30 minutes on active War-Room bridge.

- **Severity 1 (P1) — Critical Outage / System Inoperable:**
  - *Criteria:* Primary `<dcouplr/>` in-VPC daemon halted; telemetry or alerting pipeline completely stalled; production migration wave blocked during cutover window.
  - *Mitigation Target:* **< 8 Hours** (Tiers 3–5)
  - *Status Update Cadence:* Every 60 minutes via ticket/channel until mitigation.

- **Severity 2 (P2) — Major Degradation / Impaired Core Feature:**
  - *Criteria:* High AST transpilation error rates on specific monitor formats; replication lag exceeding 15 minutes; partial dashboard failure with CLI intact. Workaround available.
  - *Mitigation Target:* **< 24 Hours**
  - *Status Update Cadence:* Every 4 hours during business hours.

- **Severity 3 (P3) — Minor Defect / Non-Blocking Bug:**
  - *Criteria:* Cosmetic anomalies in UI canvas, non-blocking fallback comment warnings, non-critical telemetry stream latency.
  - *Mitigation Target:* Next scheduled patch release / sprint cycle.
  - *Status Update Cadence:* Upon status change or release deployment.

- **Severity 4 (P4) — General Inquiry / Guidance / Feature Request:**
  - *Criteria:* AST rule configuration consultation, syntax questions, capacity planning, feature suggestions.
  - *Mitigation Target:* Informational resolution.
  - *Status Update Cadence:* Asynchronous follow-up.

### 3.2 Response SLA Commitments by Tier

| Severity Level | Tier 5 (Enterprise) | Tier 4 (Cluster Large) | Tier 3 (Cluster Medium) | Tier 2 (Cluster Small) | Tier 1 (Developer Pro) | Tier 0 (Community) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P0 Disaster** | **15 Minutes** (24/7) | — | — | — | — | — |
| **P1 Critical** | **15 Minutes** (24/7) | **1 Hour** (24/7) | **2 Hours** (24/7) | **4 Hours** (12/5) | 24 Hours (Bus. Days) | Best Effort |
| **P2 Major** | **1 Hour** | **2 Hours** | **4 Hours** | **8 Hours** | 48 Hours | Best Effort |
| **P3 Normal** | **4 Hours** | **8 Hours** | **12 Hours** | **24 Hours** | 72 Hours | Community Triage |
| **P4 Inquiry** | **8 Hours** | **16 Hours** | **24 Hours** | **48 Hours** | 5 Business Days | Discussions |

---

### 3.3 Strict Governance Demarcation: Commercial Vendor Support SLA vs. In-Perimeter Metric Threshold Policies

> [!IMPORTANT]
> **CRITICAL ARCHITECTURAL NOTE FOR CUSTOMER OPERATING ENGINEERS:**
> Operating engineers must **never conflate** how they configure their internal in-perimeter **Severity Policies (P1–P4)** and **Sampling Evaluation Windows (1m–30m)** with their contractual **Varinull `<dcouplr/>` Commercial Vendor Support SLA**.
>
> These are two completely distinct operational domains:

| Architectural Dimension | Plane 1: In-Perimeter Metric Telemetry & Alert Policy | Plane 2: `<dcouplr/>` Commercial Vendor Support SLA |
| :--- | :--- | :--- |
| **Governing Entity** | Customer Internal SRE & Infrastructure Operations Team | Varinull Commercial Technical Support & Engineering Board |
| **Purpose** | Monitors customer-owned VPCs, servers, databases, and apps | Guarantees vendor response time for `<dcouplr/>` software issues |
| **Configuration Interface** | `<dcouplr/>` Configuration Console (`http://localhost:8000/configuration`) | Commercial Master Services Agreement (MSA) & Licensing Contract |
| **Severity Meaning** | Internal operational impact (e.g. CPU > 90%, DB locks > 100) | Contractual software defect severity (e.g. Raft split-brain, engine halt) |
| **Sampling Evaluation Window** | Rolling circular ring buffer duration ($\Delta t \in \{1\text{m}, 3\text{m}, 5\text{m}, 10\text{m}, 15\text{m}, 30\text{m}\}$) for transient spike rejection | Not Applicable; vendor SLA is measured in elapsed minutes from ticket intake |
| **Notification Routing** | Dispatched internally to customer ticketing queues (`sre-tier1`, `dba-team`), GSM pagers, Slack, ServiceNow | Ticket intake via priority email desk, shared Slack grid, or 24/7 emergency hotline |
| **Vendor Paging Effect** | **Zero vendor involvement.** Telemetry remains 100% in-perimeter (Zero WAN Egress). | Paging engages certified Varinull Tier 3/4 on-call engineers onto a video war-room |
| **Target SLA (MTTA)** | Internal SRE target acknowledgment (e.g., MTTA $\le 5$m for P1, $\le 15$m for P2) | Contractual vendor first response SLA (15m for Tier 5, 1h for Tier 4, 2h for Tier 3) |

#### Common Misconceptions Clarified:
1. **"Does setting an internal metric alert to P1 with a 1-minute window page `<dcouplr/>` Support?"**  
   **No.** Setting an internal database or host metric to P1 only pages *your own internal engineering on-call rotation*. It does not submit an incident ticket to Varinull or breach zero-egress isolation.
2. **"Does our `<dcouplr/>` Commercial Vendor Support SLA determine how long our sliding sampling window should be?"**  
   **No.** Sampling windows are mathematical damping parameters designed to reject transient noise. A customer on a Tier 5 (15-minute response SLA) can configure a 1-minute or 30-minute metric evaluation window based purely on workload characteristics.
3. **"When is the `<dcouplr/>` Commercial Vendor Support SLA invoked?"**  
   The commercial vendor SLA is invoked when the `<dcouplr/>` engine software itself experiences a fault (e.g. unhandled AST translation exception, Raft consensus partition, memory leak) and the customer submits an issue through their designated commercial support channel.

---

*Copyright &copy; 2026 Varinull Corporation. All rights reserved.*  
*For questions regarding commercial support contracts or bespoke enterprise SLAs, contact [procurement@dcouplr.com](mailto:procurement@dcouplr.com).*
