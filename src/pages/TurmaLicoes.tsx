import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { turmas, licoes, formatDate } from "@/data/mock";

export default function TurmaLicoes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const turma = turmas.find((t) => t.id === id);
  const [selectedTri, setSelectedTri] = useState<{ t: number; a: number } | null>(null);

  if (!turma) return <p>Turma não encontrada.</p>;

  const trimestresDisponiveis = [
    { label: "1º Trimestre 2024", t: 1, a: 2024 },
  ];

  const licoesFiltradas = selectedTri
    ? licoes.filter((l) => l.trimestre === selectedTri.t && l.ano === selectedTri.a)
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="touch-target" onClick={() => selectedTri ? setSelectedTri(null) : navigate("/turmas")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{turma.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {turma.faixaEtaria} · {turma.professores.join(", ")} · {turma.totalAlunos} alunos
          </p>
        </div>
      </div>

      {!selectedTri ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {trimestresDisponiveis.map((tri) => (
            <Card
              key={tri.label}
              className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
              onClick={() => setSelectedTri({ t: tri.t, a: tri.a })}
            >
              <CardContent className="p-6 flex items-center justify-between">
                <p className="font-semibold">{tri.label}</p>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {licoesFiltradas.map((l) => (
            <Card
              key={l.id}
              className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
              onClick={() => navigate(`/licoes/${l.id}/classe/${turma.id}`)}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Lição {l.numero}</Badge>
                  <Badge variant={l.status === "Finalizada" ? "default" : "outline"}>{l.status}</Badge>
                </div>
                <p className="font-medium text-sm">{l.tema}</p>
                <p className="text-xs text-muted-foreground">{formatDate(l.data)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
