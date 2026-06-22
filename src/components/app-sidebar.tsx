import { Link, useRouterState } from "@tanstack/react-router";
import {
  Handshake,
  BookOpenCheck,
  Wrench,
  ShieldAlert,
  Crown,
  Sparkles,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const LEVELS = [
  { to: "/l6", label: "L6 · Diplomacy", icon: Handshake, hint: "Orchestrator" },
  { to: "/l7", label: "L7 · Knowledge OS", icon: BookOpenCheck, hint: "Hypotheses" },
  { to: "/l8", label: "L8 · Creator", icon: Wrench, hint: "Reality ledger" },
  { to: "/l9", label: "L9 · Sentinel", icon: ShieldAlert, hint: "Autonomous" },
  { to: "/l10", label: "L10 · Supreme", icon: Crown, hint: "Orchestrator" },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg glass ring-cyber">
            <Sparkles className="h-4 w-4 text-cyber-cyan" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-wide">
                MALEKA <span className="text-cyber">Ω</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Sovereign OS
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Command levels</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {LEVELS.map((item) => {
                const active = pathname.startsWith(item.to);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                      <Link
                        to={item.to}
                        className="group flex items-center gap-2 transition-all duration-300"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <span className="flex flex-1 items-baseline justify-between">
                            <span>{item.label}</span>
                            <span className="text-[10px] text-muted-foreground/70">
                              {item.hint}
                            </span>
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 py-3">
        {!collapsed ? (
          <div className="glass rounded-lg px-3 py-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyber-cyan" />
              Kernel online
            </div>
            <div className="mt-0.5 font-mono text-[10px] opacity-70">v0.9 · sim</div>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyber-cyan" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
