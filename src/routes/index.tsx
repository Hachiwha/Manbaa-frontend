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

import { listProjects, createProject, listProjectWorkflows } from "@/lib/api/services/projects.api";
import { createWorkflow } from "@/lib/api/services/workflows.api";
import { getSessionByWorkflowId, createSession } from "@/lib/api/services/sessions.api";


export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => listProjects(),
  });
  const projects = projectsData?.projects ?? [];

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const { data: workflowsData } = useQuery({
    queryKey: ["projects", selectedProjectId, "workflows"],
    queryFn: () => listProjectWorkflows(selectedProjectId!),
    enabled: !!selectedProjectId,
  });
  const projectWorkflows = workflowsData?.workflows ?? [];

  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);
  const [newWorkflowTitle, setNewWorkflowTitle] = useState("");
  const [newWorkflowDesc, setNewWorkflowDesc] = useState("");

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

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
      // Handle both { workflow: {...} } or just workflow object
      const workflowId = (wf as any).workflow?.id || wf.id;
      const session = await createSession({
        workflowId: workflowId,
        mode: "interactive",
      });
      return session;
    },
    onSuccess: (session) => {
      setIsCreatingWorkflow(false);
      setNewWorkflowTitle("");
      setNewWorkflowDesc("");
      queryClient.invalidateQueries({ queryKey: ["projects", selectedProjectId, "workflows"] });
      navigate({ to: "/workspace/$sessionId", params: { sessionId: session.id } });
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
              stat={{ label: "Total projects", value: String(projects.length), delta: "+1", deltaTone: "positive" }} 
              delay={0} 
            />
            <StatCard 
              stat={{ label: "Active workflows", value: String(projectWorkflows.length), delta: "Steady", deltaTone: "neutral" }} 
              delay={0.05} 
            />
            <StatCard 
              stat={{ label: "Success rate", value: "99.9%", delta: "+0.4 pts", deltaTone: "positive" }} 
              delay={0.1} 
            />
            <StatCard 
              stat={{ label: "Recent activity", value: "Just now", delta: "Active", deltaTone: "info" }} 
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
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
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
                {(selectedProject as any).description || "Manage workflows for this project."}
              </p>
            ) : (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Open a project to see its workflows. Each card below is a workspace you can jump into.
              </p>
            )}

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {selectedProject ? (
                <>
                  {projectWorkflows.map((wf, i) => (
                    <WorkflowCard key={wf.id} workflow={wf} delay={i * 0.04} />
                  ))}
                  <CreateWorkflowInProjectCard onClick={() => setIsCreatingWorkflow(true)} />
                </>
              ) : (
                <>
                  {projects.map((p, i) => (
                    <ProjectCard key={p.id} project={p} delay={i * 0.04} onOpen={() => setSelectedProjectId(p.id)} />
                  ))}
                  <CreateProjectCard onClick={() => setIsCreatingProject(true)} />
                </>
              )}
            </div>
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
                  className="rounded-lg p-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="pname" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                  <label htmlFor="pdesc" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                  className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim()}
                  className="rounded-lg bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-all hover:scale-[1.02] disabled:opacity-50"
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
                <h3 className="text-lg font-semibold">New Workflow</h3>
                <button
                  onClick={() => setIsCreatingWorkflow(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
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
                    Workflow Title
                  </label>
                  <input
                    id="wtitle"
                    autoFocus
                    value={newWorkflowTitle}
                    onChange={(e) => setNewWorkflowTitle(e.target.value)}
                    placeholder="e.g. Invoice Processing Logic"
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
                    placeholder="What will this workflow do?"
                    rows={3}
                    className="w-full resize-none rounded-lg border border-border bg-surface p-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-border bg-surface/30 p-4">
                <button
                  onClick={() => setIsCreatingWorkflow(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWorkflow}
                  disabled={!newWorkflowTitle.trim()}
                  className="rounded-lg bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  Create Workflow
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
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-surface px-6 py-7 md:px-9 md:py-9">
      <div className="absolute inset-0 bg-mesh opacity-90" />
      <div className="relative flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-glow">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-glow shadow-[0_0_8px_var(--primary)]" />
            AI Engine v2.4 · live
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-[34px]">
            Compose <span className="text-gradient-primary">intelligent workflows</span>
            <br className="hidden md:block" />
            from your sources, in minutes.
          </h1>
          <p className="mt-2.5 max-w-xl text-sm text-muted-foreground">
            FlowForge ingests your documents, infers a pipeline, and lets you refine it
            with chat — then exports a clean BPMN to Elsa or OpenBee.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="group inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium text-foreground/90 transition-all hover:border-border-strong hover:bg-surface-2"
          >
            Welcome to FlowForge
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
          <button
            type="button"
            onClick={onNewProject}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-all hover:scale-[1.02]"
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
        ? "text-primary-glow bg-primary/10 border-primary/30"
        : "text-muted-foreground bg-surface-2 border-border";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-colors hover:border-border-strong"
    >
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</div>
        {stat.delta && (
          <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${tone}`}>{stat.delta}</span>
        )}
      </div>
      <div className="mt-3 font-display text-[28px] font-semibold leading-none tracking-tight">{stat.value}</div>
      <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-gradient-primary opacity-0 blur-2xl transition-opacity group-hover:opacity-30" />
    </motion.div>
  );
}

function ToggleBtn({ icon: Icon, active }: { icon: typeof LayoutGrid; active?: boolean }) {
  return (
    <button
      type="button"
      className={`grid h-7 w-7 place-items-center rounded ${
        active ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function statusBadge(status: WorkflowStatus) {
  switch (status) {
    case "done":
      return { label: "Done", icon: CheckCircle2, cls: "bg-success/15 text-success border-success/30" };
    case "processing":
      return {
        label: "Processing",
        icon: Loader2,
        cls: "bg-primary/15 text-primary-glow border-primary/30",
        spin: true,
      };
    case "error":
      return { label: "Error", icon: AlertTriangle, cls: "bg-destructive/15 text-destructive border-destructive/30" };
    case "draft":
      return { label: "Draft", icon: FileEdit, cls: "bg-surface-2 text-muted-foreground border-border" };
    default:
      return { label: String(status ?? "Unknown"), icon: FileEdit, cls: "bg-surface-2 text-muted-foreground border-border" };
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

function ProjectCard({ project, delay, onOpen }: { project: any; delay: number; onOpen: () => void }) {
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
        className="group block w-full overflow-hidden rounded-xl border border-border bg-card text-left transition-all hover:border-border-strong hover:shadow-[var(--shadow-elevated)]"
      >
        <div className="relative h-28 w-full" style={{ backgroundImage: project.coverGradient }}>
          <div className="absolute inset-0 bg-mesh opacity-60" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-card to-transparent" />
          <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-border-strong/60 bg-background/50 px-2 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur">
            <FolderKanban className="h-3 w-3" />
            workflows
          </span>
          <span
            className="absolute left-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-md bg-background/40 text-foreground/90 backdrop-blur"
            aria-hidden
          >
            <FolderKanban className="h-3.5 w-3.5" />
          </span>
        </div>

        <div className="p-4">
          <h3 className="line-clamp-1 text-[14.5px] font-semibold tracking-tight text-foreground">{project.name}</h3>
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-muted-foreground">{project.description}</p>
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

function WorkflowCard({ workflow, delay }: { workflow: any; delay: number }) {
  const badge = statusBadge(workflow.status as WorkflowStatus);
  const Icon = badge.icon;
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const session = await getSessionByWorkflowId(workflow.id);
      navigate({ to: "/workspace/$sessionId", params: { sessionId: session.id } });
    } catch (err: any) {
      if (err?.response?.status === 404 || err.status === 404 || true) {
        try {
          const newSession = await createSession({ workflowId: workflow.id, mode: "interactive" });
          navigate({ to: "/workspace/$sessionId", params: { sessionId: newSession.id } });
        } catch (e2) {
          console.error(e2);
        }
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
        className="group w-full text-left block overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-border-strong hover:shadow-[var(--shadow-elevated)]"
      >
        <div className="relative h-28 w-full" style={{ backgroundImage: workflow.thumbnailGradient || "linear-gradient(135deg, #3b82f6, #2dd4bf)" }}>
          <div className="absolute inset-0 bg-mesh opacity-60" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-card to-transparent" />
          <span
            className={`absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur ${badge.cls}`}
          >
            <Icon className={`h-3 w-3 ${badge.spin ? "animate-spin" : ""}`} />
            {badge.label}
          </span>
          <div
            className="absolute left-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-md bg-background/40 text-foreground/80 opacity-0 backdrop-blur transition-opacity hover:bg-background/70 group-hover:opacity-100"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            aria-label="More"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className="p-4">
          <h3 className="line-clamp-1 text-[14.5px] font-semibold tracking-tight text-foreground">{workflow.title}</h3>
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-muted-foreground">{workflow.description}</p>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-1">
              {(workflow.tags || []).map((t: string) => (
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
      className="group flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-strong/70 bg-surface/30 p-6 text-center transition-all hover:border-primary/60 hover:bg-primary/5"
    >
      <span className="grid h-12 w-12 place-items-center rounded-xl border border-primary/40 bg-primary/10 text-primary-glow transition-transform group-hover:scale-110">
        <FolderKanban className="h-5 w-5" />
      </span>
      <div>
        <div className="text-sm font-semibold">Create project</div>
        <p className="mt-1 text-[12px] text-muted-foreground">Group workflows by team, domain, or client.</p>
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
      className="group flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-strong/70 bg-surface/30 p-6 text-center transition-all hover:border-primary/60 hover:bg-primary/5"
    >
      <span className="grid h-12 w-12 place-items-center rounded-xl border border-primary/40 bg-primary/10 text-primary-glow transition-transform group-hover:scale-110">
        <Plus className="h-5 w-5" />
      </span>
      <div>
        <div className="text-sm font-semibold">Create workflow</div>
        <p className="mt-1 text-[12px] text-muted-foreground">Start from a template or a blank canvas in this project.</p>
      </div>
    </motion.button>
  );
}
