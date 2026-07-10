import { apiClient } from "../apiClient";
import { http } from "../http";
import { json } from "../helpers";
import { apiUrl } from "../url";
import type {
  ApproveAllElementsResponse,
  AssignCommentBody,
  AssignedCommentsQuery,
  AssignedCommentsResponse,
  Comment,
  CommentsListResponse,
  CreateCommentBody,
  CreateReplyBody,
  ElementApprovalResponse,
  FullReviewProgress,
  InjectCommentToAiBody,
  ListCommentsQuery,
  PatchCommentBody,
  ResolveCommentBody,
  ResolveResponse,
} from "../types";

/** `POST /workflows/:id/comments` */
export function createWorkflowComment(
  workflowId: string,
  body: CreateCommentBody,
  signal?: AbortSignal
) {
  return apiClient<Comment>(
    apiUrl(`/workflows/${encodeURIComponent(workflowId)}/comments`),
    { method: "POST", body: json(body) },
    { signal }
  );
}

/** `GET /workflows/:id/comments` */
export function listWorkflowComments(
  workflowId: string,
  query?: ListCommentsQuery,
  signal?: AbortSignal
) {
  return apiClient<CommentsListResponse>(
    apiUrl(`/workflows/${encodeURIComponent(workflowId)}/comments`, query ? { ...query } : undefined),
    { method: "GET" },
    { signal }
  );
}

/** `PATCH /comments/:id` */
export function patchComment(commentId: string, body: PatchCommentBody, signal?: AbortSignal) {
  return apiClient<Comment>(
    apiUrl(`/comments/${encodeURIComponent(commentId)}`),
    { method: "PATCH", body: json(body) },
    { signal }
  );
}

/** `DELETE /comments/:id` — 204. */
export function deleteComment(commentId: string, signal?: AbortSignal) {
  return http<void>(apiUrl(`/comments/${encodeURIComponent(commentId)}`), {
    method: "DELETE",
    parseAs: "void",
    signal,
  });
}

/** `POST /comments/:id/reply` */
export function replyToComment(commentId: string, body: CreateReplyBody, signal?: AbortSignal) {
  return apiClient<Comment>(
    apiUrl(`/comments/${encodeURIComponent(commentId)}/reply`),
    { method: "POST", body: json(body) },
    { signal }
  );
}

/** `POST /comments/:id/resolve` */
export function resolveComment(commentId: string, body: ResolveCommentBody, signal?: AbortSignal) {
  return apiClient<ResolveResponse>(
    apiUrl(`/comments/${encodeURIComponent(commentId)}/resolve`),
    { method: "POST", body: json(body) },
    { signal }
  );
}

/** `PATCH /workflows/:id/elements/:elemId/approve` */
export function approveWorkflowElement(
  workflowId: string,
  elemId: string,
  signal?: AbortSignal
) {
  return apiClient<ElementApprovalResponse>(
    apiUrl(
      `/workflows/${encodeURIComponent(workflowId)}/elements/${encodeURIComponent(elemId)}/approve`
    ),
    { method: "PATCH" },
    { signal }
  );
}

/** `GET /workflows/:id/review-progress` */
export function getWorkflowReviewProgress(workflowId: string, signal?: AbortSignal) {
  return apiClient<FullReviewProgress>(
    apiUrl(`/workflows/${encodeURIComponent(workflowId)}/review-progress`),
    { method: "GET" },
    { signal }
  );
}

/** `POST /comments/:id/inject-to-ai` */
export function injectCommentToAi(commentId: string, body: InjectCommentToAiBody = {}, signal?: AbortSignal) {
  return apiClient<Comment>(
    apiUrl(`/comments/${encodeURIComponent(commentId)}/inject-to-ai`),
    { method: "POST", body: json(body) },
    { signal }
  );
}

/** `PATCH /comments/:id/assign` */
export function assignComment(commentId: string, body: AssignCommentBody, signal?: AbortSignal) {
  return apiClient<Comment>(
    apiUrl(`/comments/${encodeURIComponent(commentId)}/assign`),
    { method: "PATCH", body: json(body) },
    { signal }
  );
}

/** `GET /comments/assigned-to-me` */
export function listAssignedToMeComments(query?: AssignedCommentsQuery, signal?: AbortSignal) {
  return apiClient<AssignedCommentsResponse>(
    apiUrl("/comments/assigned-to-me", query ? { ...query } : undefined),
    { method: "GET" },
    { signal }
  );
}

/** `POST /workflows/:id/elements/approve-all` */
export function approveAllWorkflowElements(workflowId: string, signal?: AbortSignal) {
  return apiClient<ApproveAllElementsResponse>(
    apiUrl(`/workflows/${encodeURIComponent(workflowId)}/elements/approve-all`),
    { method: "POST" },
    { signal }
  );
}
