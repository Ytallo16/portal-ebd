import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildPermissionHelpers } from "@/auth/usePermissions";
import { igrejasDoSecretarioCampo } from "@/lib/orgContextSelection";
import {
  deveExibirMenuIgrejas,
  deveExibirSeletorIgrejasNoHeader,
  confirmarImportacaoAlunos,
  desfazerImportacaoAlunos,
  fetchAlunosPage,
  fetchProfessorDashboard,
  fetchTurmas,
  isInstanciaCampo,
  isInstanciaIgrejaIndividual,
  isTipoCampo,
  isTipoIgreja,
  saveAttendanceRegistration,
  updateTurma,
  type OrganizacaoContexto,
  type UsuarioLogado,
} from "@/lib/portalApi";

describe("turmas — leitura e edição", () => {
  const fetchMock = vi.fn();

  function jsonResponse(body: unknown) {
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify(body),
      json: async () => body,
    } as unknown as Response;
  }

  beforeEach(() => {
    localStorage.setItem("portal_ebd_user_email", "sec@test.com");
    localStorage.setItem("portal_ebd_org_id_sec@test.com", "7");
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("mapeia o status ativo da turma", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        {
          id: 3,
          nome: "Adultos",
          faixa_etaria: "18+ anos",
          cor: "#111111",
          ativa: false,
          total_alunos: 4,
          professores: [{ id: 9, user: 2, user_nome: "Ana" }],
        },
      ]),
    );

    const [turma] = await fetchTurmas();
    expect(turma).toMatchObject({ id: "3", ativa: false, cor: "#111111", totalAlunos: 4 });
    expect(turma.professorUsers).toEqual([{ id: 2, nome: "Ana", linkId: "9" }]);
  });

  it("envia PATCH com os campos da turma em snake_case", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 3 }));

    await updateTurma("3", {
      nome: "Jovens",
      faixaEtaria: "15 a 17 anos",
      cor: "#22C55E",
      ativa: true,
    });

    const [requestUrl, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
    expect(requestUrl).toContain("/classes/3/");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({
      nome: "Jovens",
      faixa_etaria: "15 a 17 anos",
      cor: "#22C55E",
      ativa: true,
    });
  });

  it("salva ficha e presenças juntas no endpoint direto", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        id: 12,
        lesson: 4,
        class_group: 8,
        status: "CONCLUIDA",
        finalized_at: "2026-07-24T12:00:00Z",
        records: [{ id: 1, student: 31, aluno_nome: "Ana", presente: true }],
      }),
    );

    const result = await saveAttendanceRegistration({
      lessonId: "4",
      classGroupId: "8",
      status: "CONCLUIDA",
      professor: 5,
      visitantes: 2,
      biblias: 10,
      revistas: 8,
      ofertaValor: 25.5,
      records: [{ student: "31", presente: true }],
    });

    const [requestUrl, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
    expect(requestUrl).toContain("/lessons/4/classes/8/attendance");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toMatchObject({
      status: "CONCLUIDA",
      professor: 5,
      visitantes: 2,
      biblias: 10,
      revistas: 8,
      oferta_valor: "25.5",
      records: [{ student: 31, presente: true }],
    });
    expect(result).toMatchObject({
      id: "12",
      status: "CONCLUIDA",
      finalizedAt: "2026-07-24T12:00:00Z",
    });
  });

  it("busca alunos com paginação e pesquisa no servidor", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        count: 49,
        results: [
          {
            id: 31,
            nome: "Maria Silva",
            sexo: "F",
            data_nascimento: "2001-05-20",
            class_group: 8,
            is_active: true,
            deleted_at: null,
          },
        ],
      }),
    );

    const result = await fetchAlunosPage({
      search: "Maria",
      page: 2,
      pageSize: 24,
    });

    const [requestUrl] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
    expect(requestUrl).toContain("/students/?");
    expect(requestUrl).toContain("search=Maria");
    expect(requestUrl).toContain("page=2");
    expect(requestUrl).toContain("page_size=24");
    expect(result).toMatchObject({
      page: 2,
      pageSize: 24,
      total: 49,
      totalPages: 3,
    });
    expect(result.items[0]).toMatchObject({
      id: "31",
      nome: "Maria Silva",
      turmaId: "8",
      isActive: true,
    });
  });

  it("confirma e desfaz um lote pelos endpoints imutáveis do lote", async () => {
    const response = {
      fase: "CONFIRMACAO",
      lote_id: "abc-123",
      status_lote: "CONFIRMED",
      resultados: [],
    };
    fetchMock.mockResolvedValue(jsonResponse(response));

    await confirmarImportacaoAlunos("abc-123");
    await desfazerImportacaoAlunos("abc-123");

    const confirmCall = fetchMock.mock.calls.at(-2) as [string, RequestInit];
    const undoCall = fetchMock.mock.calls.at(-1) as [string, RequestInit];
    expect(confirmCall[0]).toContain("/students/import/abc-123/confirm/");
    expect(confirmCall[1].method).toBe("POST");
    expect(undoCall[0]).toContain("/students/import/abc-123/undo/");
    expect(undoCall[1].method).toBe("POST");
  });

  it("preserva a turma de cada alerta de aula de hoje do professor", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        turmas_disponiveis: [
          { id: 8, nome: "Adultos", cor: "#111111" },
          { id: 9, nome: "Jovens", cor: "#222222" },
        ],
        turma: {
          id: 8,
          nome: "Adultos",
          cor: "#111111",
          total_alunos: 12,
        },
        trimestre: null,
        resumo: {},
        licoes_hoje: [
          {
            id: 4,
            numero: 7,
            tema: "Lição de hoje",
            data: "2026-07-24",
            trimestre: 3,
            ano: 2026,
            turma_id: 8,
            turma_nome: "Adultos",
            registrada: false,
          },
          {
            id: 4,
            numero: 7,
            tema: "Lição de hoje",
            data: "2026-07-24",
            trimestre: 3,
            ano: 2026,
            turma_id: 9,
            turma_nome: "Jovens",
            registrada: true,
          },
        ],
      }),
    );

    const dashboard = await fetchProfessorDashboard();

    expect(dashboard.licoesHoje).toEqual([
      expect.objectContaining({
        id: 4,
        turmaId: 8,
        turmaNome: "Adultos",
        registrada: false,
      }),
      expect.objectContaining({
        id: 4,
        turmaId: 9,
        turmaNome: "Jovens",
        registrada: true,
      }),
    ]);
  });
});

describe("buildPermissionHelpers", () => {
  it("identifica admin do sistema e permissões", () => {
    const usuario: UsuarioLogado = {
      id: "1",
      nome: "Admin",
      email: "admin@test.com",
      fotoUrl: null,
      papel: "Administrador do sistema",
      papeis: ["ADMINISTRADOR"],
      status: "Ativo",
      iniciais: "AD",
      isAdminGeral: true,
      isAdminSistema: true,
      requerSelecaoContexto: true,
      organizacaoAtiva: null,
      organizacoesDisponiveis: [],
      permissoes: {
        usuarios: { visualizar: true, criar: true, editar: true, excluir: true, aprovar: true },
      },
      turmasProfessor: [],
      acessoBloqueado: false,
      motivoBloqueio: null,
    };

    const { isAdminSistema, can, hasRole } = buildPermissionHelpers(usuario);
    expect(isAdminSistema).toBe(true);
    expect(hasRole("ADMINISTRADOR")).toBe(true);
    expect(can("usuarios", "editar")).toBe(true);
    expect(can("turmas", "criar")).toBe(false);
  });

  it("respeita matriz do professor", () => {
    const usuario: UsuarioLogado = {
      id: "2",
      nome: "Professor",
      email: "prof@test.com",
      fotoUrl: null,
      papel: "Professor",
      papeis: ["PROFESSOR"],
      status: "Ativo",
      iniciais: "PR",
      isAdminGeral: false,
      isAdminSistema: false,
      requerSelecaoContexto: false,
      organizacaoAtiva: {
        id: 1,
        nome: "AD Dirceu",
        tipo: "IGREJA",
        formato: "",
        parentId: 2,
        parentNome: "Campo",
      },
      organizacoesDisponiveis: [],
      permissoes: {
        frequencia: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: false },
        turmas: { visualizar: true, criar: false, editar: false, excluir: false, aprovar: false },
      },
      turmasProfessor: [{ id: 10, nome: "Adultos" }],
      acessoBloqueado: false,
      motivoBloqueio: null,
    };

    const { can } = buildPermissionHelpers(usuario);
    expect(can("frequencia", "editar")).toBe(true);
    expect(can("turmas", "criar")).toBe(false);
  });
});

describe("seleção de contexto — secretário de campo", () => {
  it("lista só igrejas do campo do usuário", () => {
    const orgs: OrganizacaoContexto[] = [
      { id: 1, nome: "Campo PI", tipo: "CAMPO", formato: "CAMPO", parentId: null, parentNome: null },
      { id: 2, nome: "AD Dirceu", tipo: "IGREJA", formato: "", parentId: 1, parentNome: "Campo PI" },
      { id: 3, nome: "AD Centro", tipo: "IGREJA", formato: "", parentId: 1, parentNome: "Campo PI" },
    ];
    const filtradas = igrejasDoSecretarioCampo(orgs);
    expect(filtradas.map((o) => o.id)).toEqual([2, 3]);
  });
});

describe("tipos de organização", () => {
  it("reconhece campo e igreja (incluindo legado)", () => {
    expect(isTipoCampo("CAMPO")).toBe(true);
    expect(isTipoCampo("SEDE")).toBe(true);
    expect(isTipoIgreja("IGREJA")).toBe(true);
    expect(isTipoIgreja("FILIAL")).toBe(true);
    expect(isTipoCampo("IGREJA")).toBe(false);
  });

  it("distingue instância campo e igreja individual pelo formato", () => {
    const campo: OrganizacaoContexto = {
      id: 1,
      nome: "Campo PI",
      tipo: "CAMPO",
      formato: "CAMPO",
      parentId: null,
      parentNome: null,
    };
    const igrejaIndividual: OrganizacaoContexto = {
      id: 9,
      nome: "AD Standalone",
      tipo: "IGREJA",
      formato: "IGREJA_INDIVIDUAL",
      parentId: null,
      parentNome: null,
    };
    expect(isInstanciaCampo(campo)).toBe(true);
    expect(isInstanciaIgrejaIndividual(campo)).toBe(false);
    expect(isInstanciaCampo(igrejaIndividual)).toBe(false);
    expect(isInstanciaIgrejaIndividual(igrejaIndividual)).toBe(true);
  });
});

describe("menu Igrejas e seletor no header (admin)", () => {
  const campo: OrganizacaoContexto = {
    id: 1,
    nome: "Campo PI",
    tipo: "CAMPO",
    formato: "CAMPO",
    parentId: null,
    parentNome: null,
  };
  const igrejaIndividual: OrganizacaoContexto = {
    id: 9,
    nome: "AD Standalone",
    tipo: "IGREJA",
    formato: "IGREJA_INDIVIDUAL",
    parentId: null,
    parentNome: null,
  };

  const adminBase = {
    isAdminSistema: true,
    secretarioCampo: false,
    canOrganizacoes: true,
  };

  it("exibe menu Igrejas e seletor quando a instância ativa é CAMPO", () => {
    expect(deveExibirMenuIgrejas({ ...adminBase, organizacaoAtiva: campo })).toBe(true);
    expect(deveExibirSeletorIgrejasNoHeader(campo)).toBe(true);
  });

  it("oculta menu Igrejas e seletor em igreja individual", () => {
    expect(deveExibirMenuIgrejas({ ...adminBase, organizacaoAtiva: igrejaIndividual })).toBe(false);
    expect(deveExibirSeletorIgrejasNoHeader(igrejaIndividual)).toBe(false);
  });

  it("mantém seletor ao operar visão de igreja filha do campo", () => {
    const igrejaDoCampo: OrganizacaoContexto = {
      id: 2,
      nome: "AD Dirceu",
      tipo: "IGREJA",
      formato: "",
      parentId: 1,
      parentNome: "Campo PI",
    };
    expect(deveExibirMenuIgrejas({ ...adminBase, organizacaoAtiva: igrejaDoCampo })).toBe(false);
    expect(deveExibirSeletorIgrejasNoHeader(igrejaDoCampo)).toBe(true);
  });
});
