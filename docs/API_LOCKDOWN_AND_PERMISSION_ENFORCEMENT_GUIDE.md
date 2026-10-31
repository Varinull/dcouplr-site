# <dcouplr/> API Lockdown & Permission Enforcement Guide

**Document Identifier:** `VA-GUIDE-API-LOCKDOWN-001`  
**Classification:** Enterprise Security Architecture & Operator Runbook  
**Version:** 1.0.0  
**Effective Date:** October 2026  
**Audience:** Platform Architects, SREs, DevSecOps, Platform Administrators  

---

## 1. Understanding `http://localhost:8000/openapi.json`

### What is `/openapi.json`?
In FastAPI and standard REST services, `/openapi.json` is a machine-readable document adhering to the **OpenAPI 3.0 Specification** (formerly Swagger). It details:
1. Every registered route (`paths`), supported HTTP methods (`GET`, `POST`, `DELETE`, etc.), and route summaries.
2. Query and path parameters, required request body schemas, and response payload models (`components.schemas`).
3. Security schemes (such as `ApiKeyAuth`, `BearerAuth`, and `OAuth2`).

When you visit `http://localhost:8000/docs/swagger`, the Swagger UI library downloads `http://localhost:8000/openapi.json` and renders the interactive documentation.

### Should `/openapi.json` Be Displayed?
The short answer is: **It depends on the environment and the audience, and it must never display internal or injection-prone APIs.**

| Deployment Scenario | Recommended Visibility | Configuration / Action |
| :--- | :--- | :--- |
| **Public Customer Evaluation** | **Sanitized Public Spec (35 Endpoints)** | Expose only customer-facing CLI, Dashboard, and Lift-and-Shift routes. Cloak all internal, SCIM, support, and admin routes. |
| **Strict Enterprise / Production** | **Authenticated Spec Only** | Gate `/openapi.json` behind API Key or Bearer token verification so only permitted customers can read the schema. |
| **Air-Gapped / Bank Grade VPC** | **Disabled in Public (`None`)** | Disable public `/openapi.json` (`openapi_url=None`) and serve the uncloaked spec exclusively within the internal OpenAPI specification (`/v1/admin/openapi.json`). |

### Injection and Reconnaissance Risks of Unfiltered `/openapi.json`
If `/openapi.json` is published without strict filtering, an attacker or competitor can inspect:
- **SCIM Directory Endpoints (`/v1/scim/v2/Users`):** Exposes account lifecycle schemas, creating potential user-injection or privilege escalation vectors.
- **Recipe Registration (`/v1/recipes/register`):** Exposes file-write APIs for creating dynamic pipelines on the host disk.
- **Raft Cluster Operations (`/v1/raft/*`):** Exposes consensus heartbeats and node join mechanisms.
- **Database Compaction (`/v1/storage/*`):** Exposes internal WAL compactor and tombstone sweep endpoints.
- **Telemetry Remote-Write (`/v1/telemetry/remote-write`):** Exposes telemetry ingestion pipelines to metric spoofing.

> [!IMPORTANT]
> **Resolution in `<dcouplr/>`:** All 49 internal, support, SCIM, and consensus endpoints are **strictly cloaked** from the public `/openapi.json`. They are accessible exclusively via `/v1/admin/openapi.json` and authenticated SRE tooling.

---

## 2. Architecture: 3-Tier Security & Exposure Partition

```
+---------------------------------------------------------------------------------------------------+
|                                 <dcouplr/> 3-Tier Security Boundary                                |
+-------------------------------------+---------------------------------+---------------------------+
| TIER 1: Customer Public Free        | TIER 2: Customer Paid / Permitted| TIER 3: Admin Internal    |
| (Open Discovery & CLI Probes)       | (API Key / Commercial License)  | (Admin Secret / Bearer)   |
+-------------------------------------+---------------------------------+---------------------------+
| • Included in /openapi.json         | • Included in /openapi.json     | • CLOAKED from public     |
| • Rate-Limited (120 req/min)        | • Requires valid customer key   | • Guarded by require_admin|
| • /health, /translate, /parse       | • /recipes/run, /telemetry/vpcs | • Admin Vault, Raft, SCIM |
| • AST mappings, Linting, Presets    | • State migration, Topology plan| • Full Admin Swagger Only |
+-------------------------------------+---------------------------------+---------------------------+
```

---

## 3. How to Lock All APIs and Unlock Only for Permitted Customers

To implement a complete **Zero-Trust Lockdown** where **all APIs are closed by default** and only authorized customers with verified permissions can execute them, implement the following 4-step architecture:

### Step 1: Global Authentication Gate (Deny-By-Default)

In `migration_tools/api/app.py`, configure the FastAPI application to enforce customer credentials across all endpoints using a Starlette BaseHTTPMiddleware or dependency injection:

```python
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

class GlobalCustomerPermissionMiddleware(BaseHTTPMiddleware):
    """Denies access to all APIs unless the caller provides a valid customer credential.
    
    Permitted public bypass paths:
    - /health, /healthz, /v1/health (Liveness/Readiness probes)
    - /v1/auth/sso/* (OIDC login redirection)
    """
    
    EXEMPT_PATHS = {
        "/health",
        "/healthz",
        "/v1/health",
        "/v1/auth/sso/providers",
        "/v1/auth/sso/okta/login",
        "/v1/auth/sso/azure/login",
    }
    
    async def dispatch(self, request, call_next):
        path = request.url.path.rstrip("/")
        
        # 1. Allow exempt health probes and SSO login redirects
        if path in self.EXEMPT_PATHS or path.startswith("/static"):
            return await call_next(request)
            
        # 2. Extract API Key or Bearer Token
        api_key = request.headers.get("X-API-Key")
        auth_header = request.headers.get("Authorization")
        bearer_token = auth_header.split("Bearer ")[-1] if auth_header and auth_header.startswith("Bearer ") else None
        
        token = api_key or bearer_token
        
        # 3. Reject if missing
        if not token:
            return JSONResponse(
                status_code=401,
                content={
                    "error": "Unauthorized",
                    "detail": "Authentication required. Please provide a valid customer 'X-API-Key' or 'Authorization: Bearer <token>' header.",
                    "code": "MISSING_CREDENTIALS"
                }
            )
            
        # 4. Verify Customer Permission
        if not self.is_authorized_customer(token, path, request.method):
            return JSONResponse(
                status_code=403,
                content={
                    "error": "Forbidden",
                    "detail": "Access denied. Your customer organization lacks active permissions for this resource.",
                    "code": "INSUFFICIENT_PERMISSIONS"
                }
            )
            
        return await call_next(request)
        
    def is_authorized_customer(self, token: str, path: str, method: str) -> bool:
        # Validate against Customer Token Store or Database
        return token.startswith("dcouplr-cust-") or token == os.getenv("DCOUPLR_ADMIN_KEY")
```

### Step 2: Role-Based Access Control (RBAC) & Scope Enforcement

`<dcouplr/>` includes an integrated RBAC engine (`migration_tools.api.security`):

1. **`require_customer`:** Validates that the caller belongs to an active customer tenant.
2. **`require_developer`:** Validates that the caller has engineering permissions to run recipes and plan migrations.
3. **`require_admin`:** Validates administrative clearance (Admin Vault, SCIM, Raft).

```python
from fastapi import Depends
from migration_tools.api.security import require_customer, AuthenticatedUser

@app.post("/v1/translate", tags=["Core Transpilation"])
async def translate_ast(
    payload: TranslationRequest,
    user: AuthenticatedUser = Depends(require_customer)
):
    """Only customers with valid permission tokens can invoke translation."""
    return process_translation(payload, tenant_id=user.tenant_id)
```

### Step 3: Cryptographic License Verification (Commercial Feature Gates)

For Tier 2 (Customer Paid) endpoints—such as automated state migration and replication orchestration:
1. The customer activates their commercial license via `POST /v1/license/activate` with an Ed25519-signed license blob.
2. The server verifies the cryptographic signature locally without dialing external servers (100% In-VPC Zero-Egress guarantee).
3. If the license is expired, invalid, or unlicensed, the endpoint returns:
   ```json
   {
     "error": "License Required",
     "detail": "Tier 2 feature requires an active Commercial Enterprise License. Please activate via /v1/license/activate.",
     "status": "UNLICENSED"
   }
   ```

### Step 4: Gating or Locking `/openapi.json` and Swagger UI

If you want to prevent unauthorized users from even reading `/openapi.json`:

#### Option A: Require Authentication to Download `/openapi.json`
Wrap the `/openapi.json` endpoint in an authentication dependency:

```python
@app.get("/openapi.json", include_in_schema=False)
async def get_secured_openapi(user: AuthenticatedUser = Depends(require_customer)):
    return app.openapi()
```

#### Option B: Disable Public OpenAPI Entirely in Production
When launching the application in high-security environments, pass `openapi_url=None` and `docs_url=None` to the public FastAPI instance:

```python
app = FastAPI(
    title="<dcouplr/> API",
    docs_url=None,       # Disables public /docs
    redoc_url=None,      # Disables public /redoc
    openapi_url=None,    # Disables public /openapi.json
)
```
In this mode, public clients receive `404 Not Found` if they attempt to probe `/openapi.json`. Administrators continue to access the full specification safely inside the Admin Vault via:
- **`GET /v1/admin/openapi.json`** (guarded by Admin Session JWT / API Key)
- **`GET /docs/swagger`** (`http://127.0.0.1:8000/docs/swagger`)

---

## 4. Operator Runbook: Configuring Customer Keys

### 1. Defining Permitted Customer Keys
Configure customer API keys in your environment or Kubernetes Secret:

```bash
# Production .env / Kubernetes Secret
DCOUPLR_ENFORCE_AUTH=true
DCOUPLR_CUSTOMER_KEYS="cust_acme_corp_key_2026,cust_globex_ent_key_2026"
DCOUPLR_ADMIN_KEY="dcouplr-admin-2026-vault-key"
```

### 2. Client Invocations with Customer Permission

#### CLI Curl Call:
```bash
# Valid Request with Customer Key
curl -X POST http://127.0.0.1:8000/v1/translate \
  -H "X-API-Key: cust_acme_corp_key_2026" \
  -H "Content-Type: application/json" \
  -d '{"source_type": "terraform", "target_type": "bicep", "content": "..."}'
```

#### Expected Success Response:
```json
{
  "status": "success",
  "source": "terraform",
  "target": "bicep",
  "output": "..."
}
```

#### Unauthenticated Request (Missing Key):
```bash
curl -X POST http://127.0.0.1:8000/v1/translate \
  -H "Content-Type: application/json" \
  -d '{"source_type": "terraform", "target_type": "bicep", "content": "..."}'
```

#### Expected Rejection:
```json
HTTP/1.1 401 Unauthorized
{
  "detail": "Authentication required. Please provide a valid customer 'X-API-Key' or 'Authorization: Bearer <token>' header."
}
```

---

## 5. Summary Matrix: What is Public vs What is in Admin

| Component / Route | Public Customer Exposure | Admin Vault Exposure |
| :--- | :--- | :--- |
| **Transpilation (`/v1/translate`, `/parse`)** | ✅ Visible & Callable | ✅ Fully Cataloged |
| **CLI & Diagnostics (`/v1/system/doctor`)** | ✅ Visible & Callable | ✅ Fully Cataloged |
| **Dashboard Topology (`/v1/telemetry/*`)** | ✅ Visible (Sanitized) | ✅ Fully Cataloged |
| **Turnkey Recipe Catalog (`/v1/recipes`)** | ✅ Read-only Catalog | ✅ Full Execution Matrix |
| **Turnkey Recipe Registration (`/register`)** | ❌ CLOAKED (Injection Risk) | ✅ Admin Only |
| **SCIM User Provisioning (`/v1/scim/*`)** | ❌ CLOAKED (Directory Injection Risk) | ✅ Admin Master Console |
| **Customer Support Bridge (`/v1/support/*`)** | ❌ CLOAKED | ✅ Support Desk & Admin Console |
| **Consensus Mesh (`/v1/raft/*`)** | ❌ CLOAKED | ✅ Admin Cluster Console |
| **Storage Compactor (`/v1/storage/*`)** | ❌ CLOAKED | ✅ Admin Storage Console |
| **Master Swagger UI** | `/docs/swagger` (Customer only, Open) | Privileged Swagger (All 107 APIs, **Strictly Gated**) |
| **OpenAPI JSON Endpoint** | `/openapi.json` (Filtered, Open) | `/v1/admin/openapi.json` (Full, **401 Unauthorized without Admin Auth**) |
| **API Inventory Catalog** | Hidden from public | `/v1/admin/api-catalog` (**401 Unauthorized without Admin Auth**) |

---

## 6. Administrator Security Gate on Privileged APIs

To prevent unauthorized access to sensitive internal infrastructure, consensus protocols, and customer support operations:

1. **Dual-Layer Gating**:
   - **Frontend DOM Lockdown**: Direct browser navigation to privileged endpoints immediately requires authentication, hiding `#swagger-ui`. Access requires either an active admin session, credentials verification (`admin` + passcode), or enterprise SSO (Okta / Azure).
   - **Backend 401 Enforcement**: Direct programmatic requests (via `curl` or scripts) to `/v1/admin/openapi.json` and `/v1/admin/api-catalog` return `HTTP 401 Unauthorized` unless accompanied by `X-API-Key: dcouplr-admin-2026`, `Authorization: Bearer <admin-token>`, or the `dcouplr_admin_token` cookie.
2. **Session Persistence**: Unlocking privileged endpoints sets an encrypted session cookie (`dcouplr_admin_token`) and session storage token, enabling seamless operator workflows between the Admin Document Vault and Admin Swagger UI.
3. **Instant Revocation**: Clicking `[ 🔒 Lock & Sign Out ]` clears all cookies and session storage, unmounts Swagger UI from memory, and re-locks the Security Gate immediately.
