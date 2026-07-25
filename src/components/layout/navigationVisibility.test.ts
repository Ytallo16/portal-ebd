import { describe, expect, it } from "vitest";

import {
  deveExibirContextoNaSidebar,
  deveExibirItemParaProfessor,
  deveExibirSeletorContextoNoHeader,
  ROTAS_OCULTAS_PARA_PROFESSOR,
} from "@/components/layout/navigationVisibility";

describe("visibilidade da navegação por perfil", () => {
  it("exibe o contexto da sidebar somente para o usuário master", () => {
    expect(deveExibirContextoNaSidebar(true)).toBe(true);
    expect(deveExibirContextoNaSidebar(false)).toBe(false);
  });

  it("mantém a regra anterior do seletor no cabeçalho", () => {
    expect(deveExibirSeletorContextoNoHeader(true)).toBe(false);
    expect(deveExibirSeletorContextoNoHeader(false)).toBe(true);
  });

  it("oculta o item Professores para o perfil exclusivamente Professor", () => {
    const professores = { url: "/professores" };

    expect(ROTAS_OCULTAS_PARA_PROFESSOR).toContain("/professores");
    expect(deveExibirItemParaProfessor(professores, true)).toBe(false);
    expect(deveExibirItemParaProfessor(professores, false)).toBe(true);
  });
});
