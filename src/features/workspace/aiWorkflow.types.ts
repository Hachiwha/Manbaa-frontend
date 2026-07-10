/**
 * Shape of the AI workflow JSON (subset used for React Flow; full payload may include more fields).
 */
export interface AiWorkflowActor {
  id: string;
  name: string;
  role: string;
  description?: string;
}

export interface AiWorkflowTask {
  id: string;
  name: string;
  description?: string;
  actor_id: string;
  type: string;
}

export interface AiWorkflowDecisionCondition {
  label: string;
  target_id: string;
}

export interface AiWorkflowDecision {
  id: string;
  question: string;
  conditions: AiWorkflowDecisionCondition[];
}

export interface AiWorkflowDataObject {
  id: string;
  name: string;
  type: string;
}

export interface AiWorkflowBusinessRule {
  id: string;
  description: string;
  applies_to?: string;
}

export interface AiWorkflowEntities {
  actors: AiWorkflowActor[];
  tasks: AiWorkflowTask[];
  decisions: AiWorkflowDecision[];
  data_objects?: AiWorkflowDataObject[];
  business_rules?: AiWorkflowBusinessRule[];
}

export interface AiWorkflowConnection {
  from_id: string;
  to_id: string;
  condition?: string | null;
}

export interface AiWorkflowParallelBranch {
  fork_after: string;
  branches: string[][];
  join_before: string;
}

export interface AiWorkflowFlow {
  start_event: string;
  end_events: string[];
  connections: AiWorkflowConnection[];
  parallel_branches?: AiWorkflowParallelBranch[];
}

export interface AiWorkflowContext {
  summary?: string;
  domain?: string;
  objective?: string;
  stakeholders?: string[];
  language?: string;
}

export interface AiWorkflowResponse {
  success?: boolean;
  steps_completed?: string[];
  errors?: unknown[];
  context?: AiWorkflowContext;
  entities: AiWorkflowEntities;
  flow: AiWorkflowFlow;
  elsa_workflow?: unknown;
  mermaid_diagram?: string;
}
