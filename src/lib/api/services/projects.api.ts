import { apiClient } from "../apiClient";
import { http } from "../http";
import { json } from "../helpers";
import { apiUrl } from "../url";

/* ---------- Response types ---------- */

export interface BackendProject {
  id: string;
  name: string;
  orgId: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectsListResponse {
  projects: BackendProject[];
  total: number;
  page: number;
  limit: number;
}

export interface ProjectWorkflowsResponse {
  workflows: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    currentVersion: number;
    orgId: string;
    ownerId: string;
    projectId: string | null;
    domain: string | null;
    tags: string[];
    createdAt: string;
    updatedAt: string;
  }>;
  total: number;
  page: number;
  limit: number;
}

/* ---------- Request bodies ---------- */

export interface CreateProjectBody {
  name: string;
}

/* ---------- API functions ---------- */

/** `GET /projects` */
export function listProjects(query?: { search?: string; page?: number; limit?: number }, signal?: AbortSignal) {
  return apiClient<ProjectsListResponse>(
    apiUrl("/projects", query ? { ...query } : undefined),
    { method: "GET" },
    { signal }
  );
}

/** `POST /projects` */
export function createProject(body: CreateProjectBody, signal?: AbortSignal) {
  return apiClient<{ project: BackendProject }>(
    apiUrl("/projects"),
    { method: "POST", body: json(body) },
    { signal }
  );
}

/** `GET /projects/:id` */
export function getProject(projectId: string, signal?: AbortSignal) {
  return apiClient<{ project: BackendProject }>(
    apiUrl(`/projects/${encodeURIComponent(projectId)}`),
    { method: "GET" },
    { signal }
  );
}

/** `GET /projects/:id/workflows` */
export function listProjectWorkflows(projectId: string, query?: { page?: number; limit?: number }, signal?: AbortSignal) {
  return apiClient<ProjectWorkflowsResponse>(
    apiUrl(`/projects/${encodeURIComponent(projectId)}/workflows`, query ? { ...query } : undefined),
    { method: "GET" },
    { signal }
  );
}

/** `DELETE /projects/:id` — 204 No Content */
export function deleteProject(projectId: string, signal?: AbortSignal) {
  return http<void>(apiUrl(`/projects/${encodeURIComponent(projectId)}`), {
    method: "DELETE",
    parseAs: "void",
    signal,
  });
}
