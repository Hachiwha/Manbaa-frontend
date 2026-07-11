import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, AlertTriangle, LibraryBig } from "lucide-react";
import { AppShell } from "@/components/shell/AppSidebar";
import { requireAuth } from "@/lib/auth/guards";
import {
  listWorkflows,
  getSessionByWorkflowId,
  createSession,
  HttpError,
} from "@/lib/api";
import type { WorkflowListItem } from "@/lib/api/types";

export const Route = createFileRoute("/library")({
  beforeLoad: requireAuth,
  component: LibraryPage,
});

function statusPillClass(status: WorkflowListItem["status"]) {
  switch (status) {
    case "VALIDATED":
    case "EXPORTED":
      return "bg-success/15 text-success border-success/30";
    case "PENDING_REVIEW":
      return "bg-primary/15 text-primary border-primary/30";
    case "ARCHIVED":
      return "bg-surface-2 text-muted-foreground border-border";
    default:
      return "bg-warning/15 text-warning border-warning/30";
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function LibraryPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["library-workflows"],
    queryFn: () => listWorkflows(),
  });
  const workflows = data?.data ?? [];

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl px-6 py-8 md:px-10 md:py-10">
        <h1 className="text-display-md text-ink">Library</h1>
        <p className="mt-2 text-body text-ink-muted-48">
          Every brand you've generated, in one place.
        </p>

        {isError ? (
          <div className="mt-6 flex flex-col items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-sm font-medium text-destructive">
              Couldn't load your library.
            </p>
          </div>
        ) : isLoading ? (
          <div className="mt-6 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-lg bg-surface-2"
              />
            ))}
          </div>
        ) : workflows.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border-strong/60 bg-surface/30 px-6 py-14 text-center">
            <LibraryBig className="h-10 w-10 text-ink-muted-48" />
            <p className="text-body-strong text-ink">Nothing here yet</p>
            <p className="text-caption text-ink-muted-48">
              Brands you generate will show up here.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border border-hairline">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-hairline bg-surface-pearl">
                  <th className="px-4 py-3 text-caption-strong text-ink-muted-48">
                    Brand
                  </th>
                  <th className="hidden px-4 py-3 text-caption-strong text-ink-muted-48 sm:table-cell">
                    Last updated
                  </th>
                  <th className="hidden px-4 py-3 text-caption-strong text-ink-muted-48 md:table-cell">
                    Versions
                  </th>
                  <th className="px-4 py-3 text-caption-strong text-ink-muted-48">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {workflows.map((wf) => (
                  <LibraryRow key={wf.id} workflow={wf} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function LibraryRow({ workflow }: { workflow: WorkflowListItem }) {
  const navigate = useNavigate();
  const [opening, setOpening] = useState(false);

  const open = async () => {
    setOpening(true);
    try {
      const session = await getSessionByWorkflowId(workflow.id);
      navigate({
        to: "/workspace/$sessionId",
        params: { sessionId: session.id },
      });
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) {
        const session = await createSession({
          workflowId: workflow.id,
          mode: "interactive",
        });
        navigate({
          to: "/workspace/$sessionId",
          params: { sessionId: session.id },
        });
      } else {
        setOpening(false);
      }
    }
  };

  return (
    <tr
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      role="button"
      tabIndex={0}
      className="cursor-pointer border-b border-hairline outline-none last:border-0 transition-colors hover:bg-surface-pearl/60 focus-visible:bg-surface-pearl/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset"
    >
      <td className="px-4 py-3 text-body text-ink">
        <span className="font-medium">{workflow.title}</span>
        {opening && (
          <span className="ml-2 text-caption text-ink-muted-48">Opening…</span>
        )}
      </td>
      <td className="hidden px-4 py-3 text-body text-ink-muted-48 sm:table-cell">
        {timeAgo(workflow.updated_at)}
      </td>
      <td className="hidden px-4 py-3 text-body text-ink-muted-48 md:table-cell">
        <span className="inline-flex items-center gap-1.5">
          <History className="h-3.5 w-3.5" />v{workflow.current_version}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-pill border px-2.5 py-0.5 text-caption-strong ${statusPillClass(workflow.status)}`}
        >
          {workflow.status.replace(/_/g, " ").toLowerCase()}
        </span>
      </td>
    </tr>
  );
}
