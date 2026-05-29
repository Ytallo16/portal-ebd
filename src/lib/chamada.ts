import type { AttendanceSheet } from "@/lib/portalApi";

export type ChamadaTurmaStatus = "nao_iniciada" | "registrada";

export function getChamadaTurmaStatus(sheet?: AttendanceSheet | null): ChamadaTurmaStatus {
  if (!sheet) return "nao_iniciada";
  return "registrada";
}

export const chamadaStatusLabel: Record<ChamadaTurmaStatus, string> = {
  nao_iniciada: "Não iniciada",
  registrada: "Registrada",
};

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
