import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/auth/AuthProvider";
import { fetchUsuarioLogado } from "@/lib/portalApi";

export function ProtectedRoute() {
  const { authenticated } = useAuth();
  const location = useLocation();
  const { data: usuarioLogado, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: fetchUsuarioLogado,
    enabled: authenticated,
  });

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (isLoading) {
    return <p className="p-4 text-sm text-muted-foreground">Carregando permissões...</p>;
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
