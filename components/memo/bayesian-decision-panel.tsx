'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  CheckCircle2, XCircle, AlertTriangle,
  TrendingUp, TrendingDown, ChevronDown, ChevronUp,
  Zap, Scale, Clock, ChevronRight,
  ThumbsUp, ThumbsDown, FileQuestion,
} from 'lucide-react';
import type { BayesianDecision, DimKey } from '@/lib/scoring/bayesian-scorer';

interface BayesianDecisionPanelProps {
  data: BayesianDecision;
  onAccept?: () => void;
  onOverride?: (verdict: 'approve' | 'reject', reason: string) => void;
  onRequestDocs?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Dimension weights (mirrors bayesian-scorer.ts precision calculus)
const DIM_WEIGHTS: Record<DimKey, number> = {
  character: 25,
  capacity: 25,
  capital: 20,
  collateral: 15,
  conditions: 15,
};

const DIM_META: Record<DimKey, { label: string; bar: string; text: string; bg: string; border: string }> = {
  character: { label: 'Character', bar: 'bg-violet-500', text: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
  capacity: { label: 'Capacity', bar: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  capital: { label: 'Capital', bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  collateral: { label: 'Collateral', bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  conditions: { label: 'Conditions', bar: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
};

function bandMeta(band: BayesianDecision['decisionBand']) {
  if (band === 'APPROVE') return { label: 'Approved', Icon: CheckCircle2, text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300', badge: 'bg-emerald-600', barCls: 'bg-emerald-500' };
  if (band === 'CONDITIONAL_APPROVE') return { label: 'Conditionally Approved', Icon: AlertTriangle, text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300', badge: 'bg-amber-500', barCls: 'bg-amber-500' };
  return { label: 'Rejected', Icon: XCircle, text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300', badge: 'bg-red-600', barCls: 'bg-red-500' };
}

function bandFromScore(score: number): BayesianDecision['decisionBand'] {
  if (score >= 65) return 'APPROVE';
  if (score >= 50) return 'CONDITIONAL_APPROVE';
  return 'REJECT';
}

function scoreLabel(s: number): { label: string; cls: string } {
  if (s >= 70) return { label: 'Strong', cls: 'text-emerald-600 bg-emerald-50 border border-emerald-200' };
  if (s >= 50) return { label: 'Moderate', cls: 'text-amber-600   bg-amber-50   border border-amber-200' };
  return { label: 'Weak', cls: 'text-red-600     bg-red-50     border border-red-200' };
}

function scoreBarColor(s: number) {
  return s >= 70 ? 'bg-emerald-500' : s >= 50 ? 'bg-amber-500' : 'bg-red-500';
}

function formatRelativeTime(iso: string): { text: string; isStale: boolean } {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = diff / (1000 * 60 * 60);
  const days = hours / 24;
  if (hours < 1) return { text: 'just now', isStale: false };
  if (hours < 24) return { text: `${Math.floor(hours)}h ago`, isStale: false };
  return { text: `${Math.floor(days)}d ago`, isStale: true };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BayesianDecisionPanel({ data, onAccept, onOverride, onRequestDocs }: BayesianDecisionPanelProps) {
  const [showActions, setShowActions] = useState(true);
  const [expandedDim, setExpandedDim] = useState<DimKey | null>(null);
  const [overrideMode, setOverrideMode] = useState<'approve' | 'reject' | null>(null);
  const [overrideReason, setOverrideReason] = useState('');

  const bm = bandMeta(data.decisionBand);
  const { Icon: BandIcon } = bm;

  const flipActions = data.counterfactuals.filter((c) => c.wouldFlipDecision);
  const otherActions = data.counterfactuals.filter((c) => !c.wouldFlipDecision);

  const { text: computedText, isStale } = formatRelativeTime(data.computedAt);
  const conflictDims = data.dimensions.filter((d) => d.conflictFlag);
  const isHighUncertainty = data.overallSigma > 12;

  // Rate bar widths
  const totalRate = data.rateDecomposition.finalRate;
  const basePct = (data.rateDecomposition.baseRate / totalRate) * 100;
  const riskPct = (data.rateDecomposition.riskPremium / totalRate) * 100;
  const uncPct = (data.rateDecomposition.uncertaintyPremium / totalRate) * 100;

  const hasCtas = onAccept || onOverride || onRequestDocs;

  return (
    <div className="space-y-5">

      {/* ── 1. Conflict Alert Banner ───────────────────────────────────────── */}
      {conflictDims.length > 0 && (
        <div className={`rounded-xl border-2 px-4 py-3 space-y-1.5 ${conflictDims.length >= 2 ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'
          }`}>
          <p className={`text-xs font-bold flex items-center gap-1.5 ${conflictDims.length >= 2 ? 'text-red-700' : 'text-amber-700'
            }`}>
            <AlertTriangle className="h-3.5 w-3.5" />
            {conflictDims.length >= 2 ? 'Multiple Data Conflicts Detected' : 'Data Conflict Detected'}
          </p>
          {conflictDims.map((d) => (
            <p key={d.dimension} className="text-xs text-gray-700 leading-relaxed">
              <span className={`font-semibold ${DIM_META[d.dimension].text}`}>
                {DIM_META[d.dimension].label}:
              </span>{' '}
              {d.conflictReason ?? 'Conflicting signals from multiple sources — verify manually.'}
            </p>
          ))}
        </div>
      )}

      {/* ── 2. Verdict Card: Decision + Score (with ±σ) + Rate (with breakdown) ── */}
      <div className={`rounded-2xl border-2 ${bm.border} ${bm.bg} p-5`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-stretch gap-5">

          {/* Decision + staleness */}
          <div className="flex items-center gap-4 flex-1">
            <div className={`${bm.badge} rounded-2xl p-3 shrink-0`}>
              <BandIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="text-xs text-gray-500 font-medium">AI Credit Decision</p>
                {/* 8. Staleness indicator */}
                <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${isStale
                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
                    : 'bg-gray-100 text-gray-500'
                  }`}>
                  <Clock className="h-2.5 w-2.5" />
                  {computedText}
                  {isStale && ' · re-run recommended'}
                </span>
              </div>
              <p className={`text-2xl font-extrabold ${bm.text}`}>{bm.label}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-1.5 w-32 rounded-full bg-black/10 overflow-hidden">
                  <div className={`h-full ${bm.barCls}`} style={{ width: `${data.decisionConfidence}%` }} />
                </div>
                <span className="text-xs font-semibold text-gray-600">{data.decisionConfidence}% AI confidence</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:block w-px bg-black/10" />

          {/* Credit Score with ±sigma */}
          <div className="flex flex-col justify-center text-center px-4 min-w-[110px]">
            <p className="text-xs text-gray-500 font-medium mb-1">Credit Score</p>
            <div className="flex items-baseline justify-center gap-1">
              <p className={`text-4xl font-extrabold leading-none ${data.overallScore >= 70 ? 'text-emerald-600' : data.overallScore >= 50 ? 'text-amber-500' : 'text-red-600'
                }`}>{data.overallScore}</p>
              {/* 1. Uncertainty band */}
              <span className={`text-sm font-semibold ${isHighUncertainty ? 'text-orange-500' : 'text-gray-400'}`}>
                ±{data.overallSigma}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">out of 100</p>
            {isHighUncertainty && (
              <span className="mt-1.5 text-[10px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5 leading-tight">
                High uncertainty
              </span>
            )}
          </div>

          <div className="hidden sm:block w-px bg-black/10" />

          {/* Rate with decomposition bar */}
          <div className="flex flex-col justify-center px-4 min-w-[150px]">
            <p className="text-xs text-gray-500 font-medium mb-1 text-center">Recommended Rate</p>
            <p className="text-4xl font-extrabold leading-none text-blue-700 text-center">
              {data.rateDecomposition.finalRate.toFixed(2)}%
            </p>
            <p className="text-xs text-gray-400 mt-1 text-center">per annum</p>
            {/* 2. Rate decomposition bar */}
            <div className="mt-2.5 space-y-1.5">
              <div className="flex rounded-full overflow-hidden h-2">
                <div className="bg-slate-400 transition-all" style={{ width: `${basePct}%` }} />
                <div className="bg-orange-400 transition-all" style={{ width: `${riskPct}%` }} />
                <div className="bg-purple-400 transition-all" style={{ width: `${uncPct}%` }} />
              </div>
              <div className="flex items-center justify-center gap-2.5 flex-wrap">
                <span className="flex items-center gap-1 text-[9px] text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                  Base {data.rateDecomposition.baseRate}%
                </span>
                <span className="flex items-center gap-1 text-[9px] text-orange-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                  +{data.rateDecomposition.riskPremium.toFixed(2)}% risk
                </span>
                <span className="flex items-center gap-1 text-[9px] text-purple-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                  +{data.rateDecomposition.uncertaintyPremium.toFixed(2)}% uncertainty
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── 7. Decision Zone Gauge ─────────────────────────────────────────── */}
      <Card className="px-5 py-4">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-xs font-bold text-gray-700">Score Position</p>
          {data.decisionBand !== 'APPROVE' && (
            <p className="text-xs text-gray-500">
              <span className="font-semibold text-gray-800">
                +{data.decisionBand === 'REJECT' ? Math.max(0, 50 - data.overallScore) : Math.max(0, 65 - data.overallScore)} pts
              </span>{' '}
              needed for{' '}
              <span className={`font-semibold ${data.decisionBand === 'REJECT' ? 'text-amber-600' : 'text-emerald-600'}`}>
                {data.decisionBand === 'REJECT' ? 'Conditional Approve' : 'Approve'}
              </span>
            </p>
          )}
        </div>
        <div className="relative h-7">
          {/* Zone bands */}
          <div className="absolute inset-0 flex rounded-lg overflow-hidden">
            <div className="bg-red-100" style={{ width: '50%' }} />
            <div className="bg-amber-100" style={{ width: '15%' }} />
            <div className="bg-emerald-100" style={{ width: '35%' }} />
          </div>
          {/* Zone labels */}
          <div className="absolute inset-0 flex items-center pointer-events-none">
            <span className="text-[9px] font-bold text-red-400 text-center" style={{ width: '50%' }}>REJECT</span>
            <span className="text-[9px] font-bold text-amber-500 text-center" style={{ width: '15%' }}>COND.</span>
            <span className="text-[9px] font-bold text-emerald-600 text-center" style={{ width: '35%' }}>APPROVE</span>
          </div>
          {/* Threshold lines */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-amber-400/60" style={{ left: '50%' }} />
          <div className="absolute top-0 bottom-0 w-0.5 bg-emerald-500/60" style={{ left: '65%' }} />
          {/* Score pointer */}
          <div
            className="absolute top-0 bottom-0 flex items-center justify-center"
            style={{ left: `${Math.min(Math.max(data.overallScore, 1.5), 98.5)}%`, transform: 'translateX(-50%)' }}
          >
            <div className={`w-5 h-7 rounded shadow-md flex items-center justify-center ${data.overallScore >= 65 ? 'bg-emerald-600' : data.overallScore >= 50 ? 'bg-amber-500' : 'bg-red-600'
              }`}>
              <span className="text-[8px] font-extrabold text-white leading-none">{data.overallScore}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-1 px-0.5">
          <span className="text-[9px] text-gray-400">0</span>
          <span className="text-[9px] text-amber-500 font-semibold" style={{ marginLeft: 'calc(50% - 20px)' }}>50</span>
          <span className="text-[9px] text-emerald-600 font-semibold" style={{ marginLeft: 'calc(15% - 16px)' }}>65</span>
          <span className="text-[9px] text-gray-400">100</span>
        </div>
      </Card>

      {/* ── 3 + 4 + 5. Credit Profile with weights, evidence accordion, conflict ── */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-gray-800">Credit Profile</p>
          <p className="text-[10px] text-gray-400">Click any row to see evidence</p>
        </div>
        <div className="space-y-1.5">
          {data.dimensions.map((dim) => {
            const m = DIM_META[dim.dimension];
            const sl = scoreLabel(dim.posteriorMean);
            const weight = DIM_WEIGHTS[dim.dimension];
            const isExpanded = expandedDim === dim.dimension;
            const contribution = Math.round(dim.posteriorMean * weight / 100);
            return (
              <div
                key={dim.dimension}
                className={`rounded-xl border transition-all duration-200 ${isExpanded ? `${m.border} ${m.bg}` : 'border-transparent hover:border-gray-100 hover:bg-gray-50/50'
                  }`}
              >
                {/* Row header — always visible */}
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                  onClick={() => setExpandedDim(isExpanded ? null : dim.dimension)}
                >
                  {/* 3. Weight label */}
                  <span className={`text-xs font-semibold w-20 shrink-0 ${m.text}`}>{m.label}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${scoreBarColor(dim.posteriorMean)}`}
                      style={{ width: `${dim.posteriorMean}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-6 text-right shrink-0">{dim.posteriorMean}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-16 text-center shrink-0 ${sl.cls}`}>
                    {sl.label}
                  </span>
                  <span className="text-[10px] text-gray-400 w-7 text-right shrink-0 font-medium">{weight}%</span>
                  {dim.conflictFlag && (
                    <AlertTriangle className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                  )}
                  {isExpanded
                    ? <ChevronUp className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    : <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  }
                </button>

                {/* 4. Evidence accordion */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3">
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Score {dim.posteriorMean} × {weight}% weight ={' '}
                      <span className="font-semibold text-gray-700">{contribution} pts</span> contributed to overall score
                      {data.overallSigma > 0 && (
                        <span className="text-gray-400"> · uncertainty ±{dim.sigma.toFixed(1)}</span>
                      )}
                    </p>

                    {dim.evidenceItems.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Evidence Sources</p>
                        {dim.evidenceItems.map((ev, i) => (
                          <div key={i} className="flex items-start gap-3 rounded-lg bg-white/80 border border-white/90 shadow-sm px-3 py-2">
                            <div className={`mt-0.5 w-1 rounded-full self-stretch shrink-0 min-h-4 ${ev.impact >= 0 ? 'bg-emerald-400' : 'bg-red-400'
                              }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold text-gray-700">{ev.source}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{ev.note}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`text-xs font-extrabold ${ev.impact >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {ev.impact >= 0 ? '+' : ''}{ev.impact}
                              </p>
                              <p className="text-[9px] text-gray-400">{Math.round(ev.confidence * 100)}% conf</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Strengths & Concerns ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4 border-l-4 border-emerald-500">
          <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 mb-3">
            <TrendingUp className="h-3.5 w-3.5" /> What Works in Their Favour
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">{data.adversarialSummary.bullCase}</p>
        </Card>
        <Card className="p-4 border-l-4 border-red-400">
          <p className="text-xs font-bold text-red-700 flex items-center gap-1.5 mb-3">
            <TrendingDown className="h-3.5 w-3.5" /> Key Concerns
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">{data.adversarialSummary.bearCase}</p>
        </Card>
      </div>

      {/* Swing factor */}
      <div className="flex items-start gap-2.5 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
        <Scale className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-800">Critical Factor: </span>
          {data.adversarialSummary.swingFactor}
        </p>
      </div>

      {/* ── 6. Actions to Improve (with projected outcome) ───────────────────── */}
      {data.counterfactuals.length > 0 && (
        <Card className="p-4">
          <button
            onClick={() => setShowActions((v) => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <p className="text-sm font-bold text-gray-800">Actions That Could Change the Outcome</p>
            {showActions
              ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
              : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
          </button>

          {showActions && (
            <div className="mt-4 space-y-3">
              {/* Decision-flipping actions */}
              {flipActions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1">
                    <Zap className="h-3 w-3" /> These actions would change the decision
                  </p>
                  {flipActions.map((cf) => {
                    const m = DIM_META[cf.dimension];
                    const newScore = Math.min(100, cf.currentScore + cf.scoreGain);
                    const newBand = bandMeta(bandFromScore(newScore));
                    return (
                      <div key={cf.dimension} className={`rounded-xl border ${m.border} ${m.bg} p-3 flex items-start gap-3`}>
                        <div className={`w-1.5 rounded-full ${m.bar} shrink-0 self-stretch min-h-4`} />
                        <div className="flex-1">
                          <p className={`text-xs font-bold ${m.text} mb-0.5`}>{m.label}</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{cf.requiredChange}</p>
                          {/* 6. Projected outcome */}
                          <div className="mt-2 flex items-center gap-1.5 flex-wrap text-[11px]">
                            <span className="text-gray-400">Current</span>
                            <span className={`font-semibold ${bm.text}`}>
                              {data.decisionBand.replace('_', ' ')} ({data.overallScore})
                            </span>
                            <ChevronRight className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-400">After fix</span>
                            <span className={`font-bold px-1.5 py-0.5 rounded-md ${newBand.bg} ${newBand.text} border ${newBand.border}`}>
                              {newBand.label} ({newScore})
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-gray-400">Score gain</p>
                          <p className="text-base font-extrabold text-emerald-600">+{cf.scoreGain}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Non-flipping improvements */}
              {otherActions.length > 0 && (
                <div className="space-y-2">
                  {flipActions.length > 0 && (
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Other improvements</p>
                  )}
                  {otherActions.map((cf) => {
                    const m = DIM_META[cf.dimension];
                    const newScore = Math.min(100, cf.currentScore + cf.scoreGain);
                    const newBand = bandMeta(bandFromScore(newScore));
                    return (
                      <div key={cf.dimension} className="rounded-xl border border-gray-200 bg-gray-50 p-3 flex items-start gap-3">
                        <div className={`w-1.5 rounded-full ${m.bar} shrink-0 self-stretch min-h-4`} />
                        <div className="flex-1">
                          <p className={`text-xs font-bold ${m.text} mb-0.5`}>{m.label}</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{cf.requiredChange}</p>
                          <div className="mt-2 flex items-center gap-1.5 flex-wrap text-[11px]">
                            <span className="text-gray-400">Score after fix:</span>
                            <span className={`font-semibold ${newBand.text}`}>{newScore}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-semibold ${newBand.bg} ${newBand.border} ${newBand.text}`}>
                              still {newBand.label}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-gray-400">Score gain</p>
                          <p className="text-base font-extrabold text-emerald-600">+{cf.scoreGain}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* ── 9. Officer Decision CTAs ──────────────────────────────────────────── */}
      {hasCtas && (
        <Card className="p-4">
          <p className="text-sm font-bold text-gray-800 mb-0.5">Your Decision</p>
          <p className="text-xs text-gray-500 mb-4">
            Accept the AI recommendation or override with your own judgement.
          </p>

          {overrideMode === null ? (
            <div className="flex flex-col sm:flex-row gap-2">
              {onAccept && (
                <button
                  onClick={onAccept}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 ${bm.badge}`}
                >
                  <ThumbsUp className="h-4 w-4" />
                  Accept — {bm.label}
                </button>
              )}
              {onOverride && data.decisionBand !== 'APPROVE' && (
                <button
                  onClick={() => setOverrideMode('approve')}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Override — Approve
                </button>
              )}
              {onOverride && data.decisionBand !== 'REJECT' && (
                <button
                  onClick={() => setOverrideMode('reject')}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-all"
                >
                  <ThumbsDown className="h-4 w-4" />
                  Override — Reject
                </button>
              )}
              {onRequestDocs && (
                <button
                  onClick={onRequestDocs}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all"
                >
                  <FileQuestion className="h-4 w-4" />
                  Request More Documents
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className={`rounded-xl border p-3 ${overrideMode === 'approve' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
                }`}>
                <p className={`text-xs font-bold mb-2 ${overrideMode === 'approve' ? 'text-emerald-700' : 'text-red-700'}`}>
                  Override reason required for audit trail
                </p>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="State your reason for overriding the AI decision…"
                  className="w-full text-sm rounded-lg border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (overrideReason.trim() && onOverride) {
                      onOverride(overrideMode, overrideReason.trim());
                      setOverrideMode(null);
                      setOverrideReason('');
                    }
                  }}
                  disabled={!overrideReason.trim()}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-40 ${overrideMode === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                  Confirm Override → {overrideMode === 'approve' ? 'Approve' : 'Reject'}
                </button>
                <button
                  onClick={() => { setOverrideMode(null); setOverrideReason(''); }}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

    </div>
  );
}
