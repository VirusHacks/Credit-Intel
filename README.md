# Credit-Intel

AI-native credit appraisal engine for Indian corporate lending — from raw PDFs to an explainable Credit Appraisal Memo (CAM) in minutes.

---

## 🔍 Problem We’re Solving

Credit officers spend days reconciling GST, ITR, bank statements, CIBIL, annual reports, and on-ground notes, often missing fraud patterns and early warning signals.

**We answer three questions:**

1. Should we lend?
2. How much and on what terms?
3. Why — with transparent, auditable reasoning?

---

## 🎯 What Credit-Intel Does

- Ingests messy multi-format PDFs (GST, ITR, bank statements, CIBIL, annual reports).
- Runs specialist agents for each document type plus a web research “Scout”.
- Lets officers add qualitative notes (visits, interviews, collateral checks).
- Reconciles everything into 5Cs scores and a downloadable CAM with reasoning trace.

---

## 🧠 Key Features at a Glance

- **Adaptive PDF ingestion**: Smart routing of digital vs scanned docs (LLM-native vs OCR + structured parsing).
- **Specialist financial agents**: Bank, GST, ITR/BS, CIBIL CMR, and Research agents tuned for Indian context.
- **Research Scout**: Targeted crawls over Indian public data (courts, MCA, exchanges, ratings, news).
- **Qual + Quant fusion**: Officer notes explicitly move 5Cs scores with visible deltas.
- **Explainable 5Cs**: Character, Capacity, Capital, Collateral, Conditions with evidence and confidence.
- **CAM + Chat**: Generated CAM PDF plus an interactive chat over the entire case context.


## ⚙️ End-to-End Flow

<details>
<summary><strong>Click to expand pipeline steps</strong></summary>

### 1. Upload & classify

- Officer uploads GST, ITR, bank statements, CIBIL, annual reports.
- PDF Type Detector routes:
  - Digital → Gemini native PDF ingestion.
  - Scanned → Mistral OCR + LlamaParse JSON extraction.

### 2. Agentic analysis

Parallel agents:

- Bank agent → cashflows, EMIs, circular flows.
- GST agent → 3B vs 2A, fake invoices, nil-filer behavior.
- ITR/BS agent → Indian line items, related parties, leverage.
- CIBIL CMR agent → commercial rank interpretation.
- Scout agent → courts, MCA, exchanges, ratings, news.

### 3. Qualitative capture

- Officer records visits, interviews, collateral, references.
- Notes are mapped to specific 5Cs dimensions.

### 4. Reconciliation

Reconciler model reads:

- Agent signals (Redis + Postgres),
- Qualitative notes,
- Promoter history (mem0).

Produces:

- 5Cs scores (0–100),
- Lend / not-lend recommendation,
- Conditions & covenants,
- Full reasoning trace.

### 5. Output & review

- CAM PDF generated and stored.
- UI shows:
  - 5Cs radar, discrepancies, evidence chips, reasoning panel.
- Chat interface lets officers interrogate the decision.

</details>

---

## 🧩 Intelligence Stack

| Layer           | What It Uses                       | What It Does                                   |
|----------------|-------------------------------------|-----------------------------------------------|
| Ingestion      | Gemini, Mistral OCR, LlamaParse     | Robust extraction from digital/scanned PDFs   |
| Analysis Agents| Gemini-based domain prompts         | Bank, GST, ITR/BS, CIBIL, Research            |
| Orchestration  | LangGraph + Redis blackboard        | Parallel agents, resilient workflows          |
| Reconciliation | Gemini / DeepSeek-R1 on Groq        | 5Cs scoring, decision, reasoning chain        |
| Memory         | Postgres + mem0 + pgvector          | Promoter history & CAM retrieval              |
| Presentation   | Next.js, Tailwind, charts, React PDF| Dashboard, explainability, CAM PDF, chat      |

---

## 💡 Key Design Decisions

### India-first design

- 5Cs tuned to Indian corporate lending, not generic consumer scores.
- Handles GSTR-3B vs 2A, CIBIL CMR 1–10, DIN-based promoter views, Section 8 entities.

### Adaptive extraction, not blind OCR

- Digital PDFs go to LLM-native ingestion for speed and fidelity.
- Only truly scanned pages use OCR + structured parsing for better tables.

### Agentic, not monolithic

- Separate agents per document/source keep prompts focused and easier to audit.
- Redis blackboard allows partial failures without breaking the whole pipeline.

### Explainability by design

Every metric has:

- Source chips,
- Confidence badges,
- Snippets,
- Explicit score deltas when officer notes override model priors.

### Promoter DNA memory

- mem0 tracks promoters across entities to surface historical red flags automatically.

---

## 🚀 Why This Is Better Than Typical Baselines

- **Deeper extraction**: Preserves multi-year tables and Indian financial structures instead of flattening PDFs to plain text.
- **Broader signals**: Combines documents, public data, and on-ground notes — not just one PDF and one LLM call.
- **Regulatory-grade transparency**: 5Cs, discrepancies, reasoning trace, and interrogable CAM chat instead of opaque “High / Medium / Low”.
- **Operational realism**: Pipeline state, retries, promoter memory, audit trail — built like something a bank could actually pilot.

---

## 🛠️ Tech Stack

### Frontend

- Next.js (App Router), React
- TypeScript
- Tailwind CSS, Radix UI, custom design system
- Recharts / custom charts
- `@react-pdf/renderer` for CAM PDFs

### Backend & Infra

- LangGraph (agent orchestration)
- Drizzle ORM + Neon Postgres (+ pgvector)
- Upstash Redis (pipeline + blackboard)
- mem0 (long-term promoter memory)
- Blob storage for documents and CAMs

### AI & Parsing

- Gemini 2.5 Flash (analysis, reasoning, chat)
- DeepSeek-R1 / Llama via Groq (optional reconciliation)
- Mistral OCR
- LlamaParse / LlamaIndex
- Tavily + (optional) Apify for focused web research

---

## 🧪 Getting Started (High-Level)


```bash
# 1. Install dependencies
pnpm install

# 2. Set environment variables (LLM keys, DB URLs, Redis, mem0, Tavily, etc.)

# 3. Run database migrations
pnpm drizzle:push

# 4. Start dev server
pnpm dev
```

## ✅ In One Line

Credit-Intel turns messy, India-specific credit data into an explainable, production-grade CAM pipeline that judges can trust today and banks can realistically pilot tomorrow.
