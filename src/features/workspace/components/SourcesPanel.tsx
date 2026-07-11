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
  Check,
  PanelLeftClose,
  Search,
  HelpCircle,
  BookOpen,
  Trash2,
} from "lucide-react";
import { uploadDocument, deleteDocument, reprocessDocument } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { SourceType, VersionEntry, WorkspaceSource } from "../types";
import {
  ACCEPT_ATTRIBUTE,
  formatFileSize,
  mimeToWorkspaceSourceType,
} from "../sourceUpload";

const typeIcon: Record<SourceType, typeof FileText> = {
  pdf: FileText,
  image: FileImage,
  text: FileType2,
  doc: File,
  audio: Music2,
};

const typeTone = "text-ink-muted-80 bg-surface-2";

function newSourceId() {
  return globalThis.crypto?.randomUUID?.() ?? `src_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

interface SourcesPanelProps {
  sources: WorkspaceSource[];
  versions: VersionEntry[];
  onCollapse?: () => void;
  sessionId?: string;
  workflowId?: string;
  className?: string;
}

export function SourcesPanel({ sources: initialSources, versions, onCollapse, sessionId, workflowId, className }: SourcesPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [items, setItems] = useState(initialSources);
  const [filter, setFilter] = useState("");

  const uploadMutation = useMutation({
    mutationFn: ({ file, sessionId: sid, workflowId: wid }: { file: File; sessionId: string; workflowId?: string }) =>
      uploadDocument({ file, sessionId: sid, workflowId: wid }),
    onSuccess: (newDoc) => {
      setItems((prev) => [
        {
          id: newDoc.id,
          name: newDoc.filename,
          type: newDoc.fileType?.includes("pdf") ? "pdf" 
            : newDoc.fileType?.includes("image") ? "image"
            : newDoc.fileType?.includes("word") ? "doc"
            : "text" as const,
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

  const reprocessMutation = useMutation({
    mutationFn: (documentId: string) => reprocessDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-documents"] });
    },
  });

  const toggleIncluded = useCallback((id: string) => {
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, included: !s.included } : s)));
  }, []);

  const removeSource = useCallback((id: string) => {
    if (sessionId && workflowId) {
      deleteMutation.mutate(id);
    } else {
      setItems((prev) => prev.filter((s) => s.id !== id));
    }
  }, [sessionId, workflowId, deleteMutation]);

  const handleReprocess = useCallback((id: string) => {
    if (sessionId) {
      reprocessMutation.mutate(id);
    }
  }, [sessionId, reprocessMutation]);

  const ingestFiles = useCallback(async (fileList: FileList | File[] | null) => {
    if (!fileList || fileList.length === 0) return;
    if (!sessionId) {
      const files = Array.from(fileList as FileList);
      const additions: WorkspaceSource[] = [];

      for (const file of files) {
        const type = mimeToWorkspaceSourceType(file.type);
        if (!type) continue;

        const id = newSourceId();
        additions.push({
          id,
          name: file.name,
          type,
          size: formatFileSize(file.size),
          status: "uploading",
          included: true,
        });
      }

      if (additions.length > 0) {
        setItems((prev) => [...additions, ...prev]);
      }
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
          onError: () => {
            setItems((prev) => prev.filter((s) => s.id !== tempId));
          },
        }
      );
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [sessionId, workflowId, uploadMutation]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      ingestFiles(e.dataTransfer.files);
    },
    [ingestFiles],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const filtered = items.filter((s) => s.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <aside className={cn("flex h-full w-full flex-col border-r border-border bg-surface lg:w-[clamp(240px,22vw,300px)]", className)}>
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
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Sources
          </span>
          <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {items.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onCollapse}
          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors active:scale-95 hover:bg-surface-2 hover:text-foreground"
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium text-primary-foreground/95 transition-all active:scale-[0.98] hover:border-primary/60 hover:bg-primary/20"
        >
          <Plus className="h-4 w-4 text-primary" />
          <span className="text-foreground">Add sources</span>
        </button>
      </div>

      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search sources"
            className="h-8 w-full rounded-md border border-border bg-surface pl-8 pr-2 text-xs placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="mt-3 flex-1 overflow-y-auto px-2 scrollbar-thin">
        <ul className="space-y-0.5">
          <AnimatePresence initial={false}>
            {filtered.map((s) => {
              const Icon = typeIcon[s.type];
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
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${typeTone}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div
                        className={`truncate text-[13px] ${s.included ? "text-foreground" : "text-muted-foreground line-through decoration-1"}`}
                      >
                        {s.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span>{s.size}</span>
                        {s.status === "uploading" && (
                          <span className="flex items-center gap-1 text-primary">
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            uploading
                          </span>
                        )}
                        {s.status === "preprocessing" && (
                          <span className="flex items-center gap-1 text-warning">
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            preprocessing
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleIncluded(s.id)}
                      aria-label={s.included ? "Exclude from workspace" : "Include in workspace"}
                      aria-pressed={s.included}
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border transition-all active:scale-90 ${
                        s.included
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border-strong text-muted-foreground hover:border-border-strong hover:text-foreground"
                      }`}
                    >
                      {s.included && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSource(s.id)}
                      aria-label={`Remove ${s.name}`}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground opacity-70 transition-colors active:scale-90 hover:bg-destructive/15 hover:text-destructive group-hover/row:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>

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
          className="mt-4 cursor-pointer rounded-lg border border-dashed border-border-strong/60 bg-surface/40 p-3 text-center transition-colors hover:border-primary/40 hover:bg-surface/60"
        >
          <Upload className="mx-auto h-4 w-4 text-muted-foreground" />
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Drop files here or click to import
          </p>
          <p className="mt-1 text-[10px] leading-snug text-muted-foreground/80">
            PDF, PNG, JPEG, WebP, TXT, MD, DOCX, MP3, WAV
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between px-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Versions
          </span>
        </div>
        <ul className="mt-1.5 space-y-0.5">
          {versions.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-[12px] transition-colors active:scale-[0.98] ${
                  v.active
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${v.active ? "bg-primary" : "bg-border-strong"}`}
                  />
                  {v.label}
                </span>
                <span className="text-[10px] text-muted-foreground">{v.timestamp}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-border px-3 py-2">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <button type="button" className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors active:scale-95 hover:text-foreground">
            <BookOpen className="h-3.5 w-3.5" /> Docs
          </button>
          <button type="button" className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors active:scale-95 hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5" /> Help
          </button>
          <button type="button" className="flex items-center gap-1 rounded-md px-2 py-1 transition-colors active:scale-95 hover:text-foreground">
            More <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </aside>
  );
}
