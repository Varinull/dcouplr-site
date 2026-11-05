# <dcouplr/> Operations Runbook: Enterprise RBAC, Identity Federation & Key Management

```
DOCUMENT ID:       RUN-SECURITY-RBAC-001
SECURITY LEVEL:    CLEARED_CUSTOMER_PUBLIC &bull; IN-PERIMETER PRODUCTION OPERATION
TARGET DATABASE:   dcouplr_customer_db (SYNCHRONIZED TO CUSTOMER SOVEREIGN VPC)
EFFECTIVE DATE:    2026-11-02
VERSION:           v4.2.0-OPERATIONAL
COMPLIANCE:        SOC 2 Type II, ISO/IEC 27001, HIPAA Security Rule, PCI-DSS v4.0
AUDIT REF:         VA-AUDIT-RBAC-20261102
```

---

## 1. Scope & Purpose

This operational runbook provides step-by-step procedures for administering, managing, and operating **Role-Based Access Control (RBAC)** and **Attribute-Based Access Control (ABAC)** across the `<dcouplr/>` In-VPC Observability Platform.

All procedures in this document operate entirely inside your private VPC perimeter without requiring outbound internet connectivity ($0.00 public WAN egress).

### 1.1 Sovereign Customer Administration & In-VPC User Command

`<dcouplr/>` is strictly an **in-VPC software appliance**—the tool is **always installed in-VPC** inside the purchasing customer's sovereign cloud perimeter or air-gapped datacenter with $0.00 public WAN egress.

Within the customer organization:
- **Customer Enterprise Employees (Active Console)**:
  - **URL Route:** `http://localhost:8000/companyadmin?tab=users`
  - **Target Audience:** Purchasing company application administrators, customer SRE leads, in-VPC platform engineers, microservice development teams (`team:payments`, `team:checkout`), SOC security compliance analysts, and Kubernetes DaemonSet machine accounts.
  - **Sovereign Command Authority:** Customer Company Administrators hold complete, autonomous authority to **add, grant least-privilege roles to, configure team scoping for, and remove users** who can access their company's in-VPC deployment.
  - **Governance Realm:** Sovereign in-perimeter customer SQLite database (`vpc_telemetry_prod.db`) encrypted at rest with SQLCipher 4.x AES-256. Zero external SaaS connections, zero vendor backdoors.

*(Note: The vendor platform plane at `/admin` is strictly internal to `<dcouplr/> Corp` platform developers/architects and is isolated from customer consoles.)*

---

## 2. Platform Personas & Standard Role Assignments

`<dcouplr/>` provides 6 standardized roles mapped to enterprise organizational functions:

```
+--------------------------------------------------------------------------------------------------------------------+
|                                         <dcouplr/> ENTERPRISE ROLES & SCOPES                                       |
+------------------------------------+------------------------------+------------------------------------------------+
| Canonical Role (Complete Name)     | Operational Scope            | Typical Organizational Members                 |
+------------------------------------+------------------------------+------------------------------------------------+
| Observability-Admins               | Global Platform & Tenant     | Platform SRE Lead, CloudOps Admins             |
| Observability-Platform-Engineers   | Infrastructure & Pipelines   | SREs, DevOps Engineers, Pipeline Leads         |
| Observability-Developers-[Team]    | Service / Team Scope (ABAC)  | Software Engineers, QA, Product Devs           |
| Observability-Security-Analysts    | SIEM, Audit & Security Logs  | SOC Analysts, Incident Responders              |
| Observability-Executive-Viewers    | Read-Only High-Level Summary | VPs, Directors, CTO, Product Managers          |
| Observability-Service-Accounts     | Machine-to-Machine Ingestion | DaemonSets, OpenTelemetry Collectors           |
+------------------------------------+------------------------------+------------------------------------------------+
```

---

## 3. Quick Reference: Permissions Capabilities Matrix

| Platform Capability | `Observability-Admins` | `Observability-Platform-Engineers` | `Observability-Developers-[Team]` | `Observability-Security-Analysts` | `Observability-Executive-Viewers` | `Observability-Service-Accounts` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Manage Users & SSO** | ✅ Full | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied |
| **Manage Billing & Limits** | ✅ Full | 👁️ Read-Only | ❌ Denied | ❌ Denied | 👁️ Read-Only | ❌ Denied |
| **Manage API Keys** | ✅ Full | ✅ Full | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied |
| **Configure Parsers** | ✅ Full | ✅ Full | ❌ Denied | ❌ Denied | ❌ Denied | ⚙️ Scoped API |
| **Create & Edit Dashboards**| ✅ Full | ✅ Full | 🏷️ Team Scoped | 👁️ Read-Only | 👁️ Read-Only | ⚙️ Scoped API |
| **Query Telemetry** | ✅ Full | ✅ Full | 🏷️ Team Scoped | ✅ Full | 👁️ Read-Only | ❌ Denied |
| **View Audit Logs** | ✅ Full | 👁️ Read-Only | ❌ Denied | ✅ Full | ❌ Denied | ❌ Denied |
| **Ingest Telemetry Data** | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied | 🔒 Write-Only |

---

## 4. Standard Operating Procedures (SOPs)

### SOP-01: Provisioning a New User Identity

1. Navigate to the Customer Administrator Portal: `http://localhost:8000/companyadmin?tab=users` (or Platform Owner Vault `http://localhost:8000/companyadmin?tab=users` for vendor internal employees).
2. Select the **Users & Identities** sub-tab.
3. Click **➕ Provision Identity**.
4. Fill in user details:
   - **Username:** `first.last` (e.g., `alex.rivera`)
   - **Display Name:** `Alex Rivera (Senior SRE)`
   - **Assigned Role:** Select appropriate role from dropdown.
   - **Team Scope:** Enter `*` for platform-wide access, or a specific team slug (e.g., `checkout`, `payments`).
5. Click **Save Identity**.
6. The new identity persists immediately to `rbac_users` in your In-VPC SQLite database.

Alternatively, use the REST API:
```bash
curl -X POST http://localhost:8000/v1/security/users \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dcp_adm_sovr_8f44a391c01e52" \
  -d '{
    "username": "alex.rivera",
    "display_name": "Alex Rivera (Senior SRE)",
    "role": "Obs-Platform-Engineers",
    "team_scope": "*"
  }'
```

---

### SOP-02: Issuing a Write-Only Ingestion Key for Kubernetes DaemonSets

1. Under the **API Keys & Ingestion Tokens** sub-tab in the Admin Vault, click **🔑 Issue New Key**.
2. Configure key attributes:
   - **Key Label:** `K8s-Prod-US-West-DaemonSet`
   - **Key Type:** Select `Write-Only Ingestion Key (Collectors / DaemonSets)`.
   - **Assigned Role:** `Obs-Service-Accounts`.
   - **Team Scope:** `k8s-prod-us-west` or `*`.
3. Click **Issue Key**.
4. **IMPORTANT:** Copy the full raw secret (`dcp_ing_...`) immediately. The secret is displayed once and hashed in the database.
5. Inject the secret into your Kubernetes cluster as a Secret:
   ```yaml
   apiVersion: v1
   kind: Secret
   metadata:
     name: dcouplr-ingestion-key
     namespace: monitoring
   type: Opaque
   data:
     API_KEY: <base64-encoded-dcp_ing_token>
   ```

---

### SOP-03: Rotating or Revoking an Ingestion Key

1. Under **API Keys & Ingestion Tokens**, locate the active key to be retired.
2. Issue the replacement key first following **SOP-02** and update your collector ConfigMaps.
3. Verify telemetry flow using the new key.
4. Return to the Admin Vault and click **Revoke** on the retired key.
5. The key status updates to `REVOKED` in SQLite SSOT and all subsequent ingestion attempts using the old key will be rejected immediately (HTTP 401).

---

### SOP-04: Mapping Corporate SAML / OIDC Groups (Okta, Azure AD)

`<dcouplr/>` maps IdP claims dynamically. Configure your Identity Provider to push security group memberships in the SAML `groups` attribute or OIDC token claims:

- If group contains `Obs-Admins` or `EnterpriseAdmins` &rarr; User inherits **`Obs-Admins`**.
- If group contains `Obs-Platform-Engineers` or `devops` &rarr; User inherits **`Obs-Platform-Engineers`**.
- If group matches regex `^Obs-Dev-(.+)` (e.g., `Obs-Dev-Billing`) &rarr; User inherits **`Obs-Dev`** with `team_scope = billing`.
- If group contains `Obs-Security-Analyst` &rarr; User inherits **`Obs-Security-Analyst`**.
- If group contains `Obs-Executive-Viewers` &rarr; User inherits **`Obs-Executive-Viewers`**.

---

### SOP-05: Reviewing Audit Logs for Compliance Inspections

1. Open the **Immutable Audit Trail** sub-tab in the Admin Vault (`http://localhost:8000/companyadmin?tab=users`).
2. Filter events by actor role or inspect all records chronologically.
3. Verify that all key creations, user role modifications, and policy changes carry an immutable timestamp and source IP.
4. Export audit logs for compliance audits via REST:
   ```bash
   curl -s http://localhost:8000/v1/security/audit-logs?limit=500 \
     -H "X-API-Key: dcp_adm_sovr_8f44a391c01e52" > rbac_audit_export.json
   ```

---

## 5. Security Troubleshooting & Verification

| Symptom | Root Cause | Remediation Step |
| :--- | :--- | :--- |
| **HTTP 403 Forbidden** on Ingestion Endpoint | Ingestion agent using a revoked or User-type API key | Verify key has `key_type = "ingestion_write_only"` in `rbac_api_keys`. Re-issue key if necessary. |
| Developer cannot see production traces | User is in `Obs-Dev` with restricted team scope | Check user's `team_scope` in `rbac_users`. Update scope to include target service or change to `Obs-Platform-Engineers`. |
| Admin locked out of web portal | Session cookie expired or break-glass key lost | Query local SQLite database using CLI or inspect `rbac_api_keys` to retrieve admin recovery key. |

---

## 6. Document Governance & Publication Sign-Off

- **Originating Specification:** `ProjectAssistant/admin-runbooks/ADMIN-RUNBOOK-ENTERPRISE-RBAC-AND-IDENTITY-ACCESS-MANAGEMENT.md` (Central DB).
- **Cleared By:** Sovereign Demarcation Gate & Compliance Engine.
- **Classification:** `CLEARED_CUSTOMER_PUBLIC` &bull; In-Perimeter Deployment Ready.

