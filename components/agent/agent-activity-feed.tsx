'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Brain,
  FileText,
  TrendingUp,
  Zap,
  XCircle,
} from 'lucide-react';

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

// ─── Derived display type ─────────────────────────────────────────────────────
interface ActivityItem {
  id: string;
  stage: string;
  status: 'completed' | 'in-progress' | 'pending' | 'failed';
  confidence: number;
  message: string;
  timestamp: string;
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

function stageLabel(stage: string): string {
  const labels: Record<string, string> = {
    ingest: 'Document Ingest',
    bank_statement: 'Bank Statement Agent',
    gst_analyzer: 'GST Filing Agent',
    itr_balancesheet: 'ITR / Balance Sheet Agent',
    cibil_cmr: 'CIBIL CMR Agent',
    scout: 'OSINT Scout Agent',
    qualitative_gate: 'Qualitative Input Gate',
    reconciler: 'DeepSeek-R1 Reconciler',
    cam_generator: 'CAM PDF Generator',
  };
  return labels[stage] ?? stage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

function StatusIcon({ status }: { status: ActivityItem['status'] }) {
  if (status === 'completed') return <CheckCircle2 className="w-5 h-5 text-green-600" />;
  if (status === 'in-progress') return <Zap className="w-5 h-5 text-blue-600 animate-pulse" />;
  if (status === 'failed') return <XCircle className="w-5 h-5 text-red-600" />;
  return <Clock className="w-5 h-5 text-gray-400" />;
}

function StageIcon({ stage }: { stage: string }) {
  if (stage.includes('ingest') || stage.includes('document')) return <FileText className="w-4 h-4" />;
  if (stage.includes('bank') || stage.includes('gst') || stage.includes('itr')) return <TrendingUp className="w-4 h-4" />;
  if (stage.includes('cibil') || stage.includes('risk')) return <AlertCircle className="w-4 h-4" />;
  return <Brain className="w-4 h-4" />;
}

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

  // When already complete, do a single non-streaming fetch of cached stages
  // and skip the SSE connection entirely.
  const isAlreadyComplete = pipelineStatus === 'complete';

  // One-time snapshot fetch when pipeline is already done.
  // The SSE endpoint sends cached stages + closes immediately in this case,
  // so we parse the event-stream response to populate the events map.
  useEffect(() => {
    if (!appId || !isAlreadyComplete) return;
    let cancelled = false;
    fetch(`/api/pipeline/status/${appId}`)
      .then(async (res) => {
        if (!res.body || cancelled) return;
        const text = await res.text();
        // Parse SSE lines: "data: {...}\n"
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

          // Terminal events — stop reconnecting only when truly done
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
        } catch {
          // ignore parse errors
        }
      };

      es.onerror = () => {
        setIsConnected(false);
        es.close();
        // Auto-reconnect after 2s unless terminated
        if (!stopped) {
          reconnectTimer = setTimeout(connect, 2000);
        }
      };
    }

    connect();

    return () => {
      stopped = true;
      clearTimeout(reconnectTimer);
      currentEs?.close();
      setIsConnected(false);
    };
  }, [appId]);

  // Build sorted activity list from events map
  const activities: ActivityItem[] = STAGE_ORDER.map((stage) => {
    const ev = events.get(stage);
    if (!ev) {
      // If the whole pipeline is complete, any stage we don't have cached
      // data for must have also finished successfully.
      if (isAlreadyComplete) {
        return {
          id: stage,
          stage,
          status: 'completed' as const,
          confidence: 0,
          message: 'done',
          timestamp: '',
        };
      }
      return {
        id: stage,
        stage,
        status: 'pending' as const,
        confidence: 0,
        message: 'Waiting…',
        timestamp: '',
      };
    }
    const derivedStatus =
      ev.status === 'done'
        ? ('completed' as const)
        : ev.status === 'failed'
          ? ('failed' as const)
          : isAlreadyComplete
            ? ('completed' as const) // pipeline done → treat in-progress as completed
            : ('in-progress' as const);
    return {
      id: stage,
      stage,
      status: derivedStatus,
      confidence: ev.confidence ?? 0,
      message: ev.message ?? ev.status,
      timestamp: ev.ts ? new Date(ev.ts).toLocaleTimeString() : '',
    };
  });

  const completedCount = activities.filter((a) => a.status === 'completed').length;
  const totalSteps = activities.length;
  const progress = (completedCount / totalSteps) * 100;

  return (
    <div className="space-y-6">
      {/* Progress overview */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">AI Agent Pipeline</h3>
            {isConnected && !isAlreadyComplete && (
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
              </span>
            )}
            {isAlreadyComplete && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
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
            className="bg-gradient-to-r from-blue-600 to-indigo-500 h-2 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-3">
          {completedCount} of {totalSteps} pipeline stages completed
          {!appId && ' (connect an appId for live updates)'}
        </p>
      </Card>

      {/* Timeline */}
      <motion.div
        className="space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {activities.map((activity, index) => (
          <motion.div key={activity.id} variants={itemVariants} className="relative">
            {index < activities.length - 1 && (
              <div className="absolute left-6 top-16 w-0.5 h-10 bg-gray-200 z-0" />
            )}

            <Card
              className={`p-4 border-l-4 transition-all relative z-10 ${activity.status === 'completed'
                ? 'border-l-green-600 bg-green-50'
                : activity.status === 'in-progress'
                  ? 'border-l-blue-600 bg-blue-50'
                  : activity.status === 'failed'
                    ? 'border-l-red-500 bg-red-50'
                    : 'border-l-gray-300 bg-gray-50'
                }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-0.5">
                  <StatusIcon status={activity.status} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{stageLabel(activity.stage)}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <StageIcon stage={activity.stage} />
                        {activity.message}
                      </p>
                    </div>
                    {activity.confidence > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded bg-white text-gray-700 border border-gray-200 flex-shrink-0">
                        {(activity.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  {activity.timestamp && (
                    <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Live think token stream (reconciler only) */}
      {thinkStream && (
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-600 animate-pulse" />
            DeepSeek-R1 Reasoning (live)
          </h3>
          <div className="bg-gray-50 rounded p-3 max-h-48 overflow-y-auto text-xs text-gray-600 font-mono whitespace-pre-wrap">
            {thinkStream}
          </div>
        </Card>
      )}
    </div>
  );
}
