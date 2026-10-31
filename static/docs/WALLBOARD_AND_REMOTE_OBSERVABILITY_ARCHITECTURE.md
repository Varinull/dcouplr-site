# Enterprise Architecture Specification: 24x7 Remote Wallboard & Zero-Cost Outside-VPC Observability

**Document Identifier:** `VA-SPEC-WALLBOARD-OBS-001`  
**Classification:** Enterprise Standard Operating Procedure & Architecture Blueprint  
**Target Audience:** Chief Technology Officers, SRE Directors, Infrastructure Architects, NOC/SOC Operations Teams  
**Governing Standard:** `VA-SPEC-FINOPS-BRIDGE-001` / `D-41`  
**Core Objective:** Provide an always-on 24x7 visual wallboard display of the entire multi-cloud infrastructure outside the VPC without incurring SaaS ingestion charges or cloud WAN egress fees.  

---

## 1. Executive Summary & The Problem Statement

Organizations require a visual, real-time representation of their entire infrastructure displayed 24 hours a day, 7 days a week on office TV walls, NOC (Network Operations Center) displays, and executive dashboards.

However, traditional monitoring approaches present a severe dilemma:

1. **The Traditional SaaS Trap (Datadog, Dynatrace, New Relic):**
   - Continuously streaming telemetry from 50–500 in-VPC nodes over public NAT Gateways to a SaaS vendor generates **thousands of dollars every month** in cloud provider WAN egress taxes ($0.08–$0.12/GB) plus SaaS volumetric ingestion fees ($15–$25 per host/month).
   - Wallboard TVs frequently disconnect due to corporate SSO session timeouts (Okta/Entra ID 8-hour token expiries), requiring manual operator logins on physical TVs.
2. **The Pure In-VPC Dilemma:**
   - While keeping `<dcouplr/>` CLI and telemetry 100% in-VPC guarantees zero egress fees and strict regulatory compliance (HIPAA, PCI-DSS, FedRAMP), office TVs, home monitors, and leadership laptops cannot directly access internal RFC 1918 IPs (`http://10.100.1.50:8000/dashboard`) without active VPN clients that sleep or timeout.

This specification documents:
- **Part 1:** How the in-VPC dashboard natively covers heterogeneous VPCs across all cloud providers.
- **Part 2:** The architectural, security, and cost trade-offs between In-VPC and Online Hosted SaaS dashboards.
- **Part 3:** The industry-standard **Zero-Cost 24x7 NOC Wallboard Architecture** that projects the in-VPC dashboard outside the VPC for **less than $0.10 per month in total bandwidth**.

---

## 2. In-VPC Dashboard Multi-Cloud Coverage (`http://127.0.0.1:8000/dashboard`)

### Will this cover all VPCs regardless of provider?

**Yes, 100%.** The in-VPC dashboard is designed from the ground up as a **vendor-agnostic, multi-cloud topology mesh**. It covers AWS VPCs, GCP VPCs, Azure VNets, and On-Premises bare-metal datacenters simultaneously inside a single pane of glass.

### How It Works Under the Hood

The architecture implemented in `migration_tools/api/telemetry.py` utilizes a decentralized agent mesh:

```
                      ┌────────────────────────────────────────────────────────┐
                      │              In-VPC Telemetry Dashboard                │
                      │             http://127.0.0.1:8000/dashboard            │
                      └───────────────────────────▲────────────────────────────┘
                                                  │ (Local REST / SSE Port 8000)
┌─────────────────────────────────────────────────┴─────────────────────────────────────────────────┐
│                       <dcouplr/> Decentralized Multi-VPC Mesh                                      │
├───────────────────────┬─────────────────────────┬─────────────────────────┬───────────────────────┤
│    AWS US-East-1      │      AWS US-West-2      │     GCP US-Central1     │     On-Prem Chicago   │
│   (vpc-aws-prod-01)   │   (vpc-aws-stage-02)    │ (vpc-gcp-analytics-03)  │  (dc-onprem-core-01)  │
│      10.100.0.0/16    │      10.101.0.0/16      │      10.200.0.0/16      │     172.16.0.0/16     │
├───────────────────────┼─────────────────────────┼─────────────────────────┼───────────────────────┤
│ Agent: dcouplr-agent-01│ Agent: dcouplr-agent-02 │ Agent: dcouplr-agent-03 │ Agent: legacy-01      │
│ Role:  LEADER (Raft)  │ Role:  FOLLOWER         │ Role:  FOLLOWER         │ Role:  FOLLOWER       │
│ ALB / NLB / EC2 Pods  │ Staging App ALB         │ GKE / Cloud Interconnect│ F5 BIG-IP / BareMetal │
└───────────▲───────────┴────────────▲────────────┴────────────▲────────────┴───────────▲───────────┘
            │                        │                         │                        │
            └────────────────────────┴─────────────────────────┴────────────────────────┘
                 Internal Private Backbone (mTLS gRPC Ports 8300 / 8301)
                 • AWS Transit Gateway / Direct Connect
                 • GCP Cloud Interconnect / Cross-Cloud Interconnect
                 • Azure ExpressRoute / IPSec VPN Tunnels
                 * 0 BYTES WAN EGRESS — STRICT RFC 1918 PRIVATE PEERING *
```

1. **Decentralized In-VPC Agents:**
   A lightweight `<dcouplr/>` daemon agent runs inside each isolated network environment (EC2 instance in AWS, GCE/GKE node in GCP, VM in Azure, or bare-metal host on-prem).
2. **Private Inter-Cloud Transport (Zero Public Internet):**
   Agents communicate strictly over existing private interconnects (AWS Transit Gateway, GCP Cloud Interconnect, Azure ExpressRoute, or dedicated IPSec VPN tunnels). They synchronize Raft WAL logs and telemetry over internal ports `8300/8301` via mutual TLS (mTLS).
3. **Unified Multi-Cloud Topology Aggregation:**
   The leader agent aggregates all registered VPCs into a single in-memory graph. When accessing `http://127.0.0.1:8000/dashboard`, the frontend queries `/v1/telemetry/topology` and `/v1/telemetry/stream`. You see all heterogeneous environments side-by-side in real time:
   - **AWS:** `vpc-aws-prod-01` (ALBs, NLBs, subnets, EC2 instances)
   - **GCP:** `vpc-gcp-analytics-03` (Global Anycast VIPs, GKE node pools, BigLake)
   - **Azure:** `vnet-azure-core` (App Gateways, ExpressRoute circuits)
   - **On-Prem:** `dc-onprem-core-01` (F5 BIG-IP appliances, BGP AS65001 anycast edge)
4. **Dynamic VPC Registration:**
   New VPCs can be joined on the fly via `POST /v1/telemetry/topology/vpcs` or through the dashboard UI.
5. **Zero WAN Egress Preserved:**
   Because all telemetry data flows over internal RFC 1918 routes, **zero bytes ever exit to the public internet**, guaranteeing $0 egress fees and zero data leaks.

---

## 3. In-VPC Dashboard vs. Online Hosted SaaS Dashboard

### 3.1 Architectural Comparison Matrix

| Dimension | In-VPC Dashboard (`http://127.0.0.1:8000/dashboard`) | Online Dashboard (Hosted SaaS / Multi-Tenant) |
| :--- | :--- | :--- |
| **Data Residency** | **100% Inside Customer Perimeter** (Volatile RAM ring buffer) | **Third-Party Hosted** (External cloud database) |
| **Network Path** | Private RFC 1918 (VPC Peering, Transit Gateway, Direct Connect) | Public Internet (NAT Gateways, Internet Gateways, Public WAN) |
| **Cloud Egress Fees** | **$0.00** (Strict Zero-Egress Invariant) | **Billable Hyperscaler Egress Tax** ($0.08–$0.12 / GB) |
| **Compliance & InfoSec** | **Immediate Approval** (HIPAA, PCI-DSS, FedRAMP, SOC2 compliant) | **High Friction** (Requires vendor risk audit, SOC2 Type II, DPA) |
| **Access Method** | Corporate VPN, Tailscale, AWS SSM Session, or Bastion | Any public web browser via standard SSO (Okta, Entra ID) |
| **Resilience to WAN Outage**| **100% Operational** even if external internet drops | **Blinded** if NAT Gateway, DNS, or WAN transit has packet loss |
| **Hosting Infrastructure Cost**| **$0.00** (Runs on existing compute nodes) | **$800 – $4,500 / month** (TSDB cluster, brokers, WAF, LB) |

---

### 3.2 Pros and Cons of an Online Dashboard

#### Pros of an Online Dashboard:
- **Frictionless Executive & Remote Access:** SREs, architects, and engineering leadership can log in from any laptop or mobile device via corporate SSO (Okta, Google Workspace, Entra ID) without needing corporate VPNs, SSH tunnels, or AWS SSM sessions.
- **Centralized Multi-Organization / Multi-Client Oversight:** Ideal for Managed Service Providers (MSPs) or enterprises with completely siloed cloud organizations (e.g. 50 distinct AWS Accounts or GCP Organizations with no interconnecting Transit Gateway). All migrations report to one central portal.
- **Long-Term Multi-Year Historical Analytics:** An external cloud database (ClickHouse / TimescaleDB) can retain migration metrics, replication velocity curves, and audit trails for 1–5 years without consuming RAM or disk space inside customer VPCs.
- **Zero Customer Maintenance:** Customers don't need to monitor or patch the dashboard server daemon; high availability and backups are managed automatically.

#### Cons of an Online Dashboard:
- **Breaks `<dcouplr/>`'s Core "Zero-Egress" Guarantee:** The primary selling point of `<dcouplr/>` is that telemetry and transpilation never leave the VPC. An online dashboard forces agents inside every VPC to continuously stream packets over NAT/Internet Gateways to the SaaS endpoint.
- **Enterprise InfoSec & Legal Roadblocks:** Enterprise security teams strictly forbid streaming internal IP addresses, subnet CIDRs, routing tables, and server hostnames to a public multi-tenant SaaS. Requires extensive SOC2 Type II certification, vendor risk reviews (VRM), and Data Processing Agreements (DPA), which can delay enterprise adoption by 3 to 6 months.
- **Public Attack Surface:** Public-facing ingestion endpoints and web dashboards require 24/7 protection against DDoS attacks, credential stuffing, and zero-day vulnerabilities.
- **Vulnerability to Cloud Provider Internet Outages:** If AWS NAT Gateways or Cloudflare experience latency spikes or route drops, the migration dashboard goes blind during the most critical moment: live production cutover.

---

### 3.3 Real-World Cost Breakdown for an Online Dashboard

Running an online SaaS telemetry dashboard introduces three distinct cost buckets:

#### Bucket A: The Hyperscaler WAN Egress Tax (Paid to AWS/GCP/Azure)
Hyperscalers charge customers $0.08 to $0.12 per GB for data leaving the VPC to the internet.

$$\text{Monthly Egress Cost} = \text{Nodes} \times \text{Metric Stream Rate} \times \text{Seconds in Month} \times \text{Egress Rate/GB}$$

**Example for a mid-sized migration (50 monitored nodes):**
- 50 nodes emitting eBPF network telemetry, replication heartbeats, and disk I/O at ~200 KB/s per node:
  $$50 \times 200\text{ KB/s} = 10\text{ MB/s} = 36\text{ GB/hour} = 864\text{ GB/day} \approx \mathbf{26\text{ TB/month}}$$
- At AWS standard egress pricing ($0.09/GB):
  $$26,000\text{ GB} \times \$0.09 = \mathbf{\$2,340\text{ / month in hidden egress fees}}$$
- **With In-VPC `<dcouplr/>`:** **$0.00**.

#### Bucket B: SaaS Cloud Infrastructure Run-Rate (Hosted Platform Costs)
To host a scalable, highly available SaaS dashboard:
- Managed Time-Series Database (ClickHouse Cloud / TimescaleDB Cloud): ~$400 – $1,800/mo
- Streaming Message Ingestion (Kafka / Redpanda Serverless): ~$200 – $800/mo
- API Workers & Application Cluster (Kubernetes EKS/GKE, Multi-AZ): ~$300 – $1,200/mo
- Edge Security & WAF (Cloudflare Enterprise / AWS WAF / DDoS shield): ~$250 – $700/mo
- **Total SaaS Hosting Run-Rate:** **$1,150 – $4,500 / month** ($13,800 – $54,000 / year).

#### Bucket C: Security Compliance & Audit Overhead
- Annual SOC2 Type II audit: ~$15,000 – $25,000/year
- Annual Third-Party Penetration Testing: ~$10,000 – $18,000/year
- Continuous compliance monitoring tools (Vanta / Drata): ~$8,000 – $12,000/year
- **Total Compliance Overhead:** **~$33,000 – $55,000 / year**.

---

## 4. The Best Recommendation: 24x7 NOC Wallboard & Remote Viewing Without High Costs

To solve the exact requirement of an **always-on 24x7 visual wallboard outside the VPC without incurring high costs**, here are the two battle-tested enterprise architectures:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│               24x7 REMOTE NOC WALLBOARD & DISPLAY OPTIONS ARCHITECTURE                 │
├───────────────────────────────┬────────────────────────────────────────────────────────┤
│ Display Option                │ Operational Scope & Best For                           │
├───────────────────────────────┼────────────────────────────────────────────────────────┤
│ NOC Desk                      │ High-Density SRE War-Room & Active Operator Desks      │
│ (Operator Recommended):       │ • Exact replica of In-VPC Telemetry Dashboard          │
│ <dcouplr/> AirLock™           │ • Strips non-operational panels: Financial Calculator  │
│ (Zero-Trust Ingress Tunnel)   │   and Alert Simulator Sandbox are removed for focus    │
│                               │ • Real-time 60 FPS charts, topology map & Raft health  │
│                               │ • Zero open inbound firewall ports, Zero VPN friction  │
│                               │ • Monthly Cost: ~$0.01 / month (Practically Free!)     │
├───────────────────────────────┼────────────────────────────────────────────────────────┤
│ Wallboard                     │ Public Lobby TVs, Kiosk Displays, SecOps Multi-NOC     │
│ (Air-Gapped SecOps):          │ • 100% read-only static snapshot push every 5 seconds  │
│ <dcouplr/> PulseCast™         │ • Internal VPC cluster NEVER receives inbound traffic  │
│ (Edge CDN Pulse Mirror)       │ • Standalone client with Screen Wake Lock API          │
│                               │ • Monthly Cost: ~$0.00 (R2) to ~$0.05 / month (S3)     │
└───────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

### NOC Desk (Operator Recommended): Cloudflare Zero Trust Tunnel with Service Token

This option allows any NOC operator console, SRE multi-monitor workstation, or wallboard display to view the **exact operational replica** of the `<dcouplr/>` dashboard (`http://127.0.0.1:8000/dashboard?view=noc-desk` or `/noc`) continuously 24x7.

#### Operational High-Density Invariant:
To maximize operator clarity during live incidents, the **NOC Desk** view removes non-operational panels:
1. **In-VPC Financial Cost Breakdown & Bandwidth Calculator** (`#panel-financial-calculator`): Financial SaaS comparison and egress calculator widgets are hidden.
2. **Interactive Alert Rule Threshold Simulator Sandbox** (`#panel-alert-simulator`): Rule sandbox and code export tabs are hidden.

The resulting view provides an uninterrupted, high-density stream of:
- Live 60 FPS translation velocity and tail latency waveforms.
- Container RSS memory headroom vs. strict 50 MiB cap.
- Real-time cross-cloud VPC topology map with live link status.
- Raft 3-node consensus state and WAL compaction progress.

```
┌────────────────────────────────────────────────────────────────────────┐
│             NOC DESK (OPERATOR RECOMMENDED): ZERO-TRUST TUNNEL         │
└────────────────────────────────────────────────────────────────────────┘

 [ 24x7 NOC Desk / SRE Workstation ] (Dual-Monitor / Chromium Kiosk)

            │
            │ Continuous HTTPS Browser Request to:
            │ https://noc-wallboard.company.com/dashboard
            ▼
 ┌───────────────────────────────────────────────────────────────────────┐
 │ Cloudflare Edge Network (Zero Trust Access Gateway)                   │
 │ • Authenticates Wallboard via Persistent Service Token (Never Expires)│
 │ • Blocks unauthorized public traffic                                  │
 │ • Caches static assets (HTML/CSS/JS) at edge                          │
 └───────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     │ Outbound Encrypted WireGuard Tunnel
                                     ▼ (No open inbound ports on VPC!)
 ┌───────────────────────────────────────────────────────────────────────┐
 │ In-VPC <dcouplr/> Control Node                                        │
 │ • Runs `cloudflared` tunnel connector sidecar (Port 8000)             │
 │ • Serves local dashboard & Server-Sent Events (SSE)                   │
 │ • Only streams lightweight JSON deltas (~50 bytes/second)             │
 └───────────────────────────────────────────────────────────────────────┘
```

#### Why This Cuts Costs to Nearly $0.00:
1. **Zero Egress on Static Assets:**
   The dashboard UI (HTML, CSS, JS icons) is fetched once upon boot and cached at the Cloudflare edge. It is not re-downloaded from the VPC.
2. **Ultra-Low Bandwidth JSON SSE Streams:**
   Instead of streaming multi-megabyte log files or volumetric timeseries, `<dcouplr/>` pushes tiny Server-Sent Event (SSE) deltas only when state changes (~50 bytes/s).
   - **Monthly Egress Calculation:**
     $$50\text{ bytes/s} \times 86,400\text{ s/day} \times 30\text{ days} = 129.6\text{ MB / month}$$
   - **Cloud Provider Egress Cost:**
     $$0.13\text{ GB} \times \$0.09 = \mathbf{\$0.01\text{ / month (1 cent!)}}$$
3. **No VPN Timeout / No Sleeping:**
   By configuring a **Cloudflare Service Token** (HTTP Headers: `CF-Access-Client-Id` and `CF-Access-Client-Secret`), the wallboard TV stays authenticated **permanently** without requiring human MFA or password re-entry at 3 AM.

#### Step-by-Step Implementation Guide:

##### Step 1: Deploy `cloudflared` inside the Target VPC
Run `cloudflared` as a lightweight systemd service or Docker sidecar next to `<dcouplr/>`:
```bash
# 1. Install cloudflared on the <dcouplr/> node
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# 2. Authenticate tunnel
cloudflared tunnel login

# 3. Create persistent tunnel
cloudflared tunnel create dcouplr-noc-wallboard

# 4. Route hostname to internal port 8000
cat << 'EOF' > ~/.cloudflared/config.yml
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json
ingress:
  - hostname: noc-wallboard.yourcompany.com
    service: http://127.0.0.1:8000
  - service: http_status:404
EOF

# 5. Start tunnel daemon
sudo cloudflared service install
sudo systemctl start cloudflared
```

##### Step 2: Configure Wallboard Service Token (Zero-Auth Friction)
In the Cloudflare Zero Trust dashboard:
1. Go to **Access > Service Auth > Create Service Token** named `NOC-Wallboard-Display`.
2. Go to **Applications > Add an Application > Self-Hosted** (`noc-wallboard.yourcompany.com`).
3. Set Policy Rule: `Action: Service Auth` &rarr; Include: `Service Token: NOC-Wallboard-Display`.
4. (Optional) Restrict by **Office Source IP CIDR** for defense-in-depth.

---

### Pattern B (Air-Gapped SecOps): Static CDN Pulse Mirror

For organizations where enterprise security policy strictly forbids any inbound tunnel into the VPC, use **Outbound-Only Static Pulse Mirroring**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PATTERN B: STATIC CDN PULSE MIRROR                   │
└────────────────────────────────────────────────────────────────────────┘

 ┌───────────────────────────────────────────────────────────────────────┐
 │ In-VPC <dcouplr/> Control Node                                        │
 │ • Cron worker exports 1.5 KB aggregated topology JSON every 5s        │
 │ • Performs HTTPS PUT to Cloudflare R2 / AWS S3 ($0 egress on R2)      │
 └───────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼ (Outbound-only HTTPS upload)
 ┌───────────────────────────────────────────────────────────────────────┐
 │ Cloudflare R2 / AWS S3 + CloudFront CDN                               │
 │ • Hosts static wallboard UI (index.html, wallboard.js)                │
 │ • Serves `/topology-pulse.json` from Edge Cache                       │
 └───────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼ (Cached CDN pull)
 [ 24x7 NOC Wallboard Display / Office TVs / Remote Stakeholders ]
```

1. **How It Operates:**
   - A lightweight cron inside the VPC polls `http://127.0.0.1:8000/v1/telemetry/topology` and writes a sanitized summary JSON (active nodes, migration wave progress, consensus health, circuit breaker state) to Cloudflare R2 or an S3 bucket every 5 seconds.
   - The Wallboard display loads a static page from the CDN and polls `topology-pulse.json`.
2. **Cost:**
   - Cloudflare R2 has **$0.00 egress fees**.
   - Total Monthly Cost: **~$0.05 / month** (Storage for 1 file).
3. **Security:**
   - The VPC has **zero incoming connections**. If the wallboard display is compromised, the attacker only has access to a public static JSON file with no network access into the VPC.

---


---

## 4.5 Wallboard Ergonomics & Visual Layout Options: Option A vs. Option B

In 24x7 SRE and NOC operations, the primary design challenge is **Macro Glanceability vs. Micro Depth**:
* **Macro View (High-Level):** Multi-VPC mesh topology, Raft consensus quorum, global throughput, and cross-cloud latency. Essential for 10–15 ft distance viewing on 55"–85" overhead displays.
* **Micro Depth (Granular):** 122 evaluated invariants across 24 components in all 7 tiers (PostgreSQL lock queues, ETCD WAL fsync latency, switch buffer drops, fan RPMs, Kirchhoff current conservation).
* **The Ergonomic Pitfall:** Displaying all 122 metric gauges simultaneously creates an illegible "wall of tiny numbers" causing visual fatigue. Conversely, hiding them completely prevents operators from catching localized bottlenecks before customer-facing outages occur.

To resolve this, `<dcouplr/>` standardizes on two approved display architectures:

### 🌟 Recommendation 1: "Management-by-Exception" & Dynamic Priority Spotlight
In operations ergonomics, **normal metrics should be invisible; only anomalous metrics should demand attention.**
* **Nominal State (Green):** When all 122 metrics are within thresholds, the wallboard remains calm and uncluttered, displaying:  
  `🟢 122/122 Invariants Nominal • Zero Breaches • 0 WAN Packets ($0.00 Egress)`.
* **Breach State (Amber/Red):** The instant any metric breaches (e.g. Tier 5 PostgreSQL Connection Saturation > 80% or Tier 4 Etcd Quorum Drop), a dedicated **Active Incident Spotlight** card dynamically animates onto the screen in high-contrast triage mode, spotlighting the exact failing metric, affected host, breach severity (P1 Critical / P2 Warning), and recommended remediation.

### 🌟 Recommendation 2: The 7-Tier Micro-LED Status Ribbon
A compact, ultra-dense ribbon placed directly beneath the header navigation. It displays **24 micro-LED status dots** mapped across all 7 infrastructure tiers:
* **Tier 01:** Physical DC & Hardware (IPMI, PDU, HVAC, Rack Temp)
* **Tier 02:** Core Networking & WAN (BGP, Spine-Leaf, Optics, Cross-Connect)
* **Tier 03:** Cloud VPC Invariants (eBPF, Flow Logs, NAT GW, Peering)
* **Tier 04:** Virtualization & K8s (Kubelet, Etcd Quorum, Control Plane, Pod Evictions)
* **Tier 05:** Middleware & DBs (Postgres, Oracle, MSSQL, Redis, Cassandra, TiDB, SAP HANA)
* **Tier 06:** App Services & APM (OTLP Traces, HTTP 5xx, P99 Latency, Synthetic Probes)
* **Tier 07:** Security SIEM & Logs (LogQL, Audit Spool, Anomaly Spikes, Zero-WAN Ring)

Each micro-LED pulses green for nominal, amber for warning, and flashing crimson red for critical, providing instant glanceability across the entire full-stack estate in minimal vertical pixels.

---

### 🏆 Option A: The "Sweet Spot" Architecture (Recommended for NOC Ops Desks)
**Combination of Recommendation 1 + Recommendation 2** on a unified single-screen canvas:
1. **Header & 7-Tier Micro-LED Ribbon:** Instantaneous 24-component status across Tiers 01–07 right below the top navigation bar.
2. **3-Column Macro Canvas:**
   - **Column 1:** Multi-VPC Topology Mesh (AWS US-East-1, AWS US-West-2, GCP US-Central1, Chicago On-Prem DC1) with active node counts and inter-region latency.
   - **Column 2:** Real-Time Network Throughput Waveform (60 FPS SVG line chart) and P50/P95/P99 latency distribution curves.
   - **Column 3:** Raft 3-Node Consensus Mesh (Leader, Term, WAL Compaction Index) and Zero-WAN Packet Meter ($0.00 WAN Egress).
3. **Dynamic Incident Spotlight Box:** Anchored in the center-right panel. Displays invariant parity proof when calm; expands into high-contrast triage on breach.
* **Direct Access URL:** `http://127.0.0.1:8000/wallboard?layout=sweet-spot`

---

### 🔄 Option B: Multi-Scene Kiosk Carousel (Recommended for Unattended Video Walls)
An automated rotating kiosk engine designed for unattended lobby TVs, executive hallways, and secondary war-room displays. It auto-rotates every 30 seconds across three dedicated full-screen scenes:
1. **Scene 1 (0:00 – 0:30): Multi-VPC Macro Topology & Cloud WAN Transit**  
   Full-screen geographical network topology, BGP peering health, inter-cloud transit latencies, and regional egress monitors.
2. **Scene 2 (0:30 – 1:00): 7-Tier Component Deep Dive & Invariant Heatmap**  
   Granular diagnostic cards for all 24 components across all 7 layers, detailing buffer cache hit ratios, worker connection saturation, and system fsync times.
3. **Scene 3 (1:00 – 1:30): Enterprise Incident Queue & Node Probes**  
   Live incident ticket backlog, automated root-cause diagnosis logs, priority-ranked remediation playbooks, and per-node health across the 71 census hosts.
* **Emergency Critical Freeze:** If any P1 Critical breach occurs during rotation, the carousel **automatically locks rotation** and freezes onto the active failing scene until resolved or acknowledged by an operator.
* **Direct Access URL:** `http://127.0.0.1:8000/wallboard?layout=carousel&interval=30s`
* **Keyboard Hotkeys:** `[Space]` Pause/Resume rotation, `[1]` Scene 1, `[2]` Scene 2, `[3]` Scene 3, `[A]` Option A, `[B]` Option B.

## 5. Dedicated 24x7 Wallboard Hardware & Kiosk Setup Guide

To ensure office TVs or wallboard displays never sleep, dim, or crash, use the following low-cost hardware and kiosk configuration:

### Recommended Wallboard Hardware:
- **Option 1 (Budget):** Raspberry Pi 5 (4GB RAM) with official active cooler (~$70).
- **Option 2 (Enterprise):** Intel N100 Mini PC (8GB RAM, Dual HDMI 4K output) (~$130).

### Kiosk Auto-Start Configuration (Linux / Raspberry Pi OS):
Create an auto-starting systemd service that launches Chromium in full-screen kiosk mode with all sleep modes disabled:

```bash
sudo apt update && sudo apt install -y chromium-browser unclutter xdotool
```

Create kiosk launcher script `/home/pi/launch-wallboard.sh`:
```bash
#!/bin/bash
# Disable screen blanking, power management, and screensaver
xset s off
xset s noblank
xset -dpms

# Hide mouse cursor after 2 seconds of inactivity
unclutter -idle 2 &

# Launch Chromium in dedicated non-sleeping Kiosk Mode with Service Token Headers
chromium-browser \
  --noerrdialogs \
  --disable-infobars \
  --kiosk \
  --check-for-update-interval=31536000 \
  --disable-session-crashed-bubble \
  --disable-features=Translate \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --header="CF-Access-Client-Id: <YOUR_SERVICE_TOKEN_CLIENT_ID>" \
  --header="CF-Access-Client-Secret: <YOUR_SERVICE_TOKEN_SECRET>" \
  "https://noc-wallboard.yourcompany.com/dashboard"
```

Make executable and register in desktop autostart:
```bash
chmod +x /home/pi/launch-wallboard.sh
mkdir -p ~/.config/autostart
cat << 'EOF' > ~/.config/autostart/wallboard.desktop
[Desktop Entry]
Type=Application
Name=NOC Wallboard
Exec=/home/pi/launch-wallboard.sh
EOF
```

---

## 6. Financial Summary: Wallboard TCO Comparison

| Metric | Traditional Monitoring SaaS (Datadog/Dynatrace) | <dcouplr/> In-VPC + Cloudflare Zero Trust (Pattern A) | <dcouplr/> CDN Static Pulse (Pattern B) |
| :--- | :--- | :--- | :--- |
| **Agent / Ingestion License** | $15 – $25 / host / month | **$0.00** (Open-Core / Community) | **$0.00** |
| **Hyperscaler WAN Egress** | ~$2,340 / month (26 TB @ $0.09) | **$0.01 / month** (129 MB SSE deltas) | **$0.05 / month** (Zero egress on R2) |
| **SaaS Hosting / DB Cluster** | $1,150 – $4,500 / month | **$0.00** (Uses existing In-VPC node) | **$0.00** (Cloudflare Pages free tier) |
| **Wallboard Display Uptime** | Fragile (SSO token expires every 8h) | **Unbreakable (Persistent Service Token)** | **Unbreakable (Static CDN Cache)** |
| **Annual Total Cost** | **$41,880 – $82,000 / year** | **<$1.00 / year** | **<$1.00 / year** |
| **Net Cost Savings** | Baseline | **99.99% Cost Reduction** | **99.99% Cost Reduction** |

---

## 7. Operational Checklist for Implementation

- [ ] **Step 1:** Verify in-VPC `<dcouplr/>` control node is running on port 8000 (`http://127.0.0.1:8000/dashboard`).
- [ ] **Step 2:** Deploy `cloudflared` on the control node pointing to `http://127.0.0.1:8000`.
- [ ] **Step 3:** Configure Cloudflare Zero Trust application hostname and generate a non-expiring `Service Token`.
- [ ] **Step 4:** Configure the wallboard mini-PC / Raspberry Pi with the kiosk script injecting the Service Token headers.
- [ ] **Step 5:** Verify the 24x7 display renders the multi-cloud topology mesh with zero sleep and zero manual logins.
- [ ] **Step 6:** Monitor cloud provider billing to attest that WAN egress fees remain under **$0.05 / month**.
