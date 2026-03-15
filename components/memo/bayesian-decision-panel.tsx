'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  CheckCircle2, XCircle, AlertTriangle,
  TrendingUp, TrendingDown, ChevronDown, ChevronUp,
  Zap, Scale, Clock, ChevronRight,
  ThumbsUp, ThumbsDown, FileQuestion, Info,
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
  character: { label: 'Character', bar: 'bg-white/80', text: 'text-white', bg: 'bg-white/10', border: 'border-white/20' },
  capacity: { label: 'Capacity', bar: 'bg-white/60', text: 'text-white/90', bg: 'bg-white/10', border: 'border-white/20' },
  capital: { label: 'Capital', bar: 'bg-white/40', text: 'text-white/80', bg: 'bg-white/5', border: 'border-white/10' },
  collateral: { label: 'Collateral', bar: 'bg-white/30', text: 'text-white/70', bg: 'bg-white/5', border: 'border-white/10' },
  conditions: { label: 'Conditions', bar: 'bg-white/20', text: 'text-white/60', bg: 'bg-white/5', border: 'border-white/10' },
};

function bandMeta(band: BayesianDecision['decisionBand']) {
  if (band === 'APPROVE') return { label: 'Approved', Icon: CheckCircle2, text: 'text-white', bg: 'bg-white/10', border: 'border-white/30', badge: 'bg-white text-black', barCls: 'bg-white' };
  if (band === 'CONDITIONAL_APPROVE') return { label: 'Conditional', Icon: AlertTriangle, text: 'text-white/80', bg: 'bg-white/5', border: 'border-white/20', badge: 'bg-white/20 text-white', barCls: 'bg-white/60' };
  return { label: 'Rejected', Icon: XCircle, text: 'text-white/40', bg: 'bg-white/[0.02]', border: 'border-white/10', badge: 'bg-black/40 text-white/40', barCls: 'bg-white/20' };
}

function bandFromScore(score: number): BayesianDecision['decisionBand'] {
  if (score >= 65) return 'APPROVE';
  if (score >= 50) return 'CONDITIONAL_APPROVE';
  return 'REJECT';
}

function scoreLabel(s: number): { label: string; cls: string } {
  if (s >= 70) return { label: 'Strong', cls: 'text-white bg-white/20 border border-white/20 font-black' };
  if (s >= 50) return { label: 'Moderate', cls: 'text-white/80   bg-white/10   border border-white/10 font-bold' };
  return { label: 'Weak', cls: 'text-white/40     bg-white/5     border border-white/5 font-medium' };
}

function scoreBarColor(s: number) {
  return s >= 70 ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.3)]' : s >= 50 ? 'bg-white/60' : 'bg-white/20';
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
        <div className={`rounded-xl border backdrop-blur-md px-4 py-3 space-y-1.5 bg-white/5 border-white/20 ring-1 ring-white/5`}>
          <p className={`text-[10px] font-black flex items-center gap-1.5 uppercase tracking-widest text-white`}>
            <AlertTriangle className="h-3.5 w-3.5" />
            {conflictDims.length >= 2 ? 'Multiple Data Conflicts Detected' : 'Data Conflict Detected'}
          </p>
          {conflictDims.map((d) => (
            <p key={d.dimension} className="text-[11px] text-white/50 leading-relaxed">
              <span className={`font-black uppercase tracking-tight text-white mr-1`}>
                {DIM_META[d.dimension].label}:
              </span>
              {d.conflictReason ?? 'Conflicting signals from multiple sources — verify manually.'}
            </p>
          ))}
        </div>
      )}

      {/* ── 2. Verdict Card: Decision + Score (with ±σ) + Rate (with breakdown) ── */}
      <div className={`rounded-2xl border ${bm.border} ${bm.bg} backdrop-blur-2xl p-6 shadow-2xl`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-stretch gap-8">

          {/* Decision + staleness */}
          <div className="flex items-center gap-5 flex-1">
            <div className={`${bm.badge} rounded-2xl p-4 shrink-0 shadow-lg border border-white/20`}>
              <BandIcon className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Inference Verdict</p>
                {/* 8. Staleness indicator */}
                <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md border ${isStale
                    ? 'bg-white/10 text-white border-white/20'
                    : 'bg-white/5 text-white/30 border-white/10'
                  }`}>
                  <Clock className="h-2.5 w-2.5" />
                  {computedText}
                  {isStale && ' · stale'}
                </span>
              </div>
              <p className={`text-3xl font-black uppercase tracking-tight ${bm.text}`}>{bm.label}</p>
              <div className="flex items-center gap-3 mt-3">
                <div className="h-1 w-32 rounded-full bg-white/10 overflow-hidden">
                  <div className={`h-full ${bm.barCls}`} style={{ width: `${data.decisionConfidence}%` }} />
                </div>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{data.decisionConfidence}% AI Conf.</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:block w-px bg-white/10" />

          {/* Credit Score with ±sigma */}
          <div className="flex flex-col justify-center text-center px-4 min-w-[120px]">
            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-2 text-center">Synthesis Score</p>
            <div className="flex items-baseline justify-center gap-1">
              <p className={`text-5xl font-black leading-none tracking-tighter ${data.overallScore >= 70 ? 'text-white' : data.overallScore >= 50 ? 'text-white/80' : 'text-white/40'
                }`}>{data.overallScore}</p>
              {/* 1. Uncertainty band */}
              <span className={`text-sm font-black ${isHighUncertainty ? 'text-white underline underline-offset-4 decoration-white/40' : 'text-white/20'}`}>
                ±{data.overallSigma}
              </span>
            </div>
            <p className="text-[9px] text-white/20 mt-2 font-bold uppercase tracking-widest">out of 100</p>
            {isHighUncertainty && (
              <span className="mt-2 text-[8px] font-black text-white px-2 py-0.5 border border-white/20 rounded-md uppercase tracking-tighter">
                Variance Alert
              </span>
            )}
          </div>

          <div className="hidden sm:block w-px bg-white/10" />

          {/* Rate with decomposition bar */}
          <div className="flex flex-col justify-center px-4 min-w-[160px]">
            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-2 text-center">Optimized Rate</p>
            <p className="text-4xl font-black leading-none text-white text-center tracking-tighter">
              {data.rateDecomposition.finalRate.toFixed(2)}%
            </p>
            <p className="text-[9px] text-white/20 mt-2 text-center font-bold uppercase tracking-widest">ROI PER ANNUM</p>
            {/* 2. Rate decomposition bar */}
            <div className="mt-3.5 space-y-2">
              <div className="flex rounded-full overflow-hidden h-1.5 border border-white/10">
                <div className="bg-white/60 transition-all" style={{ width: `${basePct}%` }} />
                <div className="bg-white/30 transition-all" style={{ width: `${riskPct}%` }} />
                <div className="bg-white/10 transition-all" style={{ width: `${uncPct}%` }} />
              </div>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-tighter text-white/40">
                  Base {data.rateDecomposition.baseRate}%
                </span>
                <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-tighter text-white/60">
                  Risk +{data.rateDecomposition.riskPremium.toFixed(2)}
                </span>
                <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-tighter text-white/20">
                  Unc +{data.rateDecomposition.uncertaintyPremium.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── 7. Decision Zone Gauge ─────────────────────────────────────────── */}
      <Card className="px-6 py-5 bg-white/5 border-white/10 ring-1 ring-white/5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Score Position</p>
          {data.decisionBand !== 'APPROVE' && (
            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">
              <span className="text-white">
                +{data.decisionBand === 'REJECT' ? Math.max(0, 50 - data.overallScore) : Math.max(0, 65 - data.overallScore)} PTS
              </span>{' '}
              to{' '}
              <span className={`text-white/60`}>
                {data.decisionBand === 'REJECT' ? 'COND. APPROVE' : 'FULL APPROVE'}
              </span>
            </p>
          )}
        </div>
        <div className="relative h-8">
          {/* Zone bands */}
          <div className="absolute inset-0 flex rounded-lg overflow-hidden border border-white/10">
            <div className="bg-white/5" style={{ width: '50%' }} />
            <div className="bg-white/10" style={{ width: '15%' }} />
            <div className="bg-white/20" style={{ width: '35%' }} />
          </div>
          {/* Zone labels */}
          <div className="absolute inset-0 flex items-center pointer-events-none">
            <span className="text-[8px] font-black text-white/20 text-center tracking-widest" style={{ width: '50%' }}>REJECT</span>
            <span className="text-[8px] font-black text-white/40 text-center tracking-widest" style={{ width: '15%' }}>COND.</span>
            <span className="text-[8px] font-black text-white/60 text-center tracking-widest" style={{ width: '35%' }}>APPROVE</span>
          </div>
          {/* Threshold lines */}
          <div className="absolute top-0 bottom-0 w-[1px] bg-white/30" style={{ left: '50%' }} />
          <div className="absolute top-0 bottom-0 w-[1px] bg-white/50" style={{ left: '65%' }} />
          {/* Score pointer */}
          <div
            className="absolute top-0 bottom-0 flex items-center justify-center transition-all duration-1000"
            style={{ left: `${Math.min(Math.max(data.overallScore, 1.5), 98.5)}%`, transform: 'translateX(-50%)' }}
          >
            <div className={`w-7 h-9 rounded-xl border border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center bg-white text-black backdrop-blur-3xl`}>
              <span className="text-[10px] font-black leading-none">{data.overallScore}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-2 px-1">
          <span className="text-[8px] text-white/20 font-black">0</span>
          <span className="text-[8px] text-white/40 font-black" style={{ marginLeft: 'calc(50% - 20px)' }}>50</span>
          <span className="text-[8px] text-white/60 font-black" style={{ marginLeft: 'calc(15% - 16px)' }}>65</span>
          <span className="text-[8px] text-white/20 font-black">100</span>
        </div>
      </Card>

      {/* ── 3 + 4 + 5. Credit Profile with weights, evidence accordion, conflict ── */}
      <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Credit Profile Breakdown</p>
          <div className="flex items-center gap-2">
             <Info className="w-3.5 h-3.5 text-white/20" />
             <p className="text-[9px] text-white/30 uppercase font-black tracking-widest">Interactive Audit Layer</p>
          </div>
        </div>
        <div className="space-y-2">
          {data.dimensions.map((dim) => {
            const m = DIM_META[dim.dimension];
            const sl = scoreLabel(dim.posteriorMean);
            const weight = DIM_WEIGHTS[dim.dimension];
            const isExpanded = expandedDim === dim.dimension;
            const contribution = Math.round(dim.posteriorMean * weight / 100);
            return (
              <div
                key={dim.dimension}
                className={`rounded-xl border transition-all duration-300 ${isExpanded ? `${m.border} ${m.bg} shadow-2xl scale-[1.02] z-10` : 'border-white/5 hover:border-white/20 hover:bg-white/[0.03]'
                  }`}
              >
                {/* Row header — always visible */}
                <button
                  className="w-full flex items-center gap-4 px-4 py-3.5 text-left"
                  onClick={() => setExpandedDim(isExpanded ? null : dim.dimension)}
                >
                  {/* 3. Weight label */}
                  <span className={`text-[10px] font-black w-24 shrink-0 uppercase tracking-widest ${m.text}`}>{m.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${scoreBarColor(dim.posteriorMean)}`}
                      style={{ width: `${dim.posteriorMean}%` }}
                    />
                  </div>
                  <span className="text-sm font-black text-white w-8 text-right shrink-0">{dim.posteriorMean}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md w-20 text-center shrink-0 uppercase tracking-tighter ${sl.cls}`}>
                    {sl.label}
                  </span>
                  <span className="text-[9px] text-white/20 w-10 text-right shrink-0 font-black uppercase tracking-widest">{weight}%</span>
                  {dim.conflictFlag && (
                    <AlertTriangle className="h-4 w-4 text-white animate-pulse shrink-0" />
                  )}
                  <div className="w-6 flex justify-end shrink-0">
                    {isExpanded
                      ? <ChevronUp className="h-4 w-4 text-white/40" />
                      : <ChevronDown className="h-4 w-4 text-white/40" />
                    }
                  </div>
                </button>

                {/* 4. Evidence accordion */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4">
                    <p className="text-[10px] text-white/40 leading-relaxed uppercase font-black tracking-widest">
                      Contribution: <span className="text-white">{contribution} PTS</span>
                      {data.overallSigma > 0 && (
                        <span> · Uncertainty ±{dim.sigma.toFixed(1)}</span>
                      )}
                    </p>

                    {dim.evidenceItems.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Neural Evidence Mapping</p>
                        {dim.evidenceItems.map((ev, i) => (
                          <div key={i} className="flex items-start gap-4 rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3 group hover:bg-white/[0.05] transition-colors">
                            <div className={`mt-0.5 w-[2px] rounded-full self-stretch shrink-0 min-h-6 ${ev.impact >= 0 ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.4)]' : 'bg-white/20'
                              }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black text-white uppercase tracking-widest opacity-80">{ev.source}</p>
                              <p className="text-xs text-white/50 mt-1 leading-relaxed font-medium">{ev.note}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`text-sm font-black ${ev.impact >= 0 ? 'text-white' : 'text-white/40'}`}>
                                {ev.impact >= 0 ? '+' : ''}{ev.impact}
                              </p>
                              <p className="text-[8px] text-white/20 font-black uppercase tracking-tighter mt-1">{Math.round(ev.confidence * 100)}% CONF</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Card className="p-6 border-l-4 border-white bg-white/5 backdrop-blur-xl transition-all hover:bg-white/10">
          <p className="text-[10px] font-black text-white flex items-center gap-2 mb-4 uppercase tracking-[0.2em]">
            <TrendingUp className="h-4 w-4" /> Optimism Vector
          </p>
          <p className="text-xs text-white/70 leading-relaxed font-medium">{data.adversarialSummary.bullCase}</p>
        </Card>
        <Card className="p-6 border-l-4 border-white/20 bg-white/5 backdrop-blur-xl transition-all hover:bg-white/10">
          <p className="text-[10px] font-black text-white/40 flex items-center gap-2 mb-4 uppercase tracking-[0.2em]">
            <TrendingDown className="h-4 w-4" /> Fragility Vector
          </p>
          <p className="text-xs text-white/60 leading-relaxed font-medium italic opacity-80">{data.adversarialSummary.bearCase}</p>
        </Card>
      </div>

      {/* Swing factor */}
      <div className="flex items-start gap-4 rounded-xl bg-white/[0.03] border border-white/10 px-6 py-4 transition-all hover:bg-white/[0.06]">
        <Scale className="h-4 w-4 text-white/30 shrink-0 mt-0.5" />
        <p className="text-xs text-white/50 leading-relaxed font-medium">
          <span className="font-black text-white uppercase tracking-widest mr-2 underline underline-offset-4 decoration-white/20">Critical Axis:</span>
          {data.adversarialSummary.swingFactor}
        </p>
      </div>

      {/* ── 6. Actions to Improve (with projected outcome) ───────────────────── */}
      {data.counterfactuals.length > 0 && (
        <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-xl">
          <button
            onClick={() => setShowActions((v) => !v)}
            className="w-full flex items-center justify-between text-left group"
          >
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] group-hover:text-white transition-colors">Strategic Optimization Paths</p>
            {showActions
              ? <ChevronUp className="h-4 w-4 text-white/40 shrink-0" />
              : <ChevronDown className="h-4 w-4 text-white/40 shrink-0" />}
          </button>

          {showActions && (
            <div className="mt-6 space-y-4">
              {/* Decision-flipping actions */}
              {flipActions.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2 opacity-60">
                    <Zap className="h-3.5 w-3.5" /> Critical Corrective Maneuvers
                  </p>
                  {flipActions.map((cf) => {
                    const m = DIM_META[cf.dimension];
                    const newScore = Math.min(100, cf.currentScore + cf.scoreGain);
                    const newBand = bandMeta(bandFromScore(newScore));
                    return (
                      <div key={cf.dimension} className={`rounded-xl border ${m.border} ${m.bg} p-5 flex items-start gap-5 transition-all hover:bg-white/10`}>
                        <div className={`w-[2px] rounded-full ${m.bar} shrink-0 self-stretch min-h-6 shadow-[0_0_10px_rgba(255,255,255,0.2)]`} />
                        <div className="flex-1">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${m.text} mb-1.5`}>{m.label}</p>
                          <p className="text-xs text-white leading-relaxed font-bold tracking-tight">{cf.requiredChange}</p>
                          {/* 6. Projected outcome */}
                          <div className="mt-4 flex items-center gap-3 flex-wrap text-[10px] uppercase font-black tracking-widest">
                            <span className="text-white/20">Baseline</span>
                            <span className={`text-white/50`}>
                              {data.decisionBand.replace('_', ' ')} <span className="text-white/20 ml-1">({data.overallScore})</span>
                            </span>
                            <ChevronRight className="h-3 w-3 text-white/20" />
                            <span className="text-white/20">Hedged Outcome</span>
                            <span className={`rounded-md px-2 py-1 text-white bg-white/20 border border-white/20 backdrop-blur-md`}>
                              {newBand.label} <span className="opacity-50 ml-1">({newScore})</span>
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[8px] text-white/20 font-black uppercase tracking-widest mb-1">Impact</p>
                          <p className="text-2xl font-black text-white tabular-nums">+{cf.scoreGain}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Non-flipping improvements */}
              {otherActions.length > 0 && (
                <div className="space-y-3">
                  {flipActions.length > 0 && (
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] pt-2">Incremental Efficiency Gains</p>
                  )}
                  {otherActions.map((cf) => {
                    const m = DIM_META[cf.dimension];
                    const newScore = Math.min(100, cf.currentScore + cf.scoreGain);
                    const newBand = bandMeta(bandFromScore(newScore));
                    return (
                      <div key={cf.dimension} className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex items-start gap-5 transition-all hover:bg-white/[0.05]">
                        <div className={`w-[1px] rounded-full ${m.bar} shrink-0 self-stretch min-h-6 opacity-40`} />
                        <div className="flex-1">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${m.text} mb-1.5`}>{m.label}</p>
                          <p className="text-xs text-white/60 leading-relaxed font-medium italic">{cf.requiredChange}</p>
                          <div className="mt-3 flex items-center gap-3 flex-wrap text-[9px] font-black uppercase tracking-widest">
                            <span className="text-white/10">Projected Score Elevation:</span>
                            <span className={`text-white`}>{newScore}</span>
                            <span className={`bg-white/5 px-2 py-0.5 rounded border border-white/5 text-white/30`}>
                              STATUS: {newBand.label} UNCHANGED
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[8px] text-white/20 font-black uppercase tracking-widest mb-1">Gain</p>
                          <p className="text-xl font-black text-white/60 tabular-nums">+{cf.scoreGain}</p>
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
        <Card className="p-8 bg-white/5 border-white/10 backdrop-blur-3xl ring-1 ring-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <p className="text-xs font-black uppercase tracking-[0.3em] mb-1 text-white/60">Human Attribution Zone</p>
          <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest mb-8">
            Executive override protocol requires verification rationale.
          </p>

          {overrideMode === null ? (
            <div className="flex flex-col sm:flex-row gap-4">
              {onAccept && (
                <button
                  onClick={onAccept}
                  className={`flex-1 flex items-center justify-center gap-3 rounded-xl px-6 py-4 text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] ${bm.badge} border border-white/20 shadow-xl`}
                >
                  <ThumbsUp className="h-4 w-4" />
                  Finalize {bm.label}
                </button>
              )}
              {onOverride && data.decisionBand !== 'APPROVE' && (
                <button
                  onClick={() => setOverrideMode('approve')}
                  className="flex-1 flex items-center justify-center gap-3 rounded-xl px-6 py-4 text-xs font-black uppercase tracking-widest border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all shadow-lg"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Override: Approve
                </button>
              )}
              {onOverride && data.decisionBand !== 'REJECT' && (
                <button
                  onClick={() => setOverrideMode('reject')}
                  className="flex-1 flex items-center justify-center gap-3 rounded-xl px-6 py-4 text-xs font-black uppercase tracking-widest border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all shadow-lg"
                >
                  <ThumbsDown className="h-4 w-4" />
                  Override: Reject
                </button>
              )}
              {onRequestDocs && (
                <button
                  onClick={onRequestDocs}
                  className="flex-1 flex items-center justify-center gap-3 rounded-xl px-6 py-4 text-xs font-black uppercase tracking-widest bg-white text-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl"
                >
                  <FileQuestion className="h-4 w-4" />
                  Request Docs
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`rounded-xl border p-5 backdrop-blur-md bg-white/[0.02] ${overrideMode === 'approve' ? 'border-white/20' : 'border-white/10'}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-3 text-white/40`}>
                  Rationale for decision deviation
                </p>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="State your technical/business justification for overriding the AI synthesis…"
                  className="w-full text-xs rounded-lg border border-white/10 bg-white/5 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-white/30 resize-none font-medium text-white placeholder:text-white/20"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (overrideReason.trim() && onOverride) {
                      onOverride(overrideMode, overrideReason.trim());
                      setOverrideMode(null);
                      setOverrideReason('');
                    }
                  }}
                  disabled={!overrideReason.trim()}
                  className={`flex-1 rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest text-black bg-white transition-all disabled:opacity-20 hover:scale-[1.01] active:scale-[0.99] shadow-[0_0_20px_rgba(255,255,255,0.2)]`}
                >
                  Confirm Execution → {overrideMode === 'approve' ? 'Approve' : 'Reject'}
                </button>
                <button
                  onClick={() => { setOverrideMode(null); setOverrideReason(''); }}
                  className="px-6 py-3 text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                >
                  Abort
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

    </div>
  );
}
