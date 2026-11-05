# Master Engineering Runbook: Dual-Database Document Governance, Sovereign IP Demarcation, and Customer In-VPC Publication Checklist

**Document ID:** `RUN-DOC-GOVERNANCE-001`  
**Revision:** 1.0.0 (Enterprise Document Demarcation & Release Gate Protocol)  
**Classification:** Enterprise System Architecture, IP Demarcation & Sovereign Data Governance  
**Target Audience:** Chief Information Security Officers (CISO), Enterprise Legal Counsel, Principal Systems Architects, SRE Directors, DevOps Platform Leads  
**Canonical Wordmark Standard:** `<dcouplr/>`  
**Last Updated:** November 2026  

---

## Executive Summary & Boundary Invariant

A foundational security and commercial architecture principle of the <span class="dcouplr-wordmark"><span class="dcouplr-bracket">&lt;</span><span class="dcouplr-text">dcouplr</span><span class="dcouplr-bracket">/&gt;</span></span> platform is the **Dual-Database Sovereign Demarcation Protocol**:

1. **Vendor Control Plane Database (`dcouplr_central_db`):**
   By default, **ALL** platform documentation, master engineering blueprints, commercial pricing strategies, gross margin calculations, patent packages, and operational runbooks are authored, indexed, and stored inside the central vendor database (`dcouplr_central_db`) and managed via the `/admin` portal.
2. **Customer Sovereign Database (`dcouplr_customer_db`):**
   The customer in-VPC database (`data/vpc_telemetry.db`) is the physical Single Source of Truth for runtime telemetry, node censuses, and operational runbooks. **Documents NEVER enter the customer database by accident.**
3. **The Sovereign Publication Checklist Gate:**
   A document only gets copied/syndicated from `dcouplr_central_db` into `dcouplr_customer_db` when it explicitly passes a formal **4-Point Security & IP Clearance Checklist**.

```
══════════════════════════════════════════════════════════════════════════════════════════════════════
                                DUAL-DATABASE DOCUMENT ARCHITECTURE & SYNC GATE
══════════════════════════════════════════════════════════════════════════════════════════════════════
                                                  │
                 ┌────────────────────────────────┴────────────────────────────────┐
                 ▼                                                                 ▼
      DATABASE 1: CENTRAL DB                                            DATABASE 2: CUSTOMER IN-VPC DB
      (`dcouplr_central_db`)                                               (`dcouplr_customer_db`)
  Vendor Master Knowledge Vault                                     Sovereign Customer Operations SSOT
  Default Home of ALL Documents                                     Contains Cleared Runbooks ONLY
 ────────────────────────────────                                  ───────────────────────────────────────────
 • Master Commercial Pricing Strategies                            • Monitored Node Census Registry
 • Financial Models & Gross Margins                                • 7-Tier Full-Stack Invariant Matrix
 • Proprietary AST Transpiler Blueprints                           • Approved SRE Operational Runbooks
 • `beyond_vpc_cloud_services_...`                                 • Telemetry Ingestion Configurations
 • Day-0 Blank Slate: PRESERVED PERMANENTLY                        • Day-0 Blank Slate: 0 Customer Nodes
                 │                                                                 ▲
                 │                     4-POINT PUBLICATION CHECKLIST               │
                 └───────────────────▶ [1] Zero Vendor IP & Margin Disclosure ─────┘
                                       [2] Zero-WAN Egress Invariant ($0.00)
                                       [3] Scrubbed Internal Secrets & Staging URLs
                                       [4] Customer SRE Operational Actionability
══════════════════════════════════════════════════════════════════════════════════════════════════════
```

---

## Part I: Clarification on Database Profiles vs. Document Availability

A common operational question arises when switching database profiles:
> *"When I reset or switch the database to Production Ready (Day-0 Blank Slate), why did it seem like documents in `/admin` were missing?"*

### The Architectural Explanation:
1. **Scope of Day-0 Blank Slate:**
   The Day-0 Blank Slate profile operates exclusively on **Customer Workload Telemetry** within `dcouplr_customer_db` (`data/vpc_telemetry_prod.db`). It purges customer nodes (`nodes`), customer networks (`vpcs`), and discovered software stacks (`node_technologies`), leaving a clean slate ready for fresh infrastructure onboarding.
2. **Where Documents Truly Belong:**
   Enterprise administrative documents and dossiers belong to **`dcouplr_central_db`** (the vendor knowledge vault). Switching the customer telemetry profile to Day-0 **does not and must not alter central administrative documentation**.
3. **Root Cause of Missing Document:**
   Previously, document entries were defined in static code arrays without full alias resolution. When searching for `beyond_vpc_cloud_services_architecture_and_pricing_strategy.md`, the file existed under a slightly different title and had not been formally mapped in the registry.

---

## Part II: The 4-Point Sovereign Publication Checklist Gate

Every document registered in `dcouplr_central_db` carries a formal publication classification:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             DOCUMENT CLASSIFICATION & DEMARCATION TIERS                          │
├──────────────────────────┬─────────────────────────────┬─────────────────────────────────────────┤
│ Classification Level     │ Database Tenancy            │ Example Documents                       │
├──────────────────────────┼─────────────────────────────┼─────────────────────────────────────────┤
│ `INTERNAL_CONFIDENTIAL`  │ `dcouplr_central_db` ONLY   │ • Commercial Pricing Strategies         │
│ (Vendor Proprietary IP)  │ (Never copied to customer)  │ • Customer Support Gross Margin Models  │
│                          │                             │ • Beyond-VPC Pricing Strategy           │
│                          │                             │ • USPTO Provisional Patent Dossiers     │
├──────────────────────────┼─────────────────────────────┼─────────────────────────────────────────┤
│ `RESTRICTED_COMMERCIAL`  │ `dcouplr_central_db` ONLY   │ • Multi-Vendor FinOps ROI Benchmarks    │
│ (Pre-Sales & Execs Only) │ (Vendor / Exec Review)      │ • Modular Observability Pricing Matrix  │
├──────────────────────────┼─────────────────────────────┼─────────────────────────────────────────┤
│ `CLEARED_CUSTOMER_PUBLIC`│ Syndicated & Copied to      │ • SRE Self-Troubleshooting Click Guide  │
│ (Customer In-VPC Ready)  │ `dcouplr_customer_db`       │ • 7-Tier Full-Stack Metrics Catalog     │
│                          │                             │ • In-VPC Logs & Traces Observability    │
│                          │                             │ • Customer Release & Update Lifecycle   │
└──────────────────────────┴─────────────────────────────┴─────────────────────────────────────────┘
```

### The 4 Mandatory Clearance Checks

| Check Item | Description | Pass Criteria |
| :--- | :--- | :--- |
| **Check 1: Zero Vendor IP & Margin Disclosure** | Verifies that the document contains no proprietary margins, pricing discount algorithms, patent claims, or internal COGS spreadsheets. | Must contain **zero** confidential financial data. |
| **Check 2: Zero-WAN Egress Invariant ($0.00)** | Verifies that all architecture, code samples, and scripts operate entirely within the customer private network without public internet dependencies. | Public WAN egress must be **$0.00**. |
| **Check 3: Scrubbed Secrets & Staging URLs** | Verifies that internal vendor endpoints (`*.dcouplr.internal`), developer tokens, test credentials, and private IPs are removed. | Zero internal vendor credentials. |
| **Check 4: Customer SRE Actionability** | Verifies that the document provides concrete, executable operational runbooks, troubleshooting steps, or architectural clarity for customer SREs. | Directly useful for day-to-day operations. |

---

## Part III: Case Study — `beyond_vpc_cloud_services_architecture_and_pricing_strategy.md`

### Document Review:
* **Title:** Beyond-VPC Cloud Services Observability Architecture & Commercial Pricing Strategy
* **Classification:** `INTERNAL_CONFIDENTIAL` (Vendor Proprietary IP)
* **Checklist Evaluation:**
  - Check 1 (Zero Margin/Pricing Disclosure): **FAIL** — Document outlines commercial add-on pricing ($12k–$36k/yr), competitive margin analysis vs. Datadog, and discounting strategy.
  - Check 2 (Zero-WAN Egress): **PASS** — Beyond-VPC collection uses AWS PrivateLink and GCP Private Google Access.
  - Check 3 (Scrubbed Secrets): **PASS** — Generic cloud architectural references.
  - Check 4 (Customer Actionability): **PASS** — Valuable technical architecture for cloud platforms.
* **Demarcation Determination:**  
  Because Check 1 fails, this document **STAYS IN `dcouplr_central_db`**. It is accessible inside the authenticated `/admin` portal for vendor administrators and executives, but is strictly prohibited from being copied to `dcouplr_customer_db` or bundled into customer release tarballs.

---

## Part IV: Operational API Reference for Document Demarcation

The following endpoints govern the dual-database document lifecycle:

| Endpoint | HTTP Method | Description |
| :--- | :--- | :--- |
| `/v1/database/central/documents` | `GET` | Lists all master documents in `dcouplr_central_db` with their classification and checklist status |
| `/v1/database/central/documents/{doc_id}/checklist` | `GET` | Returns the 4-point publication checklist state for a specific document |
| `/v1/database/central/documents/{doc_id}/approve` | `POST` | Marks all 4 checklist items as verified and syncs/copies the document to `dcouplr_customer_db` |
| `/v1/database/customer/documents` | `GET` | Lists only the approved, customer-accessible operational documents inside the customer's in-VPC SSOT |

---

## Summary of Guarantees

1. **All Knowledge in Central DB:** `dcouplr_central_db` is the perpetual master repository for all documentation, pricing models, and runbooks.
2. **Zero Inadvertent Leaks:** Proprietary pricing strategies (`beyond_vpc...`, margin financials) stay in Central DB and are never copied to customer VPCs.
3. **Deterministic Promotion:** Only documents that explicitly pass the 4-point checklist are copied over to `dcouplr_customer_db` for customer engineers to use.
4. **Resilient Document Access:** Documents in `/admin` remain accessible regardless of whether customer telemetry is in Demo mode or Production Day-0 Blank Slate.

