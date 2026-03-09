/**
 * scout-agent.ts
 * Runs 6 parallel Tavily web searches to surface open-source intelligence
 * (OSINT) signals: court cases, director disqualification, RBI defaults,
 * credit ratings, fraud news, and promoter pledge data.
 *
 * Writes results to:
 *   - DB: research_findings table (one row per source hit)
 *   - Redis blackboard: signals:{appId} hash  (aggregated flags)
 */

import { db } from '@/lib/db/config';
import { researchFindings } from '@/lib/db/schema';
import { redis, redisKeys } from '@/lib/redis';
import type { AgentName, ResearchType } from '@/lib/types';
import { tavilySearchBatch } from './tavily-client';
import type { TavilySearchResult, TavilySearchResponse } from './tavily-client';
import { persistSignals, publishPipelineEvent } from './base-agent';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ScoutFinding {
  searchType: ResearchType;
  query: string;
  sourceUrl: string;
  snippet: string;
  relevanceScore: number;
  isFraudSignal: boolean;
}

export interface ScoutResult {
  appId: string;
  findings: ScoutFinding[];
  fraudSignalCount: number;
  courtCaseCount: number;
  rbiDefaultFlag: boolean;
  wilfulDefaulterFlag: boolean;
  negativePressCount: number;
  promoterDisqualifiedFlag: boolean;
  creditRatingSummary: string | null;
  scoutScore: number;  // 0–100, higher = more risk
}

// ─── Fraud/Default keyword patterns ─────────────────────────────────────────

const FRAUD_KEYWORDS = [
  'fraud', 'scam', 'cheating', 'embezzlement', 'money laundering',
  'ponzi', 'misappropriation', 'forgery', 'siphoning', 'diversion of funds',
];

const DEFAULT_KEYWORDS = [
  'wilful defaulter', 'rbi defaulter', 'npa', 'non-performing asset',
  'write-off', 'written off', 'bad loan', 'insolvency', 'nclt', 'ibc',
  'liquidation', 'drt', 'debt recovery tribunal',
];

const COURT_KEYWORDS = [
  'court case', 'litigation', 'lawsuit', 'suit filed', 'criminal case',
  'ipc', 'fir', 'chargesheet', 'arrested', 'convicted',
];

const CREDIT_RATING_KEYWORDS = [
  'downgrade', 'negative watch', 'credit watch', 'default outlook',
  'rating withdrawn', 'rating suspended',
];

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

function extractRatingMention(results: TavilySearchResult[]): string | null {
  const ratingRegex = /\b(AAA|AA[\+\-]?|A[\+\-]?|BBB[\+\-]?|BB[\+\-]?|B[\+\-]?|C[C]?|D)\b/g;
  for (const r of results) {
    const matches = (r.title + ' ' + r.content).match(ratingRegex);
    if (matches?.length) return matches[0];
  }
  return null;
}

// ─── Main scout agent ─────────────────────────────────────────────────────────

export async function runScoutAgent(
  appId: string,
  companyName: string,
  promoterName?: string,
): Promise<ScoutResult> {
  const agentName: AgentName = 'scout';
  await publishPipelineEvent(appId, 'scout', 'processing');

  const safeCompany = companyName.replace(/['"|]/g, '').trim();
  const safePromoter = (promoterName ?? '').replace(/['"|]/g, '').trim();

  // Skip OSINT search entirely if the company name looks like test data
  const isTestName = safeCompany.length < 4 || /^(test|sample|demo|example|abc|xyz)\b/i.test(safeCompany);
  if (isTestName) {
    console.log(`[scout-agent] Skipping OSINT for test company name: "${safeCompany}"`);
    await publishPipelineEvent(appId, 'scout', 'done', { message: 'Skipped — test company name' });
    return {
      appId,
      findings: [],
      fraudSignalCount: 0,
      courtCaseCount: 0,
      rbiDefaultFlag: false,
      wilfulDefaulterFlag: false,
      negativePressCount: 0,
      promoterDisqualifiedFlag: false,
      creditRatingSummary: null,
      scoutScore: 0,
    };
  }

  // ── Build 6 search queries (short & focused for better results) ──────────
  const queries: Array<{ label: ResearchType; query: string; searchDepth: 'basic' | 'advanced' }> = [
    {
      label: 'ecourts',
      query: `${safeCompany} court case NCLT DRT India`,
      searchDepth: 'basic',
    },
    {
      label: 'mca_din',
      query: safePromoter
        ? `${safePromoter} director disqualified MCA India`
        : `${safeCompany} director disqualified MCA`,
      searchDepth: 'basic',
    },
    {
      label: 'rbi_circular',
      query: `${safeCompany} RBI defaulter NPA wilful defaulter`,
      searchDepth: 'basic',
    },
    {
      label: 'credit_ratings',
      query: `${safeCompany} credit rating CRISIL ICRA CARE`,
      searchDepth: 'basic',
    },
    {
      label: 'news_fraud',
      query: `${safeCompany} fraud scam cheating India news`,
      searchDepth: 'basic',
    },
    {
      label: 'shareholding',
      query: `${safeCompany} promoter shareholding pledge`,
      searchDepth: 'basic',
    },
  ];

  // ── Execute all searches ─────────────────────────────────────────────────
  const resultMap = await tavilySearchBatch(
    queries.map((q) => ({
      label: q.label,
      query: q.query,
      searchDepth: q.searchDepth,
    })),
    5,
  );

  // ── Parse results into findings ──────────────────────────────────────────
  const findings: ScoutFinding[] = [];

  for (const { label } of queries) {
    const response: TavilySearchResponse = resultMap.get(label) ?? {
      query: '',
      results: [],
    };

    for (const hit of response.results) {
      const combinedText = [hit.title, hit.content].join(' ');
      const isFraud =
        containsAny(combinedText, FRAUD_KEYWORDS) ||
        containsAny(combinedText, DEFAULT_KEYWORDS) ||
        (label === 'ecourts' && containsAny(combinedText, COURT_KEYWORDS));

      findings.push({
        searchType: label,
        query: response.query,
        sourceUrl: hit.url,
        snippet: hit.content.slice(0, 800),
        relevanceScore: hit.score,
        isFraudSignal: isFraud,
      });
    }
  }

  // ── Compute summary flags ────────────────────────────────────────────────
  const fraudSignalCount = findings.filter((f) => f.isFraudSignal).length;

  const ecourtsResults = resultMap.get('ecourts')?.results ?? [];
  const courtCaseCount = ecourtsResults.filter((r) =>
    containsAny(r.title + r.content, COURT_KEYWORDS),
  ).length;

  const rbiResults = resultMap.get('rbi_circular')?.results ?? [];
  const rbiDefaultFlag = rbiResults.some((r) =>
    containsAny(r.title + r.content, DEFAULT_KEYWORDS),
  );

  const wilfulDefaulterFlag = rbiResults.some((r) =>
    (r.title + r.content).toLowerCase().includes('wilful defaulter'),
  );

  const newsResults = resultMap.get('news_fraud')?.results ?? [];
  const negativePressCount = newsResults.filter((r) =>
    containsAny(r.title + r.content, [...FRAUD_KEYWORDS, ...DEFAULT_KEYWORDS]),
  ).length;

  const dinResults = resultMap.get('mca_din')?.results ?? [];
  const promoterDisqualifiedFlag = dinResults.some((r) =>
    (r.title + r.content).toLowerCase().includes('disqualif'),
  );

  const ratingResults = resultMap.get('credit_ratings')?.results ?? [];
  const creditRatingSummary = extractRatingMention(ratingResults);
  const negativeRatingFlag = ratingResults.some((r) =>
    containsAny(r.title + r.content, CREDIT_RATING_KEYWORDS),
  );

  // ── Risk score 0–100 ─────────────────────────────────────────────────────
  let scoutScore = 0;
  if (rbiDefaultFlag) scoutScore += 30;
  if (wilfulDefaulterFlag) scoutScore += 25;
  if (promoterDisqualifiedFlag) scoutScore += 20;
  scoutScore += Math.min(courtCaseCount * 5, 15);
  scoutScore += Math.min(fraudSignalCount * 5, 20);
  scoutScore += Math.min(negativePressCount * 3, 10);
  if (negativeRatingFlag) scoutScore += 10;
  scoutScore = Math.min(scoutScore, 100);

  const result: ScoutResult = {
    appId,
    findings,
    fraudSignalCount,
    courtCaseCount,
    rbiDefaultFlag,
    wilfulDefaulterFlag,
    negativePressCount,
    promoterDisqualifiedFlag,
    creditRatingSummary,
    scoutScore,
  };

  // ── Persist findings to DB ───────────────────────────────────────────────
  if (findings.length > 0) {
    try {
      await db.insert(researchFindings).values(
        findings.map((f) => ({
          applicationId: appId,
          searchType: f.searchType,
          query: f.query,
          sourceUrl: f.sourceUrl.slice(0, 500),
          snippet: f.snippet,
          relevanceScore: String(f.relevanceScore.toFixed(3)),
          isFraudSignal: f.isFraudSignal,
        })),
      );
    } catch (e) {
      console.warn('[scout-agent] DB insert failed (non-fatal):', e);
    }
  }

  // ── Persist aggregate signals to Redis + DB ──────────────────────────────
  await persistSignals(appId, agentName, [
    { key: 'scout_score', value: scoutScore, confidence: 0.7 },
    { key: 'fraud_signal_count', value: fraudSignalCount, confidence: 0.7 },
    { key: 'court_case_count', value: courtCaseCount, confidence: 0.7 },
    { key: 'rbi_default_flag', value: rbiDefaultFlag, confidence: 0.75 },
    { key: 'wilful_defaulter_flag', value: wilfulDefaulterFlag, confidence: 0.8 },
    { key: 'negative_press_count', value: negativePressCount, confidence: 0.65 },
    { key: 'promoter_disqualified_flag', value: promoterDisqualifiedFlag, confidence: 0.7 },
    {
      key: 'credit_rating_summary',
      value: creditRatingSummary ?? 'not_found',
      confidence: 0.6,
    },
    { key: 'total_findings', value: findings.length, confidence: 1.0 },
  ]);

  // ── Publish completion event ─────────────────────────────────────────────
  await publishPipelineEvent(appId, 'scout', 'done', {
    scoutScore,
    fraudSignalCount,
    rbiDefaultFlag,
    wilfulDefaulterFlag,
  });

  return result;
}
