import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  Plus,
  MoreHorizontal,
  Activity,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  FileEdit,
  LayoutGrid,
  Rows3,
  FolderKanban,
  X,
} from "lucide-react";
import { TopBar } from "@/components/shell/TopBar";
import type { WorkflowStatus, DashboardStat } from "@/features/workflows/types";
import { cn } from "@/lib/utils";

import {
  listProjects,
  createProject,
  listProjectWorkflows,
  type BackendProject,
  type ProjectWorkflowsResponse,
} from "@/lib/api/services/projects.api";
import { createWorkflow } from "@/lib/api/services/workflows.api";
import {
  getSessionByWorkflowId,
  createSession,
} from "@/lib/api/services/sessions.api";
import { HttpError } from "@/lib/api/http";

type ProjectWorkflowItem = ProjectWorkflowsResponse["workflows"][number];

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: projectsData,
    isLoading: projectsLoading,
    isError: projectsErrored,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: () => listProjects(),
  });
  const projects = projectsData?.projects ?? [];

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  const {
    data: workflowsData,
    isLoading: workflowsLoading,
    isError: workflowsErrored,
  } = useQuery({
    queryKey: ["projects", selectedProjectId, "workflows"],
    queryFn: () => listProjectWorkflows(selectedProjectId!),
    enabled: !!selectedProjectId,
  });
  const projectWorkflows = workflowsData?.workflows ?? [];

  const isLoading = selectedProjectId ? workflowsLoading : projectsLoading;
  const isErrored = selectedProjectId ? workflowsErrored : projectsErrored;

  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);
  const [newWorkflowTitle, setNewWorkflowTitle] = useState("");
  const [newWorkflowDesc, setNewWorkflowDesc] = useState("");

  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) ?? null;

  const createProjectMutation = useMutation({
    mutationFn: () => createProject({ name: newProjectName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsCreatingProject(false);
      setNewProjectName("");
      setNewProjectDesc("");
    },
  });

  const createWorkflowMutation = useMutation({
    mutationFn: async () => {
      const wf = await createWorkflow({
        title: newWorkflowTitle,
        description: newWorkflowDesc,
        projectId: selectedProjectId!,
      });
      const session = await createSession({
        workflowId: wf.id,
        mode: "interactive",
      });
      return session;
    },
    onSuccess: (session) => {
      setIsCreatingWorkflow(false);
      setNewWorkflowTitle("");
      setNewWorkflowDesc("");
      queryClient.invalidateQueries({
        queryKey: ["projects", selectedProjectId, "workflows"],
      });
      navigate({
        to: "/workspace/$sessionId",
        params: { sessionId: session.id },
      });
    },
  });

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    createProjectMutation.mutate();
  };

  const handleCreateWorkflow = () => {
    if (!newWorkflowTitle.trim() || !selectedProjectId) return;
    createWorkflowMutation.mutate();
  };
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <TopBar />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1400px] px-6 py-8 md:px-10 md:py-10">
          <Hero onNewProject={() => setIsCreatingProject(true)} />

          <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              stat={{
                label: "Total projects",
                value: String(projects.length),
                delta: "+1",
                deltaTone: "positive",
              }}
              delay={0}
            />
            <StatCard
              stat={{
                label: "Active brand projects",
                value: String(projectWorkflows.length),
                delta: "Steady",
                deltaTone: "neutral",
              }}
              delay={0.05}
            />
            <StatCard
              stat={{
                label: "Success rate",
                value: "99.9%",
                delta: "+0.4 pts",
                deltaTone: "positive",
              }}
              delay={0.1}
            />
            <StatCard
              stat={{
                label: "Recent activity",
                value: "Just now",
                delta: "Active",
                deltaTone: "info",
              }}
              delay={0.15}
            />
          </section>

          <section className="mt-12">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {selectedProject ? (
                  <button
                    type="button"
                    onClick={() => setSelectedProjectId(null)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors active:scale-95 hover:border-border-strong hover:text-foreground"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    All projects
                  </button>
                ) : null}
                <h2 className="text-lg font-semibold tracking-tight">
                  {selectedProject ? selectedProject.name : "Your projects"}
                </h2>
                <span className="rounded-md border border-border bg-surface px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {selectedProject ? projectWorkflows.length : projects.length}
                </span>
              </div>
              <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-0.5">
                <ToggleBtn active icon={LayoutGrid} />
                <ToggleBtn icon={Rows3} />
              </div>
            </div>

            {selectedProject ? (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Manage brand projects for this project.
              </p>
            ) : (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Open a project to see its brand projects. Each card below is a
                workspace you can jump into.
              </p>
            )}

            {isErrored ? (
              <div className="mt-5 flex flex-col items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <p className="text-sm font-medium text-destructive">
                  Couldn't load{" "}
                  {selectedProject ? "brand projects" : "projects"}.
                </p>
                <p className="text-xs text-muted-foreground">
                  Check your connection and try again.
                </p>
              </div>
            ) : isLoading ? (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : selectedProject && projectWorkflows.length === 0 ? (
              <div className="mt-5 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border-strong/60 bg-surface/30 px-6 py-10 text-center">
                <FolderKanban className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  No brand projects yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Create one to get started in this project.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreatingWorkflow(true)}
                  className="mt-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all active:scale-95 hover:bg-primary/90"
                >
                  New brand project
                </button>
              </div>
            ) : !selectedProject && projects.length === 0 ? (
              <div className="mt-5 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border-strong/60 bg-surface/30 px-6 py-10 text-center">
                <FolderKanban className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  No projects yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Create your first project to organize brand work.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreatingProject(true)}
                  className="mt-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all active:scale-95 hover:bg-primary/90"
                >
                  New project
                </button>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {selectedProject ? (
                  <>
                    {projectWorkflows.map((wf, i) => (
                      <WorkflowCard
                        key={wf.id}
                        workflow={wf}
                        delay={i * 0.04}
                      />
                    ))}
                    <CreateWorkflowInProjectCard
                      onClick={() => setIsCreatingWorkflow(true)}
                    />
                  </>
                ) : (
                  <>
                    {projects.map((p, i) => (
                      <ProjectCard
                        key={p.id}
                        project={p}
                        delay={i * 0.04}
                        onOpen={() => setSelectedProjectId(p.id)}
                      />
                    ))}
                    <CreateProjectCard
                      onClick={() => setIsCreatingProject(true)}
                    />
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

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
                <h3 className="text-lg font-semibold">New Project</h3>
                <button
                  onClick={() => setIsCreatingProject(false)}
                  className="rounded-lg p-1 text-muted-foreground transition-colors active:scale-95 hover:bg-surface-2 hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="pname"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Project Name
                  </label>
                  <input
                    id="pname"
                    autoFocus
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. Q2 Logistics Optimization"
                    className="w-full rounded-lg border border-border bg-surface p-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="pdesc"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Description
                  </label>
                  <textarea
                    id="pdesc"
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="What's this project about?"
                    rows={3}
                    className="w-auto min-h-[80px] w-full resize-none rounded-lg border border-border bg-surface p-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-border bg-surface/30 p-4">
                <button
                  onClick={() => setIsCreatingProject(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors active:scale-95 hover:bg-surface-2 hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim()}
                  className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all active:scale-95 hover:bg-primary/90 disabled:opacity-50"
                >
                  Create Project
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {isCreatingWorkflow && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreatingWorkflow(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border p-4">
                <h3 className="text-lg font-semibold">New brand project</h3>
                <button
                  onClick={() => setIsCreatingWorkflow(false)}
                  className="rounded-lg p-1 text-muted-foreground transition-colors active:scale-95 hover:bg-surface-2 hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="wtitle"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Brand project title
                  </label>
                  <input
                    id="wtitle"
                    autoFocus
                    value={newWorkflowTitle}
                    onChange={(e) => setNewWorkflowTitle(e.target.value)}
                    placeholder="e.g. Q3 Rebrand Concept"
                    className="w-full rounded-lg border border-border bg-surface p-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="wdesc"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Description
                  </label>
                  <textarea
                    id="wdesc"
                    value={newWorkflowDesc}
                    onChange={(e) => setNewWorkflowDesc(e.target.value)}
                    placeholder="What's this brand project about?"
                    rows={3}
                    className="w-full resize-none rounded-lg border border-border bg-surface p-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-border bg-surface/30 p-4">
                <button
                  onClick={() => setIsCreatingWorkflow(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors active:scale-95 hover:bg-surface-2 hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWorkflow}
                  disabled={!newWorkflowTitle.trim()}
                  className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all active:scale-95 hover:bg-primary/90 disabled:opacity-50"
                >
                  Create brand project
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Hero({ onNewProject }: { onNewProject: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface px-6 py-7 md:px-9 md:py-9">
      <div className="relative flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Manbaa · live
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-[34px]">
            Compose{" "}
            <span className="text-primary">intelligent brand identities</span>
            <br className="hidden md:block" />
            from your sources, in minutes.
          </h1>
          <p className="mt-2.5 max-w-xl text-sm text-muted-foreground">
            Manbaa ingests your sources, drafts a brand identity with AI, and
            lets you refine it on the board — then exports a polished brand
            document.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="group inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium text-foreground/90 transition-all active:scale-95 hover:border-border-strong hover:bg-surface-2"
          >
            Welcome to Manbaa
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
          <button
            type="button"
            onClick={onNewProject}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-all active:scale-95 hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New project
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ stat, delay }: { stat: DashboardStat; delay: number }) {
  const tone =
    stat.deltaTone === "positive"
      ? "text-success bg-success/10 border-success/30"
      : stat.deltaTone === "info"
        ? "text-primary bg-primary/10 border-primary/30"
        : "text-muted-foreground bg-surface-2 border-border";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-colors hover:border-border-strong"
    >
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {stat.label}
        </div>
        {stat.delta && (
          <span
            className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${tone}`}
          >
            {stat.delta}
          </span>
        )}
      </div>
      <div className="mt-3 font-display text-[28px] font-semibold leading-none tracking-tight">
        {stat.value}
      </div>
    </motion.div>
  );
}

function ToggleBtn({
  icon: Icon,
  active,
}: {
  icon: typeof LayoutGrid;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`grid h-11 w-11 place-items-center rounded transition-colors active:scale-95 ${
        active
          ? "bg-surface-2 text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function CardSkeleton() {
  return (
    <div className="h-[260px] animate-pulse overflow-hidden rounded-xl border border-border bg-card">
      <div className="h-28 w-full bg-surface-2" />
      <div className="space-y-2 p-4">
        <div className="h-3.5 w-3/4 rounded bg-surface-2" />
        <div className="h-3 w-full rounded bg-surface-2" />
        <div className="h-3 w-2/3 rounded bg-surface-2" />
      </div>
    </div>
  );
}

function statusBadge(status: WorkflowStatus) {
  switch (status) {
    case "done":
      return {
        label: "Done",
        icon: CheckCircle2,
        cls: "bg-success/15 text-success border-success/30",
      };
    case "processing":
      return {
        label: "Processing",
        icon: Loader2,
        cls: "bg-primary/15 text-primary border-primary/30",
        spin: true,
      };
    case "error":
      return {
        label: "Error",
        icon: AlertTriangle,
        cls: "bg-destructive/15 text-destructive border-destructive/30",
      };
    case "draft":
      return {
        label: "Draft",
        icon: FileEdit,
        cls: "bg-surface-2 text-muted-foreground border-border",
      };
    default:
      return {
        label: String(status ?? "Unknown"),
        icon: FileEdit,
        cls: "bg-surface-2 text-muted-foreground border-border",
      };
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function ProjectCard({
  project,
  delay,
  onOpen,
}: {
  project: BackendProject;
  delay: number;
  onOpen: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -3 }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="group block w-full overflow-hidden rounded-xl border border-border bg-card text-left transition-all active:scale-[0.99] hover:border-border-strong hover:shadow-[var(--shadow-hairline)]"
      >
        <div className="relative flex h-28 w-full items-center justify-center bg-surface-2">
          <FolderKanban className="h-7 w-7 text-muted-foreground" aria-hidden />
          <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-border-strong/60 bg-background/70 px-2 py-0.5 text-[10px] font-semibold text-foreground">
            <FolderKanban className="h-3 w-3" />
            brand projects
          </span>
        </div>

        <div className="p-4">
          <h3 className="line-clamp-1 text-[14.5px] font-semibold tracking-tight text-foreground">
            {project.name}
          </h3>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10.5px] text-muted-foreground">Project</span>
            <span className="flex items-center gap-1 text-[10.5px] text-muted-foreground">
              <Activity className="h-3 w-3" />
              {timeAgo(project.updatedAt)}
            </span>
          </div>
        </div>
      </button>
    </motion.div>
  );
}

function WorkflowCard({
  workflow,
  delay,
}: {
  workflow: ProjectWorkflowItem;
  delay: number;
}) {
  const badge = statusBadge(workflow.status as WorkflowStatus);
  const Icon = badge.icon;
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadError(false);
    try {
      const session = await getSessionByWorkflowId(workflow.id);
      navigate({
        to: "/workspace/$sessionId",
        params: { sessionId: session.id },
      });
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) {
        try {
          const newSession = await createSession({
            workflowId: workflow.id,
            mode: "interactive",
          });
          navigate({
            to: "/workspace/$sessionId",
            params: { sessionId: newSession.id },
          });
        } catch (e2) {
          console.error(e2);
          setLoadError(true);
        }
      } else {
        console.error(err);
        setLoadError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -3 }}
    >
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="group w-full text-left block overflow-hidden rounded-xl border border-border bg-card transition-all active:scale-[0.99] hover:border-border-strong hover:shadow-[var(--shadow-hairline)] disabled:opacity-70"
      >
        <div className="relative flex h-28 w-full items-center justify-center bg-surface-2">
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <FileEdit className="h-7 w-7 text-muted-foreground" aria-hidden />
          )}
          <span
            className={`absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}
          >
            <Icon className={`h-3 w-3 ${badge.spin ? "animate-spin" : ""}`} />
            {badge.label}
          </span>
          <div
            className="absolute left-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-md bg-background/40 text-foreground/80 opacity-0 transition-opacity hover:bg-background/70 group-hover:opacity-100"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            aria-label="More"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className="p-4">
          <h3 className="line-clamp-1 text-[14.5px] font-semibold tracking-tight text-foreground">
            {workflow.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-muted-foreground">
            {workflow.description || "No description yet."}
          </p>
          {loadError ? (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-destructive">
              <AlertTriangle className="h-3 w-3" /> Couldn't open — try again.
            </p>
          ) : null}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-1">
              {workflow.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
            <span className="flex items-center gap-1 text-[10.5px] text-muted-foreground">
              <Activity className="h-3 w-3" />
              {timeAgo(workflow.updatedAt)}
            </span>
          </div>
        </div>
      </button>
    </motion.div>
  );
}

function CreateProjectCard({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.25 }}
      className="group flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-strong/70 bg-surface/30 p-6 text-center transition-all active:scale-[0.99] hover:border-primary/60 hover:bg-primary/5"
    >
      <span className="grid h-12 w-12 place-items-center rounded-xl border border-primary/40 bg-primary/10 text-primary transition-transform group-hover:scale-110">
        <FolderKanban className="h-5 w-5" />
      </span>
      <div>
        <div className="text-sm font-semibold">Create project</div>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Group workflows by team, domain, or client.
        </p>
      </div>
    </motion.button>
  );
}

function CreateWorkflowInProjectCard({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="group flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-strong/70 bg-surface/30 p-6 text-center transition-all active:scale-[0.99] hover:border-primary/60 hover:bg-primary/5"
    >
      <span className="grid h-12 w-12 place-items-center rounded-xl border border-primary/40 bg-primary/10 text-primary transition-transform group-hover:scale-110">
        <Plus className="h-5 w-5" />
      </span>
      <div>
        <div className="text-sm font-semibold">Create brand project</div>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Start from a template or a blank canvas in this project.
        </p>
      </div>
    </motion.button>
  );
}
