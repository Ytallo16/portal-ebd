export function getIniciais(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("pt-BR");
}

export function formatDateDayMonth(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

export function extrairDigitosTelefone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
}

export function formatarTelefone(value: string): string {
  const digits = extrairDigitosTelefone(value);
  if (!digits) return "";

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function extrairDigitosCep(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

export function formatarCep(value: string): string {
  const digits = extrairDigitosCep(value);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/** Rótulos longos em gráficos (eixo Y/categoria) sem estourar o card no mobile. */
export function truncateChartLabel(label: string, max = 14): string {
  const text = String(label);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
