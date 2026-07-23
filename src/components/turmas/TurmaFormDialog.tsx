import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FaixaEtariaFields } from "@/components/turmas/FaixaEtariaFields";
import { ApiError } from "@/lib/api";
import {
  FAIXA_ETARIA_VAZIA,
  formatFaixaEtaria,
  parseFaixaEtaria,
  type FaixaEtariaFormValue,
  validarFaixaEtaria,
} from "@/lib/faixaEtaria";
import { createTurma, updateTurma, type Turma } from "@/lib/portalApi";

// Faixa padrão pré-preenchida ao criar turma, evitando confusão com o placeholder.
const FAIXA_ETARIA_PADRAO: FaixaEtariaFormValue = { ...FAIXA_ETARIA_VAZIA, idadeMin: "6", idadeMax: "12" };
const COR_PADRAO = "#3B82F6";

type TurmaFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ausente cria uma turma; presente edita a turma informada. */
  turma?: Turma | null;
};

type FormState = {
  nome: string;
  cor: string;
  ativa: boolean;
  faixa: FaixaEtariaFormValue;
};

function estadoInicial(turma?: Turma | null): FormState {
  if (!turma) {
    return { nome: "", cor: COR_PADRAO, ativa: true, faixa: { ...FAIXA_ETARIA_PADRAO } };
  }
  return {
    nome: turma.nome,
    cor: turma.cor || COR_PADRAO,
    ativa: turma.ativa,
    faixa: parseFaixaEtaria(turma.faixaEtaria),
  };
}

export function TurmaFormDialog({ open, onOpenChange, turma }: TurmaFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdicao = Boolean(turma);
  const [form, setForm] = useState<FormState>(() => estadoInicial(turma));
  const [faixaErro, setFaixaErro] = useState<string | null>(null);

  // Reabrir o diálogo para outra turma precisa recarregar os campos.
  useEffect(() => {
    if (open) {
      setForm(estadoInicial(turma));
      setFaixaErro(null);
    }
  }, [open, turma]);

  const mutation = useMutation({
    mutationFn: (payload: { nome: string; faixaEtaria: string; cor: string; ativa: boolean }) =>
      turma ? updateTurma(turma.id, payload) : createTurma(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["turmas"] });
      toast.success(isEdicao ? "Turma atualizada com sucesso." : "Turma criada com sucesso.");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError && error.message
          ? error.message
          : isEdicao
            ? "Não foi possível atualizar a turma."
            : "Não foi possível criar a turma.",
      );
    },
  });

  function atualizarFaixa(faixa: FaixaEtariaFormValue) {
    setFaixaErro(null);
    setForm((prev) => ({ ...prev, faixa }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const erroFaixa = validarFaixaEtaria(form.faixa);
    if (erroFaixa) {
      setFaixaErro(erroFaixa);
      toast.error(erroFaixa);
      return;
    }
    setFaixaErro(null);
    mutation.mutate({
      nome: form.nome,
      faixaEtaria: formatFaixaEtaria(form.faixa),
      cor: form.cor,
      ativa: form.ativa,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdicao ? "Editar Turma" : "Nova Turma"}</DialogTitle>
          <DialogDescription>Defina o nome, a faixa etária e a cor da turma.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <Label>Nome</Label>
            <Input
              value={form.nome}
              onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
              required
            />
          </div>
          <FaixaEtariaFields value={form.faixa} onChange={atualizarFaixa} error={faixaErro} />
          <div>
            <Label>Cor</Label>
            <Input
              type="color"
              value={form.cor}
              onChange={(e) => setForm((prev) => ({ ...prev, cor: e.target.value }))}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="turma-ativa" className="m-0">
              Turma ativa
            </Label>
            <Switch
              id="turma-ativa"
              checked={form.ativa}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, ativa: checked }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : isEdicao ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
