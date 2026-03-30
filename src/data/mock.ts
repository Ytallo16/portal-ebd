// ============ TURMAS ============
export interface Turma {
  id: string;
  nome: string;
  faixaEtaria: string;
  professores: string[];
  totalAlunos: number;
  cor: string;
}

export const turmas: Turma[] = [
  { id: "1", nome: "Berçário", faixaEtaria: "0-2 anos", professores: ["Maria Silva"], totalAlunos: 8, cor: "#EC4899" },
  { id: "2", nome: "Jardim de Infância", faixaEtaria: "3-5 anos", professores: ["Ana Souza", "Carla Lima"], totalAlunos: 12, cor: "#F97316" },
  { id: "3", nome: "Primários", faixaEtaria: "6-8 anos", professores: ["Joana Costa"], totalAlunos: 15, cor: "#EAB308" },
  { id: "4", nome: "Juniores", faixaEtaria: "9-11 anos", professores: ["Paulo Mendes"], totalAlunos: 14, cor: "#22C55E" },
  { id: "5", nome: "Pré-Adolescentes", faixaEtaria: "12-13 anos", professores: ["Ricardo Alves"], totalAlunos: 10, cor: "#06B6D4" },
  { id: "6", nome: "Adolescentes", faixaEtaria: "14-17 anos", professores: ["Marcos Santos"], totalAlunos: 18, cor: "#3B82F6" },
  { id: "7", nome: "Jovens", faixaEtaria: "18-25 anos", professores: ["Lucas Oliveira", "Priscila Rocha"], totalAlunos: 22, cor: "#8B5CF6" },
  { id: "8", nome: "Adultos I", faixaEtaria: "26-35 anos", professores: ["José Ferreira"], totalAlunos: 25, cor: "#125A94" },
  { id: "9", nome: "Adultos II", faixaEtaria: "36-50 anos", professores: ["Antônio Pereira"], totalAlunos: 30, cor: "#068CC3" },
  { id: "10", nome: "Adultos III", faixaEtaria: "51-64 anos", professores: ["Francisco Lima"], totalAlunos: 20, cor: "#0D9488" },
  { id: "11", nome: "Terceira Idade", faixaEtaria: "65+ anos", professores: ["Benedita Carvalho"], totalAlunos: 16, cor: "#D946EF" },
  { id: "12", nome: "Novos Convertidos", faixaEtaria: "Todas as idades", professores: ["Daniel Nascimento"], totalAlunos: 9, cor: "#F43F5E" },
  { id: "13", nome: "Discipulado", faixaEtaria: "Todas as idades", professores: ["Samuel Barbosa"], totalAlunos: 11, cor: "#64748B" },
];

// ============ ALUNOS ============
export interface Aluno {
  id: string;
  nome: string;
  sexo: "M" | "F";
  dataNascimento: string;
  email: string;
  telefone: string;
  turmaId: string;
  endereco: {
    cep: string;
    rua: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
  responsaveis?: { nome: string; telefone: string }[];
}

export const alunos: Aluno[] = [
  { id: "a1", nome: "João Pedro Silva", sexo: "M", dataNascimento: "1995-03-15", email: "joao@email.com", telefone: "(86) 99901-1234", turmaId: "8", endereco: { cep: "64001-000", rua: "Rua São Pedro", numero: "123", complemento: "", bairro: "Dirceu I", cidade: "Teresina", uf: "PI" } },
  { id: "a2", nome: "Maria Eduarda Costa", sexo: "F", dataNascimento: "1988-07-22", email: "maria.e@email.com", telefone: "(86) 99902-5678", turmaId: "9", endereco: { cep: "64001-001", rua: "Rua das Flores", numero: "456", complemento: "Apt 3", bairro: "Dirceu II", cidade: "Teresina", uf: "PI" } },
  { id: "a3", nome: "Lucas Gabriel Souza", sexo: "M", dataNascimento: "2005-11-10", email: "lucas.g@email.com", telefone: "(86) 99903-9012", turmaId: "6", endereco: { cep: "64001-002", rua: "Av. Principal", numero: "789", complemento: "", bairro: "Dirceu I", cidade: "Teresina", uf: "PI" } },
  { id: "a4", nome: "Ana Clara Oliveira", sexo: "F", dataNascimento: "2000-01-28", email: "ana.c@email.com", telefone: "(86) 99904-3456", turmaId: "7", endereco: { cep: "64001-003", rua: "Rua da Paz", numero: "321", complemento: "", bairro: "Dirceu II", cidade: "Teresina", uf: "PI" } },
  { id: "a5", nome: "Pedro Henrique Lima", sexo: "M", dataNascimento: "1975-05-03", email: "pedro.h@email.com", telefone: "(86) 99905-7890", turmaId: "10", endereco: { cep: "64001-004", rua: "Rua Esperança", numero: "654", complemento: "Casa B", bairro: "Dirceu I", cidade: "Teresina", uf: "PI" } },
  { id: "a6", nome: "Isabela Fernandes", sexo: "F", dataNascimento: "2010-09-14", email: "", telefone: "(86) 99906-1234", turmaId: "5", endereco: { cep: "64001-005", rua: "Rua da Fé", numero: "987", complemento: "", bairro: "Dirceu II", cidade: "Teresina", uf: "PI" }, responsaveis: [{ nome: "Carlos Fernandes", telefone: "(86) 99900-0001" }] },
  { id: "a7", nome: "Gabriel Santos Pereira", sexo: "M", dataNascimento: "2012-04-20", email: "", telefone: "(86) 99907-5678", turmaId: "4", endereco: { cep: "64001-006", rua: "Rua Harmonia", numero: "159", complemento: "", bairro: "Dirceu I", cidade: "Teresina", uf: "PI" }, responsaveis: [{ nome: "Sandra Pereira", telefone: "(86) 99900-0002" }] },
  { id: "a8", nome: "Sofia Martins Alves", sexo: "F", dataNascimento: "1960-12-01", email: "sofia.m@email.com", telefone: "(86) 99908-9012", turmaId: "11", endereco: { cep: "64001-007", rua: "Rua Graça", numero: "753", complemento: "", bairro: "Dirceu II", cidade: "Teresina", uf: "PI" } },
  { id: "a9", nome: "Mateus Rodrigues", sexo: "M", dataNascimento: "1998-08-17", email: "mateus.r@email.com", telefone: "(86) 99909-3456", turmaId: "7", endereco: { cep: "64001-008", rua: "Rua Vitória", numero: "852", complemento: "", bairro: "Dirceu I", cidade: "Teresina", uf: "PI" } },
  { id: "a10", nome: "Laura Beatriz Nascimento", sexo: "F", dataNascimento: "1992-02-25", email: "laura.b@email.com", telefone: "(86) 99910-7890", turmaId: "8", endereco: { cep: "64001-009", rua: "Rua Alegria", numero: "147", complemento: "Apt 5", bairro: "Dirceu II", cidade: "Teresina", uf: "PI" } },
  { id: "a11", nome: "Davi Lucas Barbosa", sexo: "M", dataNascimento: "2016-06-30", email: "", telefone: "(86) 99911-1234", turmaId: "3", endereco: { cep: "64001-010", rua: "Rua Bondade", numero: "369", complemento: "", bairro: "Dirceu I", cidade: "Teresina", uf: "PI" }, responsaveis: [{ nome: "Roberto Barbosa", telefone: "(86) 99900-0003" }, { nome: "Mariana Barbosa", telefone: "(86) 99900-0004" }] },
  { id: "a12", nome: "Valentina Carvalho", sexo: "F", dataNascimento: "2002-10-08", email: "val.c@email.com", telefone: "(86) 99912-5678", turmaId: "7", endereco: { cep: "64001-011", rua: "Rua Benção", numero: "741", complemento: "", bairro: "Dirceu II", cidade: "Teresina", uf: "PI" } },
];

// ============ LIÇÕES ============
export interface Licao {
  id: string;
  numero: number;
  tema: string;
  data: string;
  revista: string;
  textoAureo: string;
  textoBiblico: string;
  objetivo: string;
  status: "Aberta" | "Finalizada";
  trimestre: number;
  ano: number;
  presentes: number;
  ausentes: number;
}

export const licoes: Licao[] = [
  { id: "l1", numero: 1, tema: "O Início da Jornada de Fé", data: "2024-01-07", revista: "Lições Bíblicas Adultos", textoAureo: "Hebreus 11:1", textoBiblico: "Gênesis 12:1-9", objetivo: "Compreender o chamado de Abraão", status: "Finalizada", trimestre: 1, ano: 2024, presentes: 165, ausentes: 45 },
  { id: "l2", numero: 2, tema: "A Promessa Divina", data: "2024-01-14", revista: "Lições Bíblicas Adultos", textoAureo: "Gênesis 15:6", textoBiblico: "Gênesis 15:1-21", objetivo: "Entender a aliança de Deus com Abraão", status: "Finalizada", trimestre: 1, ano: 2024, presentes: 172, ausentes: 38 },
  { id: "l3", numero: 3, tema: "Fé em Ação", data: "2024-01-21", revista: "Lições Bíblicas Adultos", textoAureo: "Tiago 2:17", textoBiblico: "Tiago 2:14-26", objetivo: "Praticar a fé através das obras", status: "Finalizada", trimestre: 1, ano: 2024, presentes: 158, ausentes: 52 },
  { id: "l4", numero: 4, tema: "A Oração do Justo", data: "2024-01-28", revista: "Lições Bíblicas Adultos", textoAureo: "Tiago 5:16", textoBiblico: "Tiago 5:13-20", objetivo: "Fortalecer a vida de oração", status: "Finalizada", trimestre: 1, ano: 2024, presentes: 180, ausentes: 30 },
  { id: "l5", numero: 5, tema: "O Fruto do Espírito", data: "2024-02-04", revista: "Lições Bíblicas Adultos", textoAureo: "Gálatas 5:22", textoBiblico: "Gálatas 5:16-26", objetivo: "Manifestar o fruto do Espírito", status: "Finalizada", trimestre: 1, ano: 2024, presentes: 175, ausentes: 35 },
  { id: "l6", numero: 6, tema: "Servindo ao Próximo", data: "2024-02-11", revista: "Lições Bíblicas Adultos", textoAureo: "Marcos 10:45", textoBiblico: "Marcos 10:35-45", objetivo: "Servir com humildade", status: "Finalizada", trimestre: 1, ano: 2024, presentes: 168, ausentes: 42 },
  { id: "l7", numero: 7, tema: "A Armadura de Deus", data: "2024-02-18", revista: "Lições Bíblicas Adultos", textoAureo: "Efésios 6:11", textoBiblico: "Efésios 6:10-20", objetivo: "Estar preparado espiritualmente", status: "Finalizada", trimestre: 1, ano: 2024, presentes: 182, ausentes: 28 },
  { id: "l8", numero: 8, tema: "Mordomia Cristã", data: "2024-02-25", revista: "Lições Bíblicas Adultos", textoAureo: "Mateus 25:21", textoBiblico: "Mateus 25:14-30", objetivo: "Administrar bem os talentos", status: "Finalizada", trimestre: 1, ano: 2024, presentes: 170, ausentes: 40 },
  { id: "l9", numero: 9, tema: "Santificação", data: "2024-03-03", revista: "Lições Bíblicas Adultos", textoAureo: "1 Tessalonicenses 4:3", textoBiblico: "1 Ts 4:1-12", objetivo: "Buscar a santificação", status: "Finalizada", trimestre: 1, ano: 2024, presentes: 177, ausentes: 33 },
  { id: "l10", numero: 10, tema: "A Volta de Cristo", data: "2024-03-10", revista: "Lições Bíblicas Adultos", textoAureo: "1 Ts 4:17", textoBiblico: "1 Ts 4:13-18", objetivo: "Viver na expectativa da volta de Cristo", status: "Finalizada", trimestre: 1, ano: 2024, presentes: 185, ausentes: 25 },
  { id: "l11", numero: 11, tema: "Perseverança na Fé", data: "2024-03-17", revista: "Lições Bíblicas Adultos", textoAureo: "Hebreus 10:36", textoBiblico: "Hebreus 10:32-39", objetivo: "Perseverar até o fim", status: "Aberta", trimestre: 1, ano: 2024, presentes: 160, ausentes: 50 },
  { id: "l12", numero: 12, tema: "O Grande Mandamento", data: "2024-03-24", revista: "Lições Bíblicas Adultos", textoAureo: "Mateus 22:37", textoBiblico: "Mateus 22:34-40", objetivo: "Amar a Deus e ao próximo", status: "Aberta", trimestre: 1, ano: 2024, presentes: 0, ausentes: 0 },
  { id: "l13", numero: 13, tema: "Vivendo em Comunhão", data: "2024-03-31", revista: "Lições Bíblicas Adultos", textoAureo: "Atos 2:42", textoBiblico: "Atos 2:37-47", objetivo: "Fortalecer a comunhão entre irmãos", status: "Aberta", trimestre: 1, ano: 2024, presentes: 0, ausentes: 0 },
];

// ============ OFERTAS ============
export interface Oferta {
  id: string;
  data: string;
  valor: number;
  turmaId: string;
  licaoId: string;
  trimestre: number;
  ano: number;
}

export const ofertas: Oferta[] = [
  { id: "o1", data: "2024-01-07", valor: 45.50, turmaId: "8", licaoId: "l1", trimestre: 1, ano: 2024 },
  { id: "o2", data: "2024-01-07", valor: 32.00, turmaId: "7", licaoId: "l1", trimestre: 1, ano: 2024 },
  { id: "o3", data: "2024-01-07", valor: 28.00, turmaId: "9", licaoId: "l1", trimestre: 1, ano: 2024 },
  { id: "o4", data: "2024-01-14", valor: 55.00, turmaId: "8", licaoId: "l2", trimestre: 1, ano: 2024 },
  { id: "o5", data: "2024-01-14", valor: 38.50, turmaId: "7", licaoId: "l2", trimestre: 1, ano: 2024 },
  { id: "o6", data: "2024-01-21", valor: 42.00, turmaId: "9", licaoId: "l3", trimestre: 1, ano: 2024 },
  { id: "o7", data: "2024-01-28", valor: 60.00, turmaId: "8", licaoId: "l4", trimestre: 1, ano: 2024 },
  { id: "o8", data: "2024-02-04", valor: 50.00, turmaId: "10", licaoId: "l5", trimestre: 1, ano: 2024 },
  { id: "o9", data: "2024-02-11", valor: 35.00, turmaId: "6", licaoId: "l6", trimestre: 1, ano: 2024 },
  { id: "o10", data: "2024-02-18", valor: 65.00, turmaId: "8", licaoId: "l7", trimestre: 1, ano: 2024 },
  { id: "o11", data: "2024-02-25", valor: 48.00, turmaId: "9", licaoId: "l8", trimestre: 1, ano: 2024 },
  { id: "o12", data: "2024-03-03", valor: 52.00, turmaId: "7", licaoId: "l9", trimestre: 1, ano: 2024 },
  { id: "o13", data: "2024-03-10", valor: 70.00, turmaId: "8", licaoId: "l10", trimestre: 1, ano: 2024 },
];

// ============ ANIVERSARIANTES ============
export interface Aniversariante {
  nome: string;
  data: string;
  turma: string;
  diasParaAniversario: number;
}

const hoje = new Date();
export const aniversariantes: Aniversariante[] = [
  { nome: "Maria Eduarda Costa", data: formatBirthday(0), turma: "Adultos II", diasParaAniversario: 0 },
  { nome: "Pedro Henrique Lima", data: formatBirthday(1), turma: "Adultos III", diasParaAniversario: 1 },
  { nome: "Ana Clara Oliveira", data: formatBirthday(3), turma: "Jovens", diasParaAniversario: 3 },
  { nome: "Lucas Gabriel Souza", data: formatBirthday(5), turma: "Adolescentes", diasParaAniversario: 5 },
];

function formatBirthday(daysFromNow: number): string {
  const d = new Date(hoje);
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0];
}

// ============ FREQUÊNCIA SEMANAL ============
export const frequenciaSemanal = [
  { semana: "03/03", presentes: 177, ausentes: 33 },
  { semana: "10/03", presentes: 185, ausentes: 25 },
  { semana: "17/03", presentes: 160, ausentes: 50 },
  { semana: "24/03", presentes: 172, ausentes: 38 },
];

// ============ COMPOSIÇÃO POR CLASSE ============
export const composicaoPorClasse = turmas.map((t) => ({
  nome: t.nome,
  valor: t.totalAlunos,
  cor: t.cor,
}));

// ============ REVISTAS ============
export interface ControleRevista {
  id: string;
  nome: string;
  tipo: "professor" | "aluno";
  turmaId: string;
  recebeu: boolean;
  pagou: boolean;
}

export const controleRevistas: ControleRevista[] = [
  { id: "r1", nome: "João Pedro Silva", tipo: "aluno", turmaId: "8", recebeu: true, pagou: true },
  { id: "r2", nome: "Laura Beatriz Nascimento", tipo: "aluno", turmaId: "8", recebeu: true, pagou: false },
  { id: "r3", nome: "José Ferreira", tipo: "professor", turmaId: "8", recebeu: true, pagou: true },
  { id: "r4", nome: "Maria Eduarda Costa", tipo: "aluno", turmaId: "9", recebeu: true, pagou: true },
  { id: "r5", nome: "Antônio Pereira", tipo: "professor", turmaId: "9", recebeu: true, pagou: true },
  { id: "r6", nome: "Lucas Gabriel Souza", tipo: "aluno", turmaId: "6", recebeu: false, pagou: false },
  { id: "r7", nome: "Marcos Santos", tipo: "professor", turmaId: "6", recebeu: true, pagou: false },
  { id: "r8", nome: "Ana Clara Oliveira", tipo: "aluno", turmaId: "7", recebeu: true, pagou: true },
  { id: "r9", nome: "Mateus Rodrigues", tipo: "aluno", turmaId: "7", recebeu: true, pagou: false },
  { id: "r10", nome: "Valentina Carvalho", tipo: "aluno", turmaId: "7", recebeu: false, pagou: false },
  { id: "r11", nome: "Lucas Oliveira", tipo: "professor", turmaId: "7", recebeu: true, pagou: true },
  { id: "r12", nome: "Priscila Rocha", tipo: "professor", turmaId: "7", recebeu: true, pagou: true },
];

// ============ USUÁRIOS ============
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: "Administrador" | "Secretário de Igreja" | "Secretário de Campo" | "Professor";
  status: "Ativo" | "Inativo";
}

export const usuarios: Usuario[] = [
  { id: "u1", nome: "Pastor Daniel Nascimento", email: "daniel@adebd.com", papel: "Administrador", status: "Ativo" },
  { id: "u2", nome: "Irmã Priscila Rocha", email: "priscila@adebd.com", papel: "Secretário de Igreja", status: "Ativo" },
  { id: "u3", nome: "Diácono José Ferreira", email: "jose@adebd.com", papel: "Secretário de Campo", status: "Ativo" },
  { id: "u4", nome: "Maria Silva", email: "maria.s@adebd.com", papel: "Professor", status: "Ativo" },
  { id: "u5", nome: "Ana Souza", email: "ana.s@adebd.com", papel: "Professor", status: "Ativo" },
  { id: "u6", nome: "Carlos Mendes", email: "carlos@adebd.com", papel: "Professor", status: "Inativo" },
];

// ============ USUÁRIO LOGADO ============
export const usuarioLogado = {
  nome: "Pastor Daniel Nascimento",
  email: "daniel@adebd.com",
  papel: "Administrador" as const,
  status: "Ativo" as const,
  iniciais: "DN",
};

// ============ HELPERS ============
export function getIniciais(nome: string): string {
  return nome.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

export function getTurmaNome(id: string): string {
  return turmas.find(t => t.id === id)?.nome ?? "—";
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR");
}
