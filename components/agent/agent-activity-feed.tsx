'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Brain, FileText, Search, Scale, XCircle, ChevronRight, Sparkles } from 'lucide-react';
import { PipelineFlow, type StageInfo, type StageStatus } from './pipeline-flow';

// ─── Live event type from /api/pipeline/status/[id] SSE ──────────────────────
interface PipelineEvent {
  appId: string;
  stage: string;
  status: 'processing' | 'done' | 'failed';
  progress?: number;
  confidence?: number;
  message?: string;
  thinkTokens?: string;
  ts: number;
}

// Static pipeline stage ordering (used as fallback for pending steps)
const STAGE_ORDER = [
  'ingest',
  'bank_statement',
  'gst_analyzer',
  'itr_balancesheet',
  'cibil_cmr',
  'scout',
  'qualitative_gate',
  'reconciler',
  'cam_generator',
] as const;

// ─── Phase grouping for human-readable progress ────────────────────────────────────
const PHASES = [
  { id: 'reading', label: 'Reading Documents', icon: FileText, stages: ['ingest'] },
  { id: 'analysis', label: 'Running Checks', icon: Search, stages: ['bank_statement', 'gst_analyzer', 'itr_balancesheet', 'cibil_cmr', 'scout'] },
  { id: 'deciding', label: 'AI Decision', icon: Scale, stages: ['qualitative_gate', 'reconciler', 'cam_generator'] },
];

// ─── Props ──────────────────────────────────────────────────────────────────────────────
interface DecisionSummary {
  overallScore: number;
  decisionBand: 'APPROVE' | 'CONDITIONAL_APPROVE' | 'REJECT';
  conflictCount: number;
}

interface AgentActivityFeedProps {
  /** Real application UUID; if omitted, shows demo/static data */
  appId?: string;
  /**
   * Current pipeline status from the parent page.
   * When 'complete', we skip live SSE and show all stages as completed.
   */
  pipelineStatus?: string;
  /** Optional: shows a result summary card when pipeline is complete */
  decisionSummary?: DecisionSummary;
}

export function AgentActivityFeed({ appId, pipelineStatus, decisionSummary }: AgentActivityFeedProps) {
  const [events, setEvents] = useState<Map<string, PipelineEvent>>(new Map());
  const [thinkStream, setThinkStream] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const isAlreadyComplete = pipelineStatus === 'complete';

  // ── One-shot snapshot when pipeline is already done ──────────────────────
  useEffect(() => {
    if (!appId || !isAlreadyComplete) return;
    let cancelled = false;
    fetch(`/api/pipeline/status/${appId}`)
      .then(async (res) => {
        if (!res.body || cancelled) return;
        const text = await res.text();
        const lines = text.split('\n');
        const nextMap = new Map<string, PipelineEvent>();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(line.slice(6)) as PipelineEvent;
            if (ev.stage && ev.stage !== 'init' && ev.stage !== 'end' && ev.stage !== 'signals') {
              nextMap.set(ev.stage, ev);
            }
          } catch { /* ignore */ }
        }
        if (!cancelled && nextMap.size > 0) setEvents(nextMap);
      })
      .catch(() => { /* non-fatal */ });
    return () => { cancelled = true; };
  }, [appId, isAlreadyComplete]);

  // ── Live SSE when pipeline is still running ───────────────────────────────
  useEffect(() => {
    if (!appId || isAlreadyComplete) return;

    let currentEs: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let stopped = false;

    function connect() {
      if (stopped) return;
      const es = new EventSource(`/api/pipeline/status/${appId}`);
      currentEs = es;
      esRef.current = es;
      setIsConnected(true);

      es.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data as string) as PipelineEvent;

          if (event.thinkTokens) {
            setThinkStream((prev) => prev + event.thinkTokens);
            return;
          }

          if (
            (event.stage === 'end' && (event.status === 'complete' || event.status === 'failed')) ||
            (event.stage === 'cam_generator' && event.status === 'done')
          ) {
            stopped = true;
            es.close();
            setIsConnected(false);
            return;
          }

          setEvents((prev) => {
            const next = new Map(prev);
            next.set(event.stage, event);
            return next;
          });
        } catch { /* ignore parse errors */ }
      };

      es.onerror = () => {
        setIsConnected(false);
        es.close();
        if (!stopped) reconnectTimer = setTimeout(connect, 2000);
      };
    }

    connect();

    return () => {
      stopped = true;
      clearTimeout(reconnectTimer);
      currentEs?.close();
      setIsConnected(false);
    };
  }, [appId, isAlreadyComplete]);

  // ── Build stage list for the flow chart ──────────────────────────────────
  const stages: StageInfo[] = STAGE_ORDER.map((stage) => {
    const ev = events.get(stage);

    if (!ev) {
      return {
        id: stage,
        stage,
        status: (isAlreadyComplete ? 'completed' : 'pending') as StageStatus,
        confidence: 0,
        message: isAlreadyComplete ? 'done' : 'Waiting…',
        timestamp: '',
      };
    }

    const derivedStatus: StageStatus =
      ev.status === 'done'
        ? 'completed'
        : ev.status === 'failed'
          ? 'failed'
          : isAlreadyComplete
            ? 'completed'
            : 'in-progress';

    return {
      id: stage,
      stage,
      status: derivedStatus,
      confidence: ev.confidence ?? 0,
      message: ev.message ?? ev.status,
      timestamp: ev.ts ? new Date(ev.ts).toLocaleTimeString() : '',
    };
  });

  const completedCount = stages.filter((s) => s.status === 'completed').length;
  const totalSteps = stages.length;
  const progress = (completedCount / totalSteps) * 100;

  return (
    <div className="space-y-4">

      {/* ── Phase stepper ─────────────────────────────────────────────────── */}
      <Card className="p-5">
        <div className="flex items-start">
          {PHASES.map((phase, i) => {
            const phaseStages = stages.filter((s) => phase.stages.includes(s.stage));
            const doneCount = phaseStages.filter((s) => s.status === 'completed').length;
            const total = phase.stages.length;
            const hasFailed = phaseStages.some((s) => s.status === 'failed');
            const hasActive = phaseStages.some((s) => s.status === 'in-progress');
            const allDone = doneCount === total;
            const phaseStatus = hasFailed ? 'failed' : allDone ? 'done' : hasActive ? 'active' : 'pending';
            const PhaseIcon = phase.icon;
            const prevAllDone = i > 0
              ? stages.filter((s) => PHASES[i - 1].stages.includes(s.stage)).every((s) => s.status === 'completed')
              : false;

            return (
              <div key={phase.id} className="flex items-start flex-1">
                {/* Connector arrow */}
                {i > 0 && (
                  <div className="flex items-center mt-[18px] px-1 shrink-0">
                    <ChevronRight className={`h-4 w-4 transition-colors ${prevAllDone ? 'text-emerald-400' : 'text-gray-200'
                      }`} />
                  </div>
                )}
                {/* Phase column */}
                <div className="flex flex-col items-center gap-1.5 flex-1 text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${phaseStatus === 'done' ? 'bg-emerald-100 ring-2 ring-emerald-200' :
                      phaseStatus === 'active' ? 'bg-blue-100   ring-2 ring-blue-200' :
                        phaseStatus === 'failed' ? 'bg-red-100    ring-2 ring-red-200' :
                          'bg-gray-100'
                    }`}>
                    {phaseStatus === 'done'
                      ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      : phaseStatus === 'failed'
                        ? <XCircle className="h-5 w-5 text-red-500" />
                        : <PhaseIcon className={`h-[18px] w-[18px] ${phaseStatus === 'active' ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                    }
                  </div>
                  <p className={`text-xs font-semibold leading-tight ${phaseStatus === 'done' ? 'text-emerald-700' :
                      phaseStatus === 'active' ? 'text-blue-700' :
                        phaseStatus === 'failed' ? 'text-red-600' :
                          'text-gray-400'
                    }`}>{phase.label}</p>
                  <p className={`text-[10px] font-medium ${phaseStatus === 'done' ? 'text-emerald-500' : 'text-gray-400'
                    }`}>
                    {doneCount}/{total} {phaseStatus === 'active' ? 'running' : 'complete'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar + live indicator */}
        <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{completedCount} of {totalSteps} stages completed</p>
            {isConnected && !isAlreadyComplete && (
              <span className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                </span>
                Processing live
              </span>
            )}
            {isAlreadyComplete && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                <CheckCircle2 className="h-3 w-3" /> All complete
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* ── What the AI found (when complete + decision summary available) ── */}
      {isAlreadyComplete && decisionSummary && (
        <div className={`rounded-xl border-2 p-4 ${decisionSummary.decisionBand === 'APPROVE' ? 'border-emerald-200 bg-emerald-50' :
            decisionSummary.decisionBand === 'CONDITIONAL_APPROVE' ? 'border-amber-200   bg-amber-50' :
              'border-red-200 bg-red-50'
          }`}>
          <p className={`text-[11px] font-bold uppercase tracking-wide mb-2 flex items-center gap-1.5 ${decisionSummary.decisionBand === 'APPROVE' ? 'text-emerald-600' :
              decisionSummary.decisionBand === 'CONDITIONAL_APPROVE' ? 'text-amber-600' :
                'text-red-600'
            }`}>
            <Sparkles className="h-3 w-3" />
            Analysis complete — AI has finished reviewing this application
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-sm font-extrabold ${decisionSummary.decisionBand === 'APPROVE' ? 'text-emerald-700' :
                decisionSummary.decisionBand === 'CONDITIONAL_APPROVE' ? 'text-amber-700' :
                  'text-red-700'
              }`}>
              {decisionSummary.decisionBand === 'APPROVE'
                ? 'Approve'
                : decisionSummary.decisionBand === 'CONDITIONAL_APPROVE'
                  ? 'Conditionally Approve'
                  : 'Reject'}
            </span>
            <span className="text-gray-300 text-sm">·</span>
            <span className="text-sm font-semibold text-gray-700">Score: {decisionSummary.overallScore} / 100</span>
            {decisionSummary.conflictCount > 0 && (
              <>
                <span className="text-gray-300 text-sm">·</span>
                <span className="text-xs font-semibold text-orange-600">
                  {decisionSummary.conflictCount} data conflict{decisionSummary.conflictCount > 1 ? 's' : ''} found
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1.5">
            Open the Decision Engine tab for the full breakdown, rate recommendation, and next steps.
          </p>
        </div>
      )}

      {/* ── Interactive React Flow diagram ────────────────────────────────── */}
      <PipelineFlow stages={stages} />

      {/* ── How the AI reached its conclusion ────────────────────────────── */}
      {thinkStream && (
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 text-sm mb-1 flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-500" />
            How the AI Reached Its Conclusion
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            The AI explained its reasoning step by step before making a final decision
          </p>
          <div className="bg-gray-50 rounded-xl p-3 max-h-52 overflow-y-auto text-xs text-gray-600 leading-relaxed space-y-1.5">
            {thinkStream
              .split('\n')
              .filter((line) => line.trim())
              .map((line, i) => (
                <p key={i} className="leading-relaxed">{line}</p>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
