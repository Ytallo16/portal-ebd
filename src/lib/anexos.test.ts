import { describe, expect, it } from "vitest";
import { formatarTamanhoArquivo, validarAnexo, MAX_ANEXO_BYTES } from "./anexos";

function arquivoFalso(nome: string, tamanho: number): File {
  const file = new File(["x"], nome, { type: "application/pdf" });
  Object.defineProperty(file, "size", { value: tamanho });
  return file;
}

describe("validarAnexo", () => {
  it("aceita pdf dentro do limite", () => {
    expect(validarAnexo(arquivoFalso("plano.pdf", 1024))).toBeNull();
  });

  it("recusa extensao nao permitida", () => {
    expect(validarAnexo(arquivoFalso("virus.exe", 1024))).toMatch(/Formato não permitido/);
  });

  it("recusa arquivo acima de 5 MB", () => {
    expect(validarAnexo(arquivoFalso("grande.pdf", MAX_ANEXO_BYTES + 1))).toMatch(/5 MB/);
  });

  it("recusa arquivo vazio", () => {
    expect(validarAnexo(arquivoFalso("vazio.pdf", 0))).toMatch(/vazio/);
  });

  it("ignora maiusculas na extensao", () => {
    expect(validarAnexo(arquivoFalso("SLIDES.PPTX", 2048))).toBeNull();
  });
});

describe("formatarTamanhoArquivo", () => {
  it("formata bytes", () => {
    expect(formatarTamanhoArquivo(512)).toBe("512 B");
  });

  it("formata kilobytes", () => {
    expect(formatarTamanhoArquivo(2048)).toBe("2,0 KB");
  });

  it("formata megabytes", () => {
    expect(formatarTamanhoArquivo(3 * 1024 * 1024)).toBe("3,0 MB");
  });
});
