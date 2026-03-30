import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  DollarSign,
  BookMarked,
  Settings,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Lições", url: "/licoes", icon: BookOpen },
  { title: "Turmas", url: "/turmas", icon: GraduationCap },
  { title: "Alunos", url: "/alunos", icon: Users },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Revistas", url: "/revistas", icon: BookMarked },
];

const configuracaoItems = [
  { title: "Usuários", url: "/configuracoes/usuarios" },
  { title: "Perfis e permissões", url: "/configuracoes/perfis-permissoes" },
  { title: "Organizações", url: "/configuracoes/organizacoes" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const settingsIsActive = location.pathname.startsWith("/configuracoes");
  const [settingsOpen, setSettingsOpen] = useState(settingsIsActive);

  useEffect(() => {
    if (settingsIsActive) {
      setSettingsOpen(true);
    }
  }, [settingsIsActive]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex items-center gap-2 px-3 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
          EBD
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-sm text-sidebar-foreground">Portal EBD</span>
            <span className="text-[11px] text-sidebar-muted">AD Dirceu</span>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = item.url === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className="hover:bg-sidebar-accent/50"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {collapsed ? (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={settingsIsActive} tooltip="Configurações">
                    <NavLink
                      to="/configuracoes"
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                <SidebarMenuItem>
                  <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={settingsIsActive}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span className="flex-1">Configurações</span>
                        <ChevronRight
                          className={cn("h-4 w-4 transition-transform", settingsOpen && "rotate-90")}
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {configuracaoItems.map((item) => {
                          const isSubItemActive = location.pathname === item.url;
                          return (
                            <SidebarMenuSubItem key={item.title}>
                              <SidebarMenuSubButton asChild isActive={isSubItemActive}>
                                <NavLink
                                  to={item.url}
                                  className="hover:bg-sidebar-accent/50"
                                  activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                >
                                  <span>{item.title}</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
