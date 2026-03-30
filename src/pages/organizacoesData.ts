export interface Organizacao {
  id: string;
  nome: string;
  sigla: string;
  tipo: "Sede" | "Filial" | "Congregação";
  cidade: string;
  uf: string;
  responsavel: string;
  membros: number;
  status: "Ativa" | "Inativa";
  parentId?: string | null;
}

export const organizacoesIniciais: Organizacao[] = [
  {
    id: "org-1",
    nome: "AD Dirceu",
    sigla: "ADD",
    tipo: "Sede",
    cidade: "Teresina",
    uf: "PI",
    responsavel: "Pr. Daniel Nascimento",
    membros: 1240,
    status: "Ativa",
    parentId: null,
  },
  {
    id: "org-2",
    nome: "AD Grande Dirceu II",
    sigla: "ADD-II",
    tipo: "Filial",
    cidade: "Teresina",
    uf: "PI",
    responsavel: "Pr. Marcos Santos",
    membros: 510,
    status: "Ativa",
    parentId: "org-1",
  },
  {
    id: "org-3",
    nome: "Congregação Vila Nova",
    sigla: "CVN",
    tipo: "Congregação",
    cidade: "Teresina",
    uf: "PI",
    responsavel: "Dc. José Ferreira",
    membros: 220,
    status: "Ativa",
    parentId: "org-1",
  },
  {
    id: "org-4",
    nome: "Congregação Cristo Vive",
    sigla: "CCV",
    tipo: "Congregação",
    cidade: "Timon",
    uf: "MA",
    responsavel: "Pb. Samuel Barbosa",
    membros: 135,
    status: "Inativa",
    parentId: "org-1",
  },
];
