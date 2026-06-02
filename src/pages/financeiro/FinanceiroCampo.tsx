import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FinanceBarChart, FinanceEvolutionChart, FinanceKpiGrid } from "@/components/financeiro/FinanceCharts";
import { FINANCE_PANEL_PAGE_SIZE } from "@/components/financeiro/financePanelLayout";
import { FinanceLancamentosSection } from "@/components/financeiro/FinanceLancamentosSection";
import { FinanceRankingIgrejas } from "@/components/financeiro/FinanceRankingIgrejas";
import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import { fetchFinanceResumo } from "@/lib/portalApi";
import { formatCurrency } from "@/lib/formatters";
import { Award, DollarSign, Hash, Info, TrendingUp } from "lucide-react";

export function FinanceiroCampo() {
  const { activeOrgId, podeVisualizarFinanceiro, organizacaoAtiva } = usePermissions();

  const { data, isLoading } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "finance-resumo"),
    queryFn: () => fetchFinanceResumo(),
    enabled: podeVisualizarFinanceiro,
  });

  const top5Grafico = useMemo(
    () =>
      (data?.porIgreja ?? [])
        .slice(0, FINANCE_PANEL_PAGE_SIZE)
        .map((i) => ({ label: i.nome, valor: i.valor })),
    [data?.porIgreja],
  );

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando financeiro...</p>;
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Nenhum dado financeiro disponível.</p>;
  }

  const titulo = organizacaoAtiva?.nome ?? data.organizacaoNome;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Financeiro — {titulo}</h1>
        <p className="text-sm text-muted-foreground">Visão geral do campo (todas as igrejas)</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Selecione uma igreja no topo para ver detalhes por turma ou lançar ofertas.
        </AlertDescription>
      </Alert>

      <FinanceKpiGrid
        items={[
          {
            label: "Total do campo",
            value: formatCurrency(data.summary.total),
            icon: <DollarSign className="h-5 w-5 text-success" />,
          },
          {
            label: "Média por lançamento",
            value: formatCurrency(data.summary.media),
            icon: <TrendingUp className="h-5 w-5 text-secondary" />,
          },
          {
            label: "Igreja destaque",
            value: data.summary.destaque.label,
            icon: <Award className="h-5 w-5 text-warning" />,
          },
          {
            label: "Lançamentos",
            value: String(data.summary.lancamentos),
            icon: <Hash className="h-5 w-5 text-primary" />,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <FinanceEvolutionChart title="Evolução mensal do campo" data={data.evolucaoMensal} />
        <FinanceBarChart title="Ofertas por igreja" data={top5Grafico} />
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
        <FinanceRankingIgrejas igrejas={data.porIgreja} />
        <FinanceLancamentosSection showIgrejaColumn emptyMessage="Nenhum lançamento recente." />
      </div>
    </div>
  );
}
