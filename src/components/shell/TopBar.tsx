import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  ChevronLeft,
  Menu,
  MoreVertical,
  PanelLeft,
  PanelRight,
  Settings2,
  Share2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ShareWorkflowModal } from "@/features/workspace/components/ShareWorkflowModal";
import { cn } from "@/lib/utils";

function Monogram() {
  return (
    <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
      M
    </div>
  );
}

interface DashboardTopBarProps {
  variant?: "dashboard";
}

interface MinimalTopBarProps {
  variant: "minimal";
  title?: string;
}

interface WorkspaceTopBarProps {
  variant: "workspace";
  workflowId?: string;
  projectName: string;
  onRenameProject?: (name: string) => void;
  sourcesOpen?: boolean;
  onToggleSources?: () => void;
  resultsOpen?: boolean;
  onToggleResults?: () => void;
}

type TopBarProps =
  | DashboardTopBarProps
  | MinimalTopBarProps
  | WorkspaceTopBarProps;

export function TopBar(props: TopBarProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (props.variant === "minimal") {
    return (
      <header className="sticky top-0 z-50 flex h-12 shrink-0 items-center gap-2.5 bg-surface-black px-4">
        <Link to="/" className="flex items-center gap-2">
          <Monogram />
          <span className="text-sm font-semibold tracking-tight text-body-on-dark">
            Manbaa
          </span>
        </Link>
        {props.title ? (
          <span className="min-w-0 truncate text-sm text-body-on-dark/60">
            {props.title}
          </span>
        ) : null}
      </header>
    );
  }

  if (props.variant === "workspace") {
    return (
      <>
        <header className="sticky top-0 z-50 flex h-12 shrink-0 items-center gap-1 bg-surface-black px-2 sm:px-3">
          <Link
            to="/"
            aria-label="Back to dashboard"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-body-on-dark transition-colors active:scale-90 hover:bg-white/10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>

          <EditableProjectName
            name={props.projectName}
            onRename={props.onRenameProject}
          />

          {/* Tablet: Sources is the only collapsible side panel now - Board is the
              always-visible primary view at every breakpoint per RULE 3. */}
          <button
            type="button"
            onClick={props.onToggleSources}
            aria-label="Toggle sources panel"
            aria-pressed={props.sourcesOpen}
            className={cn(
              "hidden h-9 w-9 place-items-center rounded-md text-body-on-dark transition-colors active:scale-90 hover:bg-white/10 md:grid lg:hidden",
              props.sourcesOpen && "bg-white/10",
            )}
          >
            <PanelLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={props.onToggleResults}
            aria-label="Toggle AI results panel"
            aria-pressed={props.resultsOpen}
            className={cn(
              "hidden h-9 w-9 place-items-center rounded-md text-body-on-dark transition-colors active:scale-90 hover:bg-white/10 md:grid xl:hidden",
              props.resultsOpen && "bg-white/10",
            )}
          >
            <PanelRight className="h-4 w-4" />
          </button>

          <div className="ml-auto hidden items-center gap-1.5 md:flex">
            {props.workflowId ? (
              <ShareButton workflowId={props.workflowId} />
            ) : null}
            <button
              type="button"
              aria-label="Workspace settings"
              className="grid h-9 w-9 place-items-center rounded-md text-body-on-dark transition-colors active:scale-90 hover:bg-white/10"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile: 3-dot menu collapses Share/Settings behind a sheet */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Workspace menu"
            className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-md text-body-on-dark transition-colors active:scale-90 hover:bg-white/10 md:hidden"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </header>

        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle className="truncate">{props.projectName}</SheetTitle>
            </SheetHeader>
            <div className="mt-6 flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  props.onToggleSources?.();
                  setMobileNavOpen(false);
                }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-foreground transition-colors active:scale-[0.98] hover:bg-surface-2"
              >
                <PanelLeft className="h-4 w-4" /> Sources
              </button>
              <button
                type="button"
                onClick={() => {
                  props.onToggleResults?.();
                  setMobileNavOpen(false);
                }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-foreground transition-colors active:scale-[0.98] hover:bg-surface-2"
              >
                <PanelRight className="h-4 w-4" /> AI Results
              </button>
              {props.workflowId ? (
                <ShareButton
                  workflowId={props.workflowId}
                  fullWidth
                  onDone={() => setMobileNavOpen(false)}
                />
              ) : null}
              <button
                type="button"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-foreground transition-colors active:scale-[0.98] hover:bg-surface-2"
              >
                <Settings2 className="h-4 w-4" /> Settings
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // dashboard (default)
  return (
    <>
      <header className="sticky top-0 z-50 flex h-12 shrink-0 items-center gap-3 bg-surface-black px-4">
        <Link to="/" className="flex items-center gap-2">
          <Monogram />
          <span className="text-sm font-semibold tracking-tight text-body-on-dark">
            Manbaa
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-body-on-dark bg-white/10" }}
            inactiveProps={{
              className:
                "text-body-on-dark/60 hover:text-body-on-dark hover:bg-white/10",
            }}
            className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors active:scale-[0.98]"
          >
            Dashboard
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label="Notifications"
            className="relative hidden h-9 w-9 place-items-center rounded-md text-body-on-dark transition-colors active:scale-90 hover:bg-white/10 md:grid"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              3
            </span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Account menu"
                className="hidden transition-transform active:scale-90 md:grid"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                    MA
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            className="grid h-9 w-9 place-items-center rounded-md text-body-on-dark transition-colors active:scale-90 hover:bg-white/10 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Monogram />
              Manbaa
            </SheetTitle>
          </SheetHeader>
          <nav className="mt-6 flex flex-col gap-1">
            <Link
              to="/"
              onClick={() => setMobileNavOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors active:scale-[0.98] hover:bg-surface-2"
            >
              Dashboard
            </Link>
            <button
              type="button"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-foreground transition-colors active:scale-[0.98] hover:bg-surface-2"
            >
              <Settings2 className="h-4 w-4" /> Settings
            </button>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}

function ShareButton({
  workflowId,
  fullWidth,
  onDone,
}: {
  workflowId: string;
  fullWidth?: boolean;
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-sm bg-ink px-3 py-1.5 text-xs font-medium text-body-on-dark transition-colors active:scale-95 hover:bg-ink/80",
          fullWidth &&
            "w-full justify-start rounded-md bg-transparent px-3 py-2 text-sm text-foreground hover:bg-surface-2",
        )}
      >
        <Share2 className="h-3.5 w-3.5" /> Share
      </button>
      <ShareWorkflowModal
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) onDone?.();
        }}
        workflowId={workflowId}
      />
    </>
  );
}

function EditableProjectName({
  name,
  onRename,
}: {
  name: string;
  onRename?: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);

  useEffect(() => {
    setValue(name);
  }, [name]);

  const commit = () => {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed && trimmed !== name) {
      onRename?.(trimmed);
    } else {
      setValue(name);
    }
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            setValue(name);
            setEditing(false);
          }
        }}
        className="min-w-0 flex-1 rounded-md border border-white/20 bg-white/5 px-2 py-1 text-sm text-body-on-dark outline-none focus:border-primary-on-dark"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => onRename && setEditing(true)}
      disabled={!onRename}
      title={onRename ? "Click to rename" : undefined}
      className="min-w-0 flex-1 truncate rounded-md px-2 py-1 text-left text-sm text-body-on-dark transition-colors active:scale-[0.98] hover:bg-white/10 disabled:active:scale-100 disabled:hover:bg-transparent"
    >
      {name}
    </button>
  );
}
