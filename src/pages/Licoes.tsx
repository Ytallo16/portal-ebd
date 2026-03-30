import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, ChevronRight } from "lucide-react";
import { fetchLicoes, fetchLicoesByTurma, fetchTurmas } from "@/lib/portalApi";
import { formatDate } from "@/lib/formatters";

export default function Licoes() {
  const [selectedTrimestre, setSelectedTrimestre] = useState<{ trimestre: number; ano: number } | null>(null);
  const [selectedTurmaId, setSelectedTurmaId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { data: licoes = [], isLoading } = useQuery({ queryKey: ["licoes"], queryFn: () => fetchLicoes() });
  const { data: turmas = [], isLoading: loadingTurmas } = useQuery({ queryKey: ["turmas"], queryFn: fetchTurmas });
  const { data: licoesDaTurma = [], isLoading: loadingLicoesTurma } = useQuery({
    queryKey: ["licoes-turma", selectedTurmaId, selectedTrimestre?.trimestre, selectedTrimestre?.ano],
    queryFn: () =>
      fetchLicoesByTurma(
        selectedTurmaId ?? "",
        selectedTrimestre?.trimestre,
        selectedTrimestre?.ano,
      ),
    enabled: Boolean(selectedTurmaId && selectedTrimestre),
  });

  const trimestres = useMemo(() => {
    const seen = new Map<string, { trimestre: number; ano: number; label: string }>();
    licoes.forEach((l) => {
      const key = `${l.trimestre}-${l.ano}`;
      if (!seen.has(key)) {
        seen.set(key, { trimestre: l.trimestre, ano: l.ano, label: `${l.trimestre}º Trimestre ${l.ano}` });
      }
    });
    return Array.from(seen.values()).sort((a, b) => (b.ano - a.ano) || (b.trimestre - a.trimestre));
  }, [licoes]);

  const turmaSelecionada = turmas.find((t) => t.id === selectedTurmaId);
  const licoesPorNumero = new Map(licoesDaTurma.map((l) => [l.numero, l]));
  const licoesFixasDoTrimestre = Array.from({ length: 13 }, (_, i) => {
    const numero = i + 1;
    return { numero, licao: licoesPorNumero.get(numero) };
  });

  if (isLoading || loadingTurmas || loadingLicoesTurma) {
    return <p className="text-sm text-muted-foreground">Carregando lições...</p>;
  }

  if (!selectedTrimestre) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-end">
          <Button className="touch-target w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" /> Nova Lição</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trimestres.map((t) => (
            <Card
              key={t.label}
              className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
              onClick={() => setSelectedTrimestre({ trimestre: t.trimestre, ano: t.ano })}
            >
              <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">{t.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {licoes.filter((l) => l.trimestre === t.trimestre && l.ano === t.ano).length} lições
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedTurmaId) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="touch-target"
            onClick={() => {
              setSelectedTrimestre(null);
              setSelectedTurmaId(null);
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <p className="text-sm font-medium text-muted-foreground">
            {selectedTrimestre.trimestre}º Trimestre {selectedTrimestre.ano}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {turmas.map((turma) => (
            <Card
              key={turma.id}
              className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
              onClick={() => setSelectedTurmaId(turma.id)}
            >
              <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{turma.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {turma.totalAlunos} alunos
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="touch-target"
          onClick={() => setSelectedTurmaId(null)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <p className="text-sm font-medium text-muted-foreground">
          {selectedTrimestre.trimestre}º Trimestre {selectedTrimestre.ano} · {turmaSelecionada?.nome}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {licoesFixasDoTrimestre.map(({ numero, licao }) => (
          <Card
            key={numero}
            className={`transition-all ${licao ? "cursor-pointer hover:ring-2 hover:ring-primary/50" : "opacity-75"}`}
            onClick={() => {
              if (!licao || !selectedTurmaId) return;
              navigate(`/licoes/${licao.id}/classe/${selectedTurmaId}`);
            }}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Lição {numero}</Badge>
                <Badge variant={licao?.status === "Finalizada" ? "default" : "outline"}>
                  {licao?.status ?? "Pendente"}
                </Badge>
              </div>
              <p className="font-medium">{licao?.tema ?? "Lição ainda não cadastrada"}</p>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{licao ? formatDate(licao.data) : "Sem data"}</span>
                {licao && licao.presentes > 0 && (
                  <span>{licao.presentes}P / {licao.ausentes}A</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
