import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import type { FinanceResumoPorTurma } from "@/lib/portalApi";
import { cn } from "@/lib/utils";

type FinanceTurmasBreakdownProps = {
  turmas: FinanceResumoPorTurma[];
  total: number;
  turmaFilter: string;
  onTurmaFilterChange: (classId: string) => void;
};

export function FinanceTurmasBreakdown({
  turmas,
  total,
  turmaFilter,
  onTurmaFilterChange,
}: FinanceTurmasBreakdownProps) {
  const ordenadas = [...turmas].sort((a, b) => b.valor - a.valor);

  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
        <CardTitle className="text-base">Distribuição por turma</CardTitle>
        {turmaFilter !== "todas" ? (
          <button
            type="button"
            className="text-xs font-medium text-primary hover:underline"
            onClick={() => onTurmaFilterChange("todas")}
          >
            Limpar filtro de turma
          </button>
        ) : null}
      </CardHeader>
      <CardContent>
        {ordenadas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma turma cadastrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-2 font-medium">Turma</th>
                  <th className="pb-2 pr-2 text-right font-medium">Total</th>
                  <th className="pb-2 w-28 text-right font-medium">%</th>
                  <th className="pb-2 pl-2 font-medium">Participação</th>
                </tr>
              </thead>
              <tbody>
                {ordenadas.map((turma) => {
                  const pct = total > 0 ? Math.round((turma.valor / total) * 100) : 0;
                  const selecionada = turmaFilter === String(turma.classId);
                  return (
                    <tr
                      key={turma.classId}
                      className={cn(
                        "cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/50",
                        selecionada && "bg-primary/5",
                      )}
                      onClick={() =>
                        onTurmaFilterChange(
                          selecionada ? "todas" : String(turma.classId),
                        )
                      }
                    >
                      <td className="py-2.5 pr-2">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: turma.cor || "hsl(197,94%,39%)" }}
                          />
                          <span className="font-medium">{turma.nome}</span>
                        </span>
                      </td>
                      <td className="py-2.5 pr-2 text-right tabular-nums">
                        {formatCurrency(turma.valor)}
                      </td>
                      <td className="py-2.5 pr-2 text-right text-muted-foreground tabular-nums">
                        {pct}%
                      </td>
                      <td className="py-2.5 pl-2">
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: turma.cor || "hsl(197,94%,39%)",
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Clique em uma turma para filtrar os gráficos e o histórico abaixo.
        </p>
      </CardContent>
    </Card>
  );
}
