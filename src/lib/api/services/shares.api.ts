import { apiClient } from "../apiClient";
import { json } from "../helpers";
import { apiUrl } from "../url";

export interface CreateShareBody {
  expiresIn?: "1d" | "7d" | "never";
  maxViews?: number;
}

export interface ShareResponse {
  token: string;
  url: string;
  expiresAt?: string;
  maxViews?: number;
}

/** `POST /workflows/:id/share` */
export function createWorkflowShare(
  workflowId: string,
  body: CreateShareBody = {},
  signal?: AbortSignal
) {
  return apiClient<ShareResponse>(
    apiUrl(`/workflows/${encodeURIComponent(workflowId)}/share`),
    { method: "POST", body: json(body) },
    { signal }
  );
}
