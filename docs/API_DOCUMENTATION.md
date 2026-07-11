# API Documentation — Frontend ↔ Backend Contract

> Source of truth: [`docs/collection.json`](./collection.json), an OpenAPI 3.0 export from the real NestJS backend ("FlowForge API" v1.0), cross-checked against every call actually made in `src/lib/api/services/*.api.ts`. Where the two disagree, both sides are called out explicitly below — see [§7 Contract gaps](#7-contract-gaps-read-this-before-integrating).

## 1. Base configuration

| Setting | Env var | Default | Notes |
|---|---|---|---|
| API base URL | `VITE_API_BASE_URL` | `http://localhost:3000` | Read by Vite at **build time**, not runtime — see `src/lib/api/config.ts` |
| Path prefix | `VITE_API_PREFIX` | `/api` | Prepended to every path below unless already present. Set to `""` if the backend is mounted at root. |

Every path in this document is written **without** the `/api` prefix (matching how the OpenAPI spec lists them, e.g. `/api/workflows`) — the frontend's `apiUrl()` helper (`src/lib/api/url.ts`) adds the prefix automatically. So `POST /workflows` below means the real wire request is `POST {VITE_API_BASE_URL}/api/workflows`.

All requests are JSON (`Content-Type: application/json`) except file uploads (`multipart/form-data`) and two binary export endpoints, noted inline.

## 2. Authentication

**⚠️ This is the single biggest gap between frontend and backend today — see [§7.1](#71-auth-module-not-in-the-backend-openapi-spec).**

- Scheme: `Authorization: Bearer <JWT>`, per the OpenAPI `securitySchemes.bearer` (`type: http, scheme: bearer, bearerFormat: JWT`).
- The frontend currently persists the token in **`localStorage`** (`src/lib/api/config.ts`, key `flou2flow_api_token`) and attaches it as a Bearer header on every request. `http.ts` *also* sends `credentials: "include"` (cookies) on every fetch.
- `.claude/rules/security.md` (this repo's own security rules) says JWT **must** live in an httpOnly cookie, never localStorage — the current implementation is explicitly flagged in code comments as a "dev bridge until real auth" (`src/lib/auth/guards.ts`, `src/lib/api/config.ts`). **Backend and frontend need to agree on one mechanism before shipping**: either the backend issues a `Set-Cookie` on login and the frontend drops the Bearer/localStorage path entirely, or the backend explicitly supports Bearer-in-header and the frontend's cookie `credentials: "include"` is dead weight to remove.
- Auth guard is client-side only (`requireAuth`/`requireGuest` in `src/lib/auth/guards.ts`) because the token lives in `localStorage`, invisible during SSR. **This is a UX guard, not a security boundary** — every backend endpoint must independently enforce its own `@UseGuards`/JWT check regardless of what the frontend does.

## 3. Error format

`src/lib/api/http.ts` expects, on any non-2xx response:

```json
{ "message": "human-readable error", "...": "any other fields are ignored" }
```

If the body isn't JSON, the raw text is used as the error message. `HttpError.status` carries the HTTP status code; `HttpError.data` carries the parsed body (or raw text). 204 responses are treated as success with no body.

## 4. REST endpoints

Grouped by domain. **Auth** column: 🔓 = no token required (`security: []`), 🔒 = Bearer JWT required (everything else).

### 4.1 Health — `health.api.ts`

| Method | Path | Auth | Response |
|---|---|---|---|
| GET | `/health` | 🔓 | `{ status?, ... }` |
| GET | `/health/details` | 🔓 | ″ |
| GET | `/health/ai-service` | 🔓 | ″ |
| GET | `/health/ollama` | 🔓 | ″ |
| GET | `/health/pgvector` | 🔓 | ″ |
| GET | `/health/nats` | 🔓 | ″ |
| GET | `/health/ping` | 🔓 | ″ |

Backend doesn't declare a response schema for any of these (`description: ""`, no `content`) — frontend types them as `Record<string, unknown>` and only reads `.status` defensively.

### 4.2 Documents — `documents.api.ts`

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| POST | `/documents/upload` | 🔒 | `multipart/form-data`: `sessionId` (uuid, required), `workflowId` (uuid, optional), `file` (binary, required) | `DocumentResponseDto` |
| GET | `/documents/{id}` | 🔒 | — | `DocumentResponseDto` |
| DELETE | `/documents/{id}` | 🔒 | — | 204, soft-delete only (MinIO object kept) |
| GET | `/documents/{id}/extracted-text` | 🔒 | — | `DocumentExtractedTextDto` |
| PATCH | `/documents/{id}/extracted-text` | 🔒 | `{ extractedText: string }` | `DocumentExtractedTextDto` |
| POST | `/documents/{id}/reprocess` | 🔒 | — | 202 + `DocumentResponseDto` (new `docVersion`, re-triggers preprocessing) |
| GET | `/workflows/{workflowId}/documents` | 🔒 | — | `DocumentResponseDto[]` |

`DocumentResponseDto`:
```ts
{
  id: uuid; workflowId: uuid; sessionId: uuid;
  filename: string; fileType: string; storageUrl: string;
  fileSizeBytes: number; docVersion: number;
  presignedUrl?: string; createdAt: string; deletedAt?: string | null;
}
```
`DocumentExtractedTextDto`: `{ documentId: uuid; docVersion: number; extractedText?: string | null; preprocessingConfidence?: number | null }`

Frontend-only note: `uploadDocument()` also appends a `sourceType` form field (one of `procedure_manual | interview_transcript | email | sketch | other`) that **isn't in the OpenAPI request schema** — confirm the backend actually reads it, or drop it.

### 4.3 Messages — `messages.api.ts`

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/sessions/{sessionId}/messages` | 🔒 | query: `type?`, `cursor?`, `search?` | `PaginatedMessagesDto` (`{ items: MessageResponseDto[], next_cursor: string \| null }`) |
| POST | `/sessions/{sessionId}/messages` | 🔒 | `CreateMessageDto` | `MessageResponseDto` (201) |
| GET | `/messages/{id}` | 🔒 | — | `MessageResponseDto` |
| GET | `/sessions/{sessionId}/messages/export` | 🔒 | — | `application/pdf` binary (transcript export) |

`MessageResponseDto`: `{ id, sessionId, role: "user"|"ai"|"system", type: MessageType, content: string, metadata: object, createdAt }`
`CreateMessageDto`: `{ role, type, content, metadata? }`
`MessageType` enum: `user_input | ai_question | ai_response | ai_summary | ai_update | ai_confidence_report | system_note | system_status`

**Mismatch:** the OpenAPI `PaginatedMessagesDto` wraps the array in `items`, but frontend's `types.ts` (`PaginatedResponse<T>`) expects `data` + `has_more` + `total`. `listSessionMessages()` reads `messagesData?.data` in `workspace.$sessionId.tsx` — **confirm with backend which key it actually sends** (`items` per spec vs `data` per frontend type) before wiring real data through, or messages will silently render empty.

### 4.4 Sessions — `sessions.api.ts`

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| POST | `/sessions` | 🔒 | `CreateSessionDto`: `{ workflowId: uuid, mode: "auto"\|"interactive" }` | `Session` (201) |
| GET | `/sessions/{id}` | 🔒 | — | `Session` |
| DELETE | `/sessions/{id}` | 🔒 | — | archive session + related rows |
| PATCH | `/sessions/{id}/mode` | 🔒 | `{ mode }` | `PatchModeResponse` |
| POST | `/sessions/{id}/finalize` | 🔒 | — | `FinalizeResponse` (201), status → `DRAFT_READY` |
| GET | `/sessions/{id}/workflow-state` | 🔒 | — | `SessionWorkflowState` (latest `elements_json` + version + confidence) |
| GET | `/sessions/{id}/progress` | 🔒 | — | `PipelineProgress` |
| PATCH | `/sessions/{id}/status` | 🔒 | `UpdateSessionStatusDto`: `{ status, reason, force? }` — **admin only** | `SessionStatusOverrideResponse` |

`Session`: `{ id, workflow_id, user_id, mode, status, confidence_score, created_at, finalized_at }`

Not in the OpenAPI spec but called by the frontend — see [§7.2](#72-sessions-by-workflow-lookup-missing).

### 4.5 Workflows — `workflows.api.ts`

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| POST | `/workflows` | 🔒 | `CreateWorkflowDto` (frontend sends `{ projectId, title, description?, domain?, tags? }`) | `Workflow` (201) |
| GET | `/workflows` | 🔒 | query: `ListWorkflowsQuery` (`q, status, domain, tags, projectId, search, cursor, limit, ...`) | `PaginatedResponse<WorkflowListItem>` |
| GET | `/workflows/{id}` | 🔒 | — | `Workflow` |
| PATCH | `/workflows/{id}` | 🔒 | `Partial<{ title, description, domain, tags }>` | `Workflow` |
| DELETE | `/workflows/{id}` | 🔒 | — | 204, archive |
| POST | `/workflows/{id}/versions` | 🔒 | `CreateVersionDto` (`{ note?, message? }`) | 201 |
| GET | `/workflows/{id}/versions` | 🔒 | — | `VersionsResponse` |
| GET | `/workflows/{id}/versions/{versionNumber}` | 🔒 | — | `WorkflowVersionDetail` |
| GET | `/workflows/{id}/diff/{v1}/{v2}` | 🔒 | — | `WorkflowDiff` |
| POST | `/workflows/{id}/duplicate` | 🔒 | `DuplicateWorkflowDto` | `DuplicateResponse` (201) |
| GET | `/workflows/{id}/diagram-data` | 🔒 | — | `DiagramData` (`{ workflow_id, version_number, nodes: ReactFlowNode[], edges: ReactFlowEdge[] }`) |
| GET | `/workflows/{id}/audit-log` | 🔒 | query: `type?, from?, to?, actor_id?` | `WorkflowAuditLogResponse` |
| POST | `/workflows/{id}/audit-log/export` | 🔒 | query: `format: "csv"\|"pdf", type?, from?, to?, actor_id?` | 201 |
| GET | `/workflows/{id}/decision-log` | 🔒 | — | `DecisionLogResponse` |
| POST | `/workflows/{id}/export/elsa` | 🔒 | — | `ExportWorkflowResponse` (JSON, sync) |
| POST | `/workflows/{id}/export/bpmn` | 🔒 | — | 202, `ExportWorkflowResponse` (XML, async) |
| POST | `/workflows/{id}/export/pdf` | 🔒 | — | 202, `ExportWorkflowResponse` (async) |

`Workflow`: `{ id, title, description, status, current_version, confidence_score, divergence_similarity?, domain, tags, org_id, owner_id, created_at, updated_at }`
`WorkflowStatus`: `DRAFT | IN_ELICITATION | PENDING_REVIEW | VALIDATED | EXPORTED | ARCHIVED`

**Mismatch:** `CreateWorkflowDto`, `CreateVersionDto`, `DuplicateWorkflowDto` are all declared as empty `{}` schemas in the OpenAPI spec (the backend controller methods exist and are documented, but the DTO classes have no `@ApiProperty` decorators yet) — the request bodies above are what the *frontend* actually sends. Confirm the backend DTOs accept these fields.

### 4.6 Sharing — `shares.api.ts`

Not in the OpenAPI spec at all — see [§7.3](#73-sharing-module-missing-entirely).

### 4.7 Comments & Review — `comments.api.ts`

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| POST | `/workflows/{workflowId}/comments` | 🔒 | `CreateCommentDto`: `{ type, content, element_id }` | 201 |
| GET | `/workflows/{workflowId}/comments` | 🔒 | query: `element_id?, type?, resolved?` | `CommentsListResponse` |
| PATCH | `/comments/{id}` | 🔒 | `{ content }` (author or admin only) | `Comment` |
| DELETE | `/comments/{id}` | 🔒 | — | 204, soft delete (author or admin only) |
| POST | `/comments/{id}/reply` | 🔒 | `{ content }` | `Comment` (201, threaded reply) |
| POST | `/comments/{id}/resolve` | 🔒 | `{ resolution_note }` | `Comment` (400 if note missing) |
| POST | `/comments/{id}/inject-to-ai` | 🔒 | `{ message? }` | `Comment` (BA / Process Owner / Admin only) |
| PATCH | `/comments/{id}/assign` | 🔒 | `{ assignee_id? }` | `Comment` (author/admin/process-owner only; 404 if assignee not in org) |
| GET | `/comments/assigned-to-me` | 🔒 | query: `resolved?` | `AssignedCommentsResponse` |
| PATCH | `/workflows/{workflowId}/elements/{elemId}/approve` | 🔒 | — | `ElementApprovalResponse` |
| POST | `/workflows/{workflowId}/elements/approve-all` | 🔒 | — | `ApproveAllElementsResponse` (201, Admin/Process Owner only) |
| GET | `/workflows/{workflowId}/review-progress` | 🔒 | — | `FullReviewProgress` (excludes archived elements) |

`CommentType`: `question | correction | approval | suggestion | escalation`
`Comment`: `{ id, workflow_id, element_id, author_id, author?, type, content, resolved, resolved_at, resolved_by, resolution_note?, parent_id, injected_to_ai, replies?, created_at }`

### 4.8 Rules — `rules.api.ts`

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/rules` | 🔒 | query: `type?, scope?, agent_type?, is_active?` | `RulesListResponse` |
| POST | `/rules` | 🔒 | `CreateRuleDto`: `{ name, type, scope, agent_target, instruction, priority }` | 201 |
| GET | `/rules/{id}` | 🔒 | — | `Rule` |
| PATCH | `/rules/{id}` | 🔒 | `Partial<{ instruction, priority, name }>` | `Rule` |
| DELETE | `/rules/{id}` | 🔒 | — | 204, soft delete |
| POST | `/rules/{id}/activate` | 🔒 | — | 201 |
| POST | `/rules/{id}/deactivate` | 🔒 | — | 201 |
| POST | `/rules/{id}/test` | 🔒 | `{ input?, input_text?, context? }` | `TestRuleResponse` |
| GET | `/rules/export` | 🔒 | — | rules bundle JSON |
| POST | `/rules/import` | 🔒 | `ImportRulesBundleDto` | 201 |
| GET | `/sessions/{id}/rules/preview` | 🔒 | — | `PreviewSessionRulesResponse` (matching rules for a session) |
| GET | `/agent-executions/{id}/rules` | 🔒 | — | `AgentRulesResponse` (rules applied to an execution) |

`RuleType`: `EXTRACTION | ACTOR_MAPPING | STRUCTURAL_CONSTRAINT | VALIDATION | NAMING_CONVENTION | PROMPT_INJECTION`
`RuleScope`: `ORG | WORKFLOW`
`Rule`: `{ id, name, type, scope, agent_target, instruction, priority, is_active, version, created_at, updated_at? }`

### 4.9 Skills — `skills.api.ts`

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/skills` | 🔒 | query: `type` (required per spec), `isActive` (required per spec) | `SkillsListResponse` |
| POST | `/skills` | 🔒 | `CreateSkillDto` | 201 |
| GET | `/skills/{id}` | 🔒 | — | `Skill` (with usage stats) |
| PATCH | `/skills/{id}` | 🔒 | `UpdateSkillDto` | `Skill` |
| DELETE | `/skills/{id}` | 🔒 | — | 204, soft delete |
| POST | `/skills/search` | 🔒 | `SemanticSearchDto`: `{ queryText, topK?=5, filterTypes?, minSimilarity?=0.35 }` | `SkillSearchResponse` (201) |
| POST | `/skills/import` | 🔒 | `ImportSkillsDto`: `{ skills: CreateSkillDto[] }` | `SkillsImportResponse` (201) |
| GET | `/skills/export` | 🔒 | — | all active skills |
| GET | `/skills/{id}/applications` | 🔒 | query: `page` (required), `limit` (required) | `SkillApplicationsResponse` |

`CreateSkillDto`: `{ name (≤256), description?, skillType: SkillType, content, appliesToDomains?: string[], appliesToAgents?: AgentType[], isMandatory? }`
`SkillType`: `VOCABULARY | ARCHETYPE | FEW_SHOT_EXAMPLE | DOMAIN_KNOWLEDGE | ACTOR_CATALOG | PROMPT_TEMPLATE`
`AgentType` (for `appliesToAgents`): `ORCHESTRATOR | INTAKE | EXTRACTION | PATTERN | GAP_DETECTION | QA | VALIDATION | EXPORT | DIVERGENCE | RULES_SKILLS_LOADER`

**Mismatch:** frontend's `SkillType` (`ACTOR_CATALOG | DOMAIN_VOCABULARY | PROCESS_ARCHETYPE | FEW_SHOT_EXAMPLE | STRUCTURAL_TEMPLATE`, in `types.ts`) uses **different enum values** than the backend's `skillType` (`VOCABULARY | ARCHETYPE | FEW_SHOT_EXAMPLE | DOMAIN_KNOWLEDGE | ACTOR_CATALOG | PROMPT_TEMPLATE`). `createSkill()`/`patchSkill()` in `skills.api.ts` pass whichever string the caller gives them straight through — **this needs reconciling before skills CRUD is wired to real UI**, or every write will send a value the backend enum doesn't accept.

Also see [§7.4](#74-skill-activatedeactivate-not-in-the-spec) for `activate`/`deactivate`.

### 4.10 Admin Skills — `adminSkills.api.ts`

| Method | Path | Auth | Response |
|---|---|---|---|
| GET | `/admin/skills/analytics` | 🔒 | `AdminSkillAnalyticsResponse` — Admin only |

### 4.11 Agent Executions — `agentExecutions.api.ts`

| Method | Path | Auth | Response |
|---|---|---|---|
| GET | `/agent-executions/{id}/rules` | 🔒 | `AgentRulesResponse` |
| GET | `/agent-executions/{id}/skills` | 🔒 | `AgentSkillsResponse` (`UsedSkill[]`, similarity + tokens injected) |

### 4.12 Organizations — `organizations.api.ts`

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| POST | `/org/invite` | 🔒 | `{ email, role?: OrganizationRole = "viewer" }` | 201, pending invite created |
| PATCH | `/org/users/{id}/role` | 🔒 | `{ role: OrganizationRole }` | user role updated |
| DELETE | `/org/users/{id}` | 🔒 | — | user access revoked |

`OrganizationRole`: `admin | process_owner | business_analyst | reviewer | viewer`

### 4.13 Auth — `auth.api.ts`

Not in the OpenAPI spec at all — see [§7.1](#71-auth-module-not-in-the-backend-openapi-spec) (critical).

### 4.14 Projects — `projects.api.ts`

Not in the OpenAPI spec at all — see [§7.5](#75-projects-module-missing-entirely).

## 5. Realtime (Socket.IO)

`src/lib/realtime/socket.ts` connects a single shared socket to `{VITE_API_BASE_URL}` (not `/api` — Socket.IO's own namespace/path, `withCredentials: true`, auth payload `{ token }` using the same Bearer token as REST).

**Client → server:**
| Event | Payload | Purpose |
|---|---|---|
| `joinRoom` | `{ room: string }` | Subscribe to a room (see room helpers below) |
| `leaveRoom` | `{ room: string }` | Unsubscribe |

Room name helpers (`WS_ROOMS`): `session:{sessionId}`, `workflow:{workflowId}`, `pipeline:{pipelineExecutionId}`.

**Server → client** (event names in `WS_EVENTS`):
| Event | Payload shape | Notes |
|---|---|---|
| `pipeline.progress` | `{ session_id, pipeline_execution_id, agent_type, agent_name, status, order_index, progress_pct, confidence_output? }` | |
| `agent.log` | *(not yet typed on frontend)* | |
| `agent.status` | *(not yet typed on frontend)* | |
| `workflow.updated` | `{ workflow_id, version_number, changed_elements: { element_id, change_type: "added"\|"removed"\|"modified" }[], source, correlation_id }` | |
| `session.state` | *(not yet typed on frontend)* | |
| `session.needs_reconciliation` | *(not yet typed on frontend)* | |
| `session.finalized` | `{ session_id, workflow_id, final_version_number, final_confidence }` | |
| `document.ready` | `{ document_id, extracted_text_preview, confidence }` | |

The frontend code comment states these are "mirrored by hand from `ppp-backend/src/modules/realtime/constants/ws-events.constants.ts` and `.../interfaces/ws-payloads.interface.ts`" — **that backend repo isn't part of this checkout**, so this event catalog could already be stale. Confirm against the actual backend source before relying on it, and consider generating/sharing these types instead of hand-mirroring.

`useWorkspaceRealtime` (`src/lib/realtime/useWorkspaceRealtime.ts`) falls back to polling every 5s when the socket isn't connected — REST GETs remain the source of truth even when realtime works.

## 6. File upload constraints (client-enforced, not backend-declared)

From `src/features/workspace/sourceUpload.ts`, mapped to the OpenAPI's `AllowedMimeType` list in `src/lib/api/types.ts`:

`text/plain, text/markdown, application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document (docx), image/png, image/jpeg, image/webp, audio/mpeg, audio/wav, audio/x-m4a`

The OpenAPI spec doesn't declare a max file size or MIME allow-list on `/documents/upload` — the cahier des charges (§2.1) says limits are per-workspace `storage_bytes` quota, not per-file, enforced server-side. Confirm the backend actually validates MIME type / size; the frontend's own gate is a UX nicety, not a security boundary (per `.claude/rules/security.md`: "traiter les fichiers uploadés comme non fiables").

## 7. Contract gaps (read this before integrating)

Endpoints the frontend calls that **do not appear anywhere in `docs/collection.json`**. Either the backend needs these routes built, or the OpenAPI export is stale and they already exist but weren't captured — confirm which before assuming either.

### 7.1 Auth module not in the backend OpenAPI spec

`auth.api.ts` calls `POST /auth/login`, `POST /auth/register`, `POST /auth/logout`. **None of these exist in the spec.** Nothing else in this app works without them — this is the first thing to reconcile with the backend team, together with the cookie-vs-Bearer decision in [§2](#2-authentication).

### 7.2 Sessions-by-workflow lookup missing

`sessions.api.ts` calls `GET /sessions/workflow/{workflowId}` (`getSessionByWorkflowId`) to find/resume the latest session for a workflow — used by `library.tsx` when opening a saved brand. Not in the spec. Without it, "open a workflow from the Library" has no way to find its session (the frontend currently falls back to `createSession()` on a 404, which will spawn duplicate sessions if this route doesn't exist server-side rather than genuinely 404ing).

### 7.3 Sharing module missing entirely

`shares.api.ts` calls `POST /workflows/{id}/share` → `{ token, url, expiresAt?, maxViews? }`. Not in the spec. Cahier des charges §2.8 requires invite-only sharing (no public links) via `shared.$token` route — that route already exists in the frontend (`src/routes/shared.$token.tsx`) but has nothing to consume without this endpoint.

### 7.4 Skill activate/deactivate not in the spec

`skills.api.ts` calls `POST /skills/{id}/activate` and `POST /skills/{id}/deactivate` (mirroring the pattern that *does* exist for rules: `/rules/{id}/activate`, `/rules/{id}/deactivate`). Not in the skills section of the spec — likely just needs the same pattern added server-side, or skills toggle active state through `PATCH /skills/{id}` with `{ isActive }` instead (that field does exist on `UpdateSkillDto`). Recommend backend either adds the two routes or the frontend switches to the PATCH.

### 7.5 Projects module missing entirely

`projects.api.ts` calls `GET/POST /projects`, `GET /projects/{id}`, `GET /projects/{id}/workflows`, `DELETE /projects/{id}`. **None of this exists in the spec** — no `projects` tag, no `Project` schema. This is load-bearing: `dashboard.tsx` and `brand-dna.tsx` both list/create projects as their primary UI, and `CreateWorkflowBody` requires a `projectId`. Either:
- the backend has an org→**workspace**→source hierarchy per the cahier (§2.1, §10.2) and "project" is the frontend's name for what the backend calls something else (workspace?) — reconcile naming, or
- projects genuinely don't exist yet server-side and need building before workflow creation can work end-to-end.

### 7.6 Response envelope mismatch: paginated messages

Covered in [§4.3](#43-messages--messagesapits) — backend's `PaginatedMessagesDto.items` vs frontend's expected `PaginatedResponse.data`. Low effort, high impact (breaks chat history silently) — verify first.

### 7.7 Skill type enum mismatch

Covered in [§4.9](#49-skills--skillsapits) — frontend and backend `SkillType` enums don't share the same string values.

## 8. Suggested integration order

Given the gaps above, wiring this frontend to a real backend in one sitting should go:

1. **Auth** (§7.1) — nothing else is reachable without it. Settle cookie vs. Bearer first.
2. **Projects** (§7.5) — dashboard and brand-dna are unusable without it.
3. Verify the **paginated-messages envelope** (§7.6) and **skill enum** (§7.7) mismatches — cheap to fix, easy to miss.
4. **Sessions-by-workflow** (§7.2) and **Sharing** (§7.3) — needed for Library → resume-session and the `shared.$token` view respectively, but the rest of the app functions without them.
5. Everything else in [§4](#4-rest-endpoints) already has a 1:1 backend route per the OpenAPI spec.
