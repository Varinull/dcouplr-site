# 📂 `<dcouplr/>`: Enterprise Architecture — Field Engineering Knowledge Base

**Wordmark & Product Identity:** `<dcouplr/>`  
**Product Descriptor:** The Open-Core Telemetry & Infrastructure Translation Engine  
**Operational & Security Architecture:** Zero-Egress Observability & IaC Transpiler  

This shared workspace framework provides Solutions Engineers (SEs) and Technical Account Managers (TAMs) with an easily navigable, single source of truth to confidently unblock enterprise customers during onboarding and production sync operations.

---

## 1. 🚀 Deployment & Attestation Blueprints

*   **1.1 SPIFFE/SPIRE Host Attestation Guide**
    *   Verifying node selector validation logic (AWS Instance Identity Documents vs. K8s ServiceAccounts).
    *   Testing unix socket connectivity via `/run/spire/sockets/agent.sock`.
*   **1.2 Local-First Storage & Log Compaction Tuning**
    *   Configuring production `tmpfs` non-persistent memory mount arrays for high-throughput nodes.
    *   Calibrating `snapshot_threshold` based on active workload query densities.

---

## 2. 🛡️ Security, Sanitization & Compliance Auditing

*   **2.1 Zero-Exfiltration Edge Interception Verification**
    *   How to prove context-free parsing to customer InfoSec teams using `decoupler check`.
    *   Injecting custom regex strings into local rules parameters to block internal PII string variations.
*   **2.2 Air-Gapped Network Topology Patterns**
    *   Configuring isolated `NetworkPolicy` profiles to isolate Raft traffic from multi-tenant user layers.
    *   Setting up private local OCI package repositories using custom Helm `values.yaml` matrices.

---

## 3. 🧠 Advanced Parity Normalization & Compiling

*   **3.1 Datadog query to PromQL Math Equivalence Resolution**
    *   Remapping complex rolling window configurations (e.g., matching source `avg(last_10m)` filters).
    *   Handling anomalous metric namespace translations and custom tag-to-label structural conversions.

---

## 4. 🚒 Incident Response, Runbooks & Diagnostics

*   **4.1 RUNBOOK-DECOUPLER-004: Circuit Breaker Recovery**
    *   Triaged responses for asymmetric downstream degradation alarms (`decoupler_cluster_partitions_total`).
    *   Executing soft cluster re-joins using active Cobra engine commands.
*   **4.2 Distributed Raft Quorum Failure Mitigation**
    *   Recovering split-vote deadlocks using localized heartbeat timing profiles.
