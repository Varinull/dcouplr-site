# <dcouplr/> Full-Stack Suite: Full-Stack Metrics & Guided Threshold Catalog
## SRE & Administrator Runbook: 7-Layer Monitoring Points, Threshold Trade-Off Analysis, and Enterprise Ticketing Architecture

```
Document ID:     RUN-FULLSTACK-METRICS-GUIDE-001
Classification:  Enterprise Observability & Zero-Egress In-VPC Operations
Target Platform: <dcouplr/> Full-Stack Suite
Integrations:    Enterprise Ticketing Systems (ServiceNow / Jira / Spool), NOC PulseCast, SRE SMTP, Syslog RFC-5424
Egress Status:   0.00 WAN Packets / 100% In-VPC Guaranteed (Zero WAN Egress)
```

---

## 1. Executive Summary & Core Architectural Tenets

The **<dcouplr/> Full-Stack Suite** provides turnkey, deep-packet, zero-egress monitoring across every layer of modern hybrid enterprise infrastructure.

### The Zero-Egress Invariant
All collectors, ring buffers, threshold evaluations, and alert dispatchers run strictly **in-perimeter** (`100% In-VPC / On-Prem`). No metric readings, logs, traces, or security metadata ever leave your private network boundaries. All telemetry is stored in high-performance memory ring buffers and local WAL storage, guaranteeing **$0.00 egress costs** and eliminating third-party data exfiltration risks.

### Guiding, Not Strict: The Engineering Threshold Philosophy
In high-velocity enterprise environments, rigid alerting thresholds cause two catastrophic failure modes:
1. **Alert Fatigue (Thresholds Too Strict):** On-call SREs receive dozens of actionable-looking notifications during routine batch processing, RMAN backups, or seasonal micro-bursts, leading to alarm desensitization.
2. **Undetected Outages (Thresholds Too Permissive):** Degraded database buffer pools or connection pool exhaustion goes unflagged until user-facing HTTP 5xx errors breach customer SLAs.

`<dcouplr/>` addresses this by providing **guiding, not strict** threshold configurations:
- Every metric has an independent **Activation Toggle (`enabled: true/false`)**, allowing engineering teams to disable irrelevant signals for specific host roles.
- Factory default thresholds are grounded in queuing theory (Erlang C), thermodynamics, and hardware tolerances.
- Engineers can adjust warning and critical thresholds dynamically; the system immediately provides **Guiding Trade-off Feedback** detailing the pros, cons, and operational risks of tightening versus relaxing each threshold.

---

## 2. Notification Forwarding & In-Perimeter Enterprise Ticketing Architecture

### In-Perimeter Ticketing & Local Spooling
In enterprise cloud and on-premise deployments, `<dcouplr/>` integrates with your organization's **enterprise ticketing tools** (such as **ServiceNow**, **Jira Service Management**, or custom internal ticketing systems). Operating under a strict **Zero-Egress Invariant (Zero WAN Egress)**, `<dcouplr/>` dispatches alerts and incident records without requiring outbound internet access:

```
Platform Architecture:   In-Perimeter Enterprise Ticketing & Incident Dispatch
Local Spool Directory:   ./data/incident_spool/
Local Webhook Bridge:    http://127.0.0.1:9000/v1/support/receiver/ingest (Loopback / Private LAN)
Target Incident Queues:  hw-ops-dc, network-ops, cloud-infra, k8s-platform, dba-team, sre-tier1, secops-threat
Operating Mode:          100% In-Perimeter / Air-Gapped Autonomous Dispatch
```

```mermaid
flowchart TD
    subgraph Collectors["<dcouplr/> Full-Stack Suite Collectors (Layers 1-7)"]
        L1["L1: Physical DC & Bare Metal"]
        L2["L2: Network & Interconnects"]
        L3["L3: Cloud VPC & Gateways"]
        L4["L4: Hypervisors & K8s"]
        L5["L5: Oracle, MSSQL, PG, Kafka"]
        L6["L6: APM & Runtimes"]
        L7["L7: Logs, IAM & Security"]
    end

    subgraph Eval["Threshold & Guidance Engine"]
        Engine["In-Memory Evaluation & Invariant Validation"]
    end

    subgraph TicketingBridge["In-Perimeter Ticketing Dispatch & Local Spool"]
        Spool["Atomic File Spool: ./data/incident_spool/"]
        IPC["Local Loopback API / Webhook Bridge"]
        Q_HW["Queue: hw-ops-dc (Tier 1)"]
        Q_NET["Queue: network-ops (Tier 2)"]
        Q_CLOUD["Queue: cloud-infra (Tier 3)"]
        Q_K8S["Queue: k8s-platform (Tier 4)"]
        Q_DBA["Queue: dba-team (Tier 5)"]
        Q_SRE["Queue: sre-tier1 (Tier 6)"]
        Q_SEC["Queue: secops-threat (Tier 7)"]
    end

    subgraph ITSM["Enterprise Ticketing Tools"]
        SN["ServiceNow / Jira Service Management"]
        Console["Internal SRE Incident Console"]
        Paging["On-Call Paging & War-Room Bridge"]
    end

    Collectors --> Eval
    Eval -->|Alert Triggered (Zero WAN)| Spool
    Eval -.->|Direct Loopback Webhook| IPC
    Spool --> Q_HW & Q_NET & Q_CLOUD & Q_K8S & Q_DBA & Q_SRE & Q_SEC
    IPC --> ITSM
    Spool -.->|Pickup Daemon| ITSM
```

### Zero-Egress Spool Mechanism
When any active metric breaches its threshold and has an enterprise ticketing route enabled:
1. `<dcouplr/>` formats a structured, cryptographic ITIL incident ticket:
   ```json
   {
     "ticket_id": "TICK-P1-1793289968-163FFD",
     "source": "<dcouplr/> Full-Stack Suite",
     "severity": "P1",
     "target_queue": "dba-team",
     "component_id": "databases_oracle",
     "metric": "Oracle SGA Buffer Cache Hit Ratio",
     "current_value": 88.4,
     "unit": "%",
     "threshold": 90.0,
     "title": "[P1] DATABASES_ORACLE: Buffer Cache Hit Ratio Breached Critical Threshold",
     "remediation_runbook": "/docs/runbooks/RUNBOOK-FULLSTACK-METRICS-AND-GUIDED-THRESHOLD-CATALOG.html#databases_oracle",
     "zero_egress_verified": true,
     "created_at": "2026-10-29T16:06:08Z"
   }
   ```
2. The payload is written atomically to `./data/incident_spool/ticket-<uuid>.json`.
3. If an internal ticketing receiver is active on local loopback port `9000`, `<dcouplr/>` immediately sends the ticket via loopback HTTP (`POST /v1/support/receiver/ingest`). If the receiver is offline, the ticket remains buffered in the local spool directory without data loss.
4. **Zero WAN bytes are transmitted**. The ticket is ingested, prioritized, and dispatched to on-call engineers via your internal ticketing tool or NOC wallboards.

---

## 3. Threshold Tuning Profiles

| Profile Name | Target Environment | Warning Philosophy | Critical Philosophy | SRE Trade-Off Summary |
| :--- | :--- | :--- | :--- | :--- |
| **Profile A: Aggressive (Tier-0 Financial)** | Production Core Banking, Payment Gateways | Tight (e.g. CPU > 70%, Pool > 75%) | Strict (e.g. CPU > 85%, Pool > 85%) | **Pros:** Earliest detection, maximum lead time to intervene. <br>**Cons:** Higher alert volume; requires dedicated 24x7 NOC triage. |
| **Profile B: Balanced Production (Default)** | Standard Enterprise Production Services | Moderate (e.g. CPU > 75%, Pool > 80%) | Safe (e.g. CPU > 90%, Pool > 92%) | **Pros:** Factory optimized via Erlang C; filters transient micro-spikes. <br>**Cons:** Requires response within 10–15 min of warning. |
| **Profile C: Permissive (Staging & Batch)** | Staging, Non-Prod, Heavy Batch Clusters | Relaxed (e.g. CPU > 88%, Pool > 90%) | Broad (e.g. CPU > 96%, Pool > 98%) | **Pros:** Zero false alarms during scheduled nightly bulk jobs. <br>**Cons:** Leaves small buffer before resource exhaustion. |

---

## 4. Comprehensive Layer-by-Layer Metric Catalog & Guidance

### Layer 1: Physical Data Center Infrastructure (Bare Metal & On-Prem)

#### 1.1 Compute / Bare Metal Servers (`compute_bare_metal`)
- **Protocol:** IPMI v2.0 RMCP+, Redfish REST API, Linux Node Exporter, `smartctl`, `edac-util`.
- **Primary Ticketing Queue:** `hw-ops-dc`

| Metric Key | Name & Description | Default Warn / Crit | Validation Bounds | Rationale for Default | Guiding Pros & Cons (Tightening vs Relaxing) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `cpu_utilization_pct` | CPU Core Utilization (%) | 75.0% / 90.0% | 10.0% – 100.0% | Based on M/M/c queuing models; above 75% utilization, runqueue wait times increase non-linearly. | **Tighten (e.g. 65%):** Catches runaway threads earlier. May alert on routine compilation or cron tasks. <br>**Relax (e.g. 85%):** Prevents alert spam on bursty batch nodes. Leaves narrow buffer before core saturation. |
| `memory_usage_pct` | Physical RAM Utilization (%) | 80.0% / 95.0% | 20.0% – 100.0% | Linux buffer/cache can be evicted; 80% marks genuine anonymous application memory pressure. | **Tighten (70%):** Early notice for memory leak investigations. Low utilization alert noise. <br>**Relax (90%):** Suitable for in-memory caches (Redis). Risk of invocation of Linux OOM Killer. |
| `memory_swap_pct` | Swap Space Saturation (%) | 40.0% / 70.0% | 0.0% – 100.0% | Disk paging introduces order-of-magnitude latency spikes ($10\mu s \to 10ms$). | **Tighten (20%):** Strict zero-swap policy. Catches misconfigured JVMs early. <br>**Relax (60%):** Tolerates OS paging of stale kernel pages. Risk of major latency degredation. |
| `disk_latency_ms` | NVMe / SAS Service Time (ms) | 5.0 ms / 15.0 ms | 0.1 ms – 200.0 ms | Enterprise NVMe delivers sub-millisecond service times. Latency $>5ms$ indicates I/O controller queuing. | **Tighten (2.0 ms):** Strict flash SLA. May trigger during database checkpoint flush. <br>**Relax (10.0 ms):** Tolerates spinning disk SAN/NAS pools. |
| `system_temp_celsius` | Chassis Exhaust Temperature (°C) | 70.0°C / 85.0°C | 30.0°C – 105.0°C | Intel/AMD thermal throttling begins at 85°C–90°C. 70°C warning prevents thermal trip cutoffs. | **Tighten (60°C):** Detects rack cooling failure early. May fire in unconditioned lab rooms. <br>**Relax (80°C):** High temperature tolerance; risk of emergency CPU thermal shutdown. |
| `fan_speed_rpm` | Chassis Fan Speed (RPM) | 3000 / 1500 (Op: `<`) | 500 – 15000 RPM | Redundant cooling fans typically operate at 5,000–8,000 RPM. Speed $<3,000$ indicates bearing failure. | **Tighten (4000 RPM):** Proactive fan replacement alert. <br>**Relax (2000 RPM):** Accommodates low-noise server modes. |
| `smart_failing_disks` | SMART Predicted Drive Failures | 1 / 2 (Op: `>=`) | 0 – 32 disks | Modern drives reallocate bad sectors; 1 failing drive requires proactive hot-spare rebuilding. | **Tighten (1 disk):** Standard enterprise zero-unmapped-sector rule. <br>**Relax (2 disks):** High risk of unrecoverable dual-parity RAID failure. |
| `ecc_memory_errors` | Uncorrectable ECC Memory Errors | 1 / 3 (Op: `>=`) | 0 – 100 errors | Multi-bit ECC errors cannot be corrected by hardware and risk silent memory corruption or kernel panic. | **Tighten (1 error):** Immediate server evacuation/drain. Recommended for all production. |

#### 1.2 Power & Environment (DCIM/IPMI) (`power_environment_dcim`)
- **Protocol:** Modbus TCP (Port 502), SNMP v3 (`UPS-MIB`, `PDU-MIB`), CRAC/CRAH telemetry.
- **Primary Ticketing Queue:** `hw-ops-dc`

| Metric Key | Name & Description | Default Warn / Crit | Validation Bounds | Rationale for Default | Guiding Pros & Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ups_battery_soc_pct` | Battery State of Charge (%) | 95.0% / 80.0% (Op: `<`) | 10.0% – 100.0% | UPS batteries must remain float-charged at $>98\%$. SoC $<95\%$ indicates utility mains loss. | **Tighten (98%):** Immediate notice upon utility power cut. <br>**Relax (85%):** Avoids alerts during scheduled battery self-discharge calibration tests. |
| `ups_runtime_remaining_min` | Battery Runtime Remaining (min) | 25 min / 12 min (Op: `<`) | 5 – 120 min | Facility diesel generators require 2–5 minutes to synchronize. 25 min warning allows controlled shutdown. | **Tighten (30 min):** Ensures sufficient time to gracefully stop distributed databases. |
| `pdu_load_utilization_pct` | PDU Branch Circuit Load (%) | 75.0% / 85.0% | 20.0% – 100.0% | National Electrical Code (NEC) continuous duty derating mandates breaker loads $\le 80\%$. | **Tighten (70%):** Prevents branch breaker nuisance trips during server power-on surges. |
| `ambient_rack_temp_celsius` | Cold-Aisle Temperature (°C) | 25.0°C / 29.0°C | 15.0°C – 45.0°C | ASHRAE TC 9.9 recommended envelope is 18°C–27°C. Above 27°C, server fan power consumption doubles. | **Tighten (23°C):** Maximizes hardware lifespan; requires higher chiller energy spend. |

#### 1.3 Storage Systems (SAN/NAS) (`storage_san_nas`)
- **Protocol:** SMI-S (Port 5988/5989), Vendor REST APIs (NetApp ONTAP, Dell PowerStore, Pure Storage).
- **Primary Ticketing Queue:** `hw-ops-dc`

| Metric Key | Name & Description | Default Warn / Crit | Validation Bounds | Rationale for Default | Guiding Pros & Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `volume_capacity_utilization_pct` | Storage Pool Used (%) | 80.0% / 90.0% | 30.0% – 100.0% | Thin-provisioned storage pools can exhaust free blocks rapidly during snapshot creation. | **Tighten (70%):** Provides 2-4 weeks procurement runway. <br>**Relax (88%):** Maximizes storage capital efficiency. |
| `storage_write_latency_ms` | Storage Service Time (Write) | 10.0 ms / 25.0 ms | 0.5 ms – 100.0 ms | Synchronous database commits stall when storage write latency exceeds 10 ms. | **Tighten (5.0 ms):** Enforces all-flash latency tier. <br>**Relax (20.0 ms):** Accommodates hybrid SSD/HDD tiers. |
| `raid_controller_degraded` | Degraded RAID Groups | 1 / 2 (Op: `>=`) | 0 – 16 arrays | A single degraded parity group leaves the storage pool vulnerable to catastrophic second-disk failure. | **Non-negotiable:** Must always alert on 1 degraded group to schedule drive replacement. |

---

### Layer 2: Physical & Virtual Networking

#### 2.1 Network Devices (`network_devices`)
- **Protocol:** SNMP v3 (`IF-MIB`, `ENTITY-MIB`), gNMI / OpenConfig, Switch Syslog.
- **Primary Ticketing Queue:** `network-ops`

| Metric Key | Name & Description | Default Warn / Crit | Validation Bounds | Rationale for Default | Guiding Pros & Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `switch_cpu_utilization_pct` | Switch Control Plane CPU (%) | 70.0% / 85.0% | 10.0% – 100.0% | Control plane CPU handles BGP/OSPF keepalives and ARP resolution. High CPU causes protocol dropouts. | **Tighten (60%):** Detects control plane packet storms before BGP drops. |
| `packet_loss_pct` | Interface Packet Drop Ratio (%) | 0.05% / 0.50% | 0.00% – 10.0% | Modern Ethernet switching in datacenters should have zero packet drops under line-rate conditions. | **Tighten (0.01%):** High-frequency trading standard. <br>**Relax (0.10%):** Tolerates transient micro-burst buffer congestion. |
| `switch_asic_temp_celsius` | Core Switching ASIC Temp (°C) | 75.0°C / 90.0°C | 30.0°C – 115.0°C | Broadcom/Cisco ASICs throttle packet forwarding pipelines at 95°C. | **Tighten (70°C):** Proactive switch fan replacement alert. |

#### 2.2 Connectivity & Latency (`network_connectivity_latency`)
- **Protocol:** ICMP Echo, CoreDNS RFC-1035 UDP probes, BGP EVPN peering state.
- **Primary Ticketing Queue:** `network-ops`

| Metric Key | Name & Description | Default Warn / Crit | Validation Bounds | Rationale for Default | Guiding Pros & Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `inter_rack_latency_ms` | Spine-Leaf RTT Latency (ms) | 2.5 ms / 8.0 ms | 0.1 ms – 50.0 ms | In-datacenter spine-leaf RTT is typically $<1.0ms$. $>2.5ms$ indicates link negotiation downshifts or routing loops. | **Tighten (1.5 ms):** Catches single-link CRC error downshifts early. |
| `network_jitter_ms` | Packet Transit Jitter (ms) | 1.0 ms / 3.5 ms | 0.01 ms – 20.0 ms | High jitter causes TCP window collapse and distributed lock heartbeat timeouts in consensus clusters. | **Tighten (0.5 ms):** Enforces ultra-stable Raft quorum latency. |
| `bgp_peer_down_count` | Unestablished BGP Peers | 1 / 2 (Op: `>=`) | 0 – 32 peers | A down BGP peer indicates severed rack uplinks or route reflector failure. | **Non-negotiable:** Must alert immediately on 1 peer down. |

#### 2.3 Network Interconnects (`network_interconnects`)
- **Protocol:** Cloud Interconnect APIs (DirectConnect / ExpressRoute / Cloud Interconnect), IKE IPsec MIBs.
- **Primary Ticketing Queue:** `network-ops`

| Metric Key | Name & Description | Default Warn / Crit | Validation Bounds | Rationale for Default | Guiding Pros & Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `directconnect_bandwidth_util_pct` | Cross-Connect Saturation (%) | 75.0% / 90.0% | 20.0% – 100.0% | Interconnect queuing causes packet drops and TCP head-of-line blocking for hybrid cloud replication. | **Tighten (65%):** Allows sufficient time to activate secondary LAG cross-connects. |
| `optical_rx_power_dbm` | SFP28 Optical Rx Power (dBm) | -12.0 dBm / -15.0 dBm (Op: `<`) | -30.0 – +5.0 dBm | Fiber attenuation below -14.4 dBm causes optical bit-error-rate (BER) spikes and link flap. | **Tighten (-10.0 dBm):** Proactive fiber cleaning / SFP transceiver replacement. |

---

### Layer 3: VPC & Cloud Infrastructure

#### 3.1 VPC Flow Logs (`vpc_flow_logs`)
- **Protocol:** Cloud Flow Logs, Kernel packet mirror, Kirchhoff Flux Invariant Evaluator.
- **Primary Ticketing Queue:** `cloud-infra` / `secops-threat`

| Metric Key | Name & Description | Default Warn / Crit | Validation Bounds | Rationale for Default | Guiding Pros & Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `kirchhoff_flow_imbalance_pct` | Flow Volume Balance Delta (%) | 0.05% / 0.15% | 0.00% – 2.00% | Proves Theorem 2: Ingress equals Egress plus local consumption. Imbalance $>0.05\%$ flags covert tunneling or blackholed subnets. | **Tighten (0.02%):** Strict mathematical invariant proof. Catches asymmetric routing instantly. |
| `rejected_packet_ratio_pct` | Security Group Rejections (%) | 5.0% / 15.0% | 0.5% – 50.0% | Normal background traffic has $<1\%$ drops. $>5\%$ indicates misconfigured security groups or active scanning. | **Tighten (2.0%):** Early indicator of network segmentation permission denial. |
| `external_wan_egress_bytes` | External WAN Egress Bytes | 0 / 1 (Op: `>=`) | 0 – 0 bytes | **Core Invariant (Zero WAN Egress):** In an air-gapped or zero-egress VPC, any external WAN packet is a critical security breach. | **Zero-Tolerance:** Must always remain 0 bytes. |

#### 3.2 Virtual Networks & Subnets (`virtual_networks_subnets`)
- **Protocol:** Cloud Provider IPAM SDKs, DHCP lease tables.
- **Primary Ticketing Queue:** `cloud-infra`

| Metric Key | Name & Description | Default Warn / Crit | Validation Bounds | Rationale for Default | Guiding Pros & Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `subnet_ip_exhaustion_pct` | Subnet CIDR IP Pool Used (%) | 80.0% / 92.0% | 20.0% – 100.0% | Running out of private IP addresses prevents Kubernetes pods or serverless instances from scaling up. | **Tighten (70%):** Gives network team time to allocate secondary CIDR blocks. |
| `nat_gw_snat_port_allocation_pct` | NAT Gateway SNAT Ports (%) | 75.0% / 90.0% | 20.0% – 100.0% | SNAT port exhaustion (64k ports per IP) causes outgoing connection dropouts to partner APIs. | **Tighten (65%):** Prevents connection drops during outbound traffic spikes. |

#### 3.3 Firewalls & Security Groups (`firewalls_security_groups`)
- **Protocol:** Netfilter conntrack netlink socket, CloudWatch firewall metrics.
- **Primary Ticketing Queue:** `cloud-infra` / `secops-threat`

| Metric Key | Name & Description | Default Warn / Crit | Validation Bounds | Rationale for Default | Guiding Pros & Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `conntrack_table_saturation_pct` | Conntrack Table Saturation (%) | 75.0% / 88.0% | 20.0% – 100.0% | Netfilter conntrack table saturation causes kernel to drop all new incoming and outgoing TCP SYN packets. | **Tighten (65%):** Provides 15+ minutes lead time to increase `nf_conntrack_max`. |

#### 3.4 Load Balancers (`load_balancers`)
- **Protocol:** Envoy admin interface (`/stats/prometheus`), Cloud Load Balancer metrics.
- **Primary Ticketing Queue:** `sre-tier1`

| Metric Key | Name & Description | Default Warn / Crit | Validation Bounds | Rationale for Default | Guiding Pros & Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `target_response_time_p99_ms` | Target Group P99 Latency (ms) | 250 ms / 1000 ms | 10 ms – 10000 ms | P99 latency $>250ms$ indicates backend thread starvation or slow database locks. | **Tighten (100 ms):** Enforces sub-second user experience. <br>**Relax (500 ms):** Tolerates complex database aggregation endpoints. |
| `http_5xx_rate_pct` | HTTP 5xx Server Error Rate (%) | 0.50% / 2.00% | 0.05% – 20.0% | Google SRE standard: $>0.5\%$ error rate consumes error budget rapidly. | **Tighten (0.10%):** Critical for financial transactional endpoints. |
| `ssl_certificate_days_remaining` | TLS Days to Expiration (days) | 21 days / 7 days (Op: `<`) | 1 – 365 days | Expired certificates cause instant browser lockout and API failure. | **Tighten (30 days):** Allows sufficient time for manual certificate renewal if automated ACME fails. |

---

### Layer 4: Virtualization & Container Platforms

#### 4.1 Hypervisors (`hypervisors`)
- **Protocol:** VMware vSphere API (`pyVmomi`), libvirt daemon socket.
- **Primary Ticketing Queue:** `k8s-platform` / `hw-ops-dc`

| Metric Key | Name & Description | Default Warn / Crit | Validation Bounds | Rationale for Default | Guiding Pros & Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `cpu_ready_time_pct` | Hypervisor CPU Ready (%) | 3.0% / 7.0% | 0.5% – 25.0% | CPU ready $>3\%$ indicates CPU overcommitment; virtual machines are waiting for physical CPU cores. | **Tighten (2.0%):** Essential for database VMs; ensures CPU scheduler never stalls queries. |
| `memory_overcommit_pct` | Host RAM Overcommit (%) | 110.0% / 135.0% | 50.0% – 250.0% | Overcommit $>110\%$ triggers hypervisor memory ballooning and ESXi/KVM swap paging. | **Tighten (100%):** Guarantees zero memory ballooning. <br>**Relax (125%):** Standard for stateless web VM clusters. |

#### 4.2 Container Orchestration: Cluster Health (`container_orchestration_cluster`)
- **Protocol:** Kubernetes API Server (`/metrics`), ETCD client metrics, Prometheus Node Exporter.
- **Primary Ticketing Queue:** `k8s-platform`

| Metric Key | Name & Description | Default Warn / Crit | Validation Bounds | Rationale for Default | Guiding Pros & Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `etcd_disk_fsync_p99_ms` | ETCD WAL Disk fsync P99 (ms) | 10.0 ms / 25.0 ms | 1.0 ms – 100.0 ms | ETCD requires fast disk commits to maintain Raft consensus. fsync $>10ms$ causes Raft leader elections. | **Tighten (5.0 ms):** Ensures resilient Kubernetes control plane. Requires dedicated NVMe SSDs. |
| `api_server_latency_p99_ms` | API Server P99 Latency (ms) | 500 ms / 2000 ms | 50 ms – 10000 ms | High API server latency causes Kubelet sync timeouts and pod admission bottlenecks. | **Tighten (200 ms):** Enforces snappy deployment reconciliation. |

#### 4.3 Container Orchestration: Workloads (`container_orchestration_workloads`)
- **Protocol:** Kube-state-metrics, cgroup v2 controller interface (`/sys/fs/cgroup`).
- **Primary Ticketing Queue:** `k8s-platform` / `sre-tier1`

| Metric Key | Name & Description | Default Warn / Crit | Validation Bounds | Rationale for Default | Guiding Pros & Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `crashloopbackoff_count` | Containers in CrashLoopBackOff | 1 / 5 (Op: `>=`) | 0 – 50 containers | Indicates application crashes on startup (bad configuration, failed database connection). | **Non-negotiable:** Must alert immediately on 1 container failing in production. |
| `oom_killed_containers_hour` | OOMKilled Terminations | 1 / 3 (Op: `>=`) | 0 – 50 events/hr | Container exceeded its Kubernetes memory limit and was killed with SIGKILL (exit code 137). | **Tighten (1 event):** Proactively highlights pods needing memory limit increases. |

---

### Layer 5: Middleware, Databases & Storage Layers

#### 5.1 Oracle Database 19c / 21c RAC (`databases_oracle`)
- **Protocol:** Oracle Net TNS, `v$sysmetric`, `v$session`, `v$system_event`, AWR (Port 1521).
- **Primary Ticketing Queue:** `dba-team`

| Metric Key | Name & Description | Default Warn / Crit | Validation Bounds | Rationale for Default | Guiding Pros & Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `sga_buffer_cache_hit_pct` | SGA Buffer Cache Hit Ratio (%) | 95.0% / 90.0% (Op: `<`) | 50.0% – 100.0% | In OLTP systems, $>95\%$ of block reads should resolve from memory buffer cache. Lower causes physical disk I/O bottlenecks. | **Tighten (97%):** Detects missing indexes or rogue full-table scans early. May fire during RMAN backups. <br>**Relax (88%):** Suitable for Data Guard read-only reporting standby. |
| `pga_cache_hit_pct` | PGA Workarea Hit Ratio (%) | 90.0% / 80.0% (Op: `<`) | 40.0% – 100.0% | Measures percentage of workarea sorts and hash joins executed purely in memory without spilling to TEMP. | **Tighten (93%):** Ensures in-memory sorts; prevents disk I/O churn on temporary tablespaces. |
| `active_sessions_pct_processes` | Active Sessions vs PROCESSES (%) | 75.0% / 90.0% | 10.0% – 100.0% | Prevents fatal `ORA-00018` (max sessions exceeded) and `ORA-00020` (max processes exceeded). | **Tighten (65%):** Gives DBAs 30+ min to kill idle/blocking sessions. <br>**Relax (85%):** Leaves narrow margin during connection storms. |
| `redo_log_space_wait_ms` | Redo Log Allocation Wait (ms) | 10.0 ms / 50.0 ms | 0.0 ms – 500.0 ms | 'log buffer space' wait events block all DML commits across RAC instances. | **Tighten (5.0 ms):** Enforces sub-millisecond commit latency; requires high-speed NVMe redo logs. |
| `archiver_lag_minutes` | Data Guard Standby Lag (min) | 5.0 min / 15.0 min | 0.0 min – 120.0 min | Data Guard synchronization lag represents potential data loss (RPO) in disaster failover. | **Tighten (2.0 min):** Enforces near-zero RPO SLA across primary and standby datacenters. |
| `tablespace_used_pct` | Primary Tablespace Used (%) | 85.0% / 95.0% | 50.0% – 100.0% | Prevents `ORA-01653` (unable to extend table). 85% warning provides 3-5 days to allocate storage. | **Tighten (80%):** Proactive SAN provisioning notice. <br>**Relax (90%):** Maximizes storage capital efficiency. |

#### 5.2 Microsoft SQL Server 2019 / 2022 (`databases_mssql`)
- **Protocol:** TDS, `sys.dm_os_wait_stats`, `sys.dm_os_performance_counters`, `dm_hadr` (Port 1433).
- **Primary Ticketing Queue:** `dba-team`

| Metric Key | Name & Description | Default Warn / Crit | Validation Bounds | Rationale for Default | Guiding Pros & Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `buffer_cache_hit_ratio_pct` | Buffer Cache Hit Ratio (%) | 95.0% / 90.0% (Op: `<`) | 50.0% – 100.0% | Percentage of pages found in the buffer pool without needing to read from physical disk. | **Tighten (97%):** Alerts quickly if memory pressure forces cached pages out. |
| `page_life_expectancy_sec` | Page Life Expectancy (PLE) (s) | 300 s / 120 s (Op: `<`) | 30 s – 3600 s | Number of seconds a page stays in the buffer pool. Baseline rule of thumb: 300s per 4GB of buffer RAM. | **Tighten (600 s):** Catches internal SQL memory pressure early. <br>**Relax (180 s):** Tolerates index maintenance jobs. |
| `user_connections_pct_max` | Worker Connections % Max | 80.0% / 92.0% | 20.0% – 100.0% | Prevents thread pool exhaustion where new client connections fail with error 17809. | **Tighten (70%):** Provides lead time to adjust application connection pool max sizes. |
| `alwayson_redo_queue_kb` | Always On AG Redo Queue (KB) | 50,000 KB / 250,000 KB | 0 – 1,000,000 KB | Volume of log records waiting to be redone on secondary replicas. High redo queue delays failover cutover. | **Tighten (20,000 KB):** Ensures instantaneous replica failover readiness. |
| `log_file_used_pct` | Transaction Log Space Used (%) | 80.0% / 92.0% | 30.0% – 100.0% | A full transaction log (.ldf) halts all database write operations (error 9002). | **Tighten (70%):** Verifies log backup jobs or replication log readers are not stalling. |

#### 5.3 Relational & NoSQL Databases (`databases_relational_nosql`)
- **Protocol:** PostgreSQL `pg_stat_activity`, MySQL `performance_schema`, TiDB PD API, Cassandra JMX.
- **Primary Ticketing Queue:** `dba-team`

| Metric Key | Name & Description | Default Warn / Crit | Validation Bounds | Rationale for Default | Guiding Pros & Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `conn_pool_saturation_pct` | Connection Pool Saturation (%) | 80.0% / 92.0% | 20.0% – 100.0% | Above 80% saturation, connection acquisition latency exhibits exponential Erlang C delays. | **Tighten (70%):** Early warning for read replica offloading. <br>**Relax (88%):** Tolerates brief spike traffic. |
| `deadlocks_per_hour` | Transaction Deadlock Events | 1 / 5 (Op: `>=`) | 0 – 50 events/hr | Deadlocks cause transactions to be rolled back with serialization errors. | **Tighten (1 event):** Proactively highlights problematic application transaction isolation levels. |
| `replication_lag_seconds` | Replica Lag (seconds) | 2.0 s / 10.0 s | 0.01 s – 120.0 s | Follower replication lag leads to stale reads and prolonged failover RPO. | **Tighten (1.0 s):** Enforces strict read-your-writes consistency. |

#### 5.4 Messaging & Queues (`messaging_queues`)
- **Protocol:** Kafka AdminClient, RabbitMQ Management API, AWS SQS Attributes.
- **Primary Ticketing Queue:** `dba-team` / `sre-tier1`

| Metric Key | Name & Description | Default Warn / Crit | Validation Bounds | Rationale for Default | Guiding Pros & Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `consumer_lag_records` | Kafka Consumer Group Lag | 5,000 / 25,000 | 100 – 1,000,000 | Growing consumer lag indicates consumers cannot keep pace with producer throughput. | **Tighten (2,000):** Catches consumer pod stalls early. <br>**Relax (50,000):** Tolerates batch consumer schedules. |
| `under_replicated_partitions` | Under-Replicated Partitions | 1 / 2 (Op: `>=`) | 0 – 100 partitions | Indicates one or more Kafka broker replicas have fallen out of the In-Sync Replicas (ISR) set. | **Non-negotiable:** Must alert immediately on 1 URP to prevent data loss. |

#### 5.5 In-Memory Caches (`caches`)
- **Protocol:** Redis `INFO`, Memcached `stats`.
- **Primary Ticketing Queue:** `sre-tier1`

| Metric Key | Name & Description | Default Warn / Crit | Validation Bounds | Rationale for Default | Guiding Pros & Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `memory_fragmentation_ratio` | Redis Memory Fragmentation | 1.50 / 2.00 | 0.80 – 3.00 | Ratio of RSS memory allocated by OS to memory used by Redis. $>1.8$ indicates memory allocator fragmentation. | **Tighten (1.40):** Proactive trigger for jemalloc active defragmentation. |
| `evicted_keys_sec` | Evicted Keys Velocity (keys/s) | 50 / 250 | 0 – 5000 keys/s | Keys are being evicted due to `maxmemory` pressure, degrading cache hit efficiency. | **Tighten (10 keys/s):** Ensures cache size matches active dataset working set. |

---

### Layer 6: Application & Process Layer (APM & Distributed Tracing)

#### 6.1 Application Performance Monitoring (`application_performance_apm`)
- **Protocol:** OTLP gRPC (Port 4317), W3C TraceContext.
- **Primary Ticketing Queue:** `sre-tier1`

| Metric Key | Name & Description | Default Warn / Crit | Validation Bounds | Rationale for Default | Guiding Pros & Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `p99_latency_ms` | P99 Tail Latency (ms) | 50.0 ms / 150.0 ms | 5.0 ms – 5000.0 ms | Measures the slowest 1% of transactions. Directly correlates with customer churn and SLA penalties. | **Tighten (25.0 ms):** Enforces ultra-snappy microservice latency. <br>**Relax (200.0 ms):** Suitable for complex search/checkout endpoints. |
| `error_rate_pct` | HTTP 5xx / Exception Rate (%) | 1.00% / 5.00% | 0.05% – 20.0% | Error rate $>1.0\%$ rapidly consumes 99.9% service SLA error budgets. | **Tighten (0.25%):** Immediate alert for zero-tolerance payment systems. |

#### 6.2 Runtime Metrics (`runtime_metrics`)
- **Protocol:** JVM JMX, Go runtime metrics, Node.js event loop inspector.
- **Primary Ticketing Queue:** `sre-tier1`

| Metric Key | Name & Description | Default Warn / Crit | Validation Bounds | Rationale for Default | Guiding Pros & Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `jvm_gc_pause_duration_ms` | JVM Stop-The-World GC Pause (ms) | 250 ms / 1000 ms | 10 ms – 5000 ms | Long GC pauses freeze all threads, causing health-check timeouts and microservice disconnects. | **Tighten (100 ms):** Enforces modern low-latency collectors (ZGC, Shenandoah). |
| `node_event_loop_lag_ms` | Node.js Event Loop Lag (ms) | 20.0 ms / 100.0 ms | 1.0 ms – 500.0 ms | Event loop lag $>20ms$ indicates synchronous CPU-heavy work is blocking asynchronous I/O execution. | **Tighten (10.0 ms):** Prevents request queuing in Node.js services. |

---

### Layer 7: Logs, Events & Security (SIEM / Auditing)

#### 7.1 Centralized Logging (`centralized_logging`)
- **Protocol:** Vector / Fluentbit / Rsyslog forwarding, local regex indexer.
- **Primary Ticketing Queue:** `secops-threat`

| Metric Key | Name & Description | Default Warn / Crit | Validation Bounds | Rationale for Default | Guiding Pros & Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `critical_error_logs_sec` | Panic / Fatal Error Velocity | 5 / 25 (Op: `>=`) | 0 – 500 logs/s | Spike in panic or fatal logs indicates uncaught exception storm or service crash loop. | **Tighten (1 log/s):** Catches sporadic fatal errors immediately. |

#### 7.2 Audit & IAM Monitoring (`audit_iam_monitoring`)
- **Protocol:** Linux `auditd`, Windows Security Log (`EventID 4624/4625`), CloudTrail.
- **Primary Ticketing Queue:** `secops-threat`

| Metric Key | Name & Description | Default Warn / Crit | Validation Bounds | Rationale for Default | Guiding Pros & Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `failed_root_logins_min` | Failed Root / Admin Logins | 3 / 8 (Op: `>=`) | 0 – 50 attempts | Multiple failed logins within a minute indicate active brute-force or credential stuffing. | **Tighten (1 attempt):** Strict security policy for hardened bastion hosts. |
| `unauthorized_sudo_attempts` | Privilege Escalation Attempts | 1 / 3 (Op: `>=`) | 0 – 20 events | Indicates unauthorized users attempting sudo or exploiting setuid binaries. | **Non-negotiable:** Must alert immediately on 1 event. |

#### 7.3 Security & Zero-Egress Compliance (`security_compliance`)
- **Protocol:** Local kernel eBPF socket filter, FIM SHA-256 hash table.
- **Primary Ticketing Queue:** `secops-threat`

| Metric Key | Name & Description | Default Warn / Crit | Validation Bounds | Rationale for Default | Guiding Pros & Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ebpf_blocked_wan_packets` | Intercepted External WAN Packets | 1 / 1 (Op: `>=`) | 0 – 0 packets | **Theorem 2 Zero-Egress Guarantee:** Any attempt by an in-VPC process to send packets to a public WAN IP is blocked by eBPF and must fire a P0 security incident. | **Zero-Tolerance:** Must always remain 0. Non-zero triggers immediate host isolation. |
| `fim_checksum_drift_files` | Binary Checksum Drift Files | 1 / 1 (Op: `>=`) | 0 – 0 files | Modifying files in `/bin`, `/sbin`, `/usr/bin` indicates malware, rootkits, or unauthorized binary tampering. | **Zero-Tolerance:** Immediate P0 security incident. |

---

## 5. Collector CLI Usage & Execution Guide

### Single-Command Sweeps
Run the full 7-layer collector suite locally:
```bash
# Sweep all 7 layers (Zero-Egress verified)
python scripts/run_fullstack_collectors.py

# Sweep only Layer 1 (Physical DC) and Layer 5 (Databases & Middleware)
python scripts/run_fullstack_collectors.py -l 1 -l 5

# Export sweep telemetry to JSON without printing to stdout
python scripts/run_fullstack_collectors.py -o /tmp/telemetry-sweep.json -q
```

### Windows PowerShell Launcher
```powershell
# Run all layers
.\scripts\run_fullstack_collectors.ps1

# Run specific layers (e.g. 1, 5)
.\scripts\run_fullstack_collectors.ps1 -Layers "1,5"
```

### Linux Shell Launcher
```bash
# Run all layers
./scripts/run_fullstack_collectors.sh

# Run specific layers
./scripts/run_fullstack_collectors.sh "1,5,7"
```

### Live REST API Endpoint
Trigger an on-demand sweep via HTTP within the VPC:
```bash
curl -X POST http://127.0.0.1:8000/v1/telemetry/collectors/sweep \
  -H "Content-Type: application/json" \
  -d '{"layers": [1, 5], "spool_to_ticketing": true}'
```

---

## 6. Document History & Approvals

| Version | Date | Author / Role | Changes |
| :--- | :--- | :--- | :--- |
| `v1.0.0` | 2026-10-29 | Core SRE Architecture Team | Initial comprehensive 7-layer metrics catalog, Oracle & MS SQL Server monitoring specifications, guiding threshold pros/cons analysis, and enterprise ticketing tool zero-egress spool integration. |

