import { Fragment } from "react";
import { Moon, Sun, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
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
import { NotificationBell } from "@/components/layout/NotificationBell";
import { OrgContextSwitcher } from "@/components/layout/OrgContextSwitcher";
import { getLicoesBreadcrumbs, getLicoesPageTitle } from "@/components/layout/licoesBreadcrumbs";
import { isSomenteProfessor } from "@/lib/chamada";

function getPageTitle(pathname: string, licoesOptions?: { somenteProfessor?: boolean }) {
  const licoesTitle = getLicoesPageTitle(pathname, licoesOptions);
  if (licoesTitle) return licoesTitle;
  if (matchPath("/trimestres", pathname)) return "Lições";

  if (matchPath("/", pathname)) return "Dashboard";
  if (matchPath("/turmas", pathname)) return "Turmas";
  if (matchPath("/turmas/:id/licoes", pathname)) return "Lições";
  if (matchPath("/turmas/:id", pathname)) return "Turma";
  if (matchPath("/alunos", pathname)) return "Matriculados";
  if (matchPath("/financeiro", pathname)) return "Financeiro";
  if (matchPath("/revistas", pathname)) return "Revistas";
  if (matchPath("/igrejas", pathname)) return "Igrejas";
  if (matchPath("/configuracoes/usuarios", pathname)) return "Usuários";
  if (matchPath("/configuracoes/organizacoes/:id", pathname)) return "Organização";
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
    return [{ label: "Turmas", to: "/turmas" }, { label: "Turma" }];
  }
  if (matchPath("/turmas/:id/licoes", pathname)) {
    return [
      { label: "Turmas", to: "/turmas" },
      { label: "Turma", to: pathname.replace("/licoes", "") },
      { label: "Lições" },
    ];
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
    return [
      { label: "Configurações", to: "/configuracoes" },
      { label: "Organizações", to: "/configuracoes/organizacoes" },
      { label: "Organização" },
    ];
  }
  if (matchPath("/meu-perfil", pathname)) return [{ label: "Meu Perfil" }];
  return [{ label: "Portal EBD" }];
}

export function AppHeader() {
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { usuario: usuarioLogado, isAdminSistema, hasRole } = usePermissions();
  const licoesNavOptions = {
    somenteProfessor: isSomenteProfessor({ isAdminSistema, hasRole }),
  };
  const pageTitle = getPageTitle(location.pathname, licoesNavOptions);
  const breadcrumbs = getBreadcrumbs(location.pathname, licoesNavOptions);

  return (
    <header className="safe-area-top z-30 flex h-14 shrink-0 items-center gap-1 border-b bg-card px-2 sm:gap-1.5 sm:px-3 md:gap-2 md:px-4">
      <Button
        variant="ghost"
        size="icon"
        className="touch-target shrink-0"
        onClick={toggleSidebar}
      >
        <PanelLeft className="h-4 w-4" />
      </Button>

      <div className="min-w-0 flex-1 overflow-hidden md:overflow-visible">
        <h1
          className="truncate text-sm font-semibold leading-tight md:hidden"
          title={pageTitle}
        >
          {pageTitle}
        </h1>
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

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <div className="min-w-0 max-w-[min(32vw,7rem)] shrink sm:max-w-[9rem] md:max-w-[11rem]">
          <OrgContextSwitcher variant="header" />
        </div>

        <Button variant="ghost" size="icon" className="touch-target shrink-0" onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <NotificationBell />

        <Button
          variant="ghost"
          className="touch-target h-auto shrink-0 gap-2 px-1.5 py-1.5 sm:px-2"
          onClick={() => navigate("/meu-perfil")}
          aria-label="Meu Perfil"
        >
          <UserAvatar
            nome={usuarioLogado?.nome ?? "Usuário"}
            fotoUrl={usuarioLogado?.fotoUrl}
            className="h-8 w-8 shrink-0"
            fallbackClassName="text-xs"
          />
          <div className="hidden min-w-0 text-left md:block">
            <p className="truncate text-sm font-medium leading-tight">
              {usuarioLogado?.nome.split(" ")[0] ?? "Usuário"}
            </p>
            <p className="truncate text-xs text-muted-foreground leading-tight">
              {usuarioLogado?.papel ?? "Usuário"}
            </p>
          </div>
        </Button>
      </div>
    </header>
  );
}
