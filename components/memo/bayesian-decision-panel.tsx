'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  CheckCircle2, XCircle, AlertTriangle,
  TrendingUp, TrendingDown, ChevronDown, ChevronUp,
  Zap, Scale,
} from 'lucide-react';
import type { BayesianDecision, DimKey } from '@/lib/scoring/bayesian-scorer';

interface BayesianDecisionPanelProps {
  data: BayesianDecision;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIM_META: Record<DimKey, { label: string; bar: string; text: string; bg: string; border: string }> = {
  character:  { label: 'Character',  bar: 'bg-violet-500', text: 'text-violet-700', bg: 'bg-violet-50',  border: 'border-violet-200' },
  capacity:   { label: 'Capacity',   bar: 'bg-blue-500',   text: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200'   },
  capital:    { label: 'Capital',    bar: 'bg-emerald-500',text: 'text-emerald-700',bg: 'bg-emerald-50', border: 'border-emerald-200'},
  collateral: { label: 'Collateral', bar: 'bg-amber-500',  text: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200'  },
  conditions: { label: 'Conditions', bar: 'bg-rose-500',   text: 'text-rose-700',   bg: 'bg-rose-50',    border: 'border-rose-200'   },
};

function bandMeta(band: BayesianDecision['decisionBand']) {
  if (band === 'APPROVE')             return { label: 'Approved',             Icon: CheckCircle2, text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300', badge: 'bg-emerald-600', barCls: 'bg-emerald-500' };
  if (band === 'CONDITIONAL_APPROVE') return { label: 'Conditionally Approved', Icon: AlertTriangle, text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-300',   badge: 'bg-amber-500',   barCls: 'bg-amber-500'   };
  return                                     { label: 'Rejected',             Icon: XCircle,      text: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-300',     badge: 'bg-red-600',     barCls: 'bg-red-500'     };
}

function scoreLabel(s: number): { label: string; cls: string } {
  if (s >= 70) return { label: 'Strong',   cls: 'text-emerald-600 bg-emerald-50 border border-emerald-200' };
  if (s >= 50) return { label: 'Moderate', cls: 'text-amber-600   bg-amber-50   border border-amber-200'   };
  return              { label: 'Weak',     cls: 'text-red-600     bg-red-50     border border-red-200'      };
}

function scoreBarColor(s: number) {
  return s >= 70 ? 'bg-emerald-500' : s >= 50 ? 'bg-amber-500' : 'bg-red-500';
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BayesianDecisionPanel({ data }: BayesianDecisionPanelProps) {
  const [showActions, setShowActions] = useState(true);
  const bm = bandMeta(data.decisionBand);
  const { Icon: BandIcon } = bm;

  const flipActions = data.counterfactuals.filter((c) => c.wouldFlipDecision);
  const otherActions = data.counterfactuals.filter((c) => !c.wouldFlipDecision);

  return (
    <div className="space-y-5">

      {/* ── Verdict + Key Numbers ──────────────────────────────────────────── */}
      <div className={`rounded-2xl border-2 ${bm.border} ${bm.bg} p-5`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-stretch gap-5">

          {/* Decision */}
          <div className="flex items-center gap-4 flex-1">
            <div className={`${bm.badge} rounded-2xl p-3 shrink-0`}>
              <BandIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-0.5">AI Credit Decision</p>
              <p className={`text-2xl font-extrabold ${bm.text}`}>{bm.label}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-1.5 w-32 rounded-full bg-black/10 overflow-hidden">
                  <div className={`h-full ${bm.barCls}`} style={{ width: `${data.decisionConfidence}%` }} />
                </div>
                <span className="text-xs font-semibold text-gray-600">{data.decisionConfidence}% AI confidence</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px bg-black/10" />

          {/* Credit Score */}
          <div className="flex flex-col justify-center text-center px-4">
            <p className="text-xs text-gray-500 font-medium mb-1">Credit Score</p>
            <p className={`text-4xl font-extrabold leading-none ${
              data.overallScore >= 70 ? 'text-emerald-600' : data.overallScore >= 50 ? 'text-amber-500' : 'text-red-600'
            }`}>{data.overallScore}</p>
            <p className="text-xs text-gray-400 mt-1">out of 100</p>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px bg-black/10" />

          {/* Rate */}
          <div className="flex flex-col justify-center text-center px-4">
            <p className="text-xs text-gray-500 font-medium mb-1">Recommended Rate</p>
            <p className="text-4xl font-extrabold leading-none text-blue-700">{data.rateDecomposition.finalRate.toFixed(2)}%</p>
            <p className="text-xs text-gray-400 mt-1">per annum</p>
          </div>

        </div>
      </div>

      {/* ── Credit Profile (5C Scores) ─────────────────────────────────────── */}
      <Card className="p-4">
        <p className="text-sm font-bold text-gray-800 mb-4">Credit Profile</p>
        <div className="space-y-3">
          {data.dimensions.map((dim) => {
            const m = DIM_META[dim.dimension];
            const sl = scoreLabel(dim.posteriorMean);
            return (
              <div key={dim.dimension} className="flex items-center gap-3">
                <span className={`text-xs font-semibold w-20 shrink-0 ${m.text}`}>{m.label}</span>
                <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${scoreBarColor(dim.posteriorMean)}`}
                    style={{ width: `${dim.posteriorMean}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-700 w-6 text-right">{dim.posteriorMean}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-16 text-center ${sl.cls}`}>
                  {sl.label}
                </span>
                {dim.conflictFlag && (
                  <span title="Data conflict detected">
                    <AlertTriangle className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                  </span>
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

      {/* ── Actions to Improve ───────────────────────────────────────────────── */}
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
              {/* Decision-flipping actions first */}
              {flipActions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1">
                    <Zap className="h-3 w-3" /> These actions would change the decision
                  </p>
                  {flipActions.map((cf) => {
                    const m = DIM_META[cf.dimension];
                    return (
                      <div key={cf.dimension} className={`rounded-xl border ${m.border} ${m.bg} p-3 flex items-start gap-3`}>
                        <div className={`w-1.5 h-full rounded-full ${m.bar} shrink-0 self-stretch min-h-4`} />
                        <div className="flex-1">
                          <p className={`text-xs font-bold ${m.text} mb-0.5`}>{m.label}</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{cf.requiredChange}</p>
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

              {/* Other improvements */}
              {otherActions.length > 0 && (
                <div className="space-y-2">
                  {flipActions.length > 0 && (
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Other improvements</p>
                  )}
                  {otherActions.map((cf) => {
                    const m = DIM_META[cf.dimension];
                    return (
                      <div key={cf.dimension} className="rounded-xl border border-gray-200 bg-gray-50 p-3 flex items-start gap-3">
                        <div className={`w-1.5 rounded-full ${m.bar} shrink-0 self-stretch min-h-4`} />
                        <div className="flex-1">
                          <p className={`text-xs font-bold ${m.text} mb-0.5`}>{m.label}</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{cf.requiredChange}</p>
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

    </div>
  );
}
