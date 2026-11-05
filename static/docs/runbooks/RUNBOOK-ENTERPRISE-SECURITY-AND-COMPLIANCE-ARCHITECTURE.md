# <dcouplr/> Operational Runbook: Enterprise Security, IAM & Compliance Architecture
**Document Classification:** Cleared Customer Public • Operational Security Runbook  
**Runbook Code:** `RUN-SECURITY-COMPLIANCE-001 Verified`  
**Governing Standard:** ITIL Information Security Management & CIS Controls v8  
**Applicability:** All `<dcouplr/>` In-Perimeter Deployments (AWS VPC, Azure VNet, GCP VPC, On-Premises Kubernetes, Air-Gapped Enclaves)  
**Target Roles:** Cloud Security Engineers, Information Security Officers (CISO / SecOps), Platform SRE Leads  
**Version:** 4.2.0-PROD • Approved for Customer Operations

---

## Executive Overview: In-Perimeter Security Baseline

`<dcouplr/>` provides enterprise observability designed from the ground up for zero-trust environments. Unlike traditional SaaS platforms that stream your telemetry across the public Internet, `<dcouplr/>` operates entirely inside your sovereign network boundary. 

This runbook provides actionable, step-by-step procedures for:
1. **Verifying In-Perimeter Sovereignty ($0.00 WAN Egress).**
2. **Configuring Enterprise IdP Federation (Okta & Microsoft Entra ID).**
3. **Provisioning and Managing the 6 Canonical RBAC Roles.**
4. **Enforcing Team-Level Scoping (ABAC).**
5. **Issuing, Rotating, and Revoking Ingestion Tokens & User API Keys.**
6. **Configuring Sensitive Data Scrubbing (PCI-DSS & PII Masking).**
7. **Streaming Immutable Audit Logs to Corporate SIEMs.**

---

## 1. Verifying In-Perimeter Sovereignty ($0.00 WAN Egress)

Before approving production workloads, security teams must verify that no customer telemetry leaves the VPC.

### Step 1.1: Verify Local Database Isolation
Ensure all node metrics, traces, and logs are written exclusively to the local SQLite WAL database:
```bash
# Verify active SQLite WAL database
curl -s http://localhost:8000/v1/vpc-database | jq .
```
Expected output:
```json
{
  "database_type": "SQLite 3 (Embedded Sovereign)",
  "storage_path": "data/vpc_telemetry.db",
  "concurrency_mode": "WAL",
  "egress_cost_usd": 0.00,
  "sovereignty_status": "IN_PERIMETER_ENCLOSED"
}
```

### Step 1.2: Inspect Outbound Gateway Firewall Rules
Review your cloud provider egress logs (e.g., AWS VPC Flow Logs or Azure NSG Flow Logs):
- **Allowed Outbound:** DNS (Port 53 UDP) and outbound TLS 1.3 / QUIC to Cloudflare Edge (if Outside-VPC Hubs are enabled).
- **Prohibited Outbound:** Any connections to public SaaS observability endpoints (e.g., `*.datadoghq.com`, `*.newrelic.com`). Egress counter must remain **0 Bytes**.

---

## 2. Configuring Enterprise IdP Federation (Okta & Entra ID)

`<dcouplr/>` supports SAML 2.0 and OpenID Connect (OIDC) with automated group-to-role assignment.

### Step 2.1: Okta SAML 2.0 Integration
1. Log in to the Okta Admin Console.
2. Navigate to **Applications** > **Create App Integration** > **SAML 2.0**.
3. Set **Single Sign-On URL**: `https://<YOUR-OBS-HOST>/v1/auth/sso/callback/okta`.
4. Set **Audience URI (SP Entity ID)**: `https://<YOUR-OBS-HOST>/v1/auth/sso/metadata`.
5. Under **Attribute Statements (Group Claims)**:
   - Name: `groups`
   - Filter: `Matches regex` &rarr; `.*Obs-.*`
6. Save and export the IdP Metadata XML.
7. Configure in `<dcouplr/>`:
   ```bash
   curl -X POST http://localhost:8000/v1/auth/sso/providers \
     -H "Content-Type: application/json" \
     -d '{
       "provider_id": "okta_corp",
       "protocol": "SAML2",
       "metadata_url": "https://company.okta.com/app/exk.../sso/saml/metadata"
     }'
   ```

### Step 2.2: Microsoft Entra ID (Azure AD) OIDC Integration
1. Navigate to **Azure Portal** > **Microsoft Entra ID** > **App Registrations**.
2. Register an app with Redirect URI: `https://<YOUR-OBS-HOST>/v1/auth/sso/callback/azure`.
3. Under **Token Configuration**, add the `groups` claim.
4. Copy Client ID and Tenant ID into `<dcouplr/>` environment variables:
   ```bash
   export SSO_OIDC_CLIENT_ID="<YOUR_CLIENT_ID>"
   export SSO_OIDC_CLIENT_SECRET="<YOUR_SECRET>"
   export SSO_OIDC_TENANT_ID="<YOUR_TENANT_ID>"
   ```

---

## 3. Provisioning & Managing RBAC Roles

Access is governed by 6 standard roles following the Principle of Least Privilege:

| Role Name | Intended Audience | Permitted Actions | Prohibited Actions |
| :--- | :--- | :--- | :--- |
| **`Obs-Admins`** | Platform SRE Leads, CloudOps Admins | Full user management, SSO configuration, billing controls, emergency key revocation. | Direct raw ingestion streaming without service key. |
| **`Obs-Platform-Engineers`** | DevOps Engineers, SREs | Ingestion pipeline tuning, collector key creation, shared alerts and dashboard templates. | Billing modifications, user provisioning, audit log clearance. |
| **`Obs-Dev-[Team]`** | Software Engineers, QA | Querying service metrics, APM traces, and logs scoped to their team. | Cross-team querying, global alert editing, billing visibility. |
| **`Obs-Security-Analyst`** | SOC Analysts, Incident Responders | Full read-only audit log inspection, forensic unmasked payload access (role-gated). | Modifying alerts, configuring ingestion, user management. |
| **`Obs-Executive-Viewers`** | Engineering Directors, VPs, CTO | Read-only high-level dashboards, SLA/SLO compliance reports, billing summaries. | Deep trace inspection, creating alerts, editing dashboards. |
| **`Obs-Service-Accounts`** | CI/CD Pipelines, Kubernetes Daemons | Automated ingestion token transmission (`dcp_ing_...`). | User interface login, querying metrics, reading audit logs. |

### Step 3.1: Provision a New User Identity
```bash
curl -X POST http://localhost:8000/v1/security/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_KEY>" \
  -d '{
    "username": "sarah.chen",
    "display_name": "Sarah Chen (FinOps Lead)",
    "email": "sarah.chen@enterprise.com",
    "role": "Obs-Executive-Viewers",
    "team_scope": "*"
  }'
```

---

## 4. Enforcing Attribute-Based Access Control (ABAC)

To isolate sensitive microservices (e.g., payment gateways, fraud detection, authentication), assign an explicit team scope:

```bash
curl -X PUT http://localhost:8000/v1/security/users/usr_sarah_chen/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_KEY>" \
  -d '{
    "role": "Obs-Dev",
    "team_scope": "payments"
  }'
```
> [!NOTE]
> Once scoped, the query execution engine will automatically rewrite all user queries to filter on `team:payments` or `namespace:payments-prod`. Queries targeting unauthorized services return `403 Forbidden`.

---

## 5. Token Governance: Ingestion Tokens vs User API Keys

Never use human user credentials for automated ingestion agents.

### Step 5.1: Create a Scoped Collector Ingestion Token
```bash
curl -X POST http://localhost:8000/v1/security/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_KEY>" \
  -d '{
    "name": "otel-k8s-us-west-collector",
    "key_type": "INGESTION_ONLY",
    "role": "Obs-Service-Accounts",
    "team_scope": "*",
    "expires_days": 180
  }'
```
Save the returned token (`dcp_ing_...`) immediately; plaintext is never stored in the database.

### Step 5.2: Emergency Key Revocation
If a collector token or user credential is compromised:
```bash
curl -X DELETE http://localhost:8000/v1/security/api-keys/key_1a2b3c4d \
  -H "Authorization: Bearer <ADMIN_KEY>"
```
The key is immediately invalidated in memory and marked `REVOKED` in SQLite SSOT.

---

## 6. Configuring Sensitive Data Masking & PII Redaction

Ensure in-perimeter regex scrubbing is active for compliance with PCI-DSS and HIPAA:
1. Open the `/admin` portal &rarr; **🛡️ RBAC & Identity Vault**.
2. Verify that the **Sensitive Data Scrubbing Filter** is enabled for:
   - Primary Account Numbers (Credit Cards)
   - Social Security Numbers / National Tax IDs
   - HTTP Authorization Bearer Tokens
   - Database Connection Strings (`postgresql://user:pass@host/db`)
3. Test a synthetic log line:
   ```bash
   curl -X POST http://localhost:8000/v1/logs/sanitize-test \
     -H "Content-Type: application/json" \
     -d '{"message": "User failed payment with card 4111222233334444 and token Bearer eyJhbGciOi..."}'
   ```
   Verified Output:
   `"User failed payment with card [CARD-REDACTED-XXXX] and token Bearer [TOKEN-REDACTED]"`

---

## 7. Streaming Immutable Audit Logs to Corporate SIEM

All administrative actions and security events are recorded in `rbac_audit_logs`.

### Step 7.1: Query Local Audit Logs
```bash
curl -s "http://localhost:8000/v1/security/audit-logs?limit=25" \
  -H "Authorization: Bearer <ADMIN_KEY>" | jq .
```

### Step 7.2: Stream to Splunk / Elastic / Sentinel
Configure the in-perimeter log forwarder daemon (`syslog-ng` or `FluentBit`) to ingest `/var/log/dcouplr/audit.log` and forward via TLS:
```
# /etc/fluent-bit/fluent-bit.conf
[INPUT]
    Name        tail
    Path        data/audit_events.jsonl
    Tag         dcouplr.audit

[OUTPUT]
    Name        splunk
    Match       dcouplr.audit
    Host        splunk-hec.corp.internal
    Port        8088
    Splunk_Token xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    TLS         On
```

---

## 8. SRE Operational Verification Checklist

| Phase | Verification Item | Action / URL | Target Result |
| :---: | :--- | :--- | :--- |
| **1** | Verify In-Perimeter Database | `/config` | Backed by `data/vpc_telemetry.db` in WAL mode. |
| **2** | Test RBAC Least Privilege | `/admin` &rarr; Persona Simulator | Verify `Obs-Dev` cannot see billing or audit logs. |
| **3** | Test ABAC Team Scoping | Query `team:fraud` with `Obs-Dev-Payments` | Result empty or `403 Forbidden`. |
| **4** | Verify Token Security | Inspect `SELECT key_hash FROM rbac_api_keys` | Plaintext secrets absent; SHA-256 only. |
| **5** | Verify Zero-WAN Egress | Cloud VPC Flow Logs | 0 Bytes egress to external monitoring clouds. |

---
*Authorized by `<dcouplr/>` Cloud Engineering & Customer Trust • Approved for Enterprise Production Operations.*
