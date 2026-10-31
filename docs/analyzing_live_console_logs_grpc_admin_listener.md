# 🔍 Analyzing Live Console Logs from the gRPC Admin Listener

When debugging connection attempts to the gRPC administrative listener (`engine/cluster_server.go`), monitor the listener logs alongside the client output to verify SPIFFE workload attestation and connection status.

---

### Scenario A: Successful Mutual TLS (mTLS) Attestation & Quorum Join

**Client Log:**
```text
[INFO] Launching Remote Agent Mock Connection Lifecycle...
[ACTION] Sending Cluster Membership Proposal for Node: remote-agent-node-04
[SUCCESS] Membership confirmed. Node registered into active consensus topology mappings.
```

**Server Listener Log:**
```text
[INFO] [gRPC-Admin] Inbound mTLS handshake negotiated successfully from remote-peer: 10.192.42.14:49812
[INFO] [SPIFFE-Auth] Client SVID validated: "spiffe://decoupler.internal/cluster/dc-cell-us-east-01/agent"
[INFO] [Raft-Core] Configuration change proposal accepted: Adding Voter ID="remote-agent-node-04" Address="10.192.42.14:8300"
[AUDIT] Compliance signature persisted locally under tracking token: 8f4e2b10-6c91-492a-89a1-778841a0e1c2
```

**Key Diagnostic Markers:**
- The client's SVID matches the trust domain (`decoupler.internal`) and cluster scope (`dc-cell-us-east-01`).
- The Raft leader appends the voter directly to its configuration log.
- The unary audit interceptor commits the transaction record asynchronously without blocking the hot path.

---

### Scenario B: Rejected Connection (Un-Attested SVID or Expired Token)

**Client Log:**
```text
[FATAL] Transport negotiation failed with cluster leader: rpc error: code = Unavailable desc = connection error: desc = "transport: authentication handshake failed: spiffe: peer certificate SAN verification failed"
```

**Server Listener Log:**
```text
[WARN] [gRPC-Admin] TLS handshake rejected from peer 10.192.42.88:51204
[ERROR] [SPIFFE-Auth] Received untrusted SPIFFE ID: "spiffe://external-attacker.net/agent" (Expected TrustDomain: "decoupler.internal")
[SECURITY] Peer dropped immediately before invoking gRPC service handlers.
```

**Key Diagnostic Markers:**
- The peer presented a certificate from an untrusted domain.
- The connection is dropped during the TLS handshake before reaching the application code, protecting internal state.

---

### Scenario C: Non-Leader Rejection

**Client Log:**
```text
[ACTION] Sending Cluster Membership Proposal for Node: remote-agent-node-04
[DENIED] Cluster Leader rejected membership: node is not the current cluster leader
```

**Server Listener Log:**
```text
[INFO] [gRPC-Admin] Request rejected on JoinCluster: current node state is FOLLOWER (Leader Address: 10.192.42.11:8300)
```

**Key Diagnostic Markers:**
- The request reached a follower node instead of the Raft leader.
- **Remediation:** Re-route the join request to the designated leader node or enable automatic leader redirection via your headless Kubernetes Service.

---

### Diagnostic Summary Reference

| Scenario | Symptom / Signal | Root Cause | Target Action |
| :--- | :--- | :--- | :--- |
| **A: Valid Quorum Join** | `Client SVID validated`, `Adding Voter ID` | Successful SPIFFE mTLS handshake & Raft commit | Node successfully joins active quorum |
| **B: Untrusted SVID** | `peer certificate SAN verification failed` | Missing or untrusted trust domain in SPIFFE ID | Verify SPIRE agent registration & trust bundle |
| **C: Non-Leader Target** | `current node state is FOLLOWER` | Inbound proposal routed to non-leader Raft peer | Redirect RPC to leader endpoint on port 8300 |
