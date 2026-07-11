import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles, Loader2, AlertTriangle, FolderKanban } from "lucide-react";
import { AppShell } from "@/components/shell/AppSidebar";
import { requireAuth } from "@/lib/auth/guards";
import { listProjects } from "@/lib/api/services/projects.api";
import { createWorkflow } from "@/lib/api/services/workflows.api";
import { createSession } from "@/lib/api/services/sessions.api";
import { createSessionMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/brand-dna")({
  beforeLoad: requireAuth,
  component: BrandDnaPage,
});

function BrandDnaPage() {
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["projects"],
    queryFn: () => listProjects(),
  });
  const projects = data?.projects ?? [];
  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) ?? null;

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProject) throw new Error("No brand selected");
      const workflow = await createWorkflow({
        title: `${selectedProject.name} — Brand DNA`,
        description: "AI-generated brand identity",
        projectId: selectedProject.id,
      });
      const session = await createSession({
        workflowId: workflow.id,
        mode: "auto",
      });
      await createSessionMessage(session.id, {
        role: "user",
        type: "user_input",
        content: `Generate a complete brand identity for "${selectedProject.name}" — logo direction, typography, and a color palette.`,
      });
      return session;
    },
    onSuccess: (session) => {
      navigate({
        to: "/workspace/$sessionId",
        params: { sessionId: session.id },
      });
    },
  });

  return (
    <AppShell>
      <div className="grid min-h-[calc(100vh-3rem)] grid-cols-1 md:grid-cols-[320px_1fr]">
        <div className="border-b border-hairline p-6 md:border-b-0 md:border-r">
          <h1 className="text-display-md text-ink">
            Pick the brand you want to generate DNA for
          </h1>

          {isError ? (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-caption text-destructive">
              <AlertTriangle className="h-4 w-4" /> Couldn't load your brands.
            </div>
          ) : isLoading ? (
            <div className="mt-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-11 animate-pulse rounded-lg bg-surface-2"
                />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong/60 bg-surface/30 px-4 py-8 text-center">
              <FolderKanban className="h-6 w-6 text-ink-muted-48" />
              <p className="text-caption text-ink-muted-48">
                Create a brand project first — then come back here to generate
                its DNA.
              </p>
            </div>
          ) : (
            <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedProjectId(project.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-body-strong transition-all active:scale-[0.99]",
                    selectedProjectId === project.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-hairline bg-canvas text-ink hover:border-primary/40",
                  )}
                >
                  {project.name}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => generateMutation.mutate()}
            disabled={!selectedProject || generateMutation.isPending}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-pill bg-primary px-5 py-3 text-body-strong text-primary-foreground transition-all active:scale-95 hover:bg-primary/90 disabled:opacity-50"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Starting…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate DNA
              </>
            )}
          </button>

          {generateMutation.isError ? (
            <p className="mt-2 text-caption text-destructive">
              Something went wrong starting the generation. Try again.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col p-6">
          <h2 className="text-body-strong text-ink">Studio</h2>
          <div className="mt-4 flex flex-1 items-center justify-center rounded-2xl border border-hairline bg-surface-pearl">
            {generateMutation.isPending ? (
              <div className="flex flex-col items-center gap-3 text-ink-muted-48">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-body">Generating…</p>
              </div>
            ) : selectedProject ? (
              <div className="flex flex-col items-center gap-2 px-6 text-center text-ink-muted-48">
                <Sparkles className="h-8 w-8" />
                <p className="text-body">
                  Ready to generate DNA for{" "}
                  <span className="text-ink">{selectedProject.name}</span>
                </p>
                <p className="text-caption">
                  This opens the live workspace, where you can watch the AI
                  build the identity and refine it in real time.
                </p>
              </div>
            ) : (
              <p className="text-body text-ink-muted-48">
                Pick a brand to get started.
              </p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
