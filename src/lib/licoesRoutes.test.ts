import { describe, expect, it } from "vitest";

import { licoesRegistroTurmaPath } from "@/lib/licoesRoutes";

describe("rota da ficha da EBD", () => {
  it("leva diretamente à frequência e aos totais da turma", () => {
    expect(licoesRegistroTurmaPath(2026, 3, 7, 42)).toBe(
      "/licoes/2026/3/7/turmas/42",
    );
  });
});
