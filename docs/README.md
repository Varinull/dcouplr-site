# 📚 `<dcouplr/>` Technical Documentation & Engineering Hub
**Repository Source:** [`https://github.com/varinull/dcouplr`](https://github.com/varinull/dcouplr)  
**Classification:** Enterprise Engineering Documentation, Runbook & Installer Hub  
**Engine Version:** `v1.0.0-GA` (Open-Core Architecture)  
**Security Guarantee:** Zero-Egress In-VPC Volatile RAM Execution ($0 Data Egress)  

---

Welcome to the central technical documentation repository for **`<dcouplr/>`**. This hub acts as the authoritative single source of truth for field engineers, Site Reliability Engineers (SREs), cloud architects, security auditors, and enterprise customers.

All tools, compilers, telemetry daemons, and cluster coordinators operate strictly **in-memory within customer-managed network perimeters (VPCs)**, ensuring that proprietary telemetry data, internal IP addresses, and cloud credentials are never exfiltrated to third-party endpoints.

---

## ⚡ Quick Navigation Index

| Tier | Category | Key Documentation & Links | Primary Audience |
| :---: | :--- | :--- | :--- |
| **0** | **🚀 Installers & Distribution** | [Getting Started & Installation Guide](GETTING_STARTED_AND_INSTALLATION_GUIDE.md) &bull; [Installers & Quickstarts](#1--installers--client-distribution) &bull; [install.sh](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/deploy/install.sh) &bull; [install.ps1](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/deploy/install.ps1) | All Users & CI/CD |
| **1** | **📖 Core Operator Manuals** | [Getting Started Guide](GETTING_STARTED_AND_INSTALLATION_GUIDE.md) &bull; [Engineer Field Manual](ENGINEER_USER_MANUAL.md) &bull; [Compiler Operator Manual](COMPILER_AND_AST_TRANSPILER_OPERATOR_MANUAL.md) &bull; [Dashboard Manual](IN_APP_TELEMETRY_DASHBOARD_OPERATOR_MANUAL.md) &bull; [Reference Manual](FOOLPROOF_ENTERPRISE_REFERENCE_MANUAL.md) | SREs, Platform Engineers |
| **2** | **🛠️ Turnkey Migration Recipes** | [Enterprise Recipes (1–8)](#3-️-turnkey-enterprise-migration-recipes) &bull; Datadog, New Relic, CloudWatch, Azure, OpenTofu | Cloud Architects, DevOps |
| **3** | **🚒 Operational Runbooks** | [Runbook Library (P1/P2 Incident Response)](#4--operational-runbooks--incident-response) &bull; Consensus Quorum, Replication, Chaos Gates | On-Call Engineers |
| **4** | **🏛️ Architecture & ADRs** | [ADR-008 (Raft & Direct VPC)](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/ARCHITECTURAL_DECISION_RECORD_008_RAFT_AND_CLOUDRUN_DIRECT_VPC.md) &bull; [In-VPC Bridge & FinOps](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/IN_VPC_TELEMETRY_BRIDGE_AND_FINOPS_INTEGRATION_SPECIFICATION.md) &bull; [API Security & RBAC](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/API_SECURITY_AND_RBAC_SPECIFICATION.md) | Systems Architects |
| **5** | **🛡️ Production Readiness & FinOps**| [Enterprise Readiness Scorecard](ENTERPRISE_READINESS_ASSESSMENT_SCORECARD.md) &bull; [Production Readiness Guide](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/PRODUCTION_READINESS_AND_DEPLOYMENT_GUIDE.md) &bull; [FinOps Footprint Calculator](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/FINOPS_INGESTION_AND_OPERATING_FOOTPRINT_CALCULATOR.md) &bull; [Maturity Audit](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/FEATURE_MATURITY_AND_PRODUCTION_READINESS_AUDIT.md) | Engineering Leadership |
| **6** | **💼 Commercial Licensing & Support** | [Commercial Tiers & Entitlements](#7--commercial-licensing-support-slas--hostinger-deployment) &bull; [License Generator CLI](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/scripts/generate_customer_license.py) &bull; Support Desk & Video War-Room Bridge | Enterprise Procurement |

---

## 1. 🚀 Installers & Client Distribution

`<dcouplr/>` distributes single-binary CLI packages and headless daemon containers built for air-gapped perimeters.

### 1.1 Linux & macOS Automated Installer
Execute in your terminal (non-root or root):
```bash
curl -sSL https://raw.githubusercontent.com/varinull/dcouplr/main/deploy/install.sh | bash
```
* Installs binary directly to `~/.local/bin/dcouplr` (or `/usr/local/bin/dcouplr`).
* Automatically checks system architecture (`x86_64`, `arm64`) and sets executable permissions.
* Fully air-gapped friendly: supports offline tarball decompression.

### 1.2 Windows Automated Installer (PowerShell)
Execute in an elevated PowerShell session:
```powershell
irm https://raw.githubusercontent.com/varinull/dcouplr/main/deploy/install.ps1 | iex
```
* Installs executable to `$env:LOCALAPPDATA\Programs\dcouplr\dcouplr.exe`.
* Automatically updates user `$env:PATH`.

### 1.3 Offline Zero-Egress Cryptographic Signature Verification
All release assets are cryptographically signed via Sigstore Cosign:
```bash
cosign verify-blob \
  --certificate-identity "https://github.com/varinull/dcouplr/.github/workflows/release.yml@refs/heads/main" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  --signature dcouplr-linux-amd64.sig \
  --certificate dcouplr-linux-amd64.pem \
  dcouplr-linux-amd64
```

---

## 2. 📖 Core Operator Manuals

`<dcouplr/>` maintains four authoritative manuals covering every layer of the operational lifecycle:

### 2.1 [Field Engineer's Practical Manual & Quickstart Guide](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/ENGINEER_USER_MANUAL.md) (`VA-MAN-ENG-001`)
* **Purpose:** Zero-overwhelm practical guide for day-to-day operations.
* **Key Topics:** 3-minute quickstart, CLI recipes, Web Compiler Studio guide, everyday cookbook scenarios (1–9), support desk operations, and common FAQ.

### 2.2 [Compiler & AST Transpiler Operator Manual](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/COMPILER_AND_AST_TRANSPILER_OPERATOR_MANUAL.md) (`VA-MAN-COMPILER-001`)
* **Purpose:** Comprehensive technical manual for the multi-vendor AST compiler engine.
* **Key Topics:** `UITGraph` specification, parser grammar lexers (Datadog, New Relic, CloudWatch, Azure Monitor, Terraform HCL), mathematical parity proofs ($\Phi(q) \equiv \Psi(\text{PromQL})$), 2-sigma anomaly approximation, cross-cloud IAM transpilation, and error taxonomy.

### 2.3 [In-App Telemetry & Topology Dashboard Operator Manual](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/IN_APP_TELEMETRY_DASHBOARD_OPERATOR_MANUAL.md) (`VA-MAN-DASHBOARD-001`)
* **Purpose:** Real-time operations manual for the in-app monitoring dashboard.
* **Key Topics:** Embedded Raft consensus metrics, WAL compaction thresholds, 4-VPC cross-cloud network topology, Prometheus remote_write configuration, and circuit-breaker telemetry.

### 2.4 [Foolproof Enterprise Reference Manual](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/FOOLPROOF_ENTERPRISE_REFERENCE_MANUAL.md) (`VA-MAN-FOOLPROOF-001`)
* **Purpose:** Complete function-by-function reference and formal compliance verification.
* **Key Topics:** Python and Go class and method specifications, EBNF syntax grammars, and 7 formal auditor pre-flight checklists.

### 2.5 [API Exposure & Access Tier Specification](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/API_EXPOSURE_AND_ACCESS_TIER_SPECIFICATION.md) (`VA-SPEC-API-TIERS-001`)
* **Purpose:** Authoritative 3-tier API exposure classification, token enforcement, and schema cloaking specification.
* **Key Topics:** Tier 1 (Public Evaluation & Probes), Tier 2 (Customer Authenticated with `X-API-Key` or Bearer tokens), Tier 3 (Internal Admin & Infrastructure routes strictly cloaked via `include_in_schema=False`), full 67-route matrix, and role hierarchy.

---

## 3. 🛠️ Turnkey Enterprise Migration Recipes

The repository includes 8 turnkey, deterministic migration pipelines located in [`recipes/`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/recipes/):

| Recipe ID | Name | Source Syntax | Target Platform | CLI Execution Command |
| :--- | :--- | :--- | :--- | :--- |
| **`recipe-01`** | **Datadog to Grafana 11** | Datadog Monitor JSON | Grafana Unified Alerting YAML | `python recipes/datadog_to_grafana11/migrate.py` |
| **`recipe-02`** | **CloudFormation to OpenTofu GCP**| AWS CloudFormation / HCL | OpenTofu GCP (`google_*`) | `python recipes/cloudformation_to_opentofu_gcp/migrate.py` |
| **`recipe-03`** | **PromQL Standardization** | Heterogeneous PromQL | Normalized PromQL (Arc/Anthos) | `python recipes/promql_standardization_azure_arc_anthos/migrate.py` |
| **`recipe-04`** | **New Relic to Prometheus** | New Relic NRQL JSON | Prometheus Alertmanager Rules | `python recipes/newrelic_to_prometheus/migrate.py` |
| **`recipe-05`** | **CloudWatch to Grafana 11** | AWS CloudWatch Alarms | Grafana 11 Unified Alerting | `python recipes/cloudwatch_to_grafana11/migrate.py` |
| **`recipe-06`** | **Datadog SLOs to Prometheus** | Datadog Service Level Objectives| PromQL Multi-Window Burn Rates | `python recipes/datadog_slo_to_prometheus_rules/migrate.py` |
| **`recipe-07`** | **Azure Monitor to Grafana 11** | Azure Monitor Metric Alerts | Grafana 11 YAML with Dynamic Thresholds | `python recipes/azure_monitor_to_grafana11/migrate.py` |
| **`recipe-08`** | **Cloud Run Direct VPC Egress** | Serverless VPC Connectors | OpenTofu Direct VPC Network Interfaces | `python recipes/cloud_run_direct_vpc_egress/migrate.py` |

---

## 4. 🚒 Operational Runbooks & Incident Response

All emergency operational procedures, quorum recovery guidelines, and verification benchmarks are maintained under [`docs/runbooks/`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/runbooks/):

### 4.1 [`RUNBOOK-DECOUPLER-P1-009.md`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/runbooks/RUNBOOK-DECOUPLER-P1-009.md)
* **Severity:** `P1 - CRITICAL`
* **Trigger:** Raft consensus quorum loss (`RaftQuorumDegraded` alert) or split-brain cluster partitions.
* **Resolution:** Dynamic peer discovery re-initialization, peer state pruning, and leader election validation.

### 4.2 [`RUNBOOK-DCOUPLR-REPLICATION-MIGRATION.md`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/runbooks/RUNBOOK-DCOUPLR-REPLICATION-MIGRATION.md)
* **Severity:** `P2 - MAJOR`
* **Trigger:** Live block-level database replication stall or transaction lag exceeding 100ms.
* **Resolution:** Asymmetric lag drain, connection pool resizing, and zero-loss cutover execution.

### 4.3 [`RUNBOOK-OTEL-HIGH-THROUGHPUT-BENCHMARK.md`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/runbooks/RUNBOOK-OTEL-HIGH-THROUGHPUT-BENCHMARK.md)
* **Severity:** `P3 - PERFORMANCE`
* **Trigger:** High telemetry volume testing (>100,000 metrics/sec).
* **Resolution:** OpenTelemetry Collector pipeline optimization, memory buffer tuning, and ring-buffer allocation.

### 4.4 [`RUNBOOK-DECOUPLER-004.md`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/runbooks/RUNBOOK-DECOUPLER-004.md)
* **Severity:** `P2 - RELIABILITY`
* **Trigger:** Automated circuit breaker trip under asymmetric downstream latency (>20ms).
* **Resolution:** Circuit breaker reset, rate smoothing, and queue drain verification.

---

## 5. 🏛️ Architectural Decision Records (ADRs) & Specifications

`<dcouplr/>` enforces formal architectural discipline documented across technical specifications:

* **[ADR-008: Raft Consensus & Cloud Run Direct VPC Egress](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/ARCHITECTURAL_DECISION_RECORD_008_RAFT_AND_CLOUDRUN_DIRECT_VPC.md):** Decouples distributed state consensus using HashiCorp Raft over mTLS/SPIFFE and adopts Google Cloud Run Direct VPC Egress over deprecated Serverless VPC Connectors.
* **[In-VPC Telemetry Bridge & FinOps Integration Specification](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/IN_VPC_TELEMETRY_BRIDGE_AND_FINOPS_INTEGRATION_SPECIFICATION.md):** Architecture for in-VPC OpenTelemetry Collector bridges and automated FinOps telemetry cost reductions.
* **[API Security & Role-Based Access Control Specification](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/API_SECURITY_AND_RBAC_SPECIFICATION.md):** RBAC matrix (`Admin`, `SRE_Operator`, `Auditor`, `Viewer`), OIDC JWT token validation, and air-gapped RBAC enforcement.
* **[Reusable Support Desk & Incident Bridge Specification](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/REUSABLE_SUPPORT_DESK_AND_INCIDENT_BRIDGE_SPECIFICATION.md):** Architectural spec for the FastAPI-mounted customer support portal, knowledge base, and in-VPC Jitsi Meet war-room incident bridge.

---

## 6. 🛡️ Security, Compliance & Air-Gapped Verification

### 6.1 In-Memory Regex Token Scrubber
`<dcouplr/>` contains a zero-compromise regex scrubber engine ([`migration_tools/security/anonymizer.py`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/migration_tools/security/anonymizer.py)) that parses payloads prior to AST generation:
* **RFC 1918 Private IP Masking:** Replaces all `10.0.0.0/8`, `172.16.0.0/12`, and `192.168.0.0/16` addresses with cryptographic placeholder tokens.
* **Cloud Credential Redaction:** Strips AWS Secret Access Keys (`[A-Za-z0-9/+=]{40}`), Google Cloud service account private keys, and database passwords.
* **Internal FQDN Redaction:** Replaces `.internal`, `.local`, `.corp`, and `.private` domain names.

### 6.2 Preflight System Doctor
Operators can verify local air-gap and memory ceiling compliance at any time:
```bash
dcouplr doctor
```
Checks verified:
* **RSS Memory Ceiling:** Asserts memory footprint remains under 50MB RAM under maximum load.
* **Zero Egress Validation:** Verifies no external outbound socket connections exist.
* **Parser AST Integrity:** Validates local grammar lexers are functional and deterministic.

---

## 7. 💼 Commercial Licensing, Support SLAs & Production Deployment

`<dcouplr/>` utilizes an open-core licensing model structured around **Active Monitored Nodes** rather than punitive metric ingestion volume.

### 7.1 Commercial Tier Matrix
| Tier | Pricing Base | Node Capacity | Incident SLA | Communication Channel | Support Desk & Bridge |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tier 0: Community Core** | **$0 / mo** | 1 Local CLI | Self-Service | GitHub Discussions | Self-Service KB |
| **Tier 1: Developer Pro** | **$300 / mo** | 10 Nodes | 48 Hours | Asynchronous Email | Verified Support Portal |
| **Tier 2: Cluster Small** | **$1,500 / mo** | 25 Nodes (+$60/node) | 9x5 NBD | Ticket Desk Queue | Support Desk + Incident Bridge |
| **Tier 3: Cluster Medium** | **$3,500 / mo** | 75 Nodes (+$45/node) | 24x7 P1 (2-Hr) | Shared Slack Channel | Dedicated Incident War-Room |
| **Tier 4: Cluster Large** | **$45 / node / mo** | Custom (91+) | 24x7 P1 (1-Hr) | Dedicated TAM War-Room | Custom AST Grammar & War-Room |
| **Tier 5: Custom Enterprise** | **Custom Annual** | **Unlimited Nodes** | **24x7 P1 (15-Min)** | **Named TAM & War-Room Bridge** | **Air-Gap Tarball + SLSA L3 SBOM** |

### 7.2 Zero-Egress Offline License Activation
Commercial license keys are cryptographically validated locally using ECDSA/RSA zero-egress public key verification without phoning home:
```bash
# Activate commercial license
dcouplr auth login --license-key "DCOUPLR-PRO-ACME-X9821-2026"

# Check active entitlement status
dcouplr auth status

# Revert to Community Free Tier
dcouplr auth logout
```

---

## 🌐 Public Documentation & Hostinger Web Assets

The technical documentation and landing assets are exported for high-speed CDN hosting on Hostinger:
* **Hostinger Static Distribution Directory:** `dist/hostinger-site/`
* **Production Deployment Archive:** `dist/dcouplr-hostinger-site.zip`
* **Static Export Script:** [`scripts/export_hostinger_bundle.py`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/scripts/export_hostinger_bundle.py)
* **Custom `.htaccess`:** Apache URL rewrites routing `/compiler` and `/dashboard` to local APIs or interactive static previews while serving the landing page cleanly at `/`.

---

## 🤝 Contributing to `<dcouplr/>`

We welcome contributions from the cloud engineering community!
* Read our [Architecture Guidelines](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/FOOLPROOF_ENTERPRISE_REFERENCE_MANUAL.md).
* Submit pull requests adhering to our automated PR compliance gate (`.github/workflows/pr-verification.yml`).
* Run the local test suite prior to opening PRs:
  ```bash
  pytest -v
  ```
  *(All 347 unit and integration tests must pass with 100% green status)*.
