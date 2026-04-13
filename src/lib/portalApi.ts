/* eslint-disable @typescript-eslint/no-explicit-any */
import { getResults, request } from "@/lib/api";
import { formatDate } from "@/lib/formatters";

export type Turma = {
  id: string;
  nome: string;
  faixaEtaria: string;
  professores: string[];
  totalAlunos: number;
  cor: string;
};

export type Aluno = {
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
};

export type Licao = {
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
};

export type Trimestre = {
  id: string;
  numero: number;
  ano: number;
  titulo: string;
  dataInicio: string;
  dataFim: string;
  quantidadeLicoes: number;
  status: "PLANEJADO" | "EM_ANDAMENTO" | "ENCERRADO";
};

export type Oferta = {
  id: string;
  data: string;
  valor: number;
  turmaId: string;
  licaoId: string;
  trimestre: number;
  ano: number;
};

export type ControleRevista = {
  id: string;
  nome: string;
  tipo: "professor" | "aluno";
  turmaId: string;
  recebeu: boolean;
  pagou: boolean;
};

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: string;
  status: "Ativo" | "Inativo";
};

export type UsuarioLogado = {
  nome: string;
  email: string;
  papel: string;
  papeis: string[];
  status: "Ativo" | "Inativo";
  iniciais: string;
  isAdminGeral: boolean;
};

export type AttendanceSheet = {
  id: string;
  lesson: string;
  classGroup: string;
  professor?: number | null;
  visitantes: number;
  biblias: number;
  revistas: number;
  ofertaValor: number;
  finalizedAt?: string | null;
  records: Array<{ id: string; student: string; alunoNome: string; presente: boolean }>;
};

function mapStatus(status: string): "Aberta" | "Finalizada" {
  return status === "FINALIZADA" ? "Finalizada" : "Aberta";
}

export async function fetchTurmas(): Promise<Turma[]> {
  const data = await request<unknown>("/classes/");
  const items = getResults<any>(data);
  return items.map((item) => ({
    id: String(item.id),
    nome: item.nome,
    faixaEtaria: item.faixa_etaria,
    professores: (item.professores ?? []).map((p: any) => p.user_nome),
    totalAlunos: item.total_alunos ?? 0,
    cor: item.cor ?? "#3B82F6",
  }));
}

export async function createTurma(payload: { nome: string; faixaEtaria: string; cor: string }) {
  return request("/classes/", {
    method: "POST",
    body: JSON.stringify({
      nome: payload.nome,
      faixa_etaria: payload.faixaEtaria,
      cor: payload.cor,
      ativa: true,
    }),
  });
}

export async function fetchAlunos(search = ""): Promise<Aluno[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const data = await request<unknown>(`/students/${query}`);
  const items = getResults<any>(data);

  return items.map((item) => ({
    id: String(item.id),
    nome: item.nome,
    sexo: item.sexo,
    dataNascimento: item.data_nascimento,
    email: item.email ?? "",
    telefone: item.telefone ?? "",
    turmaId: item.class_group ? String(item.class_group) : "",
    endereco: {
      cep: item.endereco?.cep ?? "",
      rua: item.endereco?.rua ?? "",
      numero: item.endereco?.numero ?? "",
      complemento: item.endereco?.complemento ?? "",
      bairro: item.endereco?.bairro ?? "",
      cidade: item.endereco?.cidade ?? "",
      uf: item.endereco?.uf ?? "",
    },
    responsaveis: (item.responsaveis ?? []).map((r: any) => ({ nome: r.nome, telefone: r.telefone ?? "" })),
  }));
}

export async function createAluno(payload: {
  nome: string;
  sexo: "M" | "F";
  dataNascimento: string;
  email: string;
  telefone: string;
  turmaId: string;
}) {
  return request("/students/", {
    method: "POST",
    body: JSON.stringify({
      class_group: Number(payload.turmaId),
      nome: payload.nome,
      sexo: payload.sexo,
      data_nascimento: payload.dataNascimento,
      email: payload.email,
      telefone: payload.telefone,
      ativo: true,
    }),
  });
}

export async function fetchLicoes(filters?: { trimestre?: number; ano?: number }): Promise<Licao[]> {
  const params = new URLSearchParams();
  if (filters?.trimestre) params.set("trimestre", String(filters.trimestre));
  if (filters?.ano) params.set("ano", String(filters.ano));
  const query = params.toString() ? `?${params.toString()}` : "";

  const data = await request<unknown>(`/lessons/${query}`);
  const items = getResults<any>(data);

  return items.map((item) => ({
    id: String(item.id),
    numero: item.numero,
    tema: item.tema,
    data: item.data,
    revista: item.revista,
    textoAureo: item.texto_aureo ?? "",
    textoBiblico: item.texto_biblico ?? "",
    objetivo: item.objetivo ?? "",
    status: mapStatus(item.status),
    trimestre: item.trimestre,
    ano: item.ano,
    presentes: item.presentes ?? 0,
    ausentes: item.ausentes ?? 0,
  }));
}

export async function createLicao(payload: {
  numero: number;
  trimestre: number;
  ano: number;
  data: string;
}) {
  return request("/lessons/", {
    method: "POST",
    body: JSON.stringify({
      numero: payload.numero,
      trimestre: payload.trimestre,
      ano: payload.ano,
      data: payload.data,
      tema: `Lição ${payload.numero}`,
      revista: "Lições Bíblicas",
      texto_aureo: "",
      texto_biblico: "",
      objetivo: "",
      status: "ABERTA",
    }),
  });
}

export async function fetchTrimestres(filters?: { ano?: number; numero?: number }): Promise<Trimestre[]> {
  const params = new URLSearchParams();
  if (filters?.ano) params.set("ano", String(filters.ano));
  if (filters?.numero) params.set("numero", String(filters.numero));
  const query = params.toString() ? `?${params.toString()}` : "";

  const data = await request<unknown>(`/trimesters/${query}`);
  const items = getResults<any>(data);

  return items.map((item) => ({
    id: String(item.id),
    numero: item.numero,
    ano: item.ano,
    titulo: item.titulo ?? "",
    dataInicio: item.data_inicio ?? "",
    dataFim: item.data_fim ?? "",
    quantidadeLicoes: Number(item.quantidade_licoes ?? 13),
    status: item.status ?? "PLANEJADO",
  }));
}

export async function createTrimestre(payload: {
  numero: number;
  ano: number;
  dataInicio: string;
  dataFim: string;
  quantidadeLicoes: number;
}) {
  return request("/trimesters/", {
    method: "POST",
    body: JSON.stringify({
      numero: payload.numero,
      ano: payload.ano,
      titulo: `${payload.numero}º Trimestre ${payload.ano}`,
      data_inicio: payload.dataInicio || null,
      data_fim: payload.dataFim || null,
      quantidade_licoes: payload.quantidadeLicoes,
      status: "PLANEJADO",
    }),
  });
}

export async function updateTrimestre(
  id: string,
  payload: {
    numero: number;
    ano: number;
    dataInicio: string;
    dataFim: string;
    quantidadeLicoes: number;
  },
) {
  return request(`/trimesters/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({
      numero: payload.numero,
      ano: payload.ano,
      titulo: `${payload.numero}º Trimestre ${payload.ano}`,
      data_inicio: payload.dataInicio || null,
      data_fim: payload.dataFim || null,
      quantidade_licoes: payload.quantidadeLicoes,
    }),
  });
}

export async function deleteTrimestre(id: string) {
  return request(`/trimesters/${id}/`, {
    method: "DELETE",
  });
}

export async function fetchLicaoById(id: string): Promise<Licao | null> {
  const item = await request<any>(`/lessons/${id}/`);
  if (!item) return null;
  return {
    id: String(item.id),
    numero: item.numero,
    tema: item.tema,
    data: item.data,
    revista: item.revista,
    textoAureo: item.texto_aureo ?? "",
    textoBiblico: item.texto_biblico ?? "",
    objetivo: item.objetivo ?? "",
    status: mapStatus(item.status),
    trimestre: item.trimestre,
    ano: item.ano,
    presentes: item.presentes ?? 0,
    ausentes: item.ausentes ?? 0,
  };
}

export async function fetchLicoesByTurma(turmaId: string, trimestre?: number, ano?: number): Promise<Licao[]> {
  const params = new URLSearchParams();
  if (trimestre) params.set("trimestre", String(trimestre));
  if (ano) params.set("ano", String(ano));
  const query = params.toString() ? `?${params.toString()}` : "";

  const items = await request<any[]>(`/classes/${turmaId}/lessons/${query}`);
  return (items ?? []).map((item) => ({
    id: String(item.id),
    numero: item.numero,
    tema: item.tema,
    data: item.data,
    revista: item.revista ?? "",
    textoAureo: item.texto_aureo ?? "",
    textoBiblico: item.texto_biblico ?? "",
    objetivo: item.objetivo ?? "",
    status: mapStatus(item.status),
    trimestre: item.trimestre,
    ano: item.ano,
    presentes: item.presentes ?? 0,
    ausentes: item.ausentes ?? 0,
  }));
}

export async function fetchAttendanceByLessonClass(lessonId: string, classId: string) {
  try {
    return await request<any>(`/lessons/${lessonId}/classes/${classId}/attendance`);
  } catch {
    return null;
  }
}

export async function fetchAttendanceSheets(): Promise<AttendanceSheet[]> {
  const data = await request<unknown>("/attendance-sheets/");
  const items = getResults<any>(data);
  return items.map((item) => ({
    id: String(item.id),
    lesson: String(item.lesson),
    classGroup: String(item.class_group),
    professor: item.professor,
    visitantes: item.visitantes ?? 0,
    biblias: item.biblias ?? 0,
    revistas: item.revistas ?? 0,
    ofertaValor: Number(item.oferta_valor ?? 0),
    finalizedAt: item.finalized_at,
    records: (item.records ?? []).map((r: any) => ({
      id: String(r.id),
      student: String(r.student),
      alunoNome: r.aluno_nome,
      presente: Boolean(r.presente),
    })),
  }));
}

export async function fetchOfferings(classId?: string): Promise<Oferta[]> {
  const query = classId ? `?class_id=${classId}` : "";
  const data = await request<unknown>(`/offerings/${query}`);
  const items = getResults<any>(data);

  return items.map((item) => ({
    id: String(item.id),
    data: item.data,
    valor: Number(item.valor),
    turmaId: item.class_group ? String(item.class_group) : "",
    licaoId: item.lesson ? String(item.lesson) : "",
    trimestre: 0,
    ano: Number(item.data?.slice(0, 4) ?? 0),
  }));
}

export async function fetchPublicationControls(classId?: string): Promise<ControleRevista[]> {
  const query = classId ? `?class_id=${classId}` : "";
  const data = await request<unknown>(`/publication-controls/${query}`);
  const items = getResults<any>(data);

  return items.map((item) => ({
    id: String(item.id),
    nome: item.person_name,
    tipo: item.person_type,
    turmaId: String(item.class_group),
    recebeu: Boolean(item.recebeu),
    pagou: Boolean(item.pagou),
  }));
}

export async function updatePublicationControl(id: string, payload: Partial<{ recebeu: boolean; pagou: boolean }>) {
  return request(`/publication-controls/${id}/toggle/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchUsuarios(): Promise<Usuario[]> {
  const data = await request<unknown>("/users/");
  const items = getResults<any>(data);

  return items.map((item) => ({
    id: String(item.id),
    nome: item.nome,
    email: item.email,
    papel: item.papeis?.[0] ?? "Usuário",
    status: item.is_active ? "Ativo" : "Inativo",
  }));
}

export async function toggleUserActive(userId: string) {
  return request(`/users/${userId}/toggle-active/`, { method: "POST" });
}

export async function updateUsuario(
  userId: string,
  payload: {
    nome: string;
    email: string;
    is_active: boolean;
  },
) {
  return request(`/users/${userId}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function resetUserPassword(userId: string) {
  return request(`/users/${userId}/reset-password/`, { method: "POST" });
}

export async function fetchUsuarioLogado(): Promise<UsuarioLogado> {
  const me = await request<any>("/me");
  const papeis = Array.isArray(me.papeis) ? me.papeis : [];
  const papelPrincipal = papeis[0] ?? "Usuário";
  const papeisNormalizados = papeis.map((papel: string) => papel.trim().toUpperCase());
  const isAdminGeral = papeisNormalizados.includes("ADMINISTRADOR GERAL") || papeisNormalizados.includes("ADMINISTRADOR");

  return {
    nome: me.nome,
    email: me.email,
    papel: papelPrincipal,
    papeis,
    status: me.is_active ? "Ativo" : "Inativo",
    iniciais: me.nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n: string) => n[0])
      .join("")
      .toUpperCase(),
    isAdminGeral,
  };
}

export async function fetchDashboardSummary() {
  return request<any>("/dashboard/summary");
}

export async function fetchDashboardAttendanceEvolution() {
  return request<any[]>("/dashboard/attendance-evolution");
}

export async function fetchDashboardOfferingEvolution() {
  return request<any[]>("/dashboard/offering-evolution");
}

export async function fetchDashboardClassComposition() {
  return request<any[]>("/dashboard/class-composition");
}

export async function fetchDashboardBirthdays() {
  return request<any[]>("/dashboard/birthdays");
}

export function monthLabel(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("pt-BR", { month: "short" });
}

export function weekLabel(dateStr: string): string {
  return formatDate(dateStr).slice(0, 5);
}
