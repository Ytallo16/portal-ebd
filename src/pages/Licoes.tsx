import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { licoes, formatDate } from "@/data/mock";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, ChevronRight } from "lucide-react";

const trimestres = [
  { label: "1º Trimestre 2024", trimestre: 1, ano: 2024 },
  { label: "4º Trimestre 2023", trimestre: 4, ano: 2023 },
];

export default function Licoes() {
  const [selected, setSelected] = useState<{ trimestre: number; ano: number } | null>(null);
  const navigate = useNavigate();

  const licoesFiltradas = selected
    ? licoes.filter((l) => l.trimestre === selected.trimestre && l.ano === selected.ano)
    : [];

  if (!selected) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-end">
          <Button className="touch-target"><Plus className="h-4 w-4 mr-2" /> Nova Lição</Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trimestres.map((t) => (
            <Card
              key={t.label}
              className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
              onClick={() => setSelected({ trimestre: t.trimestre, ano: t.ano })}
            >
              <CardContent className="p-6 flex items-center justify-between">
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="touch-target" onClick={() => setSelected(null)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <p className="text-sm font-medium text-muted-foreground">
          {selected.trimestre}º Trimestre {selected.ano}
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {licoesFiltradas.map((l) => (
          <Card
            key={l.id}
            className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
            onClick={() => navigate(`/licoes/${l.id}`)}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Lição {l.numero}</Badge>
                <Badge variant={l.status === "Finalizada" ? "default" : "outline"}>
                  {l.status}
                </Badge>
              </div>
              <p className="font-medium">{l.tema}</p>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{formatDate(l.data)}</span>
                {l.presentes > 0 && (
                  <span>{l.presentes}P / {l.ausentes}A</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
