import { apiClient } from "../apiClient";
import { http } from "../http";
import { json } from "../helpers";
import { apiUrl } from "../url";
import type { CreateMessageBody, ListSessionMessagesQuery, Message, PaginatedResponse } from "../types";

/** `GET /sessions/:id/messages` */
export function listSessionMessages(
  sessionId: string,
  query?: ListSessionMessagesQuery,
  signal?: AbortSignal
) {
  return apiClient<PaginatedResponse<Message>>(
    apiUrl(`/sessions/${encodeURIComponent(sessionId)}/messages`, query ? { ...query } : undefined),
    { method: "GET" },
    { signal }
  );
}

/** `POST /sessions/:id/messages` */
export function createSessionMessage(sessionId: string, body: CreateMessageBody, signal?: AbortSignal) {
  return apiClient<Message>(
    apiUrl(`/sessions/${encodeURIComponent(sessionId)}/messages`),
    { method: "POST", body: json(body) },
    { signal }
  );
}

/** `GET /messages/:id` */
export function getMessageById(messageId: string, signal?: AbortSignal) {
  return apiClient<Message>(apiUrl(`/messages/${encodeURIComponent(messageId)}`), { method: "GET" }, { signal });
}

/**
 * `GET /sessions/:id/messages/export` — `application/pdf` binary.
 * Returns a `Blob` for `URL.createObjectURL` or download.
 */
export function downloadSessionTranscript(sessionId: string, signal?: AbortSignal) {
  return http<Blob>(apiUrl(`/sessions/${encodeURIComponent(sessionId)}/messages/export`), {
    method: "GET",
    parseAs: "blob",
    signal,
  });
}
