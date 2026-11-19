import { describe, expect, it } from "vitest";

import {
  alteracoesPendentesProfessores,
  chamadaStatusLabel,
  chavePresencaProfessor,
  getChamadaTurmaStatus,
  presencaProfessoresDoServidor,
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
    teachers: [],
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

describe("presença dos professores — estado do servidor", () => {
  const turmas = [
    {
      id: "10",
      professorUsers: [{ id: 1 }, { id: 2 }],
    },
    {
      id: "20",
      professorUsers: [{ id: 2 }],
    },
  ];

  it("lê a presença de cada professor da turma separadamente", () => {
    const servidor = presencaProfessoresDoServidor({
      turmas,
      sheets: [
        {
          classGroup: "10",
          teachers: [
            { user: 1, presente: true },
            { user: 2, presente: false },
          ],
        },
      ],
    });

    expect(servidor[chavePresencaProfessor("10", 1)]).toBe(true);
    expect(servidor[chavePresencaProfessor("10", 2)]).toBe(false);
  });

  it("mantém o mesmo professor independente em cada turma", () => {
    const servidor = presencaProfessoresDoServidor({
      turmas,
      sheets: [
        { classGroup: "10", teachers: [{ user: 2, presente: false }] },
        { classGroup: "20", teachers: [{ user: 2, presente: true }] },
      ],
    });

    expect(servidor[chavePresencaProfessor("10", 2)]).toBe(false);
    expect(servidor[chavePresencaProfessor("20", 2)]).toBe(true);
  });

  it("usa o par legado da ficha quando ainda não há registro por professor", () => {
    const servidor = presencaProfessoresDoServidor({
      turmas,
      sheets: [
        {
          classGroup: "10",
          professor: 1,
          professorPresente: true,
          teachers: [],
        },
      ],
    });

    expect(servidor[chavePresencaProfessor("10", 1)]).toBe(true);
    expect(servidor[chavePresencaProfessor("10", 2)]).toBe(false);
  });

  it("trata turma sem ficha como todos ausentes", () => {
    const servidor = presencaProfessoresDoServidor({ turmas, sheets: [] });

    expect(servidor[chavePresencaProfessor("10", 1)]).toBe(false);
    expect(servidor[chavePresencaProfessor("20", 2)]).toBe(false);
  });
});

describe("presença dos professores — alterações pendentes", () => {
  const servidor = {
    "10:1": true,
    "10:2": false,
  };

  it("não acusa pendência quando o valor volta ao do servidor", () => {
    expect(
      alteracoesPendentesProfessores(servidor, { "10:1": true }),
    ).toEqual([]);
  });

  it("lista apenas as chaves que realmente mudaram", () => {
    expect(
      alteracoesPendentesProfessores(servidor, {
        "10:1": false,
        "10:2": false,
      }),
    ).toEqual(["10:1"]);
  });

  it("considera pendente marcar professor que o servidor não conhece", () => {
    expect(
      alteracoesPendentesProfessores(servidor, { "30:9": true }),
    ).toEqual(["30:9"]);
  });
});
