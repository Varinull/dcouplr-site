# Network Hierarchy Specification: Global Accelerators, VPC Load Balancers & Node Targets

**Document Identifier:** SPEC-NET-HIERARCHY-2026-001  
**System:** `<dcouplr/>`: Zero-Egress In-VPC Observability & IaC Transpiler  
**Classification:** Enterprise Engineering Specification  
**Status:** Approved Technical Standard  
**Date of Record:** October 26, 2026  

---

## 1. Executive Architecture & Systems Model

In enterprise cloud and on-premises hybrid architectures, ingress networking is organized into a **strict 3-tier hierarchy**. Conflating these layers leads to broken state migrations, misconfigured security boundaries, and volumetric billing leakage.

`<dcouplr/>` models and captures each tier distinctly in its Universal Intermediate Representation (`UITGraph`):

```text
+===================================================================================================+
|  TIER 1: GLOBAL / WAN EDGE INGRESS (Above-VPC)                                                    |
|  -----------------------------------------------------------------------------------------------  |
|  - AWS Global Accelerator | GCP Anycast VIP | Azure Front Door | Cloudflare Magic | BGP Anycast   |
|  - Scope: Operates outside and across regional VPCs; ingests traffic at Anycast PoPs worldwide.   |
|  - Graph Node: `network.global_accelerator`                                                       |
+===================================================================================================+
                                                |
                                                |  [ROUTES_TO]  (Cross-Region / Cross-Cloud / Hybrid)
                                                v
+===================================================================================================+
|  TIER 2: VPC / NETWORK INFRASTRUCTURE TIER (VPC-Level)                                            |
|  -----------------------------------------------------------------------------------------------  |
|  - AWS ALB/NLB/GWLB | GCP URL Map | Azure App Gateway | F5 BIG-IP Appliance | Citrix ADC NetScaler|
|  - Scope: Lives inside private VPC subnets; manages SSL termination, routing tables, and security.|
|  - Graph Node: `network.load_balancer` (Bound to `network.vpc` and `network.subnet`)              |
+===================================================================================================+
                                                |
                                                |  [ROUTER_FOR] -> Target Groups & Routing Pools
                                                v
+===================================================================================================+
|  TIER 3: SERVER / NODE TARGET TIER (Compute & Container Level)                                    |
|  -----------------------------------------------------------------------------------------------  |
|  - EC2 Instances | GCE VMs | K8s Pod IPs (NEGs) | Bare-Metal Servers | Serverless Functions       |
|  - Scope: Workloads executing application logic; registered as listener endpoints behind LBs.     |
|  - Graph Node: `compute.instance` / `container.kubernetes_nodepool` registered to Target Group     |
+===================================================================================================+
```

---

## 2. Exhaustive Attribute Capture Matrix

Below is the definitive catalog of all metadata, parameters, and telemetry attributes captured by `<dcouplr/>` at each tier:

### 2.1 Tier 1: Global / WAN Edge Ingress (`network.global_accelerator`)

| Field / Attribute | Data Type | Description | Cloud & On-Prem Examples |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Unique entity identifier | `aws_globalaccelerator_accelerator.prod_edge` |
| `name` | `string` | Resource name | `prod-global-anycast` |
| `accelerator_type` | `string` | Architecture classification | `AWS Global Accelerator`, `GCP Global Anycast VIP`, `Azure Front Door`, `BGP Anycast Edge Router` |
| `routing_type` | `string` | Ingress mechanism | `Anycast BGP Edge VIP`, `Layer 7 Global HTTP Anycast`, `DNS Geo-Steering` |
| `ip_address_type` | `enum` | IP Protocol Version | `IPV4`, `DUAL_STACK` |
| `static_ips` | `list[string]` | Fixed Anycast IP addresses | `["15.197.142.18", "15.197.142.19"]`, `["34.120.218.44"]` |
| `flow_logs_enabled` | `bool` | Edge traffic telemetry logging | `true` (Emitted to internal in-VPC ring buffer) |
| `endpoint_groups` | `list[dict]` | Regional VPC endpoints & dials | `region: "us-east-1", traffic_dial_percentage: 100.0, health_check_port: 443` |
| `client_affinity` | `enum` | Session persistence at edge | `NONE`, `SOURCE_IP` |

---

### 2.2 Tier 2: VPC Network Infrastructure Tier (`network.load_balancer`)

| Field / Attribute | Data Type | Description | Cloud & On-Prem Examples |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Unique entity identifier | `aws_lb.public_alb`, `f5_bigip_ltm.chicago_dc1` |
| `name` | `string` | Resource name | `prod-public-alb`, `f5-vip-cluster-01` |
| `load_balancer_type` | `string` | Architectural subtype | `application` (ALB), `network` (NLB), `gateway` (GWLB), `classic` (ELB), `f5_bigip_ltm`, `citrix_adc_netscaler`, `haproxy` |
| `layer` | `string` | OSI Network Layer | `Layer 7 (HTTP/HTTPS)`, `Layer 4 (TCP/UDP/TLS)`, `Layer 3/4 Gateway` |
| `scheme` | `enum` | Ingress boundary | `internet-facing`, `internal` (Private VPC Subnet VIP), `hardware-vip` |
| `vpc_id` | `string` | Bound VPC container | `vpc-aws-prod-01`, `dc-onprem-core-01` |
| `subnets` | `list[string]` | Subnet availability placement | `["subnet-prod-pub-1a", "subnet-prod-pub-1b"]` |
| `security_groups` | `list[string]` | Firewall perimeter bindings | `["sg-prod-web-ingress-443"]` |
| `listeners` | `list[dict]` | Port/protocol entrypoints | `port: 443, protocol: "HTTPS", ssl_policy: "ELBSecurityPolicy-TLS13-1-2-2021-06"` |
| `ssl_certificates` | `list[string]` | Certificate bindings | ACM ARN, Key Vault Secret URI, Local PEM File |
| `default_action` | `dict` | Ingress routing decision | `type: "forward", target_group: "tg-app-prod"` |
| `cross_zone` | `bool` | Cross-AZ load distribution | `true` |
| `hardware_appliance` | `bool` | Physical on-prem hardware flag | `true` (F5 BIG-IP i5800 Dual AC Power, Citrix VPX) |

---

### 2.3 Tier 3: Server / Node Target Tier (`network.load_balancer_target_group`)

| Field / Attribute | Data Type | Description | Cloud & On-Prem Examples |
| :--- | :--- | :--- | :--- |
| `target_group_id` | `string` | Target group identifier | `aws_lb_target_group.app_backend`, `bigip_ltm_pool.app_pool` |
| `target_type` | `enum` | Target registration primitive | `instance` (VM ID), `ip` (Private CIDR IP), `k8s_pod_neg` (GKE NEG / EKS Target), `lambda`, `bare_metal` |
| `protocol` | `string` | Backend pool protocol | `HTTP`, `HTTPS`, `TCP`, `gRPC` |
| `port` | `int` | Backend listening port | `8000`, `8080`, `9092`, `443` |
| `health_check` | `dict` | Probing specifications | `protocol: "HTTP", path: "/healthz", interval: 10, timeout: 5, healthy_threshold: 3, unhealthy_threshold: 2` |
| `routing_algorithm` | `string` | Balancing algorithm | `round_robin`, `least_outstanding_requests`, `ip_hash`, `weighted` |
| `stickiness` | `dict` | Session stickiness rules | `enabled: true, type: "lb_cookie", duration: 86400` |
| `registered_targets` | `list[dict]` | Active compute nodes/servers | `id: "i-0a1b2c3d"`, `ip: "10.100.1.15"`, `port: 8000`, `weight: 100`, `status: "HEALTHY"` |

---

## 3. Dependency Graph Representation (`UITGraph`)

`<dcouplr/>` normalizes these three tiers into a directed acyclic graph (DAG) maintaining full bi-directional lineage:

```json
{
  "schema_version": "1.0.0",
  "source_system": "terraform_hcl",
  "resources": [
    {
      "id": "aws_globalaccelerator_accelerator.prod_edge",
      "name": "prod_edge",
      "resource_type": "network.global_accelerator",
      "source_provider": "aws",
      "properties": {
        "accelerator_type": "AWS Global Accelerator",
        "routing_type": "Anycast Edge VIP",
        "ip_address_type": "IPV4",
        "static_ips": ["15.197.142.18", "15.197.142.19"]
      }
    },
    {
      "id": "aws_lb.public_alb",
      "name": "public_alb",
      "resource_type": "network.load_balancer",
      "source_provider": "aws",
      "properties": {
        "load_balancer_type": "application",
        "layer": "Layer 7 (HTTP/HTTPS)",
        "scheme": "internet-facing",
        "listeners": ["443/HTTPS", "80/HTTP"]
      }
    },
    {
      "id": "aws_lb_target_group.api_backend",
      "name": "api_backend",
      "resource_type": "network.load_balancer_target_group",
      "source_provider": "aws",
      "properties": {
        "target_type": "ip",
        "protocol": "HTTP",
        "port": 8000,
        "health_check_path": "/healthz"
      }
    },
    {
      "id": "aws_instance.api_node_01",
      "name": "api_node_01",
      "resource_type": "compute.instance",
      "source_provider": "aws",
      "properties": {
        "private_ip": "10.100.1.15",
        "instance_type": "c6i.xlarge"
      }
    }
  ],
  "edges": [
    {
      "source_id": "aws_globalaccelerator_accelerator.prod_edge",
      "target_id": "aws_lb.public_alb",
      "relationship": "ROUTES_TO"
    },
    {
      "source_id": "aws_lb.public_alb",
      "target_id": "aws_vpc.production_vpc",
      "relationship": "ATTACHED_TO"
    },
    {
      "source_id": "aws_lb.public_alb",
      "target_id": "aws_lb_target_group.api_backend",
      "relationship": "ROUTER_FOR"
    },
    {
      "source_id": "aws_lb_target_group.api_backend",
      "target_id": "aws_instance.api_node_01",
      "relationship": "DISTRIBUTES_TO"
    }
  ]
}
```

---

## 4. Multi-Cloud & On-Premises Cross-Compilation Rules

When transpiling between providers, `<dcouplr/>` maps each tier to its direct equivalent:

### 4.1 Tier 1: Global Edge Transpilation
* **AWS Global Accelerator** &rarr; **Google Cloud Global External Anycast Forwarding Rule** (`load_balancing_scheme = "EXTERNAL_MANAGED"`) or **Azure Front Door Standard/Premium**.
* Preserves Anycast global routing invariants and eliminates multi-region DNS failover latency.

### 4.2 Tier 2: Load Balancer Transpilation
* **AWS ALB (Layer 7)** &rarr; **Google Cloud URL Map (`google_compute_url_map`) + Target HTTP(S) Proxy** &rarr; **Azure Application Gateway v2**.
* **AWS NLB (Layer 4)** &rarr; **Google Cloud Regional Passthrough Backend Service (`google_compute_region_backend_service`)** &rarr; **Azure Standard Load Balancer (Layer 4)**.
* **F5 BIG-IP LTM (On-Premises)** &rarr; Transpiled into **Google Cloud Application Load Balancer** with Cloud Armor WAF policies or OpenTofu HCL modules, eliminating recurring hardware maintenance fees ($45k/appliance).

### 4.3 Tier 3: Target Group & Health Probes Transpilation
* `aws_lb_target_group` with `health_check.path = "/healthz"` &rarr; `google_compute_health_check` with `http_health_check.request_path = "/healthz"` &rarr; `azurerm_application_gateway` probe with `path = "/healthz"`.

---

## 5. Verification & Telemetry Invariants

1. **Zero-Egress Invariant:** All load balancer definitions and node targets are parsed and stored in volatile memory with **0 bytes external WAN telemetry**.
2. **FinOps Cost Impact:** Identifying whether an ingress is an **Edge Accelerator** vs **Regional ALB** vs **Internal NLB** directly impacts billing analysis:
   - AWS Global Accelerator: Fixed fee ($0.025/hr) + Data Transfer-Premium (DT-P).
   - AWS ALB: Fixed fee ($0.0225/hr) + LCU hours.
   - Internal Passthrough LB: $0 data processing fees within the same AZ.
   `<dcouplr/>` models these parameters in `GET /v1/telemetry/finops/cost-comparison` to prove true infrastructure ROI.
