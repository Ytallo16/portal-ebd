import { Fragment } from "react";
import { Moon, Sun, Bell, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useSidebar } from "@/components/ui/sidebar";
import { Link, matchPath, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { usePermissions } from "@/auth/usePermissions";
import { OrgContextSwitcher } from "@/components/layout/OrgContextSwitcher";
import { getLicoesBreadcrumbs, getLicoesPageTitle } from "@/components/layout/licoesBreadcrumbs";
import { isSomenteProfessor } from "@/lib/chamada";
import { useAuth } from "@/auth/AuthProvider";

function getPageTitle(pathname: string, licoesOptions?: { somenteProfessor?: boolean }) {
  const licoesTitle = getLicoesPageTitle(pathname, licoesOptions);
  if (licoesTitle) return licoesTitle;
  if (matchPath("/trimestres", pathname)) return "Lições";

  if (matchPath("/", pathname)) return "Dashboard";
  if (matchPath("/turmas", pathname)) return "Turmas";
  if (matchPath("/turmas/:id/licoes", pathname)) return "Lições da Turma";
  if (matchPath("/turmas/:id", pathname)) return "Detalhes da Turma";
  if (matchPath("/alunos", pathname)) return "Matriculados";
  if (matchPath("/financeiro", pathname)) return "Financeiro";
  if (matchPath("/revistas", pathname)) return "Revistas";
  if (matchPath("/igrejas", pathname)) return "Igrejas";
  if (matchPath("/configuracoes/usuarios", pathname)) return "Usuários";
  if (matchPath("/configuracoes/organizacoes/:id", pathname)) return "Detalhes da Organização";
  if (matchPath("/configuracoes/organizacoes", pathname)) return "Organizações";
  if (matchPath("/configuracoes", pathname)) return "Configurações";
  if (matchPath("/meu-perfil", pathname)) return "Meu Perfil";
  return "Portal EBD";
}

function getBreadcrumbs(pathname: string, licoesOptions?: { somenteProfessor?: boolean }) {
  const licoesCrumbs = getLicoesBreadcrumbs(pathname, licoesOptions);
  if (licoesCrumbs) return licoesCrumbs;
  if (matchPath("/trimestres", pathname)) {
    return [{ label: "Lições", to: "/licoes" }, { label: "Gerenciar trimestres" }];
  }

  if (matchPath("/", pathname)) return [{ label: "Dashboard" }];
  if (matchPath("/turmas", pathname)) return [{ label: "Turmas" }];
  if (matchPath("/turmas/:id", pathname)) {
    return [{ label: "Turmas", to: "/turmas" }, { label: "Detalhes da Turma" }];
  }
  if (matchPath("/turmas/:id/licoes", pathname)) {
    return [{ label: "Turmas", to: "/turmas" }, { label: "Detalhes da Turma", to: pathname.replace("/licoes", "") }, { label: "Lições da Turma" }];
  }
  if (matchPath("/alunos", pathname)) return [{ label: "Matriculados" }];
  if (matchPath("/financeiro", pathname)) return [{ label: "Financeiro" }];
  if (matchPath("/revistas", pathname)) return [{ label: "Revistas" }];
  if (matchPath("/igrejas", pathname)) return [{ label: "Igrejas" }];
  if (matchPath("/configuracoes", pathname)) return [{ label: "Configurações" }];
  if (matchPath("/configuracoes/usuarios", pathname)) {
    return [{ label: "Configurações", to: "/configuracoes" }, { label: "Usuários" }];
  }
  if (matchPath("/configuracoes/organizacoes", pathname)) {
    return [{ label: "Configurações", to: "/configuracoes" }, { label: "Organizações" }];
  }
  if (matchPath("/configuracoes/organizacoes/:id", pathname)) {
    return [{ label: "Configurações", to: "/configuracoes" }, { label: "Organizações", to: "/configuracoes/organizacoes" }, { label: "Detalhes da Organização" }];
  }
  if (matchPath("/meu-perfil", pathname)) return [{ label: "Meu Perfil" }];
  return [{ label: "Portal EBD" }];
}

export function AppHeader() {
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { usuario: usuarioLogado, isAdminSistema, hasRole } = usePermissions();
  const licoesNavOptions = {
    somenteProfessor: isSomenteProfessor({ isAdminSistema, hasRole }),
  };
  const pageTitle = getPageTitle(location.pathname, licoesNavOptions);
  const breadcrumbs = getBreadcrumbs(location.pathname, licoesNavOptions);

  return (
    <header className="z-30 flex min-h-14 shrink-0 items-center gap-2 border-b bg-card px-3 py-2 md:px-4 md:py-0">
      <Button
        variant="ghost"
        size="icon"
        className="touch-target shrink-0"
        onClick={toggleSidebar}
      >
        <PanelLeft className="h-4 w-4" />
      </Button>

      <div className="min-w-0 flex-1 md:flex-none">
        <h1 className="text-base font-semibold md:hidden">{pageTitle}</h1>
        <Breadcrumb className="hidden md:block">
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <Fragment key={`${crumb.label}-${index}`}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {crumb.to ? (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.to}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end px-1 sm:px-2">
        <OrgContextSwitcher variant="header" />
      </div>

      <Button variant="ghost" size="icon" className="touch-target" onClick={toggleTheme}>
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <Button variant="ghost" size="icon" className="touch-target relative">
        <Bell className="h-5 w-5" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="touch-target flex items-center gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {usuarioLogado?.iniciais ?? "--"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium md:inline">{usuarioLogado?.nome.split(" ")[0] ?? "Usuário"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => navigate("/meu-perfil")}>Meu Perfil</DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              await logout();
              navigate("/login", { replace: true });
            }}
          >
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
