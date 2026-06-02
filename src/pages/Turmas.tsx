import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FaixaEtariaFields } from "@/components/turmas/FaixaEtariaFields";
import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import { isSomenteProfessor } from "@/lib/chamada";
import {
  FAIXA_ETARIA_VAZIA,
  formatFaixaEtaria,
  type FaixaEtariaFormValue,
  validarFaixaEtaria,
} from "@/lib/faixaEtaria";
import { createTurma, fetchTurmas } from "@/lib/portalApi";
import { toast } from "sonner";

export default function Turmas() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { activeOrgId, podeCarregarOperacional, can, isAdminSistema, hasRole } = usePermissions();
  const somenteProfessor = isSomenteProfessor({ isAdminSistema, hasRole });
  const podeCriarTurma = can("turmas", "criar") && !somenteProfessor;
  const { data: turmas = [], isLoading } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "turmas"),
    queryFn: fetchTurmas,
    enabled: podeCarregarOperacional,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    cor: "#3B82F6",
    faixa: { ...FAIXA_ETARIA_VAZIA },
  });
  const [faixaErro, setFaixaErro] = useState<string | null>(null);
  const createMutation = useMutation({
    mutationFn: createTurma,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["turmas"] }),
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const erroFaixa = validarFaixaEtaria(form.faixa);
    if (erroFaixa) {
      setFaixaErro(erroFaixa);
      toast.error(erroFaixa);
      return;
    }
    const faixaEtaria = formatFaixaEtaria(form.faixa);
    setFaixaErro(null);
    await createMutation.mutateAsync({
      nome: form.nome,
      cor: form.cor,
      faixaEtaria,
    });
    setIsDialogOpen(false);
    setForm({ nome: "", cor: "#3B82F6", faixa: { ...FAIXA_ETARIA_VAZIA } });
  }

  function atualizarFaixa(faixa: FaixaEtariaFormValue) {
    setFaixaErro(null);
    setForm((prev) => ({ ...prev, faixa }));
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando turmas...</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{somenteProfessor ? "Minhas turmas" : "Turmas"}</h1>
        {podeCriarTurma ? (
          <Button className="touch-target w-full sm:w-auto" onClick={() => setIsDialogOpen(true)}>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Turma</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))} required />
            </div>
            <FaixaEtariaFields value={form.faixa} onChange={atualizarFaixa} error={faixaErro} />
            <div>
              <Label>Cor</Label>
              <Input type="color" value={form.cor} onChange={(e) => setForm((prev) => ({ ...prev, cor: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>Criar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
