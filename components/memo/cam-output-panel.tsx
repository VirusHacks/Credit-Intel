'use client';

import { useState } from 'react';
import {
  Download, AlertTriangle, CheckCircle2, XCircle, Brain,
  Shield, TrendingUp, Landmark, Building2, ClipboardList,
  Send, Sparkles, Loader2, ChevronDown, ChevronUp,
  ThumbsUp, ThumbsDown, Zap, ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────
interface LatestCam {
  decision: string;
  recommendedAmountInr: string | null;
  recommendedRatePercent: string | null;
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
  reductionRationale: string | null;
  conditions: string[] | null;
  thinkingTrace: string | null;
  swotJson: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  } | null;
  pdfBlobUrl: string | null;
  generatedAt: string;
}

interface CamOutputPanelProps {
  cam: LatestCam;
  appId: string;
  requestedAmountInr: string | null;
}

// ─── Circular score ring ──────────────────────────────────────────────────────
function ScoreRing({ score, size = 80 }: { score: number | null; size?: number }) {
  const s = score ?? 0;
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (s / 100) * circumference;
  
  // Monochromatic variants based on score range
  const color = s >= 70 ? 'rgba(255, 255, 255, 0.9)' : s >= 50 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)';
  const trackColor = 'rgba(255, 255, 255, 0.05)';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={10} />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={circumference}
        strokeDashoffset={circumference - filled}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
}

// ─── 5C card ──────────────────────────────────────────────────────────────────
const C_META = [
  { key: 'character', label: 'Character', icon: Shield, desc: 'Trustworthiness & repayment history' },
  { key: 'capacity', label: 'Capacity', icon: TrendingUp, desc: 'Cash flows & debt-service ability' },
  { key: 'capital', label: 'Capital', icon: Landmark, desc: 'Net worth & equity cushion' },
  { key: 'collateral', label: 'Collateral', icon: Building2, desc: 'Assets pledged as security' },
  { key: 'conditions', label: 'Conditions', icon: ClipboardList, desc: 'Industry, macro & loan purpose' },
] as const;

function ratingColor(rating: string | null) {
  if (!rating) return 'bg-white/5 text-white/40 border-white/5';
  if (rating === 'Strong') return 'bg-white/20 text-white border-white/30 font-black';
  if (rating === 'Adequate') return 'bg-white/10 text-white/70 border-white/20 font-bold';
  if (rating === 'Weak') return 'bg-white/5 text-white/40 border-white/10 font-medium';
  return 'bg-white/[0.02] text-white/20 border-white/5';
}

function scoreTextColor(s: number | null) {
  const v = s ?? 0;
  return v >= 70 ? 'text-white' : v >= 50 ? 'text-white/60' : 'text-white/30';
}

function FiveCCard({
  meta, score, rating, explanation,
}: {
  meta: typeof C_META[number];
  score: number | null;
  rating: string | null;
  explanation: string | null;
}) {
  const [open, setOpen] = useState(false);
  const Icon = meta.icon;
  const s = score ?? 0;
  const iconBg = s >= 70 ? 'bg-white/20 text-white border border-white/20' : s >= 50 ? 'bg-white/10 text-white/60 border border-white/10' : 'bg-white/5 text-white/30 border border-white/5';

  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl overflow-hidden hover:bg-white/[0.05] transition-all cursor-pointer group"
      onClick={() => setOpen((o) => !o)}
    >
      {/* Top strip: thin colour bar */}
      <div className={`h-1 w-full ${s >= 70 ? 'bg-white/40' : s >= 50 ? 'bg-white/10' : 'bg-white/5'}`} />

      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          {/* Left: icon + label */}
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${iconBg}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">{meta.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{meta.desc}</p>
            </div>
          </div>

          {/* Right: ring + score + rating */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
              <ScoreRing score={score} size={56} />
              <span className={`absolute text-xs font-bold ${scoreTextColor(score)}`}>
                {score ?? '—'}
              </span>
            </div>
            <div className="text-right">
              {rating && (
                <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${ratingColor(rating)}`}>
                  {rating}
                </span>
              )}
              <div className="mt-1">
                {open
                  ? <ChevronUp className="h-4 w-4 text-gray-400 ml-auto" />
                  : <ChevronDown className="h-4 w-4 text-gray-400 ml-auto" />
                }
              </div>
            </div>
          </div>
        </div>

        {/* Expandable explanation */}
        {open && (
          <div className="mt-3 pt-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-2">
              <Brain className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-700 leading-relaxed">
                {explanation ?? 'No detailed explanation available.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SWOT Panel ───────────────────────────────────────────────────────────────
const SWOT_META = [
  {
    key: 'strengths' as const,
    label: 'ASSETS',
    subtitle: 'Internal Strengths',
    icon: ThumbsUp,
    accent: 'rgba(255,255,255,0.4)',
    bg: 'bg-white/[0.03]',
    cardBorder: 'border-white/20',
    numBg: 'bg-white/20',
    itemHover: 'hover:bg-white/[0.08]',
    tagBg: 'bg-white/10',
    tagText: 'text-white',
    tagBorder: 'border-white/20',
    textColor: 'text-white',
    quadrant: 'SW',
  },
  {
    key: 'weaknesses' as const,
    label: 'RISKS',
    subtitle: 'Internal Gaps',
    icon: ThumbsDown,
    accent: 'rgba(255,255,255,0.2)',
    bg: 'bg-white/[0.02]',
    cardBorder: 'border-white/10',
    numBg: 'bg-white/10',
    itemHover: 'hover:bg-white/[0.05]',
    tagBg: 'bg-white/5',
    tagText: 'text-white/60',
    tagBorder: 'border-white/10',
    textColor: 'text-white/80',
    quadrant: 'NE',
  },
  {
    key: 'opportunities' as const,
    label: 'UPSIDE',
    subtitle: 'Market Tailwinds',
    icon: Zap,
    accent: 'rgba(255,255,255,0.3)',
    bg: 'bg-white/[0.04]',
    cardBorder: 'border-white/20',
    numBg: 'bg-white/30',
    itemHover: 'hover:bg-white/[0.1]',
    tagBg: 'bg-white/15',
    tagText: 'text-white/90',
    tagBorder: 'border-white/30',
    textColor: 'text-white',
    quadrant: 'SW',
  },
  {
    key: 'threats' as const,
    label: 'THREATS',
    subtitle: 'Macro Headwinds',
    icon: ShieldAlert,
    accent: 'rgba(255,255,255,0.1)',
    bg: 'bg-white/[0.01]',
    cardBorder: 'border-white/5',
    numBg: 'bg-white/5',
    itemHover: 'hover:bg-white/[0.03]',
    tagBg: 'bg-white/[0.02]',
    tagText: 'text-white/40',
    tagBorder: 'border-white/5',
    textColor: 'text-white/50',
    quadrant: 'NE',
  },
] as const;

function SwotBar({ positiveCount, negativeCount, positiveColor, negativeColor }: {
  positiveCount: number; negativeCount: number;
  positiveColor: string; negativeColor: string;
}) {
  const total = positiveCount + negativeCount;
  const posW = total > 0 ? Math.round((positiveCount / total) * 100) : 50;
  return (
    <div className="flex items-center gap-2 text-[10px] font-semibold">
      <span className={positiveColor}>{positiveCount} positive</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full bg-emerald-500 transition-all duration-700`}
          style={{ width: `${posW}%` }}
        />
      </div>
      <span className={negativeColor}>{negativeCount} risk</span>
    </div>
  );
}

function SwotPanel({ swot }: { swot: NonNullable<LatestCam['swotJson']> }) {
  const [activeKey, setActiveKey] = useState<typeof SWOT_META[number]['key'] | null>(null);

  const positiveCount = swot.strengths.length + swot.opportunities.length;
  const negativeCount = swot.weaknesses.length + swot.threats.length;
  const total = positiveCount + negativeCount;
  const posPercent = total > 0 ? Math.round((positiveCount / total) * 100) : 50;
  const sentiment = posPercent >= 70 ? 'Optimal' : posPercent >= 50 ? 'Stable' : 'Vulnerable';
  const sentimentColor = posPercent >= 70 ? 'text-white' : posPercent >= 50 ? 'text-white/70' : 'text-white/40';
  const sentimentBg = posPercent >= 70 ? 'bg-white/10 border-white/20' : posPercent >= 50 ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">

      {/* ── Header ── */}
      <div className="relative overflow-hidden bg-white/5 backdrop-blur-3xl px-6 py-8 border-b border-white/10">
        <div className="relative flex items-center justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-xl bg-white/10 p-2 shadow-2xl border border-white/10">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Strategic Risk Matrix</span>
            </div>
            <h3 className="text-2xl font-black text-white leading-tight tracking-tight uppercase">Decision Support SWOT</h3>
            <p className="text-[11px] text-white/30 font-bold uppercase tracking-widest mt-1">AI-synthesised multi-agent research</p>
          </div>

          {/* Sentiment badge */}
          <div className={`rounded-2xl border shadow-2xl px-6 py-3 ${sentimentBg} text-center backdrop-blur-xl`}>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">Risk Vector</p>
            <p className={`text-xl font-black uppercase tracking-widest ${sentimentColor}`}>{sentiment}</p>
            <p className="text-[10px] text-white/30 font-bold mt-1 tabular-nums">{posPercent}% POSITIVE</p>
          </div>
        </div>

        {/* Balance bar */}
        <div className="relative mt-8 space-y-2">
          <div className="flex justify-between text-[9px] text-white/20 font-black uppercase tracking-widest">
            <span>Positive Assets ({positiveCount})</span>
            <span>Risk Headwinds ({negativeCount})</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/5 border border-white/5 overflow-hidden flex shadow-inner">
            <div
              className="h-full bg-white/40 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              style={{ width: `${posPercent}%` }}
            />
            <div className="flex-1 bg-white/5" />
          </div>
        </div>
      </div>

      {/* ── Internal / External axis labels ── */}
      <div className="grid grid-cols-2 border-b border-gray-100">
        <div className="flex items-center justify-center gap-1.5 py-2 border-r border-gray-100 bg-gray-50/60">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Internal factors</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 py-2 bg-gray-50/60">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">External factors</span>
        </div>
      </div>

      {/* ── 2×2 Quadrant grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2">
        {SWOT_META.map((meta, idx) => {
          const { key, label, subtitle, icon: Icon, accent,
            bg, cardBorder, numBg, itemHover, tagBg, tagText, tagBorder, textColor } = meta;
          const items = swot[key];
          const isActive = activeKey === key;
          const borders = [
            'border-b sm:border-r border-gray-100',   // 0: strengths
            'border-b border-gray-100',                // 1: weaknesses
            'sm:border-r border-gray-100',             // 2: opportunities
            '',                                        // 3: threats
          ];

          return (
            <div
              key={key}
              className={`${bg} ${borders[idx]} transition-all duration-200 ${isActive ? 'ring-2 ring-inset' : ''}`}
              style={isActive ? { '--tw-ring-color': accent } as React.CSSProperties : {}}
            >
              {/* Quadrant header */}
              <div
                className={`flex items-center justify-between px-5 pt-5 pb-3 cursor-pointer select-none`}
                onClick={() => setActiveKey(isActive ? null : key)}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="rounded-2xl p-3 shadow-2xl border border-white/20 backdrop-blur-xl"
                    style={{ backgroundColor: accent }}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-900 text-sm leading-tight">{label}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-[11px] font-extrabold text-white ${numBg}`}>
                    {items.length}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${isActive ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Items list */}
              <div className="px-5 pb-5 space-y-2">
                {items.length > 0
                  ? items.map((item, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors duration-150 ${itemHover} bg-white/60 border ${cardBorder}`}
                    >
                      {/* Number badge */}
                      <span
                        className={`shrink-0 mt-0.5 inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-extrabold text-white ${numBg}`}
                      >
                        {i + 1}
                      </span>
                      <p className={`text-sm leading-snug font-medium ${textColor}`}>{item}</p>
                    </div>
                  ))
                  : (
                    <div className={`rounded-xl border ${cardBorder} bg-white/60 px-4 py-3 text-center`}>
                      <p className="text-xs text-gray-400 italic">No items identified by the AI.</p>
                    </div>
                  )
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer insight bar ── */}
      <div className="bg-gray-50 border-t border-gray-100 px-6 py-3 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          {SWOT_META.map(({ key, label, tagBg, tagText, tagBorder }) => (
            <span key={key} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${tagBg} ${tagText} ${tagBorder}`}>
              <span>{label}</span>
              <span className="rounded-full bg-white/70 px-1">{swot[key].length}</span>
            </span>
          ))}
        </div>
        <p className="text-[10px] text-gray-400">Click a quadrant header to highlight it</p>
      </div>
    </div>
  );
}

// ─── Verdict badge ────────────────────────────────────────────────────────────
function VerdictIcon({ decision }: { decision: string }) {
  if (decision === 'APPROVE') return <CheckCircle2 className="h-10 w-10 text-white" />;
  if (decision === 'CONDITIONAL_APPROVE') return <AlertTriangle className="h-10 w-10 text-white/70" />;
  return <XCircle className="h-10 w-10 text-white/40" />;
}

function verdictGrad(decision: string) {
  if (decision === 'APPROVE') return 'from-white/20 to-white/10';
  if (decision === 'CONDITIONAL_APPROVE') return 'from-white/10 to-white/5';
  return 'from-white/5 to-transparent';
}

// ─── Main component ───────────────────────────────────────────────────────────
export function CamOutputPanel({
  cam, appId, requestedAmountInr,
}: CamOutputPanelProps) {
  const [showTrace, setShowTrace] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Weighted overall score (equal weight for simplicity)
  const scores = [cam.characterScore, cam.capacityScore, cam.capitalScore, cam.collateralScore, cam.conditionsScore]
    .filter((s): s is number => s !== null);
  const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  const handleChatSend = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput('');
    const updated = [...chatMessages, { role: 'user' as const, content: msg }];
    setChatMessages(updated);
    setChatLoading(true);
    try {
      const res = await fetch(`/api/applications/${appId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: updated.slice(-10) }),
      });
      const data = await res.json() as { reply: string };
      setChatMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I could not process that. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const QUICK_Q = [
    cam.decision === 'REJECT' ? 'Why was this rejected?' : 'Why was this approved?',
    'What are the biggest risk flags?',
    'Summarise the financial health',
    'What could improve the score?',
  ];

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════════════════
          TOP STRIP: Verdict + overall score ring + key metrics
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-3xl shadow-2xl overflow-hidden group hover:bg-white/[0.04] transition-all">
        <div className="relative">
          {/* Header */}
          <div className={`bg-gradient-to-br ${verdictGrad(cam.decision)} px-8 py-8 flex items-center justify-between gap-6 flex-wrap border-b border-white/10`}>
            <div className="flex items-center gap-6">
              <div className="rounded-2xl bg-white/10 p-4 border border-white/20 shadow-2xl backdrop-blur-xl">
                <VerdictIcon decision={cam.decision} />
              </div>
              <div>
                <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em]">Neural Verification Status</p>
                <p className="text-4xl font-black leading-tight tracking-tighter uppercase mt-1">{cam.decision.replace(/_/g, ' ')}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {/* overall score ring */}
              <div className="relative flex items-center justify-center bg-white/5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl group-hover:scale-105 transition-transform" style={{ width: 84, height: 84 }}>
                <ScoreRing score={overallScore} size={84} />
                <div className="absolute text-center">
                  <p className="text-2xl font-black text-white leading-none tabular-nums">{overallScore ?? '—'}</p>
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-1">RANK</p>
                </div>
              </div>
              <a href={`/api/cam/download/${appId}`} target="_blank" rel="noreferrer">
                <Button variant="outline" size="lg" className="gap-3 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-xl font-black uppercase text-[10px] tracking-widest">
                  <Download className="h-4 w-4" />
                  GENERATE PDF
                </Button>
              </a>
            </div>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/5 bg-white/[0.01]">
            {[
              {
                label: 'Recommended Exposure',
                value: cam.recommendedAmountInr && Number(cam.recommendedAmountInr) > 0
                  ? `₹${Number(cam.recommendedAmountInr).toLocaleString('en-IN')}`
                  : '—',
                color: 'text-white',
              },
              {
                label: 'Optimized Rate',
                value: cam.recommendedRatePercent && Number(cam.recommendedRatePercent) > 0
                  ? `${cam.recommendedRatePercent}% p.a.`
                  : '—',
                color: 'text-white/80',
              },
              {
                label: 'Applicant Request',
                value: requestedAmountInr ? `₹${Number(requestedAmountInr).toLocaleString('en-IN')}` : '—',
                color: 'text-white/60',
              },
              {
                label: 'Inference Timestamp',
                value: new Date(cam.generatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
                color: 'text-white/40',
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="px-6 py-6 text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">{label}</p>
                <p className={`mt-2 text-base font-black tracking-tight ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          REDUCTION RATIONALE (if present)
      ═══════════════════════════════════════════════ */}
      {cam.reductionRationale && (
        <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-6 py-5 shadow-2xl">
          <AlertTriangle className="h-6 w-6 text-white/40 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Decision Rationale</p>
            <p className="text-sm text-white/80 leading-relaxed font-medium italic">
              &quot;{cam.reductionRationale}&quot;
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN BODY: Two-column — 5Cs grid | Conditions + Chat
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

        {/* Left: 5 C's grid ─────────────────────────────────────────── */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Five C&apos;s Credit Assessment</p>
          {C_META.map((meta) => (
            <FiveCCard
              key={meta.key}
              meta={meta}
              score={cam[`${meta.key}Score`] as number | null}
              rating={cam[`${meta.key}Rating`] as string | null}
              explanation={cam[`${meta.key}Explanation`] as string | null}
            />
          ))}
        </div>

        {/* Right: Conditions + Chat ─────────────────────────────────── */}
        <div className="space-y-4">

          {/* Loan conditions */}
          {cam.conditions && (cam.conditions as string[]).length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 group hover:bg-white/[0.05] transition-all shadow-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-5">
                Structural Covenants
              </p>
              <ul className="space-y-4">
                {(cam.conditions as string[]).map((cond, i) => (
                  <li key={i} className="flex gap-3 text-[13px] text-white/70 font-medium leading-relaxed">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/20" />
                    {cond}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Chat */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-3xl shadow-2xl overflow-hidden flex flex-col group hover:bg-white/[0.04] transition-all" style={{ minHeight: 420 }}>
            {/* Header */}
            <div className="flex items-center gap-3 bg-white/5 px-5 py-4 border-b border-white/10">
              <div className="rounded-xl bg-white/10 p-2 shadow-2xl border border-white/10">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-white uppercase tracking-wider leading-none">Neural Reconciler</p>
                <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1">Real-time analysis stream</p>
              </div>
            </div>

            {/* Quick questions */}
            <div className="flex flex-wrap gap-2 px-4 pt-4">
              {QUICK_Q.map((q) => (
                <button key={q} onClick={() => setChatInput(q)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black text-white/40 hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest">
                  {q}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center gap-2">
                  <Brain className="h-7 w-7 text-gray-300" />
                  <p className="text-xs text-gray-400">Ask anything about this applicant</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2 flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                    <span className="text-xs text-gray-500">Thinking…</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex gap-3 border-t border-white/10 px-4 py-4 bg-white/5">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleChatSend(); } }}
                placeholder="Query neural patterns..."
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-medium"
              />
              <Button onClick={() => void handleChatSend()} disabled={chatLoading || !chatInput.trim()}
                size="sm" className="bg-white text-black hover:bg-white/90 rounded-xl px-4 font-black">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════
          AI REASONING TRACE (collapsible)
      ═════════════════════════════════════════════ */}
      {cam.thinkingTrace && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-xl overflow-hidden shadow-2xl hover:bg-white/[0.03] transition-all">
          <button
            onClick={() => setShowTrace((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-5"
          >
            <div className="flex items-center gap-4">
              <Brain className="h-5 w-5 text-white/30" />
              <span className="font-black text-white/70 text-xs uppercase tracking-[0.2em]">Neural Reasoning Core Trace</span>
              <span className="rounded-lg bg-white/10 px-2 py-1 text-[9px] font-black text-white/40 border border-white/10 uppercase tracking-widest">
                {cam.thinkingTrace.length.toLocaleString()} SHARDS
              </span>
            </div>
            {showTrace ? <ChevronUp className="h-4 w-4 text-white/20" /> : <ChevronDown className="h-4 w-4 text-white/20" />}
          </button>
          {showTrace && (
            <div className="border-t border-white/10 bg-black/40 px-6 py-6 font-mono">
              <pre className="text-[11px] text-white/40 whitespace-pre-wrap leading-relaxed max-h-120 overflow-y-auto font-medium scrollbar-hide">
                {cam.thinkingTrace}
              </pre>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
