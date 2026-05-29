import { describe, expect, it } from "vitest";

import { buildPermissionHelpers } from "@/auth/usePermissions";
import { igrejasDoSecretarioCampo } from "@/lib/orgContextSelection";
import { isTipoCampo, isTipoIgreja, type OrganizacaoContexto, type UsuarioLogado } from "@/lib/portalApi";

describe("buildPermissionHelpers", () => {
  it("identifica admin do sistema e permissões", () => {
    const usuario: UsuarioLogado = {
      nome: "Admin",
      email: "admin@test.com",
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
    };

    const { isAdminSistema, can, hasRole } = buildPermissionHelpers(usuario);
    expect(isAdminSistema).toBe(true);
    expect(hasRole("ADMINISTRADOR")).toBe(true);
    expect(can("usuarios", "editar")).toBe(true);
    expect(can("turmas", "criar")).toBe(false);
  });

  it("respeita matriz do professor", () => {
    const usuario: UsuarioLogado = {
      nome: "Professor",
      email: "prof@test.com",
      papel: "Professor",
      papeis: ["PROFESSOR"],
      status: "Ativo",
      iniciais: "PR",
      isAdminGeral: false,
      isAdminSistema: false,
      requerSelecaoContexto: false,
      organizacaoAtiva: { id: 1, nome: "AD Dirceu", tipo: "IGREJA", parentId: 2, parentNome: "Campo" },
      organizacoesDisponiveis: [],
      permissoes: {
        frequencia: { visualizar: true, criar: true, editar: true, excluir: false, aprovar: false },
        turmas: { visualizar: true, criar: false, editar: false, excluir: false, aprovar: false },
      },
      turmasProfessor: [{ id: 10, nome: "Adultos" }],
    };

    const { can } = buildPermissionHelpers(usuario);
    expect(can("frequencia", "editar")).toBe(true);
    expect(can("turmas", "criar")).toBe(false);
  });
});

describe("seleção de contexto — secretário de campo", () => {
  it("lista só igrejas do campo do usuário", () => {
    const orgs: OrganizacaoContexto[] = [
      { id: 1, nome: "Campo PI", tipo: "CAMPO", parentId: null, parentNome: null },
      { id: 2, nome: "AD Dirceu", tipo: "IGREJA", parentId: 1, parentNome: "Campo PI" },
      { id: 3, nome: "AD Centro", tipo: "IGREJA", parentId: 1, parentNome: "Campo PI" },
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
});
