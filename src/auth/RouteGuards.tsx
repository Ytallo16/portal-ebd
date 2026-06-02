import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/auth/AuthProvider";
import { buildPermissionHelpers } from "@/auth/usePermissions";
import { OrganizationAccessBlocked } from "@/components/layout/OrganizationAccessBlocked";
import { podeGerenciarTrimestres } from "@/lib/chamada";
import { fetchUsuarioLogado, type ModuloPermissao } from "@/lib/portalApi";
import { getActiveOrganizationId, UnauthorizedError } from "@/lib/api";

const routeModules: Array<{
  prefix: string;
  modulo: ModuloPermissao;
  acao?: "visualizar";
  adminOnly?: boolean;
  gerenciarTrimestresOnly?: boolean;
}> = [
  { prefix: "/", modulo: "dashboard" },
  { prefix: "/licoes/gerenciar-trimestres", modulo: "licoes", gerenciarTrimestresOnly: true },
  { prefix: "/trimestres", modulo: "licoes", gerenciarTrimestresOnly: true },
  { prefix: "/licoes", modulo: "licoes" },
  { prefix: "/turmas", modulo: "turmas" },
  { prefix: "/alunos", modulo: "alunos" },
  { prefix: "/professores", modulo: "alunos" },
  { prefix: "/ranking/professores", modulo: "alunos" },
  { prefix: "/matriculados", modulo: "alunos" },
  { prefix: "/financeiro", modulo: "financeiro" },
  { prefix: "/revistas", modulo: "revistas" },
  { prefix: "/igrejas", modulo: "organizacoes" },
  { prefix: "/configuracoes/usuarios", modulo: "usuarios" },
  { prefix: "/configuracoes/organizacoes", modulo: "organizacoes", adminOnly: true },
  { prefix: "/configuracoes", modulo: "usuarios" },
];

function resolveRoutePermission(pathname: string) {
  const match = routeModules
    .filter((entry) => entry.prefix !== "/" || pathname === "/")
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find((entry) => pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`) || pathname.startsWith(entry.prefix));
  return match ?? null;
}

export function ProtectedRoute() {
  const { authenticated } = useAuth();
  const location = useLocation();
  const [activeOrgId, setActiveOrgId] = useState<string | null>(() => getActiveOrganizationId());

  useEffect(() => {
    const onOrgChanged = () => setActiveOrgId(getActiveOrganizationId());
    window.addEventListener("portal-ebd:org-changed", onOrgChanged);
    return () => window.removeEventListener("portal-ebd:org-changed", onOrgChanged);
  }, []);

  const { data: usuarioLogado, isLoading, isError, error } = useQuery({
    queryKey: ["me", activeOrgId],
    queryFn: fetchUsuarioLogado,
    enabled: authenticated,
    retry: false,
  });

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (isLoading) {
    return <p className="p-4 text-sm text-muted-foreground">Carregando permissões...</p>;
  }

  if (isError && error instanceof UnauthorizedError) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (usuarioLogado?.acessoBloqueado && !usuarioLogado.isAdminSistema) {
    return <OrganizationAccessBlocked motivo={usuarioLogado.motivoBloqueio} />;
  }

  const { can, isAdminSistema, hasRole } = buildPermissionHelpers(usuarioLogado);
  const aguardandoContexto =
    Boolean(usuarioLogado?.requerSelecaoContexto) && !usuarioLogado?.organizacaoAtiva;

  if (aguardandoContexto) {
    return <Outlet />;
  }

  const routePermission = resolveRoutePermission(location.pathname);

  if (routePermission) {
    const semPermissaoAdmin =
      routePermission.adminOnly && !isAdminSistema;
    const semPermissaoGerenciarTrimestres =
      routePermission.gerenciarTrimestresOnly &&
      !podeGerenciarTrimestres({ isAdminSistema, hasRole });
    const semPermissaoModulo =
      !routePermission.adminOnly &&
      !routePermission.gerenciarTrimestresOnly &&
      !isAdminSistema &&
      !can(routePermission.modulo, routePermission.acao ?? "visualizar");

    if (semPermissaoAdmin || semPermissaoGerenciarTrimestres || semPermissaoModulo) {
      if (semPermissaoGerenciarTrimestres) {
        return <Navigate to="/licoes" replace />;
      }
      const podeConfiguracoes = can("usuarios", "visualizar") || can("organizacoes", "visualizar");
      if (podeConfiguracoes && !location.pathname.startsWith("/configuracoes")) {
        return <Navigate to="/configuracoes" replace />;
      }
      if (semPermissaoAdmin && location.pathname.startsWith("/configuracoes/organizacoes")) {
        return <Navigate to="/configuracoes" replace />;
      }
      if (!podeConfiguracoes) {
        return <Outlet />;
      }
    }
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { authenticated } = useAuth();

  if (authenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
