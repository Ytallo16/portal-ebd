import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ofertas, turmas, formatCurrency, formatDate, getTurmaNome } from "@/data/mock";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import { DollarSign, TrendingUp, Award } from "lucide-react";

export default function Financeiro() {
  const [modo, setModo] = useState("geral");
  const [turmaFilter, setTurmaFilter] = useState("todas");

  const ofertasFiltradas = turmaFilter === "todas"
    ? ofertas
    : ofertas.filter((o) => o.turmaId === turmaFilter);

  const total = ofertasFiltradas.reduce((s, o) => s + o.valor, 0);
  const media = ofertasFiltradas.length > 0 ? total / ofertasFiltradas.length : 0;

  // Por turma
  const ofertasPorTurma = turmas.slice(0, 8).map((t) => ({
    turma: t.nome.length > 8 ? t.nome.slice(0, 8) + "…" : t.nome,
    valor: ofertas.filter((o) => o.turmaId === t.id).reduce((s, o) => s + o.valor, 0),
  })).filter(o => o.valor > 0);

  const turmaDestaque = ofertasPorTurma.reduce((best, cur) => cur.valor > best.valor ? cur : best, ofertasPorTurma[0] || { turma: "—", valor: 0 });

  // Evolução mensal
  const evolucaoMensal = [
    { mes: "Out", valor: 480 },
    { mes: "Nov", valor: 530 },
    { mes: "Dez", valor: 610 },
    { mes: "Jan", valor: 520 },
    { mes: "Fev", valor: 560 },
    { mes: "Mar", valor: 621 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <div className="flex gap-2 flex-wrap">
          <Select value={modo} onValueChange={setModo}>
            <SelectTrigger className="w-32 touch-target"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="geral">Geral</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
              <SelectItem value="licao">Lição</SelectItem>
            </SelectContent>
          </Select>
          <Select value={turmaFilter} onValueChange={setTurmaFilter}>
            <SelectTrigger className="w-40 touch-target"><SelectValue placeholder="Turma" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as turmas</SelectItem>
              {turmas.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <DollarSign className="h-5 w-5 text-success" />
            <div><p className="text-xl font-bold">{formatCurrency(total)}</p><p className="text-xs text-muted-foreground">Total Geral</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <DollarSign className="h-5 w-5 text-primary" />
            <div><p className="text-xl font-bold">{formatCurrency(621)}</p><p className="text-xs text-muted-foreground">Ofertas do Mês</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <TrendingUp className="h-5 w-5 text-secondary" />
            <div><p className="text-xl font-bold">{formatCurrency(media)}</p><p className="text-xs text-muted-foreground">Média por Lição</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Award className="h-5 w-5 text-warning" />
            <div><p className="text-xl font-bold">{turmaDestaque.turma}</p><p className="text-xs text-muted-foreground">Turma Destaque</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Evolução Mensal</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={evolucaoMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="valor" stroke="hsl(207,79%,33%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Ofertas por Turma</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ofertasPorTurma}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="turma" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="valor" fill="hsl(197,94%,39%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Histórico de Ofertas</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-2">Data</th>
                <th className="p-2">Turma</th>
                <th className="p-2">Lição</th>
                <th className="p-2 text-right">Valor</th>
                <th className="p-2">Tri/Ano</th>
              </tr>
            </thead>
            <tbody>
              {ofertasFiltradas.map((o) => (
                <tr key={o.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-2">{formatDate(o.data)}</td>
                  <td className="p-2">{getTurmaNome(o.turmaId)}</td>
                  <td className="p-2">{o.licaoId}</td>
                  <td className="p-2 text-right font-medium">{formatCurrency(o.valor)}</td>
                  <td className="p-2"><Badge variant="secondary">{o.trimestre}T/{o.ano}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
