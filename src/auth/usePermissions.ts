import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getActiveOrganizationId, hydrateOrganizationContext } from "@/lib/api";
import {
  fetchUsuarioLogado,
  isTipoCampo,
  isTipoIgreja,
  type ModuloPermissao,
  type UsuarioLogado,
} from "@/lib/portalApi";

export type PermissaoAcao = "visualizar" | "criar" | "editar" | "excluir" | "aprovar";

export function usePermissions() {
  const [activeOrgId, setActiveOrgId] = useState<string | null>(() => getActiveOrganizationId());

  useEffect(() => {
    void hydrateOrganizationContext().then(() => {
      setActiveOrgId(getActiveOrganizationId());
    });
    const onOrgChanged = () => setActiveOrgId(getActiveOrganizationId());
    window.addEventListener("portal-ebd:org-changed", onOrgChanged);
    return () => window.removeEventListener("portal-ebd:org-changed", onOrgChanged);
  }, []);

  const query = useQuery({
    queryKey: ["me", activeOrgId],
    queryFn: fetchUsuarioLogado,
  });

  const usuario = query.data;

  const helpers = useMemo(() => {
    const permissoes = usuario?.permissoes ?? {};

    const can = (modulo: ModuloPermissao, acao: PermissaoAcao = "visualizar") =>
      Boolean(permissoes[modulo]?.[acao]);

    const hasRole = (...roles: string[]) => {
      const normalized = new Set((usuario?.papeis ?? []).map((p) => p.trim().toUpperCase()));
      return roles.some((role) => normalized.has(role.toUpperCase()));
    };

    return {
      usuario,
      can,
      hasRole,
      isAdminSistema: Boolean(usuario?.isAdminSistema),
      requerSelecaoContexto: Boolean(usuario?.requerSelecaoContexto),
      organizacaoAtiva: usuario?.organizacaoAtiva ?? null,
      organizacoesDisponiveis: usuario?.organizacoesDisponiveis ?? [],
      turmasProfessor: usuario?.turmasProfessor ?? [],
      contextoCampo: Boolean(usuario?.organizacaoAtiva && isTipoCampo(usuario.organizacaoAtiva.tipo)),
      contextoIgreja: Boolean(usuario?.organizacaoAtiva && isTipoIgreja(usuario.organizacaoAtiva.tipo)),
      podeCarregarOperacional: Boolean(
        usuario?.organizacaoAtiva && isTipoIgreja(usuario.organizacaoAtiva.tipo),
      ),
    };
  }, [usuario]);

  return { ...query, ...helpers, activeOrgId };
}

/** Inclui o contexto ativo na chave do React Query para dados não vazarem entre igrejas. */
export function orgQueryKey(activeOrgId: string | null, ...parts: unknown[]) {
  return [...parts, activeOrgId];
}

export function buildPermissionHelpers(usuario?: UsuarioLogado | null) {
  const permissoes = usuario?.permissoes ?? {};
  const can = (modulo: ModuloPermissao, acao: PermissaoAcao = "visualizar") =>
    Boolean(permissoes[modulo]?.[acao]);
  const hasRole = (...roles: string[]) => {
    const normalized = new Set((usuario?.papeis ?? []).map((p) => p.trim().toUpperCase()));
    return roles.some((role) => normalized.has(role.toUpperCase()));
  };
  return {
    can,
    hasRole,
    isAdminSistema: Boolean(usuario?.isAdminSistema),
    requerSelecaoContexto: Boolean(usuario?.requerSelecaoContexto),
  };
}
