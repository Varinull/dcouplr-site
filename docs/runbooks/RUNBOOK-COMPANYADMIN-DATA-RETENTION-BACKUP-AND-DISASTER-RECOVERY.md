# Customer Enterprise Runbook: In-VPC Data Retention, Backup & Disaster Recovery
**Document Classification:** Customer Standard Operating Procedure (SOP) • In-Perimeter Storage Operations  
**Runbook ID:** `RUN-COMPANYADMIN-RETENTION-001`  
**Governing Baseline:** Enterprise Data Lifecycle Standard & NIST SP 800-209  
**Target Roles:** Customer Observability Administrators (`Observability-Admins`), Enterprise DBAs, Infrastructure Leads  
**Applicability:** In-VPC Customer Enterprise Instance (`data/vpc_telemetry.db` / `data/backups/`)  
**Portal Scope:** Customer Company Administrator Console (`/companyadmin`)  
**Version:** 4.3.0-ENTERPRISE • Approved for Customer Production  

---

## 1. Scope & Purpose

This operational runbook provides step-by-step Standard Operating Procedures (SOPs) for customer enterprise administrators and infrastructure leads managing **Component Retention Policies**, executing **Hot Zero-Downtime Database Snapshots**, automating **Backup Rotation**, and conducting **Point-in-Time Disaster Recovery (DR)** for `<dcouplr/>`.

All procedures in this runbook execute **100% inside your private corporate VPC boundary** without external network dependencies and with **Zero-WAN Egress ($0.00)**. 

---

## 2. In-VPC Component Retention Architecture

Retention policies govern how long telemetry streams, application traces, log buffers, and system audit events remain stored before automatic sliding-window pruning. All policies persist directly in your in-perimeter SQLite Single Source of Truth (`system_retention_policies`).

```
+-------------------------------------------------------------------------------------------------------+
|                                    IN-VPC RETENTION POLICY BASELINE                                   |
+------------------------------+-------------------------+--------------------+-------------------------+
| Component                    | Category                | Default Retention  | Storage Quota Limit     |
+------------------------------+-------------------------+--------------------+-------------------------+
| In-VPC APM Traces            | Observability & Traces  | 14 Days            | 15.0 GB (100% Err / 20%)|
| High-Throughput Logs         | Observability & Logs    | 30 Days            | 30.0 GB (INFO+ Level)   |
| Full-Stack Metrics           | Observability & Metrics | 90 Days            | 25.0 GB (Multi-Res)     |
| Compiler Studio AST          | Compiler & Code Cache   | 30 Days            | 10.0 GB                 |
| Outside-VPC Hubs Telemetry   | Perimeter & Kiosk       | 14 Days            | 5.0 GB                  |
| Customer SSoT Database (WAL) | Core Database & Census  | 90 Days            | 10.0 GB                 |
| Security & Audit Trail Logs  | Security & Compliance   | 365 Days (Locked)  | 10.0 GB (SOC 2 Invariant|
+------------------------------+-------------------------+--------------------+-------------------------+
```

---

## 3. Standard Operating Procedures (SOPs) via `/companyadmin`

All retention, backup, and storage operations are accessible directly through the Customer Company Administrator Console:
```text
http://localhost:8000/companyadmin
```

### SOP-01: Updating Component Retention Policies via Company Admin UI

1. Open your browser and navigate to the Customer Company Administrator Console:
   ```text
   http://localhost:8000/companyadmin
   ```
2. Click the **`⚙️ Retention Policies`** tab (Tab 2) in the top navigation bar.
3. In the **Component Retention Policies** editor, locate the target component (e.g., `In-VPC APM Traces` or `High-Throughput Logs`).
4. Modify the operational thresholds:
   - **Retention Duration (Days):** The sliding evaluation window in days before record eviction.
   - **Max Storage Quota (GB):** Maximum disk allocation before forced FIFO roll-off.
   - **Sampling Rate (%):** Ingestion sampling density for high-throughput traces.
5. Click **💾 Save & Persist Retention Configuration**.
6. Verify that the badge indicates **PERSISTED IN SSoT** and changes take effect immediately with zero service restart.

### SOP-02: Executing On-Demand In-Perimeter Retention Pruning

1. Navigate to [`http://localhost:8000/companyadmin`](http://localhost:8000/companyadmin) and select Tab 2 (**`⚙️ Retention Policies`**).
2. Click the **⚡ Run Retention Pruning Now** button in the actions toolbar.
3. The platform executes a sliding-window eviction across expired traces, log buffers, and downsampled metric rolls:
   - Evaluates timestamps against configured policy limits.
   - Reclaims database pages in SQLite WAL mode without locking read or write transactions.
4. A notification toast displays the total number of reclaimed records and freed disk bytes.

### SOP-03: Generating a Zero-Downtime Hot Database Snapshot (`VACUUM INTO`)

1. In [`http://localhost:8000/companyadmin`](http://localhost:8000/companyadmin), click the **`💾 Backup & Restore`** tab (Tab 3).
2. Under the **Backend Database Backup & Restore** section, click **🗄️ Create Hot SQLite Snapshot (VACUUM INTO)**.
3. The embedded database engine executes an atomic `VACUUM INTO` command:
   - **Zero Ingestion Interruption:** Telemetry ingestion continues unpaused in WAL mode.
   - **Cryptographic Integrity:** Computes SHA-256 checksum and executes `PRAGMA quick_check` verification on the generated snapshot file.
   - **Storage Destination:** Persisted locally to `data/backups/backend_backup_<timestamp>.db`.
4. Confirm the new snapshot appears in the **Available Backup Snapshots** inventory table with file size and timestamp.

### SOP-04: Generating an Application Configuration Backup

1. In [`http://localhost:8000/companyadmin`](http://localhost:8000/companyadmin), click the **`💾 Backup & Restore`** tab (Tab 3).
2. Locate the **Application Configuration** card.
3. Click **💾 Backup Application Configuration**.
4. The system exports all retention policies, backup schedule cron definitions, local RBAC user census, and alert threshold configurations into a signed JSON bundle (`app_config_backup_<timestamp>.json`).
5. Download or mirror this file into your enterprise GitOps or backup archive.

### SOP-05: Restoring the Database from a Verified Backup Snapshot

> [!WARNING]
> Restoring a database snapshot replaces the active SQLite file. An automated pre-restore safety snapshot is created automatically before replacement to protect against accidental rollback.

1. Navigate to [`http://localhost:8000/companyadmin`](http://localhost:8000/companyadmin) and open Tab 3 (**`💾 Backup & Restore`**).
2. In the **Available Backup Snapshots** table, locate the desired snapshot.
3. Click the **Restore** button on the snapshot row.
4. Review the confirmation dialog showing snapshot ID, file size, and creation timestamp.
5. Confirm the action. The automated restore engine:
   - Validates snapshot binary integrity via `PRAGMA quick_check`.
   - Creates a safety snapshot of the active database (`data/backups/pre_restore_safety_<timestamp>.db`).
   - Flushes pending WAL write frames with `PRAGMA wal_checkpoint(TRUNCATE)`.
   - Atomically replaces `data/vpc_telemetry.db` with the verified snapshot.
   - Reloads in-memory telemetry and topology census structures.
6. Verify that the node census and VPC inventory show normal operational counts.

### SOP-06: Storage Health & Database Maintenance

1. In [`http://localhost:8000/companyadmin`](http://localhost:8000/companyadmin), click the **`🧹 Maintenance & Storage`** tab (Tab 4).
2. Execute proactive maintenance actions as needed:
   - **🧹 Flush WAL Checkpoint (TRUNCATE):** Flushes pending WAL frames into the main database file, keeping `-wal` file sizes minimal.
   - **⚡ Run Database Compaction (VACUUM):** Defragments B-tree storage pages and reclaims disk space from deleted records.
   - **🔍 Run Integrity Check:** Executes `PRAGMA integrity_check` and `PRAGMA foreign_key_check` to guarantee database consistency.
3. Review the **Physical Storage Health** gauges to monitor disk usage across `/data` volumes.

---

## 4. In-VPC API Automation Reference for CI/CD

All retention and backup operations can be orchestrated locally via shell scripts, cron jobs, or internal pipelines:

```bash
# 1. Fetch current component retention policies
curl -s http://localhost:8000/v1/admin/retention-policies | jq .

# 2. Update APM traces retention to 21 days
curl -X PUT http://localhost:8000/v1/admin/retention-policies/apm_traces \
  -H "Content-Type: application/json" \
  -d '{"retention_days": 21, "max_storage_gb": 20.0}'

# 3. Trigger immediate retention pruning
curl -X POST http://localhost:8000/v1/admin/retention-policies/prune

# 4. Create a hot backend database snapshot
curl -X POST http://localhost:8000/v1/admin/backups/create \
  -H "Content-Type: application/json" \
  -d '{"target_type": "backend_database", "name": "Nightly Automated Snapshot"}'

# 5. Flush WAL Checkpoint
curl -X POST http://localhost:8000/v1/admin/maintenance/wal-checkpoint

# 6. Retrieve storage health telemetry
curl -s http://localhost:8000/v1/admin/maintenance/storage | jq .
```

---

## 5. Compliance & Disaster Recovery Verification Checklist

- [ ] All 7 component retention policies configured and verified in `http://localhost:8000/companyadmin`.
- [ ] Daily automated backend backup schedule active (`0 2 * * *`) with retention count >= 14 snapshots.
- [ ] Application configuration backup verified with SHA-256 checksum and stored in offsite vault.
- [ ] Disaster recovery restore workflow dry-run tested on staging environment within the past 90 days.
- [ ] Physical disk consumption monitored and alerted prior to 85% capacity threshold.
- [ ] Audit logs validated for zero tampering and 365-day SOC 2 compliance retention.

---
*Authorized for Customer In-VPC Operations • Document Reference `RUN-COMPANYADMIN-RETENTION-001`.*

