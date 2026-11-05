# <dcouplr/> Operational Runbook: Database Administrator (DBA) Desk, Inspection Studio & Guardrails Management

**Document ID:** `RUN-DBA-DESK-001`  
**Classification:** Enterprise Observability & Sovereign In-VPC Data Governance  
**Authoritative Scope:** Dual-Perimeter Database Administration, In-VPC vs. Outside-VPC Hub, Active Directory (AD) Company Access Gate, SQLCipher Encryption & Safety Guardrails  
**Audience:** Database Administrators (`Observability-DBA`), Platform Administrators (`Observability-Admins`), Lead SREs  

---

## 1. Overview & Architectural Boundaries

The `<dcouplr/>` enterprise telemetry platform utilizes a dual-database architecture anchored by an in-perimeter, sovereign SQLite 3 Single Source of Truth (SSOT) operating in Write-Ahead Logging (`WAL`) mode with transparent SQLCipher AES-256-CBC disk encryption.

To balance non-blocking real-time observability with absolute protection against catastrophic data loss or rogue DDL/DML mutations, the platform enforces a strict dual-perimeter operational boundary:

```
                                  IN-VPC SOVEREIGNTY BOUNDARY
                               +----------------------------------+
                               |                                  |
                               |    In-VPC Telemetry Mesh         |
                               |    - Permanent Strict Read-Only  |
                               |    - $0.00 WAN Egress Guarantee  |
                               |    - Guardrail Toggle Prohibited |
                               |      (HTTP 403 Forbidden)        |
                               |    - Route: /DBADesk             |
                               |      (http://localhost:8000)     |
                               |                                  |
                               +-----------------+----------------+
                                                 |
                                                 | SQLite SSOT
                                                 | (SQLCipher 4.x)
                                                 v
+-------------------------------+      +---------+---------+
| Corporate DBA Operator        |      |                   |
| via Outside-VPC Hub           |----->| In-VPC SQLite     |
| (https://                     |      | SSOT Database     |
|  dba_dcouplr.yourcompany.com) |      | (AES-256-CBC)     |
|                               |      +-------------------+
| 1. Default: Strict Read-Only  |
| 2. AD Corporate Login         |
| 3. DBA Group Claim Verified   |
|    (databaseadmin / Obs-DBA)  |
| 4. Unlock & Disable Guardrail |
| 5. Execute DDL/DML Mutations  |
| 6. Re-Enable Read-Only Mode   |
+-------------------------------+
```

---

## 2. In-VPC vs. Outside-VPC Channels

| Parameter | In-VPC Console (`/DBADesk`) | Outside-VPC Hub (`dba_dcouplr.yourcompany.com`) |
| :--- | :--- | :--- |
| **Primary URL** | `http://localhost:8000/DBADesk` | `https://dba_dcouplr.yourcompany.com` |
| **Network Perimeter** | Internal VPC Mesh / Private Subnet | Cloudflare Zero Trust / Argo Ingress Tunnel |
| **Default Mode** | `STRICT_READONLY` (Permanent) | `STRICT_READONLY` (Default) |
| **Guardrail Toggle** | ❌ **PROHIBITED (HTTP 403 Forbidden)** | ✅ **PERMITTED (Requires AD Authentication)** |
| **Authentication Gate** | Local In-VPC Session / SSO Token | Corporate Active Directory (AD) Company Access |
| **WAN Egress Cost** | **$0.00 Egress Guarantee** | Zero Inbound Open Ports (Outbound Tunnel Only) |
| **Primary Use Cases** | 24x7 local telemetry, automated health probes | Schema migrations, index rebuilds, VACUUM, break-glass DDL/DML |

---

## 3. Active Directory (AD) Authentication & Role Verification

### Supported Identity Formats
The Outside-VPC Hub accepts corporate Active Directory (AD) / Azure AD credentials in any standard enterprise format:
- **Standard Username:** `alex.turner`
- **Domain Prefixed:** `YOURCOMPANY\alex.turner`
- **User Principal Name (UPN):** `alex.turner@yourcompany.com`

### Authorized Groups & Roles
To unlock the guardrail, the user record or IdP SAML/OIDC claim token MUST belong to one of the authorized DBA groups:
- `databaseadmin`
- `Database Administrators`
- `Database-Administrators`
- `Observability-DBA` (or `Obs-DBA`)
- `Observability-Admins` (Platform Administrators)

Non-DBA employees (e.g. application developers or general analysts) attempting to authenticate at `/v1/dba/auth` or toggle guardrails will receive:
```json
{
  "detail": "Access Denied: User 'marcus.vance' is not a member of the DBA group (databaseadmin / Observability-DBA). Disabling the Read-Only Guardrail is authoritatively prohibited."
}
```

---

## 4. Break-Glass Procedure: Disabling Read-Only Guardrail

When an authorized DBA operator must perform emergency schema migrations, index optimizations, or manual corrections:

1. **Access Outside-VPC Hub:** Navigate to `https://dba_dcouplr.yourcompany.com`.
2. **Authenticate Company Access:** Click **"Login AD Corporate Account to Unlock Guardrail"** and submit AD credentials.
3. **Trigger Break-Glass Modal:** Click **"Disable Read-Only Guardrail"**.
4. **Provide Operational Rationale:** Enter a clear justification (e.g. `Emergency index rebuild on metrics_hyper_table per ticket INC-84920`).
5. **Execute Statements:** Run required DDL/DML in the SQL Scratchpad.
6. **Re-Enforce Guardrail Immediately:** Click **"Re-Enable Read-Only Guardrail"** to return the database to safety.

### Prohibited Keywords Under Guardrail Enforcement
When the guardrail is `ENFORCED` (the default state), any query containing the following mutation keywords is blocked with `HTTP 403 Forbidden`:
- `DROP`
- `DELETE`
- `UPDATE`
- `INSERT`
- `ALTER`
- `TRUNCATE`
- `REPLACE`
- `CREATE`
- `ATTACH`
- `DETACH`
- `PRAGMA WRITABLE_SCHEMA`
- `VACUUM`
- `REINDEX`

---

## 5. Company Admin Configuration

The Company Administrator manages DBA permissions via `/companyadmin`:

1. **Tab 7 (DBA Database Console):**
   - Houses the **In-VPC Single Source of Truth (SSOT) Sovereign Database** engine card.
   - Displays live census counters: **5 VPCs • 75 Nodes • 87 Stacks**.
   - Houses the **🔄 Verify SSOT Engine Integrity** button for on-demand schema and WAL integrity verification.
   - Provides direct launchers to both the In-VPC Desk and Outside-VPC Hub.

2. **Tab 8 (Customer Enterprise Employees • Sovereign In-VPC Access Command):**
   - **Persona Simulator:** Includes **`🗄️ Observability-DBA (Database Administrators)`** button to test capability states.
   - **IdP Claim Rules:** Subtab 4 maps IdP groups `databaseadmin, Database Administrators, Observability-DBA, Database-Administrators` to role `Observability-DBA`.
   - **Permissions Matrix:** Subtab 2 displays the dedicated `Observability-DBA` column granting `Full` for `inspect_database_ssot` and `manage_database_guardrails`.

---

## 6. Audit Logging & Verification

Every guardrail toggle and mutation executed by a DBA operator is immutably recorded in the SSOT database `audit_logs` table:

```sql
SELECT timestamp, actor, action, resource_type, details 
FROM audit_logs 
WHERE action LIKE 'DBA_%' 
ORDER BY id DESC LIMIT 10;
```

Recorded action types:
- `DBA_GUARDRAIL_DISABLED`: Captured with operator identity, IP, channel, and rationale.
- `DBA_MUTATION_EXECUTED`: Captured with query snippet, affected row count, and execution latency.
- `DBA_GUARDRAIL_ENABLED`: Captured when safety mode is restored.

---

## 7. Associated Files & Specifications

- **Master Architectural Dossier:** `DBA-IN-VPC-READONLY-VS-OUTSIDE-VPC-COMPANY-ACCESS-GUARDRAIL.md`
- **DBA Desk Interface:** `migration_tools/api/static/dba_desk.html`
- **Company Admin Console:** `migration_tools/api/static/company_admin.html`
- **Security & RBAC Enforcement:** `migration_tools/api/security.py`
- **API Endpoints:** `migration_tools/api/app.py`
- **Automated Test Suite:** `tests/test_dba_desk_page_and_guardrails.py` (143 passed tests)
