import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Sparkles, Copy, Trash2, BringToFront, SendToBack } from "lucide-react";
import type { FlowNode } from "../types";

interface NodeContextMenuProps {
  node: FlowNode;
  position: { x: number; y: number };
  onClose: () => void;
  onAddComment: (nodeId: string) => void;
  onChooseInChat: (node: FlowNode) => void;
}

export function NodeContextMenu({
  node,
  position,
  onClose,
  onAddComment,
  onChooseInChat,
}: NodeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const nodeTitle = node.data?.title || node.id;

  const menuItems = [
    { icon: Copy, label: "Duplicate", shortcut: "Ctrl+D", onClick: () => {} },
    { icon: Trash2, label: "Delete", shortcut: "Del", onClick: () => {} },
    { icon: BringToFront, label: "Bring to front", onClick: () => {} },
    { icon: SendToBack, label: "Send to back", onClick: () => {} },
    { separator: true },
    { icon: MessageSquare, label: "Add comment", onClick: () => { onAddComment(node.id); onClose(); } },
    { icon: Send, label: "Choose in chat", onClick: () => { onChooseInChat(node); onClose(); } },
    { icon: Sparkles, label: "Ask AI about this", accent: true, onClick: () => { onChooseInChat(node); onClose(); } },
  ] as const;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.1 }}
        className="fixed z-50 min-w-[180px] overflow-hidden rounded-lg border border-hairline bg-popover shadow-[var(--shadow-hairline)]"
        style={{ left: position.x, top: position.y }}
      >
        <div className="p-1">
          {menuItems.map((item, i) => {
            if ("separator" in item) {
              return <div key={i} className="mx-2 my-1 h-px bg-hairline" />;
            }
            const Icon = item.icon;
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  item.onClick();
                  onClose();
                }}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-all active:scale-[0.98] ${
                  "accent" in item && item.accent
                    ? "text-primary hover:bg-primary/10"
                    : "text-popover-foreground hover:bg-accent"
                }`}
              >
                <Icon className={`h-4 w-4 ${"accent" in item && item.accent ? "text-primary" : ""}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {"shortcut" in item && item.shortcut && (
                  <span className="text-fine-print text-ink-muted-48">{item.shortcut}</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="border-t border-hairline px-3 py-1.5">
          <p className="truncate text-fine-print text-ink-muted-48">{nodeTitle as string}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
