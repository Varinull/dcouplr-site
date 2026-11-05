# <dcouplr/> Operations Runbook: Enterprise Data Retention, Backup & Disaster Recovery

```
DOCUMENT ID:       RUN-RETENTION-BACKUP-001
SECURITY LEVEL:    CLEARED_CUSTOMER_PUBLIC • IN-PERIMETER PRODUCTION OPERATION
TARGET DATABASE:   dcouplr_customer_db (SYNCHRONIZED TO CUSTOMER SOVEREIGN VPC)
EFFECTIVE DATE:    2026-11-02
VERSION:           v4.2.0-OPERATIONAL
COMPLIANCE:        SOC 2 Type II, ISO/IEC 27001, HIPAA Security Rule, NIST SP 800-209
AUDIT REF:         VA-AUDIT-RETENTION-20261102
```

---

## 1. Scope & Purpose

This operational runbook provides step-by-step Standard Operating Procedures (SOPs) for configuring and maintaining **Component Retention Policies**, executing **Hot Zero-Downtime Backups**, automating **Backup Rotation Schedules**, and conducting **Point-in-Time Disaster Recovery (DR)** for both the `<dcouplr/>` application layer and the underlying backend database.

All operations execute 100% inside your private VPC perimeter without outbound WAN egress ($0.00).

---

## 2. Component Retention Policies Overview

Customer retention policies govern how long telemetry, logs, traces, and system artifacts remain stored before automatic pruning. Configurations persist directly in the in-VPC SQLite Single Source of Truth (`system_retention_policies`).

```
+---------------------------------------------------------------------------------------------------+
|                                  SYSTEM COMPONENT RETENTION SUMMARY                               |
+--------------------------+-----------------------+--------------------+---------------------------+
| Component                | Category              | Default Retention  | Storage Quota Limit       |
+--------------------------+-----------------------+--------------------+---------------------------+
| In-VPC APM Traces        | Observability & Trace | 14 Days            | 15.0 GB (100% Err / 20% Ok|
| High-Throughput Logs     | Observability & Logs  | 30 Days            | 30.0 GB (INFO+)           |
| Full-Stack Metrics       | Observability & Metric| 90 Days            | 25.0 GB (Multi-Resolution)|
| Compiler Studio AST      | Compiler & Code       | 30 Days            | 10.0 GB                   |
| Outside-VPC Hubs         | Perimeter & Display   | 14 Days            | 5.0 GB                    |
| Customer DB (SSoT & WAL) | Database & Storage    | 90 Days            | 10.0 GB                   |
| Security & Audit Trail   | Security & Compliance | 365 Days (Locked)  | 10.0 GB (SOC 2 Mandatory) |
+--------------------------+-----------------------+--------------------+---------------------------+
```

---

## 3. Standard Operating Procedures (SOPs)

### SOP-01: Updating Component Retention Policies via Admin UI

1. Open the `<dcouplr/>` Admin Vault: `http://localhost:8000/companyadmin`.
2. Click **🗄️ Retention & Backup** in the navigation bar.
3. Select the **⚙️ Component Retention Policies** sub-tab.
4. Locate the component you wish to adjust (e.g., `In-VPC APM Traces`).
5. Adjust the **Retention Duration (Days)**, **Max Storage Quota (GB)**, or **Sampling Rate (%)**.
6. Click **💾 Save & Persist Retention Configuration**.
7. Confirm that the status badge updates to **PERSISTED IN SSoT**.

### SOP-02: Executing On-Demand Retention Pruning

1. In the **Retention & Backup Console**, click the **⚡ Run Retention Pruning Now** button.
2. The system executes sliding-window eviction across expired traces, log buffers, and downsampled metric rolls.
3. Verify the toast notification indicating the count of expired records reclaimed.
4. Inspect the **Physical Storage Health** tab to confirm freed capacity.

### SOP-03: Generating a Zero-Downtime Hot Backend Database Backup

1. Navigate to the **💾 Backup & Restore Center** sub-tab.
2. In the **Backend Database Backup & Restore** card, click **🗄️ Create Hot SQLite Snapshot (VACUUM INTO)**.
3. The database engine executes an atomic `VACUUM INTO` command in Write-Ahead Logging (`WAL`) mode:
   - Zero interruptions to active telemetry ingestion.
   - Microsecond snapshot creation on NVMe/EBS storage.
   - Instant SHA-256 cryptographic checksum calculation.
   - Verification via SQLite `PRAGMA quick_check`.
4. The verified snapshot appears in the **Available Backup Snapshots** inventory table.

### SOP-04: Generating an Application Configuration Backup

1. In the **Backup & Restore Center**, locate the **Application Configuration** card.
2. Click **💾 Backup Application Configuration**.
3. The platform exports all retention policies, backup schedules, RBAC user accounts, active API key hashes, and alert threshold overrides into a signed JSON bundle (`app_config_backup_<timestamp>.json`).
4. Download or store the bundle in your offsite configuration vault.

### SOP-05: Restoring the Backend Database from a Snapshot

> [!WARNING]
> Restoring a backend database replaces the active SQLite file. An automated pre-restore safety snapshot is taken automatically before replacement.

1. In the **Available Backup Snapshots** table, identify the target snapshot file.
2. Click the **Restore** button on the snapshot row.
3. Confirm the restoration prompt.
4. The restore workflow:
   - Runs `PRAGMA quick_check` on the snapshot.
   - Takes a hot safety backup of the active database (`pre_restore_safety_<timestamp>.db`).
   - Flushes active transactions with `PRAGMA wal_checkpoint(TRUNCATE)`.
   - Atomically replaces `vpc_telemetry.db` with the snapshot.
   - Reloads all in-memory census inventories and topology tables.
5. Verify that the node and VPC census counts match expectations.

### SOP-06: Database Maintenance (WAL Checkpoint & VACUUM)

1. Select the **🧹 System Maintenance & Storage Health** sub-tab.
2. Click **🧹 Flush WAL Checkpoint (TRUNCATE)** to flush write-ahead frames into the main database.
3. Click **⚡ Run Database Compaction (VACUUM)** to defragment B-tree pages and reclaim unallocated disk space.
4. Click **🔍 Run Integrity Check** to verify that both quick check and foreign key consistency report `HEALTHY`.

---

## 4. API Automation Reference

All retention and backup operations can be orchestrated via curl or CI/CD pipelines:

```bash
# 1. Fetch current retention policies
curl -s http://localhost:8000/v1/companyadmin/retention-policies | jq .

# 2. Update APM traces retention to 21 days
curl -X PUT http://localhost:8000/v1/companyadmin/retention-policies/apm_traces \
  -H "Content-Type: application/json" \
  -d '{"retention_days": 21, "max_storage_gb": 20.0}'

# 3. Create a hot backend database snapshot
curl -X POST http://localhost:8000/v1/companyadmin/backups/create \
  -H "Content-Type: application/json" \
  -d '{"target_type": "backend_database", "name": "Nightly Maintenance Backup"}'

# 4. Create an application configuration snapshot
curl -X POST http://localhost:8000/v1/companyadmin/backups/create \
  -H "Content-Type: application/json" \
  -d '{"target_type": "application_config", "name": "Weekly Config Baseline"}'

# 5. Execute WAL Checkpoint
curl -X POST http://localhost:8000/v1/companyadmin/maintenance/wal-checkpoint

# 6. Run physical storage breakdown
curl -s http://localhost:8000/v1/companyadmin/maintenance/storage | jq .
```

---

## 5. Compliance & Disaster Recovery Verification Checklist

- [ ] All 7 component retention policies configured and persisted to SQLite SSoT.
- [ ] Daily automated backend backup schedule active (`0 2 * * *`) with retention count >= 14.
- [ ] Application configuration backup verified with SHA-256 checksum.
- [ ] Point-in-time recovery dry-run tested on staging environment within past 90 days.
- [ ] Physical disk consumption monitored and alerted prior to 85% storage threshold.
- [ ] Audit logs validated for zero tampering and 365-day compliance retention.
