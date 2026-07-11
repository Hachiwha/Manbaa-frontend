/**
 * DTOs aligned with `docs/apiDocumentation.md` (naming: backend snake_case).
 */

/* ---------- Globals ---------- */

export type UUID = string;
export type ISODate = string;
export type PresignedURL = string;

export interface PaginatedResponse<T> {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
  total?: number;
}

/* ---------- Module 3 — Documents ---------- */

export type SourceType =
  | "procedure_manual"
  | "interview_transcript"
  | "email"
  | "sketch"
  | "other";

export type PreprocessingStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";

export type AllowedMimeType =
  | "text/plain"
  | "text/markdown"
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "audio/mpeg"
  | "audio/wav"
  | "audio/x-m4a";

export interface Document {
  id: UUID;
  filename: string;
  file_type: AllowedMimeType;
  storage_url: PresignedURL;
  source_type: SourceType;
  doc_version: number;
  preprocessing_status: PreprocessingStatus;
  preprocessing_confidence?: number;
  session_id: UUID;
  workflow_id?: UUID;
  created_at: ISODate;
}

export interface DocumentListItem {
  id: UUID;
  filename: string;
  file_type: AllowedMimeType;
  doc_version: number;
  preprocessing_status: PreprocessingStatus;
  session_id: UUID;
  created_at: ISODate;
}

export interface ReprocessResponse {
  document_id: UUID;
  message: string;
  new_doc_version: number;
  preprocessing_status: "PENDING";
}

/** OpenAPI `DocumentResponseDto` shape (camelCase). */
export interface DocumentResponseDto {
  id: UUID;
  workflowId: UUID;
  sessionId: UUID;
  filename: string;
  fileType: string;
  storageUrl: PresignedURL;
  fileSizeBytes: number;
  docVersion: number;
  presignedUrl?: PresignedURL;
  createdAt: ISODate;
  deletedAt?: ISODate | null;
}

export interface DocumentExtractedText {
  documentId: UUID;
  docVersion: number;
  extractedText?: string;
  preprocessingConfidence?: number;
}

export interface UpdateExtractedTextBody {
  extractedText: string;
}

/* ---------- Module 4 — Messages & Sessions ---------- */

export type MessageRole = "user" | "ai" | "system";

export type MessageType =
  | "user_input"
  | "ai_question"
  | "ai_response"
  | "ai_summary"
  | "ai_update"
  | "ai_confidence_report"
  | "system_note"
  | "system_status";

export type SessionMode = "auto" | "interactive";

export type SessionStatus =
  | "CREATED"
  | "AWAITING_INPUT"
  | "PROCESSING"
  | "IN_ELICITATION"
  | "DRAFT_READY"
  | "IN_REVIEW"
  | "VALIDATED"
  | "EXPORTED"
  | "NEEDS_RECONCILIATION";

export type PipelineAgent =
  | "EXTRACTION"
  | "PATTERN"
  | "VALIDATION"
  | "RECONCILIATION";

export interface MessageMetadata {
  confidence_score?: number;
  targeted_element_id?: string;
  diff?: {
    added: unknown[];
    modified: unknown[];
    removed: unknown[];
  };
}

export interface Message {
  id: UUID;
  session_id: UUID;
  role: MessageRole;
  type: MessageType;
  content: string;
  metadata: MessageMetadata;
  created_at: ISODate;
}

export interface Session {
  id: UUID;
  workflow_id: UUID;
  user_id: UUID;
  mode: SessionMode;
  status: SessionStatus;
  confidence_score: number;
  created_at: ISODate;
  finalized_at: ISODate | null;
}

export interface SessionWorkflowState {
  session_id: UUID;
  workflow_id: UUID;
  version_number: number;
  /** Backend-defined structure (Module 6). */
  elements_json: WorkflowElements;
  confidence_score: number;
}

export interface PipelineProgress {
  session_id: UUID;
  pipeline_execution_id: UUID;
  current_agent: PipelineAgent;
  progress_pct: number;
  overall_confidence: number;
  status: "RUNNING" | "DONE" | "FAILED";
}

/* ---------- Module 6 — Workflows ---------- */

export type WorkflowStatus =
  | "DRAFT"
  | "IN_ELICITATION"
  | "PENDING_REVIEW"
  | "VALIDATED"
  | "EXPORTED"
  | "ARCHIVED";

export interface WorkflowElements {
  actors: unknown[];
  tasks: unknown[];
  decisions: unknown[];
  rules: unknown[];
  sequences: unknown[];
}

export interface ReactFlowNodeData {
  label: string;
  subtitle: string;
  actor: string;
  confidence_score: number;
  is_inferred: boolean;
  source_document_id?: UUID;
  ai_reasoning?: string;
  sub_processes: Array<{ id: string; label: string }>;
}

export interface ReactFlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: ReactFlowNodeData;
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  data: {
    condition: string | null;
    is_inferred: boolean;
  };
}

export interface DiagramData {
  workflow_id: UUID;
  version_number: number;
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
}

export interface Workflow {
  id: UUID;
  title: string;
  description: string;
  status: WorkflowStatus;
  current_version: number;
  confidence_score: number | null;
  divergence_similarity?: number;
  domain: string;
  tags: string[];
  org_id: UUID;
  owner_id: UUID;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface WorkflowListItem {
  id: UUID;
  title: string;
  status: WorkflowStatus;
  current_version: number;
  confidence_score: number | null;
  domain: string;
  tags: string[];
  owner_id: UUID;
  updated_at: ISODate;
}

export interface WorkflowVersion {
  id: UUID;
  workflow_id: UUID;
  version_number: number;
  confidence_score: number;
  created_by: UUID;
  created_at: ISODate;
}

export interface WorkflowVersionDetail extends WorkflowVersion {
  elements_json: WorkflowElements;
  elsa_json: unknown;
}

export interface WorkflowDiff {
  workflow_id: UUID;
  version_a: number;
  version_b: number;
  diff: {
    added: Array<{ element_id: string; type: string; label: string }>;
    removed: Array<{ element_id: string; type: string; label: string }>;
    modified: Array<{
      element_id: string;
      type: string;
      changes: Record<string, { before: unknown; after: unknown }>;
    }>;
  };
}

export interface DecisionLogEntry {
  id: UUID;
  event_type: string;
  description: string;
  element_id: string | null;
  actor_type: "ai_agent" | "user";
  actor_name: string;
  created_at: ISODate;
}

export interface VersionsResponse {
  data: WorkflowVersion[];
}

export interface DuplicateResponse {
  id: UUID;
  title: string;
  status: "DRAFT";
  current_version: number;
  created_at: ISODate;
}

export interface DecisionLogResponse {
  data: DecisionLogEntry[];
}

/* ---------- Module 7 — Comments & Review ---------- */

export type CommentType =
  | "question"
  | "correction"
  | "approval"
  | "suggestion"
  | "escalation";

export interface CommentAuthor {
  id: UUID;
  name: string;
}

export interface CommentReply {
  id: UUID;
  content: string;
  author: CommentAuthor;
  created_at: ISODate;
}

export interface Comment {
  id: UUID;
  workflow_id: UUID;
  element_id: string | null;
  author_id: UUID;
  author?: CommentAuthor;
  type: CommentType;
  content: string;
  resolved: boolean;
  resolved_at: ISODate | null;
  resolved_by: UUID | null;
  resolution_note?: string;
  parent_id: UUID | null;
  injected_to_ai: boolean;
  replies?: CommentReply[];
  created_at: ISODate;
}

export interface ReviewProgress {
  approved_count: number;
  total_count: number;
  completion_pct: number;
}

export interface ElementApprovalResponse {
  element_id: string;
  approved: boolean;
  approved_by: UUID;
  approved_at: ISODate;
  review_progress: ReviewProgress;
}

export interface FullReviewProgress extends ReviewProgress {
  workflow_id: UUID;
  unapproved_elements: string[];
}

export interface CommentsListResponse {
  data: Comment[];
}

export interface ResolveResponse {
  id: UUID;
  resolved: true;
  resolved_at: ISODate;
  resolved_by: UUID;
  resolution_note: string;
}

export interface InjectCommentToAiBody {
  message?: string;
}

export interface AssignCommentBody {
  assignee_id?: UUID;
  assigneeId?: UUID;
}

export interface AssignedCommentsQuery {
  resolved?: boolean;
}

export interface AssignedCommentsResponse {
  data?: Comment[];
  items?: Comment[];
  next_cursor?: string | null;
}

export interface ApproveAllElementsResponse {
  workflow_id?: UUID;
  approved_count?: number;
  total_count?: number;
  completion_pct?: number;
}

/* ---------- Organizations ---------- */

export type OrganizationRole =
  | "admin"
  | "process_owner"
  | "business_analyst"
  | "reviewer"
  | "viewer";

export interface InviteUserBody {
  email: string;
  role?: OrganizationRole;
}

export interface UpdateUserRoleBody {
  role: OrganizationRole;
}

export interface OrganizationMutationResponse {
  message?: string;
}

/* ---------- Module 12 — Rules ---------- */

export type RuleType =
  | "EXTRACTION"
  | "ACTOR_MAPPING"
  | "STRUCTURAL_CONSTRAINT"
  | "VALIDATION"
  | "NAMING_CONVENTION"
  | "PROMPT_INJECTION";

export type RuleScope = "ORG" | "WORKFLOW";

export interface Rule {
  id: UUID;
  name: string;
  type: RuleType;
  scope: RuleScope;
  agent_target: string;
  instruction: string;
  priority: number;
  is_active: boolean;
  version: number;
  created_at: ISODate;
  updated_at?: ISODate;
}

export interface MatchingRule {
  id: UUID;
  name: string;
  type: RuleType;
  instruction: string;
  match_reason: string;
}

export interface RuleConflictError {
  statusCode: 409;
  error: "Conflict";
  message: string;
  conflicting_rule: { id: UUID; name: string };
}

export interface RulesListResponse {
  data: Rule[];
}

export interface RulesPreviewResponse {
  matching_rules: MatchingRule[];
}

export interface RulesImportResponse {
  imported_count: number;
}

export interface TestRuleBody {
  input?: string;
  input_text?: string;
  context?: Record<string, unknown>;
}

export interface TestRuleResponse {
  valid?: boolean;
  score?: number;
  details?: unknown;
}

export interface PreviewSessionRulesResponse {
  matching_rules?: MatchingRule[];
  data?: Rule[];
}

/* ---------- Module 13 — Skills ---------- */

export type SkillType =
  | "ACTOR_CATALOG"
  | "DOMAIN_VOCABULARY"
  | "PROCESS_ARCHETYPE"
  | "FEW_SHOT_EXAMPLE"
  | "STRUCTURAL_TEMPLATE";

export type EmbeddingStatus = "GENERATING" | "READY" | "FAILED";

export interface Skill {
  id: UUID;
  name: string;
  type: SkillType;
  content: string;
  domain?: string;
  is_active: boolean;
  is_mandatory: boolean;
  embedding_status: EmbeddingStatus;
  application_count?: number;
  avg_similarity_score?: number;
  avg_confidence_delta?: number;
  created_at: ISODate;
}

export interface SkillSearchResult {
  id: UUID;
  name: string;
  type: SkillType;
  similarity_score: number;
  content_preview: string;
}

export interface SkillApplication {
  id: UUID;
  agent_execution_id: UUID;
  similarity_score: number;
  tokens_injected: number;
  created_at: ISODate;
}

export interface SkillsListResponse {
  data: Skill[];
}

export interface SkillSearchResponse {
  results: SkillSearchResult[];
}

export interface SkillApplicationsResponse {
  data: SkillApplication[];
}

export interface AdminSkillAnalytics {
  total_skills?: number;
  active_skills?: number;
  mandatory_skills?: number;
  by_type?: Record<string, number>;
  by_domain?: Record<string, number>;
}

export interface AdminSkillAnalyticsResponse {
  data?: AdminSkillAnalytics;
}

export interface SkillsImportResponse {
  imported_count: number;
  embedding_status: "GENERATING";
}

/* ---------- Agent Executions + shared RuleType ref ---------- */

export interface AppliedRule {
  rule_id: UUID;
  rule_name: string;
  rule_type: RuleType;
  triggered: boolean;
  change_summary: string;
}

export interface UsedSkill {
  skill_id: UUID;
  skill_name: string;
  skill_type: SkillType;
  similarity_score: number;
  tokens_injected: number;
}

export interface AgentRulesResponse {
  data: AppliedRule[];
}

export interface AgentSkillsResponse {
  data: UsedSkill[];
}

/* ---------- Bodies (requests) — grouped for services ---------- */

export type CreateSessionBody =
  | {
      workflowId: UUID;
      mode: SessionMode;
    }
  | {
      workflow_id: UUID;
      mode: SessionMode;
    };

export interface PatchSessionModeBody {
  mode: SessionMode;
}

export interface FinalizeResponse {
  id: UUID;
  status: "DRAFT_READY";
  finalized_at: ISODate;
}

export interface PatchModeResponse {
  id: UUID;
  mode: SessionMode;
  status: SessionStatus;
}

export interface ListSessionMessagesQuery {
  cursor?: string;
  limit?: number;
  /** Server accepts `MessageType` value; sent as string in query. */
  type?: MessageType;
  search?: string;
}

export interface CreateMessageBody {
  role: MessageRole;
  type: MessageType;
  content: string;
  metadata?: Record<string, unknown>;
}

export type SessionOverrideStatus =
  | "created"
  | "awaiting_input"
  | "processing"
  | "draft_ready"
  | "needs_reconciliation"
  | "in_elicitation"
  | "in_review"
  | "validated"
  | "exported"
  | "archived"
  | "error";

export interface UpdateSessionStatusBody {
  status: SessionOverrideStatus;
  reason: string;
  force?: boolean;
}

export interface SessionStatusOverrideResponse {
  id?: UUID;
  status: SessionStatus | SessionOverrideStatus;
  reason?: string;
  updated_at?: ISODate;
}

export interface CreateWorkflowBody {
  projectId: string;
  title: string;
  description?: string;
  domain?: string;
  tags?: string[];
}

export type PatchWorkflowBody = Partial<
  Pick<Workflow, "title" | "description" | "domain" | "tags">
>;

export interface CreateCommentBody {
  type: CommentType;
  content: string;
  element_id: string | null;
}

export interface ListCommentsQuery {
  resolved?: boolean;
  type?: CommentType;
  element_id?: string;
}

export interface PatchCommentBody {
  content: string;
}

export interface CreateReplyBody {
  content: string;
}

export interface ResolveCommentBody {
  resolution_note: string;
}

export interface CreateRuleBody {
  name: string;
  type: RuleType;
  scope: RuleScope;
  agent_target: string;
  instruction: string;
  priority: number;
}

export type PatchRuleBody = Partial<
  Pick<Rule, "instruction" | "priority" | "name">
>;

export interface RulesPreviewBody {
  session_id: UUID;
  agent_type: string;
}

export interface ListRulesQuery {
  type?: RuleType;
  scope?: RuleScope;
  agent_type?: string;
  is_active?: boolean;
}

export interface CreateSkillBody {
  name: string;
  type: SkillType;
  skillType?: string;
  description?: string;
  content: string;
  domain?: string;
  appliesToDomains?: string[];
  appliesToAgents?: string[];
  isMandatory?: boolean;
}

export interface PatchSkillBody {
  content?: string;
  name?: string;
  description?: string;
  skillType?: string;
  appliesToDomains?: string[];
  appliesToAgents?: string[];
  isMandatory?: boolean;
  isActive?: boolean;
}

export interface SkillSearchBody {
  query?: string;
  top_k?: number;
  queryText?: string;
  topK?: number;
  filterTypes?: string[];
  minSimilarity?: number;
}

export interface ListWorkflowsQuery {
  q?: string;
  status?: WorkflowStatus;
  domain?: string;
  tags?: string;
  projectId?: string;
  search?: string;
  min_similarity?: number;
  cursor?: string;
  limit?: number;
}

export interface ListSkillsQuery {
  type?: SkillType;
  is_active?: boolean;
  isActive?: boolean;
}

export interface ListSkillApplicationsQuery {
  page?: number;
  limit?: number;
}

export interface ListWorkflowAuditLogQuery {
  type?: string;
  from?: string;
  to?: string;
  actor_id?: string;
}

export interface ExportAuditLogQuery {
  format: "csv" | "pdf";
  type?: string;
  from?: string;
  to?: string;
  actor_id?: string;
}

export type WorkflowExportFormat = "elsa" | "bpmn" | "pdf";

export interface ExportWorkflowResponse {
  id?: UUID;
  status?: string;
  message?: string;
}

export interface CreateWorkflowVersionBody {
  note?: string;
  message?: string;
}

export interface WorkflowAuditLogEntry {
  id?: UUID;
  event_type?: string;
  eventType?: string;
  description?: string;
  actor_type?: string;
  actorType?: string;
  actor_name?: string;
  actorName?: string;
  created_at?: ISODate;
  createdAt?: ISODate;
}

export interface WorkflowAuditLogResponse {
  data?: WorkflowAuditLogEntry[];
}

export interface ActiveToggleResponse {
  id: UUID;
  is_active: boolean;
}
