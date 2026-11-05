# Customer Guide: In-VPC Node Licensing Status & Color Code Indicators

**Document Identifier:** `VA-GUIDE-LIC-COLOR-001`  
**Classification:** Customer Success, FinOps Advisory & Technical Reference  
**Audience:** Enterprise Customers, Lead SREs, FinOps Directors, Cloud Procurement Teams  
**Governing Architectural Standard:** `VA-SPEC-OPS-EXPANSION-001` / `VA-SPEC-FINOPS-BRIDGE-001` / `D-50` / `D-54`  
**Security Invariant:** 100% In-VPC Local Autonomous Enforcement ($0.00 Phone-Home Egress)

---

## 1. Overview & Purpose

In `<dcouplr/>`'s zero-egress architecture, node metering and contract compliance are evaluated **entirely inside the customer's private VPC** using local Raft consensus and machine-level hardware leases (`dcouplr.lic`). No telemetry, host counters, or IP addresses ever leave the customer perimeter.

To provide total visibility and eliminate billing surprises, `<dcouplr/>` uses a standardized **4-Zone Color Code Indicator System** across all user interfaces:
- The **Top Header Segmented Micro-Badge** on the In-VPC Telemetry Dashboard.
- The **In-VPC License Entitlement & Installation Census Modal**.
- The **CLI Terminal Output** (`dcouplr auth status`, `dcouplr auth overage`).
- The **24x7 NOC Desk & Wallboard Displays**.

This guide details what each color means, how it maps to your enterprise contract, and the exact steps to take when status changes occur.

---

## 2. Master Color Code Matrix

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                        <dcouplr/> NODE LICENSING STATUS COLOR CODE MATRIX                              │
├─────────┬───────────────────────────┬──────────────────────┬───────────────────────┬───────────────────┤
│ Zone    │ Color & Visual Indicator  │ Contract Status      │ Financial Impact      │ Recommended Action│
├─────────┼───────────────────────────┼──────────────────────┼───────────────────────┼───────────────────┤
│ Zone 1  │ 🟢 Emerald / Cyan         │ Included Base        │ $0 Extra Charges      │ None — Optimal    │
│         │ (#06b6d4 / #10b981)       │ (100% Compliant)     │ (Covered by Base Fee) │ Healthy Capacity  │
├─────────┼───────────────────────────┼──────────────────────┼───────────────────────┼───────────────────┤
│ Zone 1B │ 🟣 Violet / Purple        │ Covered by Purchased │ Pre-Paid Buffer       │ Plan renewal if   │
│         │ (#a78bfa / #8b5cf6)       │ Overage Pool         │ (Contracted Discount) │ buffer runs low   │
├─────────┼───────────────────────────┼──────────────────────┼───────────────────────┼───────────────────┤
│ Zone 2  │ 🟡 Amber / Warning Gold   │ Expansion Overage    │ Metered Rate Incurred │ Evaluate Crossover│
│         │ (#f59e0b / #fbbf24)       │ (Uncommitted Nodes)  │ ($40–$60 / node / mo) │ Upgrade to Next T │
├─────────┼───────────────────────────┼──────────────────────┼───────────────────────┼───────────────────┤
│ Zone 3  │ 🔴 Crimson / Rose Red     │ Hard Ceiling         │ Out of Compliance     │ Immediate Upgrade │
│         │ (#f43f5e / #ef4444)       │ Breached (Cap Limit) │ Throttling Risk       │ via 1-Click Token │
└─────────┴───────────────────────────┴──────────────────────┴───────────────────────┴───────────────────┘
```

---

## 3. Detailed Color Code Breakdown

### 🟢 Zone 1: Cyan / Emerald — Included Base Capacity
- **Status Code:** `INCLUDED_BASE` / `AVAILABLE`
- **What it Means:** The number of active monitored nodes is within your contract's base pre-paid entitlement.
- **Where it Appears:**
  - Header badge displays green pulse: `[ 🟢 Medium • 71/75 Nodes ↗ ]`.
  - Census modal progress bar shows solid cyan fill.
  - License availability card shows green `Available` badge.
- **Financial Status:** **$0.00 additional charges**. Fully covered under your upfront annual commitment.
- **Customer Action:** None. Your infrastructure is operating within standard contracted limits.

---

### 🟣 Zone 1B: Violet / Purple — Pre-Purchased Overage Pool
- **Status Code:** `PURCHASED_OVERAGE_ACTIVE`
- **What it Means:** Your workload has expanded beyond the standard base nodes, but is covered by a pre-purchased **Overage License Pool** purchased at your negotiated enterprise contract discount.
- **Where it Appears:**
  - Census progress bar shows violet fill (`#a78bfa`).
  - Card 3 displays active pool consumption (e.g., `14 / 20 Pool Used (6 Free)`).
  - Zone badge reads: `Zone 1B: Covered by Purchased Overages`.
- **Financial Status:** **$0.00 unexpected month-end invoices**. You are consuming already-budgeted capacity.
- **Customer Action:** Monitor pool headroom. If free pool seats drop below 3 nodes, consider purchasing an additional buffer pack or stepping up to the next tier.

---

### 🟡 Zone 2: Amber / Warning Gold — Expansion Overage (Pay-As-You-Go)
- **Status Code:** `EXPANSION_OVERAGE` / `DEFICIT_OVERAGE`
- **What it Means:** Monitored nodes exceed your paid capacity (base + purchased pool), but remain below your tier's hard architectural cap. The cluster operates in **Metered Pay-As-You-Go Mode**.
- **Where it Appears:**
  - Header badge switches to warning state with amber counter: `[ 🟡 Small • 25/25 (+6 Overage) ↗ ]`.
  - Navbar badge gains pulsing amber border (`.overage-active`).
  - Census modal displays amber warning badge: `Zone 2: Expansion Overage (+X nodes)`.
  - In-VPC FinOps Card calculates real-time month-to-date uncommitted overage accrual.
- **Financial Status:** Uncommitted overages accrue on a daily basis at your tier's standard rate:
  - `Cluster Small`: **$40.00 / node / month**
  - `Cluster Medium`: **$60.00 / node / month**
  - `Cluster Large`: **$80.00 / node / month**
- **Customer Action:** Check the **Crossover Tip Banner** inside the Census modal. If overages persist for more than 14 days, upgrading to the next tier is mathematically cheaper than paying uncommitted metered rates!

---

### 🔴 Zone 3: Crimson / Rose Red — Hard Ceiling Breached
- **Status Code:** `HARD_CAP_BREACHED`
- **What it Means:** Active nodes exceed the hard contract and architectural maximum of your current tier.
  - `Cluster Small` ceiling: **60 Nodes**
  - `Cluster Medium` ceiling: **150 Nodes**
  - `Cluster Large` ceiling: **400 Nodes**
- **Where it Appears:**
  - Header badge flashes crimson with an animated border pulse (`.breach-active`).
  - Census modal progress bar turns bright crimson (`var(--crimson)`).
  - Availability card displays negative deficit count: `-11 Deficit`.
  - CLI commands display exit warnings: `[HARD CAP BREACHED] Machine capacity limit reached`.
- **Financial & Operational Impact:**
  - **Compliance Risk:** Infrastructure is operating outside valid licensed scope.
  - **Operational Risk:** Nodes beyond the hard cap are throttled from participating in Raft leader consensus.
- **Customer Action:** **Immediate Action Required**. Click the `⚡ Upgrade Tier / Resolve Overages` button or run `dcouplr auth upgrade` to generate a 1-click cryptographic handoff token and step up to the next tier.

---

## 4. UI Indicators Across Interfaces

### 1. In-VPC Telemetry Dashboard Top Navigation Bar
The Segmented Micro-Badge changes dynamically based on the active evaluation:
- Normal (🟢): `[ 🟢 Medium • 71/75 Nodes ↗ ]`
- Saturated (🟢): `[ 🟢 Medium • 75/75 Nodes ↗ ]`
- Overage (🟡): `[ 🟡 Medium • 75/75 (+4) ↗ ]` (amber glow)
- Breached (🔴): `[ 🔴 Small • 60/60 (+11 Cap Breach) ↗ ]` (pulsing crimson alert)

Hovering over the badge reveals the complete tooltip audit string without opening any modal:
> `Commercial Active • Cluster Medium: 71/75 Nodes Monitored (4 Available). Click to inspect active node census or manage license.`

### 2. CLI Terminal Health Output
Operators running headless clusters can inspect status via CLI:

```bash
$ dcouplr auth status
```
```text
======================================================================
              <dcouplr/> LICENSE & INSTALLATION CENSUS
======================================================================
Organization:      Acme Global Financial Corp
Tier:              Cluster Medium (75 Base Nodes)
Active Workload:   71 Monitored Nodes / Agents
Licensed Capacity: 75 Paid Seats
Available Margin:  4 Seats Available [ZONE 1: INCLUDED BASE] (GREEN)
Monthly Billing:   $3,500.00 / month (Annual Commitment)
Overages:          0 Uncommitted Nodes ($0.00)
Hardware Lease:    seat-a984f18c2910d8a1 (Verified Local Zero-Egress)
Contract Health:   COMPLIANT (100% INCLUDED)
======================================================================
```

If overages occur:
```text
Available Margin:  -6 Deficit [ZONE 2: EXPANSION OVERAGE] (AMBER)
Monthly Billing:   $1,500.00 Base + $240.00 Overage = $1,740.00 / mo
Contract Health:   ACTION RECOMMENDED: Upgrade to Cluster Medium saves $100/mo
```

---

## 5. FinOps Crossover Math & Self-Remediation

When your cluster enters **Zone 2 (Amber)** or **Zone 3 (Crimson)**, `<dcouplr/>`'s in-VPC daemon automatically runs a **FinOps Crossover Calculation** to protect you from runaway costs:

### Case Study: 71 Active Nodes
- **On Cluster Small (25 Base Nodes):**
  - Base fee: $1,500 / mo
  - Overages: 46 extra nodes. Max Small overage cap is +35 nodes ($1,400/mo).
  - Total cost on Small: $3,600 / mo ($43,200 / yr).
  - **Penalty:** Leaves 11 nodes in **Zone 3 (Crimson Hard Breach)**, throttled and unlicensed.
- **On Cluster Medium (75 Base Nodes):**
  - Flat fee: $3,500 / mo ($42,000 / yr).
  - Overages: 0 nodes.
  - **Savings:** **$100 / month ($1,200 / year savings)**.
  - **Status:** Instantly returns all 71 nodes to **Zone 1 (🟢 Cyan / Green)** with 4 buffer seats and upgrades support to 24x7 P1 SLA.

---

## 6. How Customers Resolve Status Changes

1. **Click the Top Header Badge:** Click `[ 🟡 (+X) ↗ ]` or `[ 🔴 (+X) ↗ ]` on your dashboard.
2. **Review the Census Audit:** Inspect active node counts and see the exact uncommitted deficit.
3. **Click `⚡ Upgrade Tier / Resolve Overages`:**
   - The in-VPC cluster signs an ephemeral HMAC-SHA256 token containing your contract details.
   - Browser opens `https://dcouplr.com/checkout?token=...`.
   - All fields (Company, current tier, target tier, prorated delta) are **pre-filled with zero manual typing**.
4. **Complete Checkout:** Approve via Corporate PO, AWS Marketplace, or Credit Card.
5. **Instant Zero-Downtime Reload:** The updated cryptographic license (`dcouplr.lic`) is hot-reloaded into cluster memory in **$<1$ second**. The badge immediately turns **🟢 Green**.
