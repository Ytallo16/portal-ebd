import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { turmas } from "@/data/mock";
import { Plus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Turmas() {
  const [selectedTurma, setSelectedTurma] = useState<typeof turmas[0] | null>(null);
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Turmas</h1>
        <Button className="touch-target"><Plus className="h-4 w-4 mr-2" /> Nova Turma</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {turmas.map((t) => (
          <Card
            key={t.id}
            className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
            onClick={() => setSelectedTurma(t)}
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
                <span className="text-muted-foreground">{t.professores.join(", ")}</span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {t.totalAlunos}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedTurma} onOpenChange={() => setSelectedTurma(null)}>
        {selectedTurma && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedTurma.nome}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Nome</label>
                <Input defaultValue={selectedTurma.nome} className="touch-target" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Faixa Etária</label>
                <Input defaultValue={selectedTurma.faixaEtaria} className="touch-target" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Professores</label>
                <Input defaultValue={selectedTurma.professores.join(", ")} className="touch-target" />
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedTurma.totalAlunos} alunos matriculados
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 touch-target" onClick={() => {
                  setSelectedTurma(null);
                  navigate(`/turmas/${selectedTurma.id}`);
                }}>
                  Ver Lições e Frequência
                </Button>
                <Button variant="destructive" className="touch-target">Excluir</Button>
              </div>
              <Button className="w-full touch-target">Salvar Alterações</Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
