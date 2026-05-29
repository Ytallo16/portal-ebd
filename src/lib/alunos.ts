function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Turmas infantis/crianças exigem cadastro de responsável; adultos e jovens não. */
export function turmaExigeResponsavel(faixaEtaria: string, nomeTurma = ""): boolean {
  const text = normalizarTexto(`${faixaEtaria} ${nomeTurma}`);

  if (
    /adulto|jovem|adolescente|familia|terceira idade|discipulado|novos convertidos/.test(
      text,
    )
  ) {
    return false;
  }

  if (/crianca|berc|jardim|primari|junior|infantil|bercario/.test(text)) {
    return true;
  }

  const faixa = text.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (faixa) {
    return Number(faixa[2]) <= 12;
  }

  return false;
}
