import { isTipoCampo, isTipoIgreja, type OrganizacaoContexto } from "@/lib/portalApi";

export function groupOrganizations(organizations: OrganizacaoContexto[]) {
  const campos = organizations.filter((org) => isTipoCampo(org.tipo));
  const igrejas = organizations.filter((org) => isTipoIgreja(org.tipo));
  return { campos, igrejas };
}

/** Igrejas filhas dos campos em que o usuário atua como secretário de campo. */
export function igrejasDoSecretarioCampo(organizations: OrganizacaoContexto[]) {
  const { campos, igrejas } = groupOrganizations(organizations);
  const idsCampos = new Set(campos.map((c) => c.id));
  return igrejas.filter((igreja) => igreja.parentId != null && idsCampos.has(igreja.parentId));
}

export function isSecretarioCampoUsuario(papeis: string[], isAdminSistema: boolean) {
  if (isAdminSistema) return false;
  return papeis.some((p) => p.trim().toUpperCase() === "SECRETARIO_CAMPO");
}

export function primeiroCampoDoUsuario(organizations: OrganizacaoContexto[]) {
  return groupOrganizations(organizations).campos[0] ?? null;
}
