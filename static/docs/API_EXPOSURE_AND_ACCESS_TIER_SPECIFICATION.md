# API Exposure & Access Tier Specification

**Document Identifier:** `VA-SPEC-API-TIERS-001`  
**Classification:** Enterprise Engineering & Architecture Specification  
**Version:** 1.0.0  
**Effective Date:** October 2026  
**Status:** Approved & Implemented in `migration_tools.api`

---

## 1. Executive Summary & Design Rationale

In enterprise infrastructure migration and telemetry platforms, exposing internal endpoints indiscriminately poses severe security and operational hazards. In `<dcouplr/>`, internal primitives—such as Raft voter node registration (`/v1/raft/cluster/join`), WAL database compaction (`/v1/storage/compaction/*`), point-in-time state machine snapshotting (`/v1/storage/snapshot/create`), and telemetry circuit breaker drills (`/v1/telemetry/circuit-breaker/drill`)—must never be visible to public crawlers, competitor reconnaissance, or unauthenticated users.

Conversely, prospective customers evaluating the platform need frictionless, zero-barrier trial access to transpilation engines and documentation, while enterprise customers in production require robust, cryptographically verifiable authentication (API Keys, Bearer JWTs, and federated OIDC SSO) to manage state migrations and custom alert rules.

To satisfy these dual requirements, `<dcouplr/>` enforces a **3-Tier API Exposure and Access Architecture**:

```
+---------------------------------------------------------------------------------------------------+
|                                 <dcouplr/> 3-Tier API Architecture                               |
+-------------------------------------+---------------------------------+---------------------------+
| TIER 1: Public / Evaluation         | TIER 2: Customer Authenticated  | TIER 3: Internal Admin    |
| (Open Discovery & Probes)           | (API Keys / Bearer Tokens)      | (Hidden & Admin-Only)     |
+-------------------------------------+---------------------------------+---------------------------+
| • Included in OpenAPI & Swagger UI  | • Included in OpenAPI / Swagger | • Excluded from Schema    |
| • No credentials required           | • Requires X-API-Key or Bearer  |   (include_in_schema=False)|
| • Evaluators, Probes & CLI Trials   | • Enterprise Workloads & FinOps | • Guarded by require_admin|
| • Rate Limited (120 req/min)        | • Rate Limited (1,200 req/min)  | • Storage, Consensus, Drills|
+-------------------------------------+---------------------------------+---------------------------+
```

---

## 2. Access Tier Definitions

### Tier 1: Public / Evaluation & Probes (Open)
- **Target Audience:** Prospective evaluators, open-source CLI users, automated liveness/readiness probes (Kubernetes, AWS ALB, Cloudflare), and customer support inquiries.
- **Authentication:** None required.
- **OpenAPI / Swagger UI Visibility:** **Included (`include_in_schema=True`)**.
- **Scope of Endpoints:**
  - Health checks (`/healthz`).
  - Diagnostic environment doctor (`/v1/system/doctor`).
  - AST parse, generate, and transpile evaluation (`/v1/parse`, `/v1/generate`, `/v1/translate`, `/v1/supported-matrix`).
  - Public Turnkey Migration Recipe catalog (`/v1/recipes`).
  - Telemetry read-only metrics and topology visualization (`/v1/telemetry/metrics`, `/v1/telemetry/topology`, `/v1/telemetry/cost-analysis`).
  - Customer operations & support ticketing (`/v1/support/*`).

### Tier 2: Customer Authenticated (Keys & Tokens Required)
- **Target Audience:** Licensed enterprise organizations, platform engineering teams, automated CI/CD migration pipelines (GitHub Actions, GitLab CI, ArgoCD).
- **Authentication:** Mandatory. Requires caller to present:
  - `X-API-Key: <token>` header, OR
  - `Authorization: Bearer <jwt_or_token>` header.
- **Role Requirement:** `Role.DEVELOPER` or `Role.ADMIN`.
- **OpenAPI / Swagger UI Visibility:** **Included (`include_in_schema=True`)** with OpenAPI Security Scheme `ApiKeyAuth` and `BearerAuth`.
- **Scope of Endpoints:**
  - Multi-monitor custom alert recalibration (`POST /v1/compiler/transpile-alert-rules`).
  - Infrastructure as Code (IaC) state migration transpilation (`POST /v1/iac/state-migration`).
  - Enterprise custom compilation presets (`GET/POST/DELETE /v1/compiler/custom-presets`).
  - Custom turnkey recipe registration and execution (`POST /v1/recipes/register`, `POST /v1/recipes/{recipe_id}/run`).
  - Multi-VPC topology provisioning and lift-and-shift plan generation (`POST /v1/telemetry/topology/vpcs`, `POST /v1/telemetry/topology/lift-and-shift`).
  - Automated migration replication plan execution (`POST /v1/telemetry/topology/replication-plan`).
  - Zero-egress network audit attestations (`GET /v1/telemetry/vpcs/{vpc_id}/egress-attestation`).
  - Remote-write exporter status inspection (`GET /v1/telemetry/remote-write/status`).

### Tier 3: Internal Admin & Infrastructure Operations (Hidden from Schema)
- **Target Audience:** Internal platform administrators, automated consensus nodes, SRE recovery harnesses, and the local `/configuration` Project Operations dashboard.
- **Authentication:** Strict administrative credentials required. Caller must provide:
  - Admin master token (`DCOUPLR_API_KEY` or `DCOUPLR_ADMIN_KEY`), OR
  - Admin session Bearer token issued by `/v1/admin/auth/verify`, OR
  - Federated OIDC token possessing the `admin` role claim.
- **Role Requirement:** Strictly `Role.ADMIN`.
- **OpenAPI / Swagger UI Visibility:** **Strictly Hidden (`include_in_schema=False`)**.
  - These routes do not appear in `/docs`, `/redoc`, or `/openapi.json`.
  - Public security scanners and automated schema crawlers observe zero presence of these routes.
  - The internal browser console (`/configuration`) and authenticated SRE scripts execute them directly.
- **Scope of Endpoints:**
  - Embedded Raft consensus cluster leader voter join (`POST /v1/raft/cluster/join`).
  - Go Raft gRPC bridge diagnostics (`GET /v1/raft/bridge/status`).
  - Local database storage compaction status, trigger, and snapshotting (`GET/POST /v1/storage/compaction/*`, `POST /v1/storage/snapshot/create`).
  - Dynamic Prometheus remote_write reconfiguration and ring buffer flush (`POST /v1/telemetry/remote-write/configure`, `POST /v1/telemetry/remote-write/flush`).
  - Telemetry circuit breaker chaos drill injection (`POST /v1/telemetry/circuit-breaker/drill`).
  - Project Record Assistant document administration and auth verification (`GET/POST /v1/admin/documents`, `POST /v1/admin/auth/verify`).

---

## 2. Authentication & Key Management Architecture

### 3.1 Supported Credentials & Transmission Formats

Clients may authenticate through either HTTP headers:

```http
POST /v1/iac/state-migration HTTP/1.1
Host: api.dcouplr.internal
X-API-Key: dcouplr-dev-prod-us-east-1-0812
Content-Type: application/json
```

Or standard Bearer authorization:

```http
POST /v1/recipes/rec-turnkey-dd-prom/run HTTP/1.1
Host: api.dcouplr.internal
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### 3.2 Role Hierarchy

```mermaid
graph TD
    classDef admin fill:#ef4444,stroke:#991b1b,color:#ffffff,stroke-width:2px;
    classDef dev fill:#3b82f6,stroke:#1d4ed8,color:#ffffff,stroke-width:2px;
    classDef probe fill:#10b981,stroke:#047857,color:#ffffff,stroke-width:2px;

    Admin["Role.ADMIN<br/>(Full Access to Tiers 1, 2, 3)"]:::admin
    Developer["Role.DEVELOPER<br/>(Access to Tiers 1 & 2)"]:::dev
    Probe["Role.PROBE / Public<br/>(Access to Tier 1 Only)"]:::probe

    Admin --> Developer
    Developer --> Probe
```

### 3.3 Production Enforcement Modes

The authentication subsystem is governed by the environment variable `DCOUPLR_ENFORCE_AUTH`:

| `DCOUPLR_ENFORCE_AUTH` | Behavior | Intended Environment |
|---|---|---|
| `false` (Default Dev) | Unauthenticated requests to developer/internal endpoints fallback to `username="local_dev", role=Role.ADMIN, is_dev_mode=True`. Explicit invalid keys are still rejected (HTTP 401). | Local Developer Workstation, Offline Sandbox |
| `true` / `strict` | Requests without valid credentials to any protected route are rejected with `HTTP 401 Unauthorized`. | Production VPC, Staging, Multi-tenant SaaS |

---

## 4. Comprehensive Endpoint Inventory & Exposure Matrix

The table below catalogs all 67 routes in `<dcouplr/>`, documenting their HTTP Method, Exposure Tier, OpenAPI Schema Inclusion, and Access Enforcement:

| HTTP Method | Route Path | Access Tier | In Public Schema | Role Required | Description & Purpose |
|---|---|:---:|:---:|:---:|---|
| **GET** | `/healthz` | **Tier 1** | **Yes** | Public | Kubernetes/ALB Liveness & Readiness probe. |
| **GET** | `/v1/supported-matrix` | **Tier 1** | **Yes** | Public | Returns AST translation support matrix across all vendors. |
| **POST** | `/v1/parse` | **Tier 1** | **Yes** | Public | Parses raw source monitor YAML/JSON into intermediate UITGraph. |
| **POST** | `/v1/generate` | **Tier 1** | **Yes** | Public | Emits target vendor code (Grafana, OpenTofu, Bicep) from UITGraph. |
| **POST** | `/v1/translate` | **Tier 1** | **Yes** | Public | End-to-end atomic translation from source rule to target code. |
| **GET** | `/v1/system/doctor` | **Tier 1** | **Yes** | Public | Validates local CLI binaries, container runtimes, and licenses. |
| **POST** | `/v1/system/lint` | **Tier 1** | **Yes** | Public | Performs mathematical syntax validation without full transpilation. |
| **GET** | `/v1/recipes` | **Tier 1** | **Yes** | Public | Catalog of Turnkey Enterprise Migration Recipes. |
| **GET** | `/v1/telemetry/metrics` | **Tier 1** | **Yes** | Public | Prometheus metric exposition for scraping. |
| **GET** | `/v1/telemetry/stream` | **Tier 1** | **Yes** | Public | Real-time Server-Sent Events (SSE) telemetry feed. |
| **GET** | `/v1/telemetry/topology` | **Tier 1** | **Yes** | Public | Multi-VPC network and cross-cloud topology graph. |
| **GET** | `/v1/telemetry/vpcs` | **Tier 1** | **Yes** | Public | Lists all registered source and destination VPCs. |
| **GET** | `/v1/telemetry/cost-analysis` | **Tier 1** | **Yes** | Public | Financial bandwidth and SaaS TCO comparison calculations. |
| **GET, POST**| `/v1/telemetry/finops/cost-comparison` | **Tier 1** | **Yes** | Public | Cloud cost projections (compute, storage, egress) across clouds. |
| **GET** | `/v1/telemetry/vpcs/{vpc_id}/monitoring-bundle` | **Tier 1** | **Yes** | Public | Exports pre-compiled Grafana/Prometheus bundles for a VPC. |
| **POST** | `/v1/telemetry/simulate-alert` | **Tier 1** | **Yes** | Public | Evaluates metric curves against thresholds and outputs YAML. |
| **GET, POST**| `/v1/support/*` | **Tier 1** | **Yes** | Public / Support | In-VPC customer support ticketing, SLA tracking, and solutions. |
| **POST** | `/v1/iac/state-migration` | **Tier 2** | **Yes** | Developer | Transpiles Terraform `.tfstate` and Pulumi state definitions. |
| **POST** | `/v1/compiler/transpile-alert-rules` | **Tier 2** | **Yes** | Developer | Recalibrates downscaled node and database alert thresholds. |
| **GET, POST, DEL**| `/v1/compiler/custom-presets` | **Tier 2** | **Yes** | Developer | Manages enterprise-specific compiler translation presets. |
| **POST** | `/v1/recipes/register` | **Tier 2** | **Yes** | Developer | Dynamically registers enterprise turnkey migration pipelines. |
| **POST** | `/v1/recipes/{recipe_id}/run` | **Tier 2** | **Yes** | Developer | Executes an enterprise turnkey recipe pipeline. |
| **POST** | `/v1/telemetry/topology/vpcs` | **Tier 2** | **Yes** | Developer | Registers new VPC boundaries in the topology map. |
| **POST** | `/v1/telemetry/topology/lift-and-shift` | **Tier 2** | **Yes** | Developer | Generates automated Lift & Shift migration plans. |
| **POST** | `/v1/telemetry/topology/replication-plan`| **Tier 2** | **Yes** | Developer | Generates cloud-native replication manifests (AWS MGN, Azure). |
| **GET** | `/v1/telemetry/vpcs/{vpc_id}/egress-attestation` | **Tier 2** | **Yes** | Developer | Cryptographic attestation of zero egress compliance. |
| **GET** | `/v1/telemetry/remote-write/status` | **Tier 2** | **Yes** | Developer | Operational diagnostics of Prometheus remote_write pipeline. |
| **POST** | `/v1/telemetry/circuit-breaker/drill` | **Tier 3** | **No** | **Admin** | Chaos fault injection tripping telemetry circuit breakers. |
| **POST** | `/v1/telemetry/remote-write/configure` | **Tier 3** | **No** | **Admin** | Dynamic runtime reconfiguration of TSDB remote_write targets. |
| **POST** | `/v1/telemetry/remote-write/flush` | **Tier 3** | **No** | **Admin** | Forces in-memory ring-buffer metrics to flush immediately. |
| **GET** | `/v1/raft/bridge/status` | **Tier 3** | **No** | **Admin** | Go Raft gRPC consensus client health and connectivity. |
| **POST** | `/v1/raft/cluster/join` | **Tier 3** | **No** | **Admin** | Dynamic voter node registration to Raft leader. |
| **GET** | `/v1/storage/compaction/status` | **Tier 3** | **No** | **Admin** | Embedded database WAL compaction metrics and memory RSS. |
| **POST** | `/v1/storage/compaction/trigger` | **Tier 3** | **No** | **Admin** | Manually triggers asynchronous chunked log compaction. |
| **POST** | `/v1/storage/snapshot/create` | **Tier 3** | **No** | **Admin** | Generates Gzip point-in-time state machine snapshot. |
| **GET, POST**| `/v1/admin/documents/*` | **Tier 3** | **No** | **Admin** | Project Record Assistant document read/write vault. |
| **GET** | `/v1/admin/framework-summary` | **Tier 3** | **No** | **Admin** | Real-time framework maturity metrics (SDLC, ITIL, PM, Delivery). |
| **POST** | `/v1/admin/auth/verify` | **Tier 3** | **No** | **Admin** | Verifies admin master credentials and issues session token. |
| **GET** | `/configuration`, `/pitch`, `/techdoc`, `/support` | UI | **No** | None / Browser | Interactive HTML single-page web applications. |

---

## 5. Technical Implementation in FastAPI

### 5.1 Route Hiding via `include_in_schema=False`

All Tier 3 internal routes declare `include_in_schema=False` directly on the route decorator. For example:

```python
# Tier 3 Internal Consensus Endpoint (Hidden from OpenAPI & Swagger)
@app.post(
    "/v1/raft/cluster/join",
    tags=["Raft Consensus Bridge"],
    include_in_schema=False,  # Hidden from public OpenAPI documentation
)
def join_raft_cluster(
    req: RaftClusterJoinRequest,
    _auth: AuthenticatedUser = Depends(require_admin),
):
    ...
```

### 5.2 OpenAPI Tag Segmentation

The public `/docs` Swagger interface only exposes clean, customer-relevant categories:
- `Core Transpilation`
- `Migration Recipes`
- `Telemetry & Topology`
- `Customer Operations & Support`
- `System Health`

Internal tags (`Admin & Governance`, `Raft Consensus Bridge`, `Storage & Log Compaction`) are stripped from `app.openapi_tags`.

---

## 6. Verification & Automated Assurance

The 3-tier exposure model is continuously validated in our CI/CD pipeline:

1. **Automated Schema Verification:**
   `TestVector4ContractualE2E.test_openapi_spec_availability_and_metadata` validates that:
   - `/openapi.json` returns HTTP 200 with OpenAPI specification version 3.1.0.
   - All Tier 1 and Tier 2 routes are documented with full request/response schemas.
   - Zero Tier 3 routes appear in the output schema dictionary.

2. **Role-Based Security Testing:**
   `test_security_and_rbac.py` validates that:
   - Unauthenticated callers cannot execute Tier 2 endpoints when `DCOUPLR_ENFORCE_AUTH=true`.
   - Callers with `Role.DEVELOPER` cannot execute Tier 3 administrative endpoints.
   - Master admin keys allow access to all three tiers.

---

## 7. Change Log

| Date | Version | Author | Description |
|---|---|---|---|
| 2026-10-26 | 1.0.0 | Staff Architecture & Security Team | Initial approved 3-Tier API exposure specification and endpoint audit. |
