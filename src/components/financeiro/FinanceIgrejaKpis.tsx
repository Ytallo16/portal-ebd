import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { FinanceResumo } from "@/lib/portalApi";

type FinanceIgrejaKpisProps = {
  summary: FinanceResumo["summary"];
  turmasComOferta: number;
  totalTurmas: number;
  pctDestaque: number;
};

export function FinanceIgrejaKpis({
  summary,
  turmasComOferta,
  totalTurmas,
  pctDestaque,
}: FinanceIgrejaKpisProps) {
  const items = [
    {
      label: "Total no período",
      value: formatCurrency(summary.total),
      hint: "Soma das ofertas no filtro",
      className: "sm:col-span-2 lg:col-span-2",
      highlight: true,
    },
    {
      label: "Lançamentos",
      value: String(summary.lancamentos),
      hint: "Registros de oferta",
      className: "",
    },
    {
      label: "Média por lançamento",
      value: formatCurrency(summary.media),
      hint: "Valor médio",
      className: "",
    },
    {
      label: "Turmas com oferta",
      value: `${turmasComOferta} de ${totalTurmas}`,
      hint: "Turmas que registraram valor",
      className: "",
    },
    {
      label: "Turma destaque",
      value: summary.destaque.label,
      hint:
        summary.destaque.valor > 0
          ? `${formatCurrency(summary.destaque.valor)} · ${pctDestaque}% do total`
          : "Nenhuma oferta no período",
      className: "sm:col-span-2 lg:col-span-2",
    },
  ];

  return (
    <Card>
      <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {items.map((item) => (
          <div
            key={item.label}
            className={cn(
              "rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5",
              item.className,
              item.highlight && "bg-primary/5 border-primary/20",
            )}
          >
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p
              className={cn(
                "mt-0.5 font-bold leading-tight",
                item.highlight ? "text-2xl" : "text-lg",
              )}
            >
              {item.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
