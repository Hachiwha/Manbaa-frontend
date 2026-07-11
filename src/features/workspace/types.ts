import type { Node, Edge } from "reactflow";

export type SourceType = "pdf" | "image" | "text" | "doc" | "audio";
export interface WorkspaceSource {
  id: string;
  name: string;
  type: SourceType;
  size: string;
  status: "ready" | "preprocessing" | "uploading" | "failed";
  included: boolean;
}

export type ChatRole = "ai" | "user" | "system";
export type ChatKind =
  | "text"
  | "summary" // AI step list
  | "update" // AI text + confidence badge
  | "status" // system note
  | "node-attachment"; // node attachment
export interface ChatMessage {
  id: string;
  role: ChatRole;
  kind: ChatKind;
  content?: string;
  steps?: { label: string; status: "done" | "running" | "pending" }[];
  confidence?: number; // 0..1
  timestamp: string;
  nodeAttachment?: FlowNode;
}

export interface VersionEntry {
  id: string;
  label: string;
  timestamp: string;
  active?: boolean;
}

export interface FlowStepData {
  title: string;
  subtitle: string;
  icon: string; // lucide icon name key
  confidence?: number; // 0..1
  active?: boolean;
  inferred?: boolean;
  subItems?: string[];
}

/** Data for AI-generated React Flow nodes (`mapAiWorkflowToFlow`). */
export type RfFlowNodeKind =
  | "rfStart"
  | "rfEnd"
  | "rfTask"
  | "rfDecision"
  | "rfStub";

export interface RfFlowNodeData {
  kind: RfFlowNodeKind;
  title: string;
  subtitle: string;
  question?: string;
  actor?: string;
  taskType?: string;
  variant?: "start" | "end" | "stub" | "taskHuman" | "taskSystem" | "decision";
  outcomeHandles?: { id: string; label: string }[];
}

export function isRfFlowNodeData(
  data: FlowStepData | RfFlowNodeData,
): data is RfFlowNodeData {
  return (
    "kind" in data &&
    typeof (data as RfFlowNodeData).kind === "string" &&
    (data as RfFlowNodeData).kind.startsWith("rf")
  );
}

export type FlowNode = Node<FlowStepData | RfFlowNodeData>;
export type FlowEdge = Edge;
