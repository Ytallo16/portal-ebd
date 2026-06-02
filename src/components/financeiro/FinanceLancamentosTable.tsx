import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FINANCE_PANEL_CARD_CLASS,
  FINANCE_PANEL_PAGE_SIZE,
} from "@/components/financeiro/financePanelLayout";
import { cn } from "@/lib/utils";
import type { FinanceResumoPaginacao, FinanceResumoRecente } from "@/lib/portalApi";
import { formatCurrency, formatDate } from "@/lib/formatters";

type FinanceLancamentosTableProps = {
  className?: string;
  title?: string;
  recentes: FinanceResumoRecente[];
  paginacao: FinanceResumoPaginacao;
  page: number;
  onPageChange: (page: number) => void;
  showIgrejaColumn?: boolean;
  emptyMessage?: string;
  isLoading?: boolean;
  isFetching?: boolean;
};

export function financeLancamentosPageSize() {
  return FINANCE_PANEL_PAGE_SIZE;
}

export function FinanceLancamentosTable({
  className,
  title = "Últimos lançamentos",
  recentes,
  paginacao,
  page,
  onPageChange,
  showIgrejaColumn = false,
  emptyMessage = "Nenhum lançamento encontrado.",
  isLoading = false,
  isFetching = false,
}: FinanceLancamentosTableProps) {
  const colSpan = showIgrejaColumn ? 4 : 3;
  const inicio = paginacao.total === 0 ? 0 : (page - 1) * paginacao.pageSize + 1;
  const fim = Math.min(page * paginacao.pageSize, paginacao.total);

  const paddedRows = useMemo(() => {
    if (isLoading || recentes.length === 0) return null;
    const rows: Array<FinanceResumoRecente | null> = [...recentes];
    while (rows.length < FINANCE_PANEL_PAGE_SIZE) {
      rows.push(null);
    }
    return rows;
  }, [isLoading, recentes]);

  return (
    <Card
      className={cn(
        FINANCE_PANEL_CARD_CLASS,
        className,
        isFetching && !isLoading && "opacity-80 transition-opacity",
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col space-y-3">
        <div className="flex-1 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-2">Data</th>
                {showIgrejaColumn && <th className="p-2">Igreja</th>}
                <th className="p-2">Turma</th>
                <th className="p-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={colSpan} className="p-4 text-center text-muted-foreground">
                    Carregando lançamentos...
                  </td>
                </tr>
              ) : recentes.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="p-4 text-center text-muted-foreground">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paddedRows?.map((o, index) =>
                  o ? (
                    <tr key={o.id} className="h-10 border-b hover:bg-muted/50">
                      <td className="p-2">{formatDate(o.data)}</td>
                      {showIgrejaColumn && (
                        <td className="p-2">{o.igrejaNome ?? "—"}</td>
                      )}
                      <td className="p-2">{o.turmaNome ?? "—"}</td>
                      <td className="p-2 text-right font-medium">{formatCurrency(o.valor)}</td>
                    </tr>
                  ) : (
                    <tr key={`empty-${index}`} className="h-10 border-b">
                      <td colSpan={colSpan} className="p-2" />
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>

        {paginacao.total > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Mostrando {inicio}–{fim} de {paginacao.total} lançamentos
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => onPageChange(page - 1)}
              >
                Anterior
              </Button>
              <span className="text-xs text-muted-foreground">
                Página {page} de {paginacao.totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= paginacao.totalPages || isFetching}
                onClick={() => onPageChange(page + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
