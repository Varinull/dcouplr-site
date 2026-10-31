/**
 * <dcouplr/>: Enterprise Landing Page Interactive Controller
 * Powers Syntax Showcase, In-Memory Pipeline Inspector, Terminal CLI Copy, and FinOps ROI Modeler
 */

// Syntax Showcase Presets
const SYNTAX_PRESETS = {
  cpu: {
    sourceFile: "source_cpu_monitor.json",
    sourceFormat: "Monitor JSON AST",
    targetFile: "grafana_unified_alert.yaml",
    targetFormat: "Grafana 11 / PromQL",
    sourceCode: `// Source Metric Alert Grammar (JSON Definition)
{
  "name": "High CPU Utilization on Production Web Tier",
  "type": "metric alert",
  "query": "avg(last_5m):system.cpu.user{environment:prod,tier:frontend} by {host} > 85",
  "message": "Node CPU exceeded 85% for 5 consecutive minutes. @pagerduty-sre",
  "tags": ["environment:prod", "service:web", "severity:p1"],
  "options": {
    "thresholds": { "critical": 85.0, "warning": 75.0 },
    "notify_no_data": true,
    "evaluation_delay": 60
  }
}`,
    targetCode: `apiVersion: 1
groups:
  - orgId: 1
    name: decoupled-alerts
    folder: dcouplr-Managed
    interval: 60s
    rules:
      - uid: ast-100101-cpu
        title: High CPU Utilization on Production Web Tier
        condition: B
        data:
          - refId: A
            queryType: prometheus
            model:
              expr: avg by (host) (rate(node_cpu_seconds_total{mode="user", environment="prod", tier="frontend"}[5m])) * 100
          - refId: B
            model:
              type: threshold
              expression: A
              conditions:
                - evaluator: { type: gt, params: [85.0] }`,
    sourceTokens: [
      "Metric: system.cpu.user",
      "TimeAgg: avg(last_5m)",
      "GroupBy: host",
      "Op: > 85"
    ],
    targetTokens: [
      "PromQL Vector Normalized",
      "Grafana 11 Spec Valid",
      "0.00 KB Leaked"
    ]
  },
  alb: {
    sourceFile: "source_alb_5xx.json",
    sourceFormat: "Monitor JSON AST",
    targetFile: "prometheus_alb_rules.yaml",
    targetFormat: "Prometheus Alertmanager",
    sourceCode: `// Source Application ELB 5xx Target Monitor (JSON Definition)
{
  "name": "ALB Target 5xx Surge Detected",
  "type": "metric alert",
  "query": "sum(last_5m):aws.applicationelb.httpcode_target_5xx{loadbalancer:api-gateway}.as_count() > 50",
  "message": "Target 5xx errors crossed 50 in 5m window. Upstream failing health checks. @slack-backend",
  "tags": ["environment:prod", "service:api-gateway", "team:backend"],
  "options": {
    "thresholds": { "critical": 50.0, "warning": 25.0 }
  }
}`,
    targetCode: `groups:
  - name: dcouplr_synthesized_alerts
    rules:
      - alert: ALB_Target_5xx_Surge_Detected
        expr: sum(increase(aws_applicationelb_httpcode_target_5xx_sum{loadbalancer="api-gateway"}[5m])) > 50
        for: 5m
        labels:
          severity: critical
          environment: prod
          service: api-gateway
          team: backend
        annotations:
          summary: "ALB Target 5xx Surge Detected"
          description: "Target 5xx errors crossed 50 in 5m window."`,
    sourceTokens: [
      "Metric: httpcode_target_5xx",
      "RateModifier: as_count()",
      "Scope: api-gateway",
      "Window: 5m"
    ],
    targetTokens: [
      "PromQL increase() Translated",
      "Alertmanager Spec Valid",
      "Zero Egress Verified"
    ]
  },
  iac: {
    sourceFile: "aws_infrastructure.tf",
    sourceFormat: "Terraform HCL",
    targetFile: "gcp_infrastructure.tf",
    targetFormat: "OpenTofu GCP HCL",
    sourceCode: `# AWS Core Infrastructure (Proprietary Spec)
resource "aws_vpc" "app_network" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = {
    Environment = "production"
  }
}

resource "aws_instance" "app_node" {
  instance_type = "t3.medium"
  ami           = "ami-0c55b159cbfafe1f0"
  vpc_id        = aws_vpc.app_network.id
}`,
    targetCode: `# OpenTofu Google Cloud Platform Equivalent
resource "google_compute_network" "app_network" {
  name                    = "app-network-production"
  auto_create_subnetworks = false
}

resource "google_compute_instance" "app_node" {
  name         = "app-node-01"
  machine_type = "e2-medium"
  zone         = "us-central1-a"
  network_interface {
    network = google_compute_network.app_network.name
  }
}`,
    sourceTokens: [
      "Resource: aws_vpc",
      "Resource: aws_instance",
      "CIDR: 10.0.0.0/16",
      "Type: t3.medium"
    ],
    targetTokens: [
      "OpenTofu Target Normal",
      "GCP e2-medium Mapped",
      "Topology Invariants Preserved"
    ]
  }
};

// Pipeline Stage Inspector Data
const PIPELINE_STAGES = {
  1: {
    kicker: "Stage 01 Specification",
    title: "Lexical Ingestion & AST Parser",
    desc: "The lexical scanner ingests alert definitions directly into volatile RAM. Source monitor expressions are tokenized into semantic query trees preserving metric domains, aggregators, time scopes, and multidimensional tag filters.",
    input: "Alert Monitor JSON, Terraform HCL, OpenTofu HCL",
    memory: "< 50 MiB RSS (Strict Container Quota)",
    security: "Local Host Process Only (Zero Cloud Transit)",
    code: `// Stage 1: Ingested AST Node
type MonitorNode struct {
    ID           string            \`json:"id"\`
    Name         string            \`json:"name"\`
    SourceMetric MetricQuery       \`json:"source_metric"\`
    Thresholds   ThresholdMap      \`json:"thresholds"\`
    Tags         map[string]string \`json:"tags"\`
}`
  },
  2: {
    kicker: "Stage 02 Specification",
    title: "Volatile Memory Token Scrubber",
    desc: "Executes zero-exfiltration sanitization rulesets entirely in memory before graph compilation. Identifies RFC 1918 private IPv4/IPv6 addresses, internal fully qualified hostnames, and embedded tokens, replacing them with deterministic HMAC digest masks.",
    input: "AST Lexical Tokens in Volatile Memory",
    memory: "< 12 MiB RSS Working Set",
    security: "100% Zero-Cleartext Leakage Guarantee",
    code: `// Stage 2: Token Scrubber
func (s *TokenAnonymizer) Scrub(raw []byte) ([]byte, int) {
    // Regex matching RFC 1918 & FQDNs in memory
    scrubbed := privateIPRegex.ReplaceAllFunc(raw, s.hashToken)
    scrubbed = fqdnRegex.ReplaceAllFunc(scrubbed, s.hashToken)
    return scrubbed, s.ScrubbedCount
}`
  },
  3: {
    kicker: "Stage 03 Specification",
    title: "UIT-IR Universal Normalizer",
    desc: "Normalizes scrubbed AST tokens into the strongly typed Universal Intermediate Representation (UITGraph). Enforces mathematical query invariants, rate transform rules, and relational edge dependencies between alerts and resources.",
    input: "Sanitized AST Tree",
    memory: "< 24 MiB RSS Graph Allocations",
    security: "Deterministic Invariant Proofs",
    code: `// Stage 3: Universal Intermediate Representation
type UITGraph struct {
    Version   string                 \`json:"version"\`
    Monitors  []*MonitorNode         \`json:"monitors"\`
    Resources []*ResourceNode        \`json:"resources"\`
    Metadata  map[string]interface{} \`json:"metadata"\`
}`
  },
  4: {
    kicker: "Stage 04 Specification",
    title: "Multi-Target Target Emitter",
    desc: "Compiles normalized UITGraph models into native Grafana 11 Unified Alerting provisioning YAML, Prometheus Alertmanager rule groups, or OpenTofu HCL with target schema compliance verification.",
    input: "Validated UITGraph Model",
    memory: "< 16 MiB Output Buffer",
    security: "Production Lint & Schema Verified",
    code: `// Stage 4: Multi-Target Code Synthesis
func GenerateGrafanaRules(g *UITGraph) ([]byte, error) {
    root := UnifiedAlertingProvisioning{
        APIVersion: 1,
        Groups:     synthesizeGroups(g.Monitors),
    }
    return yaml.Marshal(root)
}`
  }
};

function initAll() {
  // 1. Terminal CLI Command Copy Handler
  initTerminalCopy();

  // 2. Syntax Showcase Preset Switcher
  initSyntaxShowcase();

  // 3. Pipeline Stages Visualizer
  initPipelineVisualizer();

  // 4. FinOps ROI & TCO Modeler
  initFinOpsCalculator();

  // 5. In-App Telemetry & Multi-VPC Dashboard Showcase
  initDashboardShowcase();

  // 6. Detailed End-to-End Pricing & Support Matrix Modal
  initPricingModal();

  // 6b. Commercial Subscription & Checkout Portal Modal
  initCheckoutPortalModal();

  // 6c. Smart Contract & Proration Calculator
  initProrationCalculator();

  // 7. CLI Download Center & License Entitlement Simulator
  initDownloadHub();

  // 8. Free Community Core Download Lead Gate & Census Registration
  initCommunityLeadGate();
}

function initCheckoutPortalModal() {
  const modal = document.getElementById("modal-checkout-portal");
  const closeBtn = document.getElementById("btn-close-checkout-modal");
  const closeFooterBtn = document.getElementById("btn-close-checkout-footer");
  const titleEl = document.getElementById("checkout-tier-title");
  const badgeEl = document.getElementById("checkout-badge-tier");
  const priceEl = document.getElementById("checkout-price-display");
  const cycleEl = document.getElementById("checkout-billing-cycle");
  const descEl = document.getElementById("checkout-quota-desc");
  const cliCmdEl = document.getElementById("checkout-cli-command");
  const copyCmdBtn = document.getElementById("btn-copy-checkout-cmd");
  const applyLocalBtn = document.getElementById("btn-apply-checkout-local");
  const localFeedback = document.getElementById("checkout-local-feedback");

  // Overage License Controls
  const ovInput = document.getElementById("checkout-overage-input");
  const ovMinusBtn = document.getElementById("btn-checkout-ov-minus");
  const ovPlusBtn = document.getElementById("btn-checkout-ov-plus");
  const ovRateLabel = document.getElementById("checkout-overage-rate-label");
  const totalFleetEl = document.getElementById("checkout-total-fleet-nodes");
  const annualTotalEl = document.getElementById("checkout-annual-total-due");

  const tierMeta = {
    "Developer Pro": {
      name: "Developer Pro (10 Nodes Base)",
      price: "$300 / mo",
      annualBase: 3600,
      baseNodes: 10,
      ovRateMonthly: 0,
      cycle: "($3,600 / yr upfront)",
      badgeClass: "table-badge badge-tier-1",
      quota: "Up to 10 Active Agents / Nodes Base • Email SLA (48h)"
    },
    "Cluster Small": {
      name: "Cluster Small (25 Nodes Base)",
      price: "$1,500 / mo",
      annualBase: 18000,
      baseNodes: 25,
      ovRateMonthly: 60,
      cycle: "($18,000 / yr upfront)",
      badgeClass: "table-badge badge-tier-2",
      quota: "25 Included Nodes Base • +$60/node/mo overage • 9x5 NBD Portal SLA"
    },
    "Cluster Medium": {
      name: "Cluster Medium (75 Nodes Base)",
      price: "$3,500 / mo",
      annualBase: 42000,
      baseNodes: 75,
      ovRateMonthly: 45,
      cycle: "($42,000 / yr upfront)",
      badgeClass: "table-badge badge-tier-3",
      quota: "75 Included Nodes Base • +$45/node/mo overage • 24x7 P1 (2-Hr) Shared Slack"
    },
    "Cluster Large": {
      name: "Cluster Large (Up to 300 Nodes)",
      price: "$45 / node / mo",
      annualBase: 54000,
      baseNodes: 100,
      ovRateMonthly: 45,
      cycle: "($540 / node / yr)",
      badgeClass: "table-badge badge-tier-4",
      quota: "Custom 91–300 Nodes • Flat $45/node/mo • 24x7 P1 (1-Hr) Dedicated TAM & War-Room"
    },
    "Enterprise Ed1 Base": {
      name: "<dcouplr/> Migration Suite: Enterprise Baseline (300 Nodes Base)",
      price: "$120,000 / yr flat",
      annualBase: 120000,
      baseNodes: 300,
      ovRateMonthly: 30,
      cycle: "($120,000 / yr upfront)",
      badgeClass: "table-badge",
      quota: "300 Base Nodes • Block 1 +$30/mo • Block 2 +$25/mo • $300k Site Cap (840 nodes)"
    },
    "Enterprise Ed2 Base": {
      name: "<dcouplr/> Full-Stack Suite: Enterprise Baseline (300 Nodes Base)",
      price: "$180,000 / yr flat",
      annualBase: 180000,
      baseNodes: 300,
      ovRateMonthly: 40,
      cycle: "($180,000 / yr upfront)",
      badgeClass: "table-badge",
      quota: "300 Base Nodes • Block 1 +$40/mo • Block 2 +$30/mo • $360k Site Cap (700 nodes)"
    },
    "Enterprise Site Ed1": {
      name: "Unlimited Enterprise Site License (<dcouplr/> Migration Suite)",
      price: "$300,000 / yr flat",
      annualBase: 300000,
      baseNodes: 840,
      ovRateMonthly: 0,
      cycle: "($300,000 / yr upfront)",
      badgeClass: "table-badge",
      quota: "Uncapped nodes across all clouds & VPCs • Triggered at 840 nodes"
    },
    "Enterprise Site Ed2": {
      name: "Unlimited Enterprise Site License (<dcouplr/> Full-Stack Suite)",
      price: "$360,000 / yr flat",
      annualBase: 360000,
      baseNodes: 700,
      ovRateMonthly: 0,
      cycle: "($360,000 / yr upfront)",
      badgeClass: "table-badge",
      quota: "Uncapped nodes across all clouds & VPCs • Triggered at 700 nodes"
    },
    "Custom Enterprise": {
      name: "Custom Enterprise Fleet (300+ Nodes)",
      price: "$120k / $180k Base",
      annualBase: 120000,
      baseNodes: 300,
      ovRateMonthly: 30,
      cycle: "(Annual Master Agreement)",
      badgeClass: "table-badge",
      quota: "300+ Nodes • Block 1 $30/$40 • Block 2 $25/$30 • Site Cap $300k/$360k"
    }
  };

  let activeTier = "Cluster Medium";
  let activeOverageNodes = 0;

  function recalculateTotals() {
    const meta = tierMeta[activeTier] || tierMeta["Cluster Medium"];
    const baseNodes = meta.baseNodes || 25;
    const ovRate = meta.ovRateMonthly || 0;
    const annualBase = meta.annualBase || 18000;

    const extraNodes = Math.max(0, parseInt(ovInput ? ovInput.value : "0", 10) || 0);
    activeOverageNodes = extraNodes;

    const totalFleet = baseNodes + extraNodes;
    const overageAnnual = extraNodes * (ovRate * 12);
    const upfrontAnnualTotal = annualBase + overageAnnual;

    if (totalFleetEl) totalFleetEl.textContent = totalFleet;
    if (annualTotalEl) {
      annualTotalEl.textContent = `$${upfrontAnnualTotal.toLocaleString("en-US")} / yr`;
    }
    if (ovRateLabel) {
      ovRateLabel.textContent = ovRate > 0 ? `(+$${ovRate}/node/mo • $${ovRate * 12}/yr)` : "(Overage pool not available)";
    }

    if (cliCmdEl) {
      if (extraNodes > 0) {
        cliCmdEl.textContent = `dcouplr auth activate --tier "${activeTier}" --overage-nodes ${extraNodes} --key-file /secure/path/dcouplr.lic`;
      } else {
        cliCmdEl.textContent = `dcouplr auth activate --tier "${activeTier}" --key-file /secure/path/dcouplr.lic`;
      }
    }
  }

  function openCheckout(tierName, initialOverage) {
    if (!modal) return;
    activeTier = tierName || "Cluster Medium";
    const meta = tierMeta[activeTier] || tierMeta["Cluster Medium"];

    if (titleEl) titleEl.textContent = `Subscribe: ${meta.name}`;
    if (badgeEl) {
      badgeEl.textContent = activeTier;
      badgeEl.className = meta.badgeClass;
    }
    if (priceEl) priceEl.textContent = meta.price;
    if (cycleEl) cycleEl.textContent = meta.cycle;
    if (descEl) descEl.textContent = meta.quota;

    if (ovInput) {
      ovInput.value = initialOverage ? Math.max(0, initialOverage) : 0;
    }

    recalculateTotals();

    if (localFeedback) {
      localFeedback.style.display = "none";
      localFeedback.textContent = "";
    }

    modal.style.display = "flex";
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeCheckout() {
    if (!modal) return;
    modal.classList.remove("open");
    modal.style.display = "none";
    document.body.style.overflow = "";
  }

  // Hook all CTA buttons on pricing cards
  document.querySelectorAll(".btn-open-checkout").forEach(btn => {
    btn.addEventListener("click", () => {
      const tier = btn.getAttribute("data-tier") || "Cluster Medium";
      openCheckout(tier, 0);
    });
  });

  // Overage node stepper buttons
  if (ovMinusBtn && ovInput) {
    ovMinusBtn.addEventListener("click", () => {
      const val = Math.max(0, parseInt(ovInput.value || "0", 10) - 5);
      ovInput.value = val;
      recalculateTotals();
    });
  }
  if (ovPlusBtn && ovInput) {
    ovPlusBtn.addEventListener("click", () => {
      const val = parseInt(ovInput.value || "0", 10) + 5;
      ovInput.value = val;
      recalculateTotals();
    });
  }
  if (ovInput) {
    ovInput.addEventListener("input", recalculateTotals);
  }

  if (closeBtn) closeBtn.addEventListener("click", closeCheckout);
  if (closeFooterBtn) closeFooterBtn.addEventListener("click", closeCheckout);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeCheckout();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("open")) {
      closeCheckout();
    }
  });

  // Tab switching inside checkout modal
  const checkoutTabs = [
    { btn: document.getElementById("tab-checkout-invpc"), content: document.getElementById("content-checkout-invpc") },
    { btn: document.getElementById("tab-checkout-marketplace"), content: document.getElementById("content-checkout-marketplace") },
    { btn: document.getElementById("tab-checkout-invoice"), content: document.getElementById("content-checkout-invoice") }
  ];

  checkoutTabs.forEach(t => {
    if (t.btn && t.content) {
      t.btn.addEventListener("click", () => {
        checkoutTabs.forEach(item => {
          if (item.btn) {
            item.btn.classList.remove("active");
            item.btn.style.background = "rgba(255, 255, 255, 0.05)";
            item.btn.style.color = "#94a3b8";
            item.btn.style.borderColor = "rgba(255, 255, 255, 0.1)";
          }
          if (item.content) item.content.style.display = "none";
        });
        t.btn.classList.add("active");
        t.btn.style.background = "rgba(16, 185, 129, 0.15)";
        t.btn.style.color = "#34d399";
        t.btn.style.borderColor = "rgba(16, 185, 129, 0.4)";
        t.content.style.display = "block";
      });
    }
  });

  // Copy command button
  if (copyCmdBtn && cliCmdEl) {
    copyCmdBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(cliCmdEl.textContent.trim());
        const orig = copyCmdBtn.textContent;
        copyCmdBtn.textContent = "Copied!";
        copyCmdBtn.style.color = "#34d399";
        setTimeout(() => {
          copyCmdBtn.textContent = orig;
          copyCmdBtn.style.color = "#fff";
        }, 2000);
      } catch (_) {}
    });
  }

  // 1-Click Apply to Local Daemon button
  if (applyLocalBtn) {
    applyLocalBtn.addEventListener("click", async () => {
      applyLocalBtn.disabled = true;
      applyLocalBtn.textContent = "⚡ Activating on Local Daemon...";

      try {
        const resp = await fetch("/v1/license/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tier: activeTier,
            purchased_overage_nodes: activeOverageNodes,
            purchasing_channel: "DIRECT_PO_OFFLINE",
            organization: "Acme Corp"
          })
        });

        const data = await resp.json();
        if (resp.ok && data.status === "success") {
          if (localFeedback) {
            localFeedback.style.display = "block";
            localFeedback.style.background = "rgba(16, 185, 129, 0.2)";
            localFeedback.style.border = "1px solid rgba(16, 185, 129, 0.5)";
            localFeedback.style.color = "#6ee7b7";
            localFeedback.innerHTML = `<strong>Success!</strong> ${data.message} Capacity updated to <strong>${data.total_licensed_capacity} nodes</strong> (${activeOverageNodes} overages). Redirecting to Telemetry Dashboard...`;
          }
          setTimeout(() => {
            window.location.href = "/dashboard?action=census";
          }, 1200);
        } else {
          throw new Error(data.detail || data.message || "Failed to activate on local daemon");
        }
      } catch (err) {
        if (localFeedback) {
          localFeedback.style.display = "block";
          localFeedback.style.background = "rgba(244, 63, 94, 0.2)";
          localFeedback.style.border = "1px solid rgba(244, 63, 94, 0.5)";
          localFeedback.style.color = "#fca5a5";
          localFeedback.textContent = `Error: ${err.message}. If daemon is offline, activate via discrete key file or environment variable.`;
        }
        applyLocalBtn.disabled = false;
        applyLocalBtn.textContent = "⚡ Apply to Local Daemon →";
      }
    });
  }

  // Deep-link check for URL parameters (e.g. /#pricing?tier=Cluster%20Medium or ?action=checkout)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const requestedTier = urlParams.get("tier");
    const requestedAction = urlParams.get("action");
    if (requestedTier || requestedAction === "checkout" || window.location.hash === "#checkout") {
      setTimeout(() => {
        openCheckout(requestedTier || "Cluster Medium", 0);
      }, 300);
    }
  } catch (_) {}

  window.openCheckoutPortal = openCheckout;
}

function initProrationCalculator() {
  const openCalcBtn = document.getElementById("btn-open-proration-calc");
  const modal = document.getElementById("modal-pricing-matrix");
  const calcSection = document.getElementById("section-proration-calculator");

  function openCalculator() {
    if (!modal) return;
    modal.style.display = "flex";
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    if (calcSection) {
      setTimeout(() => {
        const modalBody = modal.querySelector(".pricing-modal-body");
        if (modalBody) {
          modalBody.scrollTo({ top: calcSection.offsetTop - 20, behavior: "smooth" });
        } else {
          calcSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 50);
    }
  }

  window.openProrationCalculator = openCalculator;

  if (openCalcBtn) {
    openCalcBtn.addEventListener("click", openCalculator);
  }

  const startDateInput = document.getElementById("calc-start-date");
  const endDateInput = document.getElementById("calc-end-date");
  const changeDateInput = document.getElementById("calc-change-date");
  const currentTierSelect = document.getElementById("calc-current-tier");
  const targetTierSelect = document.getElementById("calc-target-tier");
  const overageNodesInput = document.getElementById("calc-overage-nodes");
  const overageRateBadge = document.getElementById("calc-overage-rate-badge");

  const elapsedDaysEl = document.getElementById("calc-disp-elapsed-days");
  const elapsedPctEl = document.getElementById("calc-disp-elapsed-pct");
  const remainingDaysEl = document.getElementById("calc-disp-remaining-days");
  const remainingPctEl = document.getElementById("calc-disp-remaining-pct");
  const barElapsed = document.getElementById("calc-bar-elapsed");
  const barRemaining = document.getElementById("calc-bar-remaining");

  const unusedCreditEl = document.getElementById("calc-val-unused-credit");
  const targetProratedEl = document.getElementById("calc-val-target-prorated");
  const overageProratedEl = document.getElementById("calc-val-overage-prorated");
  const netDueEl = document.getElementById("calc-val-net-due");

  const totalNodesEl = document.getElementById("calc-disp-total-nodes");
  const renewalDateEl = document.getElementById("calc-disp-renewal-date");
  const renewalTotalEl = document.getElementById("calc-disp-renewal-total");
  const cliOutputEl = document.getElementById("calc-cli-output");
  const copyCalcBtn = document.getElementById("btn-copy-calc-cmd");
  const applyCheckoutBtn = document.getElementById("btn-calc-apply-checkout");

  if (!startDateInput || !endDateInput || !changeDateInput) return;

  // Defaults: Start Jan 1 of current year, End Dec 31 of current year, Change Today
  const now = new Date();
  const curYear = now.getFullYear();
  const pad = n => String(n).padStart(2, "0");
  const todayStr = `${curYear}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  if (!startDateInput.value) startDateInput.value = `${curYear}-01-01`;
  if (!endDateInput.value) endDateInput.value = `${curYear}-12-31`;
  if (!changeDateInput.value) changeDateInput.value = todayStr;

  function calculate() {
    const start = new Date(startDateInput.value);
    const end = new Date(endDateInput.value);
    const change = new Date(changeDateInput.value);

    const msPerDay = 1000 * 60 * 60 * 24;
    const totalDays = Math.max(1, Math.round((end - start) / msPerDay));
    const elapsedDays = Math.max(0, Math.min(totalDays, Math.round((change - start) / msPerDay)));
    const remainingDays = Math.max(0, totalDays - elapsedDays);

    const elapsedRatio = elapsedDays / totalDays;
    const remainingRatio = remainingDays / totalDays;

    if (elapsedDaysEl) elapsedDaysEl.textContent = elapsedDays;
    if (elapsedPctEl) elapsedPctEl.textContent = (elapsedRatio * 100).toFixed(1) + "%";
    if (remainingDaysEl) remainingDaysEl.textContent = remainingDays;
    if (remainingPctEl) remainingPctEl.textContent = (remainingRatio * 100).toFixed(1) + "%";

    if (barElapsed) barElapsed.style.width = `${Math.min(100, elapsedRatio * 100)}%`;
    if (barRemaining) barRemaining.style.width = `${Math.min(100, remainingRatio * 100)}%`;

    // Tier pricing data
    const curOpt = currentTierSelect.options[currentTierSelect.selectedIndex];
    const curAnnual = parseFloat(curOpt.getAttribute("data-annual") || "18000");
    const curBaseNodes = parseInt(curOpt.getAttribute("data-base") || "25");

    const tgtVal = targetTierSelect.value;
    let tgtAnnual = curAnnual;
    let tgtBaseNodes = curBaseNodes;
    let tgtOvRateMonthly = parseFloat(curOpt.getAttribute("data-ovrate") || "60");

    if (tgtVal !== "SAME") {
      const tgtOpt = targetTierSelect.options[targetTierSelect.selectedIndex];
      tgtAnnual = parseFloat(tgtOpt.getAttribute("data-annual") || "42000");
      tgtBaseNodes = parseInt(tgtOpt.getAttribute("data-base") || "75");
      tgtOvRateMonthly = parseFloat(tgtOpt.getAttribute("data-ovrate") || "45");
    }

    if (overageRateBadge) {
      overageRateBadge.textContent = tgtOvRateMonthly > 0
        ? `+$${tgtOvRateMonthly}/node/mo ($${tgtOvRateMonthly * 12}/yr)`
        : "Overage not applicable";
    }

    // Additional overage nodes & Tier 5 Volume-Decay Ladder Support
    const extraNodes = Math.max(0, parseInt(overageNodesInput ? overageNodesInput.value : "0", 10) || 0);
    let extraNodesAnnual = 0;
    
    if (tgtVal === "Enterprise Ed1 Base") {
      // <dcouplr/> Migration Suite: Block 1 (nodes 301-600) +$30/mo ($360/yr), Block 2 (nodes 601-900) +$25/mo ($300/yr), Site Cap $300k flat
      const b1 = Math.min(extraNodes, 300);
      const b2 = Math.max(0, Math.min(extraNodes - 300, 300));
      const uncappedAnnual = 120000 + (b1 * 360) + (b2 * 300);
      const totalAnnual = Math.min(uncappedAnnual, 300000);
      extraNodesAnnual = totalAnnual - 120000;
    } else if (tgtVal === "Enterprise Ed2 Base") {
      // <dcouplr/> Full-Stack Suite: Block 1 (nodes 301-600) +$40/mo ($480/yr), Block 2 (nodes 601-900) +$30/mo ($360/yr), Site Cap $360k flat
      const b1 = Math.min(extraNodes, 300);
      const b2 = Math.max(0, Math.min(extraNodes - 300, 300));
      const uncappedAnnual = 180000 + (b1 * 480) + (b2 * 360);
      const totalAnnual = Math.min(uncappedAnnual, 360000);
      extraNodesAnnual = totalAnnual - 180000;
    } else {
      extraNodesAnnual = extraNodes * (tgtOvRateMonthly * 12);
    }

    // Math:
    // 1. Unused current plan credit
    const unusedCredit = curAnnual * remainingRatio;
    // 2. Prorated target plan charge
    const proratedTarget = tgtAnnual * remainingRatio;
    // 3. Prorated overage pool charge
    const proratedOverage = extraNodesAnnual * remainingRatio;

    // 4. Net amount due
    const netDue = Math.max(0, (proratedTarget - unusedCredit) + proratedOverage);

    if (unusedCreditEl) {
      unusedCreditEl.textContent = `-$${unusedCredit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (targetProratedEl) {
      targetProratedEl.textContent = `+$${proratedTarget.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (overageProratedEl) {
      overageProratedEl.textContent = `+$${proratedOverage.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (netDueEl) {
      netDueEl.textContent = `$${netDue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    const totalFleet = tgtBaseNodes + extraNodes;
    if (totalNodesEl) totalNodesEl.textContent = totalFleet;
    if (renewalDateEl) renewalDateEl.textContent = endDateInput.value;
    const renewalTotal = tgtAnnual + extraNodesAnnual;
    if (renewalTotalEl) renewalTotalEl.textContent = `$${renewalTotal.toLocaleString("en-US")} / yr`;

    const effectiveTargetTier = tgtVal === "SAME" ? currentTierSelect.value : tgtVal;
    let cmd = `dcouplr auth activate --tier "${effectiveTargetTier}"`;
    if (extraNodes > 0) cmd += ` --overage-nodes ${extraNodes}`;
    cmd += ` --expires "${endDateInput.value}"`;
    if (cliOutputEl) cliOutputEl.textContent = cmd;
  }

  [startDateInput, endDateInput, changeDateInput, currentTierSelect, targetTierSelect, overageNodesInput].forEach(el => {
    if (el) {
      el.addEventListener("input", calculate);
      el.addEventListener("change", calculate);
    }
  });

  if (copyCalcBtn && cliOutputEl) {
    copyCalcBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(cliOutputEl.textContent.trim());
        const orig = copyCalcBtn.textContent;
        copyCalcBtn.textContent = "Copied!";
        copyCalcBtn.style.color = "#34d399";
        setTimeout(() => {
          copyCalcBtn.textContent = orig;
          copyCalcBtn.style.color = "#fff";
        }, 1500);
      } catch (_) {}
    });
  }

  if (applyCheckoutBtn) {
    applyCheckoutBtn.addEventListener("click", () => {
      // Close pricing matrix modal
      if (modal) {
        modal.classList.remove("open");
        modal.style.display = "none";
        document.body.style.overflow = "";
      }
      const tgtVal = targetTierSelect ? targetTierSelect.value : "SAME";
      const effectiveTier = tgtVal === "SAME" ? currentTierSelect.value : tgtVal;
      const extraNodes = Math.max(0, parseInt(overageNodesInput ? overageNodesInput.value : "0", 10) || 0);

      if (window.openCheckoutPortal) {
        window.openCheckoutPortal(effectiveTier, extraNodes);
      }
    });
  }

  calculate();
}

function initPricingModal() {
  const openBtn = document.getElementById("btn-open-pricing-matrix");
  const modal = document.getElementById("modal-pricing-matrix");
  const closeBtn = document.getElementById("btn-close-pricing-modal");
  const closeBottomBtn = document.getElementById("btn-close-pricing-modal-bottom");

  if (!openBtn || !modal) return;

  function openModal() {
    modal.style.display = "flex";
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.remove("open");
    modal.style.display = "none";
    document.body.style.overflow = "";
  }

  openBtn.addEventListener("click", openModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (closeBottomBtn) closeBottomBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) {
      closeModal();
    }
  });
}

function initDownloadHub() {
  // A. Hero Platform Switcher Tabs
  const heroTabs = document.querySelectorAll("#hero-platform-tabs .term-tab-btn");
  const cliCmdText = document.getElementById("cli-cmd-text");

  heroTabs.forEach(btn => {
    btn.addEventListener("click", () => {
      heroTabs.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const cmd = btn.getAttribute("data-cmd");
      if (cmd && cliCmdText) {
        cliCmdText.textContent = cmd;
      }
    });
  });

  // B. Download Hub Tabs (Free vs Paid Commercial)
  const dlTabs = document.querySelectorAll(".download-tab-btn");
  dlTabs.forEach(btn => {
    btn.addEventListener("click", () => {
      dlTabs.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const targetId = btn.getAttribute("data-target");
      document.querySelectorAll(".download-panel").forEach(p => p.classList.remove("active"));
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add("active");
    });
  });

  // Automatically activate the requested tab (Free vs Paid) when clicking mid-page CTA buttons
  document.querySelectorAll('a[data-dl-tab]').forEach(link => {
    link.addEventListener("click", () => {
      const tabType = link.getAttribute("data-dl-tab");
      if (tabType === "paid") {
        const paidBtn = document.getElementById("tab-btn-paid-dl");
        if (paidBtn) paidBtn.click();
      } else if (tabType === "free") {
        const freeBtn = document.getElementById("tab-btn-free-dl");
        if (freeBtn) freeBtn.click();
      }
    });
  });

  // C. Snippet Copy Buttons
  document.querySelectorAll(".btn-copy-snippet").forEach(btn => {
    btn.addEventListener("click", async () => {
      const copyVal = btn.getAttribute("data-copy") || btn.parentElement.querySelector(".download-snippet-text")?.textContent.trim();
      if (!copyVal) return;

      const user = window.dcouplrGetCommunityUser ? window.dcouplrGetCommunityUser() : null;
      if ((!user || !user.registered) && window.dcouplrOpenCommunityGate) {
        window.dcouplrOpenCommunityGate({ copyText: copyVal, btnRef: btn });
        return;
      }

      try {
        await navigator.clipboard.writeText(copyVal);
        const orig = btn.textContent;
        btn.textContent = "Copied!";
        btn.style.color = "#34d399";
        setTimeout(() => {
          btn.textContent = orig;
          btn.style.color = "";
        }, 2000);
      } catch (err) {
        console.warn("Clipboard copy failed:", err);
      }
    });
  });

  // D. Offline Commercial License Simulator
  const sampleBtns = document.querySelectorAll(".sample-license-btn");
  const licenseInput = document.getElementById("landing-license-input");
  const validateBtn = document.getElementById("btn-validate-license");
  const resultBox = document.getElementById("license-validation-result");
  const resTier = document.getElementById("res-license-tier");
  const resOrg = document.getElementById("res-license-org");
  const resNodes = document.getElementById("res-license-nodes");
  const resSla = document.getElementById("res-license-sla");
  const resCmd = document.getElementById("res-license-cmd");
  const copyCmdBtn = document.getElementById("btn-copy-license-cmd");

  sampleBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-key");
      const org = btn.getAttribute("data-org");
      if (licenseInput && key) {
        licenseInput.value = key;
        licenseInput.setAttribute("data-org", org || "");
        validateLicense(key, org);
      }
    });
  });

  if (validateBtn && licenseInput) {
    validateBtn.addEventListener("click", () => {
      const key = licenseInput.value.trim();
      const org = licenseInput.getAttribute("data-org") || "Licensed Enterprise";
      if (!key) {
        alert("Please enter a license key to validate.");
        return;
      }
      validateLicense(key, org);
    });
  }

  function validateLicense(key, org) {
    if (!resultBox) return;
    const upper = key.toUpperCase();
    let tier = "Developer Pro";
    let nodes = "10 Nodes Base (Max Cap: 25)";
    let sla = "48h Standard Email";

    if (upper.includes("CLUS-SM") || upper.includes("-SM-")) {
      tier = "Cluster Small";
      nodes = "25 Nodes Base (Max Cap: 60)";
      sla = "9x5 NBD Portal SLA";
    } else if (upper.includes("CLUS-MD") || upper.includes("-MD-")) {
      tier = "Cluster Medium";
      nodes = "75 Nodes Base (Max Cap: 90)";
      sla = "24x7 P1 (2-Hour SLA) + Shared Slack";
    } else if (upper.includes("CLUS-LG") || upper.includes("-LG-")) {
      tier = "Cluster Large";
      nodes = "Up to 300 Nodes (Fleet Scale)";
      sla = "24x7 P1 (1-Hour SLA) + Dedicated TAM & War-Room";
    } else if (upper.includes("ENT") || upper.includes("CORP")) {
      tier = "Custom Enterprise";
      nodes = "300+ Nodes (Air-Gapped Sovereign Grids)";
      sla = "24x7 P1 (15-Min SLA) + Named TAM & Custom PKI";
    }

    if (resTier) resTier.textContent = tier;
    if (resOrg) resOrg.textContent = org || "Acme Corp";
    if (resNodes) resNodes.textContent = nodes;
    if (resSla) resSla.textContent = sla;
    if (resCmd) resCmd.textContent = `dcouplr auth login --license-key ${key}`;

    resultBox.style.display = "block";
    resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  if (copyCmdBtn && resCmd) {
    copyCmdBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(resCmd.textContent.trim());
        const orig = copyCmdBtn.textContent;
        copyCmdBtn.textContent = "Copied!";
        copyCmdBtn.style.color = "#34d399";
        setTimeout(() => {
          copyCmdBtn.textContent = orig;
          copyCmdBtn.style.color = "";
        }, 2000);
      } catch (err) {
        console.warn("Copy command failed:", err);
      }
    });
  }
}

// =========================================================================
// 🆓 FREE COMMUNITY CORE DOWNLOAD LEAD GATE & CENSUS REGISTRATION
// =========================================================================
const COMMUNITY_USER_STORAGE_KEY = "dcouplr_community_registered_user";

function initCommunityLeadGate() {
  const modal = document.getElementById("modal-community-gate");
  const form = document.getElementById("form-community-register");
  const closeBtn = document.getElementById("btn-close-community-modal");
  const triggerBtn = document.getElementById("btn-trigger-register-modal");
  const editProfileBtn = document.getElementById("btn-edit-community-profile");
  const errorBox = document.getElementById("comm-gate-error");
  const submitBtn = document.getElementById("btn-submit-community-gate");

  const nameInput = document.getElementById("comm-input-name");
  const emailInput = document.getElementById("comm-input-email");
  const companyInput = document.getElementById("comm-input-company");
  const cloudSelect = document.getElementById("comm-input-cloud");
  const interestSelect = document.getElementById("comm-input-interest");

  const gateNotice = document.getElementById("comm-gate-notice");
  const unlockedNotice = document.getElementById("comm-unlocked-notice");
  const unlockedName = document.getElementById("comm-unlocked-user-name");
  const unlockedOrg = document.getElementById("comm-unlocked-user-org");

  let pendingDownload = null;

  function getStoredUser() {
    try {
      const raw = localStorage.getItem(COMMUNITY_USER_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.registered) return parsed;
    } catch (e) {
      console.warn("Failed to read community registration from localStorage:", e);
    }
    return null;
  }

  function saveStoredUser(userData) {
    try {
      localStorage.setItem(COMMUNITY_USER_STORAGE_KEY, JSON.stringify(userData));
    } catch (e) {
      console.warn("Failed to save community registration to localStorage:", e);
    }
  }

  function updateBanners(user) {
    if (user && user.registered) {
      if (gateNotice) gateNotice.style.display = "none";
      if (unlockedNotice) {
        unlockedNotice.style.display = "flex";
        if (unlockedName) unlockedName.textContent = user.name || "Engineering User";
        if (unlockedOrg) unlockedOrg.textContent = user.company || "Independent Organization";
      }
    } else {
      if (gateNotice) gateNotice.style.display = "block";
      if (unlockedNotice) unlockedNotice.style.display = "none";
    }
  }

  function openModal(downloadItem = null) {
    if (!modal) return;
    pendingDownload = downloadItem;
    if (errorBox) {
      errorBox.style.display = "none";
      errorBox.textContent = "";
    }

    const existing = getStoredUser();
    if (existing) {
      if (nameInput && existing.name) nameInput.value = existing.name;
      if (emailInput && existing.email) emailInput.value = existing.email;
      if (companyInput && existing.company) companyInput.value = existing.company;
      if (cloudSelect && existing.cloud_stack) cloudSelect.value = existing.cloud_stack;
      if (interestSelect && existing.interest) interestSelect.value = existing.interest;
    }

    modal.style.display = "flex";
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    if (nameInput) setTimeout(() => nameInput.focus(), 100);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("open");
    modal.style.display = "none";
    document.body.style.overflow = "";
    pendingDownload = null;
  }

  async function executeDownload(item) {
    if (!item) return;
    if (item.copyText) {
      try {
        await navigator.clipboard.writeText(item.copyText);
        if (item.btnRef) {
          const orig = item.btnRef.textContent;
          item.btnRef.textContent = "Copied!";
          item.btnRef.style.color = "#34d399";
          setTimeout(() => {
            item.btnRef.textContent = orig;
            item.btnRef.style.color = "";
          }, 2000);
        }
      } catch (err) {
        console.warn("Clipboard copy after registration failed:", err);
      }
      return;
    }
    if (!item.url) return;
    if (item.url.startsWith("http://") || item.url.startsWith("https://")) {
      window.open(item.url, "_blank");
      return;
    }
    const a = document.createElement("a");
    a.href = item.url;
    if (item.filename) a.download = item.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Expose helpers globally for other components
  window.dcouplrGetCommunityUser = getStoredUser;
  window.dcouplrOpenCommunityGate = openModal;
  window.dcouplrExecuteDownload = executeDownload;

  // Initial state check
  const currentUser = getStoredUser();
  updateBanners(currentUser);

  // Modal event listeners
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (triggerBtn) triggerBtn.addEventListener("click", () => openModal(null));
  if (editProfileBtn) editProfileBtn.addEventListener("click", () => openModal(null));

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("open")) {
      closeModal();
    }
  });

  // Intercept community download links
  const commDownloadButtons = document.querySelectorAll(".btn-comm-download");
  commDownloadButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const user = getStoredUser();
      const href = btn.getAttribute("href") || btn.getAttribute("data-file") || "/install.sh";
      const filename = btn.getAttribute("download") || btn.getAttribute("data-name") || "install.sh";

      if (!user || !user.registered) {
        e.preventDefault();
        openModal({ url: href, filename: filename });
      }
      // If already registered, allow default navigation/download
    });
  });

  // Handle Form Submission
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (errorBox) {
        errorBox.style.display = "none";
        errorBox.textContent = "";
      }

      const name = nameInput ? nameInput.value.trim() : "";
      const email = emailInput ? emailInput.value.trim() : "";
      const company = companyInput ? companyInput.value.trim() : "";
      const cloud_stack = cloudSelect ? cloudSelect.value : "Multi-Cloud";
      const interest = interestSelect ? interestSelect.value : "General Evaluation";

      if (!name) {
        showError("Please enter your full name.");
        if (nameInput) nameInput.focus();
        return;
      }
      if (!email || !email.includes("@") || !email.includes(".")) {
        showError("Please enter a valid work email address.");
        if (emailInput) emailInput.focus();
        return;
      }
      if (!company) {
        showError("Please enter your company or organization name.");
        if (companyInput) companyInput.focus();
        return;
      }

      const payload = {
        name,
        email,
        company,
        cloud_stack,
        interest,
        source: "website-community-gate"
      };

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Registering &amp; Unlocking...</span>`;
      }

      let success = false;

      // 1. Try FastAPI endpoint
      try {
        const resp = await fetch("/v1/community/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (resp.ok) {
          success = true;
        }
      } catch (err) {
        console.warn("FastAPI registration failed, trying PHP endpoint:", err);
      }

      // 2. If FastAPI didn't succeed, try Hostinger PHP endpoint
      if (!success) {
        try {
          const respPhp = await fetch("/register.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          if (respPhp.ok) {
            success = true;
          }
        } catch (phpErr) {
          console.warn("Hostinger PHP registration failed:", phpErr);
        }
      }

      // Always save to localStorage so the user is unlocked even offline / air-gapped
      const userData = {
        registered: true,
        name,
        email,
        company,
        cloud_stack,
        interest,
        registered_at: new Date().toISOString()
      };
      saveStoredUser(userData);
      updateBanners(userData);

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Unlock &amp; Proceed to Download</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
      }

      const itemToDownload = pendingDownload;
      closeModal();

      if (itemToDownload) {
        setTimeout(() => {
          executeDownload(itemToDownload);
        }, 150);
      }
    });
  }

  function showError(msg) {
    if (errorBox) {
      errorBox.textContent = msg;
      errorBox.style.display = "block";
    }
  }
}


if (document.readyState === "complete" || document.readyState === "interactive") {
  initAll();
} else {
  document.addEventListener("DOMContentLoaded", initAll);
}

function initTerminalCopy() {
  const copyBtn = document.getElementById("cli-copy-btn");
  const cmdText = document.getElementById("cli-cmd-text");
  if (!copyBtn || !cmdText) return;

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(cmdText.textContent.trim());
      const label = copyBtn.querySelector(".copy-label");
      if (label) {
        const originalText = label.textContent;
        label.textContent = "Copied!";
        copyBtn.classList.add("copied");
        setTimeout(() => {
          label.textContent = originalText;
          copyBtn.classList.remove("copied");
        }, 2000);
      }
    } catch (err) {
      console.warn("Clipboard write failed:", err);
    }
  });
}

function initSyntaxShowcase() {
  const tabs = document.querySelectorAll(".window-tab");
  const sourceFile = document.getElementById("source-file-label");
  const sourceFormat = document.getElementById("source-format-label");
  const targetFile = document.getElementById("target-file-label");
  const targetFormat = document.getElementById("target-format-label");
  const codeSource = document.getElementById("code-source-display");
  const codeTarget = document.getElementById("code-target-display");
  const sourceBadges = document.getElementById("source-token-badges");
  const targetBadges = document.getElementById("target-token-badges");

  if (!tabs.length || !codeSource || !codeTarget) return;

  function loadPreset(key) {
    const data = SYNTAX_PRESETS[key];
    if (!data) return;

    if (sourceFile) sourceFile.textContent = data.sourceFile;
    if (sourceFormat) sourceFormat.textContent = data.sourceFormat;
    if (targetFile) targetFile.textContent = data.targetFile;
    if (targetFormat) targetFormat.textContent = data.targetFormat;
    codeSource.textContent = data.sourceCode;
    codeTarget.textContent = data.targetCode;

    if (sourceBadges) {
      sourceBadges.innerHTML = data.sourceTokens
        .map(t => `<span class="token-badge">${escapeHtml(t)}</span>`)
        .join("");
    }
    if (targetBadges) {
      targetBadges.innerHTML = data.targetTokens
        .map(t => `<span class="token-badge success">${escapeHtml(t)}</span>`)
        .join("");
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      loadPreset(tab.getAttribute("data-preset"));
    });
  });
}

function initPipelineVisualizer() {
  const steps = document.querySelectorAll(".pipeline-step");
  const kicker = document.getElementById("detail-kicker");
  const title = document.getElementById("detail-title");
  const desc = document.getElementById("detail-desc");
  const inputEl = document.getElementById("detail-input");
  const memoryEl = document.getElementById("detail-memory");
  const securityEl = document.getElementById("detail-security");
  const codeEl = document.getElementById("detail-code-display");

  if (!steps.length || !title) return;

  function setStage(stageNum) {
    const data = PIPELINE_STAGES[stageNum];
    if (!data) return;

    steps.forEach(s => {
      if (s.getAttribute("data-stage") === String(stageNum)) {
        s.classList.add("active");
      } else {
        s.classList.remove("active");
      }
    });

    if (kicker) kicker.textContent = data.kicker;
    if (title) title.textContent = data.title;
    if (desc) desc.textContent = data.desc;
    if (inputEl) inputEl.textContent = data.input;
    if (memoryEl) memoryEl.textContent = data.memory;
    if (securityEl) securityEl.textContent = data.security;
    if (codeEl) codeEl.textContent = data.code;
  }

  steps.forEach(step => {
    step.addEventListener("click", () => {
      const num = parseInt(step.getAttribute("data-stage"), 10);
      setStage(num);
    });
  });
}

function initFinOpsCalculator() {
  const nodesInput = document.getElementById("calc-nodes");
  const billInput = document.getElementById("calc-bill");
  const nodesVal = document.getElementById("calc-nodes-val");
  const billVal = document.getElementById("calc-bill-val");
  const savingsVal = document.getElementById("calc-savings-val");
  const roiPctVal = document.getElementById("calc-roi-pct");
  const paybackVal = document.getElementById("calc-payback-val");
  const tierVal = document.getElementById("calc-tier-val");

  const ledgerSaasVal = document.getElementById("ledger-saas-val");
  const ledgerEgressVal = document.getElementById("ledger-egress-val");
  const ledgerLicenseVal = document.getElementById("ledger-license-val");
  const ledgerLicenseLabel = document.getElementById("ledger-license-label");
  const ledgerComputeVal = document.getElementById("ledger-compute-val");
  const ledgerComputeLabel = document.getElementById("ledger-compute-label");

  if (!nodesInput || !billInput) return;

  function update() {
    const nodes = parseInt(nodesInput.value, 10);
    const monthlyBill = parseInt(billInput.value, 10);

    if (nodesVal) nodesVal.textContent = `${nodes} nodes`;
    if (billVal) billVal.textContent = `$${monthlyBill.toLocaleString()} / mo`;

    let dcouplrMonthly = 3500;
    let tierName = "Cluster Medium";
    let bracketText = "75 nodes ($3,500/mo)";
    let incentiveNotice = "";

    if (nodes <= 1) {
      dcouplrMonthly = 0;
      tierName = "Community Core";
      bracketText = "1 node ($0/mo)";
    } else if (nodes <= 10) {
      dcouplrMonthly = 300;
      tierName = "Developer Pro";
      bracketText = "10 nodes ($300/mo)";
    } else if (nodes <= 25) {
      dcouplrMonthly = 1500;
      tierName = "Cluster Small";
      bracketText = "25 nodes base ($1,500/mo)";
    } else if (nodes <= 60) {
      // Tier 2 Expansion: $1,500 base (25 nodes) + $60/node/mo overage up to 60 nodes Max Cap
      const overageNodes = nodes - 25;
      dcouplrMonthly = 1500 + (overageNodes * 60);
      tierName = "Cluster Small (Expansion)";
      bracketText = `${nodes} nodes ($1,500 + ${overageNodes}×$60 = $${dcouplrMonthly.toLocaleString()}/mo)`;
      if (nodes >= 59) {
        incentiveNotice = " • 💡 Tier 3 Upsell: Moving to Tier 3 Base ($3,500/mo) saves money while giving 75 nodes and 24x7 P1 (2-Hr) SLA!";
      }
    } else if (nodes <= 75) {
      // Tier 3 Base: $3,500/mo for up to 75 nodes
      dcouplrMonthly = 3500;
      tierName = "Cluster Medium";
      bracketText = "75 nodes base ($3,500/mo)";
    } else if (nodes <= 90) {
      // Tier 3 Expansion: $3,500 base (75 nodes) + $45/node/mo overage up to 90 nodes Max Cap
      const overageNodes = nodes - 75;
      dcouplrMonthly = 3500 + (overageNodes * 45);
      tierName = "Cluster Medium (Expansion)";
      bracketText = `${nodes} nodes ($3,500 + ${overageNodes}×$45 = $${dcouplrMonthly.toLocaleString()}/mo)`;
      if (nodes === 90) {
        incentiveNotice = " • 💡 Tier 4 Upsell: Upgrading to Tier 4 ($4,050/mo) saves $125/mo with Dedicated TAM & War-Room!";
      }
    } else {
      // Tier 4: Cluster Large: Flat $45 / mo per node ($540 / node / yr) for 91+ nodes
      dcouplrMonthly = nodes * 45;
      tierName = "Cluster Large";
      bracketText = `${nodes} nodes (Flat $45/node = $${dcouplrMonthly.toLocaleString()}/mo)`;
    }

    const dcouplrAnnual = dcouplrMonthly * 12;
    const recTier = `${tierName} ($${dcouplrMonthly.toLocaleString()}/mo • $${dcouplrAnnual.toLocaleString()}/yr)${incentiveNotice}`;

    const saasAnnual = monthlyBill * 12;
    // Estimated avoided cloud data egress (~8% of total SaaS bill based on cloud egress tariffs)
    const avoidedEgressAnnual = Math.round(monthlyBill * 0.08 * 12);
    
    // In-VPC local node footprint: lightweight daemon consumes ~$4.00/node/month in AWS/GCP
    const localComputeMonthly = Math.max(40, Math.round(nodes * 4));
    const localComputeAnnual = localComputeMonthly * 12;

    const totalLegacyCost = saasAnnual + avoidedEgressAnnual;
    const totalDcouplrCost = dcouplrAnnual + localComputeAnnual;
    const netSavings = Math.max(0, totalLegacyCost - totalDcouplrCost);
    const roiPct = Math.round((netSavings / (totalDcouplrCost || 1)) * 100);

    // Dynamic Payback Period in days
    const monthlySavings = (totalLegacyCost - totalDcouplrCost) / 12;
    let paybackDaysStr = "< 30 Days";
    if (monthlySavings > 0) {
      const days = Math.max(14, Math.round((dcouplrAnnual / (monthlySavings * 12)) * 365));
      paybackDaysStr = days < 365 ? `< ${days} Days` : `${Math.round(days / 30)} Mos`;
    } else {
      paybackDaysStr = "Baseline";
    }

    if (savingsVal) savingsVal.textContent = `$${netSavings.toLocaleString()}`;
    if (roiPctVal) roiPctVal.textContent = `${roiPct}% ROI`;
    if (paybackVal) paybackVal.textContent = paybackDaysStr;
    if (tierVal) tierVal.textContent = recTier;

    if (ledgerSaasVal) ledgerSaasVal.textContent = `$${saasAnnual.toLocaleString()} / yr`;
    if (ledgerEgressVal) ledgerEgressVal.textContent = `+$${avoidedEgressAnnual.toLocaleString()} / yr`;
    
    if (ledgerLicenseLabel) {
      ledgerLicenseLabel.innerHTML = `<span class="dcouplr-wordmark"><span class="dcouplr-bracket">&lt;</span><span class="dcouplr-text">dcouplr</span><span class="dcouplr-bracket">/&gt;</span></span> License (${tierName} • ${bracketText})`;
    }
    if (ledgerLicenseVal) {
      ledgerLicenseVal.textContent = `-$${dcouplrAnnual.toLocaleString()} / yr`;
    }

    if (ledgerComputeLabel) {
      ledgerComputeLabel.textContent = `In-VPC Local Compute (~$${localComputeMonthly.toLocaleString()}/mo @ $4/node)`;
    }
    if (ledgerComputeVal) {
      ledgerComputeVal.textContent = `-$${localComputeAnnual.toLocaleString()} / yr`;
    }
  }

  nodesInput.addEventListener("input", update);
  billInput.addEventListener("input", update);
  update();
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ==============================================================================
   Native In-App Telemetry & Multi-VPC Dashboard Showcase Logic
   ============================================================================== */
function initDashboardShowcase() {
  // 1. Pillar Tab Switcher
  const tabs = document.querySelectorAll(".dash-tab");
  const panels = document.querySelectorAll(".pillar-panel");

  if (tabs.length && panels.length) {
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => {
          t.classList.remove("active");
          t.setAttribute("aria-selected", "false");
        });
        panels.forEach(p => {
          p.classList.remove("active");
          p.style.display = "none";
        });

        tab.classList.add("active");
        tab.setAttribute("aria-selected", "true");

        const pillar = tab.getAttribute("data-pillar");
        const activePanel = document.getElementById(`pillar-${pillar}`);
        if (activePanel) {
          activePanel.classList.add("active");
          activePanel.style.display = "block";
        }
      });
    });
  }

  // 2. Hydrate Live Telemetry Metrics from Backend
  async function fetchLiveMetrics() {
    try {
      const res = await fetch("/v1/telemetry/metrics");
      if (!res.ok) return;
      const data = await res.json();

      const cpuEl = document.getElementById("dash-kpi-cpu");
      const memEl = document.getElementById("dash-kpi-mem");
      const latEl = document.getElementById("dash-kpi-lat");
      const tpEl = document.getElementById("dash-kpi-tp");
      const stripLat = document.getElementById("strip-latency");
      const stripMem = document.getElementById("strip-memory");

      if (data.system) {
        if (cpuEl && data.system.cpu_percent !== undefined) {
          cpuEl.innerHTML = `${data.system.cpu_percent.toFixed(1)}<span class="kpi-mini-unit">%</span>`;
        }
        if (memEl && data.system.memory_rss_mb !== undefined) {
          memEl.innerHTML = `${data.system.memory_rss_mb.toFixed(1)}<span class="kpi-mini-unit">/ 50 MiB</span>`;
        }
        if (stripMem && data.system.memory_rss_mb !== undefined) {
          stripMem.textContent = `${data.system.memory_rss_mb.toFixed(1)} MiB`;
        }
      }

      if (data.engine) {
        if (latEl && data.engine.latency_p50_ms !== undefined && data.engine.latency_p99_ms !== undefined) {
          latEl.innerHTML = `${data.engine.latency_p50_ms.toFixed(1)} / ${data.engine.latency_p99_ms.toFixed(1)}<span class="kpi-mini-unit">ms</span>`;
        }
        if (tpEl && data.engine.throughput_ops_sec !== undefined) {
          tpEl.innerHTML = `${data.engine.throughput_ops_sec.toFixed(1)}<span class="kpi-mini-unit">tx/s</span>`;
        }
        if (stripLat && data.engine.latency_p99_ms !== undefined) {
          stripLat.textContent = `< ${data.engine.latency_p99_ms.toFixed(1)} ms`;
        }
      }
    } catch (e) {
      // Offline fallback: keep static placeholder numbers
    }
  }

  fetchLiveMetrics();
  setInterval(fetchLiveMetrics, 6000);

  // 3. Hardware-Accelerated 60 FPS Canvas Preview Animation
  initShowcaseCanvas();

  // 4. Interactive Circuit Breaker Chaos Drill
  const chaosBtn = document.getElementById("landing-btn-chaos");
  const cbDot = document.getElementById("landing-cb-dot");
  const cbText = document.getElementById("landing-cb-text");

  if (chaosBtn && cbDot && cbText) {
    chaosBtn.addEventListener("click", () => {
      chaosBtn.disabled = true;
      chaosBtn.style.opacity = "0.6";
      chaosBtn.innerHTML = "<span>Tripping Breaker (5s)...</span>";
      cbDot.style.background = "#f43f5e";
      cbDot.style.boxShadow = "0 0 10px #f43f5e";
      cbText.textContent = "OPEN (Simulated 18ms SLA Trip)";
      cbText.style.color = "#f43f5e";

      setTimeout(() => {
        cbDot.style.background = "#10b981";
        cbDot.style.boxShadow = "0 0 8px #10b981";
        cbText.textContent = "CLOSED (Normal)";
        cbText.style.color = "#10b981";
        chaosBtn.disabled = false;
        chaosBtn.style.opacity = "1";
        chaosBtn.innerHTML = "<span>⚡ Test Circuit Breaker Trip</span>";
      }, 5000);
    });
  }

  // 5. Interactive Alert Rule Threshold Slider Sandbox
  const simSlider = document.getElementById("landing-sim-slider");
  const simVal = document.getElementById("landing-sim-val");
  const breachVal = document.getElementById("landing-breaches-val");
  const firesVal = document.getElementById("landing-fires-val");
  const riskVal = document.getElementById("landing-risk-val");
  const ruleText = document.getElementById("landing-rule-text");
  const copyRuleBtn = document.getElementById("landing-copy-rule");

  if (simSlider && simVal) {
    function updateSimulator() {
      const val = parseFloat(simSlider.value);
      simVal.textContent = `${val.toFixed(1)} ms`;

      let breaches = 0;
      let fires = 0.0;
      let risk = "Zero Noise (0.0%)";
      let riskColor = "var(--accent-emerald)";

      if (val <= 4.0) {
        breaches = 28;
        fires = 28.0;
        risk = "Critical Noise (46.7%)";
        riskColor = "var(--accent-rose)";
      } else if (val <= 7.0) {
        breaches = 11;
        fires = 11.0;
        risk = "Elevated Risk (18.3%)";
        riskColor = "var(--accent-amber)";
      } else if (val <= 10.0) {
        breaches = 3;
        fires = 3.0;
        risk = "Low Risk (2.0%)";
        riskColor = "var(--accent-emerald)";
      } else if (val <= 14.0) {
        breaches = 1;
        fires = 0.8;
        risk = "Minimal Noise (0.3%)";
        riskColor = "var(--accent-emerald)";
      } else {
        breaches = 0;
        fires = 0.0;
        risk = "Zero False Positives (0.0%)";
        riskColor = "var(--accent-cyan)";
      }

      if (breachVal) {
        breachVal.textContent = `${breaches} points`;
        breachVal.style.color = breaches > 5 ? "var(--accent-rose)" : "var(--accent-amber)";
      }
      if (firesVal) firesVal.textContent = `${fires.toFixed(1)} / hr`;
      if (riskVal) {
        riskVal.textContent = risk;
        riskVal.style.color = riskColor;
      }

      if (ruleText) {
        ruleText.textContent = `groups:
  - name: dcouplr_latency_envelope
    rules:
      - alert: DcouplrP99LatencyElevated
        expr: dcouplr_latency_p99_ms > ${val.toFixed(1)}
        for: 2m
        labels:
          severity: warning
          tier: ast-compiler
        annotations:
          summary: "<dcouplr/> P99 latency exceeded ${val.toFixed(1)}ms threshold."`;
      }
    }

    simSlider.addEventListener("input", updateSimulator);
  }

  if (copyRuleBtn && ruleText) {
    copyRuleBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(ruleText.textContent.trim());
        const orig = copyRuleBtn.textContent;
        copyRuleBtn.textContent = "Copied!";
        copyRuleBtn.style.color = "#34d399";
        setTimeout(() => {
          copyRuleBtn.textContent = orig;
          copyRuleBtn.style.color = "";
        }, 2000);
      } catch (err) {
        console.warn("Copy rule failed:", err);
      }
    });
  }
}

function initShowcaseCanvas() {
  const canvas = document.getElementById("landing-telemetry-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let animFrameId;
  let offset = 0;

  function render() {
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Draw Subtle Grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 35) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    offset += 0.035;

    // Draw Curve Helper
    function drawWave(color, baseY, amp, freq, speedMod, fillAlpha) {
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 6) {
        const rad = (x * freq) + (offset * speedMod);
        const y = baseY + Math.sin(rad) * amp + Math.cos(rad * 0.45) * (amp * 0.4);
        if (x === 0) {
          ctx.lineTo(0, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      if (fillAlpha > 0) {
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = color.replace(")", `, ${fillAlpha})`).replace("rgb", "rgba").replace("#06b6d4", "rgba(6, 182, 212, 0.12)").replace("#a78bfa", "rgba(167, 139, 250, 0.08)").replace("#f43f5e", "rgba(244, 63, 94, 0.06)");
        ctx.fill();
      }

      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) {
        const rad = (x * freq) + (offset * speedMod);
        const y = baseY + Math.sin(rad) * amp + Math.cos(rad * 0.45) * (amp * 0.4);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // P99 (Top curve, red/rose)
    drawWave("#f43f5e", 45, 12, 0.02, 1.2, 0.05);

    // P90 (Mid-top curve, purple)
    drawWave("#a78bfa", 90, 14, 0.022, 1.0, 0.08);

    // Throughput (Amber dashed curve)
    ctx.setLineDash([4, 4]);
    drawWave("#fbbf24", 130, 16, 0.018, 0.8, 0);
    ctx.setLineDash([]);

    // P50 (Median curve, cyan)
    drawWave("#06b6d4", 175, 12, 0.025, 1.4, 0.15);

    animFrameId = requestAnimationFrame(render);
  }

  render();
}

// =========================================================================
// 🔝 FLOATING SCROLL-TO-TOP PUSH UP ARROW CONTROLLER
// =========================================================================
function initScrollToTop() {
  const scrollBtn = document.getElementById("scroll-to-top");
  if (!scrollBtn) return;

  const toggleVisibility = () => {
    // Show arrow button whenever the top of the page is not showing (scrolled > 250px)
    if (window.scrollY > 250) {
      scrollBtn.classList.add("visible");
    } else {
      scrollBtn.classList.remove("visible");
    }
  };

  window.addEventListener("scroll", toggleVisibility, { passive: true });
  toggleVisibility();

  scrollBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initScrollToTop);
} else {
  initScrollToTop();
}


