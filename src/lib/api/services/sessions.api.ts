import { apiClient } from "../apiClient";
import { http } from "../http";
import { apiUrl } from "../url";
import { json } from "../helpers";
import type {
  CreateSessionBody,
  FinalizeResponse,
  PatchModeResponse,
  PatchSessionModeBody,
  PipelineProgress,
  Session,
  SessionStatusOverrideResponse,
  SessionWorkflowState,
  UpdateSessionStatusBody,
} from "../types";

/** `POST /sessions` */
export function createSession(body: CreateSessionBody, signal?: AbortSignal) {
  const normalized = {
    workflowId: "workflowId" in body ? body.workflowId : body.workflow_id,
    mode: body.mode,
  };

  return apiClient<Session>(apiUrl("/sessions"), { method: "POST", body: json(normalized) }, { signal });
}

/** `GET /sessions/:id` */
export function getSession(sessionId: string, signal?: AbortSignal) {
  return apiClient<Session>(apiUrl(`/sessions/${encodeURIComponent(sessionId)}`), { method: "GET" }, { signal });
}

/** `GET /sessions/workflow/:workflowId` — get latest session for a workflow */
export function getSessionByWorkflowId(workflowId: string, signal?: AbortSignal) {
  return apiClient<Session>(apiUrl(`/sessions/workflow/${encodeURIComponent(workflowId)}`), { method: "GET" }, { signal });
}

/** `PATCH /sessions/:id/mode` */
export function patchSessionMode(sessionId: string, body: PatchSessionModeBody, signal?: AbortSignal) {
  return apiClient<PatchModeResponse>(
    apiUrl(`/sessions/${encodeURIComponent(sessionId)}/mode`),
    { method: "PATCH", body: json(body) },
    { signal }
  );
}

/** `POST /sessions/:id/finalize` */
export function finalizeSession(sessionId: string, signal?: AbortSignal) {
  return apiClient<FinalizeResponse>(
    apiUrl(`/sessions/${encodeURIComponent(sessionId)}/finalize`),
    { method: "POST" },
    { signal }
  );
}

/** `GET /sessions/:id/workflow-state` */
export function getSessionWorkflowState(sessionId: string, signal?: AbortSignal) {
  return apiClient<SessionWorkflowState>(
    apiUrl(`/sessions/${encodeURIComponent(sessionId)}/workflow-state`),
    { method: "GET" },
    { signal }
  );
}

/** `GET /sessions/:id/progress` */
export function getSessionProgress(sessionId: string, signal?: AbortSignal) {
  return apiClient<PipelineProgress>(
    apiUrl(`/sessions/${encodeURIComponent(sessionId)}/progress`),
    { method: "GET" },
    { signal }
  );
}

/** `PATCH /sessions/:id/status` */
export function patchSessionStatus(sessionId: string, body: UpdateSessionStatusBody, signal?: AbortSignal) {
  return apiClient<SessionStatusOverrideResponse>(
    apiUrl(`/sessions/${encodeURIComponent(sessionId)}/status`),
    { method: "PATCH", body: json(body) },
    { signal }
  );
}

/**
 * `DELETE /sessions/:id` — 204 No Content.
 * Uses `http` with `parseAs: 'void'`.
 */
export function deleteSession(sessionId: string, signal?: AbortSignal) {
  return http<void>(apiUrl(`/sessions/${encodeURIComponent(sessionId)}`), {
    method: "DELETE",
    parseAs: "void",
    signal,
  });
}
