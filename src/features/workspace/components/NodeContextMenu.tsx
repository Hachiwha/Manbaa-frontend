import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send } from "lucide-react";
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

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.1 }}
        className="fixed z-50 min-w-[160px] overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
        style={{ left: position.x, top: position.y }}
      >
        <div className="p-1">
          <button
            type="button"
            onClick={() => {
              onAddComment(node.id);
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-popover-foreground hover:bg-accent"
          >
            <MessageSquare className="h-4 w-4" />
            Add comment
          </button>
          <button
            type="button"
            onClick={() => {
              onChooseInChat(node);
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-popover-foreground hover:bg-accent"
          >
            <Send className="h-4 w-4" />
            Choose in chat
          </button>
        </div>
        <div className="border-t border-border px-3 py-1.5">
          <p className="text-[10px] text-muted-foreground truncate">
            {nodeTitle as string}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
