# 📅 <dcouplr/>: Year 1 Engineering Product Roadmap & Sprint Milestones

**Wordmark & Product Identity:** `<dcouplr/>`  
**Core Descriptor:** The Open-Core Telemetry & Infrastructure Translation Engine  
**Operational & Security Architecture:** Zero-Egress Observability & IaC Transpiler  
**Document ID:** ENG-ROADMAP-Y1-001  

This Year 1 product-led growth (PLG) roadmap aligns our engineering delivery across a standard 4-quarter delivery model, using 2-week sprint windows to guarantee that we deliver on every capability promised across telemetry and multi-cloud infrastructure modules with zero volumetric egress.

```text
[ <dcouplr/> Year 1 Core Engineering Milestone Grid ]
Q1: Open-Core Wedge     Q2: Cluster Scale       Q3: Compute & State     Q4: Hardened Compliance
|-----------------------|-----------------------|-----------------------|-----------------------|
* Open-Core CLI Wedge   * Embedded Raft Engine  * ComputeGraph Engine   * Air-Gapped Bundles
* Datadog & NRQL Lexer  * Go-Python gRPC Bridge * Terraform-to-OpenTofu * FIPS / FedRAMP Audit
* Standalone Homebrew   * Local In-VPC RingBuf  * State Migration Plans * Signed Offline SBOM
* Mathematical Parity   * SPIFFE / mTLS Mesh    * Kubernetes & Cloud RDS* Continuous GitOps
```

---

## Quarter 1: The Land Wedge — Open-Core Telemetry Ingestion & CLI Distribution (Sprints 1–6)
* **Core Objective:** Drive friction-free developer adoption by stabilizing the stateless local open-core CLI wedge (`brew install dcouplr` / `dcouplr translate`).
* **Sprint Deliverables:**
  * **Sprints 1–2:** Stabilize the core AST transpiler (`migration_tools/parsers/datadog_monitor.py` and `migration_tools/generators/grafana_alert.py`) handling Datadog monitor-to-Grafana 11 Unified Alerting and PromQL with mathematical identity parity ($\Phi(q) \equiv \Psi(\text{PromQL})$).
  * **Sprints 3–4:** Package the open-core CLI as a standalone, zero-dependency statically linked binary distributed via Homebrew (`brew install dcouplr`), PyPI (`pip install dcouplr`), and distroless container images (`ghcr.io/jhaiceylee/dcouplr`).
  * **Sprints 5–6:** Expand multi-vendor DSL lexers to ingest **NRQL (New Relic)** and **CloudWatch metric math alarms** into the Unified Intermediate Representation (`UITGraph`), and integrate automated `dcouplr check` verification gates into GitHub Actions.

---

## Quarter 2: The Core Cluster — In-VPC Zero-Egress Scale (Sprints 7–12)
* **Core Objective:** Launch the commercial enterprise synchronization layer using embedded HashiCorp Raft and zero-egress local memory execution.
* **Sprint Deliverables:**
  * **Sprints 7–8:** Implement the `go-spiffe` mTLS network dialers and SPIFFE Workload API integrations across active cluster node transport layers.
  * **Sprints 9–10:** Complete the asynchronous BoltDB log compaction and WAL snapshotting engine to strictly enforce the 256Mi memory cap and prevent memory leaks.
  * **Sprints 11–12:** Deploy the bidirectional gRPC bridge between the Python FastAPI web telemetry layer and the Go Raft consensus process, enabling live multi-VPC topology and circuit breaker metrics streaming without simulation.

---

## Quarter 3: The Expand Wedge — Infrastructure-as-Code & State Migration (Sprints 13–18)
* **Core Objective:** Complete the Infrastructure-as-Code (IaC) transpiler capabilities, bridging observability topology with cloud resources.
* **Sprint Deliverables:**
  * **Sprints 13–14:** Expand the `TerraformHCLParser` and `OpenTofuGenerator` resource catalog beyond compute/networking to cover Kubernetes clusters (EKS/GKE), relational databases (RDS/Cloud SQL), object storage (S3/GCS), and IAM/security policies.
  * **Sprints 15–16:** Implement automated **state migration plan generation** (`tofu state mv` / `tofu import` scripts) allowing enterprises to migrate cloud infrastructure from Terraform to OpenTofu without resource downtime or destructive recreation.
  * **Sprints 17–18:** Activate dynamic bi-directional graph correlation (`UITGraph`) linking cloud infrastructure components directly to active alerting rules and log monitor definitions.

---

## Quarter 4: Hardened Compliance & Air-Gapped Enterprise Distribution (Sprints 19–24)
* **Core Objective:** Deliver enterprise-grade air-gapped distribution tooling, zero-CVE posture, and institutional compliance readiness.
* **Sprint Deliverables:**
  * **Sprints 19–20:** Package the complete platform into production-grade enterprise Helm charts bundled with Prometheus Operator ServiceMonitors and Kubernetes GitOps controllers (`PreflightSyncController`).
  * **Sprints 21–22:** Build the automated **Air-Gapped Offline Release Pipeline**, producing signed offline `.tar.gz` bundles with pre-cached container images, SHA-256 manifests, `cosign` cryptographic signatures, and CycloneDX/SPDX SBOMs.
  * **Sprints 23–24:** Conduct continuous high-load chaos engineering drills (simulating full Raft partition, network dropouts, and etcd control-plane drops) to establish audited FedRAMP/SOC2 Type II security baselines.
