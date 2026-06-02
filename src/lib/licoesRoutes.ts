/** Rotas do hub Lições: /licoes → /licoes/:ano/:trimestre → /licoes/:ano/:trimestre/:licao */

export function licoesTrimestrePath(ano: number, trimestre: number) {
  return `/licoes/${ano}/${trimestre}`;
}

export function licoesLicaoPath(ano: number, trimestre: number, numeroLicao: number) {
  return `/licoes/${ano}/${trimestre}/${numeroLicao}`;
}

export function licoesTurmaPath(ano: number, trimestre: number, numeroLicao: number, turmaId: string) {
  return `/licoes/${ano}/${trimestre}/${numeroLicao}/turmas/${turmaId}`;
}

/** Link direto para registro da EBD de uma turma específica. */
export function licoesRegistroTurmaPath(
  ano: number,
  trimestre: number,
  numeroLicao: number,
  turmaId: string | number,
) {
  return licoesTurmaPath(ano, trimestre, numeroLicao, String(turmaId));
}

/** Professor: registro da EBD na turma que leciona (primeira se houver mais de uma). */
export function licoesRegistroTurmaProfessorPath(
  ano: number,
  trimestre: number,
  numeroLicao: number,
  turmasProfessor: Array<{ id: number | string }>,
  turmaId?: number | string,
): string | null {
  const turma = turmaId
    ? turmasProfessor.find((t) => String(t.id) === String(turmaId)) ?? { id: turmaId, nome: "" }
    : turmasProfessor[0];
  if (!turma) return null;
  return licoesTurmaPath(ano, trimestre, numeroLicao, String(turma.id));
}

export function licoesDestinoAoAbrirLicao(
  ano: number,
  trimestre: number,
  numeroLicao: number,
  options: { somenteProfessor: boolean; turmasProfessor: Array<{ id: number | string }> },
) {
  if (options.somenteProfessor) {
    return (
      licoesRegistroTurmaProfessorPath(ano, trimestre, numeroLicao, options.turmasProfessor) ??
      licoesTrimestrePath(ano, trimestre)
    );
  }
  return licoesLicaoPath(ano, trimestre, numeroLicao);
}

export function licoesVoltarDaTurmaPath(
  ano: number,
  trimestre: number,
  numeroLicao: number,
  somenteProfessor: boolean,
) {
  return somenteProfessor
    ? licoesTrimestrePath(ano, trimestre)
    : licoesLicaoPath(ano, trimestre, numeroLicao);
}

export function licoesGerenciarTrimestresPath() {
  return "/licoes/gerenciar-trimestres";
}

export function trimestreLabel(numero: number, ano: number) {
  return `${numero}º Trimestre ${ano}`;
}

/** Lição mais próxima de hoje (domingo da semana ou data exata). */
export function findLicaoDaSemana(
  licoes: Array<{ numero: number; data: string; id: string }>,
  hoje = new Date(),
) {
  if (licoes.length === 0) return null;

  const hojeMs = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();

  const comData = licoes
    .filter((l) => l.data)
    .map((l) => ({
      licao: l,
      diff: Math.abs(new Date(`${l.data}T12:00:00`).getTime() - hojeMs),
    }))
    .sort((a, b) => a.diff - b.diff);

  return comData[0]?.licao ?? licoes[0];
}
