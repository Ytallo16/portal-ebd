export const ROLE_LABELS: Record<string, string> = {
  ADMINISTRADOR: "Administrador do sistema",
  "ADMINISTRADOR GERAL": "Administrador do sistema",
  ADMINISTRADOR_GERAL: "Administrador do sistema",
  SECRETARIO_CAMPO: "Secretário de Campo",
  SECRETARIO_IGREJA: "Secretário de Igreja",
  PROFESSOR: "Professor",
};

const LEGACY_ROLE_ALIASES: Record<string, string> = {
  ADMINISTRADOR_CAMPO: "SECRETARIO_CAMPO",
  SECRETARIA: "SECRETARIO_IGREJA",
  ADMIN_IGREJA: "SECRETARIO_IGREJA",
  "SECRETÁRIO DE IGREJA": "SECRETARIO_IGREJA",
};

function humanizePapelFallback(key: string): string {
  return key
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/** Chave canônica do papel (uppercase, underscores), alinhada ao backend. */
export function normalizePapelKey(papel: string): string {
  const upper = papel.trim().toUpperCase();
  const underscored = upper.replace(/\s+/g, "_");
  return LEGACY_ROLE_ALIASES[upper] ?? LEGACY_ROLE_ALIASES[underscored] ?? underscored;
}

/** Nome legível do perfil para exibição na UI. */
export function formatPapelLabel(papel: string | null | undefined): string {
  if (!papel?.trim()) return "Usuário";

  const upper = papel.trim().toUpperCase();
  const canonical = normalizePapelKey(papel);

  return ROLE_LABELS[canonical] ?? ROLE_LABELS[upper] ?? humanizePapelFallback(canonical);
}
