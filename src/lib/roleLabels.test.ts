import { describe, expect, it } from "vitest";

import { formatPapelLabel, normalizePapelKey } from "@/lib/roleLabels";

describe("roleLabels", () => {
  it("normaliza chaves do banco para labels legíveis", () => {
    expect(formatPapelLabel("SECRETARIO_IGREJA")).toBe("Secretário de Igreja");
    expect(formatPapelLabel("SECRETARIO_CAMPO")).toBe("Secretário de Campo");
    expect(formatPapelLabel("ADMINISTRADOR")).toBe("Administrador do sistema");
    expect(formatPapelLabel("PROFESSOR")).toBe("Professor");
  });

  it("aceita aliases legados", () => {
    expect(formatPapelLabel("SECRETARIA")).toBe("Secretário de Igreja");
    expect(formatPapelLabel("ADMINISTRADOR_CAMPO")).toBe("Secretário de Campo");
  });

  it("normaliza chave canônica", () => {
    expect(normalizePapelKey(" secretario_igreja ")).toBe("SECRETARIO_IGREJA");
    expect(normalizePapelKey("ADMINISTRADOR GERAL")).toBe("ADMINISTRADOR_GERAL");
  });
});
