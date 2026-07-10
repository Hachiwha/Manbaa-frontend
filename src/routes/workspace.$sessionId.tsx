import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/shell/TopBar";
import { SourcesPanel } from "@/features/workspace/components/SourcesPanel";
import { ChatPanel } from "@/features/workspace/components/ChatPanel";
import { WorkflowPreview } from "@/features/workspace/components/WorkflowPreview";
import {
  getSession,
  getSessionWorkflowState,
  getSessionProgress,
  listWorkflowDocuments,
  listSessionMessages,
  getWorkflowDiagramData,
  getWorkflow,
} from "@/lib/api";
import {
  MOCK_VERSIONS,
} from "@/features/workspace/mock-data";
import { mapAiWorkflowToReactFlow } from "@/features/workspace/mapAiWorkflowToFlow";
import type { AiWorkflowResponse } from "@/features/workspace/aiWorkflow.types";
import type { FlowNode, FlowEdge, ChatMessage, WorkspaceSource, VersionEntry } from "@/features/workspace/types";

export const Route = createFileRoute("/workspace/$sessionId")({
  component: WorkspacePage,
});

function WorkspacePage() {
  const { sessionId } = Route.useParams();
  const [selectedNodeForChat, setSelectedNodeForChat] = useState<FlowNode | null>(null);

  const { data: sessionData } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => getSession(sessionId),
    enabled: !!sessionId,
    refetchInterval: 10000,
  });

  const workflowId = sessionData?.workflow_id;

  const { data: workflowData } = useQuery({
    queryKey: ["workflow", workflowId],
    queryFn: () => workflowId ? getWorkflow(workflowId) : Promise.resolve(null),
    enabled: !!workflowId,
  });

  const { data: diagramData } = useQuery({
    queryKey: ["workflow-diagram", workflowId],
    queryFn: () => workflowId ? getWorkflowDiagramData(workflowId) : Promise.resolve(null),
    enabled: !!workflowId,
  });

  const { data: progressData } = useQuery({
    queryKey: ["session-progress", sessionId],
    queryFn: () => getSessionProgress(sessionId),
    enabled: !!sessionId,
    refetchInterval: 5000,
  });

  const { data: workflowStateData } = useQuery({
    queryKey: ["session-workflow-state", sessionId],
    queryFn: () => getSessionWorkflowState(sessionId),
    enabled: !!sessionId,
    refetchInterval: 5000,
  });

  const { data: messagesData } = useQuery({
    queryKey: ["session-messages", sessionId],
    queryFn: () => listSessionMessages(sessionId),
    enabled: !!sessionId,
    refetchInterval: 3000,
  });

  const { data: documentsData } = useQuery({
    queryKey: ["workflow-documents", workflowId],
    queryFn: () => workflowId ? listWorkflowDocuments(workflowId) : Promise.resolve([]),
    enabled: !!workflowId,
  });

  const sources: WorkspaceSource[] = useMemo(() => 
    (documentsData ?? []).map((doc) => ({
      id: doc.id,
      name: doc.filename,
      type: doc.fileType?.includes("pdf") ? "pdf" 
        : doc.fileType?.includes("image") ? "image"
        : doc.fileType?.includes("word") ? "doc"
        : "text" as const,
      size: formatFileSize(doc.fileSizeBytes),
      status: "ready" as const,
      included: true,
    })),
    [documentsData]
  );

  const versions: VersionEntry[] = useMemo(() => {
    if (workflowStateData?.version_number) {
      return [
        { 
          id: `v_${workflowStateData.version_number}`, 
          label: `Version ${workflowStateData.version_number}`, 
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), 
          active: true 
        },
        ...MOCK_VERSIONS.slice(0, 4).map((v) => ({ ...v, active: false })),
      ];
    }
    return MOCK_VERSIONS;
  }, [workflowStateData?.version_number]);

  const messages: ChatMessage[] = useMemo(() => 
    (messagesData?.data ?? []).map((msg) => ({
      id: msg.id,
      role: msg.role,
      kind: msg.type === "user_input" ? "text" 
        : msg.type === "ai_summary" ? "summary"
        : msg.type === "ai_update" ? "update"
        : msg.type === "system_status" ? "status"
        : "text" as const,
      content: msg.content,
      timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ...(msg.metadata?.confidence_score ? { confidence: msg.metadata.confidence_score } : {}),
    })),
    [messagesData]
  );

  const workflowTitle = workflowData?.title ?? "Untitled Workflow";
  const sessionMode = (sessionData?.mode === "auto" ? "AUTO" : "INTERACTIVE") as "AUTO" | "INTERACTIVE";

  // Convert real workflow-state elementsJson into React Flow nodes/edges
  const { flowNodes, flowEdges, aiResponse } = useMemo(() => {
    // @ts-ignore - The API returns elementsJson, but types.ts has elements_json
    const elementsJson = (workflowStateData?.elementsJson || workflowStateData?.elements_json) as unknown as AiWorkflowResponse | null;
    if (elementsJson?.entities && elementsJson?.flow) {
      try {
        const { nodes: rfNodes, edges: rfEdges } = mapAiWorkflowToReactFlow(elementsJson);
        return {
          flowNodes: rfNodes as unknown as FlowNode[],
          flowEdges: rfEdges as unknown as FlowEdge[],
          aiResponse: elementsJson,
        };
      } catch (e) {
        console.warn("Failed to map workflow state to React Flow:", e);
      }
    }
    // Fallback to diagram data
    return {
      flowNodes: (diagramData?.nodes ?? []) as unknown as FlowNode[],
      flowEdges: (diagramData?.edges ?? []) as unknown as FlowEdge[],
      aiResponse: undefined,
    };
  }, [workflowStateData, diagramData]);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <TopBar searchPlaceholder="Search this session…" />
      <div className="flex min-h-0 flex-1">
        <SourcesPanel sources={sources} versions={versions} />
        <ChatPanel 
          messages={messages} 
          workflowTitle={workflowTitle} 
          mode={sessionMode} 
          sessionId={sessionId} 
          selectedNodeForChat={selectedNodeForChat}
          onClearSelectedNode={() => setSelectedNodeForChat(null)}
        />
        <WorkflowPreview 
          nodes={flowNodes}
          edges={flowEdges}
          workflowData={aiResponse}
          workflowId={workflowId}
          onChooseNodeInChat={setSelectedNodeForChat}
        />
      </div>
    </div>
  );
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let unitIndex = 0;
  let size = bytes;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
