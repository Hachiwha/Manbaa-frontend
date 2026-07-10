import { apiClient } from "../apiClient";
import { http } from "../http";
import { json } from "../helpers";
import { apiUrl } from "../url";
import type {
  CreateWorkflowVersionBody,
  CreateWorkflowBody,
  DecisionLogResponse,
  DiagramData,
  DuplicateResponse,
  ExportAuditLogQuery,
  ExportWorkflowResponse,
  ListWorkflowAuditLogQuery,
  ListWorkflowsQuery,
  PaginatedResponse,
  PatchWorkflowBody,
  VersionsResponse,
  Workflow,
  WorkflowAuditLogResponse,
  WorkflowDiff,
  WorkflowListItem,
  WorkflowVersionDetail,
} from "../types";

/** `POST /workflows` */
export function createWorkflow(body: CreateWorkflowBody, signal?: AbortSignal) {
  return apiClient<Workflow>(apiUrl("/workflows"), { method: "POST", body: json(body) }, { signal });
}

/** `GET /workflows` */
export function listWorkflows(query?: ListWorkflowsQuery, signal?: AbortSignal) {
  return apiClient<PaginatedResponse<WorkflowListItem>>(
    apiUrl("/workflows", query ? { ...query } : undefined),
    { method: "GET" },
    { signal }
  );
}

/** `GET /workflows/:id` */
export function getWorkflow(workflowId: string, signal?: AbortSignal) {
  return apiClient<Workflow>(apiUrl(`/workflows/${encodeURIComponent(workflowId)}`), { method: "GET" }, { signal });
}

/** `PATCH /workflows/:id` */
export function patchWorkflow(workflowId: string, body: PatchWorkflowBody, signal?: AbortSignal) {
  return apiClient<Workflow>(
    apiUrl(`/workflows/${encodeURIComponent(workflowId)}`),
    { method: "PATCH", body: json(body) },
    { signal }
  );
}

/** `DELETE /workflows/:id` — 204. */
export function deleteWorkflow(workflowId: string, signal?: AbortSignal) {
  return http<void>(apiUrl(`/workflows/${encodeURIComponent(workflowId)}`), { method: "DELETE", parseAs: "void", signal });
}

/** `GET /workflows/:id/versions` */
export function listWorkflowVersions(workflowId: string, signal?: AbortSignal) {
  return apiClient<VersionsResponse>(
    apiUrl(`/workflows/${encodeURIComponent(workflowId)}/versions`),
    { method: "GET" },
    { signal }
  );
}

/** `GET /workflows/:id/versions/:versionNumber` */
export function getWorkflowVersion(workflowId: string, versionNumber: number, signal?: AbortSignal) {
  return apiClient<WorkflowVersionDetail>(
    apiUrl(`/workflows/${encodeURIComponent(workflowId)}/versions/${versionNumber}`),
    { method: "GET" },
    { signal }
  );
}

/** `GET /workflows/:id/diff/:v1/:v2` */
export function getWorkflowVersionDiff(
  workflowId: string,
  v1: number,
  v2: number,
  signal?: AbortSignal
) {
  return apiClient<WorkflowDiff>(
    apiUrl(`/workflows/${encodeURIComponent(workflowId)}/diff/${v1}/${v2}`),
    { method: "GET" },
    { signal }
  );
}

/** `GET /workflows/:id/diagram-data` */
export function getWorkflowDiagramData(workflowId: string, signal?: AbortSignal) {
  return apiClient<DiagramData>(
    apiUrl(`/workflows/${encodeURIComponent(workflowId)}/diagram-data`),
    { method: "GET" },
    { signal }
  );
}

/** `POST /workflows/:id/duplicate` */
export function duplicateWorkflow(
  workflowId: string,
  body: Record<string, never> = {},
  signal?: AbortSignal
) {
  return apiClient<DuplicateResponse>(
    apiUrl(`/workflows/${encodeURIComponent(workflowId)}/duplicate`),
    { method: "POST", body: json(body) },
    { signal }
  );
}

/** `GET /workflows/:id/decision-log` */
export function getWorkflowDecisionLog(workflowId: string, signal?: AbortSignal) {
  return apiClient<DecisionLogResponse>(
    apiUrl(`/workflows/${encodeURIComponent(workflowId)}/decision-log`),
    { method: "GET" },
    { signal }
  );
}

/** `POST /workflows/:id/versions` */
export function createWorkflowVersion(
  workflowId: string,
  body: CreateWorkflowVersionBody = {},
  signal?: AbortSignal
) {
  return apiClient<unknown>(
    apiUrl(`/workflows/${encodeURIComponent(workflowId)}/versions`),
    { method: "POST", body: json(body) },
    { signal }
  );
}

/** `GET /workflows/:id/audit-log` */
export function getWorkflowAuditLog(
  workflowId: string,
  query?: ListWorkflowAuditLogQuery,
  signal?: AbortSignal
) {
  return apiClient<WorkflowAuditLogResponse>(
    apiUrl(`/workflows/${encodeURIComponent(workflowId)}/audit-log`, query ? { ...query } : undefined),
    { method: "GET" },
    { signal }
  );
}

/** `POST /workflows/:id/audit-log/export` */
export function exportWorkflowAuditLog(
  workflowId: string,
  query: ExportAuditLogQuery,
  signal?: AbortSignal
) {
  return apiClient<unknown>(
    apiUrl(`/workflows/${encodeURIComponent(workflowId)}/audit-log/export`, {
      format: query.format,
      type: query.type,
      from: query.from,
      to: query.to,
      actor_id: query.actor_id,
    } as Record<string, string | number | boolean | undefined>),
    { method: "POST" },
    { signal }
  );
}

export type WorkflowExportType = "elsa" | "bpmn" | "pdf";

/** `POST /workflows/:id/export/elsa` — Export workflow to ELSA format (JSON) */
export function exportWorkflowToElsa(workflowId: string, signal?: AbortSignal) {
  return apiClient<ExportWorkflowResponse>(
    apiUrl(`/workflows/${encodeURIComponent(workflowId)}/export/elsa`),
    { method: "POST" },
    { signal }
  );
}

/** `POST /workflows/:id/export/bpmn` — Export workflow to BPMN format (XML, async) */
export function exportWorkflowToBpmn(workflowId: string, signal?: AbortSignal) {
  return apiClient<ExportWorkflowResponse>(
    apiUrl(`/workflows/${encodeURIComponent(workflowId)}/export/bpmn`),
    { method: "POST" },
    { signal }
  );
}

/** `POST /workflows/:id/export/pdf` — Export workflow to PDF (async) */
export function exportWorkflowToPdf(workflowId: string, signal?: AbortSignal) {
  return apiClient<ExportWorkflowResponse>(
    apiUrl(`/workflows/${encodeURIComponent(workflowId)}/export/pdf`),
    { method: "POST" },
    { signal }
  );
}

/**
 * `POST /workflows/:id/export/{elsa|bpmn|pdf}` — returns binary; trigger download with `URL.createObjectURL`.
 * @deprecated Use exportWorkflowToElsa, exportWorkflowToBpmn, or exportWorkflowToPdf instead.
 */
export function exportWorkflow(
  workflowId: string,
  type: WorkflowExportType,
  signal?: AbortSignal
) {
  return http<Blob>(apiUrl(`/workflows/${encodeURIComponent(workflowId)}/export/${type}`), {
    method: "POST",
    parseAs: "blob",
    signal,
  });
}
