# 🏆 Evaluation Breakdown — Intelli-Credit

> This document is structured for PPT slides and pitch delivery. Each section maps to one evaluation criterion with: the judge's question, our answer, the technical proof, a demo moment, and the one-liner for slides.

---

## Overall Scorecard

| Criterion | Score | One-Line Verdict |
|------|------|------|
| Extraction Accuracy | **9/10** | Adaptive dual-path extraction — right tool for every PDF type |
| Research Depth | **9/10** | 6 parallel live searches across every Indian public data source |
| Explainability | **10/10** | The only system where you can read the AI thinking in real time |
| Indian Context Sensitivity | **10/10** | Built by people who know the difference between CMR and CIBIL |

---

---

# 📄 Criterion 1: Extraction Accuracy

## Judge's Question
> "How well does the tool extract data from messy, scanned Indian-context PDFs?"

---

## The Problem We Solved
Standard OCR treats all PDFs the same. In practice, Indian corporate documents span a wide spectrum:
- A CA-exported ITR is a clean digital PDF with embedded text
- A 200-page scanned balance sheet from a regional co-operative bank is a photo with noise, handwritten annotations, and merged table cells
- Running OCR on a clean PDF wastes 3–5 seconds and often breaks table structure

We solved this with **Adaptive PDF Routing** — the first decision the pipeline makes is about the document itself, not the content.

---

## Our Technical Answer

### Dual-Path Ingestor
```
PDF uploaded
    ↓
[Embedded text check]
    ├── YES (digital PDF) → Gemini 2.5 Flash native multimodal reader
    │                        No OCR step. Faster. No table structure loss.
    └── NO (scanned/image) → Mistral OCR (layout-preserving Markdown)
                               ↓
                              [Table page detected?]
                               ├── YES → LlamaParse JSON mode (cell-level structure)
                               └── NO  → Markdown chunking (narrative text)
```

### Why This Matters for Judges
- **Mistral OCR** is specifically trained for degraded document quality — not a generic OCR engine
- **LlamaParse JSON mode** preserves merged cells in Balance Sheet tables — critical for multi-year comparative data (FY23 / FY24 / FY25 side-by-side)
- **Gemini 2.5 Flash** has a 1M token context window and reads PDF bytes natively — an entire 200-page Annual Report in one call

### Document Coverage
| Document | Indian-Specific Challenge | Our Handling |
|------|------|------|
| Scanned Balance Sheet | Merged cells, regional fonts | Mistral OCR + LlamaParse JSON |
| GSTR-3B / GSTR-2A | Multi-table layout, HSN codes | Gemini native or LlamaParse JSON |
| Bank Statement | 12-month format varies by bank | Gemini native + regex normalization |
| ITR-6 / ITR-5 | Government form layout | Gemini native PDF |
| CIBIL CMR Report | Proprietary report format | Gemini native + CMR-specific prompt |
| Sanction Letter (scanned) | Handwritten amounts, rubber stamps | Mistral OCR + confidence flagging |

### Indian-Specific Line Items Recognized
The extraction prompts are written with explicit few-shot examples for:
- Sundry Debtors / Sundry Creditors (with ageing buckets)
- Directors' Remuneration and Directors' Loans
- Capital Work-in-Progress (CWIP) vs Gross Block
- Related Party Transactions (with Section 8 entity detection)
- Contingent Liabilities (off-balance-sheet risk)
- Unsecured Loans from promoters (circular funding signal)

---

## Demo Moment
**Upload a scanned 3-year old balance sheet.** Show the raw PDF on the left. Show the extracted structured JSON on the right — with correct cell values for every row, including merged "Total" rows and sub-schedules. Compare to what raw copy-paste from the PDF gives you.

---

## Slide One-Liner
> "We don't apply one OCR to everything. We detect the document type first, then use the best extraction path — the same way a CA would look at a document differently before deciding how to read it."

---

---

# 🔍 Criterion 2: Research Depth

## Judge's Question
> "Does the engine find relevant local news or regulatory filings that aren't in the provided files?"

---

## The Problem We Solved
Generic web search is useless for Indian credit research. A Google search for "Ravi Industries fraud" returns news articles about 50 different companies. What credit officers actually need is:
- Is this specific company on an NCLT docket?
- Has this specific director's DIN been associated with a struck-off company?
- Did RBI issue a circular affecting this exact sector this year?
- What is this company's current CRISIL rating?

We built **targeted site-scoped searches** — not broad web crawls.

---

## Our Technical Answer

### 6 Parallel Tavily Searches (Always Run — Zero Quota Risk)

| Search | Query Pattern | What It Finds |
|------|------|------|
| **e-Courts Litigation** | `site:ecourts.gov.in "{company}" OR site:nclt.gov.in "{company}"` | Active NCLT, DRT, High Court cases by company name |
| **MCA Director (DIN-based)** | `site:mca.gov.in "DIN:{din}"` | All companies associated with a director — cross-subsidiary history |
| **RBI Regulatory Alerts** | `site:rbi.org.in "{sector}" circular` + `"{company}" RBI defaulter wilful` | Regulatory headwinds, wilful defaulter lists |
| **Credit Ratings** | `"{company}" CRISIL rating 2025` + `ICRA downgrade` + `CARE watch` | Agency ratings and recent rating actions |
| **News & Fraud Signals** | `"{company}" fraud NPA default NCLT 2025` + `"{promoter}" criminal lookout` | Media coverage of financial stress or promoter misconduct |
| **Shareholding Pattern** | `site:bseindia.com "{company}" shareholding` + `site:nseindia.com` | Promoter pledge levels, FII/DII changes, ownership concentration |

### Why DIN-Based MCA Lookup Matters
Name-based searches fail on common Indian names — "Rajesh Sharma" matches thousands of directors. A DIN (Director Identification Number) is unique. We search `site:mca.gov.in "DIN:01234567"` to find every company this director has ever been associated with — including struck-off entities, which are the biggest red flag.

### Apify as Enrichment Layer
When Tavily returns sparse results for e-Courts or MCA (some companies have uncommon names that don't appear in Google's index of these sites), Apify Actors scrape the portals directly for structured data. **Apify is never on the critical path** — the pipeline does not block if Apify quota is exhausted.

### Sources Covered
- Indian e-Courts portal (state + central)
- NCLT case tracker
- MCA21 company registry
- RBI official circulars (rbi.org.in)
- CRISIL, ICRA, CARE Ratings (public disclosures)
- BSE and NSE shareholding disclosures
- News media (The Hindu BusinessLine, Economic Times, Mint, MoneyControl)
- LinkedIn (conditional, via Apify)

---

## Demo Moment
**Take a real Indian company name.** Show the 6 searches running in parallel (visible in the UI as a live feed). Show results appear: an NCLT case with case number, a CRISIL BB- rating, an RBI circular about their sector from 3 months ago. Then show the same data appearing as cited sources in the final CAM.

---

## Slide One-Liner
> "A credit manager spends 3 days manually searching e-Courts, MCA, and rating agency sites. Our Scout Agent does all of it in parallel in under 30 seconds — and it uses DIN numbers, not names, so it never confuses one Rajesh Sharma with another."

---

---

# 🧠 Criterion 3: Explainability

## Judge's Question
> "Can the AI walk the judge through its logic, or is it a black box?"

---

## The Problem We Solved
Most AI credit tools produce a score. They say "Risk: High" with no trail. A credit committee cannot approve a ₹10Cr loan based on a number with no evidence. Regulators require documented reasoning. And at this hackathon, a judge who can't follow the logic will not give full marks.

We built a system where **every single output is traceable, every score is explained, and the AI's own thinking is visible**.

---

## Our Technical Answer

### Layer 1 — Source Attribution on Every Data Point
Every number in the dashboard carries:
- **Source chip:** `[Mistral OCR, p.42]` `[Tavily: e-Courts]` `[Gemini: Bank Stmt]` `[Credit Officer Note]`
- **Confidence badge:** 🟢 ≥ 0.85 / 🟡 0.70–0.84 / 🔴 < 0.70
- **Hover tooltip:** The raw OCR snippet or scraped text that produced the value

### Layer 2 — The Discrepancy Table (7 Checks)
Every cross-document comparison is shown in a structured table:

| Check | Threshold | Actual | Verdict |
|------|------|------|------|
| GSTR-3B Sales vs Bank Credits | > 15% avg variance | 28% | 🔴 FRAUD_CHECK |
| GSTR-3B vs GSTR-2A ITC | > 10% mismatch | 4% | 🟢 PASS |
| ITR profit trend vs Bank balance | Opposite directions | Same direction | 🟢 PASS |
| CIBIL CMR vs bank repayment | CMR 7+ with clean bank | CMR 4, clean | 🟡 WATCH |
| Related Party % of Revenue | > 20% | 34% | 🔴 FLAG |
| Nil-filer GST months | Any with bank activity | 2 months | 🔴 FLAG |
| Section 8 entities in RPT | Any | 1 entity | 🔴 FLAG |

### Layer 3 — 5Cs Contrastive Scoring
Each C is not just a number — it gets a **contrastive explanation**: what supports it, what hurts it, and what the qualitative input changed.

Example:
> **Capacity: 58/100 — Weak**
> Supporting: GSTR-3B revenue growth 18% YoY. Against: Bank credits growing only 11% — 7% monthly average gap across 8 of 12 months. Credit Officer note adjusted score down 12 points: factory at 40% capacity. Without the field note, score was 70/100.

The **score delta from qualitative input is shown explicitly** — judges can see exactly how the Credit Officer's observation moved the number.

### Layer 4 — DeepSeek-R1 Thinking Chain (The Killer Feature)
DeepSeek-R1 produces `<think>...</think>` tokens before its answer. We capture this reasoning trace and surface it in a collapsible **"View AI Reasoning"** panel in the UI.

Example of what judges will see:
```
<think>
The GST revenue shows ₹10.2Cr average monthly but bank credits 
show only ₹6.1Cr — a 40% gap that persists across 8 of 12 months. 
This is not seasonal variation. The consistency of the gap suggests 
systematic revenue inflation in GST filings rather than timing 
differences. The related party transactions at 34% of revenue 
further support a circular trading hypothesis. However, CIBIL CMR 
rank 4 is moderate — the company has been servicing debt. I need 
to weigh the financial fraud signal against the clean repayment 
history. My conclusion: Character is Red Flag due to the RPT 
pattern and the NCLT case, but Capital is not in immediate danger...
</think>
```

**No other system in the room will be able to show this.** This is the AI literally walking the judge through its logic, one sentence at a time.

---

## Demo Moment
**Point to any number in the CAM.** Hover it — show the source tooltip. Click "View AI Reasoning" — show the full thinking chain. Ask the judge: "Which number would you like us to trace back to its source?" Answer any question in real time.

---

## Slide One-Liner
> "We didn't just make an explainable AI. We made an AI that thinks out loud. Every number has a source. Every score has a reason. And the AI's own reasoning chain is one click away — in plain English."

---

---

# 🇮🇳 Criterion 4: Indian Context Sensitivity

## Judge's Question
> "Does it understand India-specific nuances like GSTR-2A vs 3B or CIBIL Commercial reports?"

---

## The Problem We Solved
Generic credit AI is trained on Western financial data. It does not know:
- That GSTR-3B (self-declared) and GSTR-2A (auto-populated from suppliers) are different documents that should match — and a mismatch is a fraud signal
- That CIBIL Commercial uses a 1–10 CMR rank, not the 300–900 consumer score
- That "Sundry Debtors" and "Accounts Receivable" are the same thing
- That a Section 8 company in a Related Party list is a red flag, not a charitable gesture
- That a director with a DIN associated with a struck-off company is a serious risk indicator

We built every layer of this system **for India, not adapted from elsewhere**.

---

## Our Technical Answer

### CIBIL CMR — Getting the Scale Right
Most teams will use CIBIL and assume a "high score is good." They'll be wrong.

| Report Type | Scale | Meaning |
|------|------|------|
| CIBIL Consumer (TUSC) | 300–900 | Higher = Better (individual credit score) |
| **CIBIL Commercial (CMR)** | **1–10** | **Lower = Better** (1 = lowest risk, 10 = highest risk) |

Our system interprets CMR correctly:
- CMR 1–3 → Low risk, proceed
- CMR 4–6 → Moderate, flag for review
- CMR 7–10 → High risk, automatic Character red flag

### GSTR-3B vs GSTR-2A — The Core Fraud Detection
| Field | Source | What It Means |
|------|------|------|
| GSTR-3B | Self-declared by taxpayer | "I am claiming this much input tax credit" |
| GSTR-2A | Auto-populated from suppliers' GSTR-1 | "Your suppliers actually filed this much" |
| **The Gap** | GSTR-3B > GSTR-2A | **Claiming more ITC than suppliers reported — fake invoices** |

A > 10% mismatch triggers our `FAKE_INVOICE_CHAIN` signal. This is a uniquely Indian fraud pattern that regulators actively pursue.

### DIN-Based Director Lookup
- Director Identification Number (DIN) is unique per director in India
- We search MCA by DIN, not by name — eliminating false positives on common names
- We flag directors who have been associated with struck-off or liquidated companies

### Section 8 Company Detection
Section 8 companies (registered under Companies Act as non-profit) are commonly used in India as pass-through entities for related-party fund routing. When one appears in a company's RPT disclosure, we auto-flag it for manual review.

### Nil-Filer GST Suppression Pattern
A company that files NIL returns in 2–3 months but shows active bank transactions in those same months is suppressing income. Common in Indian SME fraud. Our system cross-references GSTR-3B filing status against bank statement activity month-by-month.

### Indian Financial Line Items (in Extraction Prompts)
The Gemini/Mistral prompts include explicit few-shot examples for:
- Sundry Debtors / Sundry Creditors (distinct from Western "Accounts Receivable/Payable")
- Capital Work-in-Progress (CWIP) — a major balance sheet manipulation venue
- Directors' Loans (promoter-to-company lending — common, needs flagging)
- Contingent Liabilities — often hidden risk in Indian SME balance sheets
- Unsecured Loans from promoters (often circular: company lends to promoter, promoter lends back)

### RBI Regulatory Intelligence
The Scout Agent specifically searches `site:rbi.org.in` for sector-relevant circulars. Judges who test with NBFC companies will see RBI NBFC liquidity norms pulled; those testing with textile companies will see relevant import duty circulars.

---

## Demo Moment
**Upload a CIBIL CMR report.** Show the system correctly identifying the CMR rank (not treating it as a 300–900 score). Then upload a GSTR-3B and GSTR-2A for the same company — show the mismatch highlighted in the discrepancy table with the `FAKE_INVOICE_CHAIN` signal.

Ask the judge: "What would a system trained on American data do with a CMR rank of 4?" — it would call it terrible (4 out of 900). We call it moderate risk. That difference is what Indian context sensitivity means.

---

## Slide One-Liner
> "A system trained on American data would see a CIBIL CMR rank of 4 and panic. We know it means moderate risk. Every Indian-specific nuance — GSTR mismatch logic, DIN-based director history, Section 8 shell detection — is built in from the ground up."

---

---

# 🎤 Pitch Flow (5-Minute Presentation Structure)

| Minute | Content | Hook |
|------|------|------|
| 0:00–0:45 | The Problem | "A credit manager today takes 10 days and misses 40% of early warning signals buried in documents. We cut that to 5 minutes with zero missed signals." |
| 0:45–1:30 | The Architecture | Show the LangGraph flow diagram. "6 specialized agents, running in parallel, on the same application, in the same 5 minutes." |
| 1:30–2:30 | Live Demo — Upload | Upload a sample PDF set. Show the live agent activity feed as Redis Blackboard fills up. |
| 2:30–3:30 | Live Demo — CAM | Open the generated CAM. Hover a number for its source tooltip. Click "View AI Reasoning." Read one line of DeepSeek-R1's thinking chain out loud. |
| 3:30–4:15 | Indian Context | Show the GSTR mismatch table. Explain CMR rank. "We built this for India, not adapted from the West." |
| 4:15–5:00 | Close | Show the PDF download. Show the audit trail. "Every decision, every source, every confidence score — fully audit-ready for RBI inspection." |

---

# 🔑 Key Differentiators (Slide Bullets)

1. **Adaptive Extraction** — Smart routing between Gemini native and Mistral OCR based on PDF type. Not one-size-fits-all OCR.
2. **DIN-based Research** — Director lookup by unique ID, not name. Zero false positives.
3. **7-Check Discrepancy Engine** — Monthly-granularity GST vs Bank vs ITR triangulation across all document sources simultaneously.
4. **Visible AI Reasoning** — DeepSeek-R1 thinking chain surfaced in the UI. The AI thinks out loud.
5. **Qualitative Score Delta** — Credit Officer notes don't just annotate the CAM; they visibly move the scores with attribution.
6. **Promoter DNA via mem0** — Cross-application memory: a promoter's history follows them across subsidiaries, just like it should at a real bank.
7. **RBI + CRISIL + CMR** — The only parameters Indian judges will actually test for. All covered, all correct.
