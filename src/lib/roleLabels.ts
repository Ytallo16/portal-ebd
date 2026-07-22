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
  // Variantes que chegam já como texto de exibição (com "de"/"do"), para não
  // caírem no fallback e virarem "Secretário De Campo" / "Administrador Do Sistema".
  ADMINISTRADOR_DO_SISTEMA: "ADMINISTRADOR",
  "ADMINISTRADOR DO SISTEMA": "ADMINISTRADOR",
  SECRETARIO_DE_CAMPO: "SECRETARIO_CAMPO",
  "SECRETÁRIO DE CAMPO": "SECRETARIO_CAMPO",
  SECRETARIO_DE_IGREJA: "SECRETARIO_IGREJA",
};

// Conectores que devem permanecer em minúsculo em nomes de papéis.
const CONECTORES = new Set(["de", "do", "da", "dos", "das", "e"]);

function humanizePapelFallback(key: string): string {
  return key
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && CONECTORES.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
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
