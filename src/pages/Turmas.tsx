import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchTurmas } from "@/lib/portalApi";

export default function Turmas() {
  const navigate = useNavigate();
  const { data: turmas = [], isLoading } = useQuery({ queryKey: ["turmas"], queryFn: fetchTurmas });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando turmas...</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-end">
        <Button className="touch-target w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" /> Nova Turma</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {turmas.map((t) => (
          <Card
            key={t.id}
            className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
            onClick={() => navigate(`/turmas/${t.id}`)}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm" style={{ backgroundColor: t.cor }}>
                  {t.nome.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{t.nome}</p>
                  <p className="text-xs text-muted-foreground">{t.faixaEtaria}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t.professores.join(", ") || "—"}</span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {t.totalAlunos}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
