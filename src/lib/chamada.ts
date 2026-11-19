import type { AttendanceSheet } from "@/lib/portalApi";

export type ChamadaTurmaStatus = "nao_iniciada" | "rascunho" | "concluida";

export function getChamadaTurmaStatus(sheet?: AttendanceSheet | null): ChamadaTurmaStatus {
  if (!sheet) return "nao_iniciada";
  return sheet.status === "CONCLUIDA" || Boolean(sheet.finalizedAt)
    ? "concluida"
    : "rascunho";
}

export const chamadaStatusLabel: Record<ChamadaTurmaStatus, string> = {
  nao_iniciada: "Não iniciada",
  rascunho: "Rascunho",
  concluida: "Concluída",
};

/** Identifica a presença de um professor numa turma específica. */
export function chavePresencaProfessor(turmaId: string, professorId: number) {
  return `${turmaId}:${professorId}`;
}

type TurmaComProfessores = {
  id: string;
  professorUsers: Array<{ id: number }>;
};

type FichaComProfessores = {
  classGroup: string;
  professor?: number | null;
  professorPresente?: boolean;
  teachers: Array<{ user: number; presente: boolean }>;
};

/**
 * Presença gravada no servidor para cada par (turma, professor).
 *
 * Sempre devolve uma entrada por professor de cada turma — ausente é `false`
 * explícito, não `undefined`, para que a tela saiba distinguir "o servidor diz
 * ausente" de "o usuário ainda não mexeu".
 *
 * Fichas antigas, sem registro por professor, caem no par legado
 * (`professor`, `professorPresente`) da própria ficha.
 */
export function presencaProfessoresDoServidor({
  turmas,
  sheets,
}: {
  turmas: TurmaComProfessores[];
  sheets: FichaComProfessores[];
}): Record<string, boolean> {
  const porTurma = new Map(sheets.map((sheet) => [sheet.classGroup, sheet]));
  const presenca: Record<string, boolean> = {};

  for (const turma of turmas) {
    const sheet = porTurma.get(turma.id);
    for (const professor of turma.professorUsers) {
      const registro = sheet?.teachers.find(
        (teacher) => teacher.user === professor.id,
      );
      const legado =
        sheet?.professor === professor.id && Boolean(sheet?.professorPresente);
      presenca[chavePresencaProfessor(turma.id, professor.id)] = registro
        ? registro.presente
        : legado;
    }
  }

  return presenca;
}

/**
 * Chaves em que a edição local difere do servidor. Comparar com o servidor —
 * em vez de só olhar "tem edição?" — evita acusar pendência quando o usuário
 * marca e desmarca o mesmo professor.
 */
export function alteracoesPendentesProfessores(
  servidor: Record<string, boolean>,
  edicoes: Record<string, boolean>,
): string[] {
  return Object.keys(edicoes).filter(
    (chave) => edicoes[chave] !== (servidor[chave] ?? false),
  );
}

export function isSecretarioOuAdmin(papeis: {
  isAdminSistema: boolean;
  hasRole: (...roles: string[]) => boolean;
}) {
  return (
    papeis.isAdminSistema ||
    papeis.hasRole("SECRETARIO_IGREJA", "SECRETARIO_CAMPO", "ADMINISTRADOR")
  );
}

export function isSomenteProfessor(papeis: {
  isAdminSistema: boolean;
  hasRole: (...roles: string[]) => boolean;
}) {
  return papeis.hasRole("PROFESSOR") && !isSecretarioOuAdmin(papeis);
}

export function podeGerenciarTrimestres(papeis: {
  isAdminSistema: boolean;
  hasRole: (...roles: string[]) => boolean;
}) {
  return isSecretarioOuAdmin(papeis);
}

/** Professor registra a ficha da EBD nas turmas em que leciona (sem restrição de data). */
export function professorPodeRegistrarChamada(
  turmasProfessor: Array<{ id: number | string }>,
  classId: string,
) {
  return turmasProfessor.some((t) => String(t.id) === classId);
}

export function podeEditarChamadaNaTurma(params: {
  podeEditarFrequencia: boolean;
  isProfessor: boolean;
  turmasProfessor: Array<{ id: number | string }>;
  classId: string;
}) {
  if (!params.podeEditarFrequencia) return false;
  if (params.isProfessor) {
    return professorPodeRegistrarChamada(params.turmasProfessor, params.classId);
  }
  return true;
}

export function mensagemBloqueioChamada(params: {
  podeEditarFrequencia: boolean;
}): string | null {
  if (!params.podeEditarFrequencia) {
    return "Você não tem permissão para registrar a EBD desta turma.";
  }
  return null;
}
