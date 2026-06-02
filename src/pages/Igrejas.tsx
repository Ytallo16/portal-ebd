import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CheckCircle2, Church, Plus, Search, Trash2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { switchOrganizationContext } from "@/lib/api";
import {
  activateIgreja,
  createIgreja,
  deactivateIgreja,
  deleteIgreja,
  fetchIgrejasDoCampo,
  isInstanciaCampo,
  updateIgreja,
  type Igreja,
} from "@/lib/portalApi";

type FormState = {
  nome: string;
  sigla: string;
  cidade: string;
  uf: string;
  responsavel: string;
};

const emptyForm: FormState = {
  nome: "",
  sigla: "",
  cidade: "",
  uf: "",
  responsavel: "",
};

export default function Igrejas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can, organizacaoAtiva, activeOrgId } = usePermissions();
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Igreja | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Igreja | null>(null);

  const podeGerenciarLista = Boolean(organizacaoAtiva && isInstanciaCampo(organizacaoAtiva));

  const { data: igrejas = [], isLoading } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "igrejas", showInactive),
    queryFn: () => fetchIgrejasDoCampo(showInactive),
    enabled: podeGerenciarLista,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["igrejas"] });
    queryClient.invalidateQueries({ queryKey: ["me"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: form.nome.trim(),
        sigla: form.sigla.trim(),
        cidade: form.cidade.trim(),
        uf: form.uf.trim().toUpperCase(),
        responsavel: form.responsavel.trim(),
      };
      if (editing) {
        return updateIgreja(editing.id, payload);
      }
      return createIgreja(payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Igreja atualizada." : "Igreja cadastrada.");
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      invalidate();
    },
    onError: () => toast.error("Não foi possível salvar a igreja."),
  });

  const toggleMutation = useMutation({
    mutationFn: (igreja: Igreja) => (igreja.isActive ? deactivateIgreja(igreja.id) : activateIgreja(igreja.id)),
    onSuccess: () => {
      invalidate();
      toast.success("Status da igreja atualizado.");
    },
    onError: () => toast.error("Não foi possível alterar o status."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteIgreja(id),
    onSuccess: () => {
      setDeleteTarget(null);
      invalidate();
      toast.success("Igreja removida.");
    },
    onError: () => toast.error("Não foi possível excluir a igreja."),
  });

  const operarMutation = useMutation({
    mutationFn: (igrejaId: string) => switchOrganizationContext(igrejaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries();
      toast.success("Contexto alterado para a igreja selecionada.");
      navigate("/");
    },
    onError: () => toast.error("Não foi possível trocar o contexto."),
  });

  const filtradas = useMemo(() => {
    const termo = search.toLowerCase();
    return igrejas.filter(
      (i) =>
        i.nome.toLowerCase().includes(termo) ||
        i.sigla.toLowerCase().includes(termo) ||
        i.cidade.toLowerCase().includes(termo) ||
        i.responsavel.toLowerCase().includes(termo),
    );
  }, [igrejas, search]);

  const stats = useMemo(
    () => ({
      total: igrejas.length,
      ativas: igrejas.filter((i) => i.isActive).length,
      inativas: igrejas.filter((i) => !i.isActive).length,
    }),
    [igrejas],
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(igreja: Igreja) {
    setEditing(igreja);
    setForm({
      nome: igreja.nome,
      sigla: igreja.sigla,
      cidade: igreja.cidade,
      uf: igreja.uf,
      responsavel: igreja.responsavel,
    });
    setDialogOpen(true);
  }

  if (!podeGerenciarLista) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Selecione o <strong>campo</strong> ou uma <strong>igreja do campo</strong> na barra superior para
        gerenciar igrejas.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Igrejas</h1>
          <p className="text-sm text-muted-foreground">
            Igrejas do campo <strong>{organizacaoAtiva?.nome}</strong> — cada uma com sua própria EBD.
          </p>
        </div>
        {can("organizacoes", "criar") && (
          <Button className="touch-target w-full sm:w-auto" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nova igreja
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10 touch-target"
            placeholder="Buscar igreja..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={showInactive} onCheckedChange={setShowInactive} />
          Mostrar inativas
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Church className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total de igrejas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-xl font-bold">{stats.ativas}</p>
              <p className="text-xs text-muted-foreground">Ativas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <XCircle className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xl font-bold">{stats.inativas}</p>
              <p className="text-xs text-muted-foreground">Inativas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando igrejas...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtradas.map((igreja) => (
            <Card key={igreja.id}>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{igreja.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {igreja.sigla} • {igreja.cidade}/{igreja.uf}
                      </p>
                    </div>
                  </div>
                  <Badge variant={igreja.isActive ? "default" : "secondary"}>{igreja.status}</Badge>
                </div>

                <p className="text-sm text-muted-foreground">Responsável: {igreja.responsavel || "—"}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 p-2">
                  <span className="text-xs text-muted-foreground">Igreja ativa no portal</span>
                  {can("organizacoes", "editar") && (
                    <Switch
                      checked={igreja.isActive}
                      onCheckedChange={() => toggleMutation.mutate(igreja)}
                      disabled={toggleMutation.isPending}
                    />
                  )}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 touch-target"
                    onClick={() => operarMutation.mutate(igreja.id)}
                    disabled={!igreja.isActive || operarMutation.isPending}
                  >
                    Operar nesta igreja
                  </Button>
                  {can("organizacoes", "editar") && (
                    <Button variant="outline" size="sm" className="flex-1 touch-target" onClick={() => openEdit(igreja)}>
                      Editar
                    </Button>
                  )}
                  {can("organizacoes", "excluir") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="touch-target text-destructive"
                      onClick={() => setDeleteTarget(igreja)}
                      title="Excluir igreja"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Excluir igreja</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filtradas.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhuma igreja encontrada. Cadastre a primeira igreja do campo.
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar igreja" : "Nova igreja"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sigla">Sigla</Label>
                <Input id="sigla" value={form.sigla} onChange={(e) => setForm({ ...form, sigla: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="uf">UF</Label>
                <Input id="uf" maxLength={2} value={form.uf} onChange={(e) => setForm({ ...form, uf: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="responsavel">Responsável</Label>
              <Input
                id="responsavel"
                value={form.responsavel}
                onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.nome.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir igreja?</AlertDialogTitle>
            <AlertDialogDescription>
              A igreja {deleteTarget?.nome} será removida. Só é possível excluir se não houver turmas ou alunos ativos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
