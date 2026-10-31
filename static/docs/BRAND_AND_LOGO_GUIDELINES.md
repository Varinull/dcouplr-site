# 🎨 <dcouplr/>: Official Brand, Logo & Wordmark Guidelines

**Document Identifier:** `VA-BRAND-001`  
**Category:** Brand Architecture, Visual Identity & Design System Specification  
**System Title:** `<dcouplr/>`: The Hermetic Zero-Egress AST & Telemetry Transpiler  
**Approved Baseline:** Version 1.0.0 (October 2026)  
**Classification:** Enterprise Engineering, Product & UI Design Standard  
**Maintainers:** Core Architecture Board, Product Experience Team, Design System Guild  

---

## 1. Executive Summary & Brand Identity

The official brand identity and trademark for the hermetic zero-egress transpiler is **`<dcouplr/>`** (spoken aloud as *"decoupler"*).

The wordmark encapsulates the core engineering thesis of the product:
1. **Self-Closing XML/JSX Syntax (`< ... />`):** Represents deterministic compiler grammars, AST syntax trees, and self-contained execution isolated within volatile memory.
2. **Hermetic Isolation & Decoupling:** Communicates liberation from proprietary vendor lock-in (Datadog, AWS, Dynatrace) and elimination of punitive cloud data egress taxation.
3. **Electric Neon-Lime Accent:** Symbolizes real-time terminal runtime speed, active AST telemetry, and memory-safe container perimeters.

> [!IMPORTANT]
> ### Canonical Wording Rule
> All references to the brand across documentation, user interfaces, Swagger/OpenAPI documentation, presentations, and terminal outputs MUST use the official wordmark **`<dcouplr/>`**.  
> **Anti-Pattern Prohibited:** Never write `DCOUPLR` in all caps or in parentheses like `dcouplr (DCOUPLR)`. The name is exclusively `<dcouplr/>`.

---

## 2. Wordmark Anatomy & Visual Construction

The `<dcouplr/>` wordmark is an integrated hybrid component consisting of two typography layers:

```
           ┌── Monospace Font (Weight 800)
           │   Color: #39ff14 (Neon Lime)
           │
         ┌─┴─┐                     ┌───┴───┐
         │ < │   d c o u p l r     │  / >  │
         └───┘   └──────┬──────┘   └───────┘
                        │
                        └── Sans-Serif Font (Weight 700/800)
                            Color: #ffffff (Dark) / #000000 (Light)
                            Letter-spacing: -0.04em (-0.8px)
```

### Component Breakdown
| Segment | Content | Font Family | Font Weight | Letter Spacing | Color (Dark Mode) | Color (Light Mode) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Opening Bracket** | `<` | `'JetBrains Mono', 'Fira Code', 'SF Mono', monospace` | `800` (ExtraBold) | `-1px` | `#39ff14` (Neon-Lime) | `#16a34a` (Emerald Green) |
| **Word Text** | `dcouplr` | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | `700`–`800` | `-0.04em` (`-0.8px`) | `#ffffff` (Pure White) | `#000000` (Pure Black) |
| **Closing Bracket** | `/>` | `'JetBrains Mono', 'Fira Code', 'SF Mono', monospace` | `800` (ExtraBold) | `-1px` | `#39ff14` (Neon-Lime) | `#16a34a` (Emerald Green) |

* **Inner Horizontal Margins:** A precise margin of `1.5px` separates the opening `<` bracket from the `d`, and the `r` from the closing `/>` slash-bracket.
* **Vertical Alignment:** Brackets and text share a synchronized `line-height: 1` baseline.

---

## 3. Official Color System & Palettes

The color palette is calibrated for high-contrast accessibility (WCAG 2.1 Level AAA) across terminal emulators, dark IDEs, web browsers, and printed dossiers.

### 3.1 Dark Mode (Primary Digital Surface)
Dark mode represents the native VPC void / terminal environment.

| Token | Hex / CSS Value | RGB | Purpose / Application |
| :--- | :--- | :--- | :--- |
| **`--dcouplr-bracket-neon`** | `#39ff14` | `rgb(57, 255, 20)` | Opening `<` and closing `/>` brackets; glow aura |
| **`--dcouplr-text-white`** | `#ffffff` | `rgb(255, 255, 255)` | `dcouplr` word text |
| **`--dcouplr-glow-shadow`** | `rgba(57, 255, 20, 0.55)` | `rgba(57, 255, 20, 0.55)` | Radial neon text-shadow blur: `0 0 12px rgba(57, 255, 20, 0.55)` |
| **`--bg-primary` (Void)** | `#0a0d14` | `rgb(10, 13, 20)` | Global background deep obsidian surface |
| **`--bg-secondary`** | `#111622` | `rgb(17, 22, 34)` | Secondary panel & container surface |
| **`--bg-glass` (Card)** | `rgba(18, 24, 38, 0.85)` | `rgba(18, 24, 38, 0.85)` | Elevated glassmorphic card / modal background |
| **`--accent-cyan`** | `#06b6d4` | `rgb(6, 182, 212)` | Hot-path telemetry metrics, AST badges |
| **`--accent-indigo`** | `#6366f1` | `rgb(99, 102, 241)` | Brand pills, primary CTA accents, subtle glow aura |
| **`--accent-emerald`** | `#10b981` | `rgb(16, 185, 129)` | Mathematical parity status, healthy consensus indicator |

### 3.2 Light Mode & Print Substrates
For white paper executive decks, PDF dossiers, and light operating systems.

| Token | Hex Value | RGB | Purpose / Application |
| :--- | :--- | :--- | :--- |
| **`--dcouplr-bracket-print`** | `#16a34a` | `rgb(22, 163, 74)` | High-contrast emerald green brackets on white paper |
| **`--dcouplr-text-print`** | `#000000` | `rgb(0, 0, 0)` | Crisp black font on light background |
| **`--dcouplr-surface-light`** | `#ffffff` | `rgb(255, 255, 255)` | Pure white print sheet |

---

## 4. Size & Hierarchy Matrix

| Usage Context | Container / Component | Word Font Size | Bracket Font Size | Bracket Glow |
| :--- | :--- | :--- | :--- | :--- |
| **Inline Prose / Tag** | `.dcouplr-brand-tag` | `0.9em` | `1.05em` | `0 0 6px rgba(57, 255, 20, 0.4)` |
| **Header Navigation** | `.site-header .dcouplr-logo` | `1.2rem` (19px) | `1.35rem` (22px) | `0 0 10px rgba(57, 255, 20, 0.45)` |
| **Swagger UI Hero** | `.dcouplr-swagger-banner .title-logo`| `2.2rem` (35px) | `2.4rem` (38px) | `0 0 16px rgba(57, 255, 20, 0.65)` |
| **Presentation Cover** | `.cover-hero .dcouplr-logo` | `2.5rem` (40px) | `2.8rem` (45px) | `0 0 20px rgba(57, 255, 20, 0.65)` |

---

## 5. Implementation Code Snippets

### 5.1 Standard HTML & CSS Component

```html
<div class="dcouplr-logo" title="<dcouplr/>">
  <span class="dcouplr-bracket">&lt;</span><span class="dcouplr-text">dcouplr</span><span class="dcouplr-bracket">/&gt;</span>
</div>
```

```css
/* Canonical <dcouplr/> CSS Definition */
.dcouplr-logo {
  display: inline-flex;
  align-items: center;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0;
  margin: 0;
  user-select: none;
  line-height: 1;
  text-decoration: none;
}

.dcouplr-logo .dcouplr-bracket {
  color: #39ff14; /* Electric Neon-Lime Green */
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
  font-weight: 800;
  line-height: 1;
  text-shadow: 0 0 12px rgba(57, 255, 20, 0.55), 0 0 2px #39ff14;
  letter-spacing: -1px;
}

.dcouplr-logo .dcouplr-text {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  margin: 0 1.5px;
  color: #ffffff;
  text-shadow: 0 1px 8px rgba(255, 255, 255, 0.2);
}

/* Print & Light Mode Override */
@media print, (prefers-color-scheme: light) {
  .dcouplr-logo .dcouplr-bracket {
    color: #16a34a !important;
    text-shadow: none !important;
  }
  .dcouplr-logo .dcouplr-text {
    color: #000000 !important;
    text-shadow: none !important;
  }
}
```

### 5.2 Inline Markdown / Document Prose Component

For markdown or document bodies where standard inline HTML is rendered:
```html
<span style="color:#39ff14;font-family:monospace;font-weight:800;">&lt;</span><strong style="color:#ffffff;">dcouplr</strong><span style="color:#39ff14;font-family:monospace;font-weight:800;">/&gt;</span>
```

### 5.3 Vector SVG Asset (`dcouplr-logo.svg`)

The repository includes pre-built production vector assets in `migration_tools/api/static/`:
* `dcouplr-logo.svg`: Adaptive responsive SVG supporting dark/light mode via `@media (prefers-color-scheme)`.
* `dcouplr-logo-white.svg`: Transparent background, white text, `#39ff14` neon brackets.
* `dcouplr-logo-black.svg`: Transparent background, black text, `#16a34a` emerald brackets.
* `favicon.svg`: Micro-scale icon formatted for browser tabs and mobile bookmarks.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 215 48" fill="none">
  <style>
    .bracket { fill: #39ff14; font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace; font-weight: 800; font-size: 38px; }
    .wordmark { fill: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif; font-weight: 700; font-size: 33px; letter-spacing: -0.8px; }
    @media (prefers-color-scheme: light) {
      .wordmark { fill: #000000; }
      .bracket { fill: #16a34a; }
    }
  </style>
  <text x="2" y="35" class="bracket">&lt;</text>
  <text x="34" y="35" class="wordmark">dcouplr</text>
  <text x="160" y="35" class="bracket">/&gt;</text>
</svg>
```

---

## 6. Brand Usage Guidelines: Do's and Don'ts

| Rule | Practice | Example |
| :--- | :--- | :--- |
| **DO** | Always write `<dcouplr/>` in lowercase with opening and closing brackets. | `<dcouplr/>` |
| **DO** | Apply `#39ff14` neon green on brackets in dark interfaces. | `<span style="color:#39ff14">&lt;</span>dcouplr<span style="color:#39ff14">/&gt;</span>` |
| **DO** | Use monospace typography for brackets and geometric sans-serif for `dcouplr`. | JetBrains Mono + Inter |
| **DO** | Retain standard CLI binary names in terminal blocks (e.g. `pip install dcouplr`). | `pip install dcouplr` |
| **DON'T** | Never capitalize in all-caps: `DCOUPLR`. | ❌ ~~DCOUPLR~~ |
| **DON'T** | Never omit the brackets in brand prose: `dcouplr`. | ❌ ~~dcouplr is a tool~~ &rarr; `<dcouplr/> is a tool` |
| **DON'T** | Never omit the closing slash: `<dcouplr>`. | ❌ ~~<dcouplr>~~ |
| **DON'T** | Never capitalize the first letter: `<Dcouplr/>`. | ❌ ~~<Dcouplr/>~~ |
| **DON'T** | Never color the letters green: the letters MUST remain white or black. | ❌ ~~<span style="color:#39ff14">&lt;dcouplr/&gt;</span>~~ |

---

## 7. Document Registration & Governance History

| Revision | Date | Author / Role | Changes / Scope | Approval Gate |
| :--- | :--- | :--- | :--- | :--- |
| **v1.0.0** | 2026-10-22 | Design System Lead & Principal SRE | Formalized `<dcouplr/>` wordmark standard, hex color palette, typography specifications, and brand violation rules across all UI endpoints and documentation. | Approved Baseline |
