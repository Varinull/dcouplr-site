# 📈 Seed-Stage 3-Year Financial Model Worksheet & Operating Reconciliation

**Company:** DCOUPLR Technologies, Inc. (operating as `<dcouplr/>`)  
**Document ID:** FIN-SEED-WORKSHEET-001  
**Target Round:** $2.5M Seed Institutional Roundtable ($10M–$12M Post-Money)  
**Associated Datasets:**
- Master Model: [`docs/seed_stage_financial_model.md`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/seed_stage_financial_model.md)
- Tabular Worksheet: [`docs/seed_stage_financial_worksheet.csv`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/seed_stage_financial_worksheet.csv)
- 3-Year Technical Hiring Plan: [`docs/seed_stage_3year_technical_hiring_model.csv`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/seed_stage_3year_technical_hiring_model.csv)
- Customer Pipeline: [`docs/seed_stage_customer_acquisition_pipeline.csv`](file:///c:/Users/JenniferCletaLee/.gemini/antigravity-ide/MigrationToolsAPI/docs/seed_stage_customer_acquisition_pipeline.csv)

---

## 1. Spreadsheet Financial Modeling Logic

This financial architecture template provides corporate spreadsheet modeling formulas (`.csv` / `.xlsx` layout) designed to match contract billing goals exactly. It calculates revenue increments using static subscription tiers, completely replacing punitive volumetric math blocks.

### Spreadsheet Formula Matrix

```csv
"Year Index","Small Accounts Count","Medium Accounts Count","Large Accounts Count","Small ARR Formula","Medium ARR Formula","Large ARR Formula","Total ARR Result Formula","Blended Cost of Goods Sold (8% COGS)","Net Gross Margins Result (92%)"
1,15,5,1,"=B2*18000","=C2*45600","=D2*102000","=SUM(E2:G2)","=H2*0.08","=H2-I2"
2,40,18,5,"=B3*18000","=C3*45600","=D3*102000","=SUM(E3:G3)","=H3*0.08","=H3-I3"
3,75,40,17,"=B4*18000","=C4*45600","=D4*102000","=SUM(E4:G4)","=H4*0.08","=H4-I4"
```

---

## 2. Milestone Validation & Operating Reconciliation

To reconstruct this modeling structure inside institutional venture accounting sheets, verify that computed total targets match the strategic multi-year milestones:

### Year 1 (Seed Launch & Validation)
* **Account Tiers:** 15 Small ($270,000) + 5 Medium ($228,000) + 1 Large ($102,000) = **21 Active Accounts**
* **Total ARR:** **$600,000**
* **COGS (8%):** $48,000 (Customer hosts compute; COGS strictly covers support tooling and telemetry attestation keys)
* **Gross Profit (92%):** **$552,000**
* **Headcount:** 6 FTEs (Co-founders, 3 Core Distributed Systems Engineers, 1 DevRel Lead)

### Year 2 (Enterprise Expansion & Series A Transition)
* **Account Tiers:** 40 Small ($720,000) + 18 Medium ($820,800) + 5 Large ($510,000) = **63 Active Accounts**
* **Total ARR:** **$2,050,800** (+241.8% YoY growth)
* **COGS (8%):** $164,064
* **Gross Profit (92%):** **$1,886,736**
* **Operating Milestone:** Cash flow break-even achieved at Month 20 ($2.05M ARR run-rate)
* **Headcount:** 12 FTEs (+Solutions Architect, +Security/Compliance Lead, +2 Go Runtime Engineers)

### Year 3 (Category Scale / Series A Acceleration)
* **Account Tiers:** 75 Small ($1,350,000) + 40 Medium ($1,824,000) + 17 Large ($1,734,000) = **132 Active Accounts**
* **Total ARR:** **$4,884,000** (+138.2% YoY growth)
* **COGS (8%):** $390,720
* **Gross Profit (92%):** **$4,493,280**
* **Headcount:** 19 FTEs (Full enterprise customer success and hyperscaler partner integration teams)

---

## 3. Capital Efficiency & Burn Waterfall

- **Initial Seed Round:** $2,500,000
- **Peak Monthly Burn:** $115,000 / mo (Month 12)
- **Net Runway:** 24 Months
- **Break-Even Point:** Month 20
- **LTV / CAC Ratio:** **13.2x** ($174,800 LTV / $13,200 blended CAC)
- **CAC Payback Period:** **3.4 Months**
