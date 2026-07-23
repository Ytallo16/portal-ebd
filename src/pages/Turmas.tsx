import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TurmaFormDialog } from "@/components/turmas/TurmaFormDialog";
import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import { isSomenteProfessor } from "@/lib/chamada";
import { fetchTurmas, type Turma } from "@/lib/portalApi";
import { CardGridSkeleton, PageHeaderSkeleton } from "@/components/skeletons";

export default function Turmas() {
  const navigate = useNavigate();
  const { activeOrgId, podeCarregarOperacional, can, isAdminSistema, hasRole } = usePermissions();
  const somenteProfessor = isSomenteProfessor({ isAdminSistema, hasRole });
  const podeCriarTurma = can("turmas", "criar") && !somenteProfessor;
  const podeEditarTurma = can("turmas", "editar") && !somenteProfessor;
  const { data: turmas = [], isLoading } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "turmas"),
    queryFn: fetchTurmas,
    enabled: podeCarregarOperacional,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [turmaEmEdicao, setTurmaEmEdicao] = useState<Turma | null>(null);

  function abrirCriacao() {
    setTurmaEmEdicao(null);
    setIsDialogOpen(true);
  }

  function abrirEdicao(turma: Turma) {
    setTurmaEmEdicao(turma);
    setIsDialogOpen(true);
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <PageHeaderSkeleton action={podeCriarTurma} />
        <CardGridSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{somenteProfessor ? "Minhas turmas" : "Turmas"}</h1>
        {podeCriarTurma ? (
          <Button className="touch-target w-full sm:w-auto" onClick={abrirCriacao}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Turma
          </Button>
        ) : null}
      </div>

      {turmas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {somenteProfessor
            ? "Nenhuma turma vinculada ao seu perfil. Peça ao secretário para associá-lo a uma turma."
            : "Nenhuma turma cadastrada."}
        </p>
      ) : null}

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
                {podeEditarTurma ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="touch-target h-9 w-9 shrink-0"
                    onClick={(event) => {
                      event.stopPropagation();
                      abrirEdicao(t);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar turma</span>
                  </Button>
                ) : null}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t.professores.join(", ") || "—"}</span>
                <div className="flex items-center gap-2">
                  {t.ativa ? null : (
                    <Badge variant="outline" className="text-xs">
                      Inativa
                    </Badge>
                  )}
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {t.totalAlunos}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <TurmaFormDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} turma={turmaEmEdicao} />
    </div>
  );
}
