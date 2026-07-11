import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Sparkles, LibraryBig } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/brand-dna", label: "Brand DNA", icon: Sparkles },
  { to: "/library", label: "Library", icon: LibraryBig },
] as const;

function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            M
          </div>
          <span className="text-sm font-semibold tracking-tight text-ink group-data-[collapsible=icon]:hidden">
            Manbaa
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.to)}
                  >
                    <Link to={item.to}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

/** Shared authenticated shell: sidebar (Dashboard/Brand DNA/Library) + content area. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-3 md:hidden">
          <SidebarTrigger />
          <span className="text-sm font-semibold text-ink">Manbaa</span>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
