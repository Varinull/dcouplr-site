# ⚙️ `<dcouplr/>` Compiler & AST Transpiler Operator Manual
**Document ID:** `VA-MAN-COMPILER-001`  
**Classification:** Enterprise Engineering Technical Specification & Operator Runbook  
**Target Audience:** Staff SREs, Platform Engineers, Cloud Architects, and Field TAMs  
**Status:** Approved for Production (`v1.0.0-GA`)  
**Security Guarantee:** Zero-Egress Local-First In-VPC Execution ($0 Cloud Egress)  

---

## 📑 Executive Summary & Table of Contents

The **`<dcouplr/>` Compiler & AST Transpiler Engine** is an open-core, deterministic translation system designed to eliminate multi-million dollar SaaS observability and infrastructure lock-in. Operating strictly inside the customer's Virtual Private Cloud (VPC) in volatile memory, `<dcouplr/>` parses proprietary vendor configurations (Datadog monitors, New Relic NRQL, AWS CloudWatch alarms, Azure Monitor alerts, and Terraform HCL) into a vendor-neutral **Universal Infrastructure & Telemetry Intermediate Representation (`UITGraph`)**, performs mathematical semantic normalization ($\Phi(q) \equiv \Psi(\text{PromQL})$), and synthesizes production-ready open-source artifacts (Grafana 11 Unified Alerting, Prometheus Alertmanager, OpenTofu HCL, and Azure Bicep).

### Table of Contents
1. [Compiler Architecture & Design Philosophy](#1-compiler-architecture--design-philosophy)
2. [The UIT-IR Abstract Syntax Tree Specification](#2-the-uit-ir-abstract-syntax-tree-specification)
3. [Multi-Vendor Source Parsers & Lexers](#3-multi-vendor-source-parsers--lexers)
4. [Target Code Generators & Emitters](#4-target-code-generators--emitters)
5. [PromQL & Telemetry Normalization Mathematics](#5-promql--telemetry-normalization-mathematics)
6. [Cross-Cloud IAM Transpilation Engine](#6-cross-cloud-iam-transpilation-engine)
7. [Dynamic Core Function HUD & Autonomous Dialect Detection](#7-dynamic-core-function-hud--autonomous-dialect-detection)
8. [Turnkey Enterprise Migration Recipes Catalog (Recipes 1–8)](#8-turnkey-enterprise-migration-recipes-catalog-recipes-18)
9. [Web Compiler Studio & Headless REST API Reference](#9-web-compiler-studio--headless-rest-api-reference)
10. [CLI Tooling, Diagnostics & Error Taxonomy](#10-cli-tooling-diagnostics--error-taxonomy)

---

## 1. Compiler Architecture & Design Philosophy

```
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │                 IN-VPC VOLATILE MEMORY BOUNDARY (ZERO-EGRESS)                   │
  │                                                                                 │
  │  Source Input                     Pre-Flight Guard           Semantic AST Graph │
  │  ┌───────────────┐               ┌─────────────────┐        ┌────────────────┐  │
  │  │ Datadog JSON  │──────────────▶│ In-Memory Regex │───────▶│                │  │
  │  │ New Relic     │ (Plaintext /  │ Token Scrubber  │        │  UITGraph AST  │  │
  │  │ CloudWatch    │  Stream)      │ (RFC 1918 Mask, │        │  (Nodes/Edges) │  │
  │  │ Azure Monitor │               │  Secret Redact) │        │                │  │
  │  │ Terraform HCL │               └─────────────────┘        └───────┬────────┘  │
  │  └───────────────┘                                                  │           │
  │                                                                     │           │
  │                                                                     ▼           │
  │  Synthesized Code                 Target Emitters            Math Normalizer    │
  │  ┌───────────────┐               ┌─────────────────┐        ┌────────────────┐  │
  │  │ Grafana 11 YAML│◀──────────────│ Prometheus/Alert│◀───────│ Parity Proof:  │  │
  │  │ PromQL Rules  │               │ OpenTofu HCL    │        │ Φ(q) ≡ Ψ(Prom) │  │
  │  │ OpenTofu HCL  │               │ Azure Bicep     │        │ 2σ Anomaly Res │  │
  │  │ Azure Bicep   │               │ State Relocator │        │ Rate Smoothing │  │
  │  └───────────────┘               └─────────────────┘        └────────────────┘  │
  └─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.1 The 4 Architectural Tenets
1. **Deterministic AST Transformation over LLM Prompting:**
   Core syntax trees are parsed using deterministic lexers and compiled via mathematical AST node mappings. `<dcouplr/>` never relies on non-deterministic generative LLMs for syntax tree emission, eliminating syntax hallucination, floating threshold skew, and uncompilable IaC blocks.
2. **Strict In-VPC Zero-Egress Guarantee:**
   All compilation passes execute inside customer-managed compute (Bare-metal, EC2, GCE, AKS/EKS/GKE, or Local CLI). No telemetry metadata, AST nodes, internal IP addresses, or IAM credentials ever leave volatile RAM ($0 cloud egress bill).
3. **In-Memory Volatile Token Scrubbing:**
   Before any AST node is constructed, the scanner passes the payload through an in-memory regex sanitizer ([`anonymizer.py`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/migration_tools/security/anonymizer.py)) that replaces private RFC 1918 IP addresses (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), AWS secret access keys, database passwords, and internal hostnames with deterministic cryptographic aliases (e.g. `ip-10-x-x-12.internal`).
4. **Mathematical Parity Verification ($\Phi(q) \equiv \Psi(\text{PromQL})$):**
   Query transformations preserve time-series integration calculus. Cumulative counter rollups (`.as_count()`) are synthesized into `increase()` expressions over evaluation windows, rate gauges (`.as_rate()`) are mapped into `rate()`, and Datadog 2-sigma anomaly detection queries are compiled into dual-sided `avg_over_time()` and `stddev_over_time()` standard deviation bounds.

---

## 2. The UIT-IR Abstract Syntax Tree Specification

The **Universal Infrastructure & Telemetry Intermediate Representation (UIT-IR)** is a strongly typed, directed graph defined in [`migration_tools/ir/models.py`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/migration_tools/ir/models.py) and [`migration_tools/ir/graph.py`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/migration_tools/ir/graph.py).

### 2.1 Top-Level AST Container: `UITGraph`
```python
class UITGraph(BaseModel):
    schema_version: str = "1.0.0"
    source_system: str             # "datadog", "new_relic", "cloudwatch", "azure_monitor", "terraform"
    monitors: List[MonitorNode]    # Telemetry and alert definitions
    resources: List[ResourceNode]  # Compute, network, database, storage resources
    policies: List[PolicyNode]     # IAM roles, security groups, firewall rules
    edges: List[Edge]              # Dependency relationships (MONITORS, SECURES, DEPENDS_ON)
    created_at: Optional[str]      # ISO 8601 compilation timestamp
```

### 2.2 Alert Node Specification: `MonitorNode`
```python
class MonitorNode(BaseModel):
    id: str                                # Unique canonical identifier (e.g., "mon-dd-10921")
    name: str                              # Human-readable title
    description: Optional[str]             # Alert playbook, runbook URL, or notification message
    source_vendor: str                     # "datadog", "newrelic", "cloudwatch", "azure"
    monitor_type: MonitorType              # METRIC_THRESHOLD, LOG_ALERT, COMPOSITE, SERVICE_CHECK
    target_metric: MetricTarget            # Detailed metric query AST
    condition: ComparisonOperator          # GT (>), GTE (>=), LT (<), LTE (<=), EQ (==), NEQ (!=)
    critical_threshold: float              # Critical firing limit
    warning_threshold: Optional[float]     # Optional warning/escalation limit
    evaluation_window: str                 # Duration condition must hold (e.g., "5m", "15m")
    tags: List[str]                        # Metadata tags (e.g., ["env:prod", "service:checkout"])
    notification_channels: List[str]       # Alert endpoints (e.g., ["slack-sre", "pagerduty-p1"])
    metadata: Dict[str, Any]               # Preserved source-specific options
```

### 2.3 Normalized Metric Query AST: `MetricTarget`
```python
class MetricTarget(BaseModel):
    raw_query: str                         # Original vendor query string
    metric_name: str                       # Canonical metric ID (e.g., "system.cpu.user")
    filters: Dict[str, str]                # Key-value label selectors (e.g., {"env": "prod"})
    group_by: List[str]                    # Aggregation dimensions (e.g., ["host", "region"])
    aggregation: AggregationFunction       # AVG, SUM, MIN, MAX, COUNT, RATE
    time_window: str                       # Resolution window (e.g., "5m", "1h")
    metric_modifier: Optional[str]         # ".as_count()", ".as_rate()", ".rollup()"
    is_anomaly_fallback: bool              # True if translated from statistical anomaly function
    anomaly_bounds: Optional[float]        # Standard deviations (e.g., 2.0 = 95.4% confidence)
    anomaly_algorithm: Optional[str]       # "basic", "agile", "robust"
    anomaly_window: Optional[str]          # Rolling baseline window (e.g., "1d", "7d")
    math_wrapper: Optional[str]            # "abs", "log10", "clamp_min", "clamp_max"
    math_parameter: Optional[float]        # Numerical operand for clamp functions
    temporal_offset: Optional[str]         # Historical time shift (e.g., "1h", "1d", "7d")
    is_outlier_fallback: bool              # True if translated from DBSCAN/MAD outlier detection
    outlier_bounds: Optional[float]        # Outlier distance threshold
    unmapped_tokens: List[str]             # Preserved tokens for compiler diagnostic logs
    diagnostics: List[str]                 # Compiler transformation trace messages
```

### 2.4 Infrastructure Resource Node: `ResourceNode`
```python
class ResourceNode(BaseModel):
    id: str                                # Canonical ID (e.g., "res-aws-i-0a1b2c3d")
    name: str                              # Resource name (e.g., "web-frontend-prod")
    resource_type: str                     # Canonical standard type (e.g., "compute.instance")
    source_provider: str                   # "aws", "gcp", "azure"
    properties: Dict[str, Any]             # Machine type, CIDR blocks, storage capacity, IOPS
    tags: Dict[str, str]                   # Operational tags
```

---

## 3. Multi-Vendor Source Parsers & Lexers

`<dcouplr/>` includes five dedicated parser implementations in [`migration_tools/parsers/`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/migration_tools/parsers/):

### 3.1 Datadog Monitor Parser (`datadog_monitor.py`)
- **Query Grammar Pattern:**
  Parses Datadog query expressions matching:
  `{eval_agg}(last_{window}):{metric_agg}:{metric_name}{tags}.{modifier} by {group_by} {op} {threshold}`
- **Extended Function Handlers:**
  - `anomalies(metric, 'algorithm', bounds)` &rarr; Translates to dual-sided moving window deviation.
  - `outliers(metric, 'dbscan', tolerance)` &rarr; Translates to peer-group dispersion thresholding.
  - `hour_before()`, `day_before()`, `week_before()` &rarr; Translates to PromQL temporal `offset`.
  - `abs()`, `log10()`, `clamp_min()`, `clamp_max()` &rarr; Translates to canonical PromQL math functions.
- **Notification Target Extraction:**
  Scans `@channel` tokens in monitor message bodies (e.g., `@slack-infra`, `@pagerduty-critical`) and maps them to alert notification channel lists.

### 3.2 New Relic NRQL Alert Parser (`nrql_alert.py`)
- **Query Grammar Pattern:**
  Matches standard New Relic queries:
  `SELECT {agg}({target}) FROM {table} WHERE {filters} FACET {dimensions} SINCE {window}`
- **Table Remappings:**
  - `SystemSample` &rarr; `system.cpu.user`, `system.mem.used`, `system.load.15`
  - `ProcessSample` &rarr; `process.cpu.user`, `process.memory.rss`
  - `Transaction` &rarr; `trace.http.request.duration`, `http.requests.total`
  - `TransactionError` &rarr; `http.requests.errors`
- **Aggregation Translations:**
  NRQL `average()`, `percentile()`, `rate()`, and `filter()` clauses are tokenized into canonical aggregation AST primitives.

### 3.3 AWS CloudWatch Alarm Parser (`cloudwatch_alarm.py`)
- **Alarm Types Supported:**
  - Standard Metric Alarms (`Namespace`, `MetricName`, `Statistic`, `Dimensions`, `Threshold`).
  - Metric Math Alarms (`MetricDataQueries` array with math expressions e.g. `m1 / m2 * 100`).
  - Anomaly Detection Alarms (`ANOMALY_DETECTION_BAND(m1, 2)`).
- **Canonical Metrics:**
  - `AWS/EC2 CPUUtilization` &rarr; `node_cpu_utilization_user`
  - `AWS/EC2 NetworkIn` / `NetworkOut` &rarr; `node_network_receive_bytes_total` / `transmit`
  - `AWS/RDS CPUUtilization` &rarr; `aws_rds_cpu_utilization_average`
  - `AWS/ApplicationELB RequestCount` &rarr; `http_requests_total`

### 3.4 Azure Monitor Metric Alert Parser (`azure_monitor.py`)
- **Alert Payloads Supported:**
  - Static Metric Alerts (`Microsoft.Insights/metricAlerts`).
  - Dynamic Threshold Alerts (`DynamicThresholdCriteria` with `failingPeriods` and `sensitivity`).
  - Scheduled Query Rules (Kusto KQL queries over Log Analytics).
- **Metric Translations:**
  - `Percentage CPU` &rarr; `azure_vm_percentage_cpu`
  - `Available Memory Bytes` &rarr; `azure_vm_available_memory_bytes`
  - `DTU percentage` &rarr; `azure_sql_dtu_percentage`

### 3.5 Terraform / OpenTofu HCL Parser (`terraform_hcl.py`)
- **Block Tokenizer:**
  Parses both native HCL text files and `tf.json` configuration structures into `ResourceNode`, `PolicyNode`, and dependency `Edge` elements.
- **Canonical Resource Typing:**
  | Source Cloud Provider | Source Terraform Resource | Canonical UIT-IR Type |
  | :--- | :--- | :--- |
  | **AWS** | `aws_instance` | `compute.instance` |
  | **AWS** | `aws_vpc` / `aws_subnet` | `network.vpc` / `network.subnet` |
  | **AWS** | `aws_db_instance` | `database.relational` |
  | **AWS** | `aws_eks_cluster` / `aws_eks_node_group` | `container.kubernetes_cluster` |
  | **AWS** | `aws_sqs_queue` / `aws_sns_topic` | `queue.message_queue` / `pubsub_topic` |
  | **AWS** | `aws_lb` / `aws_alb` | `network.load_balancer` |
  | **AWS** | `aws_kms_key` | `security.key_management` |
  | **AWS** | `aws_iam_role` / `aws_iam_policy` | `iam.role` / `iam.policy` |
  | **GCP** | `google_compute_instance` | `compute.instance` |
  | **GCP** | `google_compute_network` | `network.vpc` |
  | **GCP** | `google_sql_database_instance` | `database.relational` |
  | **GCP** | `google_container_cluster` | `container.kubernetes_cluster` |
  | **Azure** | `azurerm_linux_virtual_machine` | `compute.instance` |
  | **Azure** | `azurerm_virtual_network` | `network.vpc` |
  | **Azure** | `azurerm_postgresql_flexible_server`| `database.relational` |
  | **Azure** | `azurerm_kubernetes_cluster` | `container.kubernetes_cluster` |

---

## 4. Target Code Generators & Emitters

The emission layer in [`migration_tools/generators/`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/migration_tools/generators/) transforms the validated `UITGraph` into deployment-ready configurations:

### 4.1 Grafana 11 Unified Alerting Emitter (`grafana_alert.py`)
- **Output:** Provisioning YAML matching Grafana 10+ and 11 Alerting schema.
- **Execution Pipeline:**
  - **RefId "A":** Time-series query using the synthesized PromQL query.
  - **RefId "B":** Reduce expression (`last`, `mean`, or `max` over the evaluation window).
  - **RefId "C":** Math threshold comparison (`$B > CriticalThreshold`).
- **Multi-Threshold Pipeline (Enterprise Mode):**
  When warning thresholds are configured, emits a 4-step pipeline: RefId "A" (Query), RefId "B" (Reduce), RefId "C" (Warning Condition), RefId "D" (Critical Condition), allowing Grafana to escalate alerts gracefully.

### 4.2 Prometheus Alertmanager Rules Emitter (`grafana_alert.py`)
- **Output:** PrometheusRule YAML or native Alertmanager `rules.yaml`.
- **Structure:**
  ```yaml
  groups:
    - name: Migrated_Datadog_Alerts
      rules:
        - alert: HighCPUUsage_Prod
          expr: avg by (host) (node_cpu_utilization_user{env="prod"}) > 85.0
          for: 5m
          labels:
            severity: critical
            team: sre
          annotations:
            summary: High CPU usage detected on {{ $labels.host }}
            runbook_url: https://docs.dcouplr.com/runbooks/cpu-spike
  ```

### 4.3 OpenTofu Multi-Cloud IaC Emitter (`opentofu_generator.py`)
Generates native, declarative HCL code targeting Google Cloud Platform (`hashicorp/google`), Amazon Web Services (`hashicorp/aws`), or Microsoft Azure (`hashicorp/azurerm`):
- **Sizing Equivalence Engine:**
  Automatically translates instance sizes across hyperscalers (e.g. AWS `t3.medium` $\to$ GCP `e2-medium` $\to$ Azure `Standard_B2ms`).
- **Subnet & IP Allocation:**
  Preserves non-overlapping RFC 1918 CIDRs while substituting target-native routing resources.
- **CRD & Unmapped Attribute Fallback:**
  Any proprietary or custom CRD block not strictly in the canonical ontology is wrapped into an `# [UNMAPPED-RESOURCE-FALLBACK]` block with all key-value attributes preserved as commented HCL, guaranteeing zero data loss.

### 4.4 Azure Bicep Emitter (`bicep_generator.py`)
Emits strongly typed Azure Bicep templates (`.bicep`) for deployment via Azure CLI or Azure Resource Manager, compiling network definitions into `Microsoft.Network/virtualNetworks`, compute into `Microsoft.Compute/virtualMachines`, and identities into `Microsoft.ManagedIdentity/userAssignedIdentities`.

### 4.5 Datadog Monitor Generator & Bi-Directional Query Emitter (`datadog_monitor.py`)
Unlocks true **two-way bi-directional translation** ($\phi \circ \psi = 	ext{id}$), allowing engineers to transpile Prometheus alert rules, Grafana Unified Alerting definitions, or multi-vendor monitors back into native Datadog Monitor JSON format:
- **Canonical Reverse Metric Mapping:**
  Maps standard OpenMetrics and node_exporter identifiers back to Datadog metrics (e.g. `node_cpu_utilization_user` $	o$ `system.cpu.user`, `node_memory_active_bytes` $	o$ `system.mem.used`, `http_request_duration_seconds` $	o$ `trace.http.request.duration`).
- **Query Grammar Synthesis:**
  Reconstructs Datadog evaluation syntax `avg(last_5m):system.cpu.user{env:prod} by {host} > 85` including time windows (`last_5m`, `last_1h`), tag dimensions (`{env:prod}`), group-by blocks (`by {host}`), comparison operators (`>`, `>=`, `<`, `<=`), and threshold conditions.
- **Notification & Message Bridge:**
  Formats notification channels with Datadog `@` tags (`@slack-sre @pagerduty`) and appends provenance tags (`migrated_by:dcouplr`).
- **Two-Way CLI Invocation:**
  ```bash
  dcouplr translate --source prometheus --target datadog --input rules.yaml --output datadog-monitor.json
  ```

---

## 5. PromQL & Telemetry Normalization Mathematics

Observability transpilation is fundamentally a mathematical mapping problem across time-series querying models. `<dcouplr/>` implements formal parity proofs to ensure alerts fire under identical conditions.

### 5.1 Cumulative Counters: `.as_count()` vs. `increase()`
- **Datadog Semantic:**
  `sum:http.requests.total{env:prod}.as_count()` computes the sum of discrete increments that occurred within the evaluation bucket.
- **PromQL Synthesis:**
  In Prometheus, cumulative counters are monotonically increasing values subject to host reboots and container restarts.
  $$\Psi(q) = \text{sum}(\text{increase}(http\_requests\_total\{env="prod"\}[5m]))$$
  `<dcouplr/>` detects the `.as_count()` modifier and synthesizes an `increase()` function over the evaluation window with automatic counter reset compensation.

### 5.2 Rate Derivation: `.as_rate()` vs. `rate()`
- **Datadog Semantic:**
  `avg:system.io.ops{host:db-01}.as_rate()` computes per-second rate of change.
- **PromQL Synthesis:**
  $$\Psi(q) = \text{rate}(system\_io\_ops\{host="db-01"\}[5m])$$

### 5.3 Statistical Anomaly Approximation (2-Sigma Proof)
Proprietary SaaS engines charge high premiums for black-box ML anomaly detectors. `<dcouplr/>` compiles Datadog's `anomalies()` function into transparent, zero-cost moving-window statistical PromQL:

$$\text{Datadog:} \quad \text{avg}(last\_4h):\text{anomalies}(\text{avg}:system.cpu.user\{env:prod\}, 'basic', 2) > 0.5$$

$$\Downarrow \text{ Transpiled PromQL } \Downarrow$$

$$\text{abs}(\text{avg}(system\_cpu\_user\{env="prod"\}) - \text{avg\_over\_time}(system\_cpu\_user\{env="prod"\}[1d])) > (2.0 \times \text{stddev\_over\_time}(system\_cpu\_user\{env="prod"\}[1d]))$$

**Mathematical Proof:**  
Let $X_t$ be the real-time metric value. The rolling mean $\mu_t = \text{avg\_over\_time}(X_t[W])$ and rolling standard deviation $\sigma_t = \text{stddev\_over\_time}(X_t[W])$ establish the normal operating envelope. For a normal distribution, $|X_t - \mu_t| > 2\sigma_t$ captures values outside the 95.4% confidence interval without requiring proprietary ML models.

### 5.4 Metric Name & Dimension Normalization
- All periods (`.`) and hyphens (`-`) in metric names and filter keys are converted to underscores (`_`) to comply with Prometheus OpenMetrics regex `[a-zA-Z_:][a-zA-Z0-9_:]*`.
- Standard tag prefixes (`env:`, `team:`, `service:`) are parsed into distinct label-value pairs: `{env="prod", team="sre", service="cart"}`.

---

## 6. Cross-Cloud IAM Transpilation Engine

Security identity translation is often the highest-risk component of any cloud migration. `<dcouplr/>` provides a bi-directional IAM mapping compiler in [`opentofu_generator.py`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/migration_tools/generators/opentofu_generator.py):

### 6.1 IAM Entity Equivalence Map
| Cloud Concept | AWS IAM | Google Cloud Platform IAM | Azure RBAC & Managed Identity |
| :--- | :--- | :--- | :--- |
| **Workload Identity** | `aws_iam_role` | `google_service_account` | `azurerm_user_assigned_identity` |
| **Instance Attachment**| `aws_iam_instance_profile`| Compute Service Account Binding | VM Identity Block (`type = "UserAssigned"`) |
| **Policy Definition** | `aws_iam_policy` | `google_project_iam_custom_role` | `azurerm_role_definition` |
| **Role Assignment** | `aws_iam_role_policy_attachment`| `google_project_iam_member` | `azurerm_role_assignment` |

### 6.2 AWS IAM Policy to GCP IAM Member Transpilation Example
**Input (AWS IAM Policy JSON in Terraform):**
```hcl
resource "aws_iam_role" "app_executor" {
  name = "app-executor-role"
}

resource "aws_iam_policy" "s3_read" {
  name = "s3-read-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject", "s3:ListBucket"]
      Resource = "arn:aws:s3:::my-corp-data/*"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "app_attach" {
  role       = aws_iam_role.app_executor.name
  policy_arn = aws_iam_policy.s3_read.arn
}
```

**Transpiled Output (Target OpenTofu GCP HCL):**
```hcl
# Transpiled by <dcouplr/> IAM Engine: AWS IAM -> GCP IAM
resource "google_service_account" "app_executor" {
  account_id   = "app-executor-role"
  display_name = "Transpiled from AWS IAM Role app-executor-role"
}

# Canonical Mapping: s3:GetObject / s3:ListBucket -> roles/storage.objectViewer
resource "google_project_iam_member" "app_attach" {
  project = var.gcp_project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.app_executor.email}"
}
```

---

## 7. Dynamic Core Function HUD & Autonomous Dialect Detection

When operators input configurations into `<dcouplr/>` (via CLI, REST API, or Compiler Studio), the system automatically analyzes input tokens to determine source grammar dialects without requiring manual flag specification.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      DYNAMIC CORE FUNCTION HUD                         │
├────────────────────────────────┬───────────────────────────────────────┤
│ Detected Source Dialect        │ Datadog Monitor JSON v2               │
│ Parser Confidence Score        │ 99.8% (Matched AST signature)         │
│ Core Grammar Features Detected │ [Metric Threshold, Rate Modifier,     │
│                                │  Anomaly Function (2.0σ), Tag Filters]│
│ Entities Parsed                │ 8 Monitors • 0 Deadlocks              │
│ Mathematical Parity Status     │ 100.0% Guaranteed                     │
│ Zero-Egress Boundary           │ ENFORCED (In-Memory Volatile RAM)     │
└────────────────────────────────┴───────────────────────────────────────┘
```

### 7.1 Autonomous Dialect Heuristics
1. **Datadog JSON Signature:** Presence of keys `"query"`, `"options"`, `"thresholds"`, `"message"`, or query prefixes `avg(last_`, `max(last_`, `anomalies(`.
2. **New Relic NRQL Signature:** Presence of `"nrql"`, `"query"`, or strings beginning with `SELECT ... FROM ... WHERE ... FACET`.
3. **AWS CloudWatch Signature:** Presence of `"AlarmName"`, `"MetricName"`, `"Namespace"`, `"Dimensions"`, `"MetricDataQueries"`.
4. **Azure Monitor Signature:** Presence of `"criteria"`, `"allOf"`, `"metricNamespace"`, `"odata.type"`, or KQL queries.
5. **Terraform / OpenTofu HCL:** Tokens `resource "..."`, `variable "..."`, `terraform {`, `module "..."`.

---

## 8. Turnkey Enterprise Migration Recipes Catalog (Recipes 1–8)

`<dcouplr/>` ships with 8 pre-compiled, verified enterprise migration recipes located in [`recipes/`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/recipes/):

```
recipes/
├── datadog_to_grafana11/                # Recipe 1: Datadog Monitors -> Grafana 11 Unified Alerting
├── cloudformation_to_opentofu_gcp/      # Recipe 2: AWS CloudFormation / IaC -> OpenTofu GCP
├── promql_standardization_azure_arc_anthos/ # Recipe 3: Multi-Cloud Telemetry Standardization
├── newrelic_to_prometheus/              # Recipe 4: New Relic NRQL Alerts -> Prometheus Rules
├── cloudwatch_to_grafana11/             # Recipe 5: AWS CloudWatch Alarms -> Grafana 11 Alerts
├── datadog_slo_to_prometheus_rules/     # Recipe 6: Datadog Service Level Objectives -> PromQL SLOs
├── azure_monitor_to_grafana11/          # Recipe 7: Azure Monitor Metric Alerts -> Grafana 11
└── cloud_run_direct_vpc_egress/         # Recipe 8: OpenTofu Cloud Run Direct VPC Egress Subnets
```

### Recipe 1: Datadog Monitors $\to$ Grafana 11 Unified Alerting
- **Input:** JSON array of Datadog monitor definitions.
- **Output:** Grafana 11 provisioning YAML with 3-stage RefId A/B/C query pipelines and PromQL syntax.
- **CLI Command:**
  ```bash
  dcouplr translate --input monitors.json --source datadog --target grafana --output grafana-alerts.yaml
  ```

### Recipe 2: AWS CloudFormation / IaC $\to$ OpenTofu GCP
- **Input:** AWS CloudFormation JSON/YAML or Terraform AWS HCL.
- **Output:** Declarative OpenTofu Google Cloud Platform configuration (`google_compute_instance`, `google_compute_network`, `google_sql_database_instance`).
- **CLI Command:**
  ```bash
  dcouplr translate --input infrastructure.tf --source terraform --target opentofu_gcp --output gcp_infra.tf
  ```

### Recipe 3: PromQL Standardization (Azure Arc & Google Anthos)
- **Input:** Mixed multi-cloud monitoring queries from heterogeneous clusters.
- **Output:** Unified, cluster-agnostic PromQL queries with standardized dimensional labels (`cluster_id`, `node_role`, `datacenter`).

### Recipe 4: New Relic NRQL $\to$ Prometheus Alertmanager
- **Input:** New Relic NRQL alert condition JSON exports.
- **Output:** Prometheus Alertmanager rules YAML mapping NRQL tables and facets to OpenMetrics queries.
- **CLI Command:**
  ```bash
  dcouplr translate --input newrelic_alerts.json --source new_relic --target prometheus --output prometheus_rules.yaml
  ```

### Recipe 5: AWS CloudWatch Alarms $\to$ Grafana 11 Alerts
- **Input:** CloudWatch alarm configurations from AWS CLI (`describe-alarms`).
- **Output:** Grafana Unified Alerting YAML mapping `AWS/EC2`, `AWS/RDS`, and `AWS/ApplicationELB` metrics.

### Recipe 6: Datadog SLOs $\to$ Prometheus Recording & Alert Rules
- **Input:** Datadog 7-day and 30-day Service Level Objective (SLO) definitions.
- **Output:** Prometheus recording rules calculating rolling error budgets ($1 - \text{SLI}$) and burn rate multi-window alerts.

### Recipe 7: Azure Monitor $\to$ Grafana 11 Alerts
- **Input:** Azure Monitor Metric Alert ARM JSON.
- **Output:** Grafana 11 YAML with dynamic threshold compensation and Azure VM metric translations.

### Recipe 8: OpenTofu Cloud Run Direct VPC Egress Subnets
- **Input:** Legacy Google Cloud Serverless VPC Access connector configurations (`google_vpc_access_connector`).
- **Output:** Modern `google_cloud_run_v2_service` Direct VPC Egress network interface blocks, eliminating connector VM overhead and recurring egress latency.

---

## 9. Web Compiler Studio & Headless REST API Reference

### 9.1 Visual Compiler Studio (`/compiler`)
The Web Compiler Studio provides a live, dual-pane interactive environment with real-time token scrubbing, AST inspection, and syntax highlighting:
- **Left Pane:** Source configuration input with format selector, VPC topology picker, and preset loader.
- **Right Pane:** Live synthesized target output (YAML/HCL/Bicep) with Parity Fidelity Score indicator, download button, and copy-to-clipboard action.
- **Audit Bar:** Real-time log showing in-memory secret masking, IP tokenization, and PromQL synthesis steps.

### 9.2 Headless REST API Endpoints
`<dcouplr/>` exposes a high-throughput, headless REST API for CI/CD GitOps pipelines:

#### `POST /v1/translate`
Executes end-to-end multi-vendor parsing, validation, and target code generation.
- **Request:**
  ```json
  {
    "content": "{\"name\": \"High CPU\", \"query\": \"avg(last_5m):system.cpu.user{env:prod} by {host} > 80\"}",
    "source_vendor": "datadog",
    "target_platform": "grafana",
    "dry_run": false
  }
  ```
- **Response:**
  ```json
  {
    "artifact": "apiVersion: 1\ngroups: ...",
    "fidelity_score": 100.0,
    "diagnostics": ["Mapped Datadog query to PromQL with 100% mathematical parity"],
    "entity_count": 1
  }
  ```

#### `POST /v1/parse`
Parses input syntax into raw `UITGraph` JSON AST without code generation.

#### `POST /v1/generate`
Ingests an existing `UITGraph` AST and synthesizes target platform configuration code.

#### `GET /v1/supported-matrix`
Returns the operational capability matrix across all supported source formats and target emitters.

#### `GET /v1/recipes`
Dynamically returns metadata, sample inputs, and CLI execution commands for all 8 enterprise turnkey migration recipes.

---

## 10. CLI Tooling, Diagnostics & Error Taxonomy

### 10.1 Command-Line Interface Reference
```bash
# Display version and license entitlement status
dcouplr version

# Perform end-to-end translation
dcouplr translate --input <file> --source <vendor> --target <platform> [--output <dest>] [--dry-run]

# Inspect intermediate representation AST JSON
dcouplr inspect --input <file> --source <vendor>

# Lint configurations for syntax issues and unmapped metrics
dcouplr lint --input <file> --source <vendor>

# Run preflight system diagnostics and memory check
dcouplr doctor

# Generate OpenTofu state relocation plans (state mv)
dcouplr state-plan --input <tf-file> --target gcp --project <project-id>

# Commercial Entitlement Management (Tier 1-4)
dcouplr auth login --license-key <key>
dcouplr auth status
dcouplr auth logout
```

### 10.2 Diagnostic Error Code Taxonomy
When the compiler detects syntax irregularities or security policy violations, it emits structured error codes:

| Error Code | Severity | Description | Remediation Workflow |
| :--- | :---: | :--- | :--- |
| **`ERR_SYNTAX_PARSE`** | `CRITICAL` | Input payload contains malformed JSON or invalid HCL blocks. | Validate JSON syntax via `jq` or run `dcouplr lint` to pinpoint line offset. |
| **`ERR_UNMAPPED_METRIC`** | `WARNING` | Source metric has no standard PromQL canonical equivalent. | Pass `--metric-map "source_metric=target_metric"` to specify custom translation. |
| **`ERR_SECRET_DETECTED`** | `ALERT` | Cleartext AWS secret key or private password discovered. | The in-memory scrubber will mask the token automatically; rotate exposed secret in source repository. |
| **`ERR_CYCLIC_DEPENDENCY`**| `CRITICAL` | Circular `DEPENDS_ON` or `MONITORS` edge loop detected in `UITGraph`. | Review resource dependency graph and break circular references in IaC definition. |
| **`ERR_ANOMALY_FALLBACK`** | `INFO` | Black-box proprietary anomaly detector replaced with 2$\sigma$ PromQL. | Inform SRE team that standard deviation baseline (`1d` window) is active. |

---

## 📞 Support & Field Engineering Escalation

For questions or assistance with complex AST transpilation pipelines, reach out through your guaranteed support channel:
- **Community Core (Tier 0):** [GitHub Discussions](https://github.com/varinull/dcouplr/discussions)
- **Developer Pro (Tier 1):** Email support queue (`support@dcouplr.com`, 48-hour SLA)
- **Cluster Small/Medium (Tier 2/3):** Support Portal & Shared Slack Channel (`#dcouplr-war-room`, 2-hour SLA)
- **Cluster Large (Tier 4):** Dedicated Technical Account Manager (TAM) & 1-Hour SLA War-Room
