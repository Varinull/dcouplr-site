# SRE & Migration Runbook: `/liftnshift` Console, Side-by-Side Object Parity & Historical Audit Ledger

**Document ID:** `VA-RUNBOOK-LNS-001`  
**Classification:** Enterprise ITIL Service Operation & Migration Engineering Runbook  
**Audience:** Lead Migration Architects, Systems Integrators, SREs, and Audit Compliance Officers  
**Platform Scope:** `<dcouplr/>` Migration Suite (`/liftnshift`, `/lift-and-shift`, `/stage-migration`)

---

## 1. Executive Summary & Purpose

The **`/liftnshift` Console** in `<dcouplr/>` provides a dedicated, high-fidelity operational workspace for multi-cloud infrastructure migrations, cross-cloud cutovers, and zero-downtime replication waves.

Unlike generic lift-and-shift scripts or opaque migration tools, `/liftnshift` delivers three mission-critical capabilities:
1. **Interactive Side-by-Side Object Comparison**: Real-time visual comparison between the source infrastructure (As-Is) and the transpiled target infrastructure (To-Be), covering subnets, compute instances, database engines, security perimeters, and OpenTofu IaC.
2. **Automated End-to-End Regression & Functionality Testing**: A 5-suite pre-flight and post-cutover verification engine verifying schema fidelity, binary data parity, zero egress leaks, performance benchmarks, and rollback drills.
3. **Permanent Historical Activity & Audit Ledger**: An immutable chronological audit ledger recording every migration wave, test run, duration, transfer rate, and cryptographic SHA-256 attestation for future reference and support.

A prominent navigation link (`← Return to SRE Dashboard`) on the upper right side allows operators to seamlessly move between live multi-VPC operations and migration staging.

---

## 2. Navigating to the Console

The console is accessible via any of the following canonical URLs:
* `http://localhost:8000/liftnshift` (Primary route)
* `http://localhost:8000/lift-and-shift` (Hyphenated alias)
* `http://localhost:8000/stage-migration` (Lifecycle alias)
* Direct 1-Click Access: Click the **`⚡ Stage Migration`** button in the top toolbar of `/dashboard` or `/NOCDesk`.

---

## 3. Core Modules & Operational Workflows

### Module A: Parameter Configuration & Target Scoping
Operators define the source and target boundaries:
* **Source Environment (As-Is)**: Selects from active VPCs or on-premises datacenters (e.g. `dc-onprem-core-01`, `vpc-aws-prod-01`, `vnet-azure-core-01`, `vpc-gcp-analytics-03`).
* **Target Hyperscaler (To-Be)**: Google Cloud Platform (GCP), Amazon Web Services (AWS), or Microsoft Azure.
* **Target Destination Region**: E.g., `us-central1`, `us-east-1`, `eastus2`.
* **Target Supernet CIDR**: E.g., `10.200.0.0/16` (enforcing strict hierarchical nesting of `/24` subnets).

### Module B: Side-by-Side Object Comparison Matrix
The dual-column view guarantees zero surprises during cutover:
* **Source Architecture (Left Pane)**:
  * Supernet CIDR blocks and IP allocation tables
  * In-guest compute daemons, vCPU, and memory baselines
  * Source database specifications (PostgreSQL, Oracle, MySQL, SQL Server)
  * Security group rules, network ACLs, and IAM roles
* **Transformation Vector (Center)**:
  * Visual status tags: `100% PARITY`, `0 CONFLICTS`, `ZERO EGRESS`
* **Target Architecture (Right Pane)**:
  * Transpiled target subnets with non-overlapping `/24` CIDRs
  * Managed cloud database targets (Cloud SQL, AlloyDB, Aurora, Azure Database)
  * Transpiled firewall rules and least-privilege cloud IAM service accounts

### Module C: Automated End-to-End Regression Testing Suite
Before approving any production traffic cutover, operators trigger the 5-suite regression drill:
1. **Schema & DDL Parity Regression**: Compares all table definitions, column types, constraints, foreign keys, indexes, and character collations.
2. **Binary Data Fidelity & Invariant Checks**: Evaluates all 122 invariant checks across replicated storage blocks with zero tolerance for row loss or truncation.
3. **Network Isolation & Zero-Egress Guard**: Verifies in-perimeter reachability and certifies $0.00 cloud egress.
4. **Performance SLA & Query Benchmark**: Synthetic read/write latency benchmarking between source and target.
5. **Synthetic Transaction Replay & Rollback Drill**: Dual-write synchronization test and sub-30-second automated rollback readiness verification.

### Module D: Historical Activity Ledger & Audit Compliance
Every staging execution and regression drill is automatically recorded into the **Historical Activity Ledger**:
* **Run ID**: Unique wave identifier (e.g., `LNS-20261030-914`)
* **Timestamp**: ISO 8601 execution time
* **Source -> Target**: Exact VPC and CIDR mapping
* **Scope**: Objects, subnets, instances, and databases
* **Regression Status**: Score breakdown (e.g., `5/5 Passed`)
* **Duration & Transfer Rate**: Elapsed time and throughput
* **Attestation Signature**: Cryptographic SHA-256 hash for audit proof
* **Export Capability**: Instant 1-click export as an audit-ready JSON package via `📥 Export Audit JSON`.

---

## 4. Verification & Operational Health Check

To verify that `/liftnshift` is active and nominal:
```bash
# Verify HTTP 200 response and content integrity
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/liftnshift
```
Expected output: `200`

---

## 5. Architectural Alignment & Governance

The `/liftnshift` console is part of the **`<dcouplr/>` Migration Suite**, designed to operate side-by-side with the **`<dcouplr/>` Full-Stack Suite** to provide end-to-end coverage from Day-0 migration planning to Day-2 continuous zero-egress monitoring.
