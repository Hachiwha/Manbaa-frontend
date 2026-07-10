import type { AiWorkflowResponse } from "../aiWorkflow.types";
import sample from "./ai-workflow-sample.json";
import linear from "./ai-workflow-linear.json";

/**
 * Named AI workflow JSON fixtures for local testing.
 * Add new files under `mocks/` and register them here.
 */
export const AI_WORKFLOW_MOCKS = {
  /** Finance sample with human task + binary decision (matches typical AI payload shape). */
  sample: sample as AiWorkflowResponse,
  /** Simple linear chain: human → human → system (good for layout smoke tests). */
  linear: linear as AiWorkflowResponse,
} as const;

export type AiWorkflowMockKey = keyof typeof AI_WORKFLOW_MOCKS;

/**
 * Change this to `'linear' | 'sample'` to swap the diagram used in the workspace mock.
 */
export const ACTIVE_AI_WORKFLOW_MOCK: AiWorkflowMockKey = "sample";
