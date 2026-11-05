# 📘 `<dcouplr/>`: Customer Success Transition Playbook: CLI to Enterprise Cluster

**Wordmark & Product Identity:** `<dcouplr/>`  
**Product Descriptor:** The Open-Core Telemetry & Infrastructure Translation Engine  
**Operational & Security Architecture:** Zero-Egress Observability & IaC Transpiler  
**Target Audience:** Technical Customer Success Engineers (CSEs), Solutions Architects, and Technical Account Managers (TAMs)  
**Lifecycle Stage:** Open-Core CLI Inbound to Paid Enterprise Cluster Node Subscription  
**Core Commercial Objective:** Convert free point-in-time CLI users into multi-node enterprise accounts with 92% gross margin efficiency.  

---

## Phase 1: Inbound Trigger & Expansion Identification (Self-Hosted Usage)

*   **Trigger Marker:**  
    A developer team successfully utilizes the free local CLI (`dcouplr translate` or `dcouplr check`) to convert isolated configurations during ad-hoc cloud migration tasks.
*   **The Conversion Wedge:**  
    The team shifts from occasional local scripts to wanting continuous, parallel state alignment across active production environments to ensure zero downtime.
*   **Action Plan:**  
    Schedule a 30-minute Architecture Optimization Review. Position the conversation around infrastructure safety, structural tracking drift, and the limits of running manual scripts at scale.

---

## Phase 2: Technical Evaluation & The "Zero-Exfiltration" Verification Hook

*   **Addressing Procurement & InfoSec Fears:**  
    Enterprise buyers often fear cloud telemetry egress and third-party SaaS data leaks. Demonstrate that the agent runs as an immutable distroless container (`UID 65532`) completely inside their VPC/on-premises network fence.
*   **Live POC Setup (The Value Proof):**  
    Help the client deploy our automated `verify_all.sh` flow inside an isolated staging namespace. Show them live how the **20ms asymmetric circuit breaker** drops stalled downstream destinations instantly to protect production buffer memory.
*   **Value-Aligned vs. Volumetric Savings Presentation:**  
    Provide a direct cost comparison showing how locking in a flat node-bracket subscription ($18k, $45.6k, or $102k ACV) eliminates punitive, unpredictable volumetric data ingestion fees.

---

## Phase 3: Cluster Onboarding & Post-Sale Expansion

*   **Quorum Initialization:**  
    Provide the client with the pre-verified `bootstrap.json` schema to spin up their embedded 3-node HashiCorp Raft cell over secure local mutual TLS (mTLS).
*   **Automating Key Management:**  
    Deploy the `spire-registrar.conf` admission webhook engine to automatically distribute transient X.509 SVID tokens to newly scheduled nodes via Kubernetes ServiceAccounts in under 50ms.
*   **Establishing the Hand-off:**  
    Transition the client to a dedicated TAM review cadence. Monitor their cluster telemetry and node counts through the provisioned Grafana health dashboards (`decoupler-health.json`) to track cluster expansion milestones.

---

## Customer Success Milestone & Conversion Scorecard

| Phase | Operational Milestone | Success Criteria | Commercial Conversion Gate |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Local CLI check execution | Zero syntax errors on alerting rules | Architecture Optimization Review booked |
| **Phase 2** | Staging VPC deployment & `verify_all.sh` | Sub-20ms latency & circuit breaker verification | Enterprise Security Sign-off & Procurement Approval |
| **Phase 3** | Production Raft cluster provisioning | 3-node consensus quorum active with SPIFFE mTLS | Annual Cluster Node Contract executed ($45.6K+ ARR) |
