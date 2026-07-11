import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { User, Cpu, GitBranch, Flag, CirclePlay, HelpCircle } from "lucide-react";
import type { RfFlowNodeData } from "../types";

export const RfStartNode = memo(({ data, selected }: NodeProps<RfFlowNodeData>) => (
  <div
    className={`flex min-w-[120px] flex-col items-center rounded-full border-2 px-4 py-2 transition-all ${
      selected
        ? "border-primary bg-primary/20 text-foreground ring-2 ring-primary/40"
        : "border-success/70 bg-success/15 text-foreground"
    }`}
  >
    <CirclePlay className="mb-0.5 h-4 w-4 text-success" />
    <span className="text-[11px] font-semibold">{data.title}</span>
    <span className="max-w-[160px] truncate text-[9px] text-muted-foreground">{data.subtitle}</span>
    <Handle type="source" position={Position.Bottom} className="!h-2.5 !w-2.5 !border-background !bg-success" />
  </div>
));
RfStartNode.displayName = "RfStartNode";

export const RfEndNode = memo(({ data, selected }: NodeProps<RfFlowNodeData>) => (
  <div
    className={`flex min-w-[100px] flex-col items-center rounded-full border-2 px-4 py-2 transition-all ${
      selected
        ? "border-primary bg-primary/20 text-foreground ring-2 ring-primary/40"
        : "border-success/60 bg-card text-foreground"
    }`}
  >
    <Handle type="target" position={Position.Top} className="!h-2.5 !w-2.5 !border-background !bg-success" />
    <Flag className="mb-0.5 h-4 w-4 text-success" />
    <span className="text-[11px] font-semibold">{data.title}</span>
    <span className="max-w-[140px] truncate text-center text-[9px] text-muted-foreground">{data.subtitle}</span>
  </div>
));
RfEndNode.displayName = "RfEndNode";

export const RfStubNode = memo(({ data, selected }: NodeProps<RfFlowNodeData>) => (
  <div
    className={`min-w-[180px] max-w-[240px] rounded-lg border border-dashed px-3 py-2 transition-all ${
      selected ? "border-primary bg-primary/10 ring-2 ring-primary/30" : "border-warning/50 bg-warning/5"
    }`}
  >
    <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-background !bg-warning" />
    <div className="flex items-center gap-1.5 text-warning">
      <HelpCircle className="h-3.5 w-3.5 shrink-0" />
      <span className="text-[10px] font-semibold uppercase tracking-wide">Stub</span>
    </div>
    <div className="mt-1 text-[12px] font-semibold leading-tight">{data.title}</div>
    <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{data.subtitle}</p>
    <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-background !bg-warning" />
  </div>
));
RfStubNode.displayName = "RfStubNode";

export const RfTaskNode = memo(({ data, selected }: NodeProps<RfFlowNodeData>) => {
  const human = data.variant === "taskHuman";
  const ring = human
    ? selected
      ? "border-primary ring-2 ring-primary/35"
      : "border-primary/40 bg-primary/5 hover:border-primary/60"
    : selected
      ? "border-primary ring-2 ring-primary/35"
      : "border-border-strong bg-surface-2 hover:border-border-strong";

  return (
    <div className={`relative w-[260px] rounded-xl border-2 bg-card/95 p-3 backdrop-blur transition-all ${ring}`}>
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-background !bg-primary" />
      <div className="flex items-start gap-2.5">
        <div
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
            human ? "bg-primary/15 text-primary" : "bg-surface-3 text-ink-muted-80"
          }`}
        >
          {human ? <User className="h-4 w-4" /> : <Cpu className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-[13px] font-semibold leading-snug text-foreground">{data.title}</h4>
          {data.actor ? (
            <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">Actor · {data.actor}</p>
          ) : null}
          <p className="mt-1 line-clamp-3 text-[11px] leading-snug text-muted-foreground">{data.subtitle}</p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-background !bg-primary" />
    </div>
  );
});
RfTaskNode.displayName = "RfTaskNode";

export const RfDecisionNode = memo(({ data, selected }: NodeProps<RfFlowNodeData>) => {
  const handles = data.outcomeHandles ?? [];
  const n = Math.max(handles.length, 1);

  return (
    <div
      className={`relative min-w-[200px] max-w-[280px] rounded-xl border-2 bg-card/95 p-3 backdrop-blur transition-all ${
        selected ? "border-primary ring-2 ring-primary/35" : "border-warning/55 bg-warning/10"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-background !bg-warning" />
      <div className="flex items-center gap-2 text-warning">
        <GitBranch className="h-4 w-4 shrink-0" />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-warning">Decision</span>
      </div>
      <p className="mt-2 text-[12px] font-semibold leading-snug text-foreground">{data.question ?? data.title}</p>
      <div className="relative mt-3 flex justify-center gap-2 pb-2">
        {handles.length === 0 ? (
          <Handle
            type="source"
            position={Position.Bottom}
            className="!h-2.5 !w-2.5 !border-2 !border-background !bg-warning"
          />
        ) : (
          handles.map((h, i) => {
            const pct = n === 1 ? 50 : ((i + 1) / (n + 1)) * 100;
            return (
              <Handle
                key={h.id}
                id={h.id}
                type="source"
                position={Position.Bottom}
                title={h.label}
                className="!h-2.5 !w-2.5 !border-2 !border-background !bg-warning"
                style={{ left: `${pct}%` }}
              />
            );
          })
        )}
      </div>
    </div>
  );
});
RfDecisionNode.displayName = "RfDecisionNode";
