export type FaixaEtariaModo = "idades" | "texto";

export type FaixaEtariaFormValue = {
  modo: FaixaEtariaModo;
  idadeMin: string;
  idadeMax: string;
  semIdadeMaxima: boolean;
  textoLivre: string;
};

export const FAIXA_ETARIA_VAZIA: FaixaEtariaFormValue = {
  modo: "idades",
  idadeMin: "",
  idadeMax: "",
  semIdadeMaxima: false,
  textoLivre: "",
};

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Converte o texto salvo no backend para o formulário. */
export function parseFaixaEtaria(valor: string | undefined | null): FaixaEtariaFormValue {
  const raw = (valor ?? "").trim();
  if (!raw) {
    return { ...FAIXA_ETARIA_VAZIA };
  }

  const texto = normalizar(raw);

  const aberto = texto.match(/^(\d{1,3})\s*\+(?:\s*anos?)?$/);
  if (aberto) {
    return {
      modo: "idades",
      idadeMin: aberto[1],
      idadeMax: "",
      semIdadeMaxima: true,
      textoLivre: "",
    };
  }

  const intervalo = texto.match(/^(\d{1,3})\s*(?:-|–|a)\s*(\d{1,3})(?:\s*anos?)?$/);
  if (intervalo) {
    return {
      modo: "idades",
      idadeMin: intervalo[1],
      idadeMax: intervalo[2],
      semIdadeMaxima: false,
      textoLivre: "",
    };
  }

  return {
    modo: "texto",
    idadeMin: "",
    idadeMax: "",
    semIdadeMaxima: false,
    textoLivre: raw,
  };
}

/** Monta o texto persistido em `faixa_etaria`. */
export function formatFaixaEtaria(valor: FaixaEtariaFormValue): string {
  if (valor.modo === "texto") {
    return valor.textoLivre.trim();
  }

  const min = Number.parseInt(valor.idadeMin, 10);
  if (!Number.isFinite(min) || min < 0) {
    return "";
  }

  if (valor.semIdadeMaxima) {
    return `${min}+ anos`;
  }

  const max = Number.parseInt(valor.idadeMax, 10);
  if (!Number.isFinite(max) || max < 0) {
    return "";
  }

  return `${min} a ${max} anos`;
}

export function validarFaixaEtaria(valor: FaixaEtariaFormValue): string | null {
  if (valor.modo === "texto") {
    if (!valor.textoLivre.trim()) {
      return "Informe a descrição da faixa etária.";
    }
    return null;
  }

  const min = Number.parseInt(valor.idadeMin, 10);
  if (!Number.isFinite(min) || min < 0 || min > 120) {
    return "Informe a idade inicial (0 a 120).";
  }

  if (valor.semIdadeMaxima) {
    return null;
  }

  const max = Number.parseInt(valor.idadeMax, 10);
  if (!Number.isFinite(max) || max < 0 || max > 120) {
    return "Informe a idade final (0 a 120).";
  }

  if (min > max) {
    return "A idade inicial não pode ser maior que a final.";
  }

  return null;
}
