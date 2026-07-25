import { describe, expect, it } from "vitest";

import {
  chamadaStatusLabel,
  getChamadaTurmaStatus,
  selecionarAlvoFrequenciaProfessor,
} from "@/lib/chamada";
import type { AttendanceSheet } from "@/lib/portalApi";

function sheet(
  status: AttendanceSheet["status"],
  finalizedAt: string | null,
): AttendanceSheet {
  return {
    id: "1",
    lesson: "2",
    classGroup: "3",
    status,
    professor: null,
    visitantes: 0,
    biblias: 0,
    revistas: 0,
    ofertaValor: 0,
    finalizedAt,
    records: [],
  };
}

describe("status da chamada", () => {
  it("distingue não iniciada, rascunho e concluída", () => {
    expect(getChamadaTurmaStatus(null)).toBe("nao_iniciada");
    expect(getChamadaTurmaStatus(sheet("RASCUNHO", null))).toBe("rascunho");
    expect(
      getChamadaTurmaStatus(
        sheet("CONCLUIDA", "2026-07-24T12:00:00Z"),
      ),
    ).toBe("concluida");
  });

  it("expõe rótulos claros para os três estados", () => {
    expect(chamadaStatusLabel).toEqual({
      nao_iniciada: "Não iniciada",
      rascunho: "Rascunho",
      concluida: "Concluída",
    });
  });
});

describe("alvo da frequência do professor", () => {
  const adulto = {
    classGroupId: "10",
    turmaNome: "Adultos",
    presente: true,
  };
  const jovem = {
    classGroupId: "20",
    turmaNome: "Jovens",
    presente: false,
  };

  it("usa automaticamente a única turma disponível", () => {
    expect(selecionarAlvoFrequenciaProfessor([adulto])).toBe(adulto);
  });

  it("não escolhe implicitamente quando o professor possui várias turmas", () => {
    expect(
      selecionarAlvoFrequenciaProfessor([adulto, jovem]),
    ).toBeUndefined();
    expect(
      selecionarAlvoFrequenciaProfessor([adulto, jovem], "20"),
    ).toBe(jovem);
    expect(
      selecionarAlvoFrequenciaProfessor([adulto, jovem], "20")?.presente,
    ).toBe(false);
  });
});
