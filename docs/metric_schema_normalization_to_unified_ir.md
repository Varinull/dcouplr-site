# 📖 Technical Reference Guide: Metric Schema Normalization to Unified IR

This manual details how to map raw, non-standard metric configurations from proprietary telemetry systems into the vendor-agnostic Unified Intermediate Representation (IR) schema.

---

## 1. Structural Schema Transposition Matrix

To maintain an $O(1)$ scaling architecture, third-party source variables must map directly into the central `MetricAttributes` properties block.

| Source Platform Component | Normalization Rule | Unified IR Target Position |
| :--- | :--- | :--- |
| **Metric String Name** | Drop dots and special hyphens; convert format to lower-snake case. | `resources[].attributes.metric_name` |
| **Aggregation Modifiers** | Map vendor terms onto fixed enumeration strings (`SUM`, `AVG`, `MAX`). | `resources[].attributes.aggregation` |
| **Evaluation Timeframe** | Compute duration markers explicitly down to raw total seconds. | `resources[].attributes.window_seconds` |
| **Tag Filters Array** | Parse relational query logic down to flat `Key / Operator / Value` arrays. | `resources[].attributes.filters` |

---

## 2. Step-by-Step Translation Logic & Code Implementation

### Step 1: Normalize the Ingested Metric Signature
Proprietary formats frequently allow nested spaces or invalid characters. Strip special character anomalies immediately using snake-case transformations:
```text
Source Name:   "Application-Layer.Core.Compute-Latency"
Unified IR:    "application_layer_core_compute_latency"
```

### Step 2: Extract Relational Evaluation Filters
Convert conditional target groups (e.g., matching a cluster region or specific environment tier) out of proprietary text syntax blocks and format them as distinct key-value logic rows:
```json
// Example: Translating 'env:production,region:us-east-1' tag strings
"filters": [
  { "key": "env", "operator": "EQ", "value": "production" },
  { "key": "region", "operator": "EQ", "value": "us-east-1" }
]
```

### Step 3: Map Mathematical Aggregations
Remap vendor-specific metric functions to standard equivalent definitions in the destination matrix (e.g., mapping a rolling five-minute check constraint straight into a standard `AVG` token window):
```json
"aggregation": "AVG",
"window_seconds": 300
```

---

## 3. Mathematical Parity & Context-Free Invariance Proof

Let $\mathcal{M}_{\text{source}}$ denote the vendor telemetry query space and $\mathcal{M}_{\text{target}}$ denote standard PromQL range expressions. The normalization mapping $\Phi: \mathcal{M}_{\text{source}} \to \text{UIT-IR}$ guarantees equivalence:

$$\Phi(q_{\text{vendor}}) \equiv \Psi(\text{PromQL})$$

Where filters $\bigwedge_{i=1}^k (k_i = v_i)$ are preserved context-free with zero semantic query drift.
