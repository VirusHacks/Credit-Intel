/**
 * test-upload.mjs
 * Uploads a PDF to the local dev server and then runs the ingest pipeline.
 *
 * Usage:
 *   node scripts/test-upload.mjs <pdf-path> <document-type>
 *
 * Examples:
 *   node scripts/test-upload.mjs sample-documents/bank-statement.pdf bank_statement
 *   node scripts/test-upload.mjs sample-documents/gst-return.pdf gst_return
 *   node scripts/test-upload.mjs sample-documents/itr.pdf itr
 *   node scripts/test-upload.mjs sample-documents/balance-sheet.pdf financial_statement
 *   node scripts/test-upload.mjs sample-documents/cibil-report.pdf cibil_report
 */

import { readFileSync, existsSync } from 'fs';
import { basename } from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const [, , pdfPath, docType] = process.argv;

const VALID_TYPES = [
  'bank_statement', 'gst_return', 'itr', 'annual_report',
  'cibil_report', 'financial_statement', 'sanction_letter', 'other',
];

if (!pdfPath || !docType) {
  console.error('Usage: node scripts/test-upload.mjs <pdf-path> <document-type>');
  console.error('Valid types:', VALID_TYPES.join(', '));
  process.exit(1);
}

if (!existsSync(pdfPath)) {
  console.error(`File not found: ${pdfPath}`);
  console.error('Run "node scripts/generate-sample-docs.mjs" first.');
  process.exit(1);
}

if (!VALID_TYPES.includes(docType)) {
  console.error(`Invalid document type: ${docType}`);
  console.error('Valid types:', VALID_TYPES.join(', '));
  process.exit(1);
}

async function main() {
  const fileBytes = readFileSync(pdfPath);
  const fileName  = basename(pdfPath);

  console.log(`\n── STEP 1: Upload  ──────────────────────────────────────`);
  console.log(`File      : ${fileName} (${(fileBytes.length / 1024).toFixed(1)} KB)`);
  console.log(`Doc type  : ${docType}`);
  console.log(`Server    : ${BASE_URL}`);

  // ── Upload ──
  const form = new FormData();
  form.append('file', new Blob([fileBytes], { type: 'application/pdf' }), fileName);
  form.append('documentType', docType);

  let uploadRes;
  try {
    const res = await fetch(`${BASE_URL}/api/documents/upload`, {
      method: 'POST',
      body: form,
    });
    uploadRes = await res.json();
    if (!res.ok) {
      console.error('\n✗ Upload failed:', JSON.stringify(uploadRes, null, 2));
      process.exit(1);
    }
  } catch (err) {
    console.error('\n✗ Could not reach server. Is the dev server running? (pnpm dev)');
    console.error(err.message);
    process.exit(1);
  }

  console.log('\n✓ Upload successful!');
  console.log(`  blobUrl    : ${uploadRes.blobUrl}`);
  console.log(`  documentId : ${uploadRes.documentId ?? '(no applicationId provided)'}`);
  console.log(`  fileSize   : ${uploadRes.fileSize} bytes`);

  // ── Ingest ──
  console.log(`\n── STEP 2: Ingest Pipeline ──────────────────────────────`);
  console.log('Calling /api/pipeline/ingest — this may take 10–40s for AI extraction...\n');

  const ingestBody = JSON.stringify({
    appId:        'test-app-001',
    documentId:   uploadRes.documentId ?? 'test-doc-001',
    blobUrl:      uploadRes.blobUrl,
    documentType: docType,
  });

  let ingestRes;
  try {
    const res = await fetch(`${BASE_URL}/api/pipeline/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: ingestBody,
    });
    ingestRes = await res.json();
    if (!res.ok) {
      console.error('✗ Ingest failed:', JSON.stringify(ingestRes, null, 2));
      process.exit(1);
    }
  } catch (err) {
    console.error('✗ Ingest request failed:', err.message);
    process.exit(1);
  }

  console.log('✓ Ingest complete!\n');
  console.log('── RESULT ───────────────────────────────────────────────');
  console.log(`PDF Type    : ${ingestRes.pdfType ?? ingestRes.metadata?.pdfType}`);
  console.log(`Pages       : ${ingestRes.pageCount ?? ingestRes.metadata?.pageCount}`);
  console.log(`Confidence  : ${ingestRes.confidence ?? ingestRes.metadata?.confidence}`);
  console.log(`Model Used  : ${ingestRes.modelUsed ?? ingestRes.metadata?.modelUsed}`);
  console.log('\nExtracted Data:');
  const data = ingestRes.extractedData ?? ingestRes.data;
  console.log(JSON.stringify(data, null, 2));
  console.log('\n─────────────────────────────────────────────────────────');
}

main();
