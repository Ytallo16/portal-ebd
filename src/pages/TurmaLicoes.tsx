import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { fetchTurmas, fetchLicoesByTurma } from "@/lib/portalApi";
import { formatDate } from "@/lib/formatters";

export default function TurmaLicoes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedTri, setSelectedTri] = useState<{ t: number; a: number } | null>(null);

  const { data: turmas = [], isLoading: loadingTurmas } = useQuery({ queryKey: ["turmas"], queryFn: fetchTurmas });
  const turma = turmas.find((t) => t.id === id);

  const { data: licoes = [], isLoading: loadingLicoes } = useQuery({
    queryKey: ["licoes-turma", id, selectedTri?.t, selectedTri?.a],
    queryFn: () => fetchLicoesByTurma(id ?? "", selectedTri?.t, selectedTri?.a),
    enabled: Boolean(id),
  });

  const trimestresDisponiveis = useMemo(() => {
    const seen = new Map<string, { label: string; t: number; a: number }>();
    licoes.forEach((l) => {
      const key = `${l.trimestre}-${l.ano}`;
      if (!seen.has(key)) {
        seen.set(key, { label: `${l.trimestre}º Trimestre ${l.ano}`, t: l.trimestre, a: l.ano });
      }
    });
    return Array.from(seen.values());
  }, [licoes]);

  const licoesFiltradas = selectedTri
    ? licoes.filter((l) => l.trimestre === selectedTri.t && l.ano === selectedTri.a)
    : [];

  if (loadingTurmas || loadingLicoes) {
    return <p className="text-sm text-muted-foreground">Carregando dados da turma...</p>;
  }

  if (!turma) return <p>Turma não encontrada.</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          variant="ghost"
          size="icon"
          className="touch-target"
          onClick={() => selectedTri ? setSelectedTri(null) : navigate(`/turmas/${id}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <p className="text-sm font-medium">{turma.nome}</p>
          <p className="text-sm text-muted-foreground break-words">
            {turma.faixaEtaria} · {turma.professores.join(", ") || "—"} · {turma.totalAlunos} alunos
          </p>
        </div>
      </div>

      {!selectedTri ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {trimestresDisponiveis.map((tri) => (
            <Card
              key={tri.label}
              className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
              onClick={() => setSelectedTri({ t: tri.t, a: tri.a })}
            >
              <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                <p className="font-semibold">{tri.label}</p>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
