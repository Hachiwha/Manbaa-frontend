import { apiClient } from "../apiClient";
import { http } from "../http";
import { json } from "../helpers";
import { apiUrl } from "../url";
import type {
  DocumentExtractedText,
  DocumentResponseDto,
  SourceType,
  UpdateExtractedTextBody,
} from "../types";

/**
 * `POST /documents/upload` — multipart; use when UI passes `File` (not JSON).
 */
export async function uploadDocument(input: {
  file: File;
  sessionId: string;
  workflowId?: string;
  sourceType?: SourceType;
  signal?: AbortSignal;
}): Promise<DocumentResponseDto> {
  const form = new FormData();
  form.append("file", input.file);
  form.append("sessionId", input.sessionId);
  if (input.workflowId) {
    form.append("workflowId", input.workflowId);
  }
  if (input.sourceType) {
    form.append("sourceType", input.sourceType);
  }

  return http<DocumentResponseDto>(apiUrl("/documents/upload"), {
    method: "POST",
    body: form,
    parseAs: "json",
    signal: input.signal,
  });
}

/** `GET /documents/:id` */
export function getDocument(documentId: string, signal?: AbortSignal) {
  return apiClient<DocumentResponseDto>(
    apiUrl(`/documents/${encodeURIComponent(documentId)}`),
    { method: "GET" },
    { signal },
  );
}

/** `DELETE /documents/:id` */
export function deleteDocument(documentId: string, signal?: AbortSignal) {
  return http<void>(apiUrl(`/documents/${encodeURIComponent(documentId)}`), {
    method: "DELETE",
    parseAs: "void",
    signal,
  });
}

/** `GET /workflows/:workflowId/documents` */
export function listWorkflowDocuments(
  workflowId: string,
  query?: { cursor?: string; limit?: number },
  signal?: AbortSignal,
) {
  return apiClient<DocumentResponseDto[]>(
    apiUrl(
      `/workflows/${encodeURIComponent(workflowId)}/documents`,
      query ? { ...query } : undefined,
    ),
    { method: "GET" },
    { signal },
  );
}

/** `POST /documents/:id/reprocess` — 202 + JSON body. */
export function reprocessDocument(documentId: string, signal?: AbortSignal) {
  return apiClient<DocumentResponseDto>(
    apiUrl(`/documents/${encodeURIComponent(documentId)}/reprocess`),
    { method: "POST" },
    { signal },
  );
}

/** `GET /documents/:id/extracted-text` */
export function getDocumentExtractedText(
  documentId: string,
  signal?: AbortSignal,
) {
  return apiClient<DocumentExtractedText>(
    apiUrl(`/documents/${encodeURIComponent(documentId)}/extracted-text`),
    { method: "GET" },
    { signal },
  );
}

/** `PATCH /documents/:id/extracted-text` */
export function updateDocumentExtractedText(
  documentId: string,
  body: UpdateExtractedTextBody,
  signal?: AbortSignal,
) {
  return apiClient<DocumentExtractedText>(
    apiUrl(`/documents/${encodeURIComponent(documentId)}/extracted-text`),
    { method: "PATCH", body: json(body) },
    { signal },
  );
}
