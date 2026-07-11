import { useCallback, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  FileText,
  FileImage,
  FileType2,
  File,
  Music2,
  Plus,
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  PanelLeftClose,
  Search,
  Link,
  HelpCircle,
  BookOpen,
  Trash2,
  ToggleLeft,
  ToggleRight,
  LayoutTemplate,
} from "lucide-react";
import { uploadDocument, deleteDocument } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { SourceType, VersionEntry, WorkspaceSource } from "../types";
import {
  ACCEPT_ATTRIBUTE,
  formatFileSize,
  mimeToWorkspaceSourceType,
} from "../sourceUpload";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const typeIcon: Record<SourceType, typeof FileText> = {
  pdf: FileText,
  image: FileImage,
  text: FileType2,
  doc: File,
  audio: Music2,
};

const typeColors: Record<SourceType, string> = {
  pdf: "text-red-600 bg-red-50",
  image: "text-blue-600 bg-blue-50",
  text: "text-gray-600 bg-gray-100",
  doc: "text-indigo-600 bg-indigo-50",
  audio: "text-green-600 bg-green-50",
};

function newSourceId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `src_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  );
}

function isValidUrl(str: string) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

interface SourcesPanelProps {
  sources: WorkspaceSource[];
  versions: VersionEntry[];
  onCollapse?: () => void;
  onAddToBoard?: (source: WorkspaceSource) => void;
  sessionId?: string;
  workflowId?: string;
  className?: string;
}

export function SourcesPanel({
  sources: initialSources,
  versions,
  onCollapse,
  onAddToBoard,
  sessionId,
  workflowId,
  className,
}: SourcesPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [items, setItems] = useState(initialSources);
  const [filter, setFilter] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: ({
      file,
      sessionId: sid,
      workflowId: wid,
    }: {
      file: File;
      sessionId: string;
      workflowId?: string;
    }) => uploadDocument({ file, sessionId: sid, workflowId: wid }),
    onSuccess: (newDoc) => {
      setItems((prev) => [
        {
          id: newDoc.id,
          name: newDoc.filename,
          type: newDoc.fileType?.includes("pdf")
            ? "pdf"
            : newDoc.fileType?.includes("image")
              ? "image"
              : newDoc.fileType?.includes("word")
                ? "doc"
                : ("text" as const),
          size: formatFileSize(newDoc.fileSizeBytes),
          status: "ready" as const,
          included: true,
        },
        ...prev,
      ]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => deleteDocument(documentId),
    onSuccess: (_, documentId) => {
      setItems((prev) => prev.filter((s) => s.id !== documentId));
      queryClient.invalidateQueries({ queryKey: ["workflow-documents"] });
    },
  });

  const toggleIncluded = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, included: !s.included } : s)),
    );
  }, []);

  const removeSource = useCallback(
    (id: string) => {
      if (sessionId && workflowId) {
        deleteMutation.mutate(id);
      } else {
        setItems((prev) => prev.filter((s) => s.id !== id));
      }
    },
    [sessionId, workflowId, deleteMutation],
  );

  const ingestFiles = useCallback(
    async (fileList: FileList | File[] | null) => {
      if (!fileList || fileList.length === 0) return;
      if (!sessionId) {
        const files = Array.from(fileList as FileList);
        const additions: WorkspaceSource[] = [];
        for (const file of files) {
          const type = mimeToWorkspaceSourceType(file.type);
          if (!type) continue;
          additions.push({
            id: newSourceId(),
            name: file.name,
            type,
            size: formatFileSize(file.size),
            status: "uploading",
            included: true,
          });
        }
        if (additions.length > 0) setItems((prev) => [...additions, ...prev]);
        return;
      }
      const files = Array.from(fileList as FileList);
      for (const file of files) {
        const type = mimeToWorkspaceSourceType(file.type);
        if (!type) continue;
        const tempId = newSourceId();
        setItems((prev) => [
          ...prev,
          {
            id: tempId,
            name: file.name,
            type,
            size: formatFileSize(file.size),
            status: "uploading",
            included: true,
          },
        ]);
        uploadMutation.mutate(
          { file, sessionId, workflowId },
          {
            onError: () =>
              setItems((prev) => prev.filter((s) => s.id !== tempId)),
          },
        );
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [sessionId, workflowId, uploadMutation],
  );

  const handleUrlAdd = useCallback(() => {
    if (!urlValue.trim() || !isValidUrl(urlValue.trim())) return;
    const name = urlValue.trim().split("/").pop() || urlValue.trim();
    const newItem: WorkspaceSource = {
      id: newSourceId(),
      name,
      type: "text" as const,
      size: "URL",
      status: "ready",
      included: true,
    };
    setItems((prev) => [newItem, ...prev]);
    setUrlValue("");
  }, [urlValue]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      ingestFiles(e.dataTransfer.files);
    },
    [ingestFiles],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const filtered = items.filter((s) =>
    s.name.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col border-r border-hairline bg-surface lg:w-[clamp(240px,22vw,300px)]",
        className,
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTRIBUTE}
        className="sr-only"
        aria-hidden
        onChange={(e) => ingestFiles(e.target.files)}
      />

      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-2">
          <span className="text-fine-print font-semibold uppercase tracking-[0.16em] text-ink-muted-48">
            Sources
          </span>
          <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-ink-muted-48">
            {items.length}
          </span>
        </div>
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            className="grid h-7 w-7 place-items-center rounded-md text-ink-muted-48 transition-colors active:scale-95 hover:bg-surface-2 hover:text-ink"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Add sources button */}
      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group flex w-full items-center justify-center gap-2 rounded-pill border border-primary/40 bg-primary/10 px-4 py-2.5 text-body-strong text-primary transition-all active:scale-95 hover:border-primary/60 hover:bg-primary/20"
        >
          <Plus className="h-4 w-4" />
          Add sources
        </button>
      </div>

      {/* URL input */}
      <div className="px-3 pt-2">
        <div className="flex items-center gap-2 rounded-pill border border-hairline bg-canvas px-3 py-1.5 focus-within:border-primary">
          <Link className="h-4 w-4 shrink-0 text-ink-muted-48" />
          <input
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUrlAdd();
            }}
            placeholder="Paste a URL..."
            className="min-w-0 flex-1 bg-transparent text-caption text-ink placeholder:text-ink-muted-48 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleUrlAdd}
            disabled={!isValidUrl(urlValue.trim())}
            className="rounded-sm bg-ink px-2.5 py-1 text-fine-print font-medium text-body-on-dark transition-all active:scale-95 hover:bg-ink/90 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pt-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted-48" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search sources"
            className="h-8 w-full rounded-md border border-hairline bg-canvas pl-8 pr-2 text-fine-print placeholder:text-ink-muted-48 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Source list */}
      <div className="mt-3 flex-1 overflow-y-auto px-2 scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <FileText className="h-10 w-10 text-ink-muted-48" />
            <p className="text-body-strong text-ink">No sources yet</p>
            <p className="text-caption text-ink-muted-48">
              Upload files or paste a URL to get started
            </p>
          </div>
        ) : (
          <ul className="space-y-0.5">
            <AnimatePresence initial={false}>
              {filtered.map((s) => {
                const Icon = typeIcon[s.type];
                const color = typeColors[s.type];
                return (
                  <motion.li
                    key={s.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="group/row"
                  >
                    <div className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface-2">
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${color}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div
                          className={`truncate text-caption-strong ${s.included ? "text-ink" : "text-ink-muted-48 line-through decoration-1"}`}
                        >
                          {s.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-fine-print text-ink-muted-48">
                          <span>{s.size}</span>
                          <StatusIndicator status={s.status} />
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label="Source options"
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-ink-muted-48 opacity-0 transition-all active:scale-90 hover:bg-surface-2 hover:text-ink group-hover/row:opacity-100"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          {onAddToBoard && (
                            <DropdownMenuItem
                              onClick={() => onAddToBoard(s)}
                              className="flex items-center gap-2 text-caption"
                            >
                              <LayoutTemplate className="h-3.5 w-3.5" /> Add to
                              board
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => toggleIncluded(s.id)}
                            className="flex items-center gap-2 text-caption"
                          >
                            {s.included ? (
                              <ToggleRight className="h-3.5 w-3.5" />
                            ) : (
                              <ToggleLeft className="h-3.5 w-3.5" />
                            )}
                            {s.included ? "Disable for AI" : "Enable for AI"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => removeSource(s.id)}
                            className="flex items-center gap-2 text-caption text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {s.status === "uploading" && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        className="mx-2 h-0.5 origin-left rounded-full bg-primary"
                        style={{ transformOrigin: "left" }}
                      />
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}

        {/* Upload zone */}
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={cn(
            "mt-4 cursor-pointer rounded-lg border-2 border-dashed p-5 text-center transition-colors",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-hairline hover:border-primary/40 hover:bg-surface/60",
          )}
        >
          <Upload className="mx-auto h-6 w-6 text-ink-muted-48" />
          <p className="mt-2 text-caption-strong text-ink-muted-80">
            Drop files here
          </p>
          <p className="mt-1 text-fine-print text-ink-muted-48">
            PDF, PNG, JPEG, WebP, TXT, MD, DOCX, MP3, WAV
          </p>
        </div>

        {/* Versions */}
        <div className="mt-5 flex items-center justify-between px-2">
          <span className="text-fine-print font-semibold uppercase tracking-[0.16em] text-ink-muted-48">
            Versions
          </span>
        </div>
        <ul className="mt-1.5 space-y-0.5">
          {versions.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-fine-print transition-colors active:scale-[0.98] ${
                  v.active
                    ? "bg-primary/15 text-ink"
                    : "text-ink-muted-48 hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${v.active ? "bg-primary" : "bg-border-strong"}`}
                  />
                  {v.label}
                </span>
                <span className="text-fine-print text-ink-muted-48">
                  {v.timestamp}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="border-t border-hairline px-3 py-2">
        <div className="flex items-center justify-between text-fine-print text-ink-muted-48">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors active:scale-95 hover:text-ink"
          >
            <BookOpen className="h-3.5 w-3.5" /> Docs
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors active:scale-95 hover:text-ink"
          >
            <HelpCircle className="h-3.5 w-3.5" /> Help
          </button>
        </div>
      </div>
    </aside>
  );
}

function StatusIndicator({ status }: { status: WorkspaceSource["status"] }) {
  switch (status) {
    case "uploading":
      return (
        <span className="flex items-center gap-1 text-primary">
          <Loader2 className="h-2.5 w-2.5 animate-spin" />
          Uploading
        </span>
      );
    case "preprocessing":
      return (
        <span className="flex items-center gap-1 text-warning">
          <Loader2 className="h-2.5 w-2.5 animate-spin" />
          Processing
        </span>
      );
    case "ready":
      return (
        <span className="flex items-center gap-1 text-success">
          <CheckCircle2 className="h-2.5 w-2.5" />
          Ready
        </span>
      );
    case "failed":
      return (
        <span className="flex items-center gap-1 text-destructive">
          <XCircle className="h-2.5 w-2.5" />
          Failed
        </span>
      );
    default:
      return null;
  }
}
