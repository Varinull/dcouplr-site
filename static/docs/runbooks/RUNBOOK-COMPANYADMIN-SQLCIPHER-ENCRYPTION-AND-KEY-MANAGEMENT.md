# Customer Enterprise Runbook: In-VPC SQLCipher Database Encryption & Key Management
**Document Classification:** Customer Standard Operating Procedure (SOP) • In-Perimeter Security Operations  
**Runbook ID:** `RUN-COMPANYADMIN-SQLCIPHER-001`  
**Governing Baseline:** Enterprise Cryptographic Security Standard & NIST SP 800-175B  
**Target Roles:** Customer Observability Administrators (`Observability-Admins`), Enterprise DBAs, Corporate SecOps Engineers, Compliance Auditors  
**Applicability:** In-VPC Enterprise Customer Single Source of Truth (`data/vpc_telemetry.db` / `data/vpc_telemetry_prod.db`)  
**Portal Scope:** Customer Company Administrator Console (`/companyadmin`)  
**Version:** 4.3.0-ENTERPRISE • Approved for Customer Production  

---

## 1. Purpose & Architectural Overview

This operational runbook provides step-by-step procedures for customer enterprise administrators and database engineers managing **SQLCipher AES-256 database encryption at rest** directly inside their private Virtual Private Cloud (VPC) environment.

Because the `<dcouplr/>` observability platform is deployed entirely **in-VPC**, your organization retains total sovereign control over all operational telemetry, cluster node inventories, application traces, high-throughput logs, and encryption master keys. 

### Key Architectural Invariants:
1. **Zero-WAN Egress ($0.00):** All encryption, page-level HMAC verifications, and online rekeying operations execute locally within your perimeter. No database keys, cleartext rows, or cipher fragments ever traverse external internet gateways.
2. **Class 4 Cryptographic Standard:** AES-256-CBC per-page ciphering backed by PBKDF2-HMAC-SHA512 key derivation with 256,000 iterations and per-page HMAC-SHA512 tamper validation.
3. **Dedicated In-Perimeter Console:** All encryption controls, status inspectors, key rotation tools, and page integrity tests are managed directly through the Customer Company Administrator Console at [`http://localhost:8000/companyadmin`](http://localhost:8000/companyadmin).

---

## 2. Quick Reference Commands & Console Operations

| Operation | In-VPC CLI / API Command | `/companyadmin` Console Action | Description |
| :--- | :--- | :--- | :--- |
| **Inspect Cipher Status** | `curl -s http://localhost:8000/v1/admin/encryption/status \| jq` | Tab 1: **🔐 SQLCipher Encryption** | Displays active cipher engine, algorithm, KDF iterations, and salt |
| **Check Header Magic** | `head -c 16 data/vpc_telemetry.db \| xxd -p` | Header Hex Inspector Card | Proves absence of plaintext `SQLite format 3` string on raw disk |
| **Verify Page Integrity** | `curl -s -X POST http://localhost:8000/v1/admin/encryption/verify \| jq` | **Run Page-Level Integrity Check** | Executes `PRAGMA cipher_integrity_check;` across all database pages |
| **Rotate Key (Rekey)** | `curl -s -X POST http://localhost:8000/v1/admin/encryption/rekey -H "Content-Type: application/json" -d '{"new_passphrase":"..."}'` | **Rotate Encryption Key (PRAGMA rekey)** | Online zero-downtime key rotation re-encrypting all pages live |
| **Hot Backup Snapshot** | `curl -s -X POST http://localhost:8000/v1/admin/backups/create -H "Content-Type: application/json" -d '{"target_type":"backend_database"}'` | Tab 3: **💾 Backup & Restore** | Generates verified AES-256 encrypted hot snapshot via `VACUUM INTO` |
| **Export Plaintext Dump** | `curl -s -X POST http://localhost:8000/v1/admin/encryption/export-decrypted \| jq` | **Export Decrypted Backup for Audit** | Generates unencrypted copy for offline internal infosec compliance audit |

---

## 3. Initial In-VPC Configuration: Supplying the Master Passphrase

When your infrastructure engineering team deploys `<dcouplr/>` into your private VPC, supply the master encryption passphrase using one of the two enterprise methods:

### Method A: Enterprise Secret Manager / Kubernetes Secrets (Recommended)
Inject the `SQLCIPHER_KEY` environment variable into your Kubernetes Pod specification, Helm values, or Linux systemd service:

```yaml
# In Kubernetes Pod Specification / Helm values:
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dcouplr-observability-core
  namespace: observability
spec:
  template:
    spec:
      containers:
        - name: dcouplr-core
          image: dcouplr-core:v1.0.0
          env:
            - name: SQLCIPHER_KEY
              valueFrom:
                secretKeyRef:
                  name: enterprise-vault-credentials
                  key: database-master-key
```

### Method B: Autonomous In-Perimeter Keyfile (Standalone VM / Bare-Metal)
If no environment variable is provided, `<dcouplr/>` automatically provisions a 256-bit cryptographically secure pseudorandom token in:
```bash
data/customer_db.key
```
Ensure strict POSIX file permissions so only the runtime service user has read access:
```bash
chmod 600 data/customer_db.key
```

---

## 4. Step-by-Step Procedure: Verifying Database Encryption via `/companyadmin`

### Step 4.1: Access the Company Administrator Portal
1. Open your browser and navigate to the Customer Company Administrator Console:
   ```text
   http://localhost:8000/companyadmin
   ```
2. Click the **`🔐 SQLCipher Encryption (AES-256)`** tab (Tab 1) in the console navigation bar.

### Step 4.2: Inspect Live Cryptographic Telemetry
In the **SQLCipher Encryption Status** panel, confirm the following indicators:
* **Status Badge:** Displays `ENCRYPTION ACTIVE: AES-256-CBC` in vibrant green.
* **Cipher Engine:** Reports `SQLCipher 4.x (FIPS-140 Mode Enabled)`.
* **KDF Derivation:** Confirms `256,000 Iterations (PBKDF2-HMAC-SHA512)`.
* **Header Hex Inspector:** Displays the 16-byte raw high-entropy salt (e.g. `26 c2 c5 36 ac 94 36 65...`).
* **Plaintext Verification:** Reports `Plaintext SQLite Header: ABSENT (Encrypted at Rest)`.

### Step 4.3: Execute Page-Level Cryptographic Integrity Verification
1. On the SQLCipher tab in [`http://localhost:8000/companyadmin`](http://localhost:8000/companyadmin), locate the **Cryptographic Verification & Diagnostic Actions** card.
2. Click the **🔍 Run Page-Level Integrity Check** button.
3. The platform executes `PRAGMA cipher_integrity_check;` across every 4096-byte page in `data/vpc_telemetry.db`.
4. Verify the toast notification:
   ```text
   ✓ SQLCipher Integrity Verified: 0 page corruptions detected across all pages. HMAC-SHA512 valid.
   ```

### Step 4.4: Independent Binary Verification via Terminal
To independently verify on the host filesystem without using the web UI:
```bash
python3 -c "
with open('data/vpc_telemetry.db', 'rb') as f:
    hdr = f.read(16)
    is_plain = hdr.startswith(b'SQLite format 3\x00')
    print('Header Hex:', ' '.join(f'{b:02x}' for b in hdr))
    print('Is Plaintext SQLite:', is_plain)
    print('Is SQLCipher Encrypted:', not is_plain)
"
```
* **Expected Output:**
  ```text
  Header Hex: 26 c2 c5 36 ac 94 36 65 e0 fb 45 9a dc 1f 03 67
  Is Plaintext SQLite: False
  Is SQLCipher Encrypted: True
  ```

---

## 5. Step-by-Step Procedure: Online Key Rotation (`PRAGMA rekey`)

Company policy or compliance frameworks (e.g., SOC 2 Type II, ISO 27001) may mandate periodic cryptographic key rotation (e.g., every 90 days) or immediate rotation after organizational transitions.

### Step 5.1: Execute Key Rotation via Company Admin UI
1. Navigate to [`http://localhost:8000/companyadmin`](http://localhost:8000/companyadmin).
2. Click the **`🔐 SQLCipher Encryption (AES-256)`** tab.
3. In the **Master Key Rotation Center** card, enter a new high-entropy master passphrase, or click **🎲 Generate High-Entropy Key**.
4. Click **🔄 Rotate Encryption Key (PRAGMA rekey)**.
5. The system performs an atomic, online zero-downtime rekey:
   - Evaluates `PRAGMA rekey = '...'` within the embedded engine.
   - Re-encrypts every page in `data/vpc_telemetry.db` with the new key and a fresh cryptographic salt.
   - Updates `data/customer_db.key` atomically.
   - Ingestion of live VPC metrics, traces, and logs continues uninterrupted during the rotation.
6. Confirm the success notification and note the new key fingerprint in the audit trail.

### Step 5.2: Execute Key Rotation via In-Perimeter API (Optional Automation)
If your organization automates key rotation through internal CI/CD or HashiCorp Vault:
```bash
NEW_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

curl -s -X POST http://localhost:8000/v1/admin/encryption/rekey \
  -H "Content-Type: application/json" \
  -d "{\"new_passphrase\": \"${NEW_KEY}\"}" | jq .
```

* **Expected Output:**
  ```json
  {
    "status": "SUCCESS",
    "message": "Database vpc_telemetry.db successfully rekeyed.",
    "old_fingerprint": "sha256:7f3a...b89c",
    "new_fingerprint": "sha256:4d12...e8a2"
  }
  ```

---

## 6. Step-by-Step Procedure: Exporting Decrypted Backup for Compliance

When internal corporate security auditors or compliance teams require an offline decrypted database dump for verification:

1. In [`http://localhost:8000/companyadmin`](http://localhost:8000/companyadmin), open Tab 1 (**`🔐 SQLCipher Encryption`**).
2. Locate the **Compliance & Offline Export** card.
3. Click **📦 Export Decrypted Backup for Audit**.
4. The system:
   - Attaches an in-memory decrypted SQLite target.
   - Copies schema and census tables into an isolated file (`data/backups/decrypted_audit_<timestamp>.db`).
   - Logs an audit event: `SQLCIPHER_DECRYPTED_EXPORT` with the actor's username.
5. Securely download the decrypted file to your air-gapped auditor enclave.

---

## 7. Troubleshooting & FAQ for Company Admins

### Issue 1: `sqlite3.DatabaseError: file is not a database`
* **Root Cause:** A developer or script attempted to open `data/vpc_telemetry.db` using standard non-SQLCipher SQLite drivers, or supplied an incorrect passphrase.
* **Resolution:**
  1. Standard SQLite CLI tools (`sqlite3`) cannot read SQLCipher databases. Use the Python `sqlcipher3` driver or the `/companyadmin` UI.
  2. Verify that `SQLCIPHER_KEY` matches the key configured during deployment.
  3. Test connectivity in Python:
     ```python
     import sqlcipher3
     conn = sqlcipher3.connect("data/vpc_telemetry.db")
     conn.execute("PRAGMA key = 'YourMasterPassphrase';")
     print("Tables:", conn.execute("SELECT count(*) FROM sqlite_master;").fetchone()[0])
     conn.close()
     ```

### Issue 2: Page-Level Integrity Check Reports Errors
* **Root Cause:** Underlying disk sector corruption or unauthorized external modification has corrupted an HMAC-SHA512 page checksum.
* **Resolution:**
  1. Immediately navigate to [`http://localhost:8000/companyadmin`](http://localhost:8000/companyadmin) and open Tab 3 (**`💾 Backup & Restore`**).
  2. Select the latest verified hot database snapshot from the **Available Backup Snapshots** inventory table.
  3. Click **Restore** to roll back to the verified snapshot.
  4. Inspect storage hardware logs for disk write anomalies.

---

## 8. Enterprise Compliance Certification Sign-Off

| Metric | Enterprise Standard | Observed Value | Result |
| :--- | :--- | :--- | :--- |
| **Cipher Algorithm** | AES-256 Symmetric Encryption | `AES-256-CBC` | **PASS** |
| **KDF Iterations** | $\ge 100,000$ (NIST SP 800-132) | `256,000 Iterations` | **PASS** |
| **Page HMAC Verification** | HMAC-SHA512 Per Page | `Active & Enforced` | **PASS** |
| **Perimeter Boundary** | Zero-WAN Egress ($0.00) | `$0.00 Egress` | **PASS** |
| **Audit Traceability** | Immutable Local SSoT Audit Trail | `rbac_audit_logs` Active | **PASS** |
| **Administrative UI** | Customer Company Admin Console | `http://localhost:8000/companyadmin` | **PASS** |

---
*Authorized for Customer In-VPC Operations • Document Reference `RUN-COMPANYADMIN-SQLCIPHER-001`.*

