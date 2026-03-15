"use client";

import { useEffect, useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
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
  MiniMap,
} from "@xyflow/react";
// @ts-ignore - Valid import, just missing type declaration
import "@xyflow/react/dist/style.css";
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
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type StageStatus = "completed" | "in-progress" | "pending" | "failed";

export interface StageInfo {
  id: string;
  stage: string;
  status: StageStatus;
  confidence: number;
  message: string;
  timestamp: string;
}

// ─── Stage meta ───────────────────────────────────────────────────────────────
const STAGE_META: Record<
  string,
  { label: string; icon: React.ReactNode; group: string }
> = {
  ingest: {
    label: "Document Ingest",
    icon: <FileText className="h-4 w-4" />,
    group: "io",
  },
  bank_statement: {
    label: "Bank Statement",
    icon: <TrendingUp className="h-4 w-4" />,
    group: "agent",
  },
  gst_analyzer: {
    label: "GST Filing",
    icon: <Shield className="h-4 w-4" />,
    group: "agent",
  },
  itr_balancesheet: {
    label: "ITR / Balance Sheet",
    icon: <Brain className="h-4 w-4" />,
    group: "agent",
  },
  cibil_cmr: {
    label: "CIBIL CMR",
    icon: <AlertCircle className="h-4 w-4" />,
    group: "agent",
  },
  scout: {
    label: "OSINT Scout",
    icon: <Search className="h-4 w-4" />,
    group: "agent",
  },
  qualitative_gate: {
    label: "Field Notes Review",
    icon: <GitMerge className="h-4 w-4" />,
    group: "gate",
  },
  reconciler: {
    label: "AI Reconciler",
    icon: <Brain className="h-4 w-4" />,
    group: "reconciler",
  },
  cam_generator: {
    label: "CAM Generator",
    icon: <FileBarChart2 className="h-4 w-4" />,
    group: "io",
  },
};

// ─── Monochromatic Status styling ─────────────────────────────────────────────
function statusStyle(status: StageStatus) {
  switch (status) {
    case "completed":
      return {
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.05)",
        shadow: "none",
        backdropFilter: "blur(16px)",
      };
    case "in-progress":
      return {
        border: "1px solid rgba(255,255,255,0.3)",
        background: "rgba(255,255,255,0.1)",
        shadow: "0 0 15px rgba(255,255,255,0.1)",
        backdropFilter: "blur(16px)",
      };
    case "failed":
      return {
        border: "1px dashed rgba(255,255,255,0.3)",
        background: "rgba(0,0,0,0.5)",
        shadow: "none",
        backdropFilter: "blur(16px)",
      };
    default:
      return {
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.02)",
        shadow: "none",
        backdropFilter: "blur(16px)",
      };
  }
}

// ─── Confidence label helper ────────────────────────────────────────────────
function confLabel(
  confidence: number
): { text: string; color: string; bg: string } | null {
  if (confidence <= 0) return null;
  if (confidence >= 0.85)
    return { text: "✓ HIGH FIDELITY", color: "#fff", bg: "rgba(255,255,255,0.2)" };
  if (confidence >= 0.65)
    return { text: "~ PARTIAL", color: "rgba(255,255,255,0.6)", bg: "rgba(255,255,255,0.1)" };
  return { text: "! LOW CONFIDENCE", color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.05)" };
}

// ─── Custom node ──────────────────────────────────────────────────────────────
interface PipelineNodeData extends Record<string, unknown> {
  stage: string;
  status: StageStatus;
  message: string;
  confidence: number;
  timestamp: string;
}

function StatusIcon({
  status,
  className,
}: {
  status: StageStatus;
  className?: string;
}) {
  if (status === "completed")
    return <CheckCircle2 className={`text-white/60 ${className}`} />;
  if (status === "in-progress")
    return <Zap className={`text-white animate-pulse ${className}`} />;
  if (status === "failed")
    return <XCircle className={`text-white/80 ${className}`} />;
  return <Clock className={`text-white/20 ${className}`} />;
}

function PipelineNode({ data }: NodeProps) {
  const d = data as PipelineNodeData;
  const meta = STAGE_META[d.stage] ?? {
    label: d.stage,
    icon: <Brain className="h-4 w-4" />,
    group: "agent",
  };
  const { border, background, shadow, backdropFilter } = statusStyle(d.status);
  const confPct =
    d.confidence > 0 ? `${Math.round(d.confidence * 100)}%` : null;

  const labelColor =
    d.status === "completed"
      ? "rgba(255,255,255,0.8)"
      : d.status === "in-progress"
      ? "#ffffff"
      : d.status === "failed"
      ? "rgba(255,255,255,0.9)"
      : "rgba(255,255,255,0.4)";

  const activeNode = d.status === "in-progress";

  return (
    <div
      className={activeNode ? "ring-2 ring-white/20" : ""}
      style={{
        border,
        background,
        boxShadow: shadow,
        backdropFilter,
        WebkitBackdropFilter: backdropFilter,
        borderRadius: 12,
        minWidth: 168,
        padding: "10px 14px",
        fontFamily: "inherit",
        position: "relative",
        transition: "all 0.3s ease",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "#444", width: 8, height: 8, border: "none" }}
      />

      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          marginBottom: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ color: labelColor }}>{meta.icon}</span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: labelColor,
              lineHeight: 1.2,
            }}
          >
            {meta.label}
          </span>
        </div>
        <StatusIcon status={d.status} className="h-4 w-4 shrink-0" />
      </div>

      {/* Message */}
      <p
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.4)",
          margin: 0,
          lineHeight: 1.4,
        }}
      >
        {d.message || "Waiting…"}
      </p>

      {/* Footer row: confidence + timestamp */}
      {(confPct || d.timestamp) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
            gap: 4,
          }}
        >
          {confPct && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                background: d.status === "completed" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.2)",
                color: d.status === "completed" ? "rgba(255,255,255,0.4)" : "#fff",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 4,
                padding: "1px 6px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {confLabel(d.confidence)?.text || confPct}
            </span>
          )}
          {d.timestamp && (
            <span
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.3)",
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
              }}
            >
              {d.timestamp}
            </span>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "#444", width: 8, height: 8, border: "none" }}
      />
    </div>
  );
}

// ─── Layout constants ─────────────────────────────────────────────────────────
// x positions for the 5 parallel agents (spread evenly around center=420)
// Increased spacing to avoid overlap (200px spacing instead of 160px)
const AGENT_X = [20, 220, 420, 620, 820];
const NODE_W = 168; // width of node roughly
const CENTER_X = 420; // 420 + 84 = 504 middle

// ─── Build nodes + edges from stage data ─────────────────────────────────────
function buildGraph(stages: StageInfo[]): { nodes: Node[]; edges: Edge[] } {
  const stageMap = Object.fromEntries(stages.map((s) => [s.stage, s]));

  function node(id: string, x: number, y: number): Node {
    const s = stageMap[id];
    return {
      id,
      type: "pipeline",
      // We subtract half width to center the node exactly on the X coordinate
      position: { x: x - NODE_W / 2, y },
      data: {
        stage: id,
        status: s?.status ?? "pending",
        message: s?.message ?? "Waiting…",
        confidence: s?.confidence ?? 0,
        timestamp: s?.timestamp ?? "",
      },
    };
  }

  function edge(source: string, target: string, status: StageStatus): Edge {
    const done = status === "completed";
    const active = status === "in-progress";
    const failed = status === "failed";

    // Monochromatic edge colors
    const edgeColor = done
      ? "rgba(255,255,255,0.3)"
      : active
      ? "rgba(255,255,255,0.8)"
      : failed
      ? "rgba(255,255,255,0.5)"
      : "#222222";

    return {
      id: `${source}->${target}`,
      source,
      target,
      type: "smoothstep", // Use right-angle lines instead of messy bezier curves
      animated: active,
      style: {
        stroke: edgeColor,
        strokeWidth: done || active ? 2 : 1.5,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeColor,
        width: 18,
        height: 18,
      },
    };
  }

  const ingest = stageMap["ingest"];
  const qGate = stageMap["qualitative_gate"];
  const reconciler = stageMap["reconciler"];

  const parallelAgents = [
    "bank_statement",
    "gst_analyzer",
    "itr_balancesheet",
    "cibil_cmr",
    "scout",
  ];

  const nodes: Node[] = [
    node("ingest", CENTER_X, 0),
    ...parallelAgents.map((id, i) => node(id, AGENT_X[i], 170)),
    node("qualitative_gate", CENTER_X, 360),
    node("reconciler", CENTER_X, 530),
    node("cam_generator", CENTER_X, 700),
  ];

  const edges: Edge[] = [
    // ingest → each parallel agent
    ...parallelAgents.map((id) =>
      edge("ingest", id, ingest?.status ?? "pending")
    ),
    // each parallel agent → qualitative_gate
    ...parallelAgents.map((id) =>
      edge(id, "qualitative_gate", stageMap[id]?.status ?? "pending")
    ),
    edge("qualitative_gate", "reconciler", qGate?.status ?? "pending"),
    edge("reconciler", "cam_generator", reconciler?.status ?? "pending"),
  ];

  return { nodes, edges };
}

// ─── Main component ───────────────────────────────────────────────────────────
const nodeTypes = { pipeline: PipelineNode };

interface PipelineFlowProps {
  stages: StageInfo[];
}

export function PipelineFlow({ stages }: PipelineFlowProps) {
  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildGraph(stages),
    []
  );
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
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes: Parameters<typeof applyEdgeChanges>[0]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const completedCount = stages.filter((s) => s.status === "completed").length;
  const hasActive = stages.some((s) => s.status === "in-progress");

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-3xl shadow-2xl overflow-hidden group">
      {/* Legend bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-5 text-xs text-white/60">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-white/60 inline-block border border-white/20" />{" "}
            Completed
          </span>
          <span className="flex items-center gap-2 text-white">
            <span className="h-2.5 w-2.5 rounded-full bg-white inline-block shadow-[0_0_8px_rgba(255,255,255,0.5)]" />{" "}
            In Progress
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#111111] border border-white/50 inline-block border-dashed" />{" "}
            Failed
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-transparent border border-[#333] inline-block" />{" "}
            Pending
          </span>
        </div>
        <span className="text-xs font-medium text-white/50">
          {completedCount} / {stages.length} stages
          {hasActive && (
            <span className="ml-3 text-white animate-pulse">● live</span>
          )}
        </span>
      </div>

      {/* React Flow canvas */}
      <div style={{ height: 780 }}>
        <ReactFlow
          colorMode="dark"
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
          className="bg-transparent"
        >
          <Background color="#222222" gap={20} size={1} />
          <Controls
            className="bg-[#111111] border-[#222222] fill-white"
            style={{ borderRadius: 8 }}
          />
          <MiniMap
            nodeColor={(n) => {
              const d = n.data as PipelineNodeData;
              if (d.status === "completed") return "rgba(255,255,255,0.2)";
              if (d.status === "in-progress") return "rgba(255,255,255,0.8)";
              if (d.status === "failed") return "rgba(255,255,255,0.4)";
              return "rgba(255,255,255,0.05)";
            }}
            maskColor="rgba(0, 0, 0, 0.8)"
            style={{
              background: "rgba(20, 20, 20, 0.9)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              backdropFilter: "blur(10px)",
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
