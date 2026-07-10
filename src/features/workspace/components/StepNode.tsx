import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import {
  FileInput,
  Sparkles,
  Scan,
  GitBranch,
  Rocket,
  Database,
  Workflow,
  AlertTriangle,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import type { FlowStepData } from "../types";

const ICONS: Record<string, LucideIcon> = {
  FileInput,
  Sparkles,
  Scan,
  GitBranch,
  Rocket,
  Database,
  Workflow,
};

function confidenceTone(c?: number) {
  if (c == null) return { ring: "border-border", dot: "bg-muted-foreground", text: "text-muted-foreground" };
  if (c >= 0.85) return { ring: "border-success/50", dot: "bg-success", text: "text-success" };
  if (c >= 0.6) return { ring: "border-warning/50", dot: "bg-warning", text: "text-warning" };
  return { ring: "border-destructive/60", dot: "bg-destructive", text: "text-destructive" };
}

export const StepNode = memo(({ data, selected }: NodeProps<FlowStepData>) => {
  const Icon = ICONS[data.icon] ?? Workflow;
  const tone = confidenceTone(data.confidence);

  return (
    <div
      className={`group relative w-[260px] overflow-hidden rounded-xl border bg-card/95 backdrop-blur transition-all ${
        selected || data.active
          ? "border-primary shadow-[0_0_0_1px_var(--primary),0_12px_40px_-10px_color-mix(in_oklab,var(--primary)_60%,transparent)]"
          : `${tone.ring} hover:border-border-strong`
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-background !bg-primary"
      />

      {data.active && (
        <span className="absolute -right-1 -top-1 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
        </span>
      )}

      <div className="flex items-start gap-3 p-3.5">
        <div
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
            data.active ? "bg-gradient-primary text-primary-foreground" : "bg-surface-2 text-primary-glow"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="truncate text-sm font-semibold text-foreground">{data.title}</h4>
            {data.inferred && (
              <span title="Inferred by AI" className="grid h-4 w-4 place-items-center rounded-full bg-warning/20 text-warning">
                <AlertTriangle className="h-2.5 w-2.5" />
              </span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-muted-foreground">
            {data.subtitle}
          </p>
        </div>
      </div>

      {data.subItems && data.subItems.length > 0 && (
        <div className="border-t border-border bg-surface/40 px-3.5 py-2">
          <ul className="space-y-1">
            {data.subItems.map((s) => (
              <li key={s} className="flex items-center gap-1.5 text-[11.5px] text-foreground/85">
                <CheckCircle2 className="h-3 w-3 text-primary-glow" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.confidence != null && (
        <div className="flex items-center justify-between border-t border-border px-3.5 py-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Confidence
          </span>
          <span className={`flex items-center gap-1 text-[11px] font-semibold ${tone.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
            {Math.round(data.confidence * 100)}%
          </span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-background !bg-primary"
      />
    </div>
  );
});

StepNode.displayName = "StepNode";
