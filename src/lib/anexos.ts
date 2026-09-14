/** Espelha as regras de lessons/attachments.py no backend. */
export const MAX_ANEXO_BYTES = 5 * 1024 * 1024;

export const EXTENSOES_PERMITIDAS = [
  ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx",
  ".txt", ".jpg", ".jpeg", ".png", ".webp", ".mp3", ".zip",
] as const;

export const ACCEPT_ANEXO = EXTENSOES_PERMITIDAS.join(",");

function extensaoDe(nome: string): string {
  const ponto = nome.lastIndexOf(".");
  return ponto === -1 ? "" : nome.slice(ponto).toLowerCase();
}

/** Retorna a mensagem de erro, ou null se o arquivo for válido. */
export function validarAnexo(arquivo: File): string | null {
  const extensao = extensaoDe(arquivo.name);

  if (!EXTENSOES_PERMITIDAS.includes(extensao as (typeof EXTENSOES_PERMITIDAS)[number])) {
    return `Formato não permitido. Aceitos: ${EXTENSOES_PERMITIDAS.join(", ")}.`;
  }

  if (arquivo.size <= 0) {
    return "O arquivo está vazio.";
  }

  if (arquivo.size > MAX_ANEXO_BYTES) {
    return "O arquivo excede o limite de 5 MB.";
  }

  return null;
}

export function formatarTamanhoArquivo(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace(".", ",")} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}
