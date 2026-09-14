/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiError, getResults, request, requestAllPages } from "@/lib/api";
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
  ativa: boolean;
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

export type ProfessorMatriculado = {
  id: string;
  professorId: string;
  nome: string;
  turmaId: string;
  turmaNome: string;
  linkId: string;
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

export function buildMatriculadosAlunos(alunos: Aluno[], turmas: Turma[]): Matriculado[] {
  const turmaNomeById = new Map(turmas.map((t) => [t.id, t.nome]));
  return alunos
    .map((aluno) => ({
      id: `aluno-${aluno.id}`,
      nome: aluno.nome,
      turmaId: aluno.turmaId,
      turmaNome: turmaNomeById.get(aluno.turmaId) ?? "",
      tipo: "ALUNO" as const,
      alunoId: aluno.id,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export function buildMatriculadosProfessores(turmas: Turma[]): ProfessorMatriculado[] {
  const items: ProfessorMatriculado[] = [];
  for (const turma of turmas) {
    for (const professor of turma.professorUsers) {
      items.push({
        id: `professor-${professor.id}-turma-${turma.id}`,
        professorId: String(professor.id),
        nome: professor.nome,
        turmaId: turma.id,
        turmaNome: turma.nome,
        linkId: professor.linkId,
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
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
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

export type ResultadoImportacaoAluno = {
  linha: number;
  nome: string;
  status:
    | "VALIDO"
    | "INVALIDO"
    | "CADASTRADO"
    | "NAO_CADASTRADO"
    | "DESFEITO"
    | "NAO_DESFEITO";
  motivos: string[];
  aluno_id: number | null;
};

export type ResultadoImportacaoAlunos = {
  fase: "VALIDACAO" | "CONFIRMACAO" | "DESFAZIMENTO";
  lote_id: string;
  status_lote:
    | "INVALID"
    | "VALIDATED"
    | "CONFIRMED"
    | "UNDONE"
    | "PARTIALLY_UNDONE";
  arquivo_nome: string;
  total_linhas: number;
  validos: number;
  invalidos: number;
  cadastrados: number;
  nao_cadastrados: number;
  desativados: number;
  nao_desfeitos: number;
  colunas_obrigatorias: string[];
  colunas_ausentes: string[];
  colunas_ignoradas: string[];
  erros_arquivo: string[];
  pode_confirmar: boolean;
  pode_desfazer: boolean;
  criado_em: string;
  confirmado_em: string | null;
  desfeito_em: string | null;
  resultados: ResultadoImportacaoAluno[];
};

export type LoteImportacaoAlunos = {
  lote_id: string;
  arquivo_nome: string;
  status_lote: ResultadoImportacaoAlunos["status_lote"];
  total_linhas: number;
  validos: number;
  invalidos: number;
  cadastrados: number;
  pode_confirmar: boolean;
  pode_desfazer: boolean;
  criado_em: string;
  confirmado_em: string | null;
  desfeito_em: string | null;
  criado_por: string | null;
  confirmado_por: string | null;
  desfeito_por: string | null;
};

export type HistoricoAluno = {
  id: number;
  action:
    | "CREATED"
    | "UPDATED"
    | "DEACTIVATED"
    | "RESTORED"
    | "IMPORTED"
    | "IMPORT_UNDONE";
  action_label: string;
  actor_name: string | null;
  changes: Record<string, { antes: unknown; depois: unknown }>;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type PaginaAlunos = {
  items: Aluno[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type RegistroAtividade = {
  id: number;
  organizationId: string;
  organizationName: string;
  actorName: string;
  actorEmail: string;
  action: string;
  resource: string;
  objectReference: string;
  eventType: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "REQUEST";
  modelLabel: string;
  changes: Record<string, { antes: unknown; depois: unknown }>;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  statusCode: number;
  succeeded: boolean;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
};

export type PaginaRegistrosAtividade = {
  items: RegistroAtividade[];
  count: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
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

export type FinanceResumoFilters = {
  classId?: string;
  lessonId?: string;
  trimestre?: number;
  ano?: number;
  dateFrom?: string;
  dateTo?: string;
};

export type FinanceLancamentosFilters = FinanceResumoFilters & {
  page?: number;
  pageSize?: number;
};

export type FinanceResumoPaginacao = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type FinanceResumoDestaque = {
  label: string;
  valor: number;
};

export type FinanceResumoPorIgreja = {
  organizationId: number;
  nome: string;
  valor: number;
  lancamentos: number;
};

export type FinanceResumoPorTurma = {
  classId: number;
  nome: string;
  valor: number;
  cor: string;
};

export type FinanceResumoRecente = {
  id: number;
  data: string;
  valor: number;
  igrejaNome: string | null;
  turmaNome: string | null;
  licaoTema: string | null;
  licaoId: number | null;
  turmaId: number | null;
  organizationId: number | null;
};

export type FinanceResumo = {
  scope: "campo" | "igreja";
  organizacaoNome: string;
  summary: {
    total: number;
    media: number;
    lancamentos: number;
    destaque: FinanceResumoDestaque;
  };
  evolucaoMensal: Array<{ mes: string; valor: number }>;
  porIgreja: FinanceResumoPorIgreja[];
  porTurma: FinanceResumoPorTurma[];
};

export type FinanceLancamentos = {
  items: FinanceResumoRecente[];
  paginacao: FinanceResumoPaginacao;
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
  /** Rótulo exibível, já traduzido por `formatPapelLabel`. */
  papel: string;
  /** Valor canônico do papel (ex.: "PROFESSOR"), usado nos formulários. */
  papelRaw: string;
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
  formato: string;
  parentId: number | null;
  parentNome: string | null;
};

export type UsuarioLogado = {
  id: string;
  nome: string;
  email: string;
  fotoUrl: string | null;
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
  status: "RASCUNHO" | "CONCLUIDA";
  professor?: number | null;
  professorPresente?: boolean;
  visitantes: number;
  biblias: number;
  revistas: number;
  ofertaValor: number;
  finalizedAt?: string | null;
  records: Array<{ id: string; student: string; alunoNome: string; presente: boolean }>;
};

export type ProfessorRankingItem = {
  professorId: number;
  professorNome: string;
  turmaIds: string[];
  turmaNomes: string[];
  presencas: number;
  ausencias: number;
  totalRegistros: number;
  presencaPct: number;
};

function mapStatus(status: string): "Aberta" | "Finalizada" {
  return status === "FINALIZADA" ? "Finalizada" : "Aberta";
}

export async function fetchTurmas(): Promise<Turma[]> {
  const items = await requestAllPages<any>("/classes/");
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
    ativa: item.ativa ?? true,
  }));
}

export type TurmaPayload = {
  nome: string;
  faixaEtaria: string;
  cor: string;
  ativa: boolean;
};

function toTurmaBody(payload: TurmaPayload) {
  return JSON.stringify({
    nome: payload.nome,
    faixa_etaria: payload.faixaEtaria,
    cor: payload.cor,
    ativa: payload.ativa,
  });
}

export async function createTurma(payload: TurmaPayload) {
  return request("/classes/", { method: "POST", body: toTurmaBody(payload) });
}

export async function updateTurma(id: string, payload: TurmaPayload) {
  return request(`/classes/${id}/`, { method: "PATCH", body: toTurmaBody(payload) });
}

export async function fetchProfessoresIgreja(): Promise<Array<{ id: string; nome: string }>> {
  const items = await requestAllPages<any>("/users/?role=PROFESSOR");
  return items.map((item) => ({
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
    isActive: item.is_active !== false,
    deletedAt: item.deleted_at ?? null,
    createdAt: item.created_at ?? null,
    updatedAt: item.updated_at ?? null,
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
  const items = await requestAllPages<any>(`/students/${query}`);
  return items.map(mapAluno);
}

export async function fetchAlunosInativos(): Promise<Aluno[]> {
  const items = await requestAllPages<any>("/students/inactive/");
  return items.map(mapAluno);
}

export async function fetchAlunosPage(filters: {
  search?: string;
  page?: number;
  pageSize?: number;
  inativos?: boolean;
  classId?: string;
} = {}): Promise<PaginaAlunos> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 24));
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.classId) params.set("class_id", filters.classId);
  const endpoint = filters.inativos ? "/students/inactive/" : "/students/";
  const data = await request<{
    count: number;
    results: any[];
  }>(`${endpoint}?${params.toString()}`);
  const total = Number(data.count ?? 0);
  return {
    items: (data.results ?? []).map(mapAluno),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
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

export async function importarAlunosEmLote(
  arquivo: File,
): Promise<ResultadoImportacaoAlunos> {
  const formData = new FormData();
  formData.append("arquivo", arquivo);
  return request<ResultadoImportacaoAlunos>("/students/import/", {
    method: "POST",
    body: formData,
  });
}

export async function confirmarImportacaoAlunos(
  loteId: string,
): Promise<ResultadoImportacaoAlunos> {
  return request<ResultadoImportacaoAlunos>(
    `/students/import/${encodeURIComponent(loteId)}/confirm/`,
    { method: "POST" },
  );
}

export async function desfazerImportacaoAlunos(
  loteId: string,
): Promise<ResultadoImportacaoAlunos> {
  return request<ResultadoImportacaoAlunos>(
    `/students/import/${encodeURIComponent(loteId)}/undo/`,
    { method: "POST" },
  );
}

export async function fetchHistoricoImportacoesAlunos(): Promise<LoteImportacaoAlunos[]> {
  const items = await requestAllPages<LoteImportacaoAlunos>("/students/imports/");
  return items;
}

export async function restoreAluno(id: string, turmaId?: string): Promise<Aluno> {
  const data = await request<any>(`/students/${id}/restore/`, {
    method: "POST",
    body: JSON.stringify(
      turmaId ? { class_group: Number(turmaId) } : {},
    ),
  });
  return mapAluno(data);
}

export async function fetchHistoricoAluno(id: string): Promise<HistoricoAluno[]> {
  return requestAllPages<HistoricoAluno>(`/students/${id}/history/`);
}

export async function fetchRegistrosAtividade(filters: {
  page?: number;
  search?: string;
  result?: "all" | "success" | "failure";
  eventType?: "all" | "CREATE" | "UPDATE" | "DELETE";
  dateFrom?: string;
  dateTo?: string;
} = {}): Promise<PaginaRegistrosAtividade> {
  const page = Math.max(1, filters.page ?? 1);
  const params = new URLSearchParams({ page: String(page) });
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.result && filters.result !== "all") params.set("result", filters.result);
  if (filters.eventType && filters.eventType !== "all") {
    params.set("event_type", filters.eventType);
  }
  if (filters.dateFrom) params.set("date_from", filters.dateFrom);
  if (filters.dateTo) params.set("date_to", filters.dateTo);

  const data = await request<any>(`/activity-logs/?${params.toString()}`);
  const rawItems = getResults<any>(data);
  const count = Number(data.count ?? 0);
  const pageSize = Math.max(rawItems.length, 20);
  return {
    items: rawItems.map((item) => ({
      id: Number(item.id),
      organizationId: String(item.organization),
      organizationName: item.organization_name ?? "",
      actorName: item.actor_name ?? "Sistema",
      actorEmail: item.actor_email ?? "",
      action: item.action ?? "Executou uma operação",
      resource: item.resource ?? "Sistema",
      objectReference: item.object_reference ?? "",
      eventType: item.event_type ?? "REQUEST",
      modelLabel: item.model_label ?? "",
      changes: item.changes ?? {},
      method: item.method,
      path: item.path ?? "",
      statusCode: Number(item.status_code ?? 0),
      succeeded: Boolean(item.succeeded),
      ipAddress: item.ip_address ?? "",
      userAgent: item.user_agent ?? "",
      createdAt: item.created_at,
    })),
    count,
    page,
    totalPages: Math.max(1, Math.ceil(count / pageSize)),
    hasNext: Boolean(data.next),
    hasPrevious: Boolean(data.previous),
  };
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
    status: item.status === "CONCLUIDA" ? "CONCLUIDA" : "RASCUNHO",
    professor: item.professor ?? null,
    professorPresente: Boolean(item.professor_presente),
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
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function saveAttendanceRegistration(payload: {
  lessonId: string;
  classGroupId: string;
  status: "RASCUNHO" | "CONCLUIDA";
  professor?: number | null;
  professorPresente?: boolean;
  visitantes: number;
  biblias: number;
  revistas: number;
  ofertaValor: number;
  records: Array<{ student: string; presente: boolean }>;
}): Promise<AttendanceSheet> {
  const data = await request<any>(
    `/lessons/${payload.lessonId}/classes/${payload.classGroupId}/attendance`,
    {
      method: "PUT",
      body: JSON.stringify({
        status: payload.status,
        professor: payload.professor ?? null,
        professor_presente: payload.professorPresente ?? false,
        visitantes: payload.visitantes,
        biblias: payload.biblias,
        revistas: payload.revistas,
        oferta_valor: String(payload.ofertaValor),
        records: payload.records.map((record) => ({
          student: Number(record.student),
          presente: record.presente,
        })),
      }),
    },
  );
  return mapAttendanceSheet(data);
}

export async function fetchAttendanceSheets(): Promise<AttendanceSheet[]> {
  const data = await request<unknown>("/attendance-sheets/");
  const items = getResults<any>(data);
  return items.map(mapAttendanceSheet);
}

export async function fetchProfessorRanking(filters: {
  trimestre: number;
  ano: number;
  classId?: string;
}): Promise<ProfessorRankingItem[]> {
  const params = new URLSearchParams({
    trimestre: String(filters.trimestre),
    ano: String(filters.ano),
  });
  if (filters.classId) params.set("class_id", filters.classId);
  const data = await request<ProfessorRankingItem[]>(`/dashboard/professor-ranking?${params.toString()}`);
  return data ?? [];
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
    professorPresente: boolean;
    visitantes: number;
    biblias: number;
    revistas: number;
    ofertaValor: number;
  }>,
) {
  const body: Record<string, unknown> = {};
  if (payload.professor !== undefined) body.professor = payload.professor;
  if (payload.professorPresente !== undefined) body.professor_presente = payload.professorPresente;
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

function mapFinanceResumo(data: Record<string, unknown>): FinanceResumo {
  const summary = data.summary as Record<string, unknown>;
  const destaque = summary.destaque as Record<string, unknown>;
  return {
    scope: data.scope as FinanceResumo["scope"],
    organizacaoNome: String(data.organizacao_nome ?? ""),
    summary: {
      total: Number(summary.total ?? 0),
      media: Number(summary.media ?? 0),
      lancamentos: Number(summary.lancamentos ?? 0),
      destaque: {
        label: String(destaque.label ?? "—"),
        valor: Number(destaque.valor ?? 0),
      },
    },
    evolucaoMensal: ((data.evolucao_mensal as unknown[]) ?? []).map((row) => {
      const item = row as Record<string, unknown>;
      return { mes: String(item.mes), valor: Number(item.valor ?? 0) };
    }),
    porIgreja: ((data.por_igreja as unknown[]) ?? []).map((row) => {
      const item = row as Record<string, unknown>;
      return {
        organizationId: Number(item.organization_id),
        nome: String(item.nome ?? "—"),
        valor: Number(item.valor ?? 0),
        lancamentos: Number(item.lancamentos ?? 0),
      };
    }),
    porTurma: ((data.por_turma as unknown[]) ?? []).map((row) => {
      const item = row as Record<string, unknown>;
      return {
        classId: Number(item.class_id),
        nome: String(item.nome ?? "—"),
        valor: Number(item.valor ?? 0),
        cor: String(item.cor ?? ""),
      };
    }),
  };
}

function mapLancamentoItem(item: Record<string, unknown>): FinanceResumoRecente {
  return {
    id: Number(item.id),
    data: String(item.data),
    valor: Number(item.valor ?? 0),
    igrejaNome: item.igreja_nome != null ? String(item.igreja_nome) : null,
    turmaNome: item.turma_nome != null ? String(item.turma_nome) : null,
    licaoTema: item.licao_tema != null ? String(item.licao_tema) : null,
    licaoId: item.licao_id != null ? Number(item.licao_id) : null,
    turmaId: item.turma_id != null ? Number(item.turma_id) : null,
    organizationId: item.organization_id != null ? Number(item.organization_id) : null,
  };
}

function mapFinanceLancamentos(data: Record<string, unknown>): FinanceLancamentos {
  const pag = (data.paginacao as Record<string, unknown>) ?? {};
  return {
    items: ((data.items as unknown[]) ?? []).map((row) =>
      mapLancamentoItem(row as Record<string, unknown>),
    ),
    paginacao: {
      page: Number(pag.page ?? 1),
      pageSize: Number(pag.page_size ?? 5),
      total: Number(pag.total ?? 0),
      totalPages: Number(pag.total_pages ?? 1),
    },
  };
}

function buildFinanceFilterParams(filters: FinanceResumoFilters, params: URLSearchParams) {
  if (filters.classId) params.set("class_id", filters.classId);
  if (filters.lessonId) params.set("lesson_id", filters.lessonId);
  if (filters.trimestre != null) params.set("trimestre", String(filters.trimestre));
  if (filters.ano != null) params.set("ano", String(filters.ano));
  if (filters.dateFrom) params.set("date_from", filters.dateFrom);
  if (filters.dateTo) params.set("date_to", filters.dateTo);
}

export async function fetchFinanceResumo(
  filters: FinanceResumoFilters = {},
): Promise<FinanceResumo> {
  const params = new URLSearchParams();
  buildFinanceFilterParams(filters, params);
  const query = params.toString() ? `?${params.toString()}` : "";
  const data = await request<Record<string, unknown>>(`/finance/resumo/${query}`);
  return mapFinanceResumo(data);
}

export async function fetchFinanceLancamentos(
  filters: FinanceLancamentosFilters = {},
): Promise<FinanceLancamentos> {
  const params = new URLSearchParams();
  buildFinanceFilterParams(filters, params);
  if (filters.page != null) params.set("page", String(filters.page));
  if (filters.pageSize != null) params.set("page_size", String(filters.pageSize));
  const query = params.toString() ? `?${params.toString()}` : "";
  const data = await request<Record<string, unknown>>(`/finance/lancamentos/${query}`);
  return mapFinanceLancamentos(data);
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

function mapUsuario(item: any): Usuario {
  return {
    id: String(item.id),
    nome: item.nome,
    email: item.email,
    papel: formatPapelLabel(item.papeis?.[0]),
    papelRaw: (item.papeis?.[0] ?? "").trim().toUpperCase(),
    status: item.is_active ? "Ativo" : "Inativo",
  };
}

export async function fetchUsuarios(): Promise<Usuario[]> {
  const items = await requestAllPages<any>("/users/");
  return items.map(mapUsuario);
}

export type UsuariosPage = {
  items: Usuario[];
  count: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export async function fetchUsuariosPage(filters: {
  page?: number;
  search?: string;
} = {}): Promise<UsuariosPage> {
  const page = filters.page ?? 1;
  const params = new URLSearchParams({ page: String(page) });
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  const data = await request<any>(`/users/?${params.toString()}`);
  const count = Number(data.count ?? 0);
  const pageSize = Math.max(getResults<any>(data).length, 20);
  return {
    items: getResults<any>(data).map(mapUsuario),
    count,
    page,
    totalPages: Math.max(1, Math.ceil(count / pageSize)),
    hasNext: Boolean(data.next),
    hasPrevious: Boolean(data.previous),
  };
}

export async function fetchUsuariosStats(): Promise<{
  total: number;
  ativos: number;
  inativos: number;
}> {
  const data = await request<any>("/users/stats/");
  return {
    total: Number(data.total ?? 0),
    ativos: Number(data.ativos ?? 0),
    inativos: Number(data.inativos ?? 0),
  };
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

  return mapUsuario(item);
}

export async function updateUsuario(
  userId: string,
  payload: {
    nome: string;
    email: string;
    is_active: boolean;
    /** Omitido quando o perfil não deve ser alterado. */
    papel?: string;
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
      formato: org.formato ?? "",
      parentId: org.parent_id ?? null,
      parentNome: org.parent_nome ?? null,
    };
  };

  const organizacoesDisponiveis = Array.isArray(me.organizacoes_disponiveis)
    ? me.organizacoes_disponiveis.map(mapOrg).filter(Boolean)
    : [];

  return {
    id: String(me.id),
    nome: me.nome,
    email: me.email,
    fotoUrl: me.foto_url?.trim() ? me.foto_url : null,
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

export async function updateMeuPerfil(payload: { nome: string }) {
  return request("/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, { ensureOrganization: false });
}

export async function changeMinhaSenha(payload: {
  senhaAtual: string;
  novaSenha: string;
  confirmarSenha: string;
}) {
  return request("/me/change-password", {
    method: "POST",
    body: JSON.stringify({
      senha_atual: payload.senhaAtual,
      nova_senha: payload.novaSenha,
      confirmar_senha: payload.confirmarSenha,
    }),
  }, { ensureOrganization: false });
}

export async function uploadFotoPerfil(file: File) {
  const formData = new FormData();
  formData.append("foto", file);
  return request("/me/avatar", {
    method: "PATCH",
    body: formData,
  }, { ensureOrganization: false });
}

export async function removeFotoPerfil() {
  return request("/me/avatar", {
    method: "DELETE",
  }, { ensureOrganization: false });
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

export type DashboardAction = {
  id: string;
  kind:
    | "ATTENDANCE_PENDING"
    | "LESSON_TODAY"
    | "LESSON_FINALIZE"
    | "MAGAZINE_PAYMENT";
  title: string;
  body: string;
  actionPath: string;
  severity: "INFO" | "WARNING";
  organizationId: number;
  organizationName: string;
  metadata: Record<string, unknown>;
};

export type DashboardActionsResponse = {
  results: DashboardAction[];
  total: number;
  summaryByOrganization: Array<{
    organizationId: number;
    organizationName: string;
    pendingCount: number;
    warningCount: number;
  }>;
};

export async function fetchDashboardActions(): Promise<DashboardActionsResponse> {
  const data = await request<any>("/dashboard/actions");
  return {
    results: (data.results ?? []).map((item: any) => ({
      id: String(item.id),
      kind: item.kind,
      title: item.title,
      body: item.body,
      actionPath: item.action_path,
      severity: item.severity,
      organizationId: Number(item.organization_id),
      organizationName: item.organization_name,
      metadata: item.metadata ?? {},
    })),
    total: Number(data.total ?? 0),
    summaryByOrganization: (data.summary_by_organization ?? []).map((item: any) => ({
      organizationId: Number(item.organization_id),
      organizationName: item.organization_name,
      pendingCount: Number(item.pending_count ?? 0),
      warningCount: Number(item.warning_count ?? 0),
    })),
  };
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

export type ProfessorDashboardLicaoHoje = {
  id: number;
  numero: number;
  tema: string;
  data: string;
  trimestre: number;
  ano: number;
  turmaId: number;
  turmaNome: string;
  registrada: boolean;
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
  licoesHoje: ProfessorDashboardLicaoHoje[];
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
    licoesHoje: (data.licoes_hoje ?? []).map((licao: any) => ({
      id: licao.id,
      numero: licao.numero,
      tema: licao.tema,
      data: licao.data,
      trimestre: licao.trimestre,
      ano: licao.ano,
      turmaId: licao.turma_id,
      turmaNome: licao.turma_nome,
      registrada: Boolean(licao.registrada),
    })),
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

/** Instância contratada como campo (várias igrejas no ecossistema). */
export function isInstanciaCampo(org: OrganizacaoContexto | null | undefined) {
  if (!org) return false;
  const formato = org.formato.trim().toUpperCase();
  if (formato === "CAMPO") return true;
  if (formato === "IGREJA_INDIVIDUAL") return false;
  return isTipoCampo(org.tipo);
}

/** Instância contratada como uma única igreja (sem campo pai). */
export function isInstanciaIgrejaIndividual(org: OrganizacaoContexto | null | undefined) {
  if (!org) return false;
  const formato = org.formato.trim().toUpperCase();
  if (formato === "IGREJA_INDIVIDUAL") return true;
  if (formato === "CAMPO") return false;
  return isTipoIgreja(org.tipo) && org.parentId == null;
}

/** Igreja vinculada a um campo (visão operacional), não contrato individual. */
export function isIgrejaFilhaDeCampo(org: OrganizacaoContexto | null | undefined) {
  if (!org) return false;
  if (isInstanciaIgrejaIndividual(org)) return false;
  return isTipoIgreja(org.tipo) && org.parentId != null;
}

/** Id do campo quando o contexto ativo é o campo ou uma igreja filha dele. */
export function resolveCampoIdDoContexto(org: OrganizacaoContexto | null | undefined): number | null {
  if (!org) return null;
  if (isInstanciaCampo(org)) return org.id;
  if (isIgrejaFilhaDeCampo(org)) return org.parentId;
  return null;
}

/** Menu Igrejas na sidebar: só com instância CAMPO ativa (não na visão de uma igreja). */
export function deveExibirMenuIgrejas(params: {
  isAdminSistema: boolean;
  secretarioCampo: boolean;
  canOrganizacoes: boolean;
  organizacaoAtiva: OrganizacaoContexto | null | undefined;
}) {
  const temPapel =
    (params.secretarioCampo || params.isAdminSistema) &&
    (params.isAdminSistema || params.canOrganizacoes);
  return temPapel && isInstanciaCampo(params.organizacaoAtiva);
}

/** Seletor de igrejas no header: no campo ou operando visão de igreja filha (para trocar). */
export function deveExibirSeletorIgrejasNoHeader(
  organizacaoAtiva: OrganizacaoContexto | null | undefined,
) {
  if (!organizacaoAtiva || isInstanciaIgrejaIndividual(organizacaoAtiva)) return false;
  return isInstanciaCampo(organizacaoAtiva) || isIgrejaFilhaDeCampo(organizacaoAtiva);
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

export const studentsApi = {
  fetchAlunos,
  fetchAlunosInativos,
  fetchAlunosPage,
  createAluno,
  importarAlunosEmLote,
  confirmarImportacaoAlunos,
  desfazerImportacaoAlunos,
  fetchHistoricoImportacoesAlunos,
  updateAluno,
  deleteAluno,
  restoreAluno,
  fetchHistoricoAluno,
  buildMatriculadosAlunos,
};

export const teachersApi = {
  fetchProfessoresIgreja,
  addProfessorTurma,
  removeProfessorTurma,
  buildMatriculadosProfessores,
};

export const attendanceApi = {
  fetchAttendanceByLessonClass,
  fetchAttendanceSheets,
  saveAttendanceRegistration,
  createAttendanceSheet,
  updateAttendanceSheet,
  saveAttendanceRecords,
  ensureAttendanceSheet,
};

export const rankingApi = {
  fetchProfessorRanking,
};

export type NotificationKind =
  | "ATTENDANCE_PENDING"
  | "LESSON_TODAY"
  | "LESSON_FINALIZE"
  | "MAGAZINE_PAYMENT"
  | "BIRTHDAY_TODAY";

export type PortalNotification = {
  id: number;
  kind: NotificationKind;
  title: string;
  body: string;
  actionPath: string;
  severity: "info" | "warning";
  metadata: Record<string, unknown>;
  read: boolean;
  readAt: string | null;
  createdAt: string;
};

export type NotificationsListResponse = {
  results: PortalNotification[];
  unreadCount: number;
};

function mapNotification(item: Record<string, unknown>): PortalNotification {
  return {
    id: Number(item.id),
    kind: item.kind as NotificationKind,
    title: String(item.title ?? ""),
    body: String(item.body ?? ""),
    actionPath: String(item.action_path ?? "/"),
    severity: (item.severity === "warning" ? "warning" : "info") as "info" | "warning",
    metadata: (item.metadata as Record<string, unknown>) ?? {},
    read: Boolean(item.read),
    readAt: item.read_at ? String(item.read_at) : null,
    createdAt: String(item.created_at ?? ""),
  };
}

export async function fetchNotifications(sync = true): Promise<NotificationsListResponse> {
  const params = new URLSearchParams({ sync: sync ? "1" : "0" });
  const data = await request<Record<string, unknown>>(`/notifications/?${params.toString()}`);
  const results = Array.isArray(data.results) ? data.results : [];
  return {
    results: results.map((item) => mapNotification(item as Record<string, unknown>)),
    unreadCount: Number(data.unread_count ?? 0),
  };
}

export async function markNotificationRead(id: number): Promise<NotificationsListResponse> {
  const data = await request<Record<string, unknown>>(`/notifications/${id}/read/`, {
    method: "PATCH",
  });
  const notification = data.notification as Record<string, unknown> | undefined;
  return {
    results: notification ? [mapNotification(notification)] : [],
    unreadCount: Number(data.unread_count ?? 0),
  };
}

export async function markAllNotificationsRead(): Promise<{ unreadCount: number }> {
  const data = await request<Record<string, unknown>>("/notifications/read-all/", {
    method: "POST",
  });
  return { unreadCount: Number(data.unread_count ?? 0) };
}

export type AnexoLicao = {
  id: string;
  licaoId: string;
  nome: string;
  descricao: string;
  tamanho: number;
  contentType: string;
  url: string;
  autorNome: string;
  podeExcluir: boolean;
  criadoEm: string;
};

type AnexoLicaoApi = {
  id: number | string;
  lesson: number | string;
  nome_original: string;
  descricao: string;
  tamanho: number;
  content_type: string;
  arquivo_url: string;
  autor_nome: string;
  pode_excluir: boolean;
  created_at: string;
};

function mapAnexoLicao(item: AnexoLicaoApi): AnexoLicao {
  return {
    id: String(item.id),
    licaoId: String(item.lesson),
    nome: item.nome_original,
    descricao: item.descricao ?? "",
    tamanho: item.tamanho ?? 0,
    contentType: item.content_type ?? "",
    url: item.arquivo_url,
    autorNome: item.autor_nome ?? "",
    podeExcluir: Boolean(item.pode_excluir),
    criadoEm: item.created_at,
  };
}

export async function fetchAnexosLicao(licaoId: string): Promise<AnexoLicao[]> {
  const data = await request<unknown>(
    `/lesson-attachments/?lesson_id=${encodeURIComponent(licaoId)}`,
  );
  return getResults<AnexoLicaoApi>(data).map(mapAnexoLicao);
}

export async function uploadAnexoLicao(
  licaoId: string,
  arquivo: File,
  descricao = "",
): Promise<AnexoLicao> {
  const formData = new FormData();
  formData.append("lesson", licaoId);
  formData.append("arquivo", arquivo);
  if (descricao) formData.append("descricao", descricao);

  const data = await request<AnexoLicaoApi>("/lesson-attachments/", {
    method: "POST",
    body: formData,
  });
  return mapAnexoLicao(data);
}

export async function excluirAnexoLicao(anexoId: string): Promise<void> {
  await request(`/lesson-attachments/${encodeURIComponent(anexoId)}/`, {
    method: "DELETE",
  });
}
