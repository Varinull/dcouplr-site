# Operational Runbook: Enterprise SQLCipher Database Encryption & Key Management
**Document Classification:** Standard Operating Procedure (SOP) • In-Perimeter Security Operations  
**Runbook ID:** `RUN-SQLCIPHER-001`  
**Governing Baseline:** Class 4 Enterprise Cryptographic Security Standard  
**Target Roles:** Platform SREs, SecOps Engineers, Enterprise Database Administrators (DBAs), Compliance Auditors  
**Applicability:** In-VPC Production Single Source of Truth (`customer_vpc.db` / `vpc_telemetry_prod.db`)  
**Version:** 4.3.0-PROD • Approved for Customer Production  

---

## 1. Purpose & Overview

This runbook outlines standard operating procedures for configuring, verifying, rotating, and troubleshooting **SQLCipher AES-256 database encryption at rest** within `<dcouplr/>`. 

All cryptographic procedures in this runbook execute **100% In-Perimeter with Zero-WAN Egress ($0.00)**. No database keys, cleartext rows, or cipher fragments ever traverse external internet gateways.

---

## 2. Quick Reference Commands & Pragmas

| Operation | CLI / Shell / Pragma Command | Description |
| :--- | :--- | :--- |
| **Inspect Cipher Status** | `curl -s http://localhost:8000/v1/admin/encryption/status \| jq` | Retrieves engine, cipher algorithm, KDF iterations, and header hex |
| **Check Header Magic** | `head -c 16 data/vpc_telemetry_prod.db \| xxd -p` | Shows raw 16-byte salt; proves absence of plaintext `SQLite format 3` |
| **Verify Page Integrity** | `curl -s -X POST http://localhost:8000/v1/admin/encryption/verify \| jq` | Executes `PRAGMA cipher_integrity_check;` across all database pages |
| **Rotate Key (Rekey)** | `curl -s -X POST http://localhost:8000/v1/admin/encryption/rekey -H "Content-Type: application/json" -d '{"new_passphrase":"..."}'` | Online zero-downtime key rotation (`PRAGMA rekey`) |
| **Hot Backup Snapshot** | `curl -s -X POST http://localhost:8000/v1/admin/backups/create -H "Content-Type: application/json" -d '{"target_type":"backend_database"}'` | Generates AES-256 encrypted hot snapshot via `VACUUM INTO` |
| **Export Plaintext Dump** | `curl -s -X POST http://localhost:8000/v1/admin/encryption/export-decrypted \| jq` | Generates unencrypted copy for offline auditing/migration |

---

## 3. Initial Configuration: Supplying Master Passphrase

### Method A: Environment Variable (Recommended for Kubernetes / Cloud)
Set the `SQLCIPHER_KEY` environment variable in your container manifest, systemd service, or secret manager:

```bash
# In Kubernetes Pod Specification / Helm values:
env:
  - name: SQLCIPHER_KEY
    valueFrom:
      secretKeyRef:
        name: dcouplr-db-credentials
        key: master-encryption-key
```

### Method B: Autonomous Local Keyfile (Standalone VM / Bare-Metal)
If no environment variable is provided, `<dcouplr/>` automatically provisions a 256-bit cryptographically secure pseudorandom token in:
```bash
data/customer_db.key
```
Verify that only the service user has read access:
```bash
chmod 600 data/customer_db.key
```

---

## 4. Step-by-Step Procedure: Verifying Database Encryption at Rest

### Step 4.1: Inspect Binary Header on Disk
To independently verify that the database file is encrypted and does **not** contain standard plaintext SQLite headers:

```bash
python3 -c "
with open('data/vpc_telemetry_prod.db', 'rb') as f:
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

### Step 4.2: Verify via Administrative API
Execute the encryption diagnostic endpoint:
```bash
curl -s http://localhost:8000/v1/admin/encryption/status | jq .
```
Verify the following JSON attributes:
* `"is_encrypted": true`
* `"cipher_algorithm": "AES-256-CBC"`
* `"kdf_iterations": 256000`
* `"header_magic": "ENCRYPTED_AES256_CIPHERTEXT"`
* `"tamper_protection": "HMAC-SHA512 Per-Page Checksum"`

### Step 4.3: Verify via `/admin` Web Console
1. Navigate to [`http://localhost:8000/companyadmin`](http://localhost:8000/companyadmin).
2. Click the **🗄️ Retention & Backup** button.
3. Select the **`🔐 SQLCipher Encryption (AES-256)`** sub-tab.
4. Confirm that the status badge shows `ENCRYPTION ACTIVE: AES-256-CBC` and the Header Hex Inspector displays the high-entropy salt.

---

## 5. Step-by-Step Procedure: Online Key Rotation (`PRAGMA rekey`)

Key rotation must be performed periodically (e.g., every 90 days) or immediately following personnel transitions.

### Step 5.1: Generate High-Entropy New Passphrase
```bash
NEW_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
echo "Generated New Key: ${NEW_KEY}"
```

### Step 5.2: Execute Rotation via API
```bash
curl -s -X POST http://localhost:8000/v1/admin/encryption/rekey \
  -H "Content-Type: application/json" \
  -d "{\"new_passphrase\": \"${NEW_KEY}\"}" | jq .
```
* **Expected Output:**
  ```json
  {
    "status": "SUCCESS",
    "message": "Database vpc_telemetry_prod.db successfully rekeyed.",
    "old_fingerprint": "sha256:7f3a...b89c",
    "new_fingerprint": "sha256:4d12...e8a2"
  }
  ```

### Step 5.3: Verify Audit Trail
Verify that the key rotation was recorded in the immutable audit log:
```bash
curl -s "http://localhost:8000/v1/admin/rbac/audit-logs?limit=5" | jq .
```
Confirm the presence of action `DATABASE_REKEYED_SQLCIPHER` with actor username and key fingerprints.

---

## 6. Step-by-Step Procedure: Restoring an Encrypted Backup

When restoring a hot database backup snapshot generated while SQLCipher was active:

1. Identify candidate snapshot from `/v1/admin/backups` list:
   ```bash
   curl -s http://localhost:8000/v1/admin/backups | jq '.backups[] | select(.target_type=="backend_database")'
   ```
2. Verify candidate snapshot file integrity:
   ```bash
   curl -s -X POST http://localhost:8000/v1/admin/encryption/verify | jq .
   ```
3. Execute restore with automatic safety pre-flight check:
   ```bash
   curl -s -X POST http://localhost:8000/v1/admin/backups/restore \
     -H "Content-Type: application/json" \
     -d '{"target_type":"backend_database", "backup_id":"backend_backup_prod_20261102_020000_a1b2c3.db"}' | jq .
   ```
4. The system automatically creates a safety snapshot of the active database before applying the restoration.

---

## 7. Troubleshooting & FAQ

### Issue: `sqlite3.DatabaseError: file is not a database`
* **Root Cause:** A client attempted to open the encrypted SQLCipher database without supplying the encryption key, or supplied an incorrect passphrase.
* **Resolution:**
  1. Confirm that `SQLCIPHER_KEY` is set in the runtime environment or that `data/customer_db.key` is present and non-empty.
  2. Test manual authentication via Python `sqlcipher3`:
     ```python
     import sqlcipher3
     conn = sqlcipher3.connect("data/vpc_telemetry_prod.db")
     conn.execute("PRAGMA key = 'YourPassphrase';")
     print(conn.execute("SELECT count(*) FROM sqlite_master;").fetchone())
     conn.close()
     ```

### Issue: `PRAGMA cipher_integrity_check` reports non-empty errors
* **Root Cause:** One or more pages have suffered disk-level bit corruption or unauthorized alteration, triggering an HMAC-SHA512 verification failure.
* **Resolution:**
  1. Immediately isolate the damaged file: `cp data/vpc_telemetry_prod.db data/corrupted_investigation.db`.
  2. Restore the latest verified hot snapshot using `POST /v1/admin/backups/restore`.
  3. Contact Infosec team to inspect storage hardware logs for uncorrectable sector read errors.

---

## 8. Compliance Certification Sign-Off

| Metric | Target Standard | Observed Value | Result |
| :--- | :--- | :--- | :--- |
| **Cipher Algorithm** | AES-256 Symmetric Encryption | `AES-256-CBC` | **PASS** |
| **KDF Iterations** | $\ge 100,000$ (NIST SP 800-132) | `256,000` | **PASS** |
| **Page HMAC Verification** | HMAC-SHA512 Per Page | `HMAC-SHA512` | **PASS** |
| **WAN Data Egress** | Zero-WAN Egress ($0.00) | `$0.00` | **PASS** |
| **Audit Logging** | Immutable Local SSoT Trail | `rbac_audit_logs` Active | **PASS** |
