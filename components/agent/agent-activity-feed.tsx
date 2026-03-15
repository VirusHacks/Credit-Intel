'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Brain, FileText, Search, Scale } from 'lucide-react';
import { PipelineFlow, type StageInfo, type StageStatus } from './pipeline-flow';

// ─── Live event type from /api/pipeline/status/[id] SSE ──────────────────────
interface PipelineEvent {
  appId: string;
  stage: string;
  status: 'processing' | 'done' | 'failed' | 'complete';
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
    <div className="space-y-6">
      {/* ── Summary strip ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">AI Agent Pipeline</h3>
            {isConnected && !isAlreadyComplete && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white/80" />
              </span>
            )}
            {isAlreadyComplete && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
                <CheckCircle2 className="h-3 w-3" /> All stages complete
              </span>
            )}
          </div>
          <span className="text-xl font-bold text-white tabular-nums tracking-tight">
            <span className="text-white/40">{completedCount}</span>
            <span className="text-white/20 mx-1">/</span>
            {totalSteps}
          </span>
        </div>
        
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#222222]">
          <motion.div
            className="h-full bg-white/80 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        
        <div className="mt-3 flex items-center justify-between text-xs">
          <p className="text-white/40">
            {completedCount} of {totalSteps} pipeline stages completed
          </p>
          {isConnected && !isAlreadyComplete && (
            <span className="font-medium text-white/80 animate-pulse flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
              streaming live
            </span>
          )}
        </div>
      </div>

      {/* ── Interactive React Flow diagram ────────────────────────────────── */}
      <PipelineFlow stages={stages} />

      {/* ── How the AI reached its conclusion ────────────────────────────── */}
      {thinkStream && (
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-5">
          <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-white/50 animate-pulse" />
            AI Reasoning Trace (live)
          </h3>
          <div className="rounded-xl bg-black/40 border border-white/10 p-4 max-h-64 overflow-y-auto text-xs text-white/60 font-mono whitespace-pre-wrap leading-relaxed shadow-inner">
            {thinkStream}
          </div>
        </div>
      )}
    </div>
  );
}
