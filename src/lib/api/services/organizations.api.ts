import { apiClient } from "../apiClient";
import { http } from "../http";
import { json } from "../helpers";
import { apiUrl } from "../url";
import type {
  InviteUserBody,
  OrganizationMutationResponse,
  UpdateUserRoleBody,
} from "../types";

/** `POST /org/invite` */
export function inviteOrganizationUser(body: InviteUserBody, signal?: AbortSignal) {
  return apiClient<OrganizationMutationResponse>(
    apiUrl("/org/invite"),
    { method: "POST", body: json(body) },
    { signal }
  );
}

/** `PATCH /org/users/:id/role` */
export function updateOrganizationUserRole(userId: string, body: UpdateUserRoleBody, signal?: AbortSignal) {
  return apiClient<OrganizationMutationResponse>(
    apiUrl(`/org/users/${encodeURIComponent(userId)}/role`),
    { method: "PATCH", body: json(body) },
    { signal }
  );
}

/** `DELETE /org/users/:id` */
export function revokeOrganizationUser(userId: string, signal?: AbortSignal) {
  return http<void>(apiUrl(`/org/users/${encodeURIComponent(userId)}`), {
    method: "DELETE",
    parseAs: "void",
    signal,
  });
}
