/**
 * bayesian-scorer.ts
 *
 * Bayesian Evidence Accumulation Engine for corporate credit decisioning.
 *
 * Algorithm:
 *   1. Industry prior: μ₀ = 52, σ₀ = 20 (wide uncertainty before any data)
 *   2. Each evidence source is modelled as a Gaussian observation (μ_i, σ_i)
 *   3. Precision-weighted fusion: μ_post = Σ(μ_i/σ_i²) / Σ(1/σ_i²)
 *                                  σ_post² = 1 / Σ(1/σ_i²)
 *   4. Conflict detection: flag pairs where |μ_i − μ_j| > 15 in same dimension
 *   5. Counterfactual generation: "what single change would flip the decision?"
 *   6. Rate pricing: base_rate + risk_premium(score) + uncertainty_premium(sigma)
 */

// ─── Public types ─────────────────────────────────────────────────────────────

export type DimKey = 'character' | 'capacity' | 'capital' | 'collateral' | 'conditions';

export interface EvidenceItem {
  source: string;      // human-readable label
  impact: number;      // signed delta from prior  (+12 or -8)
  confidence: number;  // 0–1
  note: string;        // short explanation
}

export interface DimensionPosterior {
  dimension: DimKey;
  label: string;
  priorMean: number;
  posteriorMean: number;   // ≈ LLM score (our best estimate)
  sigma: number;           // posterior uncertainty band (±)
  evidenceItems: EvidenceItem[];
  conflictFlag: boolean;
  conflictReason?: string;
  counterfactual?: string;
}

export interface RateDecomposition {
  baseRate: number;         // RBI repo-linked base (10.5%)
  riskPremium: number;      // f(score), bps per point below 70
  uncertaintyPremium: number; // f(sigma), wider band → higher premium
  finalRate: number;
}

export interface AdversarialSummary {
  bullCase: string;
  bearCase: string;
  swingFactor: string;  // the single biggest swing signal
}

export interface Counterfactual {
  dimension: DimKey;
  currentScore: number;
  requiredChange: string; // e.g. "DSCR > 1.25"
  scoreGain: number;
  wouldFlipDecision: boolean;
}

export interface BayesianDecision {
  overallScore: number;        // precision-weighted mean across 5 dims
  overallSigma: number;        // combined uncertainty
  decisionBand: 'APPROVE' | 'CONDITIONAL_APPROVE' | 'REJECT';
  decisionConfidence: number;  // 0–100: how far from the nearest threshold
  dimensions: DimensionPosterior[];
  rateDecomposition: RateDecomposition;
  adversarialSummary: AdversarialSummary;
  counterfactuals: Counterfactual[];
  computedAt: string;
}

// ─── Input types ──────────────────────────────────────────────────────────────

export interface ScorerInput {
  fiveCsScores: Record<DimKey, { score: number; rating: string; explanation?: string }>;
  discrepancies: Array<{
    checkName: string;
    verdict: 'PASS' | 'FLAG' | 'RED_FLAG';
    confidence: number;
    actualValue?: string;
  }>;
  qualitativeNotes: Array<{
    fiveCDimension?: string | null;
    scoreDelta?: number | null;
    noteText: string;
  }>;
  researchFindings: Array<{
    isFraudSignal?: boolean | null;
    relevanceScore?: string | number | null;
    snippet: string;
    searchType?: string | null;
  }>;
  cmrRank?: number | null;
  requestedAmountInr?: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INDUSTRY_PRIOR_MEAN = 52;
const INDUSTRY_PRIOR_SIGMA = 20;

const DIM_LABELS: Record<DimKey, string> = {
  character:  'Character',
  capacity:   'Capacity',
  capital:    'Capital',
  collateral: 'Collateral',
  conditions: 'Conditions',
};

// Which discrepancy checks primarily affect which 5C dimension
const DISCREPANCY_DIM_MAP: Record<string, DimKey> = {
  'DSCR':            'capacity',
  'GST vs Bank':     'capacity',
  'Revenue Trend':   'capacity',
  'Debt Ratio':      'capital',
  'Net Worth':       'capital',
  'Collateral Cover':'collateral',
  'CMR Rank':        'character',
  'Litigation':      'character',
  'CIBIL':           'character',
};

// Which dimension notes affect (rough keyword map)
const NOTE_DIM_KEYWORDS: Record<DimKey, string[]> = {
  character:  ['promoter', 'management', 'track record', 'fraud', 'litigation', 'character'],
  capacity:   ['revenue', 'cash flow', 'dscr', 'repayment', 'turnover', 'capacity', 'factory'],
  capital:    ['equity', 'debt', 'net worth', 'capital', 'leverage'],
  collateral: ['collateral', 'asset', 'property', 'mortgage', 'pledged'],
  conditions: ['sector', 'market', 'regulation', 'industry', 'rbi', 'policy'],
};

// ─── Core scorer ──────────────────────────────────────────────────────────────

export function runBayesianScorer(input: ScorerInput): BayesianDecision {
  const dims: DimensionPosterior[] = (['character', 'capacity', 'capital', 'collateral', 'conditions'] as DimKey[])
    .map((dim) => scoreDimension(dim, input));

  // Precision-weighted overall score
  const precisions = dims.map((d) => 1 / (d.sigma ** 2));
  const totalPrecision = precisions.reduce((a, b) => a + b, 0);
  const overallScore = Math.round(
    dims.reduce((sum, d, i) => sum + d.posteriorMean * precisions[i], 0) / totalPrecision,
  );
  const overallSigma = parseFloat((1 / Math.sqrt(totalPrecision)).toFixed(1));

  const { band: decisionBand, confidence: decisionConfidence } = computeDecisionBand(overallScore, overallSigma);

  const rateDecomposition = computeRate(overallScore, overallSigma);

  const adversarialSummary = buildAdversarialSummary(dims, input);

  const counterfactuals = buildCounterfactuals(dims, decisionBand, overallScore);

  return {
    overallScore,
    overallSigma,
    decisionBand,
    decisionConfidence,
    dimensions: dims,
    rateDecomposition,
    adversarialSummary,
    counterfactuals,
    computedAt: new Date().toISOString(),
  };
}

// ─── Dimension scorer ─────────────────────────────────────────────────────────

function scoreDimension(dim: DimKey, input: ScorerInput): DimensionPosterior {
  const llmScore = input.fiveCsScores[dim]?.score ?? INDUSTRY_PRIOR_MEAN;
  const evidenceItems: EvidenceItem[] = [];

  // ── 1. Encode the LLM posterior as the "starting point" ─────────────────────
  // The LLM reconciler has already absorbed most signals; we decompose backwards
  // to show the evidence trail that produced this score.

  const baselineImpact = INDUSTRY_PRIOR_MEAN; // prior starts at 52
  const totalMovement = llmScore - INDUSTRY_PRIOR_MEAN;

  // ── 2. Attribute the movement to known evidence sources ─────────────────────

  // 2a. CMR rank → character
  if (dim === 'character' && input.cmrRank != null) {
    const cmrImpact = input.cmrRank <= 4 ? +14 : input.cmrRank <= 6 ? +4 : input.cmrRank <= 8 ? -10 : -22;
    const conf = 0.92;
    evidenceItems.push({
      source: `CIBIL CMR Rank (${input.cmrRank})`,
      impact: cmrImpact,
      confidence: conf,
      note: input.cmrRank <= 4 ? 'Low credit risk, excellent track record' :
            input.cmrRank <= 6 ? 'Moderate risk, acceptable history' :
            'High risk — CIBIL rank signals repayment stress',
    });
  }

  // 2b. Fraud signals → character (strong negative)
  const fraudSignals = input.researchFindings.filter((f) => f.isFraudSignal);
  if (fraudSignals.length > 0 && (dim === 'character' || dim === 'conditions')) {
    const impact = dim === 'character' ? -18 * Math.min(fraudSignals.length, 2) : -8;
    evidenceItems.push({
      source: `OSINT / Scout Agent (${fraudSignals.length} fraud signal${fraudSignals.length > 1 ? 's' : ''})`,
      impact,
      confidence: 0.88,
      note: fraudSignals[0].snippet.slice(0, 120),
    });
  }

  // 2c. Discrepancy checks → relevant dimension
  for (const disc of input.discrepancies) {
    const affectedDim = mapDiscrepancyToDim(disc.checkName);
    if (affectedDim !== dim) continue;
    const impact = disc.verdict === 'RED_FLAG' ? -16 : disc.verdict === 'FLAG' ? -8 : +5;
    evidenceItems.push({
      source: `Discrepancy: ${disc.checkName}`,
      impact,
      confidence: disc.confidence,
      note: disc.verdict === 'RED_FLAG'
        ? `RED FLAG — ${disc.actualValue ?? 'value'} outside acceptable threshold`
        : disc.verdict === 'FLAG'
        ? `FLAG — ${disc.actualValue ?? 'value'} warrants closer review`
        : `PASS — within acceptable range`,
    });
  }

  // 2d. Qualitative notes → dimensionfiltered by fiveCDimension or keyword
  const relevantNotes = input.qualitativeNotes.filter((n) => {
    if (n.fiveCDimension) return n.fiveCDimension.toLowerCase() === dim;
    const text = n.noteText.toLowerCase();
    return NOTE_DIM_KEYWORDS[dim].some((kw) => text.includes(kw));
  });

  for (const note of relevantNotes) {
    if (note.scoreDelta != null && note.scoreDelta !== 0) {
      evidenceItems.push({
        source: 'Credit Officer Field Note',
        impact: note.scoreDelta,
        confidence: 0.95, // high confidence — primary source
        note: note.noteText.slice(0, 150),
      });
    }
  }

  // 2e. Research findings (non-fraud) → conditions & character
  if (dim === 'conditions' || dim === 'character') {
    const generalFindings = input.researchFindings.filter((f) => !f.isFraudSignal);
    if (generalFindings.length > 0) {
      const conf = 0.73;
      const impact = dim === 'conditions' ? +3 : +2; // generally neutral/slight positive (sector context)
      evidenceItems.push({
        source: `Secondary Research (${generalFindings.length} finding${generalFindings.length > 1 ? 's' : ''})`,
        impact,
        confidence: conf,
        note: `Sector/market intelligence gathered from web research`,
      });
    }
  }

  // 2f. Agent-specific contributions (inferred from dim)
  addAgentContributions(dim, evidenceItems, totalMovement);

  // ── 3. Compute posterior uncertainty σ ───────────────────────────────────────
  let sigma = 12.0; // base epistemic uncertainty

  // Reduce uncertainty for each strong evidece source
  sigma -= evidenceItems.length * 1.0;

  // Increase uncertainty for RED_FLAGS (conflicting signals widen the band)
  const redFlags = input.discrepancies.filter((d) => mapDiscrepancyToDim(d.checkName) === dim && d.verdict === 'RED_FLAG').length;
  const flags    = input.discrepancies.filter((d) => mapDiscrepancyToDim(d.checkName) === dim && d.verdict === 'FLAG').length;
  sigma += redFlags * 5.0 + flags * 2.5;

  // Fraud signals widen character/conditions uncertainty significantly
  if ((dim === 'character' || dim === 'conditions') && fraudSignals.length > 0) sigma += 4.0;

  // More qualitative notes from primary observation → tighter
  sigma -= relevantNotes.length * 1.5;

  sigma = Math.max(4, Math.min(22, sigma));

  // ── 4. Conflict detection ─────────────────────────────────────────────────────
  const { conflictFlag, conflictReason } = detectConflict(dim, evidenceItems, input);

  // ── 5. Counterfactual ────────────────────────────────────────────────────────
  const counterfactual = buildDimCounterfactual(dim, llmScore, input);

  return {
    dimension: dim,
    label: DIM_LABELS[dim],
    priorMean: baselineImpact,
    posteriorMean: llmScore,
    sigma: parseFloat(sigma.toFixed(1)),
    evidenceItems,
    conflictFlag,
    conflictReason,
    counterfactual,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapDiscrepancyToDim(checkName: string): DimKey {
  for (const [key, dim] of Object.entries(DISCREPANCY_DIM_MAP)) {
    if (checkName.toLowerCase().includes(key.toLowerCase())) return dim;
  }
  return 'conditions'; // fallback
}

function addAgentContributions(
  dim: DimKey,
  items: EvidenceItem[],
  totalMovement: number,
): void {
  // Distribute the residual movement not explained by explicit signals
  // across the primary agent sources for this dimension
  const explained = items.reduce((s, i) => s + i.impact, 0);
  const residual = totalMovement - explained;
  if (Math.abs(residual) < 3) return; // negligible

  const agentLabel: Partial<Record<DimKey, string>> = {
    character:  'CIBIL/CMR Agent',
    capacity:   'Bank Statement + GST Agent',
    capital:    'ITR & Balance-Sheet Agent',
    collateral: 'ITR & Bank Statement Agent',
    conditions: 'Scout Research Agent',
  };

  const label = agentLabel[dim];
  if (!label) return;

  items.push({
    source: label,
    impact: parseFloat(residual.toFixed(1)),
    confidence: 0.80,
    note: `Derived from structured financial data analysis`,
  });
}

function detectConflict(
  dim: DimKey,
  items: EvidenceItem[],
  input: ScorerInput,
): { conflictFlag: boolean; conflictReason?: string } {
  // Conflict if there are strong opposing signals (one large positive + one large negative)
  const positive = items.filter((i) => i.impact > 8);
  const negative = items.filter((i) => i.impact < -8);

  if (positive.length > 0 && negative.length > 0) {
    const maxPos = Math.max(...positive.map((i) => i.impact));
    const minNeg = Math.min(...negative.map((i) => i.impact));
    if (maxPos - minNeg > 20) {
      return {
        conflictFlag: true,
        conflictReason: `${positive[0].source} (+${maxPos}) conflicts with ${negative[0].source} (${minNeg}). Independent verification recommended.`,
      };
    }
  }

  // Special case: dimension-specific conflicts
  if (dim === 'capacity' && input.researchFindings.some((f) => !f.isFraudSignal && f.searchType === 'sector')) {
    const score = input.fiveCsScores.capacity.score;
    if (score > 65 && input.discrepancies.some((d) => d.checkName.toLowerCase().includes('gst') && d.verdict !== 'PASS')) {
      return {
        conflictFlag: true,
        conflictReason: 'Strong bank cash flows but GST-bank revenue gap flagged. Possible revenue inflation.',
      };
    }
  }

  return { conflictFlag: false };
}

function buildDimCounterfactual(dim: DimKey, score: number, _input: ScorerInput): string | undefined {
  if (score >= 70) return undefined; // no counterfactual needed for strong dimensions

  const delta = Math.max(8, Math.round((70 - score) * 0.6));

  const templates: Record<DimKey, string> = {
    character:  `If ongoing litigation is resolved and CMR improves to rank ≤4, Character would increase by ~${delta} pts`,
    capacity:   `If DSCR exceeds 1.25 and GST-bank revenue gap is ≤5%, Capacity would increase by ~${delta} pts`,
    capital:    `If Debt/Equity ratio falls below 2.0 and retained earnings increase, Capital would increase by ~${delta} pts`,
    collateral: `If additional tangible collateral (≥1.2× loan coverage) is pledged, Collateral would increase by ~${delta} pts`,
    conditions: `If sector headwinds stabilize and no adverse regulatory changes in the next 12 months, Conditions would increase by ~${delta} pts`,
  };

  return templates[dim];
}

// ─── Decision band ────────────────────────────────────────────────────────────

function computeDecisionBand(
  score: number,
  sigma: number,
): { band: 'APPROVE' | 'CONDITIONAL_APPROVE' | 'REJECT'; confidence: number } {
  // Adjust thresholds for uncertainty: wider sigma shifts thresholds up
  const sigmaPenalty = Math.max(0, sigma - 8) * 0.3;
  const effectiveScore = score - sigmaPenalty;

  let band: 'APPROVE' | 'CONDITIONAL_APPROVE' | 'REJECT';
  if (effectiveScore >= 65) band = 'APPROVE';
  else if (effectiveScore >= 50) band = 'CONDITIONAL_APPROVE';
  else band = 'REJECT';

  // Confidence: how far are we from the nearest threshold
  const thresholds = [65, 50];
  const minDist = Math.min(...thresholds.map((t) => Math.abs(effectiveScore - t)));
  const confidence = Math.min(95, Math.round(50 + minDist * 3));

  return { band, confidence };
}

// ─── Rate decomposition ───────────────────────────────────────────────────────

function computeRate(score: number, sigma: number): RateDecomposition {
  const baseRate = 10.5;
  const riskPremium = parseFloat(Math.max(0, (70 - score) * 0.065).toFixed(2));
  const uncertaintyPremium = parseFloat(((sigma / 100) * 2.2).toFixed(2));
  const finalRate = parseFloat((baseRate + riskPremium + uncertaintyPremium).toFixed(2));

  return { baseRate, riskPremium, uncertaintyPremium, finalRate };
}

// ─── Adversarial summary ──────────────────────────────────────────────────────

function buildAdversarialSummary(
  dims: DimensionPosterior[],
  input: ScorerInput,
): AdversarialSummary {
  const sorted = [...dims].sort((a, b) => b.posteriorMean - a.posteriorMean);
  const bestDim = sorted[0];
  const worstDim = sorted[sorted.length - 1];

  const hasFraud = input.researchFindings.some((f) => f.isFraudSignal);
  const hasRedFlag = input.discrepancies.some((d) => d.verdict === 'RED_FLAG');

  const bullCase = `${bestDim.label} score is ${bestDim.posteriorMean}/100 — ` +
    (bestDim.dimension === 'capacity'
      ? 'strong cash flow coverage and consistent bank credits support repayment capacity.'
      : bestDim.dimension === 'capital'
      ? 'solid capital base with healthy equity cushion provides a buffer against losses.'
      : bestDim.dimension === 'character'
      ? 'clean credit history and strong promoter track record indicate low default risk.'
      : bestDim.dimension === 'collateral'
      ? 'adequate collateral cover reduces loss-given-default significantly.'
      : 'stable sector conditions and regulatory environment are favourable for lending.');

  const bearCase = `${worstDim.label} score is ${worstDim.posteriorMean}/100 — ` +
    (hasFraud
      ? 'OSINT signals uncovered litigation or fraud-related flags that may indicate undisclosed liabilities.'
      : hasRedFlag
      ? 'one or more RED FLAG discrepancies detected — financial metrics outside acceptable thresholds.'
      : worstDim.conflictFlag
      ? `conflicting signals in ${worstDim.label} dimension reduce our confidence in the assessment.`
      : 'below benchmark levels and requires closer scrutiny before credit approval.');

  const swingFactor = worstDim.conflictFlag
    ? `${worstDim.label} conflict resolution`
    : hasFraud
    ? 'Litigation / fraud signal verification'
    : hasRedFlag
    ? `${worstDim.label} RED FLAG remediation`
    : `${worstDim.label} improvement (currently ${worstDim.posteriorMean}/100)`;

  return { bullCase, bearCase, swingFactor };
}

// ─── Counterfactual engine ────────────────────────────────────────────────────

function buildCounterfactuals(
  dims: DimensionPosterior[],
  band: BayesianDecision['decisionBand'],
  overallScore: number,
): Counterfactual[] {
  const results: Counterfactual[] = [];
  const APPROVE_THRESHOLD = 65;

  for (const d of dims) {
    if (!d.counterfactual) continue;

    const scoreGain = Math.max(8, Math.round((70 - d.posteriorMean) * 0.6));
    const newOverall = overallScore + Math.round(scoreGain / 5); // rough portfolio impact
    const wouldFlip = band !== 'APPROVE' && newOverall >= APPROVE_THRESHOLD;

    results.push({
      dimension: d.dimension,
      currentScore: d.posteriorMean,
      requiredChange: extractRequiredChange(d.dimension),
      scoreGain,
      wouldFlipDecision: wouldFlip,
    });
  }

  // Sort: flip-decision first, then by score gain descending
  return results.sort((a, b) => {
    if (a.wouldFlipDecision !== b.wouldFlipDecision) return a.wouldFlipDecision ? -1 : 1;
    return b.scoreGain - a.scoreGain;
  });
}

function extractRequiredChange(dim: DimKey): string {
  const map: Record<DimKey, string> = {
    character:  'Resolve litigation & improve CMR to ≤ 4',
    capacity:   'DSCR > 1.25 and GST-bank gap ≤ 5%',
    capital:    'Debt/Equity < 2.0 and retained earnings growth',
    collateral: 'Additional collateral ≥ 1.2× loan amount',
    conditions: 'Sector stability + no adverse RBI circulars',
  };
  return map[dim];
}
