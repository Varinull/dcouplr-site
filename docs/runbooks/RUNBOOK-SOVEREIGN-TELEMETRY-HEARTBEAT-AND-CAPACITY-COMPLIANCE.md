# <dcouplr/> Operational Runbook: Sovereign Telemetry Heartbeat & Capacity Compliance
**Document Classification:** Cleared Customer Public • Operational Runbook  
**Runbook Code:** `RUN-METERING-001 Verified`  
**Governing Standard:** ITIL Continual Service Improvement & Capacity Management  
**Applicability:** All `<dcouplr/>` In-Perimeter Clusters (AWS, Azure, GCP, On-Premises, Air-Gapped)  
**Target Roles:** Platform Engineers, Site Reliability Engineers (SRE), Information Security Auditors  
**Version:** 4.2.0-PROD • Customer Deployment Ready

---

## Executive Overview: Sovereignty, Privacy & Metering

`<dcouplr/>` is built on the ironclad architectural foundation of **Zero-WAN Egress ($0.00)**. When deployed inside your Virtual Private Cloud (VPC), all high-volume operational telemetry—including Prometheus metrics, OpenTelemetry distributed traces, and high-throughput application logs—is ingested, indexed, and stored entirely within your local boundary using an embedded, zero-dependency SQLite 3 WAL database engine.

To maintain supportability, security patch verification, and license capacity reconciliation, `<dcouplr/>` utilizes a lightweight, outbound-only **Sovereign Telemetry Heartbeat** dispatched via your deployed Outside-VPC Hubs (e.g., `/NOCDesk`, `/SREDesk`, `/wallboard`, or `/kiosk`).

This document provides transparent, verifiable details on what this heartbeat transmits, how it protects customer privacy, and how capacity autoscaling surges are managed without service disruption.

---

## 1. The Zero-Egress Privacy Guarantee

`<dcouplr/>` guarantees that customer operational data **never leaves your VPC**.

### 1.1 Data Boundary Matrix

| Telemetry Type | Location Stored | Transmitted Externally? | Audit Method |
| :--- | :--- | :---: | :--- |
| **Raw Metrics & Histograms** | `data/vpc_telemetry.db` (Local) | **NO ($0.00 Egress)** | Inspect network egress tables; zero WAN packets. |
| **Distributed Spans & Traces**| `data/vpc_telemetry.db` (Local) | **NO ($0.00 Egress)** | Inspect network egress tables; zero WAN packets. |
| **Raw Application Logs & PII**| `data/vpc_telemetry.db` (Local) | **NO ($0.00 Egress)** | Inspect network egress tables; zero WAN packets. |
| **Cluster Topology & Node IPs** | `data/vpc_telemetry.db` (Local) | **NO ($0.00 Egress)** | IP addresses scrubbed prior to any beaconing. |
| **Capacity & Health Heartbeat**| In-Perimeter Hub Gateway | **YES (1.2 KB Envelope)** | Inspected via Cloudflare Zero Trust Audit Logs. |

### 1.2 The Sovereign Heartbeat Envelope
The heartbeat dispatched by your Outside-VPC Hub is a standard 1.2 KB JSON payload containing exclusively capacity and platform health metadata:

```json
{
  "heartbeat_id": "hb_acme_live_01",
  "customer_id": "cust_acme_financial_01",
  "license_id": "lic_acme_fullstack_2026",
  "timestamp": 1793599274.42,
  "licensed_nodes": 100,
  "active_nodes": 142,
  "overage_nodes": 42,
  "quota_utilization_pct": 142.0,
  "software_version": "v4.2.0-LTS",
  "engine_health_status": "NOMINAL",
  "outside_hub_transport": "CLOUDFLARE_TUNNEL",
  "signature_verified": 1,
  "metering_status": "OVERAGE_PENDING_TRUEUP"
}
```

> [!NOTE]
> Every heartbeat is cryptographically signed using an in-perimeter private HMAC key. It contains **no IP addresses, no customer hostnames, no database credentials, and no payload data**.

---

## 2. Non-Destructive Capacity Surges & Autoscaling

Enterprise applications experience seasonal, campaign, or incident-driven autoscaling surges (e.g., Kubernetes Horizontal Pod Autoscaler spinning up 40 additional microservice instances during high load).

### 2.1 Non-Destructive Guarantee
When active nodes exceed the contracted license quota (e.g., 142 active nodes vs. 100 contracted nodes):
1. **Zero Monitoring Interruption:** Telemetry ingestion, distributed tracing, alerting, and log search continue to operate at **100% capacity**. `<dcouplr/>` will never drop metrics, delay alerts, or terminate collector pods during an overage event.
2. **Local SRE Advisory:** In the in-VPC console (`/dashboard` and `/config`), the capacity badge updates to an advisory status:  
   `Medium 142/100 Nodes Active • 142% Quota`.
3. **Automated True-Up Reconciliation:** The overage is recorded in `<dcouplr/>` Corporate Central for commercial true-up reconciliation at your contracted SKU overage rate (e.g., $18.50/node/month), avoiding costly upfront over-provisioning.

---

## 3. Support Triage & Customer Support Privacy

When you engage `<dcouplr/>` Customer Support:
- **Cloud Systems Engineers (CSE):** Have access to your active node counts, cluster health status (`NOMINAL`, `DEGRADED`), software version patch level, and customer-submitted support tickets.
- **Strict Privacy Isolation:** Support engineers have zero access to your commercial contracts, banking details, or invoice payment tokens.
- **Zero Remote Access Required:** Support engineers can evaluate cluster sizing and version currency without requesting SSH bastion access or temporary IAM credentials into your cloud account.

---

## 4. Air-Gapped Perimeters (Offline True-Up Export)

For organizations operating in disconnected or air-gapped environments where outbound Cloudflare Tunnels are disabled by security policy:

### Step 1: Export Sovereign Capacity Audit Bundle
Run the following authenticated command within your perimeter:
```bash
curl -X POST http://localhost:8000/v1/system/license/audit-bundle \
  -H "Authorization: Bearer <IN_VPC_ADMIN_KEY>" \
  -o sovereign_capacity_bundle.json
```

### Step 2: Verify Bundle Content
Verify that the generated bundle contains only capacity metadata and no internal operational logs:
```bash
jq . sovereign_capacity_bundle.json
```
Output:
```json
{
  "export_timestamp": 1793599800.0,
  "cluster_id": "cls_prod_us_east_1",
  "contracted_quota": 100,
  "peak_active_nodes_30d": 142,
  "average_active_nodes_30d": 108,
  "engine_software_version": "v4.2.0-LTS",
  "sha256_fingerprint": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

### Step 3: Secure Delivery to Account Team
Deliver the audit file via your organization's approved air-gap file transfer procedure during annual license renewal.

---

## 5. Security & Verification Checklist for SREs

| Checkpoint | Verification Command / URL | Expected Result |
| :--- | :--- | :--- |
| **Verify Local In-VPC Database** | `http://localhost:8000/config` | Census displays active nodes backed by `data/vpc_telemetry.db`. |
| **Verify Zero-WAN Egress** | Inspect egress gateway firewall rules | Zero outbound traffic to public observability endpoints. |
| **Inspect Active License Quota** | `GET /v1/system/license` | Returns current SKU tier, max licensed nodes, and active census. |
| **Verify Outside-VPC Hub Status** | `cloudflared tunnel info` | Hub tunnel active; transmits 1.2 KB heartbeats periodically. |

---
*Maintained by `<dcouplr/>` Cloud Engineering & Customer Trust • Approved for Production Operations.*
