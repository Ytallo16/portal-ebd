/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users, TrendingUp, DollarSign, UserPlus, BookOpen, CalendarDays,
} from "lucide-react";
import {
  fetchDashboardAttendanceEvolution,
  fetchDashboardBirthdays,
  fetchDashboardClassComposition,
  fetchDashboardOfferingEvolution,
  fetchDashboardSummary,
  fetchLicoes,
  weekLabel,
} from "@/lib/portalApi";
import { formatCurrency, getIniciais } from "@/lib/formatters";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";

export default function Dashboard() {
  const { data: summary } = useQuery({ queryKey: ["dash-summary"], queryFn: fetchDashboardSummary });
  const { data: attendanceEvolution = [] } = useQuery({ queryKey: ["dash-attendance"], queryFn: fetchDashboardAttendanceEvolution });
  const { data: classComposition = [] } = useQuery({ queryKey: ["dash-composition"], queryFn: fetchDashboardClassComposition });
  const { data: offeringEvolution = [] } = useQuery({ queryKey: ["dash-offering"], queryFn: fetchDashboardOfferingEvolution });
  const { data: birthdays = [] } = useQuery({ queryKey: ["dash-birthdays"], queryFn: fetchDashboardBirthdays });
  const { data: licoes = [] } = useQuery({ queryKey: ["licoes"], queryFn: () => fetchLicoes() });

  const hoje = new Date();
  const dataFormatada = hoje.toLocaleDateString("pt-BR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const frequenciaSemanal = attendanceEvolution.map((f) => ({
    semana: weekLabel(f.data),
    presentes: f.presentes,
    ausentes: f.ausentes,
  }));

  const composicaoPorClasse = classComposition.map((c: any, index: number) => ({
    nome: c.nome,
    valor: c.total,
    cor: c.cor || ["#125A94", "#068CC3", "#0D9488", "#D946EF", "#F97316"][index % 5],
  }));

  const ofertasMensais = offeringEvolution.map((o: any) => ({
    mes: new Date(`${o.data}T12:00:00`).toLocaleDateString("pt-BR", { month: "short" }),
    valor: Number(o.total),
  }));

  const totalOfertas = offeringEvolution.reduce((acc: number, item: any) => acc + Number(item.total), 0);
  const frequenciaMedia = summary
    ? Math.round((summary.attendance.presentes / Math.max(summary.attendance.presentes + summary.attendance.ausentes, 1)) * 100)
    : 0;

  const kpis = [
    { label: "Frequência Média", value: `${frequenciaMedia}%`, icon: TrendingUp, accent: "text-primary" },
    { label: "Total de Alunos", value: String(summary?.total_students ?? 0), icon: Users, accent: "text-secondary" },
    { label: "Ofertas", value: formatCurrency(Number(summary?.total_offerings ?? 0)), icon: DollarSign, accent: "text-success" },
    { label: "Visitantes", value: String(0), icon: UserPlus, accent: "text-warning" },
  ];

  const proximaLicao = licoes.find((l) => l.status === "Aberta") ?? licoes[0];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-sm text-muted-foreground capitalize">{dataFormatada}</p>
      </div>

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
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={frequenciaSemanal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="semana" tick={{ fontSize: 10 }} interval={0} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="presentes" stroke="hsl(207,79%,33%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Composição por Classe</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={composicaoPorClasse.slice(0, 7)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="valor"
                  nameKey="nome"
                  label={({ nome, percent }) => `${String(nome).split(" ")[0]} ${(Number(percent) * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={10}
                >
                  {composicaoPorClasse.slice(0, 7).map((entry, idx) => (
                    <Cell key={idx} fill={entry.cor} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolução das Ofertas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ofertasMensais}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} interval={0} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="valor" fill="hsl(197,94%,39%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{formatCurrency(totalOfertas)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> Aniversariantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {birthdays.map((a: any) => (
              <div key={a.nome} className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                    {getIniciais(a.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.nome}</p>
                  <p className="text-xs text-muted-foreground">{a.turma ?? "—"}</p>
                </div>
                <Badge variant={a.dias_para_aniversario === 0 ? "default" : "secondary"} className="shrink-0 text-xs">
                  {a.dias_para_aniversario === 0 ? "Hoje" : a.dias_para_aniversario === 1 ? "Amanhã" : `${a.dias_para_aniversario} dias`}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Próxima Lição
            </CardTitle>
          </CardHeader>
          {proximaLicao && (
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Lição {proximaLicao.numero}:</span>
                <p className="font-medium">{proximaLicao.tema}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Data</span>
                  <p>{new Date(`${proximaLicao.data}T12:00:00`).toLocaleDateString("pt-BR")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Revista</span>
                  <p className="truncate">{proximaLicao.revista}</p>
                </div>
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground">Texto Áureo</span>
                <p className="italic">{proximaLicao.textoAureo}</p>
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground">Objetivo</span>
                <p>{proximaLicao.objetivo}</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
