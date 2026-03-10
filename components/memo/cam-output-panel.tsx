'use client';

import { useState } from 'react';
import {
  Download, AlertTriangle, CheckCircle2, XCircle, Brain,
  Shield, TrendingUp, Landmark, Building2, ClipboardList,
  Send, Sparkles, Loader2, ChevronDown, ChevronUp,
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
  { key: 'character',  label: 'Character',  icon: Shield,       desc: 'Trustworthiness & repayment history' },
  { key: 'capacity',   label: 'Capacity',   icon: TrendingUp,   desc: 'Cash flows & debt-service ability' },
  { key: 'capital',    label: 'Capital',    icon: Landmark,     desc: 'Net worth & equity cushion' },
  { key: 'collateral', label: 'Collateral', icon: Building2,    desc: 'Assets pledged as security' },
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
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
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

      {/* ═══════════════════════════════════════════════
          AI REASONING TRACE (collapsible)
      ═══════════════════════════════════════════════ */}
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
