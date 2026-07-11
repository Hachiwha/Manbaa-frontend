import { io, type Socket } from "socket.io-client";
import { API_BASE_URL, getAccessToken } from "@/lib/api";

/**
 * Server -> client event names and payload shapes, mirrored from the
 * backend's authoritative catalog at
 * ppp-backend/src/modules/realtime/constants/ws-events.constants.ts and
 * .../interfaces/ws-payloads.interface.ts. Keep these two in sync by hand
 * until the contract is shared via a package.
 */
export const WS_EVENTS = {
  PIPELINE_PROGRESS: "pipeline.progress",
  AGENT_LOG: "agent.log",
  AGENT_STATUS: "agent.status",
  WORKFLOW_UPDATED: "workflow.updated",
  SESSION_STATE: "session.state",
  SESSION_NEEDS_RECONCILIATION: "session.needs_reconciliation",
  SESSION_FINALIZED: "session.finalized",
  DOCUMENT_READY: "document.ready",
} as const;

export const WS_ROOMS = {
  session: (sessionId: string) => `session:${sessionId}`,
  workflow: (workflowId: string) => `workflow:${workflowId}`,
  pipeline: (pipelineExecutionId: string) => `pipeline:${pipelineExecutionId}`,
};

export interface PipelineProgressPayload {
  session_id: string;
  pipeline_execution_id: string;
  agent_type: string;
  agent_name: string;
  status: string;
  order_index: number;
  progress_pct: number;
  confidence_output?: number;
}

export interface WorkflowUpdatedPayload {
  workflow_id: string;
  version_number: number;
  changed_elements: Array<{
    element_id: string;
    change_type: "added" | "removed" | "modified";
  }>;
  source: string;
  correlation_id: string;
}

export interface SessionFinalizedPayload {
  session_id: string;
  workflow_id: string;
  final_version_number: number;
  final_confidence: number;
}

export interface DocumentReadyPayload {
  document_id: string;
  extracted_text_preview: string;
  confidence: number;
}

export interface JoinErrorPayload {
  room: string;
  reason: string;
}

let sharedSocket: Socket | null = null;

/**
 * Lazily creates a single shared Socket.IO connection for the app.
 * Auth token is read the same way REST calls read it (see lib/api/config.ts) -
 * that helper currently persists the token in localStorage as a documented
 * "bridge until real auth" shim; this reuses it as-is rather than inventing
 * a second auth mechanism ahead of the dedicated auth phase.
 */
export function getSocket(): Socket {
  if (sharedSocket) return sharedSocket;

  sharedSocket = io(API_BASE_URL, {
    autoConnect: false,
    withCredentials: true,
    auth: () => ({ token: getAccessToken() ?? undefined }),
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  return sharedSocket;
}

export function joinRoom(room: string) {
  getSocket().emit("joinRoom", { room });
}

export function leaveRoom(room: string) {
  getSocket().emit("leaveRoom", { room });
}
