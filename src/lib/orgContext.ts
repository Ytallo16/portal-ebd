/** Rotas que exigem contexto de igreja (não campo). */
const OPERATIONAL_PREFIXES = [
  "/licoes",
  "/turmas",
  "/alunos",
  "/financeiro",
  "/revistas",
] as const;

export function isOperationalPath(pathname: string) {
  return OPERATIONAL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isIgrejasPath(pathname: string) {
  return pathname === "/igrejas" || pathname.startsWith("/igrejas/");
}
