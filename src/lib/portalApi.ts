/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiError, getResults, request } from "@/lib/api";
import { formatDate } from "@/lib/formatters";
import { formatPapelLabel } from "@/lib/roleLabels";

export type TurmaProfessor = {
  id: number;
  nome: string;
  linkId: string;
};

export type Turma = {
  id: string;
  nome: string;
  faixaEtaria: string;
  professores: string[];
  professorUsers: TurmaProfessor[];
  totalAlunos: number;
  cor: string;
};

export type MatriculadoTipo = "ALUNO" | "PROFESSOR";

export type Matriculado = {
  id: string;
  nome: string;
  turmaId: string;
  turmaNome: string;
  tipo: MatriculadoTipo;
  alunoId?: string;
};

export function buildMatriculados(alunos: Aluno[], turmas: Turma[]): Matriculado[] {
  const turmaNomeById = new Map(turmas.map((t) => [t.id, t.nome]));
  const items: Matriculado[] = [];

  for (const aluno of alunos) {
    items.push({
      id: `aluno-${aluno.id}`,
      nome: aluno.nome,
      turmaId: aluno.turmaId,
      turmaNome: turmaNomeById.get(aluno.turmaId) ?? "",
      tipo: "ALUNO",
      alunoId: aluno.id,
    });
  }

  for (const turma of turmas) {
    for (const professor of turma.professorUsers) {
      items.push({
        id: `professor-${professor.id}-turma-${turma.id}`,
        nome: professor.nome,
        turmaId: turma.id,
        turmaNome: turma.nome,
        tipo: "PROFESSOR",
      });
    }
  }

  return items.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

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
  turmaNome?: string;
  trimestreId: string;
  trimestreNumero: number;
  ano: number;
  recebeu: boolean;
  pagou: boolean;
  metodoPagamento: string;
};

export type PublicationControlsFilters = {
  classId?: string;
  trimestreId?: string;
  trimestre?: number;
  ano?: number;
  personType?: "professor" | "aluno";
};

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: string;
  status: "Ativo" | "Inativo";
};

export type ModuloPermissao =
  | "usuarios"
  | "organizacoes"
  | "turmas"
  | "alunos"
  | "licoes"
  | "frequencia"
  | "financeiro"
  | "revistas"
  | "dashboard";

export type PermissaoDetalhe = {
  visualizar: boolean;
  criar: boolean;
  editar: boolean;
  excluir: boolean;
  aprovar: boolean;
};

export type OrganizacaoContexto = {
  id: number;
  nome: string;
  tipo: string;
  parentId: number | null;
  parentNome: string | null;
};

export type UsuarioLogado = {
  nome: string;
  email: string;
  papel: string;
  papeis: string[];
  status: "Ativo" | "Inativo";
  iniciais: string;
  isAdminGeral: boolean;
  isAdminSistema: boolean;
  requerSelecaoContexto: boolean;
  organizacaoAtiva: OrganizacaoContexto | null;
  organizacoesDisponiveis: OrganizacaoContexto[];
  permissoes: Partial<Record<ModuloPermissao, PermissaoDetalhe>>;
  turmasProfessor: Array<{ id: number; nome: string }>;
  acessoBloqueado: boolean;
  motivoBloqueio: string | null;
};

export type InstanciaOrganizacao = {
  id: string;
  nome: string;
  sigla: string;
  tipo: string;
  formato: string;
  cidade: string;
  uf: string;
  responsavel: string;
  membros: number;
  status: "Ativa" | "Inativa";
  isActive: boolean;
  igrejasCount: number;
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
    professorUsers: (item.professores ?? []).map((p: any) => ({
      id: Number(p.user),
      nome: p.user_nome,
      linkId: String(p.id),
    })),
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

export async function fetchProfessoresIgreja(): Promise<Array<{ id: string; nome: string }>> {
  const data = await request<unknown>("/users/");
  const items = getResults<any>(data);
  return items
    .filter((item) =>
      (item.papeis ?? []).some((papel: string) => papel.trim().toUpperCase() === "PROFESSOR"),
    )
    .map((item) => ({
      id: String(item.id),
      nome: item.nome,
    }));
}

export async function addProfessorTurma(classGroupId: string, userId: string) {
  return request("/class-teachers/", {
    method: "POST",
    body: JSON.stringify({
      class_group: Number(classGroupId),
      user: Number(userId),
    }),
  });
}

export async function removeProfessorTurma(linkId: string) {
  return request(`/class-teachers/${linkId}/`, { method: "DELETE" });
}

function mapAluno(item: any): Aluno {
  return {
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
    responsaveis: (item.responsaveis ?? []).map((r: any) => ({
      nome: r.nome,
      telefone: r.telefone ?? "",
    })),
  };
}

export async function fetchAlunos(search = ""): Promise<Aluno[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const data = await request<unknown>(`/students/${query}`);
  const items = getResults<any>(data);
  return items.map(mapAluno);
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

export async function updateAluno(
  id: string,
  payload: Partial<{
    nome: string;
    sexo: "M" | "F";
    dataNascimento: string;
    email: string;
    telefone: string;
    turmaId: string;
    endereco: Aluno["endereco"];
  }>,
): Promise<Aluno> {
  const body: Record<string, unknown> = {};
  if (payload.nome !== undefined) body.nome = payload.nome;
  if (payload.sexo !== undefined) body.sexo = payload.sexo;
  if (payload.dataNascimento !== undefined) body.data_nascimento = payload.dataNascimento;
  if (payload.email !== undefined) body.email = payload.email;
  if (payload.telefone !== undefined) body.telefone = payload.telefone;
  if (payload.turmaId !== undefined) body.class_group = Number(payload.turmaId);
  if (payload.endereco !== undefined) {
    body.endereco = {
      cep: payload.endereco.cep,
      rua: payload.endereco.rua,
      numero: payload.endereco.numero,
      complemento: payload.endereco.complemento,
      bairro: payload.endereco.bairro,
      cidade: payload.endereco.cidade,
      uf: payload.endereco.uf,
    };
  }

  const data = await request<any>(`/students/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return mapAluno(data);
}

export async function deleteAluno(id: string) {
  await request(`/students/${id}/`, { method: "DELETE" });
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

export type LessonSchedule = {
  id: string;
  lessonId: string;
  classGroupId: string;
  classGroupNome: string;
  professorId: string | null;
  professorNome: string | null;
};

function mapLessonSchedule(item: any): LessonSchedule {
  return {
    id: String(item.id),
    lessonId: String(item.lesson),
    classGroupId: String(item.class_group),
    classGroupNome: item.class_group_nome ?? "",
    professorId: item.professor != null ? String(item.professor) : null,
    professorNome: item.professor_nome ?? null,
  };
}

export async function fetchLessonSchedules(filters: {
  lessonId?: string;
  classId?: string;
  trimestre?: number;
  ano?: number;
}): Promise<LessonSchedule[]> {
  const params = new URLSearchParams();
  if (filters.lessonId) params.set("lesson_id", filters.lessonId);
  if (filters.classId) params.set("class_id", filters.classId);
  if (filters.trimestre) params.set("trimestre", String(filters.trimestre));
  if (filters.ano) params.set("ano", String(filters.ano));
  const query = params.toString() ? `?${params.toString()}` : "";
  const data = await request<unknown>(`/lesson-schedules/${query}`);
  return getResults<any>(data).map(mapLessonSchedule);
}

export async function saveLessonSchedulesBulk(
  lessonId: string,
  assignments: Array<{ classGroupId: string; professorId: string | null }>,
): Promise<LessonSchedule[]> {
  const data = await request<any>("/lesson-schedules/bulk/", {
    method: "POST",
    body: JSON.stringify({
      lesson: Number(lessonId),
      assignments: assignments.map((item) => ({
        class_group: Number(item.classGroupId),
        professor: item.professorId ? Number(item.professorId) : null,
      })),
    }),
  });
  const items = Array.isArray(data) ? data : [];
  return items.map(mapLessonSchedule);
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

function mapAttendanceSheet(item: any): AttendanceSheet {
  return {
    id: String(item.id),
    lesson: String(item.lesson),
    classGroup: String(item.class_group),
    professor: item.professor ?? null,
    visitantes: item.visitantes ?? 0,
    biblias: item.biblias ?? 0,
    revistas: item.revistas ?? 0,
    ofertaValor: Number(item.oferta_valor ?? 0),
    finalizedAt: item.finalized_at ?? null,
    records: (item.records ?? []).map((r: any) => ({
      id: String(r.id),
      student: String(r.student),
      alunoNome: r.aluno_nome,
      presente: Boolean(r.presente),
    })),
  };
}

export async function fetchAttendanceByLessonClass(
  lessonId: string,
  classId: string,
): Promise<AttendanceSheet | null> {
  try {
    const data = await request<any>(`/lessons/${lessonId}/classes/${classId}/attendance`);
    return mapAttendanceSheet(data);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
      return null;
    }
    throw error;
  }
}

export async function fetchAttendanceSheets(): Promise<AttendanceSheet[]> {
  const data = await request<unknown>("/attendance-sheets/");
  const items = getResults<any>(data);
  return items.map(mapAttendanceSheet);
}

export async function createAttendanceSheet(payload: {
  lesson: string;
  classGroup: string;
  professor?: number | null;
  visitantes?: number;
  biblias?: number;
  revistas?: number;
  ofertaValor?: number;
}) {
  const data = await request<any>("/attendance-sheets/", {
    method: "POST",
    body: JSON.stringify({
      lesson: Number(payload.lesson),
      class_group: Number(payload.classGroup),
      professor: payload.professor ?? null,
      visitantes: payload.visitantes ?? 0,
      biblias: payload.biblias ?? 0,
      revistas: payload.revistas ?? 0,
      oferta_valor: String(payload.ofertaValor ?? 0),
    }),
  });
  return mapAttendanceSheet(data);
}

export async function updateAttendanceSheet(
  sheetId: string,
  payload: Partial<{
    professor: number | null;
    visitantes: number;
    biblias: number;
    revistas: number;
    ofertaValor: number;
  }>,
) {
  const body: Record<string, unknown> = {};
  if (payload.professor !== undefined) body.professor = payload.professor;
  if (payload.visitantes !== undefined) body.visitantes = payload.visitantes;
  if (payload.biblias !== undefined) body.biblias = payload.biblias;
  if (payload.revistas !== undefined) body.revistas = payload.revistas;
  if (payload.ofertaValor !== undefined) body.oferta_valor = String(payload.ofertaValor);

  const data = await request<any>(`/attendance-sheets/${sheetId}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return mapAttendanceSheet(data);
}

export async function saveAttendanceRecords(
  sheetId: string,
  records: Array<{ student: string; presente: boolean }>,
) {
  const data = await request<any>(`/attendance-sheets/${sheetId}/records/`, {
    method: "POST",
    body: JSON.stringify({
      records: records.map((r) => ({
        student: Number(r.student),
        presente: r.presente,
      })),
    }),
  });
  return mapAttendanceSheet(data);
}

export async function ensureAttendanceSheet(
  lessonId: string,
  classGroupId: string,
  professorId?: number | null,
) {
  const existing = await fetchAttendanceByLessonClass(lessonId, classGroupId);
  if (existing) return existing;
  return createAttendanceSheet({
    lesson: lessonId,
    classGroup: classGroupId,
    professor: professorId ?? null,
  });
}

export type FinalizeLessonError = {
  message: string;
  turmasPendentes?: string[];
};

export async function finalizeLesson(lessonId: string): Promise<Licao> {
  try {
    const item = await request<any>(`/lessons/${lessonId}/finalize/`, { method: "POST" });
    return {
      id: String(item.id),
      numero: item.numero,
      tema: item.tema,
      data: item.data,
      revista: item.revista,
      textoAureo: item.texto_aureo,
      textoBiblico: item.texto_biblico,
      objetivo: item.objetivo,
      status: mapStatus(item.status),
      trimestre: item.trimestre,
      ano: item.ano,
      presentes: item.presentes ?? 0,
      ausentes: item.ausentes ?? 0,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      let detail = error.message;
      let turmasPendentes: string[] | undefined;
      try {
        const parsed = JSON.parse(error.message) as {
          turmas_pendentes?: string[];
          detail?: string | string[];
        };
        turmasPendentes = parsed.turmas_pendentes;
        if (typeof parsed.detail === "string") detail = parsed.detail;
        else if (Array.isArray(parsed.detail)) detail = parsed.detail.join(" ");
      } catch {
        /* mantém texto bruto */
      }
      const err = new Error(detail) as Error & FinalizeLessonError;
      err.turmasPendentes = turmasPendentes;
      throw err;
    }
    throw error;
  }
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

export async function fetchPublicationControls(
  filters: PublicationControlsFilters = {},
): Promise<ControleRevista[]> {
  const params = new URLSearchParams();
  if (filters.classId) params.set("class_id", filters.classId);
  if (filters.trimestreId) params.set("trimester_id", filters.trimestreId);
  if (filters.trimestre) params.set("trimestre", String(filters.trimestre));
  if (filters.ano) params.set("ano", String(filters.ano));
  if (filters.personType) params.set("person_type", filters.personType);
  const query = params.toString() ? `?${params.toString()}` : "";
  const data = await request<unknown>(`/publication-controls/${query}`);
  const items = getResults<any>(data);

  return items.map((item) => ({
    id: String(item.id),
    nome: item.person_name,
    tipo: item.person_type,
    turmaId: String(item.class_group),
    turmaNome: item.turma_nome ?? undefined,
    trimestreId: String(item.trimester),
    trimestreNumero: Number(item.trimestre_numero ?? 0),
    ano: Number(item.trimestre_ano ?? 0),
    recebeu: Boolean(item.recebeu),
    pagou: Boolean(item.pagou),
    metodoPagamento: item.metodo_pagamento ?? "",
  }));
}

export async function syncPublicationControls(trimestreId: string, classId?: string) {
  return request<{
    created_count: number;
    total_count: number;
    items: unknown[];
  }>("/publication-controls/sync/", {
    method: "POST",
    body: JSON.stringify({
      trimester_id: Number(trimestreId),
      class_id: classId ? Number(classId) : undefined,
    }),
  });
}

export async function bulkUpdatePublicationControls(payload: {
  trimestreId: string;
  classId?: string;
  personType?: "professor" | "aluno";
  field: "recebeu" | "pagou";
  value: boolean;
}) {
  return request<{ updated_count: number }>("/publication-controls/bulk-toggle/", {
    method: "PATCH",
    body: JSON.stringify({
      trimester_id: Number(payload.trimestreId),
      class_id: payload.classId ? Number(payload.classId) : undefined,
      person_type: payload.personType,
      field: payload.field,
      value: payload.value,
    }),
  });
}

export async function updatePublicationControl(
  id: string,
  payload: Partial<{ recebeu: boolean; pagou: boolean; metodo_pagamento: string }>,
) {
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
    papel: formatPapelLabel(item.papeis?.[0]),
    status: item.is_active ? "Ativo" : "Inativo",
  }));
}

export async function toggleUserActive(userId: string) {
  return request(`/users/${userId}/toggle-active/`, { method: "POST" });
}

export async function createUsuario(payload: {
  nome: string;
  email: string;
  senha: string;
  papel: string;
  is_active: boolean;
}): Promise<Usuario> {
  const item = await request<any>("/users/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    id: String(item.id),
    nome: item.nome,
    email: item.email,
    papel: formatPapelLabel(item.papeis?.[0]),
    status: item.is_active ? "Ativo" : "Inativo",
  };
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
  const me = await request<any>("/me", {}, { ensureOrganization: false });
  const papeis = Array.isArray(me.papeis) ? me.papeis : [];
  const papelPrincipal = papeis[0] ?? "Usuário";
  const papeisNormalizados = papeis.map((papel: string) => papel.trim().toUpperCase());
  const isAdminSistema =
    Boolean(me.is_admin_sistema) ||
    papeisNormalizados.includes("ADMINISTRADOR GERAL") ||
    papeisNormalizados.includes("ADMINISTRADOR");

  const mapOrg = (org: any): OrganizacaoContexto | null => {
    if (!org) return null;
    return {
      id: org.id,
      nome: org.nome,
      tipo: org.tipo,
      parentId: org.parent_id ?? null,
      parentNome: org.parent_nome ?? null,
    };
  };

  const organizacoesDisponiveis = Array.isArray(me.organizacoes_disponiveis)
    ? me.organizacoes_disponiveis.map(mapOrg).filter(Boolean)
    : [];

  return {
    nome: me.nome,
    email: me.email,
    papel: formatPapelLabel(papelPrincipal),
    papeis,
    status: me.is_active ? "Ativo" : "Inativo",
    iniciais: me.nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n: string) => n[0])
      .join("")
      .toUpperCase(),
    isAdminGeral: isAdminSistema,
    isAdminSistema,
    requerSelecaoContexto: Boolean(me.requer_selecao_contexto),
    organizacaoAtiva: mapOrg(me.organizacao_ativa),
    organizacoesDisponiveis: organizacoesDisponiveis as OrganizacaoContexto[],
    permissoes: me.permissoes ?? {},
    turmasProfessor: Array.isArray(me.turmas) ? me.turmas : [],
    acessoBloqueado: Boolean(me.acesso_bloqueado),
    motivoBloqueio: me.motivo_bloqueio ?? null,
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

export type ProfessorDashboardTurmaResumo = {
  id: number;
  nome: string;
  cor: string;
};

export type ProfessorDashboardLicaoResumo = {
  id: number;
  numero: number;
  tema: string;
  data: string;
  revista?: string;
  textoAureo?: string;
  registrada?: boolean;
};

export type ProfessorDashboard = {
  turmasDisponiveis: ProfessorDashboardTurmaResumo[];
  turma: ProfessorDashboardTurmaResumo & { totalAlunos: number };
  trimestre: { numero: number; ano: number; titulo: string } | null;
  resumo: {
    frequenciaMediaPct: number;
    pendenciasRegistro: number;
    ultimaEbdPct: number | null;
    ofertasTrimestre: number;
    visitantesTrimestre: number;
  };
  proximaLicao: ProfessorDashboardLicaoResumo | null;
  ultimoRegistro: {
    licaoNumero: number;
    licaoTema: string;
    data: string;
    presentes: number;
    ausentes: number;
    visitantes: number;
    biblias: number;
    revistas: number;
    ofertaValor: number;
  } | null;
  aulasEscaladas: Array<{
    id: number;
    numero: number;
    tema: string;
    data: string;
    registrada: boolean;
    presentes: number;
    ausentes: number;
  }>;
  licoesPendentes: ProfessorDashboardLicaoResumo[];
  evolucaoFrequencia: Array<{
    data: string;
    licaoNumero: number;
    presentes: number;
    ausentes: number;
    pct: number;
  }>;
  aniversariantes: Array<{
    nome: string;
    data: string;
    diasParaAniversario: number;
  }>;
  rankingAlunos: Array<{
    id: number;
    nome: string;
    presencas: number;
    ausencias: number;
  }>;
};

function mapProfessorDashboard(data: any): ProfessorDashboard {
  return {
    turmasDisponiveis: (data.turmas_disponiveis ?? []).map((t: any) => ({
      id: t.id,
      nome: t.nome,
      cor: t.cor,
    })),
    turma: {
      id: data.turma.id,
      nome: data.turma.nome,
      cor: data.turma.cor,
      totalAlunos: data.turma.total_alunos ?? 0,
    },
    trimestre: data.trimestre
      ? {
          numero: data.trimestre.numero,
          ano: data.trimestre.ano,
          titulo: data.trimestre.titulo,
        }
      : null,
    resumo: {
      frequenciaMediaPct: data.resumo?.frequencia_media_pct ?? 0,
      pendenciasRegistro: data.resumo?.pendencias_registro ?? 0,
      ultimaEbdPct: data.resumo?.ultima_ebd_pct ?? null,
      ofertasTrimestre: Number(data.resumo?.ofertas_trimestre ?? 0),
      visitantesTrimestre: data.resumo?.visitantes_trimestre ?? 0,
    },
    proximaLicao: data.proxima_licao
      ? {
          id: data.proxima_licao.id,
          numero: data.proxima_licao.numero,
          tema: data.proxima_licao.tema,
          data: data.proxima_licao.data,
          revista: data.proxima_licao.revista ?? "",
          textoAureo: data.proxima_licao.texto_aureo ?? "",
          registrada: Boolean(data.proxima_licao.registrada),
        }
      : null,
    ultimoRegistro: data.ultimo_registro
      ? {
          licaoNumero: data.ultimo_registro.licao_numero,
          licaoTema: data.ultimo_registro.licao_tema,
          data: data.ultimo_registro.data,
          presentes: data.ultimo_registro.presentes,
          ausentes: data.ultimo_registro.ausentes,
          visitantes: data.ultimo_registro.visitantes,
          biblias: data.ultimo_registro.biblias,
          revistas: data.ultimo_registro.revistas,
          ofertaValor: Number(data.ultimo_registro.oferta_valor ?? 0),
        }
      : null,
    aulasEscaladas: (data.aulas_escaladas ?? []).map((aula: any) => ({
      id: aula.id,
      numero: aula.numero,
      tema: aula.tema,
      data: aula.data,
      registrada: Boolean(aula.registrada),
      presentes: aula.presentes ?? 0,
      ausentes: aula.ausentes ?? 0,
    })),
    licoesPendentes: (data.licoes_pendentes ?? []).map((l: any) => ({
      id: l.id,
      numero: l.numero,
      tema: l.tema,
      data: l.data,
    })),
    evolucaoFrequencia: (data.evolucao_frequencia ?? []).map((item: any) => ({
      data: item.data,
      licaoNumero: item.licao_numero,
      presentes: item.presentes,
      ausentes: item.ausentes,
      pct: item.pct,
    })),
    aniversariantes: (data.aniversariantes ?? []).map((a: any) => ({
      nome: a.nome,
      data: a.data,
      diasParaAniversario: a.dias_para_aniversario,
    })),
    rankingAlunos: (data.ranking_alunos ?? []).map((a: any) => ({
      id: a.id,
      nome: a.nome,
      presencas: a.presencas,
      ausencias: a.ausencias,
    })),
  };
}

export async function fetchProfessorDashboard(classId?: number): Promise<ProfessorDashboard> {
  const query = classId ? `?class_id=${classId}` : "";
  const data = await request<any>(`/dashboard/professor${query}`);
  return mapProfessorDashboard(data);
}

export function monthLabel(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("pt-BR", { month: "short" });
}

export function weekLabel(dateStr: string): string {
  return formatDate(dateStr).slice(0, 5);
}

export type Igreja = {
  id: string;
  nome: string;
  sigla: string;
  cidade: string;
  uf: string;
  responsavel: string;
  membros: number;
  status: "Ativa" | "Inativa";
  isActive: boolean;
};

export function isTipoCampo(tipo: string) {
  const normalized = tipo.trim().toUpperCase();
  return normalized === "CAMPO" || normalized === "SEDE";
}

export function isTipoIgreja(tipo: string) {
  const normalized = tipo.trim().toUpperCase();
  return normalized === "IGREJA" || normalized === "FILIAL" || normalized === "CONGREGACAO";
}

function mapIgreja(item: any): Igreja {
  const ativa = item.is_active !== false && (item.status ?? "ATIVA").toUpperCase() === "ATIVA";
  return {
    id: String(item.id),
    nome: item.nome,
    sigla: item.sigla,
    cidade: item.cidade,
    uf: item.uf,
    responsavel: item.responsavel ?? "",
    membros: Number(item.membros ?? 0),
    status: ativa ? "Ativa" : "Inativa",
    isActive: ativa,
  };
}

export async function fetchIgrejasDoCampo(includeInactive = false): Promise<Igreja[]> {
  const query = includeInactive ? "?include_inactive=true" : "";
  const data = await request<unknown>(`/organizations/churches/${query}`);
  const items = getResults<any>(data);
  return items.map(mapIgreja);
}

export async function createIgreja(payload: {
  nome: string;
  sigla: string;
  cidade: string;
  uf: string;
  responsavel?: string;
  membros?: number;
}) {
  const data = await request<any>("/organizations/churches/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapIgreja(data);
}

export async function updateIgreja(
  id: string,
  payload: Partial<{
    nome: string;
    sigla: string;
    cidade: string;
    uf: string;
    responsavel: string;
    membros: number;
  }>,
) {
  const data = await request<any>(`/organizations/churches/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return mapIgreja(data);
}

export async function activateIgreja(id: string) {
  const data = await request<any>(`/organizations/churches/${id}/activate/`, { method: "POST" });
  return mapIgreja(data);
}

export async function deactivateIgreja(id: string) {
  const data = await request<any>(`/organizations/churches/${id}/deactivate/`, { method: "POST" });
  return mapIgreja(data);
}

export async function deleteIgreja(id: string) {
  return request(`/organizations/churches/${id}/`, { method: "DELETE" });
}

function mapInstanciaOrganizacao(item: any): InstanciaOrganizacao {
  const ativa = item.is_active !== false && (item.status ?? "ATIVA").toUpperCase() === "ATIVA";
  return {
    id: String(item.id),
    nome: item.nome,
    sigla: item.sigla,
    tipo: item.tipo,
    formato: item.formato ?? "",
    cidade: item.cidade,
    uf: item.uf,
    responsavel: item.responsavel ?? "",
    membros: Number(item.membros ?? 0),
    status: ativa ? "Ativa" : "Inativa",
    isActive: ativa,
    igrejasCount: Number(item.igrejas_count ?? 0),
  };
}

export async function fetchInstanciasOrganizacao(includeInactive = true): Promise<InstanciaOrganizacao[]> {
  const params = new URLSearchParams({
    instances_only: "true",
    include_inactive: includeInactive ? "true" : "false",
  });
  const data = await request<unknown>(`/organizations/?${params.toString()}`, {}, { ensureOrganization: false });
  return getResults<any>(data).map(mapInstanciaOrganizacao);
}

export async function fetchInstanciaOrganizacao(id: string): Promise<InstanciaOrganizacao> {
  const data = await request<any>(`/organizations/${id}/`, {}, { ensureOrganization: false });
  return mapInstanciaOrganizacao(data);
}

export async function createInstanciaOrganizacao(payload: {
  nome: string;
  sigla: string;
  formato: "CAMPO" | "IGREJA_INDIVIDUAL";
  cidade: string;
  uf: string;
  responsavel: string;
  membros: number;
}) {
  const data = await request<any>("/organizations/", {
    method: "POST",
    body: JSON.stringify(payload),
  }, { ensureOrganization: false });
  return mapInstanciaOrganizacao(data);
}

export async function updateInstanciaOrganizacao(
  id: string,
  payload: {
    nome: string;
    sigla: string;
    cidade: string;
    uf: string;
    responsavel: string;
    membros: number;
  },
) {
  const data = await request<any>(`/organizations/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, { ensureOrganization: false });
  return mapInstanciaOrganizacao(data);
}

export async function activateInstanciaOrganizacao(id: string) {
  const data = await request<any>(`/organizations/${id}/activate/`, { method: "POST" }, { ensureOrganization: false });
  return mapInstanciaOrganizacao(data);
}

export async function deactivateInstanciaOrganizacao(id: string) {
  const data = await request<any>(`/organizations/${id}/deactivate/`, { method: "POST" }, { ensureOrganization: false });
  return mapInstanciaOrganizacao(data);
}

export async function fetchIgrejasDaInstancia(campoId: string, includeInactive = true): Promise<Igreja[]> {
  const params = includeInactive ? "?include_inactive=true" : "";
  const data = await request<unknown>(`/organizations/${campoId}/churches/${params}`, {}, { ensureOrganization: false });
  return getResults<any>(data).map(mapIgreja);
}
