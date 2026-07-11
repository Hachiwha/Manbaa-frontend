import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp,
  Bot,
  Check,
  CircleDashed,
  Loader2,
  Paperclip,
  Sparkles,
  Wand2,
  Database,
  Tag,
  MoreHorizontal,
  Settings2,
  X,
  PlusCircle,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Copy,
  Plus,
} from "lucide-react";
import {
  createSessionMessage,
  finalizeSession,
  patchSessionMode,
} from "@/lib/api";
import { NodeAttachment } from "./NodeAttachment";
import type { ChatMessage, FlowNode } from "../types";
import { cn } from "@/lib/utils";

interface Rule {
  id: string;
  text: string;
  active: boolean;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  workflowTitle: string;
  mode?: "AUTO" | "INTERACTIVE";
  sessionId?: string;
  selectedNodeForChat?: FlowNode | null;
  onClearSelectedNode?: () => void;
  onClose?: () => void;
}

export function ChatPanel({
  messages: initial,
  workflowTitle,
  mode = "INTERACTIVE",
  sessionId,
  selectedNodeForChat,
  onClearSelectedNode,
  onClose,
}: ChatPanelProps) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    setMessages(initial);
  }, [initial]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [rules, setRules] = useState<Rule[]>([
    {
      id: "1",
      text: "Always use system tasks for automated steps",
      active: true,
    },
    { id: "2", text: "Keep descriptions under 100 characters", active: false },
  ]);
  const [newRule, setNewRule] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const sendMessageMutation = useMutation({
    mutationFn: ({
      sessionId: sid,
      content,
    }: {
      sessionId: string;
      content: string;
    }) =>
      createSessionMessage(sid, {
        role: "user",
        type: "user_input",
        content,
      }),
    onSuccess: (newMessage) => {
      // Server response handles normal texts.
      // If we had a node attachment, it would be in localMessages or sent differently, but for now we'll just invalidate.
      queryClient.invalidateQueries({
        queryKey: ["session-messages", sessionId],
      });
    },
    onError: () => {
      setSending(false);
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: (sid: string) => finalizeSession(sid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    },
  });

  const modeMutation = useMutation({
    mutationFn: ({
      sid,
      mode: newMode,
    }: {
      sid: string;
      mode: "auto" | "interactive";
    }) => patchSessionMode(sid, { mode: newMode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    },
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, localMessages.length]);

  useEffect(() => {
    if (selectedNodeForChat) {
      setLocalMessages((prev) => [
        ...prev,
        {
          id: `node-${selectedNodeForChat.id}-${Date.now()}`,
          role: "user",
          kind: "node-attachment",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          nodeAttachment: selectedNodeForChat,
        },
      ]);
      if (onClearSelectedNode) onClearSelectedNode();
    }
  }, [selectedNodeForChat, onClearSelectedNode]);

  const send = useCallback(() => {
    const text = draft.trim();
    if (!text || sending) return;

    if (!sessionId) {
      console.error("Cannot send message: no session ID");
      return;
    }

    setSending(true);
    setDraft("");

    sendMessageMutation.mutate(
      { sessionId, content: text },
      {
        onSettled: () => {
          setSending(false);
        },
      },
    );
  }, [draft, sending, sessionId, sendMessageMutation]);

  const handleFinalize = useCallback(() => {
    if (sessionId) {
      finalizeMutation.mutate(sessionId);
    }
  }, [sessionId, finalizeMutation]);

  const toggleMode = useCallback(() => {
    if (sessionId) {
      const newMode = mode === "AUTO" ? "interactive" : "auto";
      modeMutation.mutate({ sid: sessionId, mode: newMode });
    }
  }, [sessionId, mode, modeMutation]);

  const addRule = () => {
    if (!newRule.trim()) return;
    setRules([
      ...rules,
      { id: Date.now().toString(), text: newRule, active: true },
    ]);
    setNewRule("");
  };

  const toggleRule = (id: string) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  return (
    <section className="relative flex h-full min-w-0 flex-1 flex-col bg-background">
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-y-0 right-0 z-50 flex w-80 flex-col border-l border-border bg-card shadow-2xl"
          >
            <div className="flex h-12 items-center justify-between border-b border-border px-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                AI Constraints
              </span>
              <button
                onClick={() => setShowRules(false)}
                className="rounded-md p-1 transition-colors active:scale-90 hover:bg-surface-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className={cn(
                      "group relative flex flex-col gap-2 rounded-xl border p-3 transition-colors",
                      rule.active
                        ? "border-primary/30 bg-primary/5"
                        : "border-border bg-surface/50 opacity-60",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[12.5px] font-medium leading-snug">
                        {rule.text}
                      </p>
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={cn(
                          "shrink-0 transition-colors active:scale-90",
                          rule.active
                            ? "text-primary"
                            : "text-muted-foreground",
                        )}
                      >
                        {rule.active ? (
                          <ToggleRight className="h-5 w-5" />
                        ) : (
                          <ToggleLeft className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="rounded p-1 text-muted-foreground opacity-0 transition-colors active:scale-90 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border p-4 bg-surface/30">
              <div className="relative">
                <textarea
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  placeholder="Add new rule..."
                  rows={2}
                  className="w-full resize-none rounded-lg border border-border bg-background p-2.5 text-[12.5px] placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
                <button
                  onClick={addRule}
                  disabled={!newRule.trim()}
                  className="absolute bottom-2 right-2 rounded-md bg-primary p-1.5 text-primary-foreground transition-transform active:scale-95 hover:bg-primary/90 disabled:opacity-50"
                >
                  <PlusCircle className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground text-center">
                Rules are applied to all future AI inferences.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Chat header */}
      <div className="flex h-12 shrink-0 items-center justify-between bg-surface-black px-4">
        <span className="text-caption-strong text-body-on-dark">Manbaa AI</span>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 sm:flex">
            <span className="rounded-pill bg-white/15 px-2.5 py-0.5 text-fine-print font-medium text-body-on-dark">Workspace</span>
            <span className="rounded-pill px-2.5 py-0.5 text-fine-print text-body-muted">Selection</span>
            <span className="rounded-pill px-2.5 py-0.5 text-fine-print text-body-muted">General</span>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close chat"
              className="ml-2 grid h-7 w-7 place-items-center rounded-md text-body-muted transition-colors active:scale-90 hover:bg-white/10 hover:text-body-on-dark"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
          {[...messages, ...localMessages].map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {sending && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Pattern Agent thinking…</span>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Quick actions strip */}
      <div className="mx-auto mb-2 flex w-full max-w-3xl items-center gap-2 px-6 overflow-x-auto scrollbar-none">
        <QuickPill icon={Wand2} label="Export to Elsa" />
        <QuickPill
          icon={Settings2}
          label="AI Rules"
          onClick={() => setShowRules(true)}
        />
        <QuickPill icon={Database} label="Change model" />
        <QuickPill icon={Tag} label="Add metadata" />
      </div>

      {/* Composer */}
      <div className="mx-auto mb-5 w-full max-w-3xl px-6">
        <div className="group flex items-end gap-2 rounded-2xl border border-border bg-surface p-2 shadow-[var(--shadow-hairline)] transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
          <button className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors active:scale-90 hover:bg-surface-2 hover:text-foreground">
            <Paperclip className="h-4 w-4" />
          </button>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Type your instruction… (Shift+Enter for new line)"
            rows={1}
            disabled={sending}
            className="min-h-9 max-h-40 flex-1 resize-none bg-transparent px-1 py-2 text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          <div className="flex items-center gap-1 px-1 text-[10px] text-muted-foreground">
            {messages.length} msgs
          </div>
          <button
            type="button"
            onClick={send}
            disabled={!draft.trim() || sending}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-all active:scale-95 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 disabled:saturate-50"
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Manbaa can be inaccurate; please double-check generated steps before
          exporting.
        </p>
      </div>
    </section>
  );
}

function ModeBadge({ mode }: { mode: "AUTO" | "INTERACTIVE" }) {
  const isAuto = mode === "AUTO";
  return (
    <span
      className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
        isAuto
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-primary/40 bg-primary/10 text-primary"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isAuto ? "bg-accent" : "bg-primary"}`}
      />
      {mode}
    </span>
  );
}

function QuickPill({
  icon: Icon,
  label,
  onClick,
}: {
  icon: any;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 shrink-0 rounded-full border border-border bg-surface px-3 py-1 text-[11px] text-muted-foreground transition-colors active:scale-95 hover:border-border-strong hover:bg-surface-2 hover:text-foreground"
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "system") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground"
      >
        <Loader2 className="h-3 w-3 animate-spin text-primary" />
        <span>{message.content}</span>
      </motion.div>
    );
  }

  const isUser = message.role === "user";

  if (message.kind === "node-attachment" && message.nodeAttachment) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className={`flex w-full gap-3 ${isUser ? "flex-row-reverse" : ""}`}
      >
        <div
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-surface-2 text-primary"
          }`}
        >
          {isUser ? (
            <span className="text-[10px] font-bold">MA</span>
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </div>
        <div
          className={`flex max-w-[80%] flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}
        >
          <NodeAttachment node={message.nodeAttachment} />
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{message.timestamp}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={`flex w-full gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-surface-2 text-primary"
        }`}
      >
        {isUser ? (
          <span className="text-[10px] font-bold">MA</span>
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      <div
        className={`flex max-w-[80%] flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}
      >
        <div
          className={`rounded-2xl border px-4 py-3 text-[13.5px] leading-relaxed ${
            isUser
              ? "border-primary/30 bg-primary/12 text-foreground"
              : "border-border bg-surface text-foreground/95"
          }`}
        >
          {message.content && (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}

          {message.kind === "summary" && message.steps && (
            <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
              {message.steps.map((s) => (
                <li
                  key={s.label}
                  className="flex items-center gap-2 text-[12.5px]"
                >
                  {s.status === "done" && (
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-success/20 text-success">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                  {s.status === "running" && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                  {s.status === "pending" && (
                    <CircleDashed className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span
                    className={
                      s.status === "pending"
                        ? "text-muted-foreground"
                        : "text-foreground"
                    }
                  >
                    {s.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {message.kind === "update" && message.confidence != null && (
            <span className="flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {Math.round(message.confidence * 100)}% confidence
            </span>
          )}
          <Sparkles className={`h-2.5 w-2.5 ${isUser ? "hidden" : ""}`} />
          <span>{message.timestamp}</span>
        </div>
      </div>
    </motion.div>
  );
}
