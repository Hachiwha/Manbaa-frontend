import { memo, useState, type ChangeEvent } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import {
  FileText,
  FileImage,
  FileType2,
  File,
  Music2,
  Quote,
  Bot,
  User,
  Sparkles,
  Palette,
  type LucideIcon,
} from "lucide-react";
import type { SketchNodeData, SourceType } from "../types";

const SOURCE_ICON: Record<SourceType, LucideIcon> = {
  pdf: FileText,
  image: FileImage,
  text: FileType2,
  doc: File,
  audio: Music2,
};

const dotHandle =
  "!h-2 !w-2 !border-background !bg-primary opacity-0 transition-opacity group-hover:opacity-100";

/** Freeform note the user types directly onto the board. */
export const StickyNoteNode = memo(
  ({ id, data, selected }: NodeProps<SketchNodeData>) => {
    const [value, setValue] = useState(data.content ?? "");
    const onChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
      data.content = e.target.value;
    };
    return (
      <div
        className={`group relative min-h-[110px] w-[200px] rounded-sm border bg-warning/10 p-3 transition-all ${
          selected
            ? "border-primary ring-2 ring-primary/30"
            : "border-warning/40"
        }`}
      >
        <Handle type="target" position={Position.Top} className={dotHandle} />
        <textarea
          value={value}
          onChange={onChange}
          placeholder="Type a note…"
          rows={4}
          className="nodrag h-full w-full resize-none bg-transparent text-[12px] leading-snug text-ink placeholder:text-ink-muted-48 focus:outline-none"
          aria-label="Sticky note text"
        />
        <Handle
          id={`${id}-source`}
          type="source"
          position={Position.Bottom}
          className={dotHandle}
        />
      </div>
    );
  },
);
StickyNoteNode.displayName = "StickyNoteNode";

/** Plain rich-ish text block. */
export const TextNode = memo(
  ({ id, data, selected }: NodeProps<SketchNodeData>) => {
    const [value, setValue] = useState(data.content ?? "");
    return (
      <div
        className={`group relative w-[220px] rounded-md border bg-card/95 p-2.5 transition-all ${
          selected ? "border-primary ring-2 ring-primary/30" : "border-hairline"
        }`}
      >
        <Handle type="target" position={Position.Top} className={dotHandle} />
        <textarea
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            data.content = e.target.value;
          }}
          placeholder="Add text…"
          rows={2}
          className="nodrag w-full resize-none bg-transparent text-[13px] leading-snug text-ink placeholder:text-ink-muted-48 focus:outline-none"
          aria-label="Text block"
        />
        <Handle
          id={`${id}-source`}
          type="source"
          position={Position.Bottom}
          className={dotHandle}
        />
      </div>
    );
  },
);
TextNode.displayName = "TextNode";

/** Section heading for organizing the board. */
export const HeadingNode = memo(
  ({ id, data, selected }: NodeProps<SketchNodeData>) => {
    const [value, setValue] = useState(data.content ?? data.title ?? "");
    return (
      <div
        className={`group relative w-[260px] rounded-md border bg-transparent px-2 py-1.5 transition-all ${
          selected
            ? "border-primary ring-2 ring-primary/30"
            : "border-transparent hover:border-hairline"
        }`}
      >
        <Handle type="target" position={Position.Top} className={dotHandle} />
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            data.content = e.target.value;
          }}
          placeholder="Section heading"
          className="nodrag w-full bg-transparent text-[18px] font-semibold text-ink placeholder:text-ink-muted-48 focus:outline-none"
          aria-label="Heading text"
        />
        <Handle
          id={`${id}-source`}
          type="source"
          position={Position.Bottom}
          className={dotHandle}
        />
      </div>
    );
  },
);
HeadingNode.displayName = "HeadingNode";

/** Basic geometric shape for annotating relationships on the board. */
export const ShapeNode = memo(
  ({ id, data, selected }: NodeProps<SketchNodeData>) => {
    const variant = data.shapeVariant ?? "rectangle";
    const shapeClass =
      variant === "circle"
        ? "rounded-full"
        : variant === "diamond"
          ? "rotate-45 rounded-sm"
          : "rounded-md";
    return (
      <div className="relative h-[100px] w-[100px]">
        <Handle type="target" position={Position.Top} className={dotHandle} />
        <div
          className={`h-full w-full border-2 bg-card/60 transition-all ${shapeClass} ${
            selected
              ? "border-primary ring-2 ring-primary/30"
              : "border-border-strong"
          }`}
        />
        <Handle
          id={`${id}-source`}
          type="source"
          position={Position.Bottom}
          className={dotHandle}
        />
      </div>
    );
  },
);
ShapeNode.displayName = "ShapeNode";

/** Large dashed container used to group related nodes visually. */
export const FrameNode = memo(
  ({ data, selected }: NodeProps<SketchNodeData>) => (
    <div
      className={`h-[320px] w-[420px] rounded-lg border-2 border-dashed bg-surface/20 transition-all ${
        selected ? "border-primary" : "border-hairline"
      }`}
    >
      <span className="absolute -top-6 left-0 text-[11px] font-semibold uppercase tracking-wide text-ink-muted-48">
        {data.title || "Frame"}
      </span>
    </div>
  ),
);
FrameNode.displayName = "FrameNode";

/** Reference card for an uploaded source, dropped onto the board. */
export const SourceCardNode = memo(
  ({ id, data, selected }: NodeProps<SketchNodeData>) => {
    const Icon = SOURCE_ICON[data.sourceType ?? "text"];
    return (
      <div
        className={`relative flex w-[220px] items-center gap-2.5 rounded-md border bg-card/95 p-3 transition-all ${
          selected ? "border-primary ring-2 ring-primary/30" : "border-hairline"
        }`}
      >
        <Handle type="target" position={Position.Top} className={dotHandle} />
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-surface-2 text-ink-muted-80">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-ink">
            {data.title}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-ink-muted-48">
            Source
          </p>
        </div>
        <Handle
          id={`${id}-source`}
          type="source"
          position={Position.Bottom}
          className={dotHandle}
        />
      </div>
    );
  },
);
SourceCardNode.displayName = "SourceCardNode";

/** Cited excerpt retrieved from a source via RAG. */
export const CitationCardNode = memo(
  ({ id, data, selected }: NodeProps<SketchNodeData>) => (
    <div
      className={`relative w-[240px] rounded-md border bg-canvas-parchment p-3 transition-all ${
        selected ? "border-primary ring-2 ring-primary/30" : "border-hairline"
      }`}
    >
      <Handle type="target" position={Position.Top} className={dotHandle} />
      <Quote className="h-3.5 w-3.5 text-ink-muted-48" />
      <p className="mt-1 line-clamp-4 text-[11.5px] italic leading-snug text-ink">
        {data.content}
      </p>
      {data.citationSourceTitle && (
        <p className="mt-2 truncate text-[10px] font-semibold text-ink-muted-48">
          — {data.citationSourceTitle}
        </p>
      )}
      <Handle
        id={`${id}-source`}
        type="source"
        position={Position.Bottom}
        className={dotHandle}
      />
    </div>
  ),
);
CitationCardNode.displayName = "CitationCardNode";

/** AI chat turn pinned to the board. */
export const ChatResponseNode = memo(
  ({ id, data, selected }: NodeProps<SketchNodeData>) => {
    const isAi = data.role !== "user";
    return (
      <div
        className={`relative w-[240px] rounded-md border bg-card/95 p-3 transition-all ${
          selected ? "border-primary ring-2 ring-primary/30" : "border-hairline"
        }`}
      >
        <Handle type="target" position={Position.Top} className={dotHandle} />
        <div className="mb-1.5 flex items-center gap-1.5 text-ink-muted-48">
          {isAi ? (
            <Bot className="h-3.5 w-3.5" />
          ) : (
            <User className="h-3.5 w-3.5" />
          )}
          <span className="text-[10px] font-semibold uppercase tracking-wide">
            {isAi ? "AI" : "You"}
          </span>
        </div>
        <p className="line-clamp-5 text-[11.5px] leading-snug text-ink">
          {data.content}
        </p>
        <Handle
          id={`${id}-source`}
          type="source"
          position={Position.Bottom}
          className={dotHandle}
        />
      </div>
    );
  },
);
ChatResponseNode.displayName = "ChatResponseNode";

/** Generated brand direction (palette, tone, positioning). */
export const ConceptCardNode = memo(
  ({ id, data, selected }: NodeProps<SketchNodeData>) => (
    <div
      className={`relative w-[240px] rounded-md border bg-primary/5 p-3 transition-all ${
        selected ? "border-primary ring-2 ring-primary/40" : "border-primary/25"
      }`}
    >
      <Handle type="target" position={Position.Top} className={dotHandle} />
      <div className="mb-1.5 flex items-center gap-1.5 text-primary">
        <Sparkles className="h-3.5 w-3.5" />
        <span className="text-[10px] font-semibold uppercase tracking-wide">
          Concept
        </span>
      </div>
      <p className="text-[12.5px] font-semibold leading-snug text-ink">
        {data.title}
      </p>
      {data.content && (
        <p className="mt-1 line-clamp-3 text-[11px] leading-snug text-ink-muted-80">
          {data.content}
        </p>
      )}
      {data.confidence != null && (
        <p className="mt-2 text-[10px] font-medium text-primary">
          {Math.round(data.confidence * 100)}% confidence
        </p>
      )}
      <Handle
        id={`${id}-source`}
        type="source"
        position={Position.Bottom}
        className={dotHandle}
      />
    </div>
  ),
);
ConceptCardNode.displayName = "ConceptCardNode";

const ASSET_ICON: Record<
  NonNullable<SketchNodeData["assetType"]>,
  LucideIcon
> = {
  logo: Sparkles,
  palette: Palette,
  typography: FileType2,
  guideline: FileText,
};

/** Generated brand asset (logo, palette, typography, guideline). */
export const AssetCardNode = memo(
  ({ id, data, selected }: NodeProps<SketchNodeData>) => {
    const Icon = ASSET_ICON[data.assetType ?? "logo"];
    return (
      <div
        className={`relative w-[220px] rounded-md border bg-primary/5 p-3 transition-all ${
          selected
            ? "border-primary ring-2 ring-primary/40"
            : "border-primary/25"
        }`}
      >
        <Handle type="target" position={Position.Top} className={dotHandle} />
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-ink">
              {data.title}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-ink-muted-48">
              {data.assetType ?? "asset"}
            </p>
          </div>
        </div>
        <Handle
          id={`${id}-source`}
          type="source"
          position={Position.Bottom}
          className={dotHandle}
        />
      </div>
    );
  },
);
AssetCardNode.displayName = "AssetCardNode";
