import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  Square,
  Copy,
  Plus,
  BookmarkPlus,
  ChevronRight,
  PanelRightClose,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AiTaskStatus = "idle" | "queued" | "running" | "completed" | "failed" | "cancelled";

interface AiTask {
  id: string;
  type: string;
  name: string;
  status: AiTaskStatus;
  progress?: number;
  currentStep?: string;
  partialOutput?: string;
  result?: string;
  citations?: Array<{ sourceTitle: string; excerpt: string }>;
  errorCode?: string;
  errorMessage?: string;
  timestamp: string;
}

interface AiResultsPanelProps {
  onCollapse?: () => void;
  className?: string;
}

function useAiTasks() {
  const [tasks, setTasks] = useState<AiTask[]>([]);
  const [activeTask, setActiveTask] = useState<AiTask | null>(null);

  return { tasks, activeTask, setTasks, setActiveTask };
}

export function AiResultsPanel({ onCollapse, className }: AiResultsPanelProps) {
  const [tab, setTab] = useState<"live" | "results" | "history">("live");
  const { tasks, activeTask } = useAiTasks();

  const completedTasks = tasks.filter((t) => t.status === "completed");
  const historyTasks = tasks.filter((t) => t.status !== "idle");

  return (
    <aside className={cn("flex h-full w-full flex-col border-l border-hairline bg-canvas lg:w-[clamp(280px,22vw,380px)]", className)}>
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <h2 className="text-body-strong text-ink">AI Results</h2>
        <div className="flex items-center gap-1">
          {(["live", "results", "history"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-md px-2.5 py-1 text-fine-print font-medium transition-all active:scale-95",
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "text-ink-muted-48 hover:text-ink",
              )}
            >
              {t === "live" ? "Live" : t === "results" ? "Results" : "History"}
            </button>
          ))}
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              aria-label="Collapse panel"
              className="ml-2 grid h-7 w-7 place-items-center rounded-md text-ink-muted-48 transition-colors active:scale-95 hover:bg-surface-2 hover:text-ink"
            >
              <PanelRightClose className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <AnimatePresence mode="wait">
          {tab === "live" && (
            <motion.div
              key="live"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              {!activeTask || activeTask.status === "idle" ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <Sparkles className="h-10 w-10 text-primary" />
                  <p className="text-body-strong text-ink">Ready</p>
                  <p className="text-caption text-ink-muted-48">
                    Select an element on the board or ask the AI to generate brand assets
                  </p>
                </div>
              ) : (
                <AiTaskView task={activeTask} />
              )}
            </motion.div>
          )}

          {tab === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              {completedTasks.length === 0 ? (
                <p className="py-8 text-center text-caption text-ink-muted-48">
                  No completed results yet
                </p>
              ) : (
                <div className="space-y-3">
                  {completedTasks.map((task) => (
                    <CompletedTaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              {historyTasks.length === 0 ? (
                <p className="py-8 text-center text-caption text-ink-muted-48">
                  No task history yet
                </p>
              ) : (
                <div className="space-y-2">
                  {historyTasks.map((task) => (
                    <HistoryRow key={task.id} task={task} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}

function AiTaskView({ task }: { task: AiTask }) {
  return (
    <div className="space-y-4">
      <StatusPill status={task.status} />
      <p className="text-body-strong text-ink">{task.name}</p>

      {task.status === "running" && (
        <>
          {task.currentStep && (
            <p className="text-caption italic text-ink-muted-80">{task.currentStep}</p>
          )}
          <div className="h-2 w-full overflow-hidden rounded-pill bg-divider-soft">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: `${task.progress || 50}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {task.partialOutput && (
            <div className="max-h-[300px] overflow-y-auto rounded-md bg-canvas-parchment p-4 text-caption leading-relaxed text-ink">
              {task.partialOutput}
            </div>
          )}
          <button
            type="button"
            className="flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-button-utility text-body-on-dark transition-all active:scale-95 hover:bg-ink/90"
          >
            <Square className="h-3.5 w-3.5" fill="currentColor" />
            Stop generation
          </button>
        </>
      )}

      {task.status === "completed" && task.result && (
        <div className="space-y-4">
          <div className="prose prose-sm max-w-none text-caption text-ink leading-relaxed">
            {task.result}
          </div>
          {task.citations && task.citations.length > 0 && (
            <div className="space-y-2">
              <p className="text-fine-print font-semibold text-ink-muted-48">Sources used</p>
              {task.citations.map((c, i) => (
                <div key={i} className="rounded-md border border-hairline bg-canvas-parchment p-3">
                  <p className="text-caption-strong text-ink">{c.sourceTitle}</p>
                  <p className="mt-1 text-fine-print italic text-ink-muted-80">{c.excerpt}</p>
                  <button
                    type="button"
                    className="mt-1 text-fine-print text-primary transition-colors hover:text-primary-focus"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="sticky bottom-0 space-y-2 bg-canvas pt-2">
            <button
              type="button"
              className="flex w-full items-center justify-center rounded-pill bg-primary py-3 text-body-strong text-primary-foreground transition-all active:scale-95 hover:bg-primary/90"
            >
              Add to board
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-button-utility text-body-on-dark transition-all active:scale-95 hover:bg-ink/90"
              >
                Add section
              </button>
              <button
                type="button"
                aria-label="Copy"
                className="grid h-9 w-9 place-items-center rounded-full bg-surface-chip-translucent text-ink transition-all active:scale-95 hover:brightness-95"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Bookmark"
                className="grid h-9 w-9 place-items-center rounded-full bg-surface-chip-translucent text-ink transition-all active:scale-95 hover:brightness-95"
              >
                <BookmarkPlus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {task.status === "failed" && (
        <div className="space-y-3">
          <p className="text-caption text-destructive">{task.errorMessage}</p>
          {task.errorCode && (
            <p className="text-fine-print text-ink-muted-48">Error code: {task.errorCode}</p>
          )}
          <button
            type="button"
            className="flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-button-utility text-body-on-dark transition-all active:scale-95 hover:bg-ink/90"
          >
            Retry
          </button>
        </div>
      )}

      {task.status === "cancelled" && (
        <div className="space-y-3">
          <p className="text-caption text-ink-muted-48">Generation cancelled</p>
          <button
            type="button"
            className="flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-button-utility text-body-on-dark transition-all active:scale-95 hover:bg-ink/90"
          >
            Restart
          </button>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: AiTaskStatus }) {
  const config = {
    idle: { label: "Idle", cls: "bg-surface-2 text-ink-muted-48" },
    queued: { label: "Queued", cls: "bg-ink-muted-48 text-body-on-dark" },
    running: { label: "Running", cls: "bg-primary text-primary-foreground" },
    completed: { label: "Complete", cls: "bg-success text-body-on-dark" },
    failed: { label: "Failed", cls: "bg-destructive text-body-on-dark" },
    cancelled: { label: "Cancelled", cls: "bg-surface-2 text-ink-muted-48" },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-fine-print font-semibold ${c.cls}`}>
      {status === "running" && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === "completed" && <CheckCircle2 className="h-3 w-3" />}
      {status === "failed" && <XCircle className="h-3 w-3" />}
      {c.label}
    </span>
  );
}

function CompletedTaskCard({ task }: { task: AiTask }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setExpanded(!expanded)}
      className="w-full rounded-md border border-hairline bg-canvas p-3 text-left transition-all active:scale-[0.99] hover:border-primary/50"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusPill status={task.status} />
          <span className="text-caption-strong text-ink">{task.name}</span>
        </div>
        <ChevronRight
          className={cn(
            "h-4 w-4 text-ink-muted-48 transition-transform",
            expanded && "rotate-90",
          )}
        />
      </div>
      {expanded && task.result && (
        <p className="mt-2 text-caption text-ink-muted-80 line-clamp-3">{task.result}</p>
      )}
    </button>
  );
}

function HistoryRow({ task }: { task: AiTask }) {
  return (
    <div className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-surface-2">
      <StatusPill status={task.status} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-caption-strong text-ink">{task.name}</p>
        <p className="text-fine-print text-ink-muted-48">{task.timestamp}</p>
      </div>
      {task.status === "failed" && (
        <button
          type="button"
          className="shrink-0 text-fine-print text-primary transition-colors hover:text-primary-focus"
        >
          Retry
        </button>
      )}
    </div>
  );
}
