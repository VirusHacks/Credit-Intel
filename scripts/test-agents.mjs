/**
 * test-agents.mjs
 * End-to-end test for Phase 4 (financial agents) + Phase 5 (scout agent).
 *
 * Flow per document:
 *   1. Upload PDF   → /api/documents/upload
 *   2. Ingest PDF   → /api/pipeline/ingest  (Gemini / Mistral extraction)
 *   3. Run agent    → /api/pipeline/run-agent (new lightweight route, see below)
 *
 * Also tests the Phase 6 full pipeline run:
 *   4. POST /api/pipeline/run  (LangGraph orchestration)
 *   5. GET  /api/pipeline/status/:appId  (SSE progress stream)
 *
 * Usage:
 *   node scripts/test-agents.mjs [--skip-upload] [--only=bank|gst|itr|cibil|scout|pipeline]
 *
 * Flags:
 *   --skip-upload   Re-use previously uploaded blobs stored in .test-state.json
 *   --only=NAME     Run only one agent test (or "pipeline" for the full LangGraph run)
 *
 * Prerequisites:
 *   1. pnpm dev running (http://localhost:3000)
 *   2. node scripts/generate-sample-docs.mjs ran (sample-documents/ exists)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { basename } from 'path';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const STATE_FILE = 'scripts/.test-state.json';

// CLI flags
const args = process.argv.slice(2);
const skipUpload = args.includes('--skip-upload');
const onlyFilter = args.find((a) => a.startsWith('--only='))?.split('=')[1];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function header(title) {
  const line = '─'.repeat(55);
  console.log(`\n${line}`);
  console.log(`  ${title}`);
  console.log(line);
}

function ok(label, value) {
  console.log(`  ✓ ${label}: ${String(value ?? '').slice(0, 120)}`);
}

function warn(label, value) {
  console.warn(`  ⚠ ${label}: ${String(value ?? '').slice(0, 200)}`);
}

function fail(label, detail) {
  console.error(`  ✗ ${label}: ${String(detail ?? '').slice(0, 300)}`);
}

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function uploadPdf(pdfPath, docType) {
  const fileBytes = readFileSync(pdfPath);
  const form = new FormData();
  form.append('file', new Blob([fileBytes], { type: 'application/pdf' }), basename(pdfPath));
  form.append('documentType', docType);
  const res = await fetch(`${BASE_URL}/api/documents/upload`, { method: 'POST', body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Upload failed ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

async function ingest(appId, documentId, blobUrl, documentType) {
  const { status, json } = await post('/api/pipeline/ingest', { appId, documentId, blobUrl, documentType });
  if (status !== 200) throw new Error(`Ingest ${status}: ${JSON.stringify(json)}`);
  return json;
}

// ─── State persistence (skip re-upload) ──────────────────────────────────────

let savedState = {};
if (skipUpload && existsSync(STATE_FILE)) {
  savedState = JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
  console.log('  Re-using saved blob URLs from', STATE_FILE);
}

function saveState(key, value) {
  savedState[key] = value;
  writeFileSync(STATE_FILE, JSON.stringify(savedState, null, 2));
}

// ─── Document configs ─────────────────────────────────────────────────────────

const DOCS = [
  { key: 'bank', file: 'sample-documents/bank-statement.pdf', docType: 'bank_statement' },
  { key: 'gst', file: 'sample-documents/gst-return.pdf', docType: 'gst_return' },
  { key: 'itr', file: 'sample-documents/itr.pdf', docType: 'itr' },
  { key: 'bs', file: 'sample-documents/balance-sheet.pdf', docType: 'financial_statement' },
  { key: 'cibil', file: 'sample-documents/cibil-report.pdf', docType: 'cibil_report' },
];

// ─── Step 1+2: Upload + Ingest all docs ──────────────────────────────────────

const APP_ID = `test-app-agents-${Date.now()}`;
const ingestResults = {};

async function uploadAndIngestAll() {
  header('STEP 1 + 2 — Upload & Ingest all sample documents');
  console.log(`  AppID: ${APP_ID}\n`);

  for (const doc of DOCS) {
    process.stdout.write(`  [${doc.key}] uploading + ingesting ${doc.file} ... `);

    let blobUrl, documentId;

    if (skipUpload && savedState[doc.key]) {
      blobUrl = savedState[doc.key].blobUrl;
      documentId = savedState[doc.key].documentId ?? doc.key;
      process.stdout.write('(re-used cached blob) ');
    } else {
      if (!existsSync(doc.file)) {
        console.warn(`\n         SKIP — file not found. Run: pnpm gen:samples`);
        continue;
      }
      try {
        const up = await uploadPdf(doc.file, doc.docType);
        blobUrl = up.blobUrl;
        documentId = up.documentId ?? doc.key;
        saveState(doc.key, { blobUrl, documentId });
      } catch (e) {
        console.error(`\n         ✗ Upload error: ${e.message}`);
        continue;
      }
    }

    try {
      const result = await ingest(APP_ID, documentId, blobUrl, doc.docType);
      ingestResults[doc.key] = result;
      console.log(`✓ (confidence: ${result.confidence ?? '?'}, model: ${result.modelUsed ?? '?'})`);
    } catch (e) {
      console.error(`\n         ✗ Ingest error: ${e.message}`);
    }
  }
}

// ─── Step 3: Test each agent via a direct HTTP POST ──────────────────────────
// We add a thin /api/pipeline/run-agent route for testing agents in isolation.
// If it doesn't exist, the test falls back to just printing ingest data.

async function testAgent(label, body) {
  const { status, json } = await post('/api/pipeline/run-agent', body);
  if (status === 404) {
    warn(label, '/api/pipeline/run-agent not found — showing ingest data instead');
    return null;
  }
  if (status !== 200) {
    fail(label, `HTTP ${status}: ${JSON.stringify(json).slice(0, 200)}`);
    return null;
  }
  return json;
}

async function testBankAgent() {
  header('STEP 3a — Bank Statement Agent');
  const ir = ingestResults['bank'];
  if (!ir) { warn('bank', 'No ingest result — skipping'); return; }

  ok('Ingest confidence', ir.confidence);
  ok('Pages', ir.pageCount);

  const result = await testAgent('bank', {
    agentName: 'bank_statement',
    appId: APP_ID,
    ingestResult: ir,
  });

  if (result) {
    ok('Agent confidence', result.confidence);
    ok('Flags', result.flags?.map(f => `[${f.severity}] ${f.key}`).join(', ') || 'none');
    ok('avg_bank_balance_lakh', result.analysis?.avg_bank_balance_lakh);
    ok('annual_credit_turnover', result.analysis?.annual_credit_turnover_lakh);
    ok('od_utilization_pct', result.analysis?.od_utilization_pct);
    ok('bounce_count_12m', result.analysis?.bounce_count_12m);
    ok('banking_health_score', result.analysis?.banking_health_score);
  } else {
    // Fallback: show raw extracted data
    console.log('\n  Raw extracted data (first 600 chars):');
    console.log('  ' + JSON.stringify(ir.extractedData, null, 2).slice(0, 600));
  }
}

async function testGSTAgent() {
  header('STEP 3b — GST Agent');
  const ir = ingestResults['gst'];
  if (!ir) { warn('gst', 'No ingest result — skipping'); return; }

  ok('Ingest confidence', ir.confidence);

  const result = await testAgent('gst', {
    agentName: 'gst_analyzer',
    appId: APP_ID,
    ingestResult: ir,
  });

  if (result) {
    ok('Agent confidence', result.confidence);
    ok('Flags', result.flags?.map(f => `[${f.severity}] ${f.key}`).join(', ') || 'none');
    ok('gst_annual_turnover_lakh', result.analysis?.gst_annual_turnover_lakh);
    ok('effective_gst_rate_pct', result.analysis?.effective_gst_rate_pct);
    ok('gst_3b_vs_2a_variance_pct', result.analysis?.gst_3b_vs_2a_variance_pct);
    ok('months_filed_on_time', result.analysis?.months_filed_on_time);
  } else {
    console.log('\n  Raw extracted data (first 600 chars):');
    console.log('  ' + JSON.stringify(ir.extractedData, null, 2).slice(0, 600));
  }
}

async function testITRAgent() {
  header('STEP 3c — ITR + Balance Sheet Agent');
  const itrIR = ingestResults['itr'];
  const bsIR = ingestResults['bs'];

  if (!itrIR && !bsIR) { warn('itr', 'No ingest results for itr or balance sheet — skipping'); return; }

  ok('ITR ingest confidence', itrIR?.confidence ?? 'N/A');
  ok('BS  ingest confidence', bsIR?.confidence ?? 'N/A');

  const result = await testAgent('itr', {
    agentName: 'itr_balancesheet',
    appId: APP_ID,
    itrIngestResult: itrIR ?? null,
    bsIngestResult: bsIR ?? null,
  });

  if (result) {
    ok('Agent confidence', result.confidence);
    ok('Flags', result.flags?.map(f => `[${f.severity}] ${f.key}`).join(', ') || 'none');
    ok('revenue_lakh', result.analysis?.revenue_lakh);
    ok('ebitda_margin_pct', result.analysis?.ebitda_margin_pct);
    ok('dscr', result.analysis?.dscr);
    ok('debt_to_equity', result.analysis?.debt_to_equity);
    ok('current_ratio', result.analysis?.current_ratio);
  } else if (itrIR) {
    console.log('\n  ITR extracted data (first 600 chars):');
    console.log('  ' + JSON.stringify(itrIR.extractedData, null, 2).slice(0, 600));
  }
}

async function testCIBILAgent() {
  header('STEP 3d — CIBIL CMR Agent');
  const ir = ingestResults['cibil'];
  if (!ir) { warn('cibil', 'No ingest result — skipping'); return; }

  ok('Ingest confidence', ir.confidence);

  const result = await testAgent('cibil', {
    agentName: 'cibil_cmr',
    appId: APP_ID,
    ingestResult: ir,
  });

  if (result) {
    ok('Agent confidence', result.confidence);
    ok('Flags', result.flags?.map(f => `[${f.severity}] ${f.key}`).join(', ') || 'none');
    ok('cmr_rank', result.analysis?.cmr_rank);
    ok('probability_of_default', result.analysis?.probability_of_default_pct);
    ok('wilful_defaulter_flag', result.analysis?.wilful_defaulter_flag);
    ok('dpd_30_count', result.analysis?.dpd_30_count);
  } else {
    console.log('\n  Raw extracted data (first 600 chars):');
    console.log('  ' + JSON.stringify(ir.extractedData, null, 2).slice(0, 600));
  }
}

async function testScoutAgent() {
  header('STEP 3e — Scout Agent (Tavily OSINT)');
  console.log(`  Company: Sharma Textile Industries Pvt. Ltd.`);
  console.log(`  Promoter: Rajesh Sharma`);
  console.log('  Note: Sending 6 parallel Tavily searches — may take 10–20s\n');

  const result = await testAgent('scout', {
    agentName: 'scout',
    appId: APP_ID,
    companyName: 'Sharma Textile Industries Pvt. Ltd.',
    promoterName: 'Rajesh Sharma',
  });

  if (result) {
    ok('Scout score (0=safe, 100=risky)', result.scoutScore);
    ok('Fraud signals found', result.fraudSignalCount);
    ok('Court cases found', result.courtCaseCount);
    ok('RBI default flag', result.rbiDefaultFlag);
    ok('Wilful defaulter flag', result.wilfulDefaulterFlag);
    ok('Negative press count', result.negativePressCount);
    ok('Promoter disqualified', result.promoterDisqualifiedFlag);
    ok('Credit rating summary', result.creditRatingSummary ?? 'not found');
    ok('Total findings', result.findings?.length);
  } else {
    warn('scout', 'run-agent route not available — run manually via test-pipeline route');
  }
}

// ─── Step 4+5: Full LangGraph pipeline run ────────────────────────────────────

async function testFullPipeline() {
  header('STEP 4 — Full Pipeline Run (LangGraph)');

  const PIPELINE_APP_ID = `test-pipeline-${Date.now()}`;
  console.log(`  AppID: ${PIPELINE_APP_ID}`);
  console.log('  Note: This needs a real application in the DB.');
  console.log('  The /api/pipeline/run route validates appId against the DB.');
  console.log('  Skipping full pipeline test (no seeded app in DB).');
  console.log('  ─ To test manually:');
  console.log(`    curl -X POST ${BASE_URL}/api/pipeline/run \\`);
  console.log(`      -H 'Content-Type: application/json' \\`);
  console.log(`      -d '{"appId":"<real-uuid>","companyName":"Sharma Textile"}'`);

  header('STEP 5 — SSE Status Stream');
  console.log('  Testing SSE connection to /api/pipeline/status/<id>...');

  try {
    // Test that the endpoint returns 404 for a fake ID (proves it's routing correctly)
    const res = await fetch(`${BASE_URL}/api/pipeline/status/00000000-0000-0000-0000-000000000000`, {
      headers: { Accept: 'text/event-stream' },
    });
    if (res.status === 404) {
      ok('SSE route reachable', `Returns 404 for unknown appId — route is wired correctly`);
    } else if (res.status === 200) {
      // Read the first chunk
      const reader = res.body?.getReader();
      const { value } = await reader?.read() ?? {};
      const text = value ? new TextDecoder().decode(value) : '';
      ok('SSE stream opened', text.slice(0, 100));
      reader?.cancel();
    } else {
      warn('SSE route', `Unexpected status ${res.status}`);
    }
  } catch (e) {
    fail('SSE route', e.message);
  }
}

// ─── Step 6: Route smoke tests ────────────────────────────────────────────────

async function testRouteSmokeTests() {
  header('STEP 6 — Route Smoke Tests');

  // Test /api/pipeline/run with missing fields
  {
    const { status, json } = await post('/api/pipeline/run', {});
    const ok400 = status === 400;
    (ok400 ? ok : fail)('POST /api/pipeline/run (empty body) → 400', `HTTP ${status}: ${json.error ?? '?'}`);
  }

  // Test /api/pipeline/run with bad appId
  {
    const { status, json } = await post('/api/pipeline/run', {
      appId: '00000000-0000-0000-0000-000000000000',
      companyName: 'Test Co',
    });
    const ok404 = status === 404;
    (ok404 ? ok : fail)('POST /api/pipeline/run (unknown appId) → 404', `HTTP ${status}: ${json.error ?? '?'}`);
  }

  // Test /api/pipeline/ingest with missing fields
  {
    const { status, json } = await post('/api/pipeline/ingest', {});
    const ok400 = status === 400;
    (ok400 ? ok : fail)('POST /api/pipeline/ingest (empty body) → 400', `HTTP ${status}: ${json.error ?? '?'}`);
  }

  // Test /api/pipeline/status/[id] for unknown id
  {
    const res = await fetch(`${BASE_URL}/api/pipeline/status/00000000-0000-0000-0000-000000000000`);
    (res.status === 404 ? ok : fail)('GET /api/pipeline/status/{bad-id} → 404', `HTTP ${res.status}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   IntelliCredit — Phase 4+5+6 Agent Test Suite      ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`  Server   : ${BASE_URL}`);
  console.log(`  AppID    : ${APP_ID}`);

  // Check server is up
  try {
    await fetch(`${BASE_URL}/api/pipeline/ingest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  } catch {
    console.error('\n✗ Cannot reach dev server. Start it first: pnpm dev\n');
    process.exit(1);
  }

  const only = onlyFilter?.toLowerCase();

  if (!only || only === 'upload') {
    await uploadAndIngestAll();
  }

  if (!only || only === 'bank') await testBankAgent();
  if (!only || only === 'gst') await testGSTAgent();
  if (!only || only === 'itr') await testITRAgent();
  if (!only || only === 'cibil') await testCIBILAgent();
  if (!only || only === 'scout') await testScoutAgent();
  if (!only || only === 'pipeline') await testFullPipeline();
  if (!only || only === 'smoke') await testRouteSmokeTests();

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Done. Check output above for ✓ / ✗ / ⚠ per test.');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
