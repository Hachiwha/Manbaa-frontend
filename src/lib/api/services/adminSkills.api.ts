import { apiClient } from "../apiClient";
import { apiUrl } from "../url";
import type { AdminSkillAnalyticsResponse } from "../types";

/** `GET /admin/skills/analytics` */
export function getAdminSkillsAnalytics(signal?: AbortSignal) {
  return apiClient<AdminSkillAnalyticsResponse>(
    apiUrl("/admin/skills/analytics"),
    { method: "GET" },
    { signal }
  );
}
