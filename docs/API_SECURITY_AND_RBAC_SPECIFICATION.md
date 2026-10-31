# <dcouplr/> API Security, RBAC & Zero-Trust Governance Specification

**Document Identifier**: `SEC-SPEC-2026-V1`  
**Standard**: NIST SP 800-207 Zero Trust Architecture | SOC 2 Type II In-Perimeter Controls  
**Effective Date**: October 2026  
**Status**: Authoritative & Active  

---

## 1. Executive Summary & Zero-Trust Philosophy

`<dcouplr/>` operates as a **Hermetic, In-Perimeter Abstract Syntax Tree (AST) & Telemetry Transpilation Engine**. By architectural mandate, `<dcouplr/>` executes strictly inside the client’s air-gapped VPC or on-premise perimeter, guaranteeing **Zero External Cloud Egress**.

However, perimeter-only defenses are insufficient for modern enterprise security. `<dcouplr/>` enforces the fundamental principle of **Zero Trust: "Never Trust, Always Verify."** Network proximity (e.g. running on localhost or inside a private Kubernetes namespace) does not confer implicit trust. Every request to administrative, chaos, or AST mutation surfaces requires cryptographically verified authorization, scoped role boundaries, and strict payload size verification.

---

## 2. Role-Based Access Control (RBAC) Matrix

API operations are divided into three privilege tiers enforced at the FastAPI route dependency level via [`migration_tools/api/security.py`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/migration_tools/api/security.py):

| Role | Scope / Permissions | Allowed API Operations | Target Callers |
| :--- | :--- | :--- | :--- |
| **`Role.PROBE`** | Liveness, readiness, supported vendor matrix inspection | `GET /healthz`<br>`GET /v1/supported-matrix`<br>`GET /docs`, `GET /openapi.json` | Kubernetes kubelet probes, load balancer health checks, public documentation indexers |
| **`Role.DEVELOPER`** | AST parsing, multi-language transpilation, metrics monitoring, document catalog reading | `POST /v1/parse`<br>`POST /v1/generate`<br>`POST /v1/translate`<br>`GET /v1/telemetry/metrics`<br>`GET /v1/telemetry/stream` (SSE)<br>`GET /v1/admin/documents` | CI/CD build pipelines (GitHub Actions, GitLab CI), Developer IDE plugins, SRE dashboards |
| **`Role.ADMIN`** | Chaos engineering drills, VPC topology mutations, Project Record Assistant document persistence | `POST /v1/admin/documents`<br>`POST /v1/admin/auth/verify`<br>`POST /v1/telemetry/topology/vpcs`<br>`POST /v1/telemetry/circuit-breaker/drill` | Platform Engineering leads, Enterprise Cloud Architects, Vault Administrators |

---

## 3. Authentication Mechanisms

`<dcouplr/>` supports dual authentication schemes over HTTP/HTTPS:

### 3.1 Scheme 1: Static API Keys (`X-API-Key`)
Ideal for headless server-to-server microservice communication, CI/CD pipelines, and local automation scripts.

```http
POST /v1/admin/documents HTTP/1.1
Host: 127.0.0.1:8000
Content-Type: application/json
X-API-Key: dcouplr-admin-2026

{
  "path": "ProjectAssistant/00-where-we-are.md",
  "content": "..."
}
```

### 3.2 Scheme 2: Bearer Tokens (`Authorization: Bearer <token>`)
Ideal for interactive web sessions, developer studio workspaces, and OAuth2/JWT gateways. The session token is issued upon successful verification via `POST /v1/admin/auth/verify`.

```http
POST /v1/telemetry/circuit-breaker/drill HTTP/1.1
Host: 127.0.0.1:8000
Content-Type: application/json
Authorization: Bearer session_admin_token_2026

{
  "duration_sec": 10
}
```

### 3.3 Scheme 3: Enterprise OIDC & Single Sign-On (Okta & Azure Entra ID)
Ideal for enterprise browser-based access to the Project Record Assistant portal and federated API machine-to-machine access.
- Implemented via [`migration_tools/security/oidc.py`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/migration_tools/security/oidc.py) using Authlib and Starlette `SessionMiddleware`.
- **SSO Login Endpoints**:
  - `GET /v1/auth/sso/providers`: Dynamically lists active IdPs (Okta, Azure Entra ID).
  - `GET /v1/auth/sso/okta/login`: Initiates PKCE-secured Authorization Code flow to Okta.
  - `GET /v1/auth/sso/azure/login`: Initiates PKCE-secured Authorization Code flow to Azure Entra ID.
  - `GET /v1/auth/sso/{provider}/callback`: Exchanges authorization code, extracts IdP claims, and maps identity to `<dcouplr/>` RBAC roles.
- **Declarative Group & Role Mapping**:
  - **Okta Groups**: `OKTA_ADMIN_GROUPS` (`dcouplr-admins,admins,EnterpriseAdmins`) map to `Role.ADMIN`; `OKTA_DEV_GROUPS` map to `Role.DEVELOPER`.
  - **Azure Entra ID Roles**: `AZURE_ADMIN_ROLES` (`dcouplr.admin,GlobalAdmin,Admin`) map to `Role.ADMIN`; `AZURE_DEV_ROLES` map to `Role.DEVELOPER`.
- **JWT Bearer Token Validation**: Incoming `Authorization: Bearer <jwt>` tokens are verified against local session signatures or remote/cached IdP JWKS endpoints.

### 3.4 Strict Enforcement vs. Developer Mode
- **Production Mode (`DCOUPLR_ENFORCE_AUTH=true`)**:
  - Missing credentials return `401 Unauthorized`.
  - Insufficient role privileges return `403 Forbidden`.
  - Invalid keys or tokens return `401 Unauthorized` with `WWW-Authenticate: Bearer error="invalid_token"`.
- **Local Development Mode (`DCOUPLR_ENFORCE_AUTH=false`)**:
  - If a token/key is provided, it is strictly validated.
  - If no token is provided, requests are accepted under a default `local_dev` identity to preserve zero-friction developer workstation ergonomics.

---

## 4. In-Depth Defensive Controls

### 4.1 Request Payload Size Limits (Anti-DoS)
- Enforced via [`MaxPayloadSizeMiddleware`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/migration_tools/api/security.py#L131).
- **Default Upper Limit**: `5,242,880 bytes` (5.0 MiB), configurable via `DCOUPLR_MAX_PAYLOAD_SIZE`.
- Any incoming request body whose `Content-Length` exceeds this ceiling is immediately aborted with `HTTP 413 Payload Too Large` before parsing or consuming volatile RAM:
  ```json
  {
    "detail": "Payload too large. Request body of 10485760 bytes exceeds the maximum limit of 5242880 bytes (5.0 MiB)."
  }
  ```

### 4.2 Cross-Origin Resource Sharing (CORS) Hardening
- Wildcard `allow_origins=["*"]` with credentials is explicitly prohibited.
- Origins are locked down by default to local and internal addresses:
  - `http://127.0.0.1:8000`
  - `http://localhost:8000`
  - `http://127.0.0.1:3000`
  - `http://localhost:3000`
- Production origins can be supplied as a comma-separated list via the `DCOUPLR_ALLOWED_ORIGINS` environment variable.

### 4.3 Enterprise HTTP Security Headers
The [`SecurityHeadersMiddleware`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/migration_tools/api/security.py#L158) automatically injects defensive headers on 100% of HTTP responses:
- `X-Content-Type-Options: nosniff` (MIME confusion defense)
- `X-Frame-Options: SAMEORIGIN` (Clickjacking prevention)
- `X-XSS-Protection: 1; mode=block` (Legacy browser XSS reflection filter)
- `Referrer-Policy: strict-origin-when-cross-origin` (Zero referer leakage)
- `Permissions-Policy: geolocation=(), camera=(), microphone=()` (Hardware access lockdown)

---

## 5. Environment Variable Reference

Configure runtime security behavior by setting the following environment variables:

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `DCOUPLR_ENFORCE_AUTH` | `boolean` | `false` | When `true`, strictly mandates authentication on all non-probe endpoints. |
| `DCOUPLR_API_KEY` | `string` | `dcouplr-admin-2026` | Master administrative API key for `Role.ADMIN` operations. |
| `DCOUPLR_DEV_KEY` | `string` | `dcouplr-dev-2026` | Standard developer API key for `Role.DEVELOPER` operations. |
| `DCOUPLR_SESSION_SECRET` | `string` | `dcouplr-sso-secret-...` | Encryption key for Starlette session cookies during OAuth2 flows. |
| `DCOUPLR_JWT_SECRET` | `string` | `dcouplr-jwt-internal-...` | Internal HMAC-SHA256 signing secret for session JWT bearer tokens. |
| `OKTA_ENABLED` | `boolean` | Auto (if keys set) | Enables federated Okta OIDC SSO. |
| `OKTA_CLIENT_ID` | `string` | `""` | Okta OAuth2 Application Client ID. |
| `OKTA_CLIENT_SECRET` | `string` | `""` | Okta OAuth2 Client Secret. |
| `OKTA_ISSUER` | `string` | `""` | Okta authorization server issuer URL (e.g. `https://{domain}/oauth2/default`). |
| `OKTA_ADMIN_GROUPS` | `string` | `dcouplr-admins,...` | Comma-delimited list of Okta groups mapped to `Role.ADMIN`. |
| `OKTA_DEV_GROUPS` | `string` | `dcouplr-developers,...` | Comma-delimited list of Okta groups mapped to `Role.DEVELOPER`. |
| `AZURE_AD_ENABLED` | `boolean` | Auto (if keys set) | Enables Microsoft Azure Entra ID SSO. |
| `AZURE_AD_CLIENT_ID` | `string` | `""` | Azure Entra Application (client) ID. |
| `AZURE_AD_CLIENT_SECRET` | `string` | `""` | Azure Entra Client Secret. |
| `AZURE_AD_TENANT_ID` | `string` | `common` | Azure Directory (tenant) ID. |
| `AZURE_ADMIN_ROLES` | `string` | `dcouplr.admin,...` | Comma-delimited list of Azure App Roles mapped to `Role.ADMIN`. |
| `AZURE_DEV_ROLES` | `string` | `dcouplr.developer,...` | Comma-delimited list of Azure App Roles mapped to `Role.DEVELOPER`. |
| `DCOUPLR_MAX_PAYLOAD_SIZE` | `integer` | `5242880` | Maximum allowable HTTP request body size in bytes (default 5 MiB). |
| `DCOUPLR_ALLOWED_ORIGINS` | `string` | `http://127.0.0.1:8000,...` | Comma-delimited list of permitted CORS origins. |

---

## 6. Verification & Automated Test Coverage

The security posture is continuously verified by automated regression test suites:
- [`tests/test_security_and_rbac.py`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/tests/test_security_and_rbac.py):
  - Invalid API key and forged Bearer token rejection (HTTP 401).
  - Admin key & authenticated session token authorization (HTTP 200).
  - Developer role access boundary enforcement (HTTP 403 on admin routes).
  - Strict enforcement mode verification (`DCOUPLR_ENFORCE_AUTH=true`).
  - Oversized payload rejection (HTTP 413).
  - Security headers and CORS preflight verification.
- Run the full security validation suite via:
  ```powershell
  pytest tests/test_security_and_rbac.py -v
  ```
