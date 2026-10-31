# 🚀 `<dcouplr/>` Complete Getting Started, CLI & Dashboard Installation Guide
**Document ID:** `VA-DOC-GETTING-STARTED-001`  
**Classification:** Enterprise Engineering Technical Specification & Installation Manual  
**Security Guarantee:** Zero-Egress In-VPC Volatile RAM Execution ($0 Data Egress)  
**Supported Platforms:** Linux (x86_64, aarch64), macOS (Apple Silicon, Intel), Windows (x64), Docker, Kubernetes/Helm  

---

## 📑 Overview

This manual provides the step-by-step instructions for:
1. Downloading and installing the **`<dcouplr/>` CLI** across Linux, macOS, and Windows.
2. Installing and launching the **In-App Telemetry Dashboard & Web Compiler Studio**.
3. Configuring cluster deployment via **Docker Compose** and **Kubernetes Helm Charts**.
4. Activating commercial licensing entitlements (Free Tier vs. Commercial Tiers).
5. Running your first zero-egress telemetry and infrastructure migrations.

---

## 1. 📋 Prerequisites & System Requirements

| Specification | Minimum (Local CLI) | Recommended (Cluster Daemon / Dashboard) |
| :--- | :--- | :--- |
| **CPU Architecture** | x86_64 or ARM64 (Apple Silicon M-series, AWS Graviton) | 2+ vCPU Cores |
| **Memory (RAM)** | 50 MB RSS (Enforced by memory ceiling) | 512 MB RAM |
| **Disk Space** | 35 MB (Single static binary) | 200 MB (With local state logs) |
| **Operating System** | Linux (Ubuntu, Debian, RHEL, Alpine), macOS 12+, Windows 10/11 | Linux / Container runtime |
| **Network Egress** | **0 KB (Strictly Air-Gapped In-VPC)** | Local VPC ingress on port 8000 |

---

## 2. 💻 Installing the `<dcouplr/>` CLI

Choose the installation method suited to your environment:

### Method A: Linux & macOS Automated One-Line Installer (Recommended)
Run the following command in your terminal:
```bash
curl -fsSL https://dcouplr.com/install.sh | sh && dcouplr doctor
```
*Or directly via GitHub repository:*
```bash
curl -fsSL https://raw.githubusercontent.com/varinull/dcouplr-community/main/install.sh | sh && dcouplr doctor
```

**What this does automatically:**
1. Detects OS (`Linux` or `Darwin`) and CPU architecture (`amd64` or `arm64`).
2. Downloads the cryptographically signed release binary or git package.
3. Installs the executable to `/usr/local/bin/dcouplr` (if root) or `~/.local/bin/dcouplr` (if non-root).
4. Verifies execution permissions (`chmod +x`).
5. Runs automated preflight health checks (`dcouplr doctor`).

### Method B: Windows Automated PowerShell Installer
Open an elevated or standard PowerShell terminal:
```powershell
irm https://dcouplr.com/install.ps1 | iex
```
*Or directly via GitHub repository:*
```powershell
irm https://raw.githubusercontent.com/varinull/dcouplr-community/main/install.ps1 | iex
```

**What this does automatically:**
1. Downloads the 64-bit Windows binary (`dcouplr.exe`).
2. Places it in `$env:LOCALAPPDATA\Programs\dcouplr\dcouplr.exe`.
3. Adds the directory to your user `$env:PATH` automatically.

### Method C: Python Package / Virtual Environment Installation
If you prefer running via Python 3.10+:
```bash
# Clone the repository
git clone https://github.com/varinull/dcouplr.git
cd dcouplr

# Create and activate a clean virtual environment
python -m venv .venv
source .venv/bin/activate       # Linux/macOS
# .venv\Scripts\activate        # Windows PowerShell

# Install dependencies and CLI package
pip install -r requirements.txt
pip install -e .
```

### Method D: Docker Container (No Local Installation)
Run `<dcouplr/>` inside an isolated container with zero host dependencies:
```bash
# Pull and run the distroless container
docker run --rm -v $(pwd):/workspace -w /workspace varinull/dcouplr:latest --help
```

### Method E: Air-Gapped / Disconnected Perimeter (Tarball)
For secure defense, finance, or air-gapped VPCs without Internet egress:
1. Download the offline bundle from your internal artifact repository:
   ```bash
   tar -xzf dcouplr-1.0.0-linux-amd64.tar.gz
   sudo mv dcouplr /usr/local/bin/
   ```
2. Verify cryptographic SHA-256 signature locally:
   ```bash
   sha256sum -c dcouplr.sha256
   ```

---

## 3. 🔍 Step 1: Verify CLI Installation & Preflight Doctor

After installing, verify that the CLI binary is available in your PATH:

```bash
# 1. Check CLI version and release channel
dcouplr version
```
*Expected Output:*
```
╭───────────────── Version Information ─────────────────╮
│ <dcouplr/> Zero-Egress Observability & IaC Transpiler  │
│ CLI Version: v1.0.0 (Release Channel: GA)             │
│ Platform Arch: Linux x86_64                           │
│ Active Entitlement: Community Core (Free Tier)        │
│ Node Capacity: 1 Nodes                                │
│ Air-Gap Verification: PASS (Zero Cloud Egress)        │
╰───────────────────────────────────────────────────────╯
```

Now run the built-in system diagnostics preflight check:
```bash
# 2. Run system health diagnostics
dcouplr doctor
```
The preflight doctor verifies:
* Local memory footprint is strictly beneath the 50 MB RSS limit.
* No outbound WAN sockets or external cloud endpoints are contacted.
* In-memory regex token scrubbers and AST parsers are functional.

---

## 4. 📊 Step 2: Installing & Running the In-App Dashboard

`<dcouplr/>` includes an integrated, zero-egress **Web Application Suite** that serves:
* 🖥️ **Live AST Compiler Studio:** `http://localhost:8000/compiler`
* 📡 **In-App Telemetry & Cross-Cloud Topology Dashboard:** `http://localhost:8000/dashboard`
* 📚 **Interactive Documentation & API Reference:** `https://dcouplr.com/docs`

### Option 1: Run Locally via CLI (Fastest)
Start the built-in server on any workstation or bastion host:
```bash
# Start server bound to localhost port 8000
dcouplr serve --port 8000

# Or bind to all interfaces on an in-VPC management bastion:
dcouplr serve --host 0.0.0.0 --port 8000
```
Open your browser to:
👉 **[http://127.0.0.1:8000/dashboard](http://127.0.0.1:8000/dashboard)**

### Option 2: Docker Compose (With Local Prometheus & Grafana)
To spin up `<dcouplr/>` alongside a local Prometheus time-series database and Grafana instance:
```bash
# Launch multi-container isolation mesh
docker-compose up -d
```
Services exposed:
* `<dcouplr/>` Dashboard & API: `http://localhost:8000`
* Local Prometheus: `http://localhost:9090`
* Local Grafana: `http://localhost:3000` (credentials: `admin` / `admin`)

### Option 3: Kubernetes Deployment via Helm
Deploy `<dcouplr/>` as an in-cluster control plane across your Kubernetes cluster (EKS, GKE, AKS, or on-premises OpenShift):
```bash
# Add namespace and deploy Helm chart
helm upgrade --install dcouplr deploy/helm \
  --namespace dcouplr-system \
  --create-namespace \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=dcouplr.internal.corp \
  --set replicaCount=3
```

### Option 4: Enable Prometheus Remote-Write Forwarding
If your enterprise uses a centralized time-series storage backend (such as **Thanos**, **Cortex**, **VictoriaMetrics**, or **M3DB**), configure the built-in pure-software varint remote-write exporter:
```bash
dcouplr serve --port 8000 \
  --remote-write-url "http://thanos-receive.monitoring.svc:10901/api/v1/receive" \
  --remote-write-interval 15.0
```
This buffers and flushes consensus metrics, compaction logs, and circuit-breaker telemetry directly into your TSDB with zero external library overhead.

---

## 5. 🔑 Commercial Licensing, Enterprise Installers & Node Capacity

`<dcouplr/>` follows an open-core model. By default, it operates in the **Community Core (Free Tier)** with a strict **1-Node local workstation boundary**.

If your enterprise has purchased **Developer Pro**, **Cluster Small**, **Cluster Medium**, **Cluster Large**, or **Custom Enterprise**:

### Turnkey Commercial Installers
Run the dedicated enterprise installer on Linux, macOS, or Windows:

* **Linux & macOS:**
  ```bash
  curl -fsSL https://dcouplr.com/install-enterprise.sh | sh
  # Or non-interactive with pre-configured license key:
  DCOUPLR_LICENSE_KEY="DCL-PRO-ACME-8821B47C9" curl -fsSL https://dcouplr.com/install-enterprise.sh | sh
  ```
* **Windows (PowerShell):**
  ```powershell
  irm https://dcouplr.com/install-enterprise.ps1 | iex
  # Or non-interactive:
  $env:DCOUPLR_LICENSE_KEY="DCL-PRO-ACME-8821B47C9"; irm https://dcouplr.com/install-enterprise.ps1 | iex
  ```
* **Air-Gapped Enterprise Distribution Tarball:**
  ```bash
  curl -fsSL https://dcouplr.com/dcouplr-enterprise-v1.0.0.tar.gz -o dcouplr-enterprise-v1.0.0.tar.gz
  ```

### Direct CLI Activation (`dcouplr auth login`)
If `<dcouplr/>` is already installed, activate your commercial entitlement directly:
```bash
dcouplr auth login --license-key "DCL-PRO-ACME-8821B47C9" --org "Acme Cloud Fleet"
```

### Node Capacity, Pricing & Overage Rates Matrix

| Tier Classification | Monthly Base | Included Nodes | Expansion Overage Rate | Max Tier Cap | SLA & Support Channel |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tier 0: Community Core** | **$0** / mo | **1 Node** (Local CLI) | *None* ($0 overage) | **1 Node** | Self-Service (GitHub & Docs) |
| **Tier 1: Developer Pro** | **$300** / mo | **10 Nodes** (or 25 pilot) | *None* (Fixed flat tier) | **10 Nodes** | Standard Email (48h SLA) |
| **Tier 2: Cluster Small** | **$1,500** / mo | **25 Nodes** | **+$60** / node / mo | **60 Nodes** ($3,600/mo cap) | 9x5 NBD Business Portal |
| **Tier 3: Cluster Medium** | **$3,500** / mo | **75 Nodes** | **+$45** / node / mo | **90 Nodes** ($4,175/mo cap) | 24x7 P1 (2-Hr) Shared Slack |
| **Tier 4: Cluster Large** | **Flat $45** / node / mo | **91 to 300 Nodes** | **Flat $45** / node / mo | **300 Nodes** ($13,500/mo) | 24x7 P1 (1-Hr) Dedicated TAM |
| **Tier 5: Custom Enterprise** | Custom / Annual PO | **300+ Nodes** | **Volume Tiered** | **Unlimited** ($999,999$) | 24x7 P1 (15-Min) Dedicated SRE |

*💡 Crossover Savings:* Upgrading from Tier 2 expansion (at 59–60 nodes: $3,540–$3,600/mo) to Tier 3 Base ($3,500/mo) saves up to $100/mo with 75 nodes and 24x7 P1 SLA. Migrating from Tier 3 expansion (at 90 nodes: $4,175/mo) to Tier 4 (91 × $45 = $4,095/mo) saves $80–$125/mo with Dedicated TAM.


### Checking Entitlements & Offline Audit
* **Inspect active entitlement and local machine fingerprint:**
  ```bash
  dcouplr auth status
  ```
* **Generate zero-egress compliance audit attestation:**
  ```bash
  dcouplr auth audit
  ```
* **Revert back to Free Community Core:**
  ```bash
  dcouplr auth logout
  ```

For full architectural details on offline node gating, hardware fingerprinting, and intra-VPC cluster counting, see [`INSTALLATION_AND_NODE_CAPACITY_SPECIFICATION.md`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/INSTALLATION_AND_NODE_CAPACITY_SPECIFICATION.md).

---

## 6. 🛠️ How to Start Using `<dcouplr/>` (Step-by-Step)

Here are the four everyday workflows to start utilizing `<dcouplr/>`:

### Workflow 1: Transpile Datadog Monitors into Grafana 11 Unified Alerting
Suppose you have an exported Datadog monitor JSON file (`monitors.json`):
```json
[
  {
    "id": 10921,
    "name": "Production High CPU Warning",
    "query": "avg(last_5m):system.cpu.user{env:prod} by {host} > 80",
    "message": "High CPU utilization detected on prod node! @slack-sre-team",
    "options": {
      "thresholds": { "critical": 80.0, "warning": 70.0 }
    }
  }
]
```

Run the translation:
```bash
dcouplr translate \
  --input monitors.json \
  --source datadog \
  --target grafana \
  --output grafana-alerts.yaml
```

Inspect the synthesized output (`grafana-alerts.yaml`):
* PromQL synthesized: `avg by (host) (node_cpu_utilization_user{env="prod"}) > 80.0`
* Includes Grafana 10+ 3-stage RefId A/B/C execution pipeline.
* Automatically extracted `@slack-sre-team` into alert notification routing.

### Workflow 2: Generate Prometheus Alertmanager Rules
```bash
dcouplr translate \
  --input monitors.json \
  --source datadog \
  --target prometheus \
  --output alertmanager_rules.yaml
```

### Workflow 3: Transpile AWS Terraform HCL into OpenTofu Google Cloud Platform
Suppose you have legacy AWS infrastructure in `main.tf` (`aws_instance`, `aws_vpc`, `aws_subnet`):
```bash
dcouplr translate \
  --input main.tf \
  --source terraform \
  --target opentofu_gcp \
  --output gcp_infrastructure.tf
```
`<dcouplr/>` automatically:
* Converts `aws_vpc` and `aws_subnet` to `google_compute_network` and `google_compute_subnetwork`.
* Maps AWS EC2 instance sizing (`t3.medium`) to GCP machine types (`e2-medium`).
* Generates zero-downtime state relocation mappings (`terraform state mv`).

### Workflow 4: Inspect the Intermediate Representation (UIT-IR) AST
To view the underlying AST representation before emitting code:
```bash
dcouplr inspect --input monitors.json --source datadog
```

### Workflow 5: Preflight Linter
Check legacy configurations for syntax errors, deprecations, or unmapped metrics before scheduling migration windows:
```bash
dcouplr lint --input monitors.json --source datadog
```

---

## 7. 🖥️ Using the Visual Compiler Studio (`/compiler`)

If you prefer a graphical workflow over the terminal:
1. Open **[http://localhost:8000/compiler](http://localhost:8000/compiler)** in your browser.
2. In the top toolbar, select:
   * **Source:** `Datadog Monitor (JSON)`
   * **Target:** `Grafana 10+ (Unified Alerting YAML)`
   * **Monitored VPC:** `dc-onprem-core-01`
3. Click **"Presets"** to load pre-built production templates (e.g. *Datadog High CPU & Anomaly Monitor*).
4. View the real-time **In-Memory Sanitizer Bar** redacting RFC 1918 IPs in volatile RAM.
5. Click **"Download Configuration"** or copy the generated YAML directly into your GitOps repo.

---

## 8. 📡 Navigating the In-App Telemetry Dashboard (`/dashboard`)

The live dashboard at **[http://localhost:8000/dashboard](http://localhost:8000/dashboard)** gives platform engineers full visibility into migration state:
1. **Embedded Raft Consensus HUD:**
   * Shows active Leader node, term index, commit index, and peer latency health.
   * Visualizes the **Asymmetric 20ms Circuit Breaker** (Closed, Open, Half-Open).
2. **WAL Compaction & Memory Metrics:**
   * Tracks uncompacted log delta against the 10,000 entry threshold.
   * Displays memory ceiling (guaranteed < 50 MB RSS).
3. **Interactive 4-VPC Cross-Cloud Topology Map:**
   * Visualizes dependencies between On-Prem (`dc-onprem-core-01`), AWS (`vpc-aws-prod-us-east-1`), GCP (`vpc-gcp-data-us-central1`), and Azure (`vnet-azure-core-eastus`).
4. **Turnkey Migration Recipes Launcher:**
   * Access and run Recipes 1 through 8 directly from the browser.

---

## 9. ❓ Troubleshooting & Quick FAQ

#### Q: The CLI says `dcouplr: command not found` after running the installer.
**A:** Ensure your local binary path is in your environment `$PATH`:
* **Linux/macOS:** Add `export PATH="$HOME/.local/bin:$PATH"` to your `~/.bashrc` or `~/.zshrc`.
* **Windows:** Restart your PowerShell session to pick up the updated `$env:PATH`.

#### Q: Does `<dcouplr/>` transmit metric names or internal IPs to external servers?
**A:** **No.** `<dcouplr/>` enforces a strict mathematical zero-egress guarantee ($0 egress). All token scrubbing, AST parsing, and PromQL synthesis occur strictly in volatile RAM. No WAN socket calls are made.

#### Q: How do I map proprietary custom metrics that don't follow node_exporter conventions?
**A:** Use the `--metric-map` flag:
```bash
dcouplr translate -i monitors.json -s datadog -t grafana \
  --metric-map "custom.app.orders=http_requests_total" \
  --metric-map "custom.db.latency=postgres_query_duration_seconds"
```

#### Q: Where can I get support for production outages during migration?
**A:** Dispatch an emergency ticket directly via CLI (`dcouplr support ticket create --severity P1`), email `support@dcouplr.com`, or notify our 24/7 on-call rotation via your organization's dedicated Slack Connect channel.
