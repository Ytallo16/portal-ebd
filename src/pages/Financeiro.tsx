import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import { DollarSign, TrendingUp, Award } from "lucide-react";
import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import { fetchOfferings, fetchTurmas, monthLabel } from "@/lib/portalApi";
import { formatCurrency, formatDate } from "@/lib/formatters";

export default function Financeiro() {
  const [modo, setModo] = useState("geral");
  const [turmaFilter, setTurmaFilter] = useState("todas");
  const { activeOrgId, podeCarregarOperacional } = usePermissions();

  const { data: turmas = [] } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "turmas"),
    queryFn: fetchTurmas,
    enabled: podeCarregarOperacional,
  });
  const { data: ofertas = [], isLoading } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "offerings"),
    queryFn: () => fetchOfferings(),
    enabled: podeCarregarOperacional,
  });

  const turmaById = useMemo(() => new Map(turmas.map((t) => [t.id, t.nome])), [turmas]);

  const ofertasFiltradas = turmaFilter === "todas"
    ? ofertas
    : ofertas.filter((o) => o.turmaId === turmaFilter);

  const total = ofertasFiltradas.reduce((s, o) => s + o.valor, 0);
  const media = ofertasFiltradas.length > 0 ? total / ofertasFiltradas.length : 0;

  const ofertasPorTurma = turmas
    .map((t) => ({
      turma: t.nome.length > 8 ? `${t.nome.slice(0, 8)}…` : t.nome,
      valor: ofertas.filter((o) => o.turmaId === t.id).reduce((s, o) => s + o.valor, 0),
    }))
    .filter((o) => o.valor > 0);

  const turmaDestaque = ofertasPorTurma.reduce(
    (best, cur) => (cur.valor > best.valor ? cur : best),
    ofertasPorTurma[0] || { turma: "—", valor: 0 },
  );

  const evolucaoMensal = Array.from(
    ofertas.reduce((acc, item) => {
      const m = monthLabel(item.data);
      acc.set(m, (acc.get(m) ?? 0) + item.valor);
      return acc;
    }, new Map<string, number>()),
  ).map(([mes, valor]) => ({ mes, valor }));

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando financeiro...</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Select value={modo} onValueChange={setModo}>
            <SelectTrigger className="w-full sm:w-32 touch-target"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="geral">Geral</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
              <SelectItem value="licao">Lição</SelectItem>
            </SelectContent>
          </Select>
          <Select value={turmaFilter} onValueChange={setTurmaFilter}>
            <SelectTrigger className="w-full sm:w-40 touch-target"><SelectValue placeholder="Turma" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as turmas</SelectItem>
              {turmas.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <DollarSign className="h-5 w-5 text-success" />
            <div><p className="text-xl font-bold">{formatCurrency(total)}</p><p className="text-xs text-muted-foreground">Total Geral</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <DollarSign className="h-5 w-5 text-primary" />
            <div><p className="text-xl font-bold">{formatCurrency(total)}</p><p className="text-xs text-muted-foreground">Ofertas do Período</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <TrendingUp className="h-5 w-5 text-secondary" />
            <div><p className="text-xl font-bold">{formatCurrency(media)}</p><p className="text-xs text-muted-foreground">Média por Lançamento</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Award className="h-5 w-5 text-warning" />
            <div><p className="text-xl font-bold">{turmaDestaque.turma}</p><p className="text-xs text-muted-foreground">Turma Destaque</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Evolução Mensal</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={evolucaoMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="valor" stroke="hsl(207,79%,33%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Ofertas por Turma</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ofertasPorTurma}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="turma" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="valor" fill="hsl(197,94%,39%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Histórico de Ofertas</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-2">Data</th>
                <th className="p-2">Turma</th>
                <th className="p-2">Lição</th>
                <th className="p-2 text-right">Valor</th>
                <th className="p-2">Ano</th>
              </tr>
            </thead>
            <tbody>
              {ofertasFiltradas.map((o) => (
                <tr key={o.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-2">{formatDate(o.data)}</td>
                  <td className="p-2">{turmaById.get(o.turmaId) ?? "—"}</td>
                  <td className="p-2">{o.licaoId || "—"}</td>
                  <td className="p-2 text-right font-medium">{formatCurrency(o.valor)}</td>
                  <td className="p-2"><Badge variant="secondary">{o.ano}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
