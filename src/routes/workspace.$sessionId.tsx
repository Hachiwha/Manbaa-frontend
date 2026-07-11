import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/shell/TopBar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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
  patchWorkflow,
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
  const queryClient = useQueryClient();
  const [selectedNodeForChat, setSelectedNodeForChat] = useState<FlowNode | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);

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

  const renameMutation = useMutation({
    mutationFn: (title: string) => {
      if (!workflowId) return Promise.reject(new Error("No workflow to rename"));
      return patchWorkflow(workflowId, { title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow", workflowId] });
    },
  });

  const workflowTitle = workflowData?.title ?? "Untitled brand project";
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
      <TopBar
        variant="workspace"
        workflowId={workflowId}
        projectName={workflowTitle}
        onRenameProject={workflowId ? (title) => renameMutation.mutate(title) : undefined}
        sourcesOpen={sourcesOpen}
        onToggleSources={() => setSourcesOpen((v) => !v)}
        boardOpen={boardOpen}
        onToggleBoard={() => setBoardOpen((v) => !v)}
      />
      <div className="flex min-h-0 flex-1">
        {/* Desktop (>=1024px): Sources + Board render inline alongside Chat. */}
        <div className="hidden lg:block lg:shrink-0">
          <SourcesPanel sources={sources} versions={versions} sessionId={sessionId} workflowId={workflowId} />
        </div>

        <ChatPanel
          messages={messages}
          workflowTitle={workflowTitle}
          mode={sessionMode}
          sessionId={sessionId}
          selectedNodeForChat={selectedNodeForChat}
          onClearSelectedNode={() => setSelectedNodeForChat(null)}
        />

        <div className="hidden lg:block lg:shrink-0">
          <WorkflowPreview
            nodes={flowNodes}
            edges={flowEdges}
            workflowData={aiResponse}
            workflowId={workflowId}
            onChooseNodeInChat={setSelectedNodeForChat}
          />
        </div>
      </div>

      {/* Mobile/tablet (<1024px): Sources + Board collapse into off-canvas sheets, opened from the TopBar. */}
      <Sheet open={sourcesOpen} onOpenChange={setSourcesOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-sm p-0 sm:max-w-sm lg:hidden">
          <SourcesPanel
            sources={sources}
            versions={versions}
            sessionId={sessionId}
            workflowId={workflowId}
            onCollapse={() => setSourcesOpen(false)}
            className="w-full border-r-0"
          />
        </SheetContent>
      </Sheet>

      <Sheet open={boardOpen} onOpenChange={setBoardOpen}>
        <SheetContent side="right" className="w-[92vw] max-w-xl p-0 sm:max-w-xl lg:hidden">
          <WorkflowPreview
            nodes={flowNodes}
            edges={flowEdges}
            workflowData={aiResponse}
            workflowId={workflowId}
            onChooseNodeInChat={(node) => {
              setSelectedNodeForChat(node);
              setBoardOpen(false);
            }}
            className="w-full border-l-0"
          />
        </SheetContent>
      </Sheet>
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
