import { describe, expect, it } from "vitest";

import {
  FAIXA_ETARIA_VAZIA,
  formatFaixaEtaria,
  parseFaixaEtaria,
  validarFaixaEtaria,
} from "@/lib/faixaEtaria";

describe("faixaEtaria", () => {
  it("parseia intervalo com hífen ou 'a'", () => {
    expect(parseFaixaEtaria("26-35 anos")).toEqual({
      modo: "idades",
      idadeMin: "26",
      idadeMax: "35",
      semIdadeMaxima: false,
      textoLivre: "",
    });
    expect(parseFaixaEtaria("6 a 12 anos")).toEqual({
      modo: "idades",
      idadeMin: "6",
      idadeMax: "12",
      semIdadeMaxima: false,
      textoLivre: "",
    });
  });

  it("parseia faixa aberta com +", () => {
    expect(parseFaixaEtaria("51+ anos")).toEqual({
      modo: "idades",
      idadeMin: "51",
      idadeMax: "",
      semIdadeMaxima: true,
      textoLivre: "",
    });
  });

  it("parseia texto livre", () => {
    expect(parseFaixaEtaria("Adultos")).toEqual({
      modo: "texto",
      idadeMin: "",
      idadeMax: "",
      semIdadeMaxima: false,
      textoLivre: "Adultos",
    });
  });

  it("formata intervalo e faixa aberta", () => {
    expect(
      formatFaixaEtaria({
        modo: "idades",
        idadeMin: "18",
        idadeMax: "25",
        semIdadeMaxima: false,
        textoLivre: "",
      }),
    ).toBe("18 a 25 anos");

    expect(
      formatFaixaEtaria({
        modo: "idades",
        idadeMin: "51",
        idadeMax: "",
        semIdadeMaxima: true,
        textoLivre: "",
      }),
    ).toBe("51+ anos");
  });

  it("valida idade inicial menor ou igual à final", () => {
    expect(
      validarFaixaEtaria({
        ...FAIXA_ETARIA_VAZIA,
        idadeMin: "10",
        idadeMax: "8",
      }),
    ).toMatch(/não pode ser maior/);
  });
});
