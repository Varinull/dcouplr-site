# Technical Support Verification Checklist for Field Engineering

**Document Classification:** SRE & Field Engineering Runbook  
**Target Roles:** Solutions Engineers (SEs), Technical Account Managers (TAMs), Tier-2/Tier-3 Support  
**Scope:** Customer Onboarding Verification & P1 Escalation Diagnostics  

---

## Phase 1: Cryptographic Node Attestation Validation

*   **Socket Boundary Verification**: Run low-level connection diagnostics inside the agent container space to ensure the workload API path functions correctly:
    ```bash
    # Execute inside the distroless runtime boundary using local agent capabilities
    /app/decoupler status --config=/etc/decoupler/bootstrap.json
    ```
*   **SPIFFE ID Identity Verification**: Inspect cluster runtime metrics to confirm the node holds a valid identity token matching:
    ```text
    spiffe://decoupler.internal/cluster/dc-cell-us-east-01/agent
    ```
*   **mTLS Handshake Check**: Verify that the `spire-registrar-webhook` dynamically pushes valid X.509 certificates to newly scheduled nodes in under 50ms.

---

## Phase 2: In-Memory Processing & Storage Compaction Safety

*   **Latency Threshold Check**: Query the active Prometheus scraping instance to verify that processing loop latencies remain strictly under the 20ms target budget limits.
*   **Auto-Compaction Verification**: Confirm the embedded BoltDB WAL engine triggers snapshot routines automatically when log sizes pass the `snapshot_threshold` value:
    ```bash
    # Confirm that local disk use doesn't grow past the 256Mi container allocation limit
    df -h /var/lib/decoupler/raft
    ```
*   **Circuit Breaker Check**: Verify the active `decoupler_cluster_partitions_total` counter equals `0` during nominal dual-stack routing operations.

---

## Phase 3: Zero-Exfiltration Compliance Controls

*   **Pre-Flight Validation Check**: Confirm the Kubernetes init container executed `decoupler check` successfully, logging a `PASSED` status directly to the local audit table.
*   **Anonymization Verification**: Spot-check random relational logging records in the local storage history database, ensuring all plaintext tags match `anonymized_database_node` signatures.
