import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/auth/AuthProvider";
import { fetchUsuarioLogado } from "@/lib/portalApi";
import { UnauthorizedError } from "@/lib/api";

export function ProtectedRoute() {
  const { authenticated } = useAuth();
  const location = useLocation();
  const { data: usuarioLogado, isLoading, isError, error } = useQuery({
    queryKey: ["me"],
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

  const isAdminGeral = Boolean(usuarioLogado?.isAdminGeral);
  const canAccessCurrentRoute = location.pathname.startsWith("/configuracoes");
  if (isAdminGeral && !canAccessCurrentRoute) {
    return <Navigate to="/configuracoes" replace />;
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
