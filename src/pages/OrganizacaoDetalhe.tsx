import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Building2, Landmark, LogIn, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrganizacaoDetalheSkeleton } from "@/components/skeletons";
import { MobileTableWrap } from "@/components/ui/mobile-table-wrap";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { switchOrganizationContext } from "@/lib/api";
import {
  activateInstanciaOrganizacao,
  deactivateInstanciaOrganizacao,
  fetchInstanciaOrganizacao,
  fetchIgrejasDaInstancia,
  isTipoCampo,
  updateInstanciaOrganizacao,
} from "@/lib/portalApi";

export default function OrganizacaoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    sigla: "",
    cidade: "",
    uf: "",
    responsavel: "",
  });

  const { data: instancia, isLoading } = useQuery({
    queryKey: ["instancia-organizacao", id],
    queryFn: () => fetchInstanciaOrganizacao(id!),
    enabled: Boolean(id),
  });

  const isCampo = Boolean(instancia && isTipoCampo(instancia.tipo));

  const { data: igrejas = [] } = useQuery({
    queryKey: ["instancia-igrejas", id],
    queryFn: () => fetchIgrejasDaInstancia(id!, true),
    enabled: Boolean(id && isCampo),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["instancia-organizacao", id] });
    queryClient.invalidateQueries({ queryKey: ["instancias-organizacao"] });
    queryClient.invalidateQueries({ queryKey: ["me"] });
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      updateInstanciaOrganizacao(id!, {
        nome: form.nome.trim(),
        sigla: form.sigla.trim(),
        cidade: form.cidade.trim(),
        uf: form.uf.trim().toUpperCase(),
        responsavel: form.responsavel.trim(),
        membros: 0,
      }),
    onSuccess: () => {
      toast.success("Instância atualizada.");
      setEditOpen(false);
      invalidate();
    },
    onError: () => toast.error("Não foi possível salvar."),
  });

  const toggleMutation = useMutation({
    mutationFn: () =>
      instancia!.isActive
        ? deactivateInstanciaOrganizacao(instancia!.id)
        : activateInstanciaOrganizacao(instancia!.id),
    onSuccess: () => {
      setConfirmToggle(false);
      invalidate();
      toast.success("Status atualizado.");
    },
    onError: () => toast.error("Não foi possível alterar o status."),
  });

  const acessarMutation = useMutation({
    mutationFn: () => switchOrganizationContext(instancia!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries();
      toast.success("Contexto alterado.");
      navigate("/");
    },
    onError: () => toast.error("Não foi possível acessar a instância."),
  });

  function openEdit() {
    if (!instancia) return;
    setForm({
      nome: instancia.nome,
      sigla: instancia.sigla,
      cidade: instancia.cidade,
      uf: instancia.uf,
      responsavel: instancia.responsavel,
    });
    setEditOpen(true);
  }

  if (isLoading) {
    return <OrganizacaoDetalheSkeleton />;
  }

  if (!instancia) {
    return <p className="text-sm text-muted-foreground">Instância não encontrada.</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            variant="ghost"
            size="icon"
            className="touch-target"
            onClick={() => navigate("/configuracoes/organizacoes")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold break-words">{instancia.nome}</h1>
            <p className="text-sm text-muted-foreground">
              {instancia.sigla} · {instancia.cidade}/{instancia.uf}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={openEdit}>
            Editar
          </Button>
          <Button
            variant={instancia.isActive ? "destructive" : "default"}
            onClick={() => setConfirmToggle(true)}
          >
            {instancia.isActive ? "Desativar" : "Ativar"}
          </Button>
          <Button
            disabled={!instancia.isActive || acessarMutation.isPending}
            onClick={() => acessarMutation.mutate()}
          >
            <LogIn className="mr-2 h-4 w-4" />
            Acessar instância
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            {isCampo ? (
              <Landmark className="h-5 w-5 text-primary" />
            ) : (
              <Building2 className="h-5 w-5 text-primary" />
            )}
            <div>
              <p className="text-xl font-bold">
                {isCampo ? "Campo" : "Igreja individual"}
              </p>
              <p className="text-xs text-muted-foreground">Tipo da instância</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge className="mt-1" variant={instancia.isActive ? "default" : "secondary"}>
              {instancia.status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Informações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Responsável:</span> {instancia.responsavel || "—"}</p>
          <p><span className="text-muted-foreground">Formato:</span> {instancia.formato || "—"}</p>
        </CardContent>
      </Card>

      {isCampo && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Igrejas do campo</CardTitle>
          </CardHeader>
          <CardContent>
            {igrejas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma igreja cadastrada neste campo.</p>
            ) : (
              <MobileTableWrap minWidthClass="min-w-[32rem]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {igrejas.map((igreja) => (
                    <TableRow key={igreja.id}>
                      <TableCell className="font-medium">{igreja.nome}</TableCell>
                      <TableCell>{igreja.cidade}/{igreja.uf}</TableCell>
                      <TableCell>{igreja.responsavel || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={igreja.isActive ? "default" : "secondary"}>
                          {igreja.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </MobileTableWrap>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar instância</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmToggle} onOpenChange={setConfirmToggle}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {instancia.isActive ? "Desativar instância?" : "Ativar instância?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {instancia.isActive
                ? "Usuários vinculados perderão o acesso ao portal até a reativação."
                : "Usuários vinculados voltarão a acessar o portal."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggleMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={instancia.isActive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
              disabled={toggleMutation.isPending}
              onClick={() => toggleMutation.mutate()}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
