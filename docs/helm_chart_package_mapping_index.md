# 📦 `<dcouplr/>`: Enterprise Helm Chart Packaging & Mapping Index

**Wordmark & Product Identity:** `<dcouplr/>`  
**Product Descriptor:** The Open-Core Telemetry & Infrastructure Translation Engine  
**Operational & Security Architecture:** Zero-Egress Observability & IaC Transpiler  

## 📂 1. Core Chart Root Topology (`/deploy/charts/decoupler/`)
* `Chart.yaml`: Contains metadata profiles and maps the **1.0.0** stable application versioning boundaries.
* `values.yaml`: Establishes configurable runtime limits, security parameters, and node-bracket parameters.
* `values-production.yaml`: Hardened, air-gapped override parameters dropping all kernel capabilities.

## 📂 2. Enterprise Template Engine Configurations (`/templates/`)
* `templates/_helpers.tpl`: Generates uniform, deterministic labels and resource identification name structures.
* `templates/daemonset.yaml`: Provisions the multi-stage, zero-exfiltration distroless agent across computing nodes.
* `templates/secrets.yaml`: Dynamically base64-encrypts connection hashes and upstream TLS certificate contents.
* `templates/servicemonitor.yaml`: Bundles Prometheus Operator scraping targets natively to collect metrics data.
* `templates/network-policy.yaml`: Applies micro-perimeter network segmentation to isolate ports `8300` and `8301`.
* `templates/synccontroller-crd.yaml`: Custom Resource Definition defining schemas for the dynamic log handlers.
* `templates/synccontroller-rbac.yaml`: Assigns least-privilege API permissions to the dynamic client interface loops.
* `templates/webhook-registration.yaml`: Binds the `spire-registrar-webhook` directly to the cluster API admission controllers.

## 📂 3. Validation Framework & Test Suites (`/tests/`)
* `tests/chart_test.yaml`: Executes declarative testing loops inside CI blocks (`helm-unittest`) to block misconfigured resources.
