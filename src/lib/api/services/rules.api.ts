import { apiClient } from "../apiClient";
import { http } from "../http";
import { json } from "../helpers";
import { apiUrl } from "../url";
import type {
  ActiveToggleResponse,
  CreateRuleBody,
  ListRulesQuery,
  PatchRuleBody,
  PreviewSessionRulesResponse,
  Rule,
  RulesListResponse,
  RulesPreviewBody,
  RulesPreviewResponse,
  TestRuleBody,
  TestRuleResponse,
} from "../types";

/** `GET /rules` */
export function listRules(query?: ListRulesQuery, signal?: AbortSignal) {
  return apiClient<RulesListResponse>(
    apiUrl("/rules", query ? { ...query } : undefined),
    { method: "GET" },
    { signal },
  );
}

/** `POST /rules` */
export function createRule(body: CreateRuleBody, signal?: AbortSignal) {
  return apiClient<Rule>(
    apiUrl("/rules"),
    { method: "POST", body: json(body) },
    { signal },
  );
}

/** `GET /rules/:id` */
export function getRule(ruleId: string, signal?: AbortSignal) {
  return apiClient<Rule>(
    apiUrl(`/rules/${encodeURIComponent(ruleId)}`),
    { method: "GET" },
    { signal },
  );
}

/** `PATCH /rules/:id` */
export function patchRule(
  ruleId: string,
  body: PatchRuleBody,
  signal?: AbortSignal,
) {
  return apiClient<Rule>(
    apiUrl(`/rules/${encodeURIComponent(ruleId)}`),
    { method: "PATCH", body: json(body) },
    { signal },
  );
}

/** `DELETE /rules/:id` — 204. */
export function deleteRule(ruleId: string, signal?: AbortSignal) {
  return http<void>(apiUrl(`/rules/${encodeURIComponent(ruleId)}`), {
    method: "DELETE",
    parseAs: "void",
    signal,
  });
}

/** `POST /rules/:id/activate` */
export function activateRule(ruleId: string, signal?: AbortSignal) {
  return apiClient<ActiveToggleResponse>(
    apiUrl(`/rules/${encodeURIComponent(ruleId)}/activate`),
    { method: "POST" },
    { signal },
  );
}

/** `POST /rules/:id/deactivate` */
export function deactivateRule(ruleId: string, signal?: AbortSignal) {
  return apiClient<ActiveToggleResponse>(
    apiUrl(`/rules/${encodeURIComponent(ruleId)}/deactivate`),
    { method: "POST" },
    { signal },
  );
}

/** Legacy helper now mapped to `GET /sessions/:id/rules/preview`. */
export function previewRules(body: RulesPreviewBody, signal?: AbortSignal) {
  const sessionId =
    (body as { session_id?: string; sessionId?: string }).session_id ??
    (body as { session_id?: string; sessionId?: string }).sessionId;

  if (!sessionId) {
    throw new Error("previewRules requires `session_id` or `sessionId`.");
  }

  return previewSessionRules(
    sessionId,
    signal,
  ) as Promise<RulesPreviewResponse>;
}

/** `POST /rules/import` */
export function importRulesBundle(body: unknown, signal?: AbortSignal) {
  return apiClient<unknown>(
    apiUrl("/rules/import"),
    {
      method: "POST",
      body: json(body),
    },
    { signal },
  );
}

/**
 * `GET /rules/export` — application/json; shape depends on server bundle.
 */
export function exportRules(signal?: AbortSignal) {
  return apiClient<unknown>(
    apiUrl("/rules/export"),
    { method: "GET" },
    { signal },
  );
}

/** `POST /rules/:id/test` */
export function testRule(
  ruleId: string,
  body: TestRuleBody,
  signal?: AbortSignal,
) {
  return apiClient<TestRuleResponse>(
    apiUrl(`/rules/${encodeURIComponent(ruleId)}/test`),
    { method: "POST", body: json(body) },
    { signal },
  );
}

/** `GET /sessions/:id/rules/preview` */
export function previewSessionRules(sessionId: string, signal?: AbortSignal) {
  return apiClient<PreviewSessionRulesResponse>(
    apiUrl(`/sessions/${encodeURIComponent(sessionId)}/rules/preview`),
    { method: "GET" },
    { signal },
  );
}
