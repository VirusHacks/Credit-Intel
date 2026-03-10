'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Brain } from 'lucide-react';
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

// ─── Props ────────────────────────────────────────────────────────────────────
interface AgentActivityFeedProps {
  /** Real application UUID; if omitted, shows demo/static data */
  appId?: string;
  /**
   * Current pipeline status from the parent page.
   * When 'complete', we skip live SSE and show all stages as completed.
   */
  pipelineStatus?: string;
}

export function AgentActivityFeed({ appId, pipelineStatus }: AgentActivityFeedProps) {
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
      {/* ── Summary strip ─────────────────────────────────────────────────── */}
      <Card className="p-5 bg-linear-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">AI Agent Pipeline</h3>
            {isConnected && !isAlreadyComplete && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-600" />
              </span>
            )}
            {isAlreadyComplete && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                <CheckCircle2 className="h-3 w-3" /> All stages complete
              </span>
            )}
          </div>
          <span className="text-2xl font-bold text-blue-600">
            {completedCount}/{totalSteps}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-linear-to-r from-blue-600 to-indigo-500 h-2 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {completedCount} of {totalSteps} pipeline stages completed
          {isConnected && !isAlreadyComplete && (
            <span className="ml-2 text-blue-600 text-xs font-medium animate-pulse">● streaming live</span>
          )}
        </p>
      </Card>

      {/* ── Interactive React Flow diagram ────────────────────────────────── */}
      <PipelineFlow stages={stages} />

      {/* ── Live AI reasoning trace ──────────────────────────────────────── */}
      {thinkStream && (
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-600 animate-pulse" />
            AI Reasoning Trace (live)
          </h3>
          <div className="bg-gray-50 rounded p-3 max-h-56 overflow-y-auto text-xs text-gray-600 font-mono whitespace-pre-wrap leading-relaxed">
            {thinkStream}
          </div>
        </Card>
      )}
    </div>
  );
}
