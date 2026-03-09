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
      <Card className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
        <div className="flex items-start gap-4">
          <Brain className="w-8 h-8 text-indigo-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Decision Explanation</h3>
            <p className="text-sm text-gray-700 mb-4">
              {cam
                ? `The AI reconciler analyzed ${signalCount} data points from ${agentCount} specialized agents to produce this credit assessment. Each of the Five C's is scored independently with transparent reasoning.`
                : 'Run the AI pipeline and generate a CAM to see the explainability breakdown.'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-lg border border-indigo-200">
                <p className="text-xs text-gray-600">Overall Score</p>
                <p className={`text-xl font-bold mt-1 ${(overallScore ?? 0) >= 65 ? 'text-green-600' : (overallScore ?? 0) >= 45 ? 'text-amber-600' : 'text-red-600'}`}>
                  {overallScore ?? '—'}<span className="text-xs font-normal text-gray-500">/100</span>
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-indigo-200">
                <p className="text-xs text-gray-600">Supporting C&apos;s</p>
                <p className="text-xl font-bold text-green-600 mt-1">{positiveFactors}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-indigo-200">
                <p className="text-xs text-gray-600">Weak C&apos;s</p>
                <p className="text-xl font-bold text-red-600 mt-1">{negativeFactors}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-indigo-200">
                <p className="text-xs text-gray-600">Avg Confidence</p>
                <p className="text-xl font-bold text-blue-600 mt-1">{avgConfidence > 0 ? `${Math.round(avgConfidence * 100)}%` : '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Five C's Factor Analysis */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-600" />
          Five C&apos;s Contrastive Scoring
        </h3>

        {factors.map(factor => {
          const isExpanded = expandedKey === factor.key;
          const borderColor = factor.impact === 'positive' ? 'border-l-green-600' : factor.impact === 'negative' ? 'border-l-red-600' : 'border-l-gray-400';
          const scoreColor = factor.impact === 'positive' ? 'text-green-600' : factor.impact === 'negative' ? 'text-red-600' : 'text-gray-600';
          const ratingCls = factor.rating === 'Strong' ? 'bg-green-100 text-green-700' : factor.rating === 'Adequate' ? 'bg-blue-100 text-blue-700' : factor.rating === 'Weak' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';

          return (
            <Card
              key={factor.key}
              className={`p-4 cursor-pointer transition-all hover:shadow-md border-l-4 ${borderColor} ${isExpanded ? 'ring-2 ring-blue-200' : ''}`}
              onClick={() => setExpandedKey(isExpanded ? null : factor.key)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`rounded-lg p-2 ${factor.impact === 'positive' ? 'bg-green-100 text-green-600' : factor.impact === 'negative' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                    {factor.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{factor.label}</p>
                      {factor.rating && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ratingCls}`}>{factor.rating}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{factor.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${scoreColor}`}>
                      {factor.score ?? '—'}
                      <span className="text-xs font-normal text-gray-500">/100</span>
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase">Weight: {factor.weight}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
              </div>

              {/* Expanded: AI Explanation */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200" onClick={e => e.stopPropagation()}>
                  {factor.explanation ? (
                    <div className="flex gap-2 items-start">
                      <Brain className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-purple-800 mb-1">AI Reasoning</p>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{factor.explanation}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No detailed explanation available. Generate a CAM to see AI reasoning.</p>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Model Information */}
      <Card className="p-6 bg-gray-50 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-gray-600" />
          Intelligence Stack
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
            <Sparkles className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-gray-600 text-xs">Reconciler Model</p>
              <p className="font-medium text-gray-900">Gemini 2.5 Flash (1M ctx)</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
            <Layers className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-gray-600 text-xs">Agent Framework</p>
              <p className="font-medium text-gray-900">LangGraph + 5 Parallel Agents</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
            <Brain className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-gray-600 text-xs">Memory Layer</p>
              <p className="font-medium text-gray-900">mem0 Cloud (Promoter DNA)</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
            <Shield className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-gray-600 text-xs">Reasoning</p>
              <p className="font-medium text-gray-900">Chain-of-Thought + Contrastive</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
