import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FINANCE_PANEL_CARD_CLASS, FINANCE_PANEL_PAGE_SIZE } from "@/components/financeiro/financePanelLayout";
import type { FinanceResumoPorIgreja } from "@/lib/portalApi";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type RankingView = "top" | "bottom";

type FinanceRankingIgrejasProps = {
  className?: string;
  igrejas: FinanceResumoPorIgreja[];
};

export function FinanceRankingIgrejas({ className, igrejas }: FinanceRankingIgrejasProps) {
  const [view, setView] = useState<RankingView>("top");

  const sorted = useMemo(
    () => [...igrejas].sort((a, b) => b.valor - a.valor),
    [igrejas],
  );

  const topSlice = useMemo(
    () => sorted.slice(0, FINANCE_PANEL_PAGE_SIZE),
    [sorted],
  );

  const bottomSlice = useMemo(() => {
    if (sorted.length === 0) return [];
    if (sorted.length > FINANCE_PANEL_PAGE_SIZE) {
      return sorted.slice(-FINANCE_PANEL_PAGE_SIZE);
    }
    return [...sorted].sort((a, b) => a.valor - b.valor).slice(0, FINANCE_PANEL_PAGE_SIZE);
  }, [sorted]);

  const displayed = view === "top" ? topSlice : bottomSlice;

  const rows = useMemo(() => {
    const items = displayed.map((igreja) => {
      const rank = sorted.findIndex((item) => item.organizationId === igreja.organizationId) + 1;
      return { igreja, rank };
    });
    while (items.length < FINANCE_PANEL_PAGE_SIZE) {
      items.push({ igreja: null, rank: null });
    }
    return items;
  }, [displayed, sorted]);

  const canToggle = sorted.length > 0;

  return (
    <Card className={cn(FINANCE_PANEL_CARD_CLASS, "min-w-0", className)}>
      <CardHeader className="relative z-10 pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="min-w-0 flex-1 text-base">
            {view === "top" ? "5 primeiras colocadas" : "5 últimas colocadas"}
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative z-10 h-8 w-8 shrink-0"
            disabled={!canToggle}
            aria-label={
              view === "top"
                ? "Ver 5 últimas colocadas"
                : "Ver 5 primeiras colocadas"
            }
            onClick={() => setView((current) => (current === "top" ? "bottom" : "top"))}
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col space-y-3">
        <div className="min-h-0 flex-1 overflow-x-auto">
          <table className="w-full min-w-[240px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="w-10 p-2">#</th>
                <th className="p-2">Igreja</th>
                <th className="p-2 text-right">Total</th>
                <th className="p-2 text-right">Lanç.</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">
                    Nenhuma oferta registrada no campo.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) =>
                  row.igreja ? (
                    <tr key={row.igreja.organizationId} className="h-10 border-b hover:bg-muted/50">
                      <td className="p-2 text-muted-foreground">{row.rank}</td>
                      <td className="p-2">
                        <span className="truncate">{row.igreja.nome}</span>
                      </td>
                      <td className="p-2 text-right font-medium">{formatCurrency(row.igreja.valor)}</td>
                      <td className="p-2 text-right">{row.igreja.lancamentos}</td>
                    </tr>
                  ) : (
                    <tr key={`empty-${index}`} className="h-10 border-b">
                      <td colSpan={4} className="p-2" />
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>

        {sorted.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {sorted.length} igreja(s) no ranking
          </p>
        )}
      </CardContent>
    </Card>
  );
}
