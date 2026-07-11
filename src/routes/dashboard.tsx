import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  X,
  FolderKanban,
  CheckCircle2,
  Sparkles,
  Users,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppSidebar";
import { requireAuth } from "@/lib/auth/guards";
import {
  listProjects,
  createProject,
  type BackendProject,
} from "@/lib/api/services/projects.api";
import { listWorkflows } from "@/lib/api";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: requireAuth,
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const {
    data: projectsData,
    isLoading: projectsLoading,
    isError: projectsErrored,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: () => listProjects(),
  });
  const projects = projectsData?.projects ?? [];
  const recentProjects = [...projects]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 3);

  const { data: workflowsData } = useQuery({
    queryKey: ["library-workflows"],
    queryFn: () => listWorkflows(),
  });
  const workflows = workflowsData?.data ?? [];
  const completedCount = workflows.filter(
    (w) => w.status === "VALIDATED" || w.status === "EXPORTED",
  ).length;

  const createProjectMutation = useMutation({
    mutationFn: () => createProject({ name: newProjectName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsCreatingProject(false);
      setNewProjectName("");
    },
  });

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl px-6 py-8 md:px-10 md:py-10">
        <h1 className="text-display-md text-ink">Welcome back 👋</h1>
        <p className="mt-2 text-body text-ink-muted-48">
          Here's what's happening with your brands today.
        </p>

        <section className="mt-8">
          <h2 className="text-body-strong text-ink">
            Continue where you left off
          </h2>

          {projectsErrored ? (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-caption text-destructive">
              <AlertTriangle className="h-4 w-4" /> Couldn't load your projects.
            </div>
          ) : projectsLoading ? (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-xl bg-surface-2"
                />
              ))}
            </div>
          ) : recentProjects.length === 0 ? (
            <div className="mt-3 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border-strong/60 bg-surface/30 px-6 py-10 text-center">
              <FolderKanban className="h-8 w-8 text-ink-muted-48" />
              <p className="text-body text-ink-muted-48">
                No projects yet — create your first one.
              </p>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {recentProjects.map((project) => (
                <ContinueCard
                  key={project.id}
                  project={project}
                  onOpen={() => navigate({ to: "/library" })}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-body-strong text-ink">Statistics</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              icon={FolderKanban}
              label="Projects"
              value={projects.length}
            />
            <StatTile
              icon={Sparkles}
              label="Brands generated"
              value={workflows.length}
            />
            <StatTile
              icon={CheckCircle2}
              label="Completed"
              value={completedCount}
            />
            <StatTile icon={Users} label="Organization" value={1} />
          </div>
        </section>
      </div>

      <button
        type="button"
        onClick={() => setIsCreatingProject(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-pill bg-primary px-5 py-3 text-body-strong text-primary-foreground transition-all active:scale-95 hover:bg-primary/90"
      >
        New Brand
        <Plus className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {isCreatingProject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreatingProject(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border p-4">
                <h3 className="text-lg font-semibold">New brand</h3>
                <button
                  onClick={() => setIsCreatingProject(false)}
                  className="rounded-lg p-1 text-muted-foreground transition-colors active:scale-95 hover:bg-surface-2 hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-2 p-6">
                <label
                  htmlFor="pname"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Brand name
                </label>
                <input
                  id="pname"
                  autoFocus
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Nutra"
                  className="w-full rounded-lg border border-border bg-surface p-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-border bg-surface/30 p-4">
                <button
                  onClick={() => setIsCreatingProject(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors active:scale-95 hover:bg-surface-2 hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createProjectMutation.mutate()}
                  disabled={
                    !newProjectName.trim() || createProjectMutation.isPending
                  }
                  className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all active:scale-95 hover:bg-primary/90 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

function ContinueCard({
  project,
  onOpen,
}: {
  project: BackendProject;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col items-start gap-3 rounded-xl border border-hairline bg-surface-pearl p-4 text-left transition-all active:scale-[0.99] hover:border-primary/40"
    >
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <FolderKanban className="h-4 w-4" />
        </span>
        <span className="text-body-strong text-ink">{project.name}</span>
      </div>
      <span className="inline-flex items-center gap-1 text-caption text-primary group-hover:underline">
        Open <ArrowRight className="h-3 w-3" />
      </span>
    </button>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FolderKanban;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-canvas p-4">
      <Icon className="h-4 w-4 text-ink-muted-48" />
      <div className="mt-2 text-display-md text-ink">{value}</div>
      <div className="text-caption text-ink-muted-48">{label}</div>
    </div>
  );
}
