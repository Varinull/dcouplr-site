# 🗺️ Quarter 3 Roadmap: Multi-Cloud Compute Graph Expansion

Quarter 3 expands our platform beyond telemetry processing, activating the ComputeGraph translation engine. This allows the system to parse, anonymize, and transpile infrastructure configurations natively across major providers.

```text
[ Quarter 3 Sprint Backlog Milestone Grid ]
Sprints 13–14: IaC Parser       Sprints 15–16: Bicep Emitter    Sprints 17–18: Drift Tracking
|----------------------------|----------------------------|----------------------------|
* AWS CloudFormation Ingest  * Azure Bicep Transpiler     * Relational DB Migration
* Topographical Anonymizer   * Zero-Drift Emitters        * K8s CRD Status Watchers
* ComputeGraph Model Maps    * Statically Typed Maps      * OpenTofu / HCL Parity
```

---

### Sprint 13–14: ComputeGraph Ingestion & Topographical Anonymization
- **Sprint Goal:** Package the baseline Infrastructure-as-Code (IaC) parser to ingest AWS CloudFormation templates and strip out private network topologies before graph generation.
- **Key Deliverables:**
  - Deploy `engine/iac_parser.go` to digest nested JSON/YAML cloud infrastructure payloads.
  - Extend the regex anonymizer to strip private CIDR configurations (`ip-10-X-X-X`) and server taxonomy markers.
  - Map extracted properties securely onto the neutral intermediate representation (`ComputeGraph`).

---

### Sprint 15–16: Cross-Cloud Emitters & Code Generation Parity
- **Sprint Goal:** Deliver zero-drift code emission engines to transpile neutral intermediate data structures directly into production-ready Azure Bicep code.
- **Key Deliverables:**
  - Build out `engine/iac_emitter.go` to map abstract network configurations onto standard Microsoft network definitions.
  - Verify that emitted templates handle complex component groupings (like virtual networks, gateway endpoints, and security lists) with zero translation loss.
  - Run high-volume, multi-threaded translation benchmarks (`BenchmarkIaCTranslationVelocity`) to maintain sub-20ms latency limits.

---

### Sprint 17–18: Infrastructure Drift Logging & CRD Synchronization
- **Sprint Goal:** Deploy database logging tracking engines and native Kubernetes reconcilers to monitor and log cloud architectural drift events.
- **Key Deliverables:**
  - Deploy the `drift_log_events` storage schema migration maps into the central database layers.
  - Configure background controller loops to continuously poll the local database and mirror drift states directly out to the Kubernetes API.
  - Ensure the status reconciliation pipeline patches custom resource states to `READY` within a 15ms execution threshold.

---

### Summary & Synchronization Matrix

| Development Thread | Core Architectural Component | Target Verification Metric | Strategic Security Value |
| :--- | :--- | :--- | :--- |
| **Local Cluster Lab** | Multi-process background loop runner (`scripts/launch_local_cluster.sh`). | Spawns and interconnects 3 local Raft nodes in < 5s. | Provides developers an air-gapped testbed to evaluate quorum stability. |
| **Bootstrapping Parser** | JSON file verification encoder framework (`engine/raft_bootstrap_test.go`). | Parses peer config parameters within a 2ms window. | Enforces strict voter assignments, preventing node initialization errors. |
| **Quarter 3 Roadmap** | Multi-cloud `ComputeGraph` extension framework. | Compiles complex cloud templates while maintaining a < 20ms latency budget. | Eradicates cloud vendor lock-in via abstract, local-first transpilation layers. |
