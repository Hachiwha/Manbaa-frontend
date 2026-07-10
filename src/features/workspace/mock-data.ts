import type { ChatMessage, FlowEdge, FlowNode, VersionEntry, WorkspaceSource } from "./types";
import { mapAiWorkflowToReactFlow } from "./mapAiWorkflowToFlow";
import { ACTIVE_AI_WORKFLOW_MOCK, AI_WORKFLOW_MOCKS } from "./mocks/registry";

export { ACTIVE_AI_WORKFLOW_MOCK, AI_WORKFLOW_MOCKS } from "./mocks/registry";

export const MOCK_SOURCES: WorkspaceSource[] = [
  { id: "src_1", name: "Invoice-spec-v3.pdf", type: "pdf", size: "1.2 MB", status: "ready", included: true },
  { id: "src_2", name: "ERP-fields-mapping.txt", type: "text", size: "12 KB", status: "ready", included: true },
  { id: "src_3", name: "Sample-invoice-scan.png", type: "image", size: "780 KB", status: "ready", included: true },
  { id: "src_4", name: "Approval-policy-2025.pdf", type: "pdf", size: "640 KB", status: "ready", included: false },
  { id: "src_5", name: "Edge-cases.docx", type: "doc", size: "88 KB", status: "preprocessing", included: false },
];

export const MOCK_VERSIONS: VersionEntry[] = [
  { id: "v_24", label: "Version 2.4", timestamp: "Today, 10:45 AM", active: true },
  { id: "v_23", label: "Version 2.3", timestamp: "Today, 09:12 AM" },
  { id: "v_22", label: "Version 2.2", timestamp: "Yesterday, 18:04" },
  { id: "v_21", label: "Version 2.1", timestamp: "Yesterday, 14:30" },
  { id: "v_20", label: "Version 2.0", timestamp: "Apr 21, 11:02" },
];

export const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    role: "ai",
    kind: "summary",
    content:
      "I've drafted the initial pipeline from your sources. Two main steps so far — review and tell me what to adjust.",
    steps: [
      { label: "Step 1 · Source ingestion", status: "done" },
      { label: "Step 2 · Vectorization engine", status: "done" },
      { label: "Step 3 · Field extraction", status: "running" },
      { label: "Step 4 · ERP mapping", status: "pending" },
    ],
    timestamp: "10:42 AM",
  },
  {
    id: "m2",
    role: "user",
    kind: "text",
    content:
      "The vectorization step should include a Sanitize & Scrub pass before generating ADA-002 embeddings.",
    timestamp: "10:43 AM",
  },
  {
    id: "m3",
    role: "ai",
    kind: "update",
    content:
      "Done. I've added Sanitize & Scrub as a sub-step inside Vectorization Engine, and re-ran the inference. The diagram on the right is updated.",
    confidence: 0.98,
    timestamp: "10:45 AM",
  },
  {
    id: "m4",
    role: "system",
    kind: "status",
    content: "Pattern Agent running on 3 candidate elements…",
    timestamp: "10:45 AM",
  },
];

/** Active fixture from `mocks/registry.ts` (`ACTIVE_AI_WORKFLOW_MOCK`). */
export const MOCK_AI_WORKFLOW_RESPONSE = AI_WORKFLOW_MOCKS[ACTIVE_AI_WORKFLOW_MOCK];

const mappedAiFlow = mapAiWorkflowToReactFlow(MOCK_AI_WORKFLOW_RESPONSE);

/** React Flow nodes/edges derived from AI JSON (dynamic per payload). */
export const MOCK_NODES: FlowNode[] = mappedAiFlow.nodes as FlowNode[];
export const MOCK_EDGES: FlowEdge[] = mappedAiFlow.edges;
