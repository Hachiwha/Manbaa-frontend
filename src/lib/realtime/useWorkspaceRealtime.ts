import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getSocket,
  joinRoom,
  leaveRoom,
  WS_EVENTS,
  WS_ROOMS,
  type DocumentReadyPayload,
  type JoinErrorPayload,
  type PipelineProgressPayload,
  type SessionFinalizedPayload,
  type WorkflowUpdatedPayload,
} from "./socket";

interface UseWorkspaceRealtimeOptions {
  sessionId?: string;
  workflowId?: string;
}

/**
 * Joins the session/workflow WebSocket rooms for a workspace and invalidates
 * the matching TanStack Query keys as real-time events arrive, per RULE 9.
 *
 * Returns `connected` so callers can fall back to polling (max 5s) while
 * the socket is down - see workspace.$sessionId.tsx's refetchInterval.
 */
export function useWorkspaceRealtime({
  sessionId,
  workflowId,
}: UseWorkspaceRealtimeOptions) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const joinedRooms = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!sessionId) return;

    const socket = getSocket();

    const onConnect = () => {
      setConnected(true);
      setJoinError(null);
      joinRoom(WS_ROOMS.session(sessionId));
      joinedRooms.current.add(WS_ROOMS.session(sessionId));
      if (workflowId) {
        joinRoom(WS_ROOMS.workflow(workflowId));
        joinedRooms.current.add(WS_ROOMS.workflow(workflowId));
      }
    };
    const onDisconnect = () => setConnected(false);
    const onJoinError = (payload: JoinErrorPayload) =>
      setJoinError(payload.reason);

    const onPipelineProgress = (payload: PipelineProgressPayload) => {
      if (payload.session_id !== sessionId) return;
      queryClient.invalidateQueries({
        queryKey: ["session-progress", sessionId],
      });
    };

    const onWorkflowUpdated = (payload: WorkflowUpdatedPayload) => {
      queryClient.invalidateQueries({
        queryKey: ["workflow", payload.workflow_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["workflow-diagram", payload.workflow_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["session-workflow-state", sessionId],
      });
    };

    const onSessionFinalized = (payload: SessionFinalizedPayload) => {
      if (payload.session_id !== sessionId) return;
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      queryClient.invalidateQueries({
        queryKey: ["session-workflow-state", sessionId],
      });
    };

    const onDocumentReady = (_payload: DocumentReadyPayload) => {
      if (workflowId) {
        queryClient.invalidateQueries({
          queryKey: ["workflow-documents", workflowId],
        });
      }
    };

    const onMessageEvents = () => {
      queryClient.invalidateQueries({
        queryKey: ["session-messages", sessionId],
      });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("join_error", onJoinError);
    socket.on(WS_EVENTS.PIPELINE_PROGRESS, onPipelineProgress);
    socket.on(WS_EVENTS.WORKFLOW_UPDATED, onWorkflowUpdated);
    socket.on(WS_EVENTS.SESSION_FINALIZED, onSessionFinalized);
    socket.on(WS_EVENTS.DOCUMENT_READY, onDocumentReady);
    // ai.tasks.result lands via SessionsService and typically also touches
    // session state — refresh messages on the same progress/finalized ticks
    // so the transcript doesn't lag behind the diagram.
    socket.on(WS_EVENTS.PIPELINE_PROGRESS, onMessageEvents);
    socket.on(WS_EVENTS.SESSION_FINALIZED, onMessageEvents);

    if (socket.connected) {
      onConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("join_error", onJoinError);
      socket.off(WS_EVENTS.PIPELINE_PROGRESS, onPipelineProgress);
      socket.off(WS_EVENTS.WORKFLOW_UPDATED, onWorkflowUpdated);
      socket.off(WS_EVENTS.SESSION_FINALIZED, onSessionFinalized);
      socket.off(WS_EVENTS.DOCUMENT_READY, onDocumentReady);
      socket.off(WS_EVENTS.PIPELINE_PROGRESS, onMessageEvents);
      socket.off(WS_EVENTS.SESSION_FINALIZED, onMessageEvents);
      for (const room of joinedRooms.current) leaveRoom(room);
      joinedRooms.current.clear();
    };
  }, [sessionId, workflowId, queryClient]);

  return { connected, joinError };
}
