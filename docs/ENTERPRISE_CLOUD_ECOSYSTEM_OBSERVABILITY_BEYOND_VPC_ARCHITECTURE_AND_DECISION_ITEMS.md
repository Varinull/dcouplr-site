# <span class="dcouplr-wordmark"><span class="dcouplr-bracket">&lt;</span><span class="dcouplr-text">dcouplr</span><span class="dcouplr-bracket">/&gt;</span></span> Beyond the VPC: Enterprise Cloud Ecosystem Observability Architecture, Gap Analysis &amp; Strategic Decision Register

| Metadata Property | Specification Detail |
| :--- | :--- |
| **Document ID** | `VA-SPEC-BEYOND-VPC-OBSERVABILITY-001` |
| **Document Classification** | Enterprise Architecture Specification, Gap Assessment &amp; Decision Register |
| **Engine Target** | <span class="dcouplr-wordmark"><span class="dcouplr-bracket">&lt;</span><span class="dcouplr-text">dcouplr</span><span class="dcouplr-bracket">/&gt;</span></span> Full-Stack Suite (Operational Observability Backbone) |
| **Security Invariant** | 100% In-VPC / Zero WAN Data Egress Guarantee ($E_{\text{WAN}} \equiv 0$) |
| **Status** | Architecture &amp; Strategic Decision Register (Pre-Implementation Review) |
| **Authors** | Principal Cloud Architect, Systems Engineering &amp; SRE Platform Core |

---

## Executive Summary & Problem Formulation

A common architectural misconception in early cloud tooling is equating **VPC Monitoring** with **Full-Stack Observability**. 

While a Virtual Private Cloud (VPC) provides isolation, flow logging, routing tables, and security perimeter enforcement, modern enterprise applications rarely reside entirely within raw compute instances running inside private subnets. Instead, production architectures depend heavily on **abstracted, managed hyperscaler platforms and SaaS integrations**:
* **Managed PaaS Databases** (AWS Aurora, GCP Cloud SQL, Snowflake, BigQuery)
* **Serverless Compute** (AWS Lambda, GCP Cloud Run, Azure Functions, AWS Fargate)
* **Cloud Object Stores** (AWS S3, GCP Cloud Storage, Azure Blob Storage)
* **Managed Messaging & Event Busses** (AWS SQS, AWS SNS, GCP Pub/Sub, Azure Event Hubs)
* **Hyperscaler Identity & Control Plane APIs** (AWS IAM, AWS KMS, CloudTrail, GCP Audit Logs)
* **External Business SaaS** (Salesforce, Stripe, Workday, Auth0)

Because these platforms abstract away the underlying Linux OS kernel and virtual machine hypervisors, **Layer 2 / Layer 3 kernel interception (eBPF socket tracing, raw packet ring buffers, and iptables hooks) cannot attach directly to them**. 

If <span class="dcouplr-wordmark"><span class="dcouplr-bracket">&lt;</span><span class="dcouplr-text">dcouplr</span><span class="dcouplr-bracket">/&gt;</span></span> only monitors the VPC data plane, an SQS queue backlog, a Cloud SQL connection exhaustion, an S3 throttling burst, or a Lambda cold start spike remains completely invisible.

This document performs an exhaustive gap analysis of where <span class="dcouplr-wordmark"><span class="dcouplr-bracket">&lt;</span><span class="dcouplr-text">dcouplr</span><span class="dcouplr-bracket">/&gt;</span></span> stands today, identifies all out-of-VPC blind spots, details the **Three-Adapter Hybrid Collector Architecture** to bridge them without violating the **Zero WAN Egress Invariant**, and establishes a formal **Strategic Decision Register (ADRs)** before code implementation.

---

## 1. Where We Are Now: Current As-Is State

Currently, <span class="dcouplr-wordmark"><span class="dcouplr-bracket">&lt;</span><span class="dcouplr-text">dcouplr</span><span class="dcouplr-bracket">/&gt;</span></span> is architected as an **In-Perimeter, Host-Centric Observability & Modernization Platform** deployed inside customer VPCs.

```
+----------------------------------------------------------------------------------------------------+
|                                    CURRENT ARCHITECTURE (AS-IS)                                    |
|                                                                                                    |
|  [ Bare Metal DC1 ]         [ Cloud VPC VMs (AWS/GCP/Azure) ]         [ In-VPC Kubernetes Nodes ]  |
|  * Linux Node Exporter      * eBPF Socket Tracing (L2/L3)             * Kubelet / cAdvisor         |
|  * IPMI v2.0 / Redfish      * In-Guest Telemetry Daemons              * In-Cluster APM Agents      |
|  * Host Hardware Sensors    * iptables DNAT Rewrite Maps              * Container Metrics          |
|            \                             |                             /                           |
|             \                            |                            /                            |
|              v                           v                           v                             |
|       +---------------------------------------------------------------------+                      |
|       |             <dcouplr/> In-VPC Telemetry Engine (Port 8000)          |                      |
|       |  * 7-Tier Invariant Matrix Collector   * Living AST Rule Transpiler |                      |
|       |  * SQLite WAL SSoT + VictoriaLogs      * Zero WAN Egress Guard      |                      |
|       +---------------------------------------------------------------------+                      |
+----------------------------------------------------------------------------------------------------+
```

### Strengths of the Current Foundation
1. **7-Tier Full-Stack Invariant Matrix**:
   Covers Physical DC, Networking, Cloud & VPC, Virtualization/K8s, Middleware/DBs, APM/Runtime, and Logs/SIEM across owned compute nodes.
2. **Deep Kernel Telemetry**:
   Sub-millisecond socket-level eBPF tracing captures TCP handshake times, retransmissions, jitter, and kernel-level DNAT packet rewrites without application code changes.
3. **Strict Zero WAN Egress ($0.00)**:
   All telemetry is stored and analyzed inside customer-controlled infrastructure, eliminating the millions of dollars in SaaS observability data transfer fees charged by Datadog, New Relic, or Dynatrace.
4. **Living AST Multi-Vendor Transpiler**:
   Translates legacy proprietary monitors (Datadog JSON, Dynatrace OneAgent, New Relic NRQL, Splunk searches) into open-standard PromQL, Grafana YAML, and Loki streams.

### The Structural Limitation
The current engine fundamentally assumes **host access**:
* It relies on installing an in-guest agent, mounting `/proc` and `/sys`, attaching eBPF sensors to host Linux tracepoints (`sock:inet_sock_set_state`), or reading raw hardware registers over IPMI.
* When a database is AWS Aurora Serverless or GCP Cloud SQL, or when an application executes on AWS Lambda or GCP Cloud Run, **there is no host OS, no root shell, and no network interface accessible for eBPF attachment**.

---

## 2. Exhaustive Gap Analysis: What is Missing

The following matrix identifies the six major cloud ecosystem categories outside pure L2/L3 VPC monitoring, why host interception fails, the operational blind spots, and the resulting business risk:

| Cloud Service Category | Concrete Hyperscaler Examples | Why L2/L3 Host Interception Misses It | Operational Blind Spot & Missing Telemetry | Enterprise Risk if Unmonitored |
| :--- | :--- | :--- | :--- | :--- |
| **A. Serverless Compute & Managed Runtimes** | AWS Lambda, GCP Cloud Run, Azure Functions, AWS Fargate | Workloads execute inside ephemeral micro-VMs (Firecracker / gVisor) with no host root access or persistent kernel to attach eBPF probes. | Cold start durations, memory exhaustion warnings, concurrent execution throttling, runtime panic stack traces, initialization overhead. | Silent transaction dropouts; inability to troubleshoot microservice API latencies originating in serverless layers. |
| **B. Cloud-Native Object Storage** | AWS S3, GCP Cloud Storage (GCS), Azure Blob Storage | Storage buckets are multi-tenant HTTPS services operating outside VPC compute interfaces; internal bucket performance is abstracted. | S3 403 Forbidden spikes (IAM drift), 503 SlowDown throttling, multi-part upload incomplete backlogs, cross-region replication lag. | Data pipeline failures, silent backup corruption, unexpected API request rate billing spikes. |
| **C. Serverless Message Queues & Event Busses** | AWS SQS, AWS SNS, AWS Kinesis, GCP Pub/Sub, Azure Event Hubs | Traffic transits hyperscaler managed message brokers rather than peer-to-peer TCP streams between VPC instances. | Queue depth backlog, ApproximateAgeOfOldestMessage, Dead Letter Queue (DLQ) ingestion rates, consumer group lag, payload drop rate. | Asynchronous order/payment processing backlogs build up without triggering alerts until customer impact occurs. |
| **D. Managed Cloud Databases (PaaS without Host Access)** | AWS Aurora, GCP Cloud SQL, Azure SQL, Snowflake, BigQuery | Cloud providers manage the underlying database VM; users only receive an endpoint IP/FQDN without OS-level shell or hypervisor metrics. | Cache hit ratios, lock wait timeouts, connection pool exhaustion, slow query execution times (`pg_stat_statements`), table bloat. | Inability to distinguish network latency from database query contention; blind failover events. |
| **E. Hyperscaler Identity, KMS & Control Plane** | AWS IAM, AWS KMS, AWS CloudTrail, GCP Cloud Audit Logs, Azure Key Vault | API calls occur on the hyperscaler control plane via public/private REST endpoints, not on the VPC private data plane. | KMS cryptographic rate-limiting (ThrottlingExceptions), unauthorized IAM privilege escalation, cross-account access attempts. | Security audit failure; cryptographic bottlenecks stalling encrypted database operations. |
| **F. External Multi-Tenant SaaS Subscriptions** | Salesforce, Workday, Stripe, Auth0, Twilio | Third-party multi-tenant SaaS environments with zero customer infrastructure or VPC peering. | SaaS API rate limit degradation, webhook delivery dropouts, outbound client TLS negotiation latency, third-party 5xx error rates. | Business process disruption (e.g. checkout billing failure via Stripe) misdiagnosed as internal application bugs. |

---

## 3. Target Architecture: The Three-Adapter Hybrid Ingestion Framework

To make <span class="dcouplr-wordmark"><span class="dcouplr-bracket">&lt;</span><span class="dcouplr-text">dcouplr</span><span class="dcouplr-bracket">/&gt;</span></span> a true, all-inclusive enterprise observability powerhouse while **strictly preserving the Zero WAN Egress Guarantee**, we introduce the **Three-Adapter Hybrid Collector Architecture**:

```
+-----------------------------------------------------------------------------------------------------------------------+
|                                    <dcouplr/> FULL-STACK ENTERPRISE OBSERVABILITY SUITE                               |
|                                       (Unified In-VPC Observability Platform)                                         |
+-----------------------------------------------------------------------------------------------------------------------+
                                                           ^
                                                           | Normalized In-VPC Event Stream & Unified IR
        +--------------------------------------------------+--------------------------------------------------+
        |                                                  |                                                  |
+--------------------------------+       +------------------------------------+       +--------------------------------+
|           ADAPTER 1:           |       |             ADAPTER 2:             |       |           ADAPTER 3:           |
|      KERNEL & eBPF ENGINE      |       |      VPC BOUNDARY PROXY SENSOR     |       |    ZERO-EGRESS CLOUD POLLER    |
| (Host-Level Compute & Network) |       |  (PaaS DBs, Storage & SaaS Egress) |       |  (Control Plane, Queues & Logs)|
+--------------------------------+       +------------------------------------+       +--------------------------------+
        ^                                                  ^                                                  ^
        | Socket & Ring Buffer                             | Flow Taps & Proxy Metrics                        | Private API / SDK Ingestion
        |                                                  |                                                  |
+--------------------------------+       +------------------------------------+       +--------------------------------+
| • On-Prem Bare Metal (DC1)     |       | • AWS PrivateLink / VPC Endpoints  |       | • AWS CloudWatch Metric Stream |
| • Cloud Virtual Machines       |       | • GCP Private Google Access (PGA)  |       | • GCP Cloud Monitoring API     |
| • Kubernetes Kubelet & Pods    |       | • In-VPC Outbound Egress Gateways  |       | • AWS CloudTrail / GCP Audit   |
| • In-Guest Database Engines    |       | • Local Synthetic HTTP Probes      |       | • SQS / PubSub Queue Telemetry |
+--------------------------------+       +------------------------------------+       +--------------------------------+
```

---

### Adapter 1: Kernel & eBPF Engine (Existing Core)
* **Scope**: Virtual Machines, Bare Metal Nodes, In-VPC Kubernetes Worker Nodes, and Self-Hosted Middleware.
* **Mechanism**: Direct kernel probes (`kprobes`, `tracepoints`, `XDP`), Linux Node Exporter, IPMI/Redfish, and cAdvisor.
* **Telemetry Collected**: Host CPU/Memory/Disk I/O, raw socket connection lifecycles, TCP retransmissions, in-kernel DNAT IP rewrites.

---

### Adapter 2: Boundary Proxy & VPC Endpoint Sensor (PaaS & Egress Interception)
* **Scope**: Managed PaaS Databases (Aurora, Cloud SQL), Cloud Object Storage (S3, GCS), and Outbound SaaS APIs (Stripe, Salesforce).
* **Mechanism**:
  1. **VPC Endpoint ENI Taps**:
     Traffic to S3, Aurora, or Cloud SQL routes through AWS VPC Endpoints (PrivateLink) or GCP Private Google Access. We place lightweight eBPF taps on the endpoint interfaces inside our subnets, capturing DNS resolution time, TCP handshake latency, TLS handshake durations, and packet transfer volume.
  2. **In-VPC Egress Proxy Gateways**:
     All outbound calls to external SaaS APIs (Stripe, Salesforce, Auth0) transit an In-VPC Egress Proxy. The proxy records HTTP status codes, API response latency, and SSL certificate expiration, while capturing socket events at the boundary.
  3. **In-VPC Synthetic Health Probes**:
     Lightweight synthetic probes running within private subnets execute periodic HTTP/gRPC transactions against managed cloud endpoints to continuously record availability and round-trip latency.

---

### Adapter 3: Zero-Egress Cloud API Ingestion Poller (Control Plane & Serverless)
* **Scope**: Serverless Compute (Lambda, Cloud Run), Serverless Queues (SQS, SNS, Pub/Sub), Cloud Security & Audit (CloudTrail, IAM, KMS).
* **Mechanism**:
  1. **Private CloudWatch / Cloud Monitoring Ingestion**:
     An In-VPC background daemon queries hyperscaler monitoring APIs over **VPC Interface Endpoints** (e.g. `monitoring.us-east-1.p.amazonaws.com` or GCP Private Google Access). Because queries transit private endpoints, **data never traverses the public internet, maintaining $0.00 WAN egress**.
  2. **Audit Log & Eventarc Streamers**:
     CloudTrail and GCP Audit Log streams are routed to an In-VPC S3 bucket or local Pub/Sub topic, where the <span class="dcouplr-wordmark"><span class="dcouplr-bracket">&lt;</span><span class="dcouplr-text">dcouplr</span><span class="dcouplr-bracket">/&gt;</span></span> daemon parses security and governance events into the local VictoriaLogs store.
  3. **OTel Serverless Extension Layer**:
     For AWS Lambda and GCP Cloud Run, a lightweight OpenTelemetry extension layer is added to the container/runtime image. When invoked, it streams execution traces and cold-start metrics over a local **VPC Connector** directly to the <span class="dcouplr-wordmark"><span class="dcouplr-bracket">&lt;</span><span class="dcouplr-text">dcouplr</span><span class="dcouplr-bracket">/&gt;</span></span> In-VPC collector.

---

## 4. Coverage Parity: As-Is vs. Target Multi-Adapter State

```
+-----------------------------------+---------------+-------------------------+---------------------------------+
| System / Technology Layer         | Current As-Is | Target With 3 Adapters  | Primary Ingestion Mechanism     |
+-----------------------------------+---------------+-------------------------+---------------------------------+
| Bare Metal & Hardware (DC1)       | 100% COVERED  | 100% COVERED            | Adapter 1 (IPMI / Node Exporter)|
| Virtual Machines (EC2 / GCE / Az) | 100% COVERED  | 100% COVERED            | Adapter 1 (eBPF Kernel Probes)  |
| Kubernetes Clusters & Pods        | 100% COVERED  | 100% COVERED            | Adapter 1 (Kubelet / cAdvisor)  |
| Self-Hosted Databases (Postgres)  | 100% COVERED  | 100% COVERED            | Adapter 1 (pg_stat / In-Guest)  |
| Managed PaaS DBs (Cloud SQL / RDS)| PARTIAL (20%) | 100% COVERED            | Adapter 2 (PrivateLink ENI Tap) |
| Cloud Object Storage (S3 / GCS)   | BLIND (0%)    | 100% COVERED            | Adapter 2 (Endpoint Proxy Tap)  |
| Serverless Queues (SQS / PubSub)  | BLIND (0%)    | 100% COVERED            | Adapter 3 (Private API Poller)  |
| Serverless Compute (Lambda / Run) | BLIND (0%)    | 100% COVERED            | Adapter 3 (OTel VPC Connector)  |
| Hyperscaler Control Plane (IAM)   | BLIND (0%)    | 100% COVERED            | Adapter 3 (CloudTrail Stream)   |
| External SaaS APIs (Stripe / SFDC)| BLIND (0%)    | 100% COVERED            | Adapter 2 (Egress Gateway Tap)  |
+-----------------------------------+---------------+-------------------------+---------------------------------+
```

---

## 5. Strategic Decision Register & Architectural Decision Records (ADRs)

> [!IMPORTANT]
> The following Architectural Decision Records (ADRs) document the key engineering and product decisions required before initiating implementation. **No production code changes are to be executed until leadership aligns on these decisions.**

---

### ADR-001: In-VPC Cloud API Poller vs. Event-Driven Push for Hyperscaler Metrics
* **Context**: To capture SQS queue depth, CloudWatch alarms, and KMS throttling, <span class="dcouplr-wordmark"><span class="dcouplr-bracket">&lt;</span><span class="dcouplr-text">dcouplr</span><span class="dcouplr-bracket">/&gt;</span></span> needs hyperscaler metric streams without generating WAN egress.
* **Option A (Polling via VPC Endpoints)**:
  An In-VPC worker polls `monitoring.<region>.amazonaws.com` via PrivateLink every 60 seconds.
  * *Pros*: Simple to implement; zero extra infrastructure required.
  * *Cons*: API rate limit costs; slight metric latency (up to 60s).
* **Option B (Event-Driven CloudWatch Metric Streams / Eventarc)**:
  CloudWatch Metric Streams push directly to an In-VPC Firehose / S3 bucket or GCP Pub/Sub.
  * *Pros*: Sub-second real-time streaming; eliminates API polling quotas.
  * *Cons*: Requires customer IAM and Firehose resource provisioning via OpenTofu.
* **Decision Status**: **OPEN FOR REVIEW**  
* **Recommendation**: Implement **Option A** as standard default for lightweight deployments; provide **Option B** via OpenTofu turnkey bundle for enterprise high-throughput environments.

---

### ADR-002: Serverless Telemetry Ingestion Paradigm (OTel Lambda Layer vs. Log Scraping)
* **Context**: Serverless functions (AWS Lambda, GCP Cloud Run) lack persistent host kernels for eBPF.
* **Option A (OpenTelemetry Layer / Extension with VPC Connector)**:
  Provide a pre-compiled `<dcouplr/>` OTel Lambda Layer that instruments the function runtime and sends traces/metrics over VPC Connector to the In-VPC collector.
  * *Pros*: Full distributed tracing, function cold-start breakdowns, code-level execution flamegraphs.
  * *Cons*: Adds ~15ms initialization overhead on cold starts; requires updating function deployment templates.
* **Option B (Asynchronous CloudWatch / Cloud Logging Ingestion)**:
  Do not touch function code; parse CloudWatch `REPORT` log lines (`Duration`, `Billed Duration`, `Memory Size`, `Max Memory Used`, `Init Duration`).
  * *Pros*: Zero application modification; zero cold-start performance penalty.
  * *Cons*: Metrics only; no code-level distributed traces or flamegraphs.
* **Decision Status**: **OPEN FOR REVIEW**  
* **Recommendation**: Adopt **Hybrid Mode**: Default to Option B (zero-touch log parsing), with Option A available for applications requiring deep distributed APM tracing.

---

### ADR-003: Managed PaaS Database Observability (Endpoint Boundary Tap vs. Database Wire Polling)
* **Context**: Managed databases (AWS Aurora, GCP Cloud SQL, Azure SQL) do not allow host agent installation.
* **Option A (VPC Endpoint / ENI Packet Capture)**:
  Attach eBPF sensor to the VPC Endpoint network interface to monitor network latency, TCP connection resets, and throughput.
  * *Pros*: Zero database credentials required; completely transparent to the database engine.
  * *Cons*: Cannot see SQL query text, slow query execution plans, or table lock waits.
* **Option B (In-VPC Synthetic Poller with Read-Only DB Role)**:
  Deploy an In-VPC micro-daemon with a read-only role to query `pg_stat_statements` or `information_schema`.
  * *Pros*: Full SQL visibility, lock contention alerts, buffer cache hit ratios.
  * *Cons*: Requires customer to provision a database monitoring credential.
* **Decision Status**: **OPEN FOR REVIEW**  
* **Recommendation**: **Combine both**: Adapter 2 performs ENI boundary metrics by default; if database credentials are provided, activate in-depth SQL statement analysis.

---

### ADR-004: External SaaS Boundary Monitoring (In-VPC Egress Gateway vs. Webhook Receiver)
* **Context**: External SaaS platforms (Stripe, Salesforce, Workday) live outside the customer's cloud provider.
* **Option A (In-VPC Egress Proxy with Kernel Tap)**:
  Route outbound SaaS API requests through an In-VPC Envoy/Nginx proxy with eBPF metrics.
  * *Pros*: Captures actual client request failures, DNS resolution times, TLS handshake durations.
  * *Cons*: Requires application networking configuration to direct egress traffic through the proxy.
* **Option B (Local Webhook Listener Endpoint)**:
  Provide an in-perimeter webhook receiver endpoint to ingest SaaS event callbacks.
  * *Pros*: Real-time alerts when external SaaS issues operational incidents or rate-limit warnings.
  * *Cons*: Only captures what the SaaS vendor voluntarily pushes via webhooks.
* **Decision Status**: **OPEN FOR REVIEW**  
* **Recommendation**: Provide both under Adapter 2 as complementary tools.

---

### ADR-005: Commercial Packaging & Licensing Model for Abstracted Cloud Services
* **Context**: <span class="dcouplr-wordmark"><span class="dcouplr-bracket">&lt;</span><span class="dcouplr-text">dcouplr</span><span class="dcouplr-bracket">/&gt;</span></span> currently licenses by **Monitored Compute Nodes** (e.g. 75 Nodes). Non-VPC services (S3 buckets, SQS queues, Lambda functions, Cloud SQL instances) are not discrete "nodes".
* **Option A (Node Equivalency Factor)**:
  Map abstracted services to nodes using a standardized conversion formula (e.g., 1 Cloud SQL instance = 1 Node; 5 SQS Queues = 1 Node; 10 Lambda Functions = 1 Node).
* **Option B (Dedicated "Cloud Asset" or "Service Unit" Add-On)**:
  Keep Node pricing strict for compute, and introduce a lightweight "Cloud Ecosystem Pack" for serverless, PaaS, and SaaS.
* **Option C (Unified In-VPC All-Inclusive Licensing)**:
  Include non-VPC cloud services under the existing tier based on total throughput (e.g. up to 100K metrics/sec within the VPC without extra charge).
* **Decision Status**: **OPEN FOR EXECUTIVE REVIEW**  
* **Recommendation**: Option A or Option C provides the highest customer transparency and avoids SaaS pricing complexity.

---

## 6. Engineering Action Items & Research Next Steps

The following research and discovery tasks are logged as pre-requisites before any implementation work begins:

```
[ ] TASK-OBS-01: Benchmark VPC Interface Endpoint API latency & cost impact for AWS CloudWatch Metric Streams.
[ ] TASK-OBS-02: Prototype eBPF socket listener on AWS PrivateLink ENIs to verify packet capture accuracy for Aurora/S3.
[ ] TASK-OBS-03: Evaluate cold-start overhead of minimal OpenTelemetry Lambda Extension on Python/Node/Go runtimes.
[ ] TASK-OBS-04: Formulate OpenTofu templates declaring required PrivateLink / Private Google Access resources with zero egress.
[ ] TASK-OBS-05: Review licensing model with commercial strategy leadership for non-compute cloud services.
```

---

## Conclusion & Architectural Recommendation

Expanding <span class="dcouplr-wordmark"><span class="dcouplr-bracket">&lt;</span><span class="dcouplr-text">dcouplr</span><span class="dcouplr-bracket">/&gt;</span></span> from **VPC-Level Network & Compute Monitoring** to a **Universal Enterprise Cloud Observability Platform** is technically viable, architecturally sound, and essential for complete replacement of legacy SaaS tools like Datadog, Dynatrace, and New Relic.

By adopting the **Three-Adapter Hybrid Collector Architecture**, <span class="dcouplr-wordmark"><span class="dcouplr-bracket">&lt;</span><span class="dcouplr-text">dcouplr</span><span class="dcouplr-bracket">/&gt;</span></span> can seamlessly ingest Serverless, PaaS, Object Storage, and Control Plane telemetry over **private hyperscaler endpoints**, providing single-pane-of-glass correlation while **uncompromisingly preserving its core value proposition: 100% In-VPC execution and $0.00 WAN data egress**.
