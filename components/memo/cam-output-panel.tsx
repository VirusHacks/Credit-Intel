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
  const color = s >= 70 ? '#16a34a' : s >= 50 ? '#d97706' : '#dc2626';
  const trackColor = s >= 70 ? '#dcfce7' : s >= 50 ? '#fef3c7' : '#fee2e2';

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
  if (!rating) return 'bg-gray-100 text-gray-500 border-gray-200';
  if (rating === 'Strong') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (rating === 'Adequate') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (rating === 'Weak') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-700 border-red-200';
}

function scoreTextColor(s: number | null) {
  const v = s ?? 0;
  return v >= 70 ? 'text-green-600' : v >= 50 ? 'text-amber-600' : 'text-red-600';
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
  const iconBg = s >= 70 ? 'bg-green-100 text-green-600' : s >= 50 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600';

  return (
    <div
      className="rounded-xl border bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setOpen((o) => !o)}
    >
      {/* Top strip: thin colour bar */}
      <div className={`h-1 w-full ${s >= 70 ? 'bg-green-500' : s >= 50 ? 'bg-amber-400' : 'bg-red-500'}`} />

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
    label: 'Strengths',
    subtitle: 'Internal advantages',
    icon: ThumbsUp,
    accent: '#16a34a',
    gradFrom: 'from-emerald-500',
    gradTo: 'to-teal-400',
    bg: 'bg-emerald-50',
    cardBorder: 'border-emerald-200',
    numBg: 'bg-emerald-600',
    itemHover: 'hover:bg-emerald-100/60',
    tagBg: 'bg-emerald-100',
    tagText: 'text-emerald-700',
    tagBorder: 'border-emerald-200',
    textColor: 'text-emerald-950',
    quadrant: 'SW', // top-left
  },
  {
    key: 'weaknesses' as const,
    label: 'Weaknesses',
    subtitle: 'Internal vulnerabilities',
    icon: ThumbsDown,
    accent: '#dc2626',
    gradFrom: 'from-red-500',
    gradTo: 'to-rose-400',
    bg: 'bg-red-50',
    cardBorder: 'border-red-200',
    numBg: 'bg-red-600',
    itemHover: 'hover:bg-red-100/60',
    tagBg: 'bg-red-100',
    tagText: 'text-red-700',
    tagBorder: 'border-red-200',
    textColor: 'text-red-950',
    quadrant: 'NE',
  },
  {
    key: 'opportunities' as const,
    label: 'Opportunities',
    subtitle: 'External tailwinds',
    icon: Zap,
    accent: '#2563eb',
    gradFrom: 'from-blue-500',
    gradTo: 'to-indigo-400',
    bg: 'bg-blue-50',
    cardBorder: 'border-blue-200',
    numBg: 'bg-blue-600',
    itemHover: 'hover:bg-blue-100/60',
    tagBg: 'bg-blue-100',
    tagText: 'text-blue-700',
    tagBorder: 'border-blue-200',
    textColor: 'text-blue-950',
    quadrant: 'SW',
  },
  {
    key: 'threats' as const,
    label: 'Threats',
    subtitle: 'External headwinds',
    icon: ShieldAlert,
    accent: '#d97706',
    gradFrom: 'from-amber-500',
    gradTo: 'to-orange-400',
    bg: 'bg-amber-50',
    cardBorder: 'border-amber-200',
    numBg: 'bg-amber-600',
    itemHover: 'hover:bg-amber-100/60',
    tagBg: 'bg-amber-100',
    tagText: 'text-amber-700',
    tagBorder: 'border-amber-200',
    textColor: 'text-amber-950',
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
  const sentiment = posPercent >= 70 ? 'Favourable' : posPercent >= 50 ? 'Balanced' : 'Cautionary';
  const sentimentColor = posPercent >= 70 ? 'text-emerald-600' : posPercent >= 50 ? 'text-amber-600' : 'text-red-600';
  const sentimentBg = posPercent >= 70 ? 'bg-emerald-50 border-emerald-200' : posPercent >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">

      {/* ── Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-6 py-5">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-8 -left-8 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-purple-500/10 blur-2xl" />

        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="rounded-lg bg-white/10 p-1.5">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-white/60">Strategic Assessment</span>
            </div>
            <h3 className="text-xl font-extrabold text-white leading-tight">SWOT Analysis</h3>
            <p className="text-xs text-white/50 mt-0.5">AI-synthesised from financial signals &amp; market research</p>
          </div>

          {/* Sentiment badge */}
          <div className={`rounded-xl border px-3 py-2 ${sentimentBg} text-center`}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Overall Sentiment</p>
            <p className={`text-lg font-extrabold ${sentimentColor}`}>{sentiment}</p>
            <p className="text-[10px] text-gray-400">{posPercent}% positive signals</p>
          </div>
        </div>

        {/* Balance bar */}
        <div className="relative mt-4 space-y-1.5">
          <div className="flex justify-between text-[10px] text-white/50 font-medium">
            <span>Strengths + Opportunities ({positiveCount})</span>
            <span>Weaknesses + Threats ({negativeCount})</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-1000"
              style={{ width: `${posPercent}%` }}
            />
            <div className="flex-1 bg-gradient-to-r from-red-400 to-rose-400" />
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
          const { key, label, subtitle, icon: Icon, accent, gradFrom, gradTo,
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
                  <div className={`rounded-xl bg-gradient-to-br ${gradFrom} ${gradTo} p-2.5 shadow-sm`}>
                    <Icon className="h-4 w-4 text-white" />
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
  if (decision === 'CONDITIONAL_APPROVE') return <AlertTriangle className="h-10 w-10 text-white" />;
  return <XCircle className="h-10 w-10 text-white" />;
}

function verdictGrad(decision: string) {
  if (decision === 'APPROVE') return 'from-emerald-600 to-teal-500';
  if (decision === 'CONDITIONAL_APPROVE') return 'from-amber-500 to-orange-400';
  return 'from-red-600 to-rose-500';
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
      <div className={`rounded-2xl bg-linear-to-r ${verdictGrad(cam.decision)} p-px shadow-lg`}>
        <div className="rounded-2xl bg-white">
          {/* Header */}
          <div className={`rounded-t-2xl bg-linear-to-r ${verdictGrad(cam.decision)} px-6 py-5 flex items-center justify-between gap-4 flex-wrap`}>
            <div className="flex items-center gap-4">
              <VerdictIcon decision={cam.decision} />
              <div className="text-white">
                <p className="text-xs font-medium opacity-80 uppercase tracking-wider">Credit Decision</p>
                <p className="text-3xl font-extrabold leading-tight">{cam.decision.replace(/_/g, ' ')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* overall score ring */}
              <div className="relative flex items-center justify-center bg-white/20 rounded-full" style={{ width: 72, height: 72 }}>
                <ScoreRing score={overallScore} size={72} />
                <div className="absolute text-center">
                  <p className="text-lg font-extrabold text-white leading-none">{overallScore ?? '—'}</p>
                  <p className="text-[9px] text-white/70 leading-none">avg</p>
                </div>
              </div>
              <a href={`/api/cam/download/${appId}`} target="_blank" rel="noreferrer">
                <Button variant="secondary" size="sm" className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </a>
            </div>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
            {[
              {
                label: 'Recommended',
                value: cam.recommendedAmountInr && Number(cam.recommendedAmountInr) > 0
                  ? `₹${Number(cam.recommendedAmountInr).toLocaleString('en-IN')}`
                  : '—',
                color: 'text-emerald-700',
              },
              {
                label: 'Interest Rate',
                value: cam.recommendedRatePercent && Number(cam.recommendedRatePercent) > 0
                  ? `${cam.recommendedRatePercent}% p.a.`
                  : '—',
                color: 'text-blue-700',
              },
              {
                label: 'Original Ask',
                value: requestedAmountInr ? `₹${Number(requestedAmountInr).toLocaleString('en-IN')}` : '—',
                color: 'text-gray-700',
              },
              {
                label: 'Generated',
                value: new Date(cam.generatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
                color: 'text-gray-500',
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="px-5 py-4 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
                <p className={`mt-1 text-base font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          REDUCTION RATIONALE (if present)
      ═══════════════════════════════════════════════ */}
      {cam.reductionRationale && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Rationale</p>
            <p className="text-sm text-amber-900 mt-0.5 leading-relaxed">{cam.reductionRationale}</p>
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
            <div className="rounded-xl border bg-white shadow-sm p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                Covenants &amp; Conditions
              </p>
              <ul className="space-y-2">
                {(cam.conditions as string[]).map((cond, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-gray-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                    {cond}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Chat */}
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col" style={{ minHeight: 380 }}>
            {/* Header */}
            <div className="flex items-center gap-2.5 bg-indigo-600 px-4 py-3">
              <div className="rounded-full bg-white/20 p-1.5">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">Ask AI</p>
                <p className="text-[10px] text-white/70 mt-0.5">Credit analysis assistant</p>
              </div>
            </div>

            {/* Quick questions */}
            <div className="flex flex-wrap gap-1.5 px-3 pt-3">
              {QUICK_Q.map((q) => (
                <button key={q} onClick={() => setChatInput(q)}
                  className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100 transition-colors">
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
            <div className="flex gap-2 border-t px-3 py-2.5">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleChatSend(); } }}
                placeholder="Ask a question…"
                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
              <Button onClick={() => void handleChatSend()} disabled={chatLoading || !chatInput.trim()}
                size="sm" className="bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════
          AI REASONING TRACE (collapsible)
      ═════════════════════════════════════════════ */}
      {cam.thinkingTrace && (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setShowTrace((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Brain className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-gray-900 text-sm">AI Reasoning Trace</span>
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                {cam.thinkingTrace.length.toLocaleString()} chars
              </span>
            </div>
            {showTrace ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </button>
          {showTrace && (
            <div className="border-t bg-gray-50/60 px-5 py-4">
              <pre className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed font-mono max-h-120 overflow-y-auto">
                {cam.thinkingTrace}
              </pre>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
