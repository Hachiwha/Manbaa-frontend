export type WorkflowStatus = "done" | "processing" | "error" | "draft";

export interface Workflow {
  id: string;
  title: string;
  description: string;
  status: WorkflowStatus;
  updatedAt: string; // ISO
  tags: string[];
  thumbnailGradient: string; // CSS gradient
  sessionId: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  coverGradient: string;
  workflows: Workflow[];
}

export interface DashboardStat {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "positive" | "neutral" | "info";
  hint?: string;
}
