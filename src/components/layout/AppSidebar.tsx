import {
  LayoutDashboard,
  BookOpen,
  CalendarRange,
  Users,
  GraduationCap,
  DollarSign,
  BookMarked,
  Settings,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import { useQuery } from "@tanstack/react-query";
import { fetchUsuarioLogado } from "@/lib/portalApi";
import { useAuth } from "@/auth/AuthProvider";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Lições", url: "/licoes", icon: BookOpen },
  { title: "Trimestres", url: "/trimestres", icon: CalendarRange },
  { title: "Turmas", url: "/turmas", icon: GraduationCap },
  { title: "Alunos", url: "/alunos", icon: Users },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Revistas", url: "/revistas", icon: BookMarked },
];

const configuracaoItems = [
  { title: "Usuários", url: "/configuracoes/usuarios" },
  { title: "Perfis e permissões", url: "/configuracoes/perfis-permissoes" },
  { title: "Trimestres", url: "/configuracoes/trimestres" },
  { title: "Organizações", url: "/configuracoes/organizacoes" },
];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { data: usuarioLogado } = useQuery({ queryKey: ["me"], queryFn: fetchUsuarioLogado });
  const isAdminGeral = Boolean(usuarioLogado?.isAdminGeral);
  const menuItems = isAdminGeral ? [] : items;
  const settingsIsActive = location.pathname.startsWith("/configuracoes");
  const [settingsOpen, setSettingsOpen] = useState(settingsIsActive);
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

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
              {menuItems.map((item) => {
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
                        onClick={closeOnMobile}
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
                      onClick={closeOnMobile}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                <SidebarMenuItem>
                  {isAdminGeral ? (
                    <div className="space-y-1">
                      <SidebarMenuButton isActive={settingsIsActive}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span className="flex-1">Configurações</span>
                      </SidebarMenuButton>
                      <SidebarMenuSub>
                        {configuracaoItems.map((item) => {
                          const isSubItemActive = location.pathname === item.url || location.pathname.startsWith(`${item.url}/`);
                          return (
                            <SidebarMenuSubItem key={item.title}>
                              <SidebarMenuSubButton asChild isActive={isSubItemActive}>
                                <NavLink
                                  to={item.url}
                                  className="hover:bg-sidebar-accent/50"
                                  activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                  onClick={closeOnMobile}
                                >
                                  <span>{item.title}</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </div>
                  ) : (
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
                            const isSubItemActive = location.pathname === item.url || location.pathname.startsWith(`${item.url}/`);
                            return (
                              <SidebarMenuSubItem key={item.title}>
                                <SidebarMenuSubButton asChild isActive={isSubItemActive}>
                                  <NavLink
                                    to={item.url}
                                    className="hover:bg-sidebar-accent/50"
                                    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                    onClick={closeOnMobile}
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
                  )}
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border px-2 py-2">
        {collapsed ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Sair"
                onClick={async () => {
                  await logout();
                  navigate("/login", { replace: true });
                }}
              >
                <LogOut className="h-4 w-4" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                if (isAdminGeral) return;
                closeOnMobile();
                navigate("/meu-perfil");
              }}
              className="w-full rounded-md p-2 text-left transition-colors hover:bg-sidebar-accent/50"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
                  {usuarioLogado?.iniciais ?? "--"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-sidebar-foreground">
                    {usuarioLogado?.nome ?? "Usuário"}
                  </p>
                  <p className="truncate text-xs text-sidebar-muted">
                    {usuarioLogado?.email ?? "sem-email"}
                  </p>
                </div>
              </div>
            </button>

            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={async () => {
                    closeOnMobile();
                    await logout();
                    navigate("/login", { replace: true });
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
