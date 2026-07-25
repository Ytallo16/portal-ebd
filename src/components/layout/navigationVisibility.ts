export const ROTAS_OCULTAS_PARA_PROFESSOR = [
  "/professores",
  "/financeiro",
  "/revistas",
] as const;

export function deveExibirItemParaProfessor(
  item: { url: string },
  somenteProfessor: boolean,
) {
  return !(
    somenteProfessor &&
    ROTAS_OCULTAS_PARA_PROFESSOR.some((rota) => item.url === rota)
  );
}

export function deveExibirContextoNaSidebar(isAdminSistema: boolean) {
  return isAdminSistema;
}

export function deveExibirSeletorContextoNoHeader(somenteProfessor: boolean) {
  return !somenteProfessor;
}
