import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/shell/TopBar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SourcesPanel } from "@/features/workspace/components/SourcesPanel";
import { AiResultsPanel } from "@/features/workspace/components/AiResultsPanel";
import { ChatFab } from "@/features/workspace/components/ChatFab";
import { WorkflowPreview } from "@/features/workspace/components/WorkflowPreview";
import { useWorkspaceRealtime } from "@/lib/realtime/useWorkspaceRealtime";
import { useBoardState } from "@/features/workspace/useBoardState";
import { requireAuth } from "@/lib/auth/guards";
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
import { MOCK_VERSIONS } from "@/features/workspace/mock-data";
import { mapAiWorkflowToReactFlow } from "@/features/workspace/mapAiWorkflowToFlow";
import type { AiWorkflowResponse } from "@/features/workspace/aiWorkflow.types";
import type {
  FlowNode,
  FlowEdge,
  ChatMessage,
  WorkspaceSource,
  VersionEntry,
} from "@/features/workspace/types";

export const Route = createFileRoute("/workspace/$sessionId")({
  beforeLoad: requireAuth,
  component: WorkspacePage,
});

function WorkspacePage() {
  const { sessionId } = Route.useParams();
  const queryClient = useQueryClient();
  const [selectedNodeForChat, setSelectedNodeForChat] =
    useState<FlowNode | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);

  const { data: sessionData } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => getSession(sessionId),
    enabled: !!sessionId,
    refetchInterval: 10000,
  });

  const workflowId = sessionData?.workflow_id;

  // RULE 9: WebSocket first, poll as a max-5s fallback while disconnected.
  const { connected: realtimeConnected } = useWorkspaceRealtime({
    sessionId,
    workflowId,
  });
  const fallbackPoll = realtimeConnected ? false : 5000;

  const { data: workflowData } = useQuery({
    queryKey: ["workflow", workflowId],
    queryFn: () =>
      workflowId ? getWorkflow(workflowId) : Promise.resolve(null),
    enabled: !!workflowId,
    refetchInterval: fallbackPoll,
  });

  const { data: diagramData } = useQuery({
    queryKey: ["workflow-diagram", workflowId],
    queryFn: () =>
      workflowId ? getWorkflowDiagramData(workflowId) : Promise.resolve(null),
    enabled: !!workflowId,
  });

  const { data: progressData } = useQuery({
    queryKey: ["session-progress", sessionId],
    queryFn: () => getSessionProgress(sessionId),
    enabled: !!sessionId,
    refetchInterval: fallbackPoll,
  });

  const { data: workflowStateData } = useQuery({
    queryKey: ["session-workflow-state", sessionId],
    queryFn: () => getSessionWorkflowState(sessionId),
    enabled: !!sessionId,
    refetchInterval: fallbackPoll,
  });

  const { data: messagesData } = useQuery({
    queryKey: ["session-messages", sessionId],
    queryFn: () => listSessionMessages(sessionId),
    enabled: !!sessionId,
    refetchInterval: fallbackPoll,
  });

  const { data: documentsData } = useQuery({
    queryKey: ["workflow-documents", workflowId],
    queryFn: () =>
      workflowId ? listWorkflowDocuments(workflowId) : Promise.resolve([]),
    enabled: !!workflowId,
    refetchInterval: fallbackPoll,
  });

  const sources: WorkspaceSource[] = useMemo(
    () =>
      (documentsData ?? []).map((doc) => ({
        id: doc.id,
        name: doc.filename,
        type: doc.fileType?.includes("pdf")
          ? "pdf"
          : doc.fileType?.includes("image")
            ? "image"
            : doc.fileType?.includes("word")
              ? "doc"
              : ("text" as const),
        size: formatFileSize(doc.fileSizeBytes),
        status: "ready" as const,
        included: true,
      })),
    [documentsData],
  );

  const versions: VersionEntry[] = useMemo(() => {
    if (workflowStateData?.version_number) {
      return [
        {
          id: `v_${workflowStateData.version_number}`,
          label: `Version ${workflowStateData.version_number}`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          active: true,
        },
        ...MOCK_VERSIONS.slice(0, 4).map((v) => ({ ...v, active: false })),
      ];
    }
    return MOCK_VERSIONS;
  }, [workflowStateData?.version_number]);

  const messages: ChatMessage[] = useMemo(
    () =>
      (messagesData?.data ?? []).map((msg) => ({
        id: msg.id,
        role: msg.role,
        kind:
          msg.type === "user_input"
            ? "text"
            : msg.type === "ai_summary"
              ? "summary"
              : msg.type === "ai_update"
                ? "update"
                : msg.type === "system_status"
                  ? "status"
                  : ("text" as const),
        content: msg.content,
        timestamp: new Date(msg.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        ...(msg.metadata?.confidence_score
          ? { confidence: msg.metadata.confidence_score }
          : {}),
      })),
    [messagesData],
  );

  const renameMutation = useMutation({
    mutationFn: (title: string) => {
      if (!workflowId)
        return Promise.reject(new Error("No workflow to rename"));
      return patchWorkflow(workflowId, { title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow", workflowId] });
    },
  });

  const workflowTitle = workflowData?.title ?? "Untitled brand project";
  const sessionMode = (
    sessionData?.mode === "auto" ? "AUTO" : "INTERACTIVE"
  ) as "AUTO" | "INTERACTIVE";

  // Convert real workflow-state elementsJson into React Flow nodes/edges
  const { flowNodes, flowEdges, aiResponse } = useMemo(() => {
    // @ts-expect-error - The API returns elementsJson, but types.ts has elements_json
    const elementsJson = (workflowStateData?.elementsJson ||
      workflowStateData?.elements_json) as unknown as AiWorkflowResponse | null;
    if (elementsJson?.entities && elementsJson?.flow) {
      try {
        const { nodes: rfNodes, edges: rfEdges } =
          mapAiWorkflowToReactFlow(elementsJson);
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

  const board = useBoardState(flowNodes, flowEdges);

  const handleAddSourceToBoard = (source: WorkspaceSource) => {
    board.addNode(
      "source-card",
      { x: 80 + Math.random() * 120, y: 80 + Math.random() * 120 },
      { title: source.name, sourceType: source.type, sourceId: source.id },
    );
    setSourcesOpen(false);
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <TopBar
        variant="workspace"
        workflowId={workflowId}
        projectName={workflowTitle}
        onRenameProject={
          workflowId ? (title) => renameMutation.mutate(title) : undefined
        }
        sourcesOpen={sourcesOpen}
        onToggleSources={() => setSourcesOpen((v) => !v)}
        resultsOpen={resultsOpen}
        onToggleResults={() => setResultsOpen((v) => !v)}
      />
      <div className="relative flex min-h-0 flex-1">
        {/* Sources is the only collapsible side panel - visible inline at
            desktop, off-canvas below 1024px (opened from the TopBar). */}
        <div className="hidden lg:block lg:shrink-0">
          <SourcesPanel
            sources={sources}
            versions={versions}
            sessionId={sessionId}
            workflowId={workflowId}
            onAddToBoard={handleAddSourceToBoard}
          />
        </div>

        {/* Board is the primary, always-visible workspace view at every
            breakpoint (RULE 3) - Chat is a floating button + drawer instead
            of a fixed column. */}
        <div className="min-w-0 flex-1">
          <WorkflowPreview
            nodes={board.nodes}
            edges={board.edges}
            onNodesChange={board.onNodesChange}
            onEdgesChange={board.onEdgesChange}
            onConnect={board.onConnect}
            onAddNode={board.addNode}
            onDeleteNode={board.deleteNode}
            onDuplicateNode={board.duplicateNode}
            onBringNodeToFront={board.bringToFront}
            onSendNodeToBack={board.sendToBack}
            workflowData={aiResponse}
            workflowId={workflowId}
            onChooseNodeInChat={setSelectedNodeForChat}
          />
        </div>

        {/* AI Results panel - visible inline at desktop, hidden below */}
        <div className="hidden xl:block xl:shrink-0">
          <AiResultsPanel />
        </div>

        <ChatFab
          messages={messages}
          workflowTitle={workflowTitle}
          mode={sessionMode}
          sessionId={sessionId}
          selectedNodeForChat={selectedNodeForChat}
          onClearSelectedNode={() => setSelectedNodeForChat(null)}
        />
      </div>

      {/* Mobile/tablet sheet for AI Results */}
      <Sheet open={resultsOpen} onOpenChange={setResultsOpen}>
        <SheetContent
          side="right"
          className="w-[85vw] max-w-sm p-0 sm:max-w-sm xl:hidden"
        >
          <AiResultsPanel className="w-full border-l-0" />
        </SheetContent>
      </Sheet>

      <Sheet open={sourcesOpen} onOpenChange={setSourcesOpen}>
        <SheetContent
          side="left"
          className="w-[85vw] max-w-sm p-0 sm:max-w-sm lg:hidden"
        >
          <SourcesPanel
            sources={sources}
            versions={versions}
            sessionId={sessionId}
            workflowId={workflowId}
            onAddToBoard={handleAddSourceToBoard}
            onCollapse={() => setSourcesOpen(false)}
            className="w-full border-r-0"
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
