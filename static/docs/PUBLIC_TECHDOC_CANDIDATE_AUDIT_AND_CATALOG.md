# 📑 <dcouplr/>: Public Technical Documentation Candidate Audit & Classification Catalog

**Document ID:** AUDIT-TECHDOC-PUBLIC-001  
**Category:** Governance, Developer Enablement & Public Documentation Strategy  
**Target Entities:** Principal Architects, Lead Maintainers, Corporate Legal, Product Operations  
**Framework Alignment:** ITIL Service Transition & SDLC Developer Enablement Policy  
**Status:** Staged for Administrative Review (Admin Vault Exclusive)  
**Security Mandate:** In-Place Audit Only. Zero relocation or modification of existing Admin Vault assets.  
**Audit Date:** October 2026  

---

## 1. Executive Context & Objective

The **`<dcouplr/>`** repository maintains over 190 internal specifications, governance dossiers, financial projections, and operational runbooks indexed inside the passcode-protected **Technical Documentation Vault** (`/docs`). 

To accelerate adoption across platform engineering, DevOps, and cloud architecture teams, high-value technical guides—such as the user manuals, syntax specifications, and migration recipes—need to be made publicly accessible under **TechDoc**. 

### Core Operating Principles for Public TechDoc Release
1. **Zero Movement of Originals:** All primary source documents remain intact and immutable inside their current repository locations (`docs/`, `ProjectAssistant/`, `recipes/`).
2. **Selective Public Copies:** Approved documents will be copied or mapped to a public Technical Documentation shelf (`/techdoc` or public viewer), leaving the Admin Vault strictly gated for administrative operations.
3. **Strict Intellectual Property & Confidentiality Boundary:** Financial models, venture underwriting briefs, customer pipeline ledgers, internal salary data, and M&A strategies remain locked inside the Admin Vault behind administrative authentication.

---

## 2. Master Document Classification Matrix

Below is the complete classification of documents evaluated for public release under **TechDoc**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PUBLIC TECHDOC CLASSIFICATION OVERVIEW                          │
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
│ TIER 1: Core User &      │ TIER 2: Turnkey          │ TIER 3: Architecture &           │
│         Engineer Manuals │         Migration Recipes│         System Specifications    │
│ • Field Manual           │ • Datadog to Grafana 11  │ • Unified IR Whitepaper          │
│ • Enterprise Reference   │ • AWS to OpenTofu GCP    │ • API Security & RBAC Spec       │
│ • Local Build Guides     │ • PromQL Standardization │ • 4-Vector E2E Spec              │
├──────────────────────────┴──────────────────────────┴──────────────────────────────────┤
│ TIER 4: SRE Runbooks & Operational Field Manuals                                       │
│ • High-Throughput OTel Tuning • SPIFFE Socket Debugging • P1 Incident Response         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ TIER 5: Customer Trust, Zero-Exfiltration Privacy Notice & Open-Core Terms             │
│ • Zero-Exfiltration Privacy Notice • Terms of Service • v1.0.0 Release Notes           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 🔒 RESTRICTED PERIMETER (MUST STAY IN ADMIN VAULT ONLY - DO NOT PUBLISH)               │
│ • Financial Models • Pitch Decks • Customer Pipeline CSV • Hiring Salaries • M&A      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Recommended Candidates for Public TechDoc Release

### Tier 1: Core User & Engineer Manuals *(Highest Priority — Essential for Adoption)*

| Document Title & Path | Identifier | Content Summary | Why Make Public Under TechDoc |
| :--- | :--- | :--- | :--- |
| **[`docs/ENGINEER_USER_MANUAL.md`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/ENGINEER_USER_MANUAL.md)** | `VA-MAN-ENG-001` | 3-minute quickstarts (Web Studio, CLI, `curl`), Datadog-to-Prometheus cookbook scenarios, Terraform-to-OpenTofu cookbook, troubleshooting, FAQ, and everyday cheat sheet. | **Crucial.** This is the primary hands-on developer guide that empowers engineers to immediately use `<dcouplr/>`. |
| **[`docs/FOOLPROOF_ENTERPRISE_REFERENCE_MANUAL.md`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/FOOLPROOF_ENTERPRISE_REFERENCE_MANUAL.md)** | `VA-MAN-FOOLPROOF-001` | Complete function-by-function reference (Python & Go), EBNF syntax grammars, AST data models, and 7 verification auditor checklists. | **Crucial.** Provides the definitive technical blueprint needed by enterprise architects, SRE leads, and tech evaluators. |
| **[`docs/guide_to_initial_local_compilation.md`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/guide_to_initial_local_compilation.md)** | `GUIDE-INIT-COMP` | Quick developer guide to cloning the repo and executing local AST transpilation passes. | Eliminates onboarding friction for open-source contributors and local testers. |
| **[`docs/step_by_step_go_codebase_compilation_guide.md`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/step_by_step_go_codebase_compilation_guide.md)** | `GUIDE-GO-BUILD` | Instructions for compiling the Go distroless binaries, Protobuf stubs, and running race detector tests. | Practical field guide for systems engineers deploying the compiled Go binary. |

---

### Tier 2: Turnkey Migration Recipes *(Actionable Step-by-Step Playbooks)*

| Document Title & Path | Identifier | Content Summary | Why Make Public Under TechDoc |
| :--- | :--- | :--- | :--- |
| **[`recipes/datadog_to_grafana11/README.md`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/recipes/datadog_to_grafana11/README.md)** | `RECIPE-DD-GRAFANA11-001` | Step-by-step workflow to extract Datadog monitor JSON, transpile locally, and load into Grafana 11 Unified Alerting. | The #1 requested enterprise migration path; immediately demonstrates cost savings. |
| **[`recipes/cloudformation_to_opentofu_gcp/README.md`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/recipes/cloudformation_to_opentofu_gcp/README.md)** | `RECIPE-AWS-GCP-TOFU-002` | Converting AWS CloudFormation / Terraform HCL into Google Cloud OpenTofu HCL with zero network egress. | Proves cross-cloud Infrastructure as Code portability with working code samples. |
| **[`recipes/promql_standardization_azure_arc_anthos/README.md`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/recipes/promql_standardization_azure_arc_anthos/README.md)** | `RECIPE-PROMQL-STANDARDIZATION-003` | Normalizing multi-cloud alerts into standard PromQL for Azure Arc & Google Cloud Anthos managed Prometheus. | High utility for hybrid-cloud enterprise platform teams. |

---

### Tier 3: Technical Specifications & Whitepapers *(Architectural Legitimacy)*

| Document Title & Path | Identifier | Content Summary | Why Make Public Under TechDoc |
| :--- | :--- | :--- | :--- |
| **[`docs/technical_whitepaper_unified_ir.md`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/technical_whitepaper_unified_ir.md)** | `WHITE-UIT-IR-001` | Mathematical normalization theorems, algebraic AST mappings, and dual-winged compiler theory. | Proves that `<dcouplr/>` is a deterministic compiler, distinguishing it from hallucinating AI translators. |
| **[`docs/API_SECURITY_AND_RBAC_SPECIFICATION.md`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/API_SECURITY_AND_RBAC_SPECIFICATION.md)** | `SPEC-SEC-RBAC-001` | Role permissions matrix (`SYSTEM_ADMIN`, `INFRA_ARCHITECT`, `VIEWER`), `X-API-Key` & `X-Tenant-ID` header specifications, mTLS protocols. | Required by InfoSec and compliance teams during enterprise security assessments. |
| **[`docs/enterprise_4vector_e2e_verification_and_hyperscaler_specification.md`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/enterprise_4vector_e2e_verification_and_hyperscaler_specification.md)** | `SPEC-4VEC-VERIF-001` | Fuzzing test methodologies, socket isolation assertions, and continuous matrix verification proofs. | Demonstrates the automated test rigor (214 passing test vectors) backing the platform. |
| **[`docs/COMPETITIVE_ANALYSIS_AND_STRATEGIC_VALUE_PROPOSITION.md`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/COMPETITIVE_ANALYSIS_AND_STRATEGIC_VALUE_PROPOSITION.md)** | `STRAT-COMP-VALUE-001` | Comparison against Datadog, New Relic, Dynatrace, Splunk, Elastic, Grafana, and PagerDuty with the 10x value proposition. | Educates technical buyers on why in-VPC compilation beats multi-tenant SaaS. |
| **[`docs/FEATURE_MATURITY_AND_PRODUCTION_READINESS_AUDIT.md`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/FEATURE_MATURITY_AND_PRODUCTION_READINESS_AUDIT.md)** | `AUDIT-PROD-READINESS-001` | Honest capability status scorecard, simulated vs. live components, and production roadmap. | Builds long-term trust by being transparent about current vs. planned features. |

---

### Tier 4: SRE Runbooks & Diagnostics *(Operational Field Procedures)*

| Document Title & Path | Identifier | Content Summary | Why Make Public Under TechDoc |
| :--- | :--- | :--- | :--- |
| **[`docs/runbooks/RUNBOOK-OTEL-HIGH-THROUGHPUT-BENCHMARK.md`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/runbooks/RUNBOOK-OTEL-HIGH-THROUGHPUT-BENCHMARK.md)** | `RUNBOOK-OTEL-001` | In-VPC OpenTelemetry collector buffer sizing, CPU pinning, and memory tuning under 50,000 metrics/second load. | Invaluable reference for SREs tuning high-throughput telemetry pipelines. |
| **[`docs/debugging_spiffe_workload_socket_connections.md`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/debugging_spiffe_workload_socket_connections.md)** | `FIELD-SPIFFE-001` | Troubleshooting mTLS socket attestation failures and SPIRE agent connection issues. | Hands-on field troubleshooting guide for zero-trust Kubernetes clusters. |
| **[`docs/runbooks/RUNBOOK-DECOUPLER-P1-009.md`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/runbooks/RUNBOOK-DECOUPLER-P1-009.md)** | `RUNBOOK-P1-009` | Asymmetric network partition drills, circuit breaker trip states, and automatic self-healing. | Demonstrates production resilience and fault-tolerant operational runbooks. |

---

### Tier 5: Customer Trust, Privacy & License *(Public Assurance)*

| Document Title & Path | Identifier | Content Summary | Why Make Public Under TechDoc |
| :--- | :--- | :--- | :--- |
| **[`ProjectAssistant/customers/01-privacy-notice.md`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/ProjectAssistant/customers/01-privacy-notice.md)** | `del-customer-privacy` | Legal and technical confirmation that all AST parsing happens strictly in volatile RAM with zero WAN egress. | Essential for customer legal & compliance approval (GDPR, HIPAA, SOC 2). |
| **[`ProjectAssistant/customers/02-terms.md`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/ProjectAssistant/customers/02-terms.md)** | `del-customer-terms` | Apache 2.0 dual-licensing terms and commercial enterprise cluster node bracket boundaries. | Transparent licensing terms for both open-core and enterprise users. |
| **[`docs/open_core_v1_release_notes.md`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/open_core_v1_release_notes.md)** | `REL-NOTES-V1` | Changelog, supported AST constructs, and release highlights for v1.0.0. | Standard software release record for external developers. |

---

## 4. 🔒 Restricted Perimeter: Confidential Assets (MUST REMAIN IN ADMIN VAULT ONLY)

The following documents contain sensitive financial models, investor communications, customer pipeline data, internal salaries, and acquisition strategies. **These documents must remain strictly protected inside the Admin Vault behind administrative authentication and must NEVER be published to TechDoc:**

| Restricted File Name | Sensitivity Category | Why It Must Remain Private |
| :--- | :--- | :--- |
| `docs/18_month_arr_and_customer_pilot_projections.md` | Commercial / Financial | Contains forward-looking revenue projections ($600K $\to$ $1.48M ARR), pilot pricing models, and private valuation calculations. |
| `docs/seed_stage_venture_underwriting_brief.md` | Venture / Investor | Contains confidential institutional underwriting terms, cap table models, and capital efficiency ratios. |
| `docs/seed_stage_pitch_deck.md` | Fundraising / Investor | Proprietary investor narrative, slide-by-slide pitch structure, and fundraising strategy. |
| `docs/seed_stage_financial_model.md` | Commercial / Financial | Detailed P&L projections, 92% gross margin mathematical model, and COGS breakdown. |
| `docs/seed_stage_financial_worksheet.csv` | Commercial / Financial | Raw spreadsheet formula matrix for internal financial modeling. |
| `docs/seed_stage_customer_acquisition_pipeline.csv` | Commercial / CRM | Real design partner names, enterprise pilot stages, and projected Annual Contract Value (ACV) targets. |
| `docs/seed_stage_monetization_plan.md` | Commercial Strategy | Enterprise monetization strategy, licensing brackets, and sales cycle velocity models. |
| `docs/seed_stage_capital_efficiency_thesis.md` | Investor Strategy | Burn multiple targets, capital efficiency benchmarks, and venture syndicate strategy. |
| `docs/seed_stage_executive_summary.md` | Investor Briefing | Confidential executive investment summary for institutional venture capital partners. |
| `docs/seed_stage_3year_technical_hiring_model.csv` / `.md` | HR / Compensation | Private engineering salaries, equity grants, and headcount hiring timeline. |
| `docs/hyperscaler_strategic_value_and_mna_thesis.md` | M&A Strategy | Confidential strategic acquisition positioning targeting AWS, Microsoft, and Google corporate development teams. |
| `docs/investor_due_diligence_simulation.md` | Investor Due Diligence | Simulated Tier-1 VC partner interrogations across 12 defense vectors. |
| `docs/enterprise_sow_template.md` | Commercial Legal | Internal contract templates and commercial pricing terms. |
| `docs/executive_sow_and_cost_matrix.md` | Commercial Pricing | Internal customer pricing formulas and discount authorization matrices. |
| `ProjectAssistant/governance/` | Corporate Governance | Executive sign-off authorities, Change Advisory Board voting records, and delivery audit certificates. |

---

## 5. Technical Delivery Mechanism for Public TechDoc

Once you review and select the desired candidates from Tiers 1 through 5, `<dcouplr/>` will implement the public documentation shelf using the following zero-disruption architecture:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PUBLIC TECHDOC DELIVERY ARCHITECTURE                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Original Document Remains in Admin Vault:                                           │
│    • docs/ENGINEER_USER_MANUAL.md (Accessible via /docs)           │
│                                                                                        │
│ 2. Public Read-Only Endpoint (/v1/techdoc/documents):                                  │
│    • Unauthenticated, rate-limited public endpoint serving only approved documents.   │
│                                                                                        │
│ 3. Dedicated Public TechDoc Viewer (/techdoc):                                         │
│    • Clean, distraction-free markdown documentation viewer with searchable sidebar.    │
│    • Clicking "TechDoc" on the landing page header links directly to /techdoc.         │
│                                                                                        │
│ 4. Zero Egress & Cache Efficiency:                                                     │
│    • Public documents cached in memory, zero external network calls, fast 304 caching. │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Administrative Approval & Selection Checklist

Review the candidate list below and mark the documents to approve for public release:

### Tier 1: User & Engineer Manuals
- [ ] `docs/ENGINEER_USER_MANUAL.md` (`VA-MAN-ENG-001`) — Practical Field Manual & Quickstart Guide
- [ ] `docs/FOOLPROOF_ENTERPRISE_REFERENCE_MANUAL.md` (`VA-MAN-FOOLPROOF-001`) — Complete Enterprise Reference Manual
- [ ] `docs/guide_to_initial_local_compilation.md` — Local AST Compilation Guide
- [ ] `docs/step_by_step_go_codebase_compilation_guide.md` — Go Codebase Build & Compilation Guide

### Tier 2: Migration Recipes
- [ ] `recipes/datadog_to_grafana11/README.md` — Datadog to Grafana 11 Unified Alerting Recipe
- [ ] `recipes/cloudformation_to_opentofu_gcp/README.md` — AWS to OpenTofu GCP Infrastructure Recipe
- [ ] `recipes/promql_standardization_azure_arc_anthos/README.md` — PromQL Standardization Recipe

### Tier 3: Technical Specifications & Whitepapers
- [ ] `docs/technical_whitepaper_unified_ir.md` — Unified Intermediate Representation Whitepaper
- [ ] `docs/API_SECURITY_AND_RBAC_SPECIFICATION.md` — API Security & RBAC Specification
- [ ] `docs/enterprise_4vector_e2e_verification_and_hyperscaler_specification.md` — 4-Vector Verification Spec
- [ ] `docs/COMPETITIVE_ANALYSIS_AND_STRATEGIC_VALUE_PROPOSITION.md` — Competitive Landscape & Market Strategy
- [ ] `docs/FEATURE_MATURITY_AND_PRODUCTION_READINESS_AUDIT.md` — Feature Maturity & Production Audit

### Tier 4: SRE Runbooks & Diagnostics
- [ ] `docs/runbooks/RUNBOOK-OTEL-HIGH-THROUGHPUT-BENCHMARK.md` — OpenTelemetry Collector Tuning Runbook
- [ ] `docs/debugging_spiffe_workload_socket_connections.md` — SPIFFE Workload Socket Debugging Guide
- [ ] `docs/runbooks/RUNBOOK-DECOUPLER-P1-009.md` — P1 Incident Response Runbook

### Tier 5: Customer Trust & Legal
- [ ] `ProjectAssistant/customers/01-privacy-notice.md` — Enterprise Zero-Exfiltration Privacy Notice
- [ ] `ProjectAssistant/customers/02-terms.md` — Open-Core & Commercial Terms of Service
- [ ] `docs/open_core_v1_release_notes.md` — Version 1.0.0 Release Notes
