import { Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import {
  licoesDestinoAoAbrirLicao,
  licoesTrimestrePath,
  licoesTurmaPath,
} from "@/lib/licoesRoutes";
import { isSomenteProfessor } from "@/lib/chamada";
import { fetchLicaoById } from "@/lib/portalApi";

/** /licoes/:id (id legado da lição no banco) */
export function LicoesLicaoIdRedirect() {
  const { id } = useParams();
  const { activeOrgId, podeCarregarOperacional, isAdminSistema, hasRole, turmasProfessor } =
    usePermissions();
  const somenteProfessor = isSomenteProfessor({ isAdminSistema, hasRole });

  const { data: licao, isLoading, isError } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "licao-legacy", id),
    queryFn: () => fetchLicaoById(id ?? ""),
    enabled: podeCarregarOperacional && Boolean(id),
    retry: false,
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Redirecionando...</p>;
  }

  if (licao && !isError) {
    return (
      <Navigate
        to={licoesDestinoAoAbrirLicao(licao.ano, licao.trimestre, licao.numero, {
          somenteProfessor,
          turmasProfessor,
        })}
        replace
      />
    );
  }

  return <Navigate to="/licoes" replace />;
}

/** /licoes/:id/classe/:classId */
export function LicoesClasseLegacyRedirect() {
  const { id, classId } = useParams();
  const { activeOrgId, podeCarregarOperacional, isAdminSistema, hasRole, turmasProfessor } =
    usePermissions();
  const somenteProfessor = isSomenteProfessor({ isAdminSistema, hasRole });

  const { data: licao, isLoading } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "licao-legacy", id),
    queryFn: () => fetchLicaoById(id ?? ""),
    enabled: podeCarregarOperacional && Boolean(id),
    retry: false,
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Redirecionando...</p>;
  }

  if (licao && classId) {
    return (
      <Navigate
        to={licoesTurmaPath(licao.ano, licao.trimestre, licao.numero, classId)}
        replace
      />
    );
  }

  return <Navigate to="/licoes" replace />;
}
