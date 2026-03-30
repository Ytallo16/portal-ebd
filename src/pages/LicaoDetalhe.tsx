import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, BookMarked, DollarSign, CheckCircle, XCircle } from "lucide-react";
import { fetchAttendanceSheets, fetchLicaoById, fetchOfferings, fetchTurmas } from "@/lib/portalApi";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export default function LicaoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: licao, isLoading: loadingLicao } = useQuery({
    queryKey: ["licao", id],
    queryFn: () => fetchLicaoById(id ?? ""),
    enabled: Boolean(id),
  });
  const { data: turmas = [] } = useQuery({ queryKey: ["turmas"], queryFn: fetchTurmas });
  const { data: offerings = [] } = useQuery({ queryKey: ["offerings"], queryFn: () => fetchOfferings() });
  const { data: sheets = [] } = useQuery({ queryKey: ["attendance-sheets"], queryFn: fetchAttendanceSheets });

  const chamadaPorClasse = useMemo(() => {
    if (!id) return [];

    return turmas
      .map((t) => {
        const sheet = sheets.find((s) => s.lesson === id && s.classGroup === t.id);
        const presentes = sheet?.records.filter((r) => r.presente).length ?? 0;
        const ausentes = sheet?.records.filter((r) => !r.presente).length ?? 0;
        return {
          turma: t.nome.length > 10 ? `${t.nome.slice(0, 10)}…` : t.nome,
          turmaId: t.id,
          presentes,
          ausentes,
          biblias: sheet?.biblias ?? 0,
          revistas: sheet?.revistas ?? 0,
          oferta: sheet?.ofertaValor ?? 0,
        };
      })
      .filter((c) => c.presentes > 0 || c.ausentes > 0);
  }, [id, turmas, sheets]);

  const totalPresentes = chamadaPorClasse.reduce((acc, item) => acc + item.presentes, 0) || licao?.presentes || 0;
  const totalAusentes = chamadaPorClasse.reduce((acc, item) => acc + item.ausentes, 0) || licao?.ausentes || 0;
  const totalBiblias = chamadaPorClasse.reduce((acc, item) => acc + item.biblias, 0);
  const totalRevistas = chamadaPorClasse.reduce((acc, item) => acc + item.revistas, 0);
  const totalOfertas = offerings
    .filter((o) => o.licaoId === id)
    .reduce((acc, item) => acc + item.valor, 0) + chamadaPorClasse.reduce((acc, item) => acc + item.oferta, 0);

  const pctPresenca = totalPresentes + totalAusentes > 0
    ? Math.round((totalPresentes / (totalPresentes + totalAusentes)) * 100)
    : 0;

  const professoresPresenca = turmas
    .flatMap((t) => t.professores.map((nome) => ({ nome, presente: chamadaPorClasse.some((c) => c.turmaId === t.id) })))
    .slice(0, 8);

  if (loadingLicao) {
    return <p className="text-sm text-muted-foreground">Carregando lição...</p>;
  }

  if (!licao) return <p>Lição não encontrada.</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="touch-target" onClick={() => navigate("/licoes")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Lição {licao.numero} — {licao.tema}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">{formatDate(licao.data)}</span>
            <Badge variant={licao.status === "Finalizada" ? "default" : "outline"}>{licao.status}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold">{totalBiblias}</p>
              <p className="text-xs text-muted-foreground">Bíblias</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <BookMarked className="h-5 w-5 text-secondary" />
            <div>
              <p className="text-xl font-bold">{totalRevistas}</p>
              <p className="text-xs text-muted-foreground">Revistas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <DollarSign className="h-5 w-5 text-success" />
            <div>
              <p className="text-xl font-bold">{formatCurrency(totalOfertas)}</p>
              <p className="text-xs text-muted-foreground">Ofertas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Frequência por Classe</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chamadaPorClasse} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="turma" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="presentes" fill="hsl(142,71%,45%)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="ausentes" fill="hsl(0,72%,51%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resumo de Presença</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="relative h-32 w-32">
              <svg viewBox="0 0 36 36" className="h-32 w-32 -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="hsl(207,79%,33%)"
                  strokeWidth="3"
                  strokeDasharray={`${pctPresenca}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{pctPresenca}%</span>
                <span className="text-xs text-muted-foreground">Presença</span>
              </div>
            </div>
            <div className="mt-4 flex gap-6 text-sm">
              <span className="text-success font-medium">{totalPresentes} presentes</span>
              <span className="text-destructive font-medium">{totalAusentes} ausentes</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Chamadas por Classe</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-2">Turma</th>
                <th className="p-2 text-center">Presentes</th>
                <th className="p-2 text-center">Ausentes</th>
                <th className="p-2 text-center">%</th>
              </tr>
            </thead>
            <tbody>
              {chamadaPorClasse.map((c) => (
                <tr
                  key={c.turmaId}
                  className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/licoes/${id}/classe/${c.turmaId}`)}
                >
                  <td className="p-2 font-medium">{c.turma}</td>
                  <td className="p-2 text-center text-success">{c.presentes}</td>
                  <td className="p-2 text-center text-destructive">{c.ausentes}</td>
                  <td className="p-2 text-center">
                    {Math.round((c.presentes / Math.max(c.presentes + c.ausentes, 1)) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Presença dos Professores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {professoresPresenca.map((p) => (
            <div key={p.nome} className="flex items-center gap-2 text-sm">
              {p.presente ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <span>{p.nome}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
