import { Workflow } from "lucide-react";
import type { FlowNode } from "../types";
import { isRfFlowNodeData } from "../types";

interface NodeAttachmentProps {
  node: FlowNode;
  onClick?: () => void;
}

export function NodeAttachment({ node, onClick }: NodeAttachmentProps) {
  const title = node.data?.title || node.id;
  const kind = isRfFlowNodeData(node.data) ? node.data.kind : "step";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left transition-colors hover:bg-surface-2"
    >
      <Workflow className="h-4 w-4 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{title as string}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {kind as string}
        </p>
      </div>
    </button>
  );
}
