# 🎯 The Mission
To build a high-fidelity Agentic Credit Decisioning Engine that bridges the "Intelligence Gap" in Indian corporate lending. The system transforms messy, unstructured document dumps into an explainable, audit-ready Credit Appraisal Memo (CAM) within minutes, not weeks.

---

# 🌊 The User Journey (Application Lifecycle)

| Stage | Action | Actor |
|------|------|------|
| I. Intake | Credit Officer uploads GST returns, Bank Statements, Annual Reports, ITRs, and CIBIL reports. | Next.js Frontend |
| II. Ingest | Smart PDF detection routes to Gemini native (digital) or Mistral OCR (scanned); Redis tracks state. | Adaptive Ingestor |
| III. Analyze | Parallel agents perform Financial Analysis, Discrepancy Detection & Secondary Research. | LangGraph + Gemini 2.5 Flash |
| IV. Qualify | Credit Officer adds qualitative field notes (factory visits, management interview observations). | Qualitative Input Portal |
| V. Reconcile | DeepSeek-R1 (via Groq) reasons over all signals with visible chain-of-thought. | Groq + DeepSeek-R1-Distill |
| VI. Output | Credit Officer reviews multi-tabbed CAM with citations and thinking trace, then downloads PDF. | Admin Dashboard |

---

# 🧠 Intelligence Stack (Model & Agent Matrix)

| Agent / Layer | Primary Model | Tool / Framework | Purpose |
|------|------|------|------|
| The Ingestor (Scanned) | mistral-ocr-latest | LlamaParse JSON mode | Scanned Indian PDFs — layout-preserving OCR with table cell structure intact. |
| The Ingestor (Digital) | gemini-2.5-flash | Native PDF bytes | Digital-born PDFs passed directly — skips OCR, saves 3–5s per document. |
| The Accountant | gemini-2.5-flash | Custom TS logic | Indian line items; GSTR-3B vs GSTR-2A match; Bank credit analysis; CMR score. |
| The Scout | gemini-2.5-flash | Tavily site: operators + Apify fallback | e-Courts, MCA, RBI circulars, rating agencies, BSE/NSE shareholding. |
| The Reconciler | deepseek-r1-distill-llama-70b | Groq API + LangGraph | Fast (~800 tok/s) chain-of-thought fraud detection and 5Cs synthesis. |
| The Memory | mem0 + Redis | Upstash Redis | Promoter DNA across applications (mem0) + live pipeline state (Redis Blackboard). |

> **Model Philosophy:** Gemini 2.5 Flash handles 80% of tasks (multimodal, 1M token context, free tier). DeepSeek-R1-Distill on Groq is reserved for final reconciliation — same reasoning quality as full R1, ~26x faster at 800 tokens/sec, free tier at 6K tokens/min.

---

# 🛠️ Step-by-Step Technical Execution

## Step 1: The Adaptive Extraction Pipeline
**Why:** Not all PDFs are equal. A digital ITR from a CA portal needs no OCR. A 200-page scanned balance sheet from a regional bank does. Treating them identically wastes 3–5 seconds per document and degrades table accuracy.

**How:** A lightweight pre-check detects whether the PDF has embedded selectable text:
- **Digital PDF** → Pass raw bytes to Gemini 2.5 Flash (native multimodal). No OCR step.
- **Scanned/image PDF** → Send to Mistral OCR for layout-preserving Markdown. For pages containing tables (Balance Sheets, GST summaries), use **LlamaParse JSON mode** instead of Markdown mode to preserve cell structure.

**State:** Stored in Redis as `extraction_state_{app_id}` so the pipeline resumes on failure without re-processing completed pages.

### Document Types & Extraction Strategy

| Document | Detection | Extraction |
|------|------|------|
| Annual Report (digital) | Embedded text detected | Gemini native PDF |
| Bank Statement (digital) | Embedded text detected | Gemini native PDF |
| Scanned Balance Sheet | Image-only pages | Mistral OCR → LlamaParse JSON (tables) |
| GST Return (PDF portal export) | Embedded text detected | Gemini native PDF |
| ITR (Form ITR-6 / ITR-5) | Embedded text detected | Gemini native PDF |
| CIBIL Commercial Report | Embedded text detected | Gemini native PDF |
| Sanction Letter (scanned) | Image-only pages | Mistral OCR → Markdown |

### Financial Sub-Agents

**Agent: Bank Statement Analyzer**
Extracts monthly debit/credit totals and builds a 12-month cashflow series. Detects:
- Circular transactions (HDFC → ICICI → HDFC within same month)
- Round-trip transfers masking as genuine revenue
- Unexplained large cash withdrawals (> 10% of monthly credits)
- EMI/loan repayments to other lenders (undisclosed debt)
- Average monthly balance vs declared Working Capital requirement

**Agent: GST Analyzer**
Extracts GSTR-3B declared sales and GSTR-2A reconciled purchases. Detects:
- GSTR-3B vs GSTR-2A mismatch (declared output tax vs matched input credits)
- Fake invoice chains (high purchase credits, no matching supplier GSTIN filings)
- Input credit inflation patterns month-over-month
- Nil-filer months followed by sudden high revenue (suppression pattern)

**Agent: ITR & Balance Sheet Parser**
Extracts with full understanding of Indian-specific line items:
- Sundry Debtors / Sundry Creditors (debtor ageing analysis)
- Directors' Remuneration and Directors' Loans
- Related Party Transactions (auto-flag if > 20% of revenue)
- Secured vs Unsecured Loans (lender-wise if disclosed)
- Contingent Liabilities and Capital Work-in-Progress (CWIP)
- Section 8 subsidiary companies in related party list (shell company signal)

**CIBIL CMR Interpretation (Correct Scale)**
CIBIL Commercial reports use the **CMR rank: 1–10** (1 = lowest risk, 10 = highest risk) — distinct from the consumer CIBIL score (300–900). The agent interprets CMR correctly:
- CMR 1–3: Low risk, proceed
- CMR 4–6: Moderate risk, flag for review
- CMR 7–10: High risk, automatic red flag in Character score

> **Indian Context:** Achieved through structured few-shot prompting with real Indian financial examples passed to Gemini 2.5 Flash — not QLoRA fine-tuning.

---

## Step 2: The Parallel Research Loop
**Why:** Risk signals exist outside the submitted documents — in court records, regulatory filings, and news.
**How:** Scout Agent runs 5 parallel Tavily searches and conditionally invokes Apify Actors as enrichment.

### Primary: Tavily site: Operator Searches (always run, no quota risk)

**Search 1 — e-Courts Litigation**
```
site:ecourts.gov.in "{company_name}" OR "{promoter_name}"
site:nclt.gov.in "{company_name}"
```
Returns: case titles, case numbers, court, status. Flags NCLT/DRT/High Court cases.

**Search 2 — MCA Registry (Director via DIN)**
```
site:mca.gov.in "DIN:{din_number}" OR "{company_cin}"
```
DIN-based lookup is more reliable than name-based (avoids false positives on common Indian names). Returns all companies a director has been associated with.

**Search 3 — RBI Circulars & Regulatory Alerts**
```
site:rbi.org.in "{sector_keyword}" circular
"{company_name}" RBI defaulter wilful
```
Directly addresses the evaluation criterion on regulatory intelligence.

**Search 4 — Credit Ratings (CRISIL / ICRA / CARE)**
```
"{company_name}" CRISIL rating 2025 OR 2026
"{company_name}" ICRA rating downgrade
"{company_name}" CARE ratings watch
```
Pulls publicly disclosed ratings and rating actions — free, no API required.

**Search 5 — News, Fraud & Sector Headwinds**
```
"{company_name}" fraud NPA default NCLT 2025
"{promoter_name}" criminal case lookout notice
"{sector}" RBI headwind ban shutdown 2025
```

**Search 6 — Shareholding Pattern (BSE/NSE public disclosures)**
```
site:bseindia.com "{company_name}" shareholding pattern
site:nseindia.com "{company_name}" shareholding
```
Detects promoter pledge, FII/DII changes, and ownership concentration.

### Secondary: Apify Actors (enrichment, not critical path)
Used only when Tavily returns sparse results for a specific source. Apify provides structured scrapes of e-Courts and MCA for detailed case metadata. Not on the critical path — pipeline does not block if Apify quota is exhausted.

### Social Signals (conditional — only if company has web presence)
- LinkedIn: Hiring spike with stagnant revenue → shell company signal
- Website: Organic traffic drop → business under stress

---

## Step 3: The Qualitative Input Portal (Credit Officer Notes)
**Why:** A required judge deliverable. AI cannot replace on-ground observations. Field notes must visibly move the final score.

**How:** After automated analysis, the Credit Officer fills a structured form:

| Category | Example Input |
|------|------|
| Factory / Operations | "Plant operating at 40% capacity. 3 of 5 machines idle." |
| Management Quality | "Promoter evasive on related-party questions during interview." |
| Collateral Inspection | "Mortgaged property valuation appears overstated by ~20%." |
| Customer Relationships | "Top 3 customers confirmed orders for next 2 quarters." |
| Industry Context | "Sector facing raw material shortage due to new import duty." |

Each note maps to a 5C dimension. DeepSeek-R1 receives them as labeled context. The final CAM shows `[Credit Officer Note]` citations inline so judges see exactly how qualitative input shifted the score.

---

## Step 4: The Discrepancy Engine
**Why:** Circular trading and revenue inflation hide across document boundaries — no single document reveals the full picture.
**How:** All extracted signals are loaded into a structured comparison table before DeepSeek-R1 reasons over them.

### Multi-Source Triangulation

| Discrepancy Check | Threshold | Signal |
|------|------|------|
| GSTR-3B Sales vs Bank Credits (monthly series) | > 15% average variance | Revenue inflation |
| GSTR-3B declared vs GSTR-2A matched ITC | > 10% mismatch | Fake invoice chain |
| ITR net profit trend vs Bank closing balance trend | Opposite directions | Balance sheet manipulation |
| CIBIL CMR rank vs repayment behavior in bank stmt | CMR 7+ with clean repayments | Hidden defaults elsewhere |
| Related Party Transactions as % of revenue | > 20% | Circular trading |
| Nil-filer GST months vs bank activity | Bank active, GST nil | Suppression |
| Section 8 entities in related party list | Any | Shell company risk |

### Redis Blackboard — Confidence Signaling
Each agent publishes to Redis before the Reconciler reads:
```
redis.hset(`signals:{app_id}`, {
  gst_revenue_monthly: "[10.2, 9.8, 11.1, ...]",  gst_confidence: 0.92,
  bank_credits_monthly: "[6.1, 5.9, 6.8, ...]",   bank_confidence: 0.88,
  itr_profit:          "2.1Cr",                    itr_confidence: 0.85,
  cmr_rank:            "4",                         cibil_confidence: 0.95,
  ecourts_cases:       "[{case_no, status}]",       scout_confidence: 0.91
})
```

Confidence < 0.75 → data point marked **"Unverified — Manual Check Required"** in CAM.
Confidence ≥ 0.75 + discrepancy > threshold → `FRAUD_CHECK` appended to `research_signals`.

---

## Step 5: The Explainable Synthesis & CAM Generation

### DeepSeek-R1 Thinking Chain — Visible to Judges
DeepSeek-R1 (via Groq) produces `<think>...</think>` tokens before its answer. We **capture and surface** this reasoning chain in the UI as a collapsible **"View AI Reasoning"** panel. This is the single most powerful explainability feature: judges can literally read the model thinking through contradictions, weighing evidence, and arriving at a conclusion. No other system in the room will be able to show this.

### 5Cs Scoring Output
Each C scores 0–100, rated Strong / Adequate / Weak / Red Flag, with contrastive explanation and citations:

> **Character: 35/100 — Red Flag**
> Active NCLT Case #2024/Mumbai/1842 found via e-Courts (scraped 2026-03-07) — fund diversion allegation against promoter from prior entity. CRISIL downgrade to BB- in Jan 2026. [Scout Agent, Confidence: 0.91]

> **Capacity: 58/100 — Weak**
> GSTR-3B shows 18% YoY revenue growth, but bank credits show only 11% — 7% monthly average gap across 8/12 months. Credit Officer note: factory at 40% capacity. Capacity score adjusted down by 12 points. [Accountant Agent + Credit Officer Note]

> **Capital: 78/100 — Strong**
> Net Worth ₹22Cr vs requested ₹8Cr exposure. D/E at 1.4x, within acceptable range. No undisclosed loans found in bank statement EMI analysis. [ITR Parser, Confidence: 0.89]

> **Collateral: 65/100 — Adequate**
> Mortgaged property registered on MCA Charges. Credit Officer flagged valuation overstated ~20%. Adjusted collateral coverage: 1.3x (threshold: 1.25x, marginal). [MCA Search + Credit Officer Note]

> **Conditions: 70/100 — Adequate**
> Sector facing raw material headwind (new import duty, RBI circular RBI/2025-26/87). 3 of top 5 customers confirmed orders per Credit Officer. Sector tail-risk present but manageable. [Scout Agent + Credit Officer Note]

### Final Loan Recommendation
```json
{
  "decision": "CONDITIONAL_APPROVE",
  "recommended_amount": "₹5Cr",
  "recommended_rate": "Prime + 2.5% (13.5% effective)",
  "original_ask": "₹8Cr",
  "reduction_rationale": "Reduced from ₹8Cr: Character flag (active NCLT + CRISIL downgrade) and Capacity gap (GST vs Bank 7% avg). Full ask reconsidered on NCLT resolution.",
  "conditions": [
    "Personal guarantee from all promoters (DIN verified)",
    "Quarterly GSTR-3B + bank statement submission",
    "CIBIL CMR re-check at 6 months",
    "Site inspection every 6 months"
  ]
}
```

### CAM PDF Download (`@react-pdf/renderer`)
- Executive Summary with decision, recommended terms, and 5Cs radar chart
- Per-5C section: score, rating, contrastive explanation, source citations
- Discrepancy table: monthly GST vs Bank vs ITR bar chart (visual, not just numbers)
- Research findings: e-Courts cases, MCA status, CRISIL rating, RBI circulars, news
- Shareholding pattern summary
- Credit Officer notes (clearly labeled, per category)
- AI Reasoning trace (DeepSeek-R1 thinking chain summary)
- Full audit trail: agent name, data source, timestamp, confidence per data point

---

# 🏗️ Infrastructure & State Handling

| Layer | Technology | Purpose |
|------|------|------|
| Pipeline State | Redis (Upstash) | `extraction_state_{app_id}` — per-agent completion flags; resume on failure |
| Agent Blackboard | Redis (Upstash) | Confidence board; real-time SSE progress feed to frontend |
| Entity Memory | mem0 | Promoter DNA — surfaces history across applications by PAN/DIN |
| Primary Database | Neon (Postgres) | Applications, metrics, signals, qualitative notes, decisions, audit trail |
| Vector Search | pgvector (on Neon) | CAM benchmarking against historical cases; no separate vector DB needed |
| Workflow Engine | LangGraph | Cyclic orchestration: parallel extraction, conditional re-dispatch, qualitative gate |
| Inference (fast) | Groq API | DeepSeek-R1-Distill-Llama-70B at ~800 tok/s — synthesis in <15s |

### Redis Blackboard Architecture
Each agent writes to a Redis hash keyed by `app_id`. Frontend polls via SSE for live progress. Reconciler reads all keys atomically before synthesis. If any agent fails, its key is absent — Reconciler marks that dimension "Unverified" rather than crashing.

### mem0 Promoter DNA
Persistent entity profiles keyed by PAN / DIN. When a new application arrives with a known promoter, mem0 surfaces:
- All prior applications and outcomes
- Historical fraud signals or litigation matches
- Prior CMR scores and trajectory
- Board and company restructuring history

---

# ⚡ Agent Orchestration (LangGraph)

```
[PDF Type Detector]
    → digital → [Gemini Native Reader]
    → scanned → [Mistral OCR] → [LlamaParse JSON (tables)]
    → both paths → [Dispatcher Agent]
        → parallel fork →
            [Bank Agent] [GST Agent] [ITR/BS Agent] [Scout Agent (6 Tavily searches)]
        → join → Redis Blackboard populated
[Qualitative Input Gate] (Credit Officer fills form)
    →
[Reconciler Node] (DeepSeek-R1 via Groq)
    → <think> chain captured →
    → conditional:
        missing_critical_data → back to [Scout Agent]
        complete → [CAM Generator]
[CAM Generator] → PDF render + Neon write + mem0 update
```

---

# 📊 Explainability in the UI

| Element | Implementation |
|------|------|
| Source chip | `[Mistral OCR p.42]` `[Tavily: e-Courts]` `[Credit Officer Note]` on every data point |
| Confidence badge | Green ≥ 0.85 / Amber 0.70–0.84 / Red < 0.70 |
| Hover tooltip | Raw OCR snippet or scraped text that produced the value |
| Monthly bar chart | GST declared vs Bank credits, 12-month side-by-side — discrepancy visible instantly |
| 5Cs radar chart | Visual score overview alongside contrastive text |
| AI Reasoning panel | Collapsible `<think>` chain from DeepSeek-R1 — judges can read every step |
| Discrepancy table | All 7 checks with threshold, actual value, verdict |

---

# ✅ Evaluation Criteria — Final Self-Assessment

| Criterion | Score | Evidence |
|------|------|------|
| **Extraction Accuracy** | **9/10** | Adaptive routing (Gemini native for digital, Mistral OCR for scanned). LlamaParse JSON mode for tables. Separate agents per document type with Indian-specific prompts. |
| **Research Depth** | **9/10** | 6 parallel Tavily searches covering e-Courts, MCA (DIN-based), RBI circulars, CRISIL/ICRA/CARE ratings, BSE/NSE shareholding, news. Apify as enrichment. No single point of API failure. |
| **Explainability** | **10/10** | Source chip + confidence badge + hover tooltip on every number. Monthly discrepancy chart. 5Cs radar chart. DeepSeek-R1 thinking chain surfaced in collapsible UI panel. Every qualitative note cited by category. |
| **Indian Context Sensitivity** | **10/10** | CIBIL CMR 1–10 rank (not consumer 300–900). GSTR-3B vs GSTR-2A mismatch engine. DIN-based director lookup. Section 8 shell company detection. RBI circular search. CRISIL/ICRA rating pulls. Nil-filer GST suppression pattern. Indian line items (Sundry Debtors, CWIP, Directors' Loans). |

---

# ✅ Success Metrics

| Metric | Target |
|------|------|
| TAT | < 5 minutes from upload to downloadable CAM |
| Source Coverage | Every data point has source chip + confidence badge |
| Discrepancy Detection | 7-check triangulation: GST vs Bank vs ITR, monthly granularity |
| Research Sources | e-Courts, MCA (DIN), RBI, CRISIL/ICRA/CARE, BSE/NSE, News — all via Tavily |
| Indian Context | CMR 1–10, GSTR-2A vs 3B, DIN lookup, Section 8 detection, nil-filer detection |
| Qualitative Integration | Notes explicitly cited in 5Cs with score delta shown |
| CAM Output | Downloadable PDF with reasoning chain, charts, and full audit trail |
| Hallucination Guard | Low confidence (< 0.75) marked "Unverified" — never fabricated |
