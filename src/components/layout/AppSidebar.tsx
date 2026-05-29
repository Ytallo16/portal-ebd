import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  DollarSign,
  BookMarked,
  Church,
  Settings,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { usePermissions } from "@/auth/usePermissions";
import { isSomenteProfessor } from "@/lib/chamada";
import { useAuth } from "@/auth/AuthProvider";
import type { ModuloPermissao } from "@/lib/portalApi";

const items: Array<{
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  modulo: ModuloPermissao;
  hideForProfessor?: boolean;
}> = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, modulo: "dashboard" },
  { title: "Lições", url: "/licoes", icon: BookOpen, modulo: "licoes" },
  { title: "Turmas", url: "/turmas", icon: GraduationCap, modulo: "turmas" },
  { title: "Alunos", url: "/alunos", icon: Users, modulo: "alunos" },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign, modulo: "financeiro", hideForProfessor: true },
  { title: "Revistas", url: "/revistas", icon: BookMarked, modulo: "revistas", hideForProfessor: true },
];

const configuracaoItems: Array<{
  title: string;
  url: string;
  modulo: ModuloPermissao;
  adminOnly?: boolean;
}> = [
  { title: "Usuários", url: "/configuracoes/usuarios", modulo: "usuarios" },
  { title: "Perfis e permissões", url: "/configuracoes/perfis-permissoes", modulo: "usuarios" },
  { title: "Organizações", url: "/configuracoes/organizacoes", modulo: "organizacoes", adminOnly: true },
];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { can, isAdminSistema, hasRole, usuario, organizacaoAtiva } = usePermissions();
  const somenteProfessor = isSomenteProfessor({ isAdminSistema, hasRole });
  const secretarioCampo =
    !isAdminSistema && (usuario?.papeis ?? []).some((p) => p.trim().toUpperCase() === "SECRETARIO_CAMPO");
  const showIgrejasMenu =
    (secretarioCampo || isAdminSistema) && (isAdminSistema || can("organizacoes", "visualizar"));

  const menuItems = useMemo(() => {
    const base = items.filter((item) => {
      if (item.hideForProfessor && somenteProfessor) return false;
      return isAdminSistema || can(item.modulo, "visualizar");
    });
    if (!showIgrejasMenu) {
      return base;
    }
    return [
      ...base.slice(0, 1),
      { title: "Igrejas", url: "/igrejas", icon: Church, modulo: "organizacoes" as ModuloPermissao },
      ...base.slice(1),
    ];
  }, [can, isAdminSistema, showIgrejasMenu, somenteProfessor]);
  const configItems = useMemo(
    () =>
      configuracaoItems.filter((item) =>
        item.adminOnly ? isAdminSistema : isAdminSistema || can(item.modulo, "visualizar"),
      ),
    [can, isAdminSistema],
  );
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
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="px-3 py-2">
        {!collapsed && (
          <span className="text-sm font-semibold text-sidebar-foreground">Portal EBD</span>
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

              {configItems.length > 0 && (
                collapsed ? (
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
                          {configItems.map((item) => {
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
                  </SidebarMenuItem>
                )
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
                closeOnMobile();
                navigate("/meu-perfil");
              }}
              className="w-full rounded-md p-2 text-left transition-colors hover:bg-sidebar-accent/50"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
                  {usuario?.iniciais ?? "--"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-sidebar-foreground">
                    {usuario?.nome ?? "Usuário"}
                  </p>
                  <p className="truncate text-xs text-sidebar-muted">
                    {organizacaoAtiva?.nome ?? usuario?.papel ?? "sem contexto"}
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
