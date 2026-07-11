import { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ChatPanel } from "./ChatPanel";
import type { ChatMessage, FlowNode } from "../types";

interface ChatFabProps {
  messages: ChatMessage[];
  workflowTitle: string;
  mode?: "AUTO" | "INTERACTIVE";
  sessionId?: string;
  selectedNodeForChat?: FlowNode | null;
  onClearSelectedNode?: () => void;
}

/**
 * Chat is a floating button + side drawer at every breakpoint (RULE 3) -
 * Board is the always-visible primary workspace view, not Chat.
 */
export function ChatFab(props: ChatFabProps) {
  const [open, setOpen] = useState(false);
  const seenCount = useRef(0);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (open) {
      seenCount.current = props.messages.length;
      setUnread(0);
      return;
    }
    if (props.messages.length > seenCount.current) {
      setUnread(props.messages.length - seenCount.current);
    }
  }, [props.messages.length, open]);

  useEffect(() => {
    if (props.selectedNodeForChat) setOpen(true);
  }, [props.selectedNodeForChat]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open chat"
        className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground transition-all active:scale-95 hover:bg-primary/90"
      >
        <MessageCircle className="h-6 w-6" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-on-primary">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex w-full max-w-md flex-col p-0 sm:max-w-md"
        >
          <SheetTitle className="sr-only">Chat</SheetTitle>
          <ChatPanel
            messages={props.messages}
            workflowTitle={props.workflowTitle}
            mode={props.mode}
            sessionId={props.sessionId}
            selectedNodeForChat={props.selectedNodeForChat}
            onClearSelectedNode={props.onClearSelectedNode}
            onClose={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
