import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { WorkflowPreview } from "@/features/workspace/components/WorkflowPreview";
import { TopBar } from "@/components/shell/TopBar";
import { mapAiWorkflowToReactFlow } from "@/features/workspace/mapAiWorkflowToFlow";
import { apiUrl } from "@/lib/api/url";
import { apiClient } from "@/lib/api/apiClient";
import type { AiWorkflowResponse } from "@/features/workspace/aiWorkflow.types";

export const Route = createFileRoute("/shared/$token")({
  component: SharedWorkflowPage,
});

function SharedWorkflowPage() {
  const { token } = Route.useParams();

  const {
    data: workflowData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["shared-workflow", token],
    queryFn: async () => {
      // In a real application, we would call an actual API route that returns the shared workflow data
      const res = await apiClient<{
        id: string;
        title: string;
        elementsJson?: AiWorkflowResponse;
      }>(apiUrl(`/workflows/shared/${encodeURIComponent(token)}`), {
        method: "GET",
      });
      return res;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p>Loading shared workflow...</p>
        </div>
      </div>
    );
  }

  if (error || !workflowData) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2 text-destructive">
          <p className="text-xl font-semibold">Brand project not found</p>
          <p className="text-sm">
            The share link may be invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  const { nodes, edges } = workflowData.elementsJson
    ? mapAiWorkflowToReactFlow(workflowData.elementsJson)
    : { nodes: [], edges: [] };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <TopBar variant="minimal" title={workflowData.title} />
      <div className="flex flex-1 overflow-hidden">
        <WorkflowPreview
          nodes={nodes}
          edges={edges}
          workflowData={workflowData.elementsJson}
        />
      </div>
    </div>
  );
}
