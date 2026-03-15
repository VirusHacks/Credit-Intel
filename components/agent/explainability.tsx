'use client';

import { Card } from '@/components/ui/card';
import {
  ChevronDown, ChevronUp, Brain, Lightbulb, Shield, TrendingUp,
  Landmark, Building2, ClipboardList, Cpu, Layers, Sparkles,
} from 'lucide-react';
import { useState } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────
interface FiveCData {
  score: number | null;
  rating: string | null;
  explanation: string | null;
}

interface CamData {
  decision: string;
  characterScore: number | null;
  capacityScore: number | null;
  capitalScore: number | null;
  collateralScore: number | null;
  conditionsScore: number | null;
  characterRating: string | null;
  capacityRating: string | null;
  capitalRating: string | null;
  collateralRating: string | null;
  conditionsRating: string | null;
  characterExplanation: string | null;
  capacityExplanation: string | null;
  capitalExplanation: string | null;
  collateralExplanation: string | null;
  conditionsExplanation: string | null;
  recommendedAmountInr: string | null;
  recommendedRatePercent: string | null;
  reductionRationale: string | null;
  conditions: string[] | null;
  thinkingTrace: string | null;
}

interface ExplainabilityProps {
  cam?: CamData | null;
  agentCount?: number;
  signalCount?: number;
  avgConfidence?: number;
}

const FIVE_C_META = [
  { key: 'character', icon: <Shield className="w-5 h-5" />, label: 'Character', desc: 'Creditworthiness, reputation, promoter track record & repayment history', weight: '25%' },
  { key: 'capacity', icon: <TrendingUp className="w-5 h-5" />, label: 'Capacity', desc: 'Ability to repay from cash flows, DSCR, and income stability', weight: '25%' },
  { key: 'capital', icon: <Landmark className="w-5 h-5" />, label: 'Capital', desc: 'Net worth, equity, tangible net worth, and financial reserves', weight: '20%' },
  { key: 'collateral', icon: <Building2 className="w-5 h-5" />, label: 'Collateral', desc: 'Assets pledged as security — value, liquidity, and coverage ratio', weight: '15%' },
  { key: 'conditions', icon: <ClipboardList className="w-5 h-5" />, label: 'Conditions', desc: 'Industry outlook, macro environment, regulatory climate & loan purpose', weight: '15%' },
] as const;

function getImpact(score: number | null): 'positive' | 'negative' | 'neutral' {
  if (!score) return 'neutral';
  return score >= 65 ? 'positive' : score >= 45 ? 'neutral' : 'negative';
}

export function Explainability({ cam, agentCount = 5, signalCount = 0, avgConfidence = 0 }: ExplainabilityProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Build factors from real CAM data
  const factors = FIVE_C_META.map(meta => {
    const score = cam ? (cam[`${meta.key}Score` as keyof CamData] as number | null) : null;
    const rating = cam ? (cam[`${meta.key}Rating` as keyof CamData] as string | null) : null;
    const explanation = cam ? (cam[`${meta.key}Explanation` as keyof CamData] as string | null) : null;
    return { ...meta, score, rating, explanation, impact: getImpact(score) };
  });

  const positiveFactors = factors.filter(f => f.impact === 'positive').length;
  const negativeFactors = factors.filter(f => f.impact === 'negative').length;
  const overallScore = cam
    ? Math.round(factors.reduce((s, f) => s + (f.score ?? 0), 0) / factors.length)
    : null;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="p-8 bg-white/5 backdrop-blur-2xl border-white/10 relative overflow-hidden ring-1 ring-white/5">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
          <Brain className="w-32 h-32 text-white" />
        </div>
        <div className="flex items-start gap-6 relative z-10">
          <div className="p-3 bg-white text-black rounded-xl">
             <Brain className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-3">AI Decision Transparency</h3>
            <p className="text-xs text-white/50 mb-8 leading-relaxed max-w-2xl">
              {cam
                ? `The neural reconciler synthesized ${signalCount} high-fidelity signals from ${agentCount} specialized intelligence agents. Each of the Five C's is analyzed using cross-document contrastive scoring.`
                : 'Run the AI pipeline and generate a CAM to see the explainability breakdown.'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Aggregate Score</p>
                <p className="text-2xl font-black text-white mt-1 tabular-nums">
                  {overallScore ?? '—'}<span className="text-xs font-normal text-white/20">/100</span>
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Supporting Factors</p>
                <div className="flex items-center gap-2 mt-1">
                   <p className="text-2xl font-black text-white tabular-nums">{positiveFactors}</p>
                   <span className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">IDENTIFIED</span>
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Risk Vectors</p>
                <div className="flex items-center gap-2 mt-1">
                   <p className={`text-2xl font-black tabular-nums ${negativeFactors > 0 ? 'text-white underline underline-offset-4 decoration-white/30' : 'text-white/20'}`}>{negativeFactors}</p>
                   <span className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">{negativeFactors === 1 ? 'FACTOR' : 'FACTORS'}</span>
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Model Confidence</p>
                <p className="text-2xl font-black text-white mt-1 tabular-nums">{avgConfidence > 0 ? `${avgConfidence}%` : '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Five C's Factor Analysis */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-white/40 flex items-center gap-2 uppercase tracking-[0.3em]">
          <Lightbulb className="w-4 h-4 text-white/40" />
          Multi-Agent Contrastive Insights
        </h3>

        {factors.map(factor => {
          const isExpanded = expandedKey === factor.key;
          const borderColor = factor.impact === 'positive' ? 'border-l-white' : factor.impact === 'negative' ? 'border-l-white/20' : 'border-l-white/10';
          const scoreColor = factor.impact === 'positive' ? 'text-white' : factor.impact === 'negative' ? 'text-white/40' : 'text-white/60';
          const ratingCls = factor.rating === 'Strong' ? 'bg-white text-black font-black' : factor.rating === 'Adequate' ? 'bg-white/20 text-white font-bold' : factor.rating === 'Weak' ? 'bg-white/10 text-white/60 font-semibold' : 'bg-white/5 text-white/30 border border-white/5';

          return (
            <Card
              key={factor.key}
              className={`p-6 bg-white/5 backdrop-blur-xl cursor-pointer transition-all hover:bg-white/10 border-l-4 ${borderColor} ${isExpanded ? 'border-white/40 bg-white/10' : 'border-white/10'}`}
              onClick={() => setExpandedKey(isExpanded ? null : factor.key)}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`rounded-lg p-2.5 border border-white/10 ${factor.impact === 'positive' ? 'bg-white/20 text-white' : factor.impact === 'negative' ? 'bg-white/5 text-white/30' : 'bg-white/10 text-white/60'}`}>
                    {factor.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-black text-white uppercase tracking-wider">{factor.label}</p>
                      {factor.rating && <span className={`rounded px-1.5 py-0.5 text-[9px] uppercase tracking-tighter ${ratingCls}`}>{factor.rating}</span>}
                    </div>
                    <p className="text-[11px] text-white/40 mt-1 uppercase font-bold tracking-tight">{factor.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="text-right">
                    <p className={`text-3xl font-black tabular-nums ${scoreColor}`}>
                      {factor.score ?? '—'}
                      <span className="text-xs font-normal text-white/20 ml-0.5">/100</span>
                    </p>
                    <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-1">Weighting: {factor.weight}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}
                </div>
              </div>

              {/* Expanded: AI Explanation */}
              {isExpanded && (
                <div className="mt-6 pt-6 border-t border-white/10" onClick={e => e.stopPropagation()}>
                  {factor.explanation ? (
                    <div className="flex gap-4 items-start bg-white/[0.03] p-4 rounded-lg">
                      <Brain className="h-5 w-5 text-white/40 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] font-black text-white uppercase tracking-widest mb-2 italic">Neural Reasoning Output</p>
                        <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap font-medium">{factor.explanation}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-white/30 italic uppercase tracking-widest text-center py-4">Detailed synthesis pending CAM generation</p>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Model Information */}
      <Card className="p-8 bg-white/5 backdrop-blur-xl border border-white/10">
        <h3 className="text-[10px] font-black text-white/40 mb-6 flex items-center gap-2 uppercase tracking-[0.3em]">
          <Cpu className="w-4 h-4" />
          Neural Infrastructure
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 group hover:bg-white/10 transition-colors">
            <Sparkles className="h-5 w-5 text-white/40 group-hover:text-white transition-colors" />
            <div>
              <p className="text-white/30 text-[9px] font-extrabold uppercase tracking-widest">Inference Core</p>
              <p className="font-bold text-white text-xs uppercase tracking-tight">Gemini 2.5 Flash</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 group hover:bg-white/10 transition-colors">
            <Layers className="h-5 w-5 text-white/40 group-hover:text-white transition-colors" />
            <div>
              <p className="text-white/30 text-[9px] font-extrabold uppercase tracking-widest">Agent Orchestration</p>
              <p className="font-bold text-white text-xs uppercase tracking-tight">LangGraph Synthesis</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 group hover:bg-white/10 transition-colors">
            <Brain className="h-5 w-5 text-white/40 group-hover:text-white transition-colors" />
            <div>
              <p className="text-white/30 text-[9px] font-extrabold uppercase tracking-widest">Persistent Memory</p>
              <p className="font-bold text-white text-xs uppercase tracking-tight">mem0 Hive Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 group hover:bg-white/10 transition-colors">
            <Shield className="h-5 w-5 text-white/40 group-hover:text-white transition-colors" />
            <div>
              <p className="text-white/30 text-[9px] font-extrabold uppercase tracking-widest">Verification Logic</p>
              <p className="font-bold text-white text-xs uppercase tracking-tight">Contrastive Proofing</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
