import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FinanceBarChart, FinanceEvolutionChart } from "@/components/financeiro/FinanceCharts";
import { FinanceFiltroField, FinanceFiltrosToolbar } from "@/components/financeiro/FinanceFiltrosToolbar";
import { FinanceIgrejaKpis } from "@/components/financeiro/FinanceIgrejaKpis";
import { FinanceLancamentosSection } from "@/components/financeiro/FinanceLancamentosSection";
import { FinanceTurmasBreakdown } from "@/components/financeiro/FinanceTurmasBreakdown";
import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import {
  fetchFinanceResumo,
  fetchLicoes,
  fetchTrimestres,
  type FinanceResumoFilters,
} from "@/lib/portalApi";

type ModoFiltro = "geral" | "trimestre" | "licao";

export function FinanceiroIgreja() {
  const [modo, setModo] = useState<ModoFiltro>("geral");
  const [turmaFilter, setTurmaFilter] = useState("todas");
  const [trimestreId, setTrimestreId] = useState("");
  const [licaoId, setLicaoId] = useState("");
  const { activeOrgId, podeVisualizarFinanceiro, organizacaoAtiva } = usePermissions();

  const { data: trimestres = [] } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "trimestres-financeiro"),
    queryFn: () => fetchTrimestres(),
    enabled: podeVisualizarFinanceiro && (modo === "trimestre" || modo === "licao"),
  });

  const trimestreSelecionado = trimestres.find((t) => t.id === trimestreId);

  const { data: licoes = [] } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "licoes-financeiro", trimestreSelecionado?.numero, trimestreSelecionado?.ano),
    queryFn: () =>
      fetchLicoes({
        trimestre: trimestreSelecionado?.numero,
        ano: trimestreSelecionado?.ano,
      }),
    enabled: podeVisualizarFinanceiro && modo === "licao" && Boolean(trimestreSelecionado),
  });

  const resumoFilters = useMemo((): FinanceResumoFilters => {
    const filters: FinanceResumoFilters = {};
    if (turmaFilter !== "todas") {
      filters.classId = turmaFilter;
    }
    if (modo === "trimestre" && trimestreSelecionado) {
      filters.trimestre = trimestreSelecionado.numero;
      filters.ano = trimestreSelecionado.ano;
    }
    if (modo === "licao" && licaoId) {
      filters.lessonId = licaoId;
    }
    return filters;
  }, [turmaFilter, modo, trimestreSelecionado, licaoId]);

  const { data, isLoading } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "finance-resumo", resumoFilters),
    queryFn: () => fetchFinanceResumo(resumoFilters),
    enabled: podeVisualizarFinanceiro,
  });

  const barTurmaData = useMemo(
    () =>
      (data?.porTurma ?? [])
        .filter((t) => t.valor > 0)
        .map((t) => ({
          label: t.nome.length > 12 ? `${t.nome.slice(0, 12)}…` : t.nome,
          valor: t.valor,
          fill: t.cor || "hsl(197,94%,39%)",
        })),
    [data?.porTurma],
  );

  const turmasComOferta = useMemo(
    () => (data?.porTurma ?? []).filter((t) => t.valor > 0).length,
    [data?.porTurma],
  );

  const pctDestaque = useMemo(() => {
    const total = data?.summary.total ?? 0;
    const destaque = data?.summary.destaque.valor ?? 0;
    return total > 0 ? Math.round((destaque / total) * 100) : 0;
  }, [data?.summary.destaque.valor, data?.summary.total]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando financeiro...</p>;
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Nenhum dado financeiro disponível.</p>;
  }

  const titulo = organizacaoAtiva?.nome ?? data.organizacaoNome;
  const totalGeral = data.summary.total;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Financeiro — {titulo}</h1>
        <p className="text-sm text-muted-foreground">
          Resumo das ofertas da igreja · use os filtros para refinar o período e a turma
        </p>
      </div>

      <FinanceFiltrosToolbar>
        <FinanceFiltroField label="Período" className="sm:min-w-[7rem]">
          <Select
            value={modo}
            onValueChange={(v) => {
              setModo(v as ModoFiltro);
              setTrimestreId("");
              setLicaoId("");
            }}
          >
            <SelectTrigger className="touch-target w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="geral">Geral</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
              <SelectItem value="licao">Lição</SelectItem>
            </SelectContent>
          </Select>
        </FinanceFiltroField>

        {modo === "trimestre" && (
          <FinanceFiltroField label="Trimestre" className="sm:min-w-[12rem]">
            <Select value={trimestreId} onValueChange={setTrimestreId}>
              <SelectTrigger className="touch-target w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {trimestres.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.titulo || `${t.numero}º ${t.ano}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FinanceFiltroField>
        )}

        {modo === "licao" && (
          <>
            <FinanceFiltroField label="Trimestre" className="sm:min-w-[10rem]">
              <Select
                value={trimestreId}
                onValueChange={(v) => {
                  setTrimestreId(v);
                  setLicaoId("");
                }}
              >
                <SelectTrigger className="touch-target w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {trimestres.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.titulo || `${t.numero}º ${t.ano}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FinanceFiltroField>
            <FinanceFiltroField label="Lição" className="sm:min-w-[12rem]">
              <Select value={licaoId} onValueChange={setLicaoId} disabled={!trimestreId}>
                <SelectTrigger className="touch-target w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {licoes.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.numero} — {l.tema}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FinanceFiltroField>
          </>
        )}

        <FinanceFiltroField label="Turma" className="sm:min-w-[10rem]">
          <Select value={turmaFilter} onValueChange={setTurmaFilter}>
            <SelectTrigger className="touch-target w-full">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as turmas</SelectItem>
              {data.porTurma.map((t) => (
                <SelectItem key={t.classId} value={String(t.classId)}>
                  {t.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FinanceFiltroField>
      </FinanceFiltrosToolbar>

      <FinanceIgrejaKpis
        summary={data.summary}
        turmasComOferta={turmasComOferta}
        totalTurmas={data.porTurma.length}
        pctDestaque={pctDestaque}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <FinanceEvolutionChart title="Evolução mensal" data={data.evolucaoMensal} />
        <FinanceBarChart
          title="Ofertas por turma"
          data={barTurmaData.length > 0 ? barTurmaData : [{ label: "—", valor: 0 }]}
        />
      </div>

      <FinanceTurmasBreakdown
        turmas={data.porTurma}
        total={totalGeral}
        turmaFilter={turmaFilter}
        onTurmaFilterChange={setTurmaFilter}
      />

      <FinanceLancamentosSection
        title="Histórico de ofertas"
        filters={resumoFilters}
        emptyMessage="Nenhum lançamento no filtro atual."
      />
    </div>
  );
}
