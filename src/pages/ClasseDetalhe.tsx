/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, BookOpen, BookMarked, DollarSign, Users, UserPlus } from "lucide-react";
import { fetchAttendanceByLessonClass, fetchAlunos, fetchLicaoById, fetchOfferings, fetchTurmas } from "@/lib/portalApi";
import { formatCurrency, getIniciais } from "@/lib/formatters";

export default function ClasseDetalhe() {
  const { id, classId } = useParams();
  const navigate = useNavigate();

  const { data: turmas = [] } = useQuery({ queryKey: ["turmas"], queryFn: fetchTurmas });
  const { data: licao } = useQuery({ queryKey: ["licao", id], queryFn: () => fetchLicaoById(id ?? ""), enabled: Boolean(id) });
  const { data: alunos = [] } = useQuery({ queryKey: ["alunos"], queryFn: () => fetchAlunos() });
  const { data: attendance } = useQuery({
    queryKey: ["attendance-classe", id, classId],
    queryFn: () => fetchAttendanceByLessonClass(id ?? "", classId ?? ""),
    enabled: Boolean(id && classId),
  });
  const { data: offerings = [] } = useQuery({ queryKey: ["offerings"], queryFn: () => fetchOfferings(classId) });

  const turma = turmas.find((t) => t.id === classId);
  const alunosDaTurma = alunos.filter((a) => a.turmaId === classId);

  const chamada = useMemo(() => {
    if (attendance?.records?.length) {
      return attendance.records.map((r: any) => ({ id: String(r.student), nome: r.aluno_nome, presente: r.presente }));
    }
    return alunosDaTurma.map((a) => ({ ...a, presente: false }));
  }, [attendance, alunosDaTurma]);

  if (!turma || !licao) return <p>Não encontrado.</p>;

  const presentes = chamada.filter((a) => a.presente).length;
  const ausentes = chamada.length - presentes;
  const pct = Math.round((presentes / Math.max(chamada.length, 1)) * 100);
  const totalOferta = offerings.reduce((acc, o) => acc + o.valor, 0) + Number(attendance?.oferta_valor ?? 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="touch-target" onClick={() => navigate(`/licoes/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{turma.nome}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline">Lição {licao.numero}</Badge>
            <Badge variant={licao.status === "Finalizada" ? "default" : "secondary"}>{licao.status}</Badge>
            <span className="text-sm text-muted-foreground">Prof: {turma.professores.join(", ") || "—"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { icon: Users, label: "Frequência", value: `${pct}% (${presentes}/${Math.max(chamada.length, 0)})` },
          { icon: BookOpen, label: "Bíblias", value: String(attendance?.biblias ?? 0) },
          { icon: BookMarked, label: "Revistas", value: String(attendance?.revistas ?? 0) },
          { icon: UserPlus, label: "Visitantes", value: String(attendance?.visitantes ?? 0) },
          { icon: DollarSign, label: "Ofertas", value: formatCurrency(totalOferta) },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-3 flex items-center gap-2">
              <k.icon className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{k.value}</p>
                <p className="text-[11px] text-muted-foreground">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Informações da Lição</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">Tema:</span> <p className="font-medium">{licao.tema}</p></div>
          <div><span className="text-muted-foreground">Texto Áureo:</span> <p className="italic">{licao.textoAureo}</p></div>
          <div><span className="text-muted-foreground">Texto Bíblico:</span> <p>{licao.textoBiblico}</p></div>
          <div><span className="text-muted-foreground">Objetivo:</span> <p>{licao.objetivo}</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Lista de Chamada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {chamada.length === 0 && <p className="text-sm text-muted-foreground">Nenhum aluno registrado nesta turma.</p>}
          {chamada.map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-1">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                  {getIniciais(a.nome)}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 text-sm">{a.nome}</span>
              <Badge variant={a.presente ? "default" : "destructive"}>
                {a.presente ? "Presente" : "Ausente"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
