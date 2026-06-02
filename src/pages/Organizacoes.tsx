import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  Landmark,
  LogIn,
  Plus,
  Search,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { switchOrganizationContext } from "@/lib/api";
import {
  activateInstanciaOrganizacao,
  createInstanciaOrganizacao,
  deactivateInstanciaOrganizacao,
  fetchInstanciasOrganizacao,
  isTipoCampo,
  updateInstanciaOrganizacao,
  type InstanciaOrganizacao,
} from "@/lib/portalApi";

type FormState = {
  nome: string;
  sigla: string;
  formato: "CAMPO" | "IGREJA_INDIVIDUAL";
  cidade: string;
  uf: string;
  responsavel: string;
};

const emptyForm: FormState = {
  nome: "",
  sigla: "",
  formato: "CAMPO",
  cidade: "",
  uf: "",
  responsavel: "",
};

function labelFormato(instancia: InstanciaOrganizacao) {
  return instancia.formato === "IGREJA_INDIVIDUAL" || (instancia.tipo === "IGREJA" && !instancia.igrejasCount)
    ? "Igreja individual"
    : "Campo";
}

export default function Organizacoes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InstanciaOrganizacao | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [toggleTarget, setToggleTarget] = useState<InstanciaOrganizacao | null>(null);

  const { data: instancias = [], isLoading } = useQuery({
    queryKey: ["instancias-organizacao"],
    queryFn: () => fetchInstanciasOrganizacao(true),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["instancias-organizacao"] });
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
        membros: 0,
      };
      if (editing) {
        return updateInstanciaOrganizacao(editing.id, payload);
      }
      return createInstanciaOrganizacao({
        ...payload,
        formato: form.formato,
      });
    },
    onSuccess: () => {
      toast.success(editing ? "Instância atualizada." : "Instância criada.");
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      invalidate();
    },
    onError: () => toast.error("Não foi possível salvar a instância."),
  });

  const toggleMutation = useMutation({
    mutationFn: (instancia: InstanciaOrganizacao) =>
      instancia.isActive
        ? deactivateInstanciaOrganizacao(instancia.id)
        : activateInstanciaOrganizacao(instancia.id),
    onSuccess: () => {
      setToggleTarget(null);
      invalidate();
      toast.success("Status da instância atualizado.");
    },
    onError: () => toast.error("Não foi possível alterar o status."),
  });

  const acessarMutation = useMutation({
    mutationFn: (id: string) => switchOrganizationContext(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries();
      toast.success("Contexto alterado. Você está navegando como esta instância.");
      navigate("/");
    },
    onError: () => toast.error("Não foi possível acessar a instância."),
  });

  const filtradas = useMemo(() => {
    const termo = search.toLowerCase();
    return instancias.filter(
      (item) =>
        item.nome.toLowerCase().includes(termo) ||
        item.sigla.toLowerCase().includes(termo) ||
        item.cidade.toLowerCase().includes(termo) ||
        item.responsavel.toLowerCase().includes(termo),
    );
  }, [instancias, search]);

  const stats = useMemo(
    () => ({
      total: instancias.length,
      ativas: instancias.filter((i) => i.isActive).length,
      inativas: instancias.filter((i) => !i.isActive).length,
      campos: instancias.filter((i) => isTipoCampo(i.tipo)).length,
      igrejasIndividuais: instancias.filter((i) => i.formato === "IGREJA_INDIVIDUAL").length,
    }),
    [instancias],
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(instancia: InstanciaOrganizacao, e?: React.MouseEvent) {
    e?.stopPropagation();
    setEditing(instancia);
    setForm({
      nome: instancia.nome,
      sigla: instancia.sigla,
      formato: instancia.formato === "IGREJA_INDIVIDUAL" ? "IGREJA_INDIVIDUAL" : "CAMPO",
      cidade: instancia.cidade,
      uf: instancia.uf,
      responsavel: instancia.responsavel,
    });
    setDialogOpen(true);
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando instâncias...</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Organizações</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie instâncias do portal — campos ou igrejas individuais disponíveis para os usuários.
          </p>
        </div>
        <Button className="touch-target w-full sm:w-auto" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nova instância
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-10 touch-target"
          placeholder="Buscar por nome, sigla, cidade ou responsável..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total de instâncias</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div>
              <p className="text-xl font-bold">{stats.ativas}</p>
              <p className="text-xs text-muted-foreground">Ativas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <XCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-xl font-bold">{stats.inativas}</p>
              <p className="text-xs text-muted-foreground">Inativas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Landmark className="h-5 w-5 text-secondary" />
            <div>
              <p className="text-xl font-bold">{stats.campos}</p>
              <p className="text-xs text-muted-foreground">
                {stats.campos} campos · {stats.igrejasIndividuais} igrejas individuais
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtradas.map((instancia) => (
          <Card
            key={instancia.id}
            className="cursor-pointer transition-all hover:ring-2 hover:ring-primary/40"
            onClick={() => navigate(`/configuracoes/organizacoes/${instancia.id}`)}
          >
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    {isTipoCampo(instancia.tipo) ? (
                      <Landmark className="h-5 w-5" />
                    ) : (
                      <Building2 className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold">{instancia.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {instancia.sigla} • {instancia.cidade}/{instancia.uf}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={instancia.isActive ? "default" : "secondary"}>
                    {instancia.status}
                  </Badge>
                  <Badge variant="outline">{labelFormato(instancia)}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Responsável</p>
                  <p className="font-medium">{instancia.responsavel || "—"}</p>
                </div>
                {isTipoCampo(instancia.tipo) && (
                  <div>
                    <p className="text-xs text-muted-foreground">Igrejas vinculadas</p>
                    <p className="font-medium">{instancia.igrejasCount}</p>
                  </div>
                )}
              </div>

              <div
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 p-2"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-xs text-muted-foreground">Portal habilitado</span>
                <Switch
                  checked={instancia.isActive}
                  onCheckedChange={() => setToggleTarget(instancia)}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="outline"
                  size="sm"
                  className="touch-target flex-1"
                  onClick={(e) => openEdit(instancia, e)}
                >
                  Editar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="touch-target flex-1"
                  disabled={!instancia.isActive || acessarMutation.isPending}
                  onClick={() => acessarMutation.mutate(instancia.id)}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Acessar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtradas.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhuma instância encontrada.
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar instância" : "Nova instância"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {!editing && (
              <div className="space-y-2">
                <Label>Tipo de instância</Label>
                <Select
                  value={form.formato}
                  onValueChange={(value: "CAMPO" | "IGREJA_INDIVIDUAL") =>
                    setForm((f) => ({ ...f, formato: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAMPO">Campo (múltiplas igrejas)</SelectItem>
                    <SelectItem value="IGREJA_INDIVIDUAL">Igreja individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Nome</Label>
                <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Sigla</Label>
                <Input value={form.sigla} onChange={(e) => setForm((f) => ({ ...f, sigla: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={form.cidade} onChange={(e) => setForm((f) => ({ ...f, cidade: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>UF</Label>
                <Input
                  maxLength={2}
                  value={form.uf}
                  onChange={(e) => setForm((f) => ({ ...f, uf: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Responsável</Label>
                <Input
                  value={form.responsavel}
                  onChange={(e) => setForm((f) => ({ ...f, responsavel: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.nome.trim() || !form.sigla.trim()}
            >
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(toggleTarget)} onOpenChange={(open) => !open && setToggleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.isActive ? "Desativar instância?" : "Ativar instância?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.isActive
                ? `A instância ${toggleTarget?.nome} será desativada. Usuários vinculados perderão o acesso ao portal até a reativação.`
                : `A instância ${toggleTarget?.nome} será reativada e os usuários voltarão a acessar o portal.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggleMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={toggleTarget?.isActive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
              disabled={toggleMutation.isPending}
              onClick={() => toggleTarget && toggleMutation.mutate(toggleTarget)}
            >
              {toggleMutation.isPending ? "Aguarde..." : toggleTarget?.isActive ? "Desativar" : "Ativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
