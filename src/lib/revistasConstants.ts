export type MetodoPagamentoRevista =
  | "DINHEIRO"
  | "PIX"
  | "CARTAO"
  | "TRANSFERENCIA"
  | "OUTRO";

export const METODOS_PAGAMENTO_REVISTA: Array<{ value: MetodoPagamentoRevista; label: string }> = [
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "PIX", label: "PIX" },
  { value: "CARTAO", label: "Cartão" },
  { value: "TRANSFERENCIA", label: "Transferência" },
  { value: "OUTRO", label: "Outro" },
];

export function labelMetodoPagamento(metodo: string | null | undefined): string {
  if (!metodo) return "—";
  return METODOS_PAGAMENTO_REVISTA.find((m) => m.value === metodo)?.label ?? metodo;
}
