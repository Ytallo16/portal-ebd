import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowUpDown,
  BookOpen,
  CalendarDays,
  ClipboardList,
  TrendingUp,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import { ApiError } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, getIniciais } from "@/lib/formatters";
import { licoesTurmaPath } from "@/lib/licoesRoutes";
import { fetchProfessorDashboard } from "@/lib/portalApi";

export default function DashboardProfessor() {
  const navigate = useNavigate();
  const { activeOrgId, podeCarregarOperacional } = usePermissions();
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState<number | undefined>();
  const [mostrarPresentes, setMostrarPresentes] = useState(true);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "dash-professor", turmaSelecionadaId),
    queryFn: () => fetchProfessorDashboard(turmaSelecionadaId),
    enabled: podeCarregarOperacional,
    retry: false,
  });

  const evolucaoChart = useMemo(
    () =>
      (data?.evolucaoFrequencia ?? []).map((item) => ({
        label: `L${item.licaoNumero}`,
        pct: item.pct,
        presentes: item.presentes,
      })),
    [data],
  );

  const rankingExibido = useMemo(() => {
    const lista = [...(data?.rankingAlunos ?? [])];
    if (mostrarPresentes) {
      return lista
        .filter((aluno) => aluno.presencas > 0)
        .sort((a, b) => b.presencas - a.presencas || a.nome.localeCompare(b.nome))
        .slice(0, 5);
    }
    return lista
      .filter((aluno) => aluno.ausencias > 0)
      .sort((a, b) => b.ausencias - a.ausencias || a.nome.localeCompare(b.nome))
      .slice(0, 5);
  }, [data, mostrarPresentes]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando sua turma...</p>;
  }

  const semTurmaVinculada =
    isError && error instanceof ApiError && (error.status === 404 || error.status === 403);

  if (semTurmaVinculada || !data) {
    return (
      <div className="space-y-3 animate-fade-in">
        <h1 className="text-2xl font-bold">Minha turma</h1>
        <p className="text-sm text-muted-foreground">
          Nenhuma turma vinculada ao seu perfil. Peça ao secretário para associá-lo a uma turma em
          Turmas → detalhes da turma → Professores.
        </p>
      </div>
    );
  }

  const kpis = [
    {
      label: "Alunos na turma",
      value: String(data.turma.totalAlunos),
      icon: Users,
      accent: "text-secondary",
    },
    {
      label: "Frequência média",
      value: `${data.resumo.frequenciaMediaPct}%`,
      icon: TrendingUp,
      accent: "text-primary",
    },
    {
      label: "Última EBD",
      value: data.resumo.ultimaEbdPct != null ? `${data.resumo.ultimaEbdPct}%` : "—",
      icon: ClipboardList,
      accent: "text-success",
    },
    {
      label: "Pendências",
      value: String(data.resumo.pendenciasRegistro),
      icon: AlertCircle,
      accent: data.resumo.pendenciasRegistro > 0 ? "text-warning" : "text-muted-foreground",
    },
  ];

  const multiplasTurmas = data.turmasDisponiveis.length > 1;

  return (
    <div className="space-y-6 animate-fade-in">
      {multiplasTurmas && (
        <div className="flex justify-end">
          <Select
            value={String(data.turma.id)}
            onValueChange={(value) => setTurmaSelecionadaId(Number(value))}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Selecione a turma" />
            </SelectTrigger>
            <SelectContent>
              {data.turmasDisponiveis.map((turma) => (
                <SelectItem key={turma.id} value={String(turma.id)}>
                  {turma.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`rounded-lg bg-muted p-2.5 ${kpi.accent}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold sm:text-2xl">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Frequência da turma</CardTitle>
          </CardHeader>
          <CardContent>
            {evolucaoChart.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum registro no trimestre ainda.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={evolucaoChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip formatter={(value: number) => [`${value}%`, "Presença"]} />
                  <Line
                    type="monotone"
                    dataKey="pct"
                    stroke="hsl(207,79%,33%)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4" />
              Aulas escaladas
              {data.trimestre ? (
                <span className="text-xs font-normal text-muted-foreground">
                  · {data.trimestre.titulo}
                </span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.aulasEscaladas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma aula pra você nesse trimestre.
              </p>
            ) : (
              <div className="space-y-2">
                {data.aulasEscaladas.map((aula) => (
                  <button
                    key={aula.id}
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                    onClick={() => {
                      if (!data.trimestre) return;
                      navigate(
                        licoesTurmaPath(
                          data.trimestre.ano,
                          data.trimestre.numero,
                          aula.numero,
                          String(data.turma.id),
                        ),
                      );
                    }}
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        Lição {aula.numero}: {aula.tema}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(aula.data)}</p>
                    </div>
                    <Badge variant={aula.registrada ? "default" : "outline"}>
                      {aula.registrada
                        ? `${aula.presentes + aula.ausentes > 0 ? `${aula.presentes} presentes` : "Registrada"}`
                        : "Pendente"}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" />
              Próxima lição
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!data.proximaLicao ? (
              <p className="text-sm text-muted-foreground">Nenhuma lição cadastrada neste trimestre.</p>
            ) : (
              <>
                <p className="font-medium">
                  Lição {data.proximaLicao.numero}: {data.proximaLicao.tema}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Data</span>
                    <p>{formatDate(data.proximaLicao.data)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Revista</span>
                    <p className="truncate">{data.proximaLicao.revista || "—"}</p>
                  </div>
                </div>
                {data.proximaLicao.textoAureo && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Texto Áureo</span>
                    <p className="italic">{data.proximaLicao.textoAureo}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                {mostrarPresentes ? (
                  <UserCheck className="h-4 w-4" />
                ) : (
                  <UserMinus className="h-4 w-4" />
                )}
                {mostrarPresentes ? "Mais presentes no trimestre" : "Mais faltas no trimestre"}
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                aria-label={
                  mostrarPresentes
                    ? "Mostrar alunos com mais faltas"
                    : "Mostrar alunos com mais presenças"
                }
                onClick={() => setMostrarPresentes((prev) => !prev)}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {rankingExibido.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {mostrarPresentes
                  ? "Nenhuma presença registrada ainda."
                  : "Nenhuma ausência registrada ainda."}
              </p>
            ) : (
              rankingExibido.map((aluno) => (
                <div key={aluno.id} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold">
                      {getIniciais(aluno.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{aluno.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {aluno.presencas} presenças · {aluno.ausencias} faltas
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {mostrarPresentes ? aluno.presencas : aluno.ausencias}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4" />
              Aniversariantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.aniversariantes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum aniversário nos próximos 30 dias.</p>
            ) : (
              data.aniversariantes.map((aluno) => (
                <div key={`${aluno.nome}-${aluno.data}`} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                      {getIniciais(aluno.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{aluno.nome}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(aluno.data)}</p>
                  </div>
                  <Badge
                    variant={aluno.diasParaAniversario === 0 ? "default" : "secondary"}
                    className="shrink-0 text-xs"
                  >
                    {aluno.diasParaAniversario === 0
                      ? "Hoje"
                      : aluno.diasParaAniversario === 1
                        ? "Amanhã"
                        : `${aluno.diasParaAniversario} dias`}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
