import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  ReactFlowProvider,
} from "reactflow";
import { motion } from "framer-motion";
import {
  Maximize2,
  Minimize2,
  Coins,
  Gauge,
  FileJson,
  FileText,
  Check,
  Copy,
  Share2,
  MousePointer2,
  Hand,
  StickyNote,
  Type,
  Square,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import BpmnViewer from "bpmn-js/lib/NavigatedViewer";
import { jsonToBpmn } from "@/lib/jsonToBpmn";
import jsPDF from "jspdf";

import { NodeContextMenu } from "./NodeContextMenu";
import { ShareWorkflowModal } from "./ShareWorkflowModal";

import { StepNode } from "./StepNode";
import {
  RfStartNode,
  RfEndNode,
  RfTaskNode,
  RfDecisionNode,
  RfStubNode,
} from "./aiFlowNodes";
import {
  StickyNoteNode,
  TextNode,
  HeadingNode,
  ShapeNode,
  FrameNode,
  SourceCardNode,
  CitationCardNode,
  ChatResponseNode,
  ConceptCardNode,
  AssetCardNode,
} from "./sketchNodes";
import {
  isRfFlowNodeData,
  isSketchNodeData,
  type FlowEdge,
  type FlowNode,
  type FlowStepData,
  type RfFlowNodeData,
  type SketchNodeData,
  type SketchNodeKind,
} from "../types";
import { cn } from "@/lib/utils";
import type { AiWorkflowResponse } from "../aiWorkflow.types";

interface WorkflowPreviewProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  onNodesChange?: (changes: NodeChange[]) => void;
  onEdgesChange?: (changes: EdgeChange[]) => void;
  onConnect?: (connection: Connection) => void;
  onAddNode?: (
    kind: SketchNodeKind,
    position: { x: number; y: number },
  ) => void;
  onDeleteNode?: (id: string) => void;
  onDuplicateNode?: (id: string) => void;
  onBringNodeToFront?: (id: string) => void;
  onSendNodeToBack?: (id: string) => void;
  workflowData?: AiWorkflowResponse;
  estimatedTokens?: number;
  accuracy?: "Low" | "Medium" | "High";
  onChooseNodeInChat?: (node: FlowNode) => void;
  workflowId?: string;
  className?: string;
}

const nodeTypes = {
  step: StepNode,
  rfStart: RfStartNode,
  rfEnd: RfEndNode,
  rfTask: RfTaskNode,
  rfDecision: RfDecisionNode,
  rfStub: RfStubNode,
  "sticky-note": StickyNoteNode,
  text: TextNode,
  heading: HeadingNode,
  shape: ShapeNode,
  frame: FrameNode,
  "source-card": SourceCardNode,
  "citation-card": CitationCardNode,
  "chat-response": ChatResponseNode,
  "concept-card": ConceptCardNode,
  "asset-card": AssetCardNode,
};

const TOOL_TO_SKETCH_KIND: Partial<Record<string, SketchNodeKind>> = {
  note: "sticky-note",
  text: "text",
  shape: "shape",
  frame: "frame",
};

function FitViewOnLayout({ layoutKey }: { layoutKey: string }) {
  const { fitView } = useReactFlow();
  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => {
      fitView({ padding: 0.25, duration: 220 });
    });
    return () => cancelAnimationFrame(id);
  }, [layoutKey, fitView]);
  return null;
}

function minimapColor(node: Node) {
  if (isRfFlowNodeData(node.data as FlowStepData | RfFlowNodeData)) {
    const d = node.data as RfFlowNodeData;
    switch (d.kind) {
      case "rfDecision":
        return "var(--warning)";
      case "rfTask":
        return d.variant === "taskSystem"
          ? "var(--ink-muted-48)"
          : "var(--primary)";
      case "rfStart":
      case "rfEnd":
        return "var(--success)";
      case "rfStub":
        return "var(--warning)";
      default:
        return "var(--primary)";
    }
  }
  return "var(--primary)";
}

const TOOLBAR_TOOLS = [
  { id: "select", icon: MousePointer2, label: "Select" },
  { id: "pan", icon: Hand, label: "Pan" },
  { id: "note", icon: StickyNote, label: "Note" },
  { id: "text", icon: Type, label: "Text" },
  { id: "shape", icon: Square, label: "Shape" },
  { id: "frame", icon: Square, label: "Frame" },
] as const;

function FlowDiagram({
  nodesWithSelection,
  styledEdges,
  selected,
  setSelected,
  showInspector,
  contextMenu,
  setContextMenu,
  onChooseNodeInChat,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onAddNode,
  onDeleteNode,
  onDuplicateNode,
  onBringNodeToFront,
  onSendNodeToBack,
}: {
  nodesWithSelection: FlowNode[];
  styledEdges: Edge[];
  selected: FlowNode | null;
  setSelected: (n: FlowNode | null) => void;
  showInspector: boolean;
  contextMenu: { node: FlowNode; position: { x: number; y: number } } | null;
  setContextMenu: (
    v: { node: FlowNode; position: { x: number; y: number } } | null,
  ) => void;
  onChooseNodeInChat?: (node: FlowNode) => void;
  onNodesChange?: (changes: NodeChange[]) => void;
  onEdgesChange?: (changes: EdgeChange[]) => void;
  onConnect?: (connection: Connection) => void;
  onAddNode?: (
    kind: SketchNodeKind,
    position: { x: number; y: number },
  ) => void;
  onDeleteNode?: (id: string) => void;
  onDuplicateNode?: (id: string) => void;
  onBringNodeToFront?: (id: string) => void;
  onSendNodeToBack?: (id: string) => void;
}) {
  const [activeTool, setActiveTool] = useState("select");
  const [zoomLevel, setZoomLevel] = useState(100);
  const { zoomIn, zoomOut, fitView, screenToFlowPosition, getViewport } =
    useReactFlow();

  const handlePaneClick = useCallback(
    (e: React.MouseEvent) => {
      const kind = TOOL_TO_SKETCH_KIND[activeTool];
      if (kind && onAddNode) {
        const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        onAddNode(kind, position);
        setActiveTool("select");
        return;
      }
      setSelected(null);
    },
    [activeTool, onAddNode, screenToFlowPosition, setSelected],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelected(null);
        setContextMenu(null);
      }
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selected &&
        onDeleteNode
      ) {
        const target = e.target as HTMLElement;
        const isEditingText =
          target.tagName === "INPUT" || target.tagName === "TEXTAREA";
        if (!isEditingText) {
          onDeleteNode(selected.id);
          setSelected(null);
        }
      }
    },
    [selected, onDeleteNode, setSelected, setContextMenu],
  );

  const handleZoomIn = useCallback(() => {
    zoomIn();
    setZoomLevel((p) => Math.min(p + 10, 160));
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut();
    setZoomLevel((p) => Math.max(p - 10, 40));
  }, [zoomOut]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.25, duration: 220 });
    setZoomLevel(100);
  }, [fitView]);

  return (
    <>
      {/* Board toolbar. Centered via flex (not left-1/2 + -translate-x-1/2)
          so the pill can shrink/scroll instead of clipping off both edges
          of narrow (<400px) viewports. */}
      <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-3">
        <div className="pointer-events-auto flex max-w-full min-w-0 items-center gap-0.5 overflow-x-auto rounded-pill border border-hairline bg-canvas px-1.5 py-1 shadow-[var(--shadow-hairline)] scrollbar-thin">
          <div className="flex shrink-0 items-center gap-0.5">
            {TOOLBAR_TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setActiveTool(tool.id)}
                  aria-label={tool.label}
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-md transition-all active:scale-90 ${
                    activeTool === tool.id
                      ? "bg-primary/15 text-primary"
                      : "text-ink-muted-48 hover:bg-surface-2 hover:text-ink"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={handleZoomOut}
              aria-label="Zoom out"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-ink-muted-48 transition-all active:scale-90 hover:bg-surface-2 hover:text-ink"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-[36px] shrink-0 text-center text-fine-print font-medium text-ink">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              aria-label="Zoom in"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-ink-muted-48 transition-all active:scale-90 hover:bg-surface-2 hover:text-ink"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleFitView}
              aria-label="Fit view"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-ink-muted-48 transition-all active:scale-90 hover:bg-surface-2 hover:text-ink"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <ReactFlow
        nodes={nodesWithSelection}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.4}
        maxZoom={1.6}
        proOptions={{ hideAttribution: true }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, n) => setSelected(n as FlowNode)}
        onPaneClick={handlePaneClick}
        onNodeContextMenu={(e, n) => {
          e.preventDefault();
          setContextMenu({
            node: n as FlowNode,
            position: { x: e.clientX, y: e.clientY },
          });
        }}
        onKeyDown={handleKeyDown}
        onMoveEnd={() => {
          setZoomLevel(Math.round(getViewport().zoom * 100));
        }}
      >
        <FitViewOnLayout
          layoutKey={`${nodesWithSelection.length}-${styledEdges.length}`}
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1}
          color="oklch(0.35 0.02 265)"
        />
        <Controls position="bottom-right" showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          maskColor="oklch(0.16 0.02 265 / 0.7)"
          nodeColor={(n) => minimapColor(n as Node)}
          nodeStrokeWidth={2}
          style={{ width: 110, height: 80 }}
        />
      </ReactFlow>

      {showInspector && selected && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-auto absolute left-3 top-3 z-10 w-[280px] max-h-[min(420px,70vh)] overflow-y-auto rounded-lg border border-border bg-popover p-3 shadow-[var(--shadow-hairline)] scrollbar-thin"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Element Inspector
            </span>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-[10px] text-muted-foreground transition-colors active:scale-95 hover:text-foreground"
            >
              Close
            </button>
          </div>

          {isRfFlowNodeData(selected.data) ? (
            <RfInspector data={selected.data} id={selected.id} />
          ) : isSketchNodeData(selected.data) ? (
            <SketchInspector data={selected.data} id={selected.id} />
          ) : (
            <>
              <h4 className="mt-1.5 text-sm font-semibold">
                {(selected.data as FlowStepData).title}
              </h4>
              <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
                {(selected.data as FlowStepData).subtitle}
              </p>
              {(selected.data as FlowStepData).confidence != null && (
                <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px]">
                  <Stat
                    label="Confidence"
                    value={`${Math.round((selected.data as FlowStepData).confidence! * 100)}%`}
                  />
                  <Stat
                    label="Source"
                    value={
                      (selected.data as FlowStepData).inferred
                        ? "AI inferred"
                        : "From doc"
                    }
                  />
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      {contextMenu && (
        <NodeContextMenu
          node={contextMenu.node}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onChooseInChat={(node) => {
            if (onChooseNodeInChat) onChooseNodeInChat(node);
          }}
          onDuplicate={onDuplicateNode}
          onDelete={(nodeId) => {
            if (selected?.id === nodeId) setSelected(null);
            onDeleteNode?.(nodeId);
          }}
          onBringToFront={onBringNodeToFront}
          onSendToBack={onSendNodeToBack}
        />
      )}
    </>
  );
}

function RfInspector({ data, id }: { data: RfFlowNodeData; id: string }) {
  return (
    <>
      <p className="mt-1 text-[9px] font-mono uppercase tracking-wide text-muted-foreground">
        Node id · {id}
      </p>
      <h4 className="mt-1.5 text-sm font-semibold">{data.title}</h4>
      <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
        {data.subtitle}
      </p>
      <dl className="mt-2.5 space-y-1.5 text-[11px]">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Kind</dt>
          <dd className="font-medium text-foreground">{data.kind}</dd>
        </div>
        {data.actor ? (
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Actor</dt>
            <dd className="text-right font-medium text-foreground">
              {data.actor}
            </dd>
          </div>
        ) : null}
        {data.taskType ? (
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Task type</dt>
            <dd className="font-medium capitalize text-foreground">
              {data.taskType}
            </dd>
          </div>
        ) : null}
        {data.question ? (
          <div>
            <dt className="text-muted-foreground">Question</dt>
            <dd className="mt-0.5 font-medium leading-snug text-foreground">
              {data.question}
            </dd>
          </div>
        ) : null}
        {data.outcomeHandles && data.outcomeHandles.length > 0 ? (
          <div>
            <dt className="text-muted-foreground">Outcomes</dt>
            <dd className="mt-1 space-y-1">
              {data.outcomeHandles.map((h) => (
                <div
                  key={h.id}
                  className="rounded border border-border bg-surface/60 px-2 py-1 text-[10px]"
                >
                  {h.label}
                </div>
              ))}
            </dd>
          </div>
        ) : null}
      </dl>
    </>
  );
}

function SketchInspector({ data, id }: { data: SketchNodeData; id: string }) {
  return (
    <>
      <p className="mt-1 text-[9px] font-mono uppercase tracking-wide text-muted-foreground">
        Node id · {id}
      </p>
      <h4 className="mt-1.5 text-sm font-semibold capitalize">
        {data.title || data.kind.replace(/-/g, " ")}
      </h4>
      {data.content && (
        <p className="mt-0.5 line-clamp-4 text-[11.5px] leading-snug text-muted-foreground">
          {data.content}
        </p>
      )}
      <dl className="mt-2.5 space-y-1.5 text-[11px]">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Kind</dt>
          <dd className="font-medium capitalize text-foreground">
            {data.kind.replace(/-/g, " ")}
          </dd>
        </div>
        {data.sourceType ? (
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Source type</dt>
            <dd className="font-medium capitalize text-foreground">
              {data.sourceType}
            </dd>
          </div>
        ) : null}
        {data.assetType ? (
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Asset type</dt>
            <dd className="font-medium capitalize text-foreground">
              {data.assetType}
            </dd>
          </div>
        ) : null}
      </dl>
    </>
  );
}

export function WorkflowPreview({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onAddNode,
  onDeleteNode,
  onDuplicateNode,
  onBringNodeToFront,
  onSendNodeToBack,
  workflowData,
  estimatedTokens = 12_400,
  accuracy = "High",
  onChooseNodeInChat,
  workflowId,
  className,
}: WorkflowPreviewProps) {
  const [selected, setSelected] = useState<FlowNode | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    node: FlowNode;
    position: { x: number; y: number };
  } | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const bpmnContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const handleExportBPMN = async () => {
    if (!workflowData || isExporting) return;
    setIsExporting(true);
    try {
      const xml = jsonToBpmn(workflowData);
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.width = "1200px";
      tempDiv.style.height = "800px";
      document.body.appendChild(tempDiv);

      const viewer = new BpmnViewer({ container: tempDiv });
      await viewer.importXML(xml);
      const canvas = viewer.get("canvas") as { zoom: (mode: string) => void };
      canvas.zoom("fit-viewport");

      const { svg } = await viewer.saveSVG();
      const svgEl = new DOMParser().parseFromString(
        svg,
        "image/svg+xml",
      ).documentElement;

      let w = parseFloat(svgEl.getAttribute("width") || "0");
      let h = parseFloat(svgEl.getAttribute("height") || "0");

      if (!w) {
        const vb = (svgEl.getAttribute("viewBox") || "0 0 1200 800").split(
          /[\s,]+/,
        );
        w = +vb[2] || 1200;
        h = +vb[3] || 800;
      }

      const url = URL.createObjectURL(
        new Blob([svg], { type: "image/svg+xml" }),
      );
      const img = new Image();

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const scale = 2;
          const canvasEl = document.createElement("canvas");
          canvasEl.width = w * scale;
          canvasEl.height = h * scale;
          const ctx = canvasEl.getContext("2d")!;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0, w, h);

          const doc = new jsPDF({
            orientation: w > h ? "landscape" : "portrait",
            unit: "px",
            format: [w, h],
          });

          doc.addImage(canvasEl.toDataURL("image/png"), "PNG", 0, 0, w, h);
          doc.save(`workflow-export-${Date.now()}.pdf`);
          URL.revokeObjectURL(url);
          resolve();
        };
        img.onerror = reject;
        img.src = url;
      });

      viewer.destroy();
      document.body.removeChild(tempDiv);
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyWorkflow = () => {
    if (!workflowData) return;
    navigator.clipboard.writeText(JSON.stringify(workflowData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [expanded]);

  const nodesWithSelection = useMemo<FlowNode[]>(
    () => nodes.map((n) => ({ ...n, selected: n.id === selected?.id })),
    [nodes, selected],
  );
  const styledEdges = useMemo<Edge[]>(
    () =>
      edges.map((e) => ({
        ...e,
        type: e.type ?? "smoothstep",
        style: {
          stroke: "var(--border-strong)",
          strokeWidth: 1.5,
          ...(e.style as object),
        },
      })),
    [edges],
  );

  const layoutKey = expanded ? "fullscreen" : "sidebar";

  const header = (fullscreen: boolean) => (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between border-b border-border px-4",
        fullscreen ? "h-14 bg-background/95 backdrop-blur" : "h-12",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Sketch Board
        </span>
        <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          AI flow
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setShareModalOpen(true)}
          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors active:scale-90 hover:bg-surface-2 hover:text-foreground"
          aria-label="Share diagram"
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors active:scale-90 hover:bg-surface-2 hover:text-foreground"
          aria-label={fullscreen ? "Exit full screen" : "Expand diagram"}
        >
          {fullscreen ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );

  const footer = (
    <div className="shrink-0 border-t border-border bg-surface/60 px-4 py-3">
      <div className="mb-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Coins className="h-3 w-3" /> Est. tokens
          <span className="font-semibold text-foreground">
            {estimatedTokens.toLocaleString()}
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <Gauge className="h-3 w-3" /> Accuracy
          <span className="font-semibold text-success">{accuracy}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleExportBPMN}
          disabled={isExporting}
          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface text-[11px] font-semibold text-foreground/85 transition-all active:scale-[0.98] hover:bg-surface-2 disabled:opacity-50"
        >
          {isExporting ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <FileText className="h-3.5 w-3.5 text-primary" />
          )}
          Exporter BPM
        </button>
        <button
          type="button"
          onClick={handleCopyWorkflow}
          className="group flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-[11px] font-semibold text-primary-foreground transition-all active:scale-95 hover:bg-primary/90"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <FileJson className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
          )}
          {copied ? "Copié !" : "Exporter le projet"}
        </button>
      </div>
    </div>
  );

  const flowShell = () => (
    <div className="relative min-h-0 flex-1 bg-background">
      <ReactFlowProvider key={layoutKey}>
        <div className="absolute inset-0">
          <FlowDiagram
            nodesWithSelection={nodesWithSelection}
            styledEdges={styledEdges}
            selected={selected}
            setSelected={setSelected}
            showInspector
            contextMenu={contextMenu}
            setContextMenu={setContextMenu}
            onChooseNodeInChat={onChooseNodeInChat}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onAddNode={onAddNode}
            onDeleteNode={onDeleteNode}
            onDuplicateNode={onDuplicateNode}
            onBringNodeToFront={onBringNodeToFront}
            onSendNodeToBack={onSendNodeToBack}
          />
        </div>
      </ReactFlowProvider>
    </div>
  );

  const fullscreenOverlay =
    mounted &&
    expanded &&
    createPortal(
      <div className="fixed inset-0 z-[200] flex flex-col bg-background text-foreground">
        {header(true)}
        {flowShell()}
        {footer}
      </div>,
      document.body,
    );

  return (
    <>
      <aside
        className={cn(
          "flex h-full min-h-0 w-full shrink-0 flex-col bg-background",
          expanded && "pointer-events-none invisible",
          className,
        )}
        aria-hidden={expanded}
      >
        {header(false)}
        {flowShell()}
        {footer}
      </aside>
      {fullscreenOverlay}
      <ShareWorkflowModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        workflowId={workflowId || "default"}
      />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface/70 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-[12px] font-semibold text-foreground">
        {value}
      </div>
    </div>
  );
}
