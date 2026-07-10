import { Link } from "@tanstack/react-router";
import { Bell, Search, Settings, Sparkles } from "lucide-react";

interface TopBarProps {
  searchPlaceholder?: string;
}

export function TopBar({ searchPlaceholder = "Search workflows, sources, agents…" }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-xl">
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary shadow-[var(--shadow-glow)]">
          <Sparkles className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold tracking-tight">FlowForge</div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            AI Engine v2.4
          </div>
        </div>
      </Link>

      <nav className="ml-4 hidden items-center gap-1 md:flex">
        <Link
          to="/"
          activeOptions={{ exact: true }}
          activeProps={{ className: "text-foreground bg-surface-2" }}
          inactiveProps={{ className: "text-muted-foreground hover:text-foreground hover:bg-surface" }}
          className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
        >
          Dashboard
        </Link>

      </nav>

      <div className="ml-auto flex max-w-xl flex-1 items-center">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder={searchPlaceholder}
            className="h-9 w-full rounded-md border border-border bg-surface pl-9 pr-16 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <kbd className="absolute right-2 top-1/2 hidden -translate-y-1/2 select-none items-center rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline-flex">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button className="relative grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            3
          </span>
        </button>
        <button className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground">
          <Settings className="h-[18px] w-[18px]" />
        </button>
        <div className="ml-1 grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-primary-foreground">
          MA
        </div>
      </div>
    </header>
  );
}
