import { useEffect, useLayoutEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
  type Edge,
  ReactFlowProvider,
} from "reactflow";
import { motion } from "framer-motion";
import { Maximize2, Minimize2, Rocket, Download, Coins, Gauge, FileJson, FileText, Check, Copy, Share2 } from "lucide-react";
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
import { isRfFlowNodeData, type FlowEdge, type FlowNode, type FlowStepData, type RfFlowNodeData } from "../types";
import { cn } from "@/lib/utils";
import type { AiWorkflowResponse } from "../aiWorkflow.types";

interface WorkflowPreviewProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  workflowData?: AiWorkflowResponse;
  estimatedTokens?: number;
  accuracy?: "Low" | "Medium" | "High";
  onChooseNodeInChat?: (node: FlowNode) => void;
  workflowId?: string;
}


const nodeTypes = {
  step: StepNode,
  rfStart: RfStartNode,
  rfEnd: RfEndNode,
  rfTask: RfTaskNode,
  rfDecision: RfDecisionNode,
  rfStub: RfStubNode,
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
        return "#f59e0b";
      case "rfTask":
        return d.variant === "taskSystem" ? "#06b6d4" : "#8b5cf6";
      case "rfStart":
        return "#10b981";
      case "rfEnd":
        return "#34d399";
      case "rfStub":
        return "#f97316";
      default:
        return "#6366f1";
    }
  }
  return "var(--primary)";
}

function FlowDiagram({
  nodesWithSelection,
  styledEdges,
  selected,
  setSelected,
  showInspector,
  contextMenu,
  setContextMenu,
  onChooseNodeInChat,
}: {
  nodesWithSelection: FlowNode[];
  styledEdges: Edge[];
  selected: FlowNode | null;
  setSelected: (n: FlowNode | null) => void;
  showInspector: boolean;
  contextMenu: { node: FlowNode; position: { x: number; y: number } } | null;
  setContextMenu: (v: { node: FlowNode; position: { x: number; y: number } } | null) => void;
  onChooseNodeInChat?: (node: FlowNode) => void;
}) {
  return (
    <>
      <ReactFlow
        nodes={nodesWithSelection}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.4}
        maxZoom={1.6}
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, n) => setSelected(n as FlowNode)}
        onPaneClick={() => setSelected(null)}
        onNodeContextMenu={(e, n) => {
          e.preventDefault();
          setContextMenu({ node: n as FlowNode, position: { x: e.clientX, y: e.clientY } });
        }}
      >
        <FitViewOnLayout layoutKey={`${nodesWithSelection.length}-${styledEdges.length}`} />
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
          className="pointer-events-auto absolute left-3 top-3 z-10 w-[280px] max-h-[min(420px,70vh)] overflow-y-auto rounded-lg border border-border bg-popover p-3 shadow-[var(--shadow-elevated)] scrollbar-thin"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Element Inspector
            </span>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>

          {isRfFlowNodeData(selected.data) ? (
            <RfInspector data={selected.data} id={selected.id} />
          ) : (
            <>
              <h4 className="mt-1.5 text-sm font-semibold">{(selected.data as FlowStepData).title}</h4>
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
                    value={(selected.data as FlowStepData).inferred ? "AI inferred" : "From doc"}
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
          onAddComment={(nodeId) => {
            const comment = window.prompt(`Add comment for "${contextMenu.node.data?.title || nodeId}":`);
            if (comment) {
              console.log("Create comment:", { nodeId, comment });
            }
          }}
          onChooseInChat={(node) => {
            if (onChooseNodeInChat) onChooseNodeInChat(node);
          }}
        />
      )}
    </>
  );
}

function RfInspector({ data, id }: { data: RfFlowNodeData; id: string }) {
  return (
    <>
      <p className="mt-1 text-[9px] font-mono uppercase tracking-wide text-muted-foreground">Node id · {id}</p>
      <h4 className="mt-1.5 text-sm font-semibold">{data.title}</h4>
      <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{data.subtitle}</p>
      <dl className="mt-2.5 space-y-1.5 text-[11px]">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Kind</dt>
          <dd className="font-medium text-foreground">{data.kind}</dd>
        </div>
        {data.actor ? (
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Actor</dt>
            <dd className="text-right font-medium text-foreground">{data.actor}</dd>
          </div>
        ) : null}
        {data.taskType ? (
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Task type</dt>
            <dd className="font-medium capitalize text-foreground">{data.taskType}</dd>
          </div>
        ) : null}
        {data.question ? (
          <div>
            <dt className="text-muted-foreground">Question</dt>
            <dd className="mt-0.5 font-medium leading-snug text-foreground">{data.question}</dd>
          </div>
        ) : null}
        {data.outcomeHandles && data.outcomeHandles.length > 0 ? (
          <div>
            <dt className="text-muted-foreground">Outcomes</dt>
            <dd className="mt-1 space-y-1">
              {data.outcomeHandles.map((h) => (
                <div key={h.id} className="rounded border border-border bg-surface/60 px-2 py-1 text-[10px]">
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

export function WorkflowPreview({
  nodes,
  edges,
  workflowData,
  estimatedTokens = 12_400,
  accuracy = "High",
  onChooseNodeInChat,
  workflowId,
}: WorkflowPreviewProps) {
  const [selected, setSelected] = useState<FlowNode | null>(null);
  const [contextMenu, setContextMenu] = useState<{ node: FlowNode; position: { x: number; y: number } } | null>(null);
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
      const canvas = viewer.get("canvas") as any;
      canvas.zoom("fit-viewport");

      const { svg } = await viewer.saveSVG();
      const svgEl = new DOMParser().parseFromString(svg, "image/svg+xml").documentElement;

      let w = parseFloat(svgEl.getAttribute("width") || "0");
      let h = parseFloat(svgEl.getAttribute("height") || "0");

      if (!w) {
        const vb = (svgEl.getAttribute("viewBox") || "0 0 1200 800").split(/[\s,]+/);
        w = +vb[2] || 1200;
        h = +vb[3] || 800;
      }

      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
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
            format: [w, h]
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
        style: { stroke: "var(--border-strong)", strokeWidth: 1.5, ...(e.style as object) },
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
          Workflow Preview
        </span>
        <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          AI flow
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setShareModalOpen(true)}
          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          aria-label="Share diagram"
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          aria-label={fullscreen ? "Exit full screen" : "Expand diagram"}
        >
          {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );

  const footer = (
    <div className="shrink-0 border-t border-border bg-surface/60 px-4 py-3">
      <div className="mb-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Coins className="h-3 w-3" /> Est. tokens
          <span className="font-semibold text-foreground">{estimatedTokens.toLocaleString()}</span>
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
          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface text-[11px] font-semibold text-foreground/85 transition-colors hover:bg-surface-2 disabled:opacity-50"
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
          className="group flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-primary text-[11px] font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-all hover:scale-[1.02]"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <FileJson className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
          )}
          {copied ? "Copié !" : "Exporter Workflow"}
        </button>
      </div>

    </div>
  );

  const flowShell = () => (
    <div className="relative min-h-0 flex-1 bg-mesh">
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
          "flex h-full min-h-0 w-[420px] shrink-0 flex-col border-l border-border bg-gradient-surface",
          expanded && "pointer-events-none invisible",
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
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-[12px] font-semibold text-foreground">{value}</div>
    </div>
  );
}
