'use client';

import { useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  FileText,
  TrendingUp,
  AlertCircle,
  Brain,
  Shield,
  Search,
  GitMerge,
  FileBarChart2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type StageStatus = 'completed' | 'in-progress' | 'pending' | 'failed';

export interface StageInfo {
  id: string;
  stage: string;
  status: StageStatus;
  confidence: number;
  message: string;
  timestamp: string;
}

// ─── Stage meta ───────────────────────────────────────────────────────────────
const STAGE_META: Record<string, { label: string; icon: React.ReactNode; group: string }> = {
  ingest: { label: 'Document Ingest', icon: <FileText className="h-4 w-4" />, group: 'io' },
  bank_statement: { label: 'Bank Statement', icon: <TrendingUp className="h-4 w-4" />, group: 'agent' },
  gst_analyzer: { label: 'GST Filing', icon: <Shield className="h-4 w-4" />, group: 'agent' },
  itr_balancesheet: { label: 'ITR / Balance Sheet', icon: <Brain className="h-4 w-4" />, group: 'agent' },
  cibil_cmr: { label: 'CIBIL CMR', icon: <AlertCircle className="h-4 w-4" />, group: 'agent' },
  scout: { label: 'OSINT Scout', icon: <Search className="h-4 w-4" />, group: 'agent' },
  qualitative_gate: { label: 'Qualitative Gate', icon: <GitMerge className="h-4 w-4" />, group: 'gate' },
  reconciler: { label: 'AI Reconciler', icon: <Brain className="h-4 w-4" />, group: 'reconciler' },
  cam_generator: { label: 'CAM Generator', icon: <FileBarChart2 className="h-4 w-4" />, group: 'io' },
};

// ─── Status styling ───────────────────────────────────────────────────────────
function statusStyle(status: StageStatus) {
  switch (status) {
    case 'completed':
      return {
        border: '2px solid #16a34a',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        shadow: '0 0 0 3px rgba(22,163,74,0.15)',
      };
    case 'in-progress':
      return {
        border: '2px solid #2563eb',
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        shadow: '0 0 0 3px rgba(37,99,235,0.20)',
      };
    case 'failed':
      return {
        border: '2px solid #dc2626',
        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
        shadow: '0 0 0 3px rgba(220,38,38,0.15)',
      };
    default:
      return {
        border: '2px solid #e5e7eb',
        background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
        shadow: 'none',
      };
  }
}

// ─── Custom node ──────────────────────────────────────────────────────────────
interface PipelineNodeData extends Record<string, unknown> {
  stage: string;
  status: StageStatus;
  message: string;
  confidence: number;
  timestamp: string;
}

function StatusIcon({ status, className }: { status: StageStatus; className?: string }) {
  if (status === 'completed') return <CheckCircle2 className={`text-green-600 ${className}`} />;
  if (status === 'in-progress') return <Zap className={`text-blue-600 animate-pulse ${className}`} />;
  if (status === 'failed') return <XCircle className={`text-red-600 ${className}`} />;
  return <Clock className={`text-gray-400 ${className}`} />;
}

function PipelineNode({ data }: NodeProps) {
  const d = data as PipelineNodeData;
  const meta = STAGE_META[d.stage] ?? { label: d.stage, icon: <Brain className="h-4 w-4" />, group: 'agent' };
  const { border, background, shadow } = statusStyle(d.status);
  const confPct = d.confidence > 0 ? `${Math.round(d.confidence * 100)}%` : null;

  const labelColor =
    d.status === 'completed' ? '#15803d' :
    d.status === 'in-progress' ? '#1d4ed8' :
    d.status === 'failed' ? '#b91c1c' :
    '#6b7280';

  return (
    <div
      style={{
        border,
        background,
        boxShadow: shadow,
        borderRadius: 12,
        minWidth: 168,
        padding: '10px 14px',
        fontFamily: 'inherit',
        position: 'relative',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#94a3b8', width: 8, height: 8 }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: labelColor }}>{meta.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
            {meta.label}
          </span>
        </div>
        <StatusIcon status={d.status} className="h-4 w-4 shrink-0" />
      </div>

      {/* Message */}
      <p style={{ fontSize: 10, color: '#6b7280', margin: 0, lineHeight: 1.4 }}>
        {d.message || 'Waiting…'}
      </p>

      {/* Footer row: confidence + timestamp */}
      {(confPct || d.timestamp) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, gap: 4 }}>
          {confPct && (
            <span style={{
              fontSize: 10, fontWeight: 600,
              background: d.status === 'completed' ? '#dcfce7' : '#e0e7ff',
              color: d.status === 'completed' ? '#15803d' : '#3730a3',
              borderRadius: 4, padding: '1px 5px',
            }}>
              {confPct} conf.
            </span>
          )}
          {d.timestamp && (
            <span style={{ fontSize: 9, color: '#9ca3af', marginLeft: 'auto' }}>{d.timestamp}</span>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: '#94a3b8', width: 8, height: 8 }} />
    </div>
  );
}

// ─── Layout constants ─────────────────────────────────────────────────────────
// x positions for the 5 parallel agents (spread evenly around center=420)
const AGENT_X = [60, 220, 380, 540, 700];
const NODE_W = 168;
const CENTER_X = 420 - NODE_W / 2;

// ─── Build nodes + edges from stage data ─────────────────────────────────────
function buildGraph(stages: StageInfo[]): { nodes: Node[]; edges: Edge[] } {
  const stageMap = Object.fromEntries(stages.map((s) => [s.stage, s]));

  function node(id: string, x: number, y: number): Node {
    const s = stageMap[id];
    return {
      id,
      type: 'pipeline',
      position: { x, y },
      data: {
        stage: id,
        status: s?.status ?? 'pending',
        message: s?.message ?? 'Waiting…',
        confidence: s?.confidence ?? 0,
        timestamp: s?.timestamp ?? '',
      },
    };
  }

  function edge(
    source: string,
    target: string,
    status: StageStatus,
  ): Edge {
    const done = status === 'completed';
    const active = status === 'in-progress';
    return {
      id: `${source}->${target}`,
      source,
      target,
      animated: active,
      style: {
        stroke: done ? '#16a34a' : active ? '#2563eb' : '#d1d5db',
        strokeWidth: done ? 2 : 1.5,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: done ? '#16a34a' : active ? '#2563eb' : '#d1d5db',
        width: 18,
        height: 18,
      },
    };
  }

  const ingest = stageMap['ingest'];
  const qGate = stageMap['qualitative_gate'];
  const reconciler = stageMap['reconciler'];
  const cam = stageMap['cam_generator'];

  const parallelAgents = ['bank_statement', 'gst_analyzer', 'itr_balancesheet', 'cibil_cmr', 'scout'];

  const nodes: Node[] = [
    node('ingest', CENTER_X, 0),
    ...parallelAgents.map((id, i) => node(id, AGENT_X[i], 170)),
    node('qualitative_gate', CENTER_X, 360),
    node('reconciler', CENTER_X, 530),
    node('cam_generator', CENTER_X, 700),
  ];

  const edges: Edge[] = [
    // ingest → each parallel agent
    ...parallelAgents.map((id) =>
      edge('ingest', id, ingest?.status ?? 'pending'),
    ),
    // each parallel agent → qualitative_gate
    ...parallelAgents.map((id) =>
      edge(id, 'qualitative_gate', stageMap[id]?.status ?? 'pending'),
    ),
    edge('qualitative_gate', 'reconciler', qGate?.status ?? 'pending'),
    edge('reconciler', 'cam_generator', reconciler?.status ?? 'pending'),
  ];

  return { nodes, edges };
}

// ─── Main component ───────────────────────────────────────────────────────────
const nodeTypes = { pipeline: PipelineNode };

interface PipelineFlowProps {
  stages: StageInfo[];
}

export function PipelineFlow({ stages }: PipelineFlowProps) {
  const { nodes: initNodes, edges: initEdges } = useMemo(() => buildGraph(stages), []);
  const [nodes, setNodes] = useNodesState(initNodes);
  const [edges, setEdges] = useEdgesState(initEdges);

  // Re-sync whenever stages change (live updates)
  useEffect(() => {
    const { nodes: n, edges: e } = buildGraph(stages);
    setNodes(n);
    setEdges(e);
  }, [stages, setNodes, setEdges]);

  const onNodesChange = useCallback(
    (changes: Parameters<typeof applyNodeChanges>[0]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes],
  );
  const onEdgesChange = useCallback(
    (changes: Parameters<typeof applyEdgeChanges>[0]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges],
  );

  const completedCount = stages.filter((s) => s.status === 'completed').length;
  const hasActive = stages.some((s) => s.status === 'in-progress');

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      {/* Legend bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-gray-50">
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" /> Completed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block" /> In Progress
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" /> Failed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300 inline-block" /> Pending
          </span>
        </div>
        <span className="text-xs font-semibold text-gray-500">
          {completedCount}/{stages.length} stages
          {hasActive && <span className="ml-2 text-blue-600 animate-pulse">● live</span>}
        </span>
      </div>

      {/* React Flow canvas */}
      <div style={{ height: 920 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.18, maxZoom: 1.1 }}
          minZoom={0.35}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          panOnDrag
          zoomOnScroll
        >
          <Background color="#e5e7eb" gap={20} size={1} />
          <Controls
            style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8 }}
          />
          <MiniMap
            nodeColor={(n) => {
              const d = n.data as PipelineNodeData;
              if (d.status === 'completed') return '#16a34a';
              if (d.status === 'in-progress') return '#2563eb';
              if (d.status === 'failed') return '#dc2626';
              return '#d1d5db';
            }}
            style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8 }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
