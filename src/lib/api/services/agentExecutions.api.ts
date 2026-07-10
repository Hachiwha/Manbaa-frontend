import { apiClient } from "../apiClient";
import { apiUrl } from "../url";
import type { AgentRulesResponse, AgentSkillsResponse } from "../types";

/** `GET /agent-executions/:id/rules` */
export function getAgentExecutionRules(executionId: string, signal?: AbortSignal) {
  return apiClient<AgentRulesResponse>(
    apiUrl(`/agent-executions/${encodeURIComponent(executionId)}/rules`),
    { method: "GET" },
    { signal }
  );
}

/** `GET /agent-executions/:id/skills` */
export function getAgentExecutionSkills(executionId: string, signal?: AbortSignal) {
  return apiClient<AgentSkillsResponse>(
    apiUrl(`/agent-executions/${encodeURIComponent(executionId)}/skills`),
    { method: "GET" },
    { signal }
  );
}
