/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign, UserPlus, CalendarDays } from "lucide-react";
import { BirthdayDateBadge } from "@/components/dashboard/BirthdayDateBadge";
import { BirthdayColumns } from "@/components/dashboard/BirthdayColumns";
import { DashboardActionQueue } from "@/components/dashboard/DashboardActionQueue";
import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import { isSomenteProfessor } from "@/lib/chamada";
import { DashboardSkeleton } from "@/components/skeletons";
import DashboardProfessor from "@/pages/DashboardProfessor";
import {
  fetchDashboardAttendanceEvolution,
  fetchDashboardBirthdays,
  fetchDashboardClassComposition,
  fetchDashboardOfferingEvolution,
  fetchDashboardSummary,
  weekLabel,
} from "@/lib/portalApi";
import { formatCurrency } from "@/lib/formatters";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, BarChart, Bar, LabelList,
} from "recharts";

export default function Dashboard() {
  const { isAdminSistema, hasRole } = usePermissions();
  const somenteProfessor = isSomenteProfessor({ isAdminSistema, hasRole });

  if (somenteProfessor) {
    return <DashboardProfessor />;
  }

  return <DashboardIgreja />;
}

function DashboardIgreja() {
  const { activeOrgId } = usePermissions();

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "dash-summary"),
    queryFn: fetchDashboardSummary,
  });
  const { data: attendanceEvolution = [], isLoading: loadingAttendance } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "dash-attendance"),
    queryFn: fetchDashboardAttendanceEvolution,
  });
  const { data: classComposition = [], isLoading: loadingComposition } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "dash-composition"),
    queryFn: fetchDashboardClassComposition,
  });
  const { data: offeringEvolution = [], isLoading: loadingOffering } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "dash-offering"),
    queryFn: fetchDashboardOfferingEvolution,
  });
  const { data: birthdays = [], isLoading: loadingBirthdays } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "dash-birthdays"),
    queryFn: fetchDashboardBirthdays,
  });

  const isPageLoading =
    loadingSummary || loadingAttendance || loadingComposition || loadingOffering || loadingBirthdays;

  if (isPageLoading && summary === undefined) {
    return <DashboardSkeleton />;
  }

  const hoje = new Date();
  const dataFormatada = hoje.toLocaleDateString("pt-BR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const frequenciaSemanal = attendanceEvolution.map((f) => ({
    semana: weekLabel(f.data),
    presentes: f.presentes,
    ausentes: f.ausentes,
  }));

  const alunosPorTurma = classComposition
    .map((c: any, index: number) => ({
      nome: c.nome,
      valor: c.total,
      cor: c.cor || ["#125A94", "#068CC3", "#0D9488", "#D946EF", "#F97316"][index % 5],
    }))
    .sort((a, b) => b.valor - a.valor);

  const totalAlunosEmTurmas = alunosPorTurma.reduce((acc, t) => acc + t.valor, 0);

  const ofertasMensais = offeringEvolution.map((o: any) => ({
    mes: new Date(`${o.data}T12:00:00`).toLocaleDateString("pt-BR", { month: "short" }),
    valor: Number(o.total),
  }));

  const totalOfertas = offeringEvolution.reduce((acc: number, item: any) => acc + Number(item.total), 0);
  const presentes = summary?.attendance?.presentes ?? 0;
  const ausentes = summary?.attendance?.ausentes ?? 0;
  const frequenciaMedia = summary
    ? Math.round((presentes / Math.max(presentes + ausentes, 1)) * 100)
    : 0;

  const kpis = [
    { label: "Frequência Média", value: `${frequenciaMedia}%`, icon: TrendingUp, accent: "text-primary" },
    { label: "Total de Alunos", value: String(summary?.total_students ?? 0), icon: Users, accent: "text-secondary" },
    { label: "Ofertas", value: formatCurrency(Number(summary?.total_offerings ?? 0)), icon: DollarSign, accent: "text-success" },
    { label: "Visitantes", value: String(summary?.total_visitors ?? 0), icon: UserPlus, accent: "text-warning" },
  ];

  const aniversariantes = birthdays.map((a: any, index: number) => ({
    key: `${a.nome}-${a.turma ?? index}`,
    nome: a.nome,
    legenda: a.turma ?? "—",
    badge: <BirthdayDateBadge data={a.data} hoje={a.dias_para_aniversario === 0} />,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-sm text-muted-foreground capitalize">{dataFormatada}</p>
      </div>

      <DashboardActionQueue />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolução da Frequência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={frequenciaSemanal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="semana" tick={{ fontSize: 10 }} interval={0} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="presentes" stroke="hsl(207,79%,33%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Alunos por Turma</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="w-full min-w-0"
              style={{ height: Math.max(200, alunosPorTurma.length * 28) }}
            >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={alunosPorTurma}
                layout="vertical"
                margin={{ top: 4, right: 28, bottom: 4, left: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="nome"
                  tick={{ fontSize: 10 }}
                  width={110}
                  interval={0}
                />
                <Tooltip formatter={(v: number) => [`${v} aluno(s)`, "Matriculados"]} />
                <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={14}>
                  {alunosPorTurma.map((entry, idx) => (
                    <Cell key={idx} fill={entry.cor} />
                  ))}
                  {/* cor fixa: a cor da turma vem do banco e pode ser clara demais para ler */}
                  <LabelList
                    dataKey="valor"
                    position="right"
                    fontSize={10}
                    fill="hsl(var(--foreground))"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {totalAlunosEmTurmas} aluno(s) em {alunosPorTurma.length} turma(s)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolução das Ofertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="chart-container h-[180px] sm:h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ofertasMensais}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} interval={0} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="valor" fill="hsl(197,94%,39%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{formatCurrency(totalOfertas)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4" /> Aniversariantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BirthdayColumns
              items={aniversariantes}
              emptyMessage="Nenhum aniversário nos próximos dias."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
