import { apiClient } from "../apiClient";
import { http } from "../http";
import { json } from "../helpers";
import { apiUrl } from "../url";
import type {
  ActiveToggleResponse,
  CreateSkillBody,
  ListSkillApplicationsQuery,
  ListSkillsQuery,
  PatchSkillBody,
  Skill,
  SkillApplicationsResponse,
  SkillSearchBody,
  SkillSearchResponse,
  SkillsImportResponse,
  SkillsListResponse,
} from "../types";

function compactObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

/** `GET /skills` */
export function listSkills(query?: ListSkillsQuery, signal?: AbortSignal) {
  const normalizedQuery = query
    ? compactObject({
        type: query.type,
        isActive: query.isActive ?? query.is_active,
      })
    : undefined;

  return apiClient<SkillsListResponse>(
    apiUrl("/skills", normalizedQuery),
    { method: "GET" },
    { signal },
  );
}

/** `POST /skills` */
export function createSkill(body: CreateSkillBody, signal?: AbortSignal) {
  const payload = compactObject({
    name: body.name,
    description: (body as { description?: string }).description,
    skillType: (body as { skillType?: string }).skillType ?? body.type,
    content: body.content,
    appliesToDomains:
      (body as { appliesToDomains?: string[] }).appliesToDomains ??
      (body.domain ? [body.domain] : undefined),
    appliesToAgents: (body as { appliesToAgents?: string[] }).appliesToAgents,
    isMandatory: (body as { isMandatory?: boolean }).isMandatory,
  });

  return apiClient<Skill>(
    apiUrl("/skills"),
    { method: "POST", body: json(payload) },
    { signal },
  );
}

/** `GET /skills/:id` */
export function getSkill(skillId: string, signal?: AbortSignal) {
  return apiClient<Skill>(
    apiUrl(`/skills/${encodeURIComponent(skillId)}`),
    { method: "GET" },
    { signal },
  );
}

/** `PATCH /skills/:id` */
export function patchSkill(
  skillId: string,
  body: PatchSkillBody,
  signal?: AbortSignal,
) {
  const payload = compactObject({
    content: body.content,
    name: (body as { name?: string }).name,
    description: (body as { description?: string }).description,
    skillType: (body as { skillType?: string }).skillType,
    appliesToDomains: (body as { appliesToDomains?: string[] })
      .appliesToDomains,
    appliesToAgents: (body as { appliesToAgents?: string[] }).appliesToAgents,
    isMandatory: (body as { isMandatory?: boolean }).isMandatory,
    isActive: (body as { isActive?: boolean }).isActive,
  });

  return apiClient<Skill>(
    apiUrl(`/skills/${encodeURIComponent(skillId)}`),
    { method: "PATCH", body: json(payload) },
    { signal },
  );
}

/** `DELETE /skills/:id` — 204. */
export function deleteSkill(skillId: string, signal?: AbortSignal) {
  return http<void>(apiUrl(`/skills/${encodeURIComponent(skillId)}`), {
    method: "DELETE",
    parseAs: "void",
    signal,
  });
}

/** `POST /skills/search` */
export function searchSkills(body: SkillSearchBody, signal?: AbortSignal) {
  const payload = compactObject({
    queryText: (body as { queryText?: string }).queryText ?? body.query,
    topK: (body as { topK?: number }).topK ?? body.top_k,
    filterTypes: (body as { filterTypes?: string[] }).filterTypes,
    minSimilarity: (body as { minSimilarity?: number }).minSimilarity,
  });

  return apiClient<SkillSearchResponse>(
    apiUrl("/skills/search"),
    { method: "POST", body: json(payload) },
    { signal },
  );
}

/** `GET /skills/:id/applications` */
export function getSkillApplications(
  skillId: string,
  query?: ListSkillApplicationsQuery,
  signal?: AbortSignal,
) {
  return apiClient<SkillApplicationsResponse>(
    apiUrl(
      `/skills/${encodeURIComponent(skillId)}/applications`,
      query ? { ...query } : undefined,
    ),
    { method: "GET" },
    { signal },
  );
}

/** `POST /skills/import` */
export function importSkillsBundle(
  payload: File | unknown,
  signal?: AbortSignal,
) {
  if (payload instanceof File) {
    const form = new FormData();
    form.append("file", payload);
    return http<SkillsImportResponse>(apiUrl("/skills/import"), {
      method: "POST",
      body: form,
      parseAs: "json",
      signal,
    });
  }

  return apiClient<SkillsImportResponse>(
    apiUrl("/skills/import"),
    { method: "POST", body: json(payload) },
    { signal },
  );
}

/** `GET /skills/export` */
export function exportSkills(signal?: AbortSignal) {
  return apiClient<unknown>(
    apiUrl("/skills/export"),
    { method: "GET" },
    { signal },
  );
}

/** `POST /skills/:id/activate` */
export function activateSkill(skillId: string, signal?: AbortSignal) {
  return apiClient<ActiveToggleResponse>(
    apiUrl(`/skills/${encodeURIComponent(skillId)}/activate`),
    { method: "POST" },
    { signal },
  );
}

/** `POST /skills/:id/deactivate` */
export function deactivateSkill(skillId: string, signal?: AbortSignal) {
  return apiClient<ActiveToggleResponse>(
    apiUrl(`/skills/${encodeURIComponent(skillId)}/deactivate`),
    { method: "POST" },
    { signal },
  );
}
