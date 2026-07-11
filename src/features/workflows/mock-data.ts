import type { DashboardStat, Project, Workflow } from "./types";

const WORKFLOW_SEED: Workflow[] = [
  {
    id: "wf_01",
    sessionId: "sess_01",
    title: "Invoice Intake → Elsa Pipeline",
    description:
      "Parses incoming PDF invoices, extracts line items, validates against ERP, and pushes a clean BPMN to Elsa.",
    status: "done",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    tags: ["AI DB", "NL API", "OCR"],
    thumbnailGradient:
      "linear-gradient(135deg, oklch(0.45 0.18 280), oklch(0.55 0.20 320))",
  },
  {
    id: "wf_02",
    sessionId: "sess_02",
    title: "Customer Onboarding Orchestrator",
    description:
      "Multi-step KYC pipeline with document vectorization, rule-based scoring and reviewer escalation.",
    status: "processing",
    updatedAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    tags: ["Vectorize", "Rules"],
    thumbnailGradient:
      "linear-gradient(135deg, oklch(0.40 0.16 220), oklch(0.55 0.18 280))",
  },
  {
    id: "wf_03",
    sessionId: "sess_03",
    title: "Contract Review Assistant",
    description:
      "Scans uploaded contracts, flags divergent clauses against the org playbook and proposes a redline.",
    status: "done",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    tags: ["Legal", "Diff"],
    thumbnailGradient:
      "linear-gradient(135deg, oklch(0.40 0.14 195), oklch(0.50 0.18 260))",
  },
  {
    id: "wf_04",
    sessionId: "sess_04",
    title: "Support Triage → Ticketing",
    description:
      "Classifies inbound emails, generates a draft response, and creates a ticket in the right queue.",
    status: "error",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    tags: ["NLP", "Routing"],
    thumbnailGradient:
      "linear-gradient(135deg, oklch(0.40 0.18 25), oklch(0.50 0.20 320))",
  },
  {
    id: "wf_05",
    sessionId: "sess_05",
    title: "Procurement Approval Flow",
    description:
      "Generates an approval workflow from a free-text policy doc, with thresholds and reviewer matrix.",
    status: "draft",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    tags: ["Policy", "Approvals"],
    thumbnailGradient:
      "linear-gradient(135deg, oklch(0.42 0.16 300), oklch(0.55 0.18 200))",
  },
];

function maxIso(dates: string[]) {
  return dates.reduce((a, b) => (new Date(a) > new Date(b) ? a : b));
}

export const MOCK_PROJECTS: Project[] = [
  {
    id: "proj_finance",
    name: "Finance & Billing",
    description:
      "Invoice pipelines, procurement approvals, and ERP-aligned automations.",
    updatedAt: maxIso([WORKFLOW_SEED[0].updatedAt, WORKFLOW_SEED[4].updatedAt]),
    coverGradient:
      "linear-gradient(135deg, oklch(0.38 0.14 265), oklch(0.52 0.20 300))",
    workflows: [WORKFLOW_SEED[0], WORKFLOW_SEED[4]],
  },
  {
    id: "proj_customer",
    name: "Customer Experience",
    description:
      "Onboarding, support triage, and lifecycle workflows tied to CRM data.",
    updatedAt: maxIso([WORKFLOW_SEED[1].updatedAt, WORKFLOW_SEED[3].updatedAt]),
    coverGradient:
      "linear-gradient(135deg, oklch(0.36 0.12 220), oklch(0.50 0.18 200))",
    workflows: [WORKFLOW_SEED[1], WORKFLOW_SEED[3]],
  },
  {
    id: "proj_legal",
    name: "Legal & Compliance",
    description:
      "Contract review, policy alignment, and audit-friendly decision logs.",
    updatedAt: WORKFLOW_SEED[2].updatedAt,
    coverGradient:
      "linear-gradient(135deg, oklch(0.34 0.10 195), oklch(0.48 0.16 265))",
    workflows: [WORKFLOW_SEED[2]],
  },
];

/** All workflows (flattened from projects) — used by workspace and legacy lookups. */
export const MOCK_WORKFLOWS: Workflow[] = MOCK_PROJECTS.flatMap(
  (p) => p.workflows,
);

export const MOCK_STATS: DashboardStat[] = [
  {
    label: "Total projects",
    value: String(MOCK_PROJECTS.length),
    delta: "+1",
    deltaTone: "positive",
  },
  {
    label: "Workflows executed",
    value: "4 921",
    delta: "Steady",
    deltaTone: "neutral",
  },
  {
    label: "Success rate",
    value: "99.9%",
    delta: "+0.4 pts",
    deltaTone: "positive",
  },
  {
    label: "Recent activity",
    value: "2 min ago",
    delta: "Active",
    deltaTone: "info",
  },
];
