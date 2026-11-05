# 🗺️ Quarter 2 Sprint Milestones: Embedded Cluster Mesh & Raft Consensus

Quarter 2 transitions the engine from a stateless local CLI into an enterprise-ready, high-availability cluster synchronization mesh. Here is the milestone plan across Sprints 7 through 12:

```text
[ Quarter 2 Sprint Backlog Milestone Grid ]
Sprints 7–8: Raft Engine       Sprints 9–10: Compaction/WAL    Sprints 11–12: gRPC & HA Quorum
|----------------------------|----------------------------|----------------------------|
* Embedded HashiCorp Raft    * BoltDB WAL compaction      * Non-blocking gRPC server
* SPIFFE mTLS dialer         * Background snapshotting    * Dynamic voter lifecycle
* 50ms heartbeat timing      * Enforce 256Mi memory cap   * Multi-node failover tests
```

---

### Sprint 7–8: Embedded Raft State Machine & Secure Transport
- **Sprint Goal:** Embed the HashiCorp Raft consensus protocol directly inside the agent binary and establish node-to-node communication over SPIFFE-attested mutual TLS.
- **Key Deliverables:**
  - Initialize the Raft node instance with low-latency peering parameters: `HeartbeatTimeout: 50ms`, `ElectionTimeout: 200ms`, `LeaderLeaseTimeout: 50ms`.
  - Implement custom Raft network transport wrappers using `go-spiffe/v2` to secure peer-to-peer communication on port 8300.
  - Build out `peers.json` bootstrapping logic to allow initial 3-node cluster formation from the `bootstrap.json` ConfigMap without external discovery services.

---

### Sprint 9–10: High-Throughput Write-Ahead Log (WAL) Compaction & Memory Bounds
- **Sprint Goal:** Ensure the local BoltDB WAL engine compacts and truncates logs reliably to keep memory consumption strictly below the 256Mi limit under high load.
- **Key Deliverables:**
  - Implement the background WAL evaluation loop using `storage/compaction_checker.go` to monitor log size against the `snapshotThreshold: 10000` setting.
  - Deploy the `storage/compaction_pruner.go` transaction engine to atomically truncate applied entries and write baseline snapshots.
  - Conduct saturation load testing with 150,000 metrics/sec to verify that memory usage remains stable during continuous snapshot cycles.

---

### Sprint 11–12: Administrative Listener, Dynamic Membership & Fault Injection
- **Sprint Goal:** Provide safe, dynamic node registration via the gRPC administrative API and prove cluster resilience under simulated network partitions.
- **Key Deliverables:**
  - Deploy the `ClusterAdministrationServer` gRPC service (`engine/cluster_server.go`) listening on port 8301 with the async database audit interceptor.
  - Expose dynamic cluster management subcommands: `decoupler join` and `decoupler status`.
  - Execute automated split-brain and leader-loss chaos tests (`scripts/chaos_etcd_loss.sh`) to verify that the cluster recovers quorum and elects a new leader in under 500ms.

---

### Summary Matrix

| Milestone Track | Primary Technical Deliverable | Target Performance Budget | Primary Security / Operational Value |
| :--- | :--- | :--- | :--- |
| **Local Compilation** | Automated Makefile pipeline. | Clean build in < 15 seconds locally. | Enforces linting, security scans, and static linking before deployment. |
| **Admin Listener Logs** | SPIFFE-attested gRPC unary server. | Connection evaluation completed in < 2ms. | Provides audit trails and rejects un-attested peers during the TLS handshake. |
| **Quarter 2 Roadmap** | Embedded Raft consensus mesh. | Leader election and failover in < 500ms. | Keeps memory usage bounded under 256Mi via continuous WAL compaction. |
