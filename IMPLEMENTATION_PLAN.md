# 🚀 IntelliCredit — Implementation Plan & Progress Tracker

> **Hackathon: IIT Hyderabad — Intelli-Credit Challenge**  
> Living document. Check off tasks as completed. Keep context alive.

---

## 📌 Quick Legend
- `[ ]` Not started  
- `[x]` Done  
- `[~]` In progress  
- `[!]` Blocked / needs decision  

---

## 🗂️ Architecture at a Glance

```
[Credit Officer] 
  → uploads PDFs (Next.js UI)
  → /api/pipeline/run (LangGraph trigger)
      → PDF Type Detector
          ├─ Digital → Gemini 2.5 Flash (native PDF)
          └─ Scanned → Mistral OCR → LlamaParse JSON (tables)
      → Dispatcher → Parallel Fork:
          ├─ Bank Statement Agent  (Gemini)
          ├─ GST Analyzer Agent    (Gemini)
          ├─ ITR/BS Parser Agent   (Gemini)
          ├─ CIBIL CMR Agent       (Gemini)
          └─ Scout Agent           (Tavily × 6 + Apify fallback)
      → Redis Blackboard (confidence signals)
  → Credit Officer adds Qualitative Notes (/applications/[id]/qualify)
  → Reconciler (DeepSeek-R1 via Groq) reads blackboard → <think> trace
  → CAM Generator → PDF download + Neon write + mem0 update
[Admin Dashboard] shows live SSE feed + explainability UI
```

---

## Phase 0 — Dependencies & Environment ✅ / 🔲

### 0.1 Install Missing Packages
```bash
pnpm add groq-sdk @google/generative-ai @upstash/redis @upstash/ratelimit \
         mem0ai @react-pdf/renderer pdf-lib \
         @vercel/blob
pnpm add -D @types/react-pdf
```

**Status checklist:**
- [x] `@mistralai/mistralai` installed  
- [x] `llamaindex`, `@llamaindex/core` installed  
- [x] `@langchain/langgraph` installed  
- [x] `groq-sdk` (v0.37.0) — for DeepSeek-R1 Reconciler  
- [x] `@google/generative-ai` (v0.24.1) — for Gemini 2.5 Flash agents  
- [x] `@upstash/redis` (v1.36.3) — Redis Blackboard + pipeline state  
- [x] `@upstash/ratelimit` (v2.0.8) — rate limiting on ingest API  
- [x] `mem0ai` (v2.2.4) — Promoter DNA memory  
- [x] `pdf-lib` (v1.17.1) — PDF type detection (digital vs scanned)  
- [x] `@react-pdf/renderer` (v4.3.2) — CAM PDF download  
- [x] `@vercel/blob` (v2.3.1) — PDF file storage  
- [x] `tavily` (v1.0.2) — Scout Agent searches  

### 0.2 Environment Variables (`.env.local`)
```env
# Database (already set)
DATABASE_URL=

# AI Models
GEMINI_API_KEY=            # Google AI Studio — free tier, 2.5 Flash
GROQ_API_KEY=              # Groq — DeepSeek-R1-Distill-Llama-70B
MISTRAL_API_KEY=           # Mistral — mistral-ocr-latest
LLAMAPARSE_API_KEY=        # LlamaCloud — LlamaParse JSON mode

# Infrastructure
UPSTASH_REDIS_REST_URL=    # Upstash Redis (Redis Blackboard)
UPSTASH_REDIS_REST_TOKEN=
VERCEL_BLOB_READ_WRITE_TOKEN=  # Blob storage for PDF uploads

# Research
TAVILY_API_KEY=            # Scout Agent searches (free tier: 1000 searches/month)
APIFY_API_TOKEN=           # Apify enrichment (optional / fallback)

# Auth
JWT_SECRET=                # Auth token signing
NEXTAUTH_SECRET=

# mem0
MEM0_API_KEY=              # Promoter DNA (optional — can use local mem0 OSS)
```

**Status checklist:**
- [x] `DATABASE_URL` set  
- [ ] `GEMINI_API_KEY` — **fill in .env.local**  
- [ ] `GROQ_API_KEY` — **fill in .env.local**  
- [x] `MISTRAL_API_KEY` set  
- [ ] `LLAMAPARSE_API_KEY` — **fill in .env.local**  
- [ ] `UPSTASH_REDIS_REST_URL` + `TOKEN` — **fill in .env.local**  
- [ ] `VERCEL_BLOB_READ_WRITE_TOKEN` — **fill in .env.local**  
- [ ] `TAVILY_API_KEY` — **fill in .env.local**  
- [ ] `APIFY_API_TOKEN` — optional, fill when needed  

---

## Phase 1 — Database Schema Extension 🔲

> Extend `lib/db/schema.ts`. Run `pnpm db:push` after.

### New Tables to Add

**1.1 `agent_signals`** — Per-agent extracted data + confidence scores
```ts
// Stores output from each financial agent per application
// Fields: app_id, agent_name, signal_key, signal_value, confidence, raw_snippet, created_at
```

**1.2 `qualitative_notes`** — Credit Officer field observations
```ts
// Fields: app_id, category (factory|management|collateral|customer|industry),
//         note_text, five_c_dimension, created_by, created_at
```

**1.3 `cam_outputs`** — Final CAM results  
```ts
// Fields: app_id, character_score, capacity_score, capital_score,
//         collateral_score, conditions_score, decision (APPROVE|CONDITIONAL|REJECT),
//         recommended_amount, recommended_rate, reduction_rationale,
//         conditions_json, thinking_trace, pdf_blob_url, created_at
```

**1.4 `research_findings`** — Scout Agent results  
```ts
// Fields: app_id, search_type (ecourts|mca|rbi|ratings|news|shareholding),
//         source_url, snippet, relevance_score, scraped_at
```

**1.5 `extraction_states`** — Pipeline resume state (mirrors Redis)
```ts
// Fields: app_id, stage, status (pending|processing|done|failed),
//         started_at, completed_at, error_message
```

**1.6 Extend `applications` table** (India-specific fields):
```ts
// Add: cin, gstin, pan, promoter_din, requested_amount_inr (numeric),
//      cmr_rank, pipeline_status (enum), qualitative_gate_done (bool)
```

**Status checklist:**
- [x] Base schema pushed (users, companies, applications, financials, documents, assessments)  
- [x] `agent_signals` table  
- [x] `qualitative_notes` table  
- [x] `cam_outputs` table  
- [x] `research_findings` table  
- [x] `extraction_states` table  
- [x] India-specific fields on `applications` (cin, gstin, pan, promoter_din, cmr_rank, pipeline_status, qualitative_gate_done)  
- [x] `pnpm db:push` — all changes applied  
- [x] TypeScript types extended in `lib/types.ts`  

---

## Phase 2 — Document Storage & Upload 🔲

### Files to Create/Modify:
- `app/api/documents/upload/route.ts` — Vercel Blob upload endpoint
- `components/forms/document-uploader.tsx` — wire up to real API (currently UI only)

### Upload Flow:
1. Frontend sends PDF via multipart/form-data to `/api/documents/upload`
2. Server validates file type (PDF only), max size 50MB
3. Store in Vercel Blob → get `blobUrl`
4. Insert record into `documents` table with `blobUrl` + `applicationId`
5. Return `{ documentId, blobUrl }` to frontend

**Status checklist:**
- [ ] `/api/documents/upload` route  
- [ ] `document-uploader.tsx` wired to real API  
- [ ] `documents` DB insert after upload  
- [ ] File type & size validation  

---

## Phase 3 — PDF Type Detector + Ingestor 🔲

> **Core Intelligence:** Not all PDFs are equal.

### New Files:
```
lib/
  pipeline/
    pdf-detector.ts        ← detect digital vs scanned using pdf-lib
    ingestor-digital.ts    ← Gemini 2.5 Flash native PDF bytes
    ingestor-scanned.ts    ← Mistral OCR → LlamaParse JSON (tables)
    ingestor.ts            ← orchestrates detection + routing
app/
  api/
    pipeline/
      ingest/route.ts      ← POST: triggers ingestion for a document
```

### Logic:
```
pdf-detector.ts:
  - Load PDF with pdf-lib
  - Count pages with embedded text (page.getTextContent().items.length > 10)
  - If >70% pages have text → DIGITAL
  - Else → SCANNED

ingestor-digital.ts:
  - Read PDF as Buffer → base64
  - Send to Gemini 2.5 Flash with system prompt per document type
  - Return: { extracted_json, confidence, page_count }

ingestor-scanned.ts:
  - Send PDF to Mistral OCR (mistral-ocr-latest)
  - For pages with tables → route to LlamaParse JSON mode
  - Merge results: { markdown_content, table_json, confidence }

ingestor.ts:
  - Run detector, route to correct ingestor
  - Write extraction_state to Redis: `extraction_state:{appId}:{docId}`
  - Return combined extracted data
```

### Redis State Keys:
```
extraction_state:{appId}:{docId} → { status, type, startedAt, completedAt }
pipeline_state:{appId}           → { currentStage, completedAgents: [] }
```

**Status checklist:**
- [ ] `pdf-detector.ts`  
- [ ] `ingestor-digital.ts` (Gemini native)  
- [ ] `ingestor-scanned.ts` (Mistral OCR + LlamaParse)  
- [ ] `ingestor.ts` (orchestrator)  
- [ ] `/api/pipeline/ingest` route  
- [ ] Redis state tracking wired up  
- [ ] Test with a sample digital PDF (bank statement export)  
- [ ] Test with a sample scanned PDF  

---

## Phase 4 — Financial Analysis Agents 🔲

> All agents use **Gemini 2.5 Flash** with Indian-specific few-shot prompts.
> Each outputs `{ data, confidence, rawSnippets }` and writes to Redis + DB.

### New Files:
```
lib/
  agents/
    bank-statement-agent.ts    ← monthly cashflow, circular detection
    gst-agent.ts               ← GSTR-3B vs 2A, fake invoice patterns
    itr-balancesheet-agent.ts  ← Indian line items, related party
    cibil-agent.ts             ← CMR 1-10 interpretation (NOT 300-900!)
    base-agent.ts              ← shared Gemini client + output schema
```

### 4.1 Bank Statement Agent
**Input:** extracted bank statement text/JSON  
**Detects:**
- Monthly `debit_total`, `credit_total` series (12 months)
- Circular transactions (HDFC→ICICI→HDFC same month)
- Large cash withdrawals >10% of credits
- EMI payments to undisclosed lenders
- Average monthly balance vs declared WC requirement

**Output:**
```json
{
  "monthly_credits": [10.2, 9.8, 11.1, ...],
  "monthly_debits": [8.1, 7.9, 9.0, ...],
  "circular_flag": false,
  "undisclosed_emi_lenders": [],
  "avg_monthly_balance": "4.2Cr",
  "confidence": 0.88
}
```

### 4.2 GST Analyzer Agent
**Detects:**
- GSTR-3B declared sales vs GSTR-2A matched ITC (mismatch >10% = fake invoice)
- Input credit inflation month-over-month
- Nil-filer months with bank activity (suppression)
- Monthly `gst_declared_revenue` series

### 4.3 ITR & Balance Sheet Parser
**Indian-specific line items:**
- Sundry Debtors/Creditors ageing
- Directors' Remuneration & Directors' Loans
- Related Party Transactions (flag if >20% of revenue)
- Secured vs Unsecured Loans (lender-wise)
- Contingent Liabilities + CWIP
- Section 8 subsidiaries in related party list (shell signal)

### 4.4 CIBIL CMR Agent
**⚠️ CRITICAL: CMR is 1–10 (1=best), NOT the consumer 300–900 score**
```
CMR 1-3 → Low risk
CMR 4-6 → Moderate risk, flag for review
CMR 7-10 → High risk → auto RED FLAG on Character C
```

### Redis Blackboard Write (all agents):
```ts
redis.hset(`signals:${appId}`, {
  bank_credits_monthly: JSON.stringify(series),
  bank_confidence: 0.88,
  gst_revenue_monthly: JSON.stringify(series),
  gst_confidence: 0.92,
  itr_profit: "2.1Cr",
  itr_confidence: 0.85,
  cmr_rank: "4",
  cibil_confidence: 0.95,
})
```

**Status checklist:**
- [ ] `base-agent.ts` (Gemini client setup)  
- [ ] `bank-statement-agent.ts`  
- [ ] `gst-agent.ts`  
- [ ] `itr-balancesheet-agent.ts`  
- [ ] `cibil-agent.ts`  
- [ ] Redis blackboard write in each agent  
- [ ] `agent_signals` DB insert in each agent  
- [ ] Unit test with mock extracted text  

---

## Phase 5 — Scout Agent (Secondary Research) 🔲

> **6 parallel Tavily searches.** No API quota risk. Runs after financial agents.

### New Files:
```
lib/
  agents/
    scout-agent.ts     ← 6 parallel Tavily searches + Apify fallback
    tavily-client.ts   ← wrapper around Tavily API
```

### 5.1 The 6 Searches (always run):
```ts
const searches = await Promise.all([
  // 1. e-Courts litigation
  tavily.search(`site:ecourts.gov.in "${company}" OR "${promoter}"`),
  tavily.search(`site:nclt.gov.in "${company}"`),
  
  // 2. MCA Registry (DIN-based — more reliable than name)
  tavily.search(`site:mca.gov.in "DIN:${din}" OR "${cin}"`),
  
  // 3. RBI Circulars + defaulter list
  tavily.search(`site:rbi.org.in "${sector}" circular`),
  tavily.search(`"${company}" RBI defaulter wilful`),
  
  // 4. Credit Ratings (CRISIL/ICRA/CARE)
  tavily.search(`"${company}" CRISIL rating 2025 OR 2026`),
  tavily.search(`"${company}" ICRA rating downgrade`),
  
  // 5. Fraud/News/NPA
  tavily.search(`"${company}" fraud NPA default NCLT 2025`),
  tavily.search(`"${promoter}" criminal lookout notice`),
  
  // 6. BSE/NSE Shareholding
  tavily.search(`site:bseindia.com "${company}" shareholding pattern`),
]);
```

### 5.2 Apify Fallback (conditional):
- Triggered only when Tavily returns <2 results for e-Courts or MCA search
- Not on critical path — pipeline does NOT block if quota exhausted

### Output → Redis + DB:
```ts
redis.hset(`signals:${appId}`, {
  ecourts_cases: JSON.stringify(cases),
  scout_confidence: 0.91,
  crisil_rating: "BB-",
  mca_director_history: JSON.stringify(companies),
})
```

**Status checklist:**
- [ ] `tavily-client.ts` wrapper  
- [ ] `scout-agent.ts` with 6 parallel searches  
- [ ] Apify fallback (conditional, non-blocking)  
- [ ] `research_findings` DB insert  
- [ ] Redis blackboard write  
- [ ] Test with a real company name (e.g., "Adani Enterprises")  

---

## Phase 6 — LangGraph Orchestration 🔲

> The brain. Wires all agents together with proper sequencing.

### New Files:
```
lib/
  pipeline/
    graph.ts           ← LangGraph StateGraph definition
    nodes/
      detector-node.ts
      dispatcher-node.ts
      financial-node.ts  (fan-out: bank + gst + itr + cibil in parallel)
      scout-node.ts
      qualitative-gate-node.ts
      reconciler-node.ts
      cam-node.ts
app/
  api/
    pipeline/
      run/route.ts      ← POST {appId} → triggers full pipeline
      status/[id]/route.ts ← GET SSE stream for live progress
```

### Graph Definition:
```ts
const graph = new StateGraph(CreditPipelineState)
  .addNode("detector",      detectorNode)
  .addNode("dispatcher",    dispatcherNode)
  .addNode("bank_agent",    bankAgentNode)
  .addNode("gst_agent",     gstAgentNode)
  .addNode("itr_agent",     itrAgentNode)
  .addNode("cibil_agent",   cibilAgentNode)
  .addNode("scout_agent",   scoutAgentNode)
  .addNode("qual_gate",     qualGateNode)   // waits for human input
  .addNode("reconciler",    reconcilerNode)
  .addNode("cam_generator", camGeneratorNode)
  
  .addEdge("detector",   "dispatcher")
  .addEdge("dispatcher", "bank_agent")
  .addEdge("dispatcher", "gst_agent")
  .addEdge("dispatcher", "itr_agent")
  .addEdge("dispatcher", "cibil_agent")
  .addEdge("dispatcher", "scout_agent")
  // Join: all 5 parallel agents → qual_gate
  .addEdge(["bank_agent","gst_agent","itr_agent","cibil_agent","scout_agent"], "qual_gate")
  .addEdge("qual_gate",  "reconciler")
  .addConditionalEdges("reconciler", checkMissingData, {
    "missing_data": "scout_agent",   // re-dispatch scout if critical gap
    "complete":     "cam_generator"
  })
  .addEdge("cam_generator", END)
  .compile()
```

### State Schema:
```ts
interface CreditPipelineState {
  appId: string;
  documents: DocumentRef[];
  extractedData: Record<string, AgentOutput>;
  redisBlackboard: Record<string, string>;
  qualitativeNotes: QualitativeNote[];
  discrepancies: DiscrepancyResult[];
  thinkingTrace: string;          // DeepSeek-R1 <think> tokens
  fiveCsScores: FiveCsScore;
  recommendation: LoanRecommendation;
  currentStage: string;
  errors: string[];
}
```

**Status checklist:**
- [ ] `CreditPipelineState` type definition  
- [ ] All node files (detector, dispatcher, financial, scout, qual-gate, reconciler, cam)  
- [ ] `graph.ts` StateGraph compilation  
- [ ] `/api/pipeline/run` POST route  
- [ ] `/api/pipeline/status/[id]` SSE route  
- [ ] SSE publishes to Redis channel → frontend subscribes  
- [ ] Error recovery: missing agent key → mark "Unverified"  

---

## Phase 7 — Qualitative Input Portal 🔲

> Credit Officer adds field notes **after** automated analysis. Notes shift scores.

### Files to Modify/Create:
```
app/
  applications/
    [id]/
      qualify/
        page.tsx          ← NEW: qualitative input form
components/
  forms/
    qualitative-form.tsx  ← NEW: 5-category notes form
```

### The 5 Categories:
| Field              | Maps To 5C      |
|--------------------|-----------------|
| Factory/Operations | Capacity        |
| Management Quality | Character       |
| Collateral Inspect | Collateral      |
| Customer Relations | Capacity        |
| Industry Context   | Conditions      |

### Implementation:
1. POST notes to `/api/applications/[id]/qualify`
2. Store in `qualitative_notes` DB table
3. Update `applications.qualitative_gate_done = true`
4. Trigger reconciler via LangGraph resume (interrupt → resume pattern)
5. CAM shows `[Credit Officer Note]` citations inline

**Status checklist:**
- [ ] `/applications/[id]/qualify` page  
- [ ] `qualitative-form.tsx` component (5 categories)  
- [ ] `/api/applications/[id]/qualify` POST route  
- [ ] `qualitative_gate_done` flag flip in DB  
- [ ] LangGraph interrupt/resume wired to qualitative gate  
- [ ] Score delta visualization (`+/-N pts from note`)  

---

## Phase 8 — Discrepancy Engine + Reconciler (DeepSeek-R1) 🔲

### 8.1 Discrepancy Engine
**New File:** `lib/pipeline/discrepancy-engine.ts`

**7-Check Triangulation:**
| Check | Threshold | Signal |
|-------|-----------|--------|
| GSTR-3B Sales vs Bank Credits (monthly) | >15% avg variance | Revenue inflation |
| GSTR-3B vs GSTR-2A matched ITC | >10% mismatch | Fake invoice chain |
| ITR net profit trend vs Bank closing balance | Opposite directions | BS manipulation |
| CIBIL CMR vs repayment behavior | CMR 7+ + clean repayments | Hidden defaults |
| Related Party Txns % of revenue | >20% | Circular trading |
| Nil-filer GST months vs bank activity | Bank active, GST nil | Suppression |
| Section 8 entities in related party | Any | Shell company risk |

**Output:** `DiscrepancyResult[]` with: `check_name, threshold, actual_value, verdict (PASS|FLAG|RED_FLAG), confidence`

### 8.2 Reconciler (DeepSeek-R1 via Groq)
**New File:** `lib/agents/reconciler-agent.ts`

```ts
// Model: deepseek-r1-distill-llama-70b via Groq
// ~800 tok/s, free tier: 6K tokens/min
// Captures <think>...</think> tokens as thinkingTrace

const completion = await groq.chat.completions.create({
  model: "deepseek-r1-distill-llama-70b",
  messages: [{
    role: "system",
    content: RECONCILER_SYSTEM_PROMPT  // 5Cs framework + Indian context
  }, {
    role: "user",
    content: buildReconcilerContext({
      redisSignals, discrepancies, qualitativeNotes, companyInfo
    })
  }],
  stream: true  // to capture think tokens in real-time
})

// Parse: extract <think>...</think> as thinkingTrace
// Parse: extract final JSON as fiveCsScores + recommendation
```

**Status checklist:**
- [ ] `discrepancy-engine.ts` (7 checks)  
- [ ] `reconciler-agent.ts` with Groq/DeepSeek-R1  
- [ ] Thinking trace capture (`<think>` token parsing)  
- [ ] 5Cs JSON output schema  
- [ ] Loan recommendation JSON output  
- [ ] Confidence <0.75 → mark "Unverified" in output  
- [ ] `cam_outputs` DB insert  

---

## Phase 9 — CAM Generator + PDF Download 🔲

### New Files:
```
lib/
  agents/
    cam-generator.ts       ← assembles CAM data from all signals
app/
  api/
    cam/
      generate/route.ts    ← POST: trigger CAM generation
      download/[id]/route.ts ← GET: serve PDF stream
components/
  memo/
    cam-pdf-template.tsx   ← @react-pdf/renderer template
    credit-memo-viewer.tsx ← (already exists, needs real data)
```

### PDF Sections:
1. **Executive Summary** — decision badge, recommended terms, 5Cs radar chart
2. **Per-5C Section** — score (0-100), rating badge, contrastive explanation, source citations with confidence
3. **Discrepancy Table** — 7-check results with monthly GST vs Bank bar chart
4. **Research Findings** — e-Courts cases, MCA status, CRISIL rating, RBI, news
5. **Shareholding Summary**
6. **Credit Officer Notes** per category (clearly labeled `[Credit Officer Note]`)
7. **AI Reasoning Trace** — DeepSeek-R1 thinking chain summary
8. **Audit Trail** — agent name, source, timestamp, confidence per data point

### Source Citation Format:
`[Mistral OCR p.42]` `[Tavily: e-Courts 2026-03-07]` `[Credit Officer Note: Factory]` `[Gemini: Bank Statement]`

**Status checklist:**
- [ ] `cam-generator.ts` data assembly  
- [ ] `cam-pdf-template.tsx` (@react-pdf/renderer)  
- [ ] Executive Summary section  
- [ ] Per-5C section with citations  
- [ ] Discrepancy table + bar chart  
- [ ] Research findings section  
- [ ] Credit Officer notes section  
- [ ] AI Reasoning trace section  
- [ ] Audit trail section  
- [ ] `/api/cam/generate` POST route  
- [ ] `/api/cam/download/[id]` GET route (PDF stream)  
- [ ] mem0 update after CAM generation (Promoter DNA)  

---

## Phase 10 — Live SSE Progress Feed 🔲

> Frontend polls via SSE. Each agent publishes stage updates.

### SSE Route: `/api/pipeline/status/[id]`
```ts
// Publishes events:
// { stage: "bank_agent", status: "running", progress: 40 }
// { stage: "scout_agent", status: "complete", confidence: 0.91 }
// { stage: "reconciler", status: "thinking", thinkTokens: "..." }
// { stage: "cam_generator", status: "complete", pdfUrl: "..." }
```

### Frontend: `components/agent/agent-activity-feed.tsx` (already exists, needs real data)
- Wire to SSE endpoint using `EventSource`
- Show per-agent status: pending → running → ✓ complete
- Show confidence badge as each agent completes
- Show thinking tokens streaming as reconciler runs

**Status checklist:**
- [ ] Redis Pub/Sub channel per `appId` (`pipeline:events:{appId}`)  
- [ ] Each agent publishes to Redis channel on stage change  
- [ ] `/api/pipeline/status/[id]` SSE route (subscribes to Redis channel)  
- [ ] `agent-activity-feed.tsx` consumes SSE  
- [ ] `analysis-tracker.tsx` shows real progress  

---

## Phase 11 — mem0 Promoter DNA 🔲

> Persistent promoter profiles across applications. Surfaces history when same DIN/PAN appears.

### New File: `lib/memory/promoter-dna.ts`
```ts
// On CAM generation:
mem0.add([{
  role: "assistant",
  content: `Promoter DIN:${din} — Application ${appId} — Decision: ${decision} — 
            CMR: ${cmr} — Key signals: ${keySignals}`
}], { userId: din })  // keyed by DIN

// On new application with known DIN:
const history = await mem0.search("Prior applications and risk signals", { userId: din })
// → surfaces in Reconciler context as "Promoter DNA"
```

**Status checklist:**
- [ ] `promoter-dna.ts` with mem0 add + search  
- [ ] Hook into CAM generator (write after decision)  
- [ ] Hook into Reconciler (read at synthesis start)  
- [ ] Show "Prior History" badge in UI if promoter known  

---

## Phase 12 — Explainability UI (Frontend Polish) 🔲

> The feature that wins judges. Every number must have a source.

### Components to Create/Modify:
```
components/
  memo/
    credit-memo-viewer.tsx      ← (exists) → wire to real cam_outputs data
  agent/
    explainability.tsx          ← (exists) → wire to real signals
    agent-activity-feed.tsx     ← (exists) → wire to SSE
  analytics/
    discrepancy-chart.tsx       ← NEW: monthly GST vs Bank bar chart
    fivecs-radar-chart.tsx      ← NEW: 5Cs radar (recharts)
  ui/
    source-chip.tsx             ← NEW: "[Tavily: e-Courts]" badge
    confidence-badge.tsx        ← NEW: Green ≥0.85 / Amber 0.70-0.84 / Red <0.70
```

### Explainability Elements:
| Element | Location | Implementation |
|---------|----------|----------------|
| Source chip | Every data point in CAM view | `<SourceChip source="Mistral OCR p.42" />` |
| Confidence badge | Next to every extracted value | `<ConfidenceBadge score={0.88} />` |
| Hover tooltip | Raw OCR/scraped snippet | Radix `<Tooltip>` with `rawSnippet` |
| Monthly bar chart | Discrepancy section | Recharts `BarChart` — GST vs Bank 12-month |
| 5Cs radar chart | CAM overview | Recharts `RadarChart` |
| AI Reasoning panel | Collapsible section | `<Collapsible>` with DeepSeek `<think>` chain |
| Discrepancy table | 7-check results | Color-coded table: PASS/FLAG/RED_FLAG |

**Status checklist:**
- [ ] `source-chip.tsx` component  
- [ ] `confidence-badge.tsx` component  
- [ ] `discrepancy-chart.tsx` — 12-month GST vs Bank bar chart  
- [ ] `fivecs-radar-chart.tsx` — 5Cs radar  
- [ ] AI Reasoning panel (collapsible `<think>` chain)  
- [ ] Discrepancy table (7 checks)  
- [ ] `credit-memo-viewer.tsx` wired to real data  
- [ ] Source chips + tooltips on all extracted values  

---

## Phase 13 — Wire Everything Together (End-to-End Test) 🔲

> Full flow: Upload → Pipeline → Quality → CAM → Download

### Test Flow:
1. Create new application (/applications/new)
2. Upload 3 PDFs: bank statement + GST return + ITR
3. Trigger pipeline (`/api/pipeline/run`)
4. Watch SSE feed show: ingestion → agents → scout → blackboard
5. Fill qualitative notes form
6. Watch reconciler run (DeepSeek-R1 thinking trace appears)
7. Download CAM PDF
8. Verify: source chips on every data point, reasoning trace visible

### Smoke Test Checklist:
- [ ] Digital PDF → Gemini path works  
- [ ] Scanned PDF → Mistral OCR path works  
- [ ] All 4 financial agents produce confident output  
- [ ] Scout agent returns at least e-Courts + MCA results  
- [ ] Qualitative notes affect final scores (delta visible)  
- [ ] DeepSeek-R1 thinking trace non-empty  
- [ ] PDF downloads successfully  
- [ ] Audit trail has timestamps + agent names + confidence  
- [ ] Confidence <0.75 shows "Unverified" in output  
- [ ] mem0 stores promoter history  

---

## 📁 Final Folder Structure (Target)

```
app/
  api/
    pipeline/
      ingest/route.ts
      run/route.ts
      status/[id]/route.ts        ← SSE
    documents/
      upload/route.ts
    cam/
      generate/route.ts
      download/[id]/route.ts
    applications/
      [id]/qualify/route.ts       ← qualitative notes POST
  applications/
    [id]/
      qualify/page.tsx            ← qualitative input portal
      cam/page.tsx                ← CAM review page

components/
  memo/
    cam-pdf-template.tsx          ← @react-pdf/renderer
  analytics/
    discrepancy-chart.tsx
    fivecs-radar-chart.tsx
  ui/
    source-chip.tsx
    confidence-badge.tsx

lib/
  agents/
    base-agent.ts                 ← Gemini client + shared types
    bank-statement-agent.ts
    gst-agent.ts
    itr-balancesheet-agent.ts
    cibil-agent.ts
    scout-agent.ts
    reconciler-agent.ts           ← DeepSeek-R1 via Groq
    cam-generator.ts
  pipeline/
    pdf-detector.ts
    ingestor-digital.ts           ← Gemini native
    ingestor-scanned.ts           ← Mistral OCR + LlamaParse
    ingestor.ts
    discrepancy-engine.ts
    graph.ts                      ← LangGraph StateGraph
    nodes/
      detector-node.ts
      dispatcher-node.ts
      financial-node.ts
      scout-node.ts
      qualitative-gate-node.ts
      reconciler-node.ts
      cam-node.ts
  memory/
    promoter-dna.ts               ← mem0
  db/
    schema.ts                     ← extended (phases 1)
    config.ts
    seed.ts
```

---

## 🔑 Key Decisions & Notes

| Decision | Choice | Reason |
|----------|--------|--------|
| Gemini version | `gemini-2.5-flash` | 1M context, multimodal, free tier |
| Reconciler | `deepseek-r1-distill-llama-70b` via Groq | ~800 tok/s, visible `<think>` chain |
| OCR | `mistral-ocr-latest` | Best layout preservation for Indian PDFs |
| Table extraction | LlamaParse JSON mode | Cell structure intact for GST/balance sheets |
| CMR scoring | 1–10 (NOT 300–900) | Indian CIBIL commercial scale — critical for demo |
| Redis | Upstash (serverless) | Works in Next.js Edge + standard runtime |
| Storage | Vercel Blob | Simplest integration with Next.js |
| PDF output | `@react-pdf/renderer` | Server-side PDF generation in Node.js |
| State recovery | Redis `extraction_state` | Resume pipeline without re-processing completed docs |
| Confidence guard | <0.75 → "Unverified" | Never hallucinate; trust is critical for lenders |

---

## 🚨 Common Pitfalls (Remember These)
- **CIBIL CMR is 1–10** (1=lowest risk) — never confuse with consumer CIBIL 300–900
- **GSTR-2A vs 3B** — 2A is the reconciled view from counterparty filings, 3B is self-declared
- **DIN-based MCA lookup** is more accurate than name-based (avoid false positives on common Indian names)
- **Nil-filer GST months** followed by sudden revenue = suppression pattern (very common fraud signal)
- **Section 8 companies** in related party list = shell company signal
- **DeepSeek-R1 thinking trace** must be captured from stream (not available in non-streaming mode)
- **LangGraph qualitative gate** requires `interrupt()` → human turn → `resume()` pattern
- **Confidence <0.75** → always surface as "Unverified — Manual Check Required" in CAM

---

## 📅 Suggested Implementation Order

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
(deps)    (schema)  (storage) (ingest)  (agents)  (scout)
   ↓
Phase 6 → Phase 7 → Phase 8 → Phase 9
(graph)   (qual)   (reconcil) (CAM+PDF)
   ↓
Phase 10 → Phase 11 → Phase 12 → Phase 13
(SSE)      (mem0)     (UI)        (E2E test)
```

> **Shortcut for demo-readiness:** Phases 0–9 get you a working backend pipeline.
> Phases 10–12 are what wins the judging — explainability is 10/10 criterion.
> Phase 11 (mem0) is bonus — implement last.
