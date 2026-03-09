/**
 * cam-pdf-template.tsx
 * @react-pdf/renderer template for the Credit Appraisal Memo (CAM) PDF.
 * 8 sections: Executive Summary, 5Cs, Discrepancies, Research,
 *             Shareholding, Credit Officer Notes, AI Reasoning Trace, Audit Trail.
 *
 * NOTE: This file must NOT include 'use client' — it runs server-side only.
 */

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { CAMData } from '@/lib/agents/cam-generator';

// ─── Colours ──────────────────────────────────────────────────────────────────
const C = {
  navy: '#1e3a5f',
  navyLight: '#2d5280',
  green: '#16a34a',
  amber: '#d97706',
  red: '#dc2626',
  grey: '#6b7280',
  greyLight: '#f3f4f6',
  white: '#ffffff',
  border: '#e5e7eb',
  text: '#111827',
  textMid: '#374151',
} as const;

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.text,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 40,
    lineHeight: 1.5,
  },

  // Header
  header: { marginBottom: 20, borderBottomWidth: 2, borderBottomColor: C.navy, paddingBottom: 12 },
  headerTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.navy, letterSpacing: 1 },
  headerSub: { fontSize: 9, color: C.grey, marginTop: 2 },

  // Section
  section: { marginBottom: 16 },
  sectionHeader: {
    backgroundColor: C.navy,
    color: C.white,
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
  },

  // Decision badge
  decisionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  badge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 3 },
  badgeApprove: { backgroundColor: C.green },
  badgeConditional: { backgroundColor: C.amber },
  badgeReject: { backgroundColor: C.red },
  badgeText: { color: C.white, fontFamily: 'Helvetica-Bold', fontSize: 10 },

  // 5C card
  fiveCRow: { flexDirection: 'row', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
  cCard: {
    flex: 1,
    minWidth: 90,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 3,
    padding: 6,
  },
  cLabel: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.navy, marginBottom: 2 },
  cScore: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.navy },
  cRating: { fontSize: 8, color: C.grey, marginBottom: 4 },
  cExplanation: { fontSize: 7, color: C.textMid, lineHeight: 1.4 },

  // Table
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 4 },
  tableHeader: { backgroundColor: C.greyLight },
  tableCell: { flex: 1, fontSize: 8, paddingHorizontal: 4 },
  tableCellBold: { flex: 1, fontSize: 8, paddingHorizontal: 4, fontFamily: 'Helvetica-Bold' },

  // Verdict chips
  verdictPass: { color: C.green, fontFamily: 'Helvetica-Bold' },
  verdictFlag: { color: C.amber, fontFamily: 'Helvetica-Bold' },
  verdictRed: { color: C.red, fontFamily: 'Helvetica-Bold' },

  // Research item
  researchItem: {
    borderLeftWidth: 2,
    borderLeftColor: C.navy,
    paddingLeft: 8,
    marginBottom: 6,
  },
  fraudItem: { borderLeftColor: C.red },
  researchType: { fontSize: 7, color: C.grey, marginBottom: 1 },
  researchSnippet: { fontSize: 8, color: C.textMid },
  researchUrl: { fontSize: 7, color: C.navyLight },

  // Note item
  noteItem: { marginBottom: 6, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: C.border },
  noteMeta: { fontSize: 7, color: C.grey, marginBottom: 1 },
  noteText: { fontSize: 8, color: C.textMid },
  noteDelta: { fontSize: 7, color: C.grey },

  // Think trace (monospaced-like, condensed)
  thinkBlock: {
    backgroundColor: C.greyLight,
    padding: 8,
    fontSize: 7,
    color: C.grey,
    lineHeight: 1.5,
  },

  // Conditions list
  conditionItem: { fontSize: 8, marginBottom: 3, color: C.textMid },
  bullet: { color: C.amber, fontFamily: 'Helvetica-Bold' },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 6,
  },
  footerText: { fontSize: 7, color: C.grey },
  pageNum: { fontSize: 7, color: C.grey },

  // Label–value pair
  kvRow: { flexDirection: 'row', marginBottom: 3 },
  kvLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', width: 130, color: C.textMid },
  kvValue: { fontSize: 8, color: C.text, flex: 1 },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function decisionColor(d: string) {
  if (d === 'APPROVE') return C.green;
  if (d === 'CONDITIONAL_APPROVE') return C.amber;
  return C.red;
}

function ratingColor(r: string): string {
  if (r === 'Strong') return C.green;
  if (r === 'Adequate') return C.navy;
  if (r === 'Weak') return C.amber;
  return C.red;
}

function verdictStyle(v: string) {
  if (v === 'PASS') return s.verdictPass;
  if (v === 'FLAG') return s.verdictFlag;
  return s.verdictRed;
}

function formatDate(d: Date): string {
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return <Text style={s.sectionHeader}>{title}</Text>;
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.kvRow}>
      <Text style={s.kvLabel}>{label}</Text>
      <Text style={s.kvValue}>{value}</Text>
    </View>
  );
}

// ─── Main PDF template ────────────────────────────────────────────────────────
export function CAMPdfTemplate({ data }: { data: CAMData }) {
  const { fiveCsScores: fcs, recommendation: rec, discrepancies, generatedAt } = data;

  return (
    <Document
      title={`CAM — ${data.companyName}`}
      author="IntelliCredit AI"
      subject="Credit Appraisal Memo"
    >
      {/* ── PAGE 1: Executive Summary + 5Cs ────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>CREDIT APPRAISAL MEMO</Text>
          <Text style={s.headerSub}>
            IntelliCredit AI · Generated {formatDate(generatedAt)} · CONFIDENTIAL
          </Text>
        </View>

        {/* Section 1 — Executive Summary */}
        <View style={s.section}>
          <SectionHeader title="1. EXECUTIVE SUMMARY" />

          <View style={s.decisionRow}>
            <View
              style={[
                s.badge,
                rec.decision === 'APPROVE'
                  ? s.badgeApprove
                  : rec.decision === 'CONDITIONAL_APPROVE'
                    ? s.badgeConditional
                    : s.badgeReject,
              ]}
            >
              <Text style={s.badgeText}>{rec.decision.replace('_', ' ')}</Text>
            </View>
          </View>

          <KV label="Borrower" value={data.companyName} />
          <KV label="CIN" value={data.cin} />
          <KV label="GSTIN" value={data.gstin} />
          <KV label="Industry" value={data.industry} />
          <KV label="Loan Requested" value={`₹${data.requestedAmountInr}`} />
          <KV label="Recommended Amount" value={rec.recommendedAmountInr} />
          <KV label="Recommended Rate" value={rec.recommendedRatePercent} />
          {rec.reductionRationale && (
            <KV label="Reduction Rationale" value={rec.reductionRationale} />
          )}
        </View>

        {/* Section 2 — 5Cs Framework */}
        <View style={s.section}>
          <SectionHeader title="2. FIVE C's FRAMEWORK" />

          <View style={s.fiveCRow}>
            {(['character', 'capacity', 'capital', 'collateral', 'conditions'] as const).map(
              (dim) => {
                const c = fcs[dim];
                return (
                  <View key={dim} style={s.cCard}>
                    <Text style={s.cLabel}>{dim.toUpperCase()}</Text>
                    <Text style={[s.cScore, { color: ratingColor(c.rating) }]}>{c.score}</Text>
                    <Text style={[s.cRating, { color: ratingColor(c.rating) }]}>{c.rating}</Text>
                    <Text style={s.cExplanation}>{c.explanation}</Text>
                  </View>
                );
              },
            )}
          </View>
        </View>

        {/* Section 3 — Loan Conditions */}
        {rec.conditions.length > 0 && (
          <View style={s.section}>
            <SectionHeader title="3. LOAN CONDITIONS / COVENANTS" />
            {rec.conditions.map((cond, i) => (
              <Text key={i} style={s.conditionItem}>
                <Text style={s.bullet}>• </Text>
                {cond}
              </Text>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>IntelliCredit AI · {data.companyName}</Text>
          <Text style={s.pageNum} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

      {/* ── PAGE 2: Discrepancies + Research + Credit Officer Notes ─────────── */}
      <Page size="A4" style={s.page}>
        {/* Section 4 — Discrepancy Cross-Check */}
        <View style={s.section}>
          <SectionHeader title="4. CROSS-DOCUMENT DISCREPANCY CHECKS (7-Point)" />

          {/* Table header */}
          <View style={[s.tableRow, s.tableHeader]}>
            <Text style={[s.tableCellBold, { flex: 2.5 }]}>Check</Text>
            <Text style={s.tableCellBold}>Threshold</Text>
            <Text style={s.tableCellBold}>Actual Value</Text>
            <Text style={s.tableCellBold}>Verdict</Text>
          </View>

          {discrepancies.map((d, i) => (
            <View key={i} style={s.tableRow}>
              <Text style={[s.tableCell, { flex: 2.5 }]}>{d.checkName}</Text>
              <Text style={s.tableCell}>{d.threshold}</Text>
              <Text style={s.tableCell}>{d.actualValue}</Text>
              <Text style={[s.tableCell, verdictStyle(d.verdict)]}>{d.verdict}</Text>
            </View>
          ))}

          {discrepancies.length === 0 && (
            <Text style={[s.tableCell, { marginTop: 4, color: C.green }]}>
              All checks passed — no discrepancies detected.
            </Text>
          )}
        </View>

        {/* Section 5 — Research Findings */}
        <View style={s.section}>
          <SectionHeader title="5. OSINT RESEARCH FINDINGS (Scout Agent)" />

          {data.researchFindings.slice(0, 12).map((f, i) => (
            <View key={i} style={[s.researchItem, f.isFraudSignal ? s.fraudItem : {}]}>
              <Text style={s.researchType}>
                {f.isFraudSignal ? '⚠ FRAUD SIGNAL · ' : ''}{f.searchType.replace(/_/g, ' ').toUpperCase()}
              </Text>
              <Text style={s.researchSnippet}>{f.snippet.slice(0, 280)}</Text>
              {f.sourceUrl && <Text style={s.researchUrl}>{f.sourceUrl}</Text>}
            </View>
          ))}

          {data.researchFindings.length === 0 && (
            <Text style={{ fontSize: 8, color: C.grey }}>No research findings recorded.</Text>
          )}
        </View>

        {/* Section 6 — Credit Officer Notes */}
        <View style={s.section}>
          <SectionHeader title="6. CREDIT OFFICER FIELD NOTES [QUALITATIVE]" />

          {data.qualitativeNotes.map((n, i) => (
            <View key={i} style={s.noteItem}>
              <Text style={s.noteMeta}>
                [{n.category.replace(/_/g, ' ')} / {n.fiveCDimension}]
                {n.scoreDelta ? `  Score impact: ${n.scoreDelta > 0 ? '+' : ''}${n.scoreDelta}` : ''}
              </Text>
              <Text style={s.noteText}>{n.noteText}</Text>
            </View>
          ))}

          {data.qualitativeNotes.length === 0 && (
            <Text style={{ fontSize: 8, color: C.grey }}>No qualitative notes submitted.</Text>
          )}
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>IntelliCredit AI · {data.companyName}</Text>
          <Text
            style={s.pageNum}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>

      {/* ── PAGE 3: AI Reasoning Trace ──────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        {/* Section 7 — DeepSeek-R1 Thinking Trace */}
        <View style={s.section}>
          <SectionHeader title="7. AI REASONING TRACE (DeepSeek-R1 via Groq)" />
          <Text style={{ fontSize: 7, color: C.grey, marginBottom: 6 }}>
            The following is the raw chain-of-thought reasoning produced by the AI reconciler model.
            It is provided for transparency and audit purposes only.
          </Text>

          {data.thinkingTrace ? (
            <View style={s.thinkBlock}>
              <Text>{data.thinkingTrace.slice(0, 3500)}</Text>
              {data.thinkingTrace.length > 3500 && (
                <Text style={{ color: C.grey, marginTop: 4 }}>
                  … [trace truncated for PDF; full trace available in database]
                </Text>
              )}
            </View>
          ) : (
            <Text style={{ fontSize: 8, color: C.grey }}>No thinking trace captured.</Text>
          )}
        </View>

        {/* Section 8 — Audit Trail */}
        <View style={s.section}>
          <SectionHeader title="8. DATA SOURCE AUDIT TRAIL" />

          <View style={[s.tableRow, s.tableHeader]}>
            <Text style={[s.tableCellBold, { flex: 2 }]}>Signal Domain</Text>
            <Text style={[s.tableCellBold, { flex: 2 }]}>Source</Text>
            <Text style={s.tableCellBold}>Model / Tool</Text>
          </View>

          {[
            ['Bank Statement Analysis', '[Gemini: Bank Statement]', 'gemini-2.5-flash'],
            ['GST Filing Analysis', '[Gemini: GST Returns]', 'gemini-2.5-flash'],
            ['ITR / Balance Sheet', '[Gemini: ITR & B/S]', 'gemini-2.5-flash'],
            ['CIBIL / CMR Score', '[Mistral OCR — CIBIL Report]', 'mistral-ocr-latest'],
            ['OSINT Research', '[Tavily Search API]', 'tavily-search-context'],
            ['Qualitative Notes', '[Credit Officer Input]', 'Human (field officer)'],
            ['Cross-Check Engine', '[Discrepancy Engine]', 'Rule-based (7 checks)'],
            ['Final Decision', '[DeepSeek-R1 Reconciler]', 'deepseek-r1-distill-llama-70b'],
          ].map(([domain, src, model], i) => (
            <View key={i} style={s.tableRow}>
              <Text style={[s.tableCell, { flex: 2 }]}>{domain}</Text>
              <Text style={[s.tableCell, { flex: 2 }]}>{src}</Text>
              <Text style={s.tableCell}>{model}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 7, color: C.grey, lineHeight: 1.5 }}>
            This Credit Appraisal Memo was generated by IntelliCredit AI on{' '}
            {formatDate(data.generatedAt)}. It is intended solely for internal credit committee
            review and does not constitute a binding credit decision. All AI-generated assessments
            must be validated by an authorized credit officer before any disbursement.
          </Text>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>IntelliCredit AI · {data.companyName}</Text>
          <Text
            style={s.pageNum}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
