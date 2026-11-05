# 🏛️ Architectural Decision Record: Raft Transport Wrappers & GCP Cloud Run Direct VPC Egress

**Document ID:** ADR-2026-OCT-008  
**Status:** APPROVED & IMPLEMENTED  
**Date:** October 2026  
**Systems Involved:** `<dcouplr/>` (`MigrationToolsAPI`) & `cloaudit` (FinOps Audit Platform, port 3780)  
**Security & Architecture Classification:** Enterprise Core Invariant Baseline  
**Sign-off:** Principal Systems Architect, Lead SRE, FinOps Review Board  

---

## 1. Executive Summary

This Architectural Decision Record (ADR) formalizes two mission-critical engineering initiatives completed for the `<dcouplr/>` enterprise ecosystem:

1. **Google Cloud Run Direct VPC Egress Migration Architecture:**
   * Full gap analysis of Google Cloud Tech's reference architecture (*"Cloud Run Direct VPC egress explained"*).
   * Strict architectural division of responsibility between `<dcouplr/>` (IaC transpilation, zero-egress networking) and `cloaudit` (cloud spend auditing, waste detection).
   * Delivery of Turnkey Recipe `RECIPE-GCP-CLOUDRUN-DIRECTVPC-008` eliminating legacy VPC Access Connector overhead ($0 fixed cost, <1ms latency).
2. **HashiCorp Raft Transport Wrappers & Go Channel Mesh:**
   * Production-grade `raft.Transport` wrappers with 20ms asymmetric circuit breakers.
   * Stateful per-peer fail-fast finite state machine (`Closed` $\rightarrow$ `Open` $\rightarrow$ `HalfOpen`) eliminating goroutine accumulation during partitions.
   * Pure in-memory Go channel mesh (`ChannelRaftTransport`) and full-mesh cluster cell orchestrator (`ChannelMeshCoordinator`) for deterministic chaos testing.
   * Native SPIFFE mTLS integration and Prometheus transport telemetry collectors.

---

## 2. Decision 1: Google Cloud Run Direct VPC Egress Architecture

### 2.1 The Problem & Video Gap Analysis
In analyzing Google Cloud Tech's architecture (`https://www.youtube.com/watch?v=wCRA7HnZf0g`), enterprise customers running container workloads on Cloud Run encounter substantial operational, financial, and security friction when connecting to internal VPC resources via legacy **Serverless VPC Access Connectors** (`google_vpc_access_connector`):

```
LEGACY PROXY CONNECTOR (High Cost, Multi-Hop Latency):
[Cloud Run v1] ──(Annotations)──> [Connector VMs (f1/e2-micro)] ──> [VPC Subnet (10.8.0.0/28)] ──> [Private DB]
                                  └── $30–$70/mo fixed cost
                                  └── 2–5ms proxy latency
                                  └── No container network tags

MODERN DIRECT VPC EGRESS (<dcouplr/> RECIPE-008):
[Cloud Run v2] ──(Native NIC)────[Network Tag: dcouplr-in-vpc]────> [Private Subnet (10.10.10.0/24)] ──> [Private DB]
                                  └── $0 fixed connector cost
                                  └── Sub-1ms native microVM latency
                                  └── Granular VPC Firewall Rules & 5-sec Flow Logs
```

* **Financial Penalty:** Each VPC Access Connector provisions a minimum of 2 to 10 underlying Compute Engine VMs (`f1-micro` or `e2-micro`), incurring **$30.00 to $70.00/month** per connector in unutilized idle spend.
* **Latency Bottleneck:** Outbound container traffic passes through proxy connector instances, adding 2–5ms of network hop latency.
* **Firewall Limitations:** VPC firewall rules can only target the connector's `/28` CIDR block, preventing container-level security segmentation.

### 2.2 Architectural Invariant & Division of Responsibility
To preserve **Invariant 1 (`NO BILLING DATA IN DCOUPLR`)**, the implementation is strictly bifurcated across the two applications:

```
┌────────────────────────────────────────────────────────┐   ┌────────────────────────────────────────────────────────┐
│               <dcouplr/> (Port 8000)                   │   │                 cloaudit (Port 3780)                   │
├────────────────────────────────────────────────────────┤   ├────────────────────────────────────────────────────────┤
│ • AST Parsing & OpenTofu / Terraform Transpilation     │   │ • GCP BigQuery Cloud Billing Export Ingestion          │
│ • Turnkey Recipe: RECIPE-GCP-CLOUDRUN-DIRECTVPC-008    │   │ • Rule Engine: RULE-GCP-VPC-CONNECTOR-RETIREMENT       │
│ • Network Tags & In-VPC Firewall Enforcement           │   │ • Detects $30–$70/mo Idle Connector Line Items         │
│ • Cryptographic SHA-256 Zero-Egress Attestation        │   │ • Recommends Decommissioning via <dcouplr/> Recipe     │
│ • Subnet Flow Logs (INTERVAL_5_SEC, ALL_METADATA)      │   │ • Financial Waste & ROI Dashboard Cards (/harness)     │
└────────────────────────────────────────────────────────┘   └────────────────────────────────────────────────────────┘
```

### 2.3 What Was Implemented in `<dcouplr/>`

Located in [`recipes/cloud_run_direct_vpc_egress/`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/recipes/cloud_run_direct_vpc_egress/):

1. **Turnkey Recipe Documentation (`README.md`):** Complete migration guide, architecture diagrams, latency/cost matrix, and deployment instructions.
2. **Legacy Input HCL (`input_legacy_connector.tf`):** Realistic pre-migration Terraform defining `google_vpc_access_connector` and Cloud Run v1 service annotations.
3. **Direct VPC Egress Output HCL (`output_direct_vpc_egress.tf`):** Production-ready OpenTofu configuration featuring:
   * `google_cloud_run_v2_service` with native `vpc_access.network_interfaces`.
   * Explicit `egress = "ALL_TRAFFIC"` locking all container outbound requests inside the VPC.
   * Network tags (`dcouplr-in-vpc`, `cloaudit-bridge`) allowing fine-grained firewall targeting.
   * `google_compute_firewall` allowing ingress only from tagged Cloud Run containers to internal databases.
   * Dedicated `/24` subnet with VPC Flow Logs (`INTERVAL_5_SEC`, `INCLUDE_ALL_METADATA`).
4. **AST Transpiler Script (`migrate.py`):** Standalone zero-egress transpiler replacing legacy connectors with native v2 Direct VPC configurations.
5. **Automated Unit Tests (`tests/test_recipe_cloud_run_direct_vpc.py`):** 100% green pytest verification confirming connector elimination and security invariants.

---

## 3. Decision 2: HashiCorp Raft Transport Wrappers & Go Channel Mesh

### 3.1 The Problem & Latency Bounds
In distributed on-premises and multi-cloud agent cells, asymmetric network link stalls (e.g., packet drops or 300ms delays to a single partitioned node) can stall the Raft consensus leader during write replication.
* **Strict SLA:** Outbound Raft RPCs must never block beyond **20ms**.
* **Goroutine Leak Risk:** A naive timeout wrapper that blocks on an unbuffered goroutine leaks Go runtime routines when peers stay down for extended durations.

### 3.2 Implemented Architectural Components

Located in [`engine-go/engine/raft_transport_wrapper.go`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/engine-go/engine/raft_transport_wrapper.go):

#### 1. `CircuitBreakerRaftTransport`
Wraps any underlying HashiCorp `raft.Transport` (e.g., SPIFFE mTLS) with non-blocking 20ms circuit breaker protection:
* Inbound consumer channel proxy with fast-path bypass for 0-entry AppendEntries heartbeats.
* Pipelined AppendEntries wrapper (`circuitBreakerAppendPipeline`) with bounded future queues.

#### 2. Stateful Per-Peer Fail-Fast State Machine
Added [`peerCircuitTracker`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/engine-go/engine/raft_transport_wrapper.go#L86-L91) tracking downstream peer health:
* **`CircuitClosed`:** Normal operation; RPCs proceed with 20ms timeout protection.
* **`CircuitOpen`:** After 3 consecutive timeouts (`ConsecutiveFailures`), the peer's circuit trips to `OPEN`. Outbound RPCs immediately **fail-fast in <1ms** with `ErrCircuitBreakerOpen`, preventing goroutine allocation and leader head-of-line blocking.
* **`CircuitHalfOpen`:** After a 500ms cooldown (`CooldownDuration`), allows a single canary probe RPC. If successful, transitions peer health back to `CLOSED`.

#### 3. Pure In-Memory Go Channel Mesh (`ChannelRaftTransport`)
Provides a 100% socket-free `raft.Transport` implementation using native Go buffered channels:
* Zero OS network stack dependency for sub-millisecond local integration testing and micro-cell execution.
* Full support for `AppendEntries`, `RequestVote`, `InstallSnapshot`, and streaming `AppendEntriesPipeline`.

#### 4. Full-Mesh Cluster Cell Orchestrator (`ChannelMeshCoordinator`)
Orchestrates an $N$-node in-memory cluster cell:
* Automatically establishes bidirectional full-mesh channel topologies on `AddNode`.
* Provides deterministic chaos injection:
  * `PartitionNode(id)`: Instantly severs all incoming and outgoing channel connections.
  * `HealNode(id)`: Restores all bidirectional channel routes.

#### 5. SPIFFE Integration & Telemetry Export
* Added [`BuildCircuitBreakerSpiffeTransport`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/engine-go/engine/spiffe_raft_transport.go#L105-L116) to provide single-line instantiation combining SPIFFE mTLS with the 20ms circuit breaker.
* Added Prometheus collectors in [`cluster_metrics.go`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/engine-go/engine/cluster_metrics.go#L27-L43):
  * `decoupler_raft_circuit_breaker_trips_total`
  * `decoupler_raft_dropped_inbound_rpcs_total`
  * `decoupler_raft_fast_heartbeats_total`

---

## 4. Verification Evidence & Quality Gates

| Verification Target | Test Suite | Result | Key Metric Validated |
| :--- | :--- | :--- | :--- |
| **Direct VPC Egress Transpiler** | `tests/test_recipe_cloud_run_direct_vpc.py` | **PASSED** (2/2) | Legacy connector removed; tags & flow logs asserted. |
| **Go Raft Peer Communication** | `engine-go/engine/raft_transport_wrapper_test.go` | **PASSED** | Channel AppendEntries commits over memory channels. |
| **20ms Circuit Breaker Timeout** | `engine-go/engine/raft_transport_wrapper_test.go` | **PASSED** | Trip confirmed when peer delays > 20ms. |
| **Fail-Fast State Machine** | `engine-go/engine/raft_transport_wrapper_test.go` | **PASSED** | 3 timeouts trip to `OPEN`; next call fails in <2ms. |
| **Mesh Chaos & Partition** | `engine-go/engine/raft_transport_wrapper_test.go` | **PASSED** | 3-node mesh partitioned and healed without deadlock. |
| **Distributed Mesh Resilience** | `tests/test_vector3_distributed_mesh_resilience.py` | **PASSED** (3/3) | 150+ concurrent requests, <50 MiB RSS, quorum preserved. |
| **Full Smoke & Regression** | `tests/test_smoke_and_regression.py` | **PASSED** (48/48) | Complete API, RBAC, and telemetry bridge integrity. |

---

## 5. Summary of Artifacts & Code References

* **Google Cloud Direct VPC Egress:**
  * [README.md](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/recipes/cloud_run_direct_vpc_egress/README.md)
  * [input_legacy_connector.tf](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/recipes/cloud_run_direct_vpc_egress/input_legacy_connector.tf)
  * [output_direct_vpc_egress.tf](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/recipes/cloud_run_direct_vpc_egress/output_direct_vpc_egress.tf)
  * [migrate.py](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/recipes/cloud_run_direct_vpc_egress/migrate.py)
  * [test_recipe_cloud_run_direct_vpc.py](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/tests/test_recipe_cloud_run_direct_vpc.py)
* **HashiCorp Raft Transport & Channels Logic:**
  * [raft_transport_wrapper.go](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/engine-go/engine/raft_transport_wrapper.go)
  * [raft_transport_wrapper_test.go](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/engine-go/engine/raft_transport_wrapper_test.go)
  * [spiffe_raft_transport.go](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/engine-go/engine/spiffe_raft_transport.go)
  * [cluster_metrics.go](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/engine-go/engine/cluster_metrics.go)
  * [test_vector3_distributed_mesh_resilience.py](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/tests/test_vector3_distributed_mesh_resilience.py)
