import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { KeyRound, Pencil, Plus, Search, Users, UserCheck, UserX } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { usePermissions } from "@/auth/usePermissions";
import {
  createUsuario,
  fetchUsuarios,
  resetUserPassword,
  toggleUserActive,
  updateUsuario,
  type Usuario,
} from "@/lib/portalApi";
import { formatPapelLabel } from "@/lib/roleLabels";
import { getIniciais } from "@/lib/formatters";

function getCreateRoleOptions(isAdminSistema: boolean, contextoCampo: boolean, contextoIgreja: boolean) {
  const options: string[] = [];
  if (isAdminSistema) options.push("ADMINISTRADOR");
  if (contextoCampo) options.push("SECRETARIO_CAMPO");
  if (contextoIgreja) {
    options.push("SECRETARIO_IGREJA", "PROFESSOR");
  }
  return options;
}

function defaultPapelParaCriacao(options: string[]) {
  if (options.includes("PROFESSOR")) return "PROFESSOR";
  if (options.includes("SECRETARIO_IGREJA")) return "SECRETARIO_IGREJA";
  return options[0] ?? "";
}

export default function Usuarios() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [resettingUser, setResettingUser] = useState<Usuario | null>(null);
  const [editForm, setEditForm] = useState({ nome: "", email: "", isActive: true });
  const [createForm, setCreateForm] = useState({
    nome: "",
    email: "",
    senha: "123456",
    papel: "",
    isActive: true,
  });

  const { data: usuarios = [], isLoading } = useQuery({ queryKey: ["usuarios"], queryFn: fetchUsuarios });
  const { isAdminSistema, can, contextoCampo, contextoIgreja, organizacaoAtiva } = usePermissions();
  const podeCriarUsuario = can("usuarios", "criar");

  const papeisDisponiveis = useMemo(
    () => getCreateRoleOptions(isAdminSistema, contextoCampo, contextoIgreja),
    [isAdminSistema, contextoCampo, contextoIgreja],
  );

  const toggleMutation = useMutation({
    mutationFn: (userId: string) => toggleUserActive(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
    },
  });
  const resetPasswordMutation = useMutation({
    mutationFn: (userId: string) => resetUserPassword(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setIsResetConfirmOpen(false);
      setResettingUser(null);
    },
  });
  const editMutation = useMutation({
    mutationFn: () => {
      if (!editingUserId) throw new Error("Usuário inválido");
      return updateUsuario(editingUserId, {
        nome: editForm.nome,
        email: editForm.email,
        is_active: editForm.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setIsEditOpen(false);
      setEditingUserId(null);
    },
  });
  const createMutation = useMutation({
    mutationFn: createUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setIsCreateOpen(false);
      setCreateForm({ nome: "", email: "", senha: "123456", papel: "", isActive: true });
    },
  });

  function openCreateModal() {
    setCreateForm({
      nome: "",
      email: "",
      senha: "123456",
      papel: defaultPapelParaCriacao(papeisDisponiveis),
      isActive: true,
    });
    setIsCreateOpen(true);
  }

  function openEditModal(usuario: Usuario) {
    setEditingUserId(usuario.id);
    setEditForm({
      nome: usuario.nome,
      email: usuario.email,
      isActive: usuario.status === "Ativo",
    });
    setIsEditOpen(true);
  }

  async function onSubmitEdit(e: React.FormEvent) {
    e.preventDefault();
    await editMutation.mutateAsync();
  }

  async function onSubmitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.papel) return;
    await createMutation.mutateAsync({
      nome: createForm.nome,
      email: createForm.email,
      senha: createForm.senha,
      papel: createForm.papel,
      is_active: createForm.isActive,
    });
  }

  async function confirmResetPassword() {
    if (!resettingUser) return;
    await resetPasswordMutation.mutateAsync(resettingUser.id);
  }

  const filtered = usuarios.filter(
    (u) =>
      u.nome.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.papel.toLowerCase().includes(search.toLowerCase()),
  );

  const ativos = usuarios.filter((u) => u.status === "Ativo").length;
  const inativos = usuarios.filter((u) => u.status === "Inativo").length;

  const precisaIgrejaParaPerfil =
    contextoCampo &&
    !contextoIgreja &&
    podeCriarUsuario &&
    papeisDisponiveis.every((p) => p === "ADMINISTRADOR" || p === "SECRETARIO_CAMPO");

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando usuários...</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Usuários</h1>
        {podeCriarUsuario && papeisDisponiveis.length > 0 ? (
          <Button className="w-full sm:w-auto" onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Novo usuário
          </Button>
        ) : null}
      </div>

      {precisaIgrejaParaPerfil ? (
        <p className="text-sm text-muted-foreground">
          Para cadastrar professor ou secretário de igreja, selecione uma igreja no contexto
          {organizacaoAtiva?.nome ? ` (atual: ${organizacaoAtiva.nome})` : ""}.
        </p>
      ) : null}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome, email ou papel..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 touch-target" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-primary" />
            <div><p className="text-xl font-bold">{usuarios.length}</p><p className="text-xs text-muted-foreground">Total</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <UserCheck className="h-5 w-5 text-success" />
            <div><p className="text-xl font-bold">{ativos}</p><p className="text-xs text-muted-foreground">Ativos</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <UserX className="h-5 w-5 text-destructive" />
            <div><p className="text-xl font-bold">{inativos}</p><p className="text-xs text-muted-foreground">Inativos</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {filtered.map((u) => (
          <Card key={u.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                    {getIniciais(u.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{u.nome}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <Badge variant="secondary" className="shrink-0">{u.papel}</Badge>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={u.status === "Ativo"} onCheckedChange={() => toggleMutation.mutate(u.id)} />
                  <span className="text-xs text-muted-foreground hidden sm:inline">{u.status}</span>
                </div>
                {isAdminSistema && can("usuarios", "editar") ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="touch-target shrink-0"
                    onClick={() => {
                      setResettingUser(u);
                      setIsResetConfirmOpen(true);
                    }}
                    title="Resetar senha para 123456"
                  >
                    <KeyRound className="h-4 w-4" />
                    <span className="sr-only">Resetar senha para 123456</span>
                  </Button>
                ) : null}
                {can("usuarios", "editar") ? (
                  <Button variant="ghost" size="icon" className="touch-target shrink-0" onClick={() => openEditModal(u)}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar usuário</span>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
      </div>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmitCreate}>
            <div>
              <Label>Nome</Label>
              <Input
                value={createForm.nome}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, nome: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Senha inicial</Label>
              <Input
                type="password"
                value={createForm.senha}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, senha: e.target.value }))}
                minLength={6}
                required
              />
            </div>
            <div>
              <Label>Perfil</Label>
              <Select
                value={createForm.papel}
                onValueChange={(value) => setCreateForm((prev) => ({ ...prev, papel: value }))}
              >
                <SelectTrigger className="touch-target">
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  {papeisDisponiveis.map((papel) => (
                    <SelectItem key={papel} value={papel}>
                      {formatPapelLabel(papel)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="usuario-novo-ativo" className="m-0">
                Usuário ativo
              </Label>
              <Switch
                id="usuario-novo-ativo"
                checked={createForm.isActive}
                onCheckedChange={(checked) => setCreateForm((prev) => ({ ...prev, isActive: checked }))}
              />
            </div>
            {createMutation.isError ? (
              <p className="text-sm text-destructive">Não foi possível criar o usuário. Verifique os dados e tente novamente.</p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || !createForm.papel}>
                {createMutation.isPending ? "Salvando..." : "Criar usuário"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setEditingUserId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmitEdit}>
            <div>
              <Label>Nome</Label>
              <Input
                value={editForm.nome}
                onChange={(e) => setEditForm((prev) => ({ ...prev, nome: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="usuario-ativo" className="m-0">
                Usuário ativo
              </Label>
              <Switch
                id="usuario-ativo"
                checked={editForm.isActive}
                onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, isActive: checked }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={editMutation.isPending || !editingUserId}>
                {editMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isResetConfirmOpen}
        onOpenChange={(open) => {
          setIsResetConfirmOpen(open);
          if (!open) {
            setResettingUser(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar senha</AlertDialogTitle>
            <AlertDialogDescription>
              Confirma resetar a senha de {resettingUser?.nome ?? "este usuário"} para 123456?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetPasswordMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResetPassword} disabled={resetPasswordMutation.isPending}>
              {resetPasswordMutation.isPending ? "Resetando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
