import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  DollarSign,
  BookMarked,
  Church,
  Settings,
  LogOut,
  Building2,
  ClipboardList,
} from "lucide-react";
import { useMemo } from "react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { OrgContextSwitcher } from "@/components/layout/OrgContextSwitcher";
import { usePermissions } from "@/auth/usePermissions";
import { UserAvatar } from "@/components/UserAvatar";
import { isSomenteProfessor } from "@/lib/chamada";
import { useAuth } from "@/auth/AuthProvider";
import { deveExibirMenuIgrejas, type ModuloPermissao } from "@/lib/portalApi";
import {
  deveExibirContextoNaSidebar,
  deveExibirItemParaProfessor,
} from "@/components/layout/navigationVisibility";

const items: Array<{
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  modulo: ModuloPermissao;
}> = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, modulo: "dashboard" },
  { title: "Lições", url: "/licoes", icon: BookOpen, modulo: "licoes" },
  { title: "Turmas", url: "/turmas", icon: GraduationCap, modulo: "turmas" },
  { title: "Alunos", url: "/alunos", icon: Users, modulo: "alunos" },
  { title: "Professores", url: "/professores", icon: GraduationCap, modulo: "alunos" },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign, modulo: "financeiro" },
  { title: "Revistas", url: "/revistas", icon: BookMarked, modulo: "revistas" },
];

const configuracaoItems: Array<{
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  modulo: ModuloPermissao;
  adminOnly?: boolean;
  requireOrganization?: boolean;
}> = [
  { title: "Usuários", url: "/configuracoes/usuarios", icon: Users, modulo: "usuarios" },
  {
    title: "Registro de atividades",
    url: "/configuracoes/registro-atividades",
    icon: ClipboardList,
    modulo: "organizacoes",
    adminOnly: true,
    requireOrganization: true,
  },
  {
    title: "Organizações",
    url: "/configuracoes/organizacoes",
    icon: Building2,
    modulo: "organizacoes",
    adminOnly: true,
  },
];

const sectionLabelClass =
  "mb-1 h-auto px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-sidebar-muted";

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { can, isAdminSistema, hasRole, usuario, organizacaoAtiva } = usePermissions();
  const somenteProfessor = isSomenteProfessor({ isAdminSistema, hasRole });
  const exibirContextoNaSidebar = deveExibirContextoNaSidebar(isAdminSistema);
  const secretarioCampo =
    !isAdminSistema && (usuario?.papeis ?? []).some((p) => p.trim().toUpperCase() === "SECRETARIO_CAMPO");
  const showIgrejasMenu = deveExibirMenuIgrejas({
    isAdminSistema,
    secretarioCampo,
    canOrganizacoes: can("organizacoes", "visualizar"),
    organizacaoAtiva,
  });

  const menuItems = useMemo(() => {
    const base = items.filter((item) => {
      if (!deveExibirItemParaProfessor(item, somenteProfessor)) return false;
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
        (item.adminOnly ? isAdminSistema : isAdminSistema || can(item.modulo, "visualizar")) &&
        (!item.requireOrganization || Boolean(organizacaoAtiva)),
      ),
    [can, isAdminSistema, organizacaoAtiva],
  );
  const settingsIsActive = location.pathname.startsWith("/configuracoes");
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  const handleLogout = async () => {
    closeOnMobile();
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <Sidebar collapsible="offcanvas" variant="floating">
      <SidebarHeader className="gap-0 border-b border-sidebar-border/50 px-4 py-4">
        {collapsed ? (
          <button
            type="button"
            title={usuario?.nome ?? "Usuário"}
            onClick={() => {
              closeOnMobile();
              navigate("/meu-perfil");
            }}
            className="mx-auto overflow-hidden rounded-xl ring-1 ring-sidebar-border/20 transition-transform hover:scale-[1.02]"
          >
            <UserAvatar
              nome={usuario?.nome ?? "Usuário"}
              fotoUrl={usuario?.fotoUrl}
              className="h-10 w-10 rounded-xl"
              fallbackClassName="rounded-xl bg-sidebar-primary text-sidebar-primary-foreground text-xs"
            />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                closeOnMobile();
                navigate("/meu-perfil");
              }}
              className="shrink-0 overflow-hidden rounded-xl ring-1 ring-sidebar-border/20 transition-transform hover:scale-[1.02]"
            >
              <UserAvatar
                nome={usuario?.nome ?? "Usuário"}
                fotoUrl={usuario?.fotoUrl}
                className="h-11 w-11 rounded-xl"
                fallbackClassName="rounded-xl bg-sidebar-primary text-sidebar-primary-foreground text-sm"
              />
            </button>
            <button
              type="button"
              onClick={() => {
                closeOnMobile();
                navigate("/meu-perfil");
              }}
              className="min-w-0 flex-1 text-left transition-opacity hover:opacity-80"
            >
              <p className="truncate text-sm font-semibold leading-tight text-sidebar-foreground">
                {usuario?.nome ?? "Usuário"}
              </p>
              <p className="mt-0.5 truncate text-xs text-sidebar-muted">
                {somenteProfessor
                  ? usuario?.papel ?? "Professor"
                  : organizacaoAtiva?.nome ?? usuario?.papel ?? "sem contexto"}
              </p>
            </button>
          </div>
        )}
        {isMobile && !collapsed && exibirContextoNaSidebar ? (
          <div className="mt-3 w-full border-t border-sidebar-border/50 pt-3">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-sidebar-muted">
              Contexto
            </p>
            <OrgContextSwitcher variant="card" />
          </div>
        ) : null}
      </SidebarHeader>
      <SidebarContent className="gap-4 px-3 py-4">
        <SidebarGroup className="p-0">
          {!collapsed && <SidebarGroupLabel className={sectionLabelClass}>Menu</SidebarGroupLabel>}
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
                        onClick={closeOnMobile}
                      >
                        <item.icon />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {configItems.length > 0 && (
          <SidebarGroup className="p-0">
            {!collapsed && (
              <SidebarGroupLabel className={sectionLabelClass}>Configurações</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {collapsed ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={settingsIsActive} tooltip="Configurações">
                      <NavLink to={configItems[0]?.url ?? "/configuracoes/usuarios"} onClick={closeOnMobile}>
                        <Settings />
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : (
                  configItems.map((item) => {
                    const isConfigActive =
                      location.pathname === item.url || location.pathname.startsWith(`${item.url}/`);
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isConfigActive}>
                          <NavLink to={item.url} onClick={closeOnMobile}>
                            <item.icon />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t border-sidebar-border/50 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sair"
              className="text-sidebar-muted hover:text-sidebar-foreground"
              onClick={() => void handleLogout()}
            >
              <LogOut />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
