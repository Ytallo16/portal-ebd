import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PersonGridCard, personListGridClassName } from "@/components/lists/PersonGridCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { UsuariosPageSkeleton } from "@/components/skeletons";
import { formatPapelLabel } from "@/lib/roleLabels";

function getCreateRoleOptions(isAdminSistema: boolean, hasRole: (...roles: string[]) => boolean) {
  if (isAdminSistema) {
    return ["ADMINISTRADOR", "SECRETARIO_CAMPO", "SECRETARIO_IGREJA", "PROFESSOR"];
  }
  if (hasRole("SECRETARIO_CAMPO")) {
    return ["SECRETARIO_CAMPO", "SECRETARIO_IGREJA", "PROFESSOR"];
  }
  if (hasRole("SECRETARIO_IGREJA")) {
    return ["SECRETARIO_IGREJA", "PROFESSOR"];
  }
  return [];
}

function papeisAplicaveisNoContexto(
  options: string[],
  contextoCampo: boolean,
  contextoIgreja: boolean,
) {
  return options.filter((papel) => {
    if (papel === "ADMINISTRADOR") return true;
    if (papel === "SECRETARIO_CAMPO") return contextoCampo;
    if (papel === "SECRETARIO_IGREJA" || papel === "PROFESSOR") return contextoIgreja;
    return false;
  });
}

function defaultPapelParaCriacao(
  options: string[],
  contextoCampo: boolean,
  contextoIgreja: boolean,
) {
  const aplicaveis = papeisAplicaveisNoContexto(options, contextoCampo, contextoIgreja);
  if (aplicaveis.includes("PROFESSOR")) return "PROFESSOR";
  if (aplicaveis.includes("SECRETARIO_IGREJA")) return "SECRETARIO_IGREJA";
  return aplicaveis[0] ?? "";
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
  const { isAdminSistema, can, hasRole, contextoCampo, contextoIgreja, organizacaoAtiva } = usePermissions();
  const podeCriarUsuario = can("usuarios", "criar");

  const papeisDisponiveis = useMemo(
    () => getCreateRoleOptions(isAdminSistema, hasRole),
    [isAdminSistema, hasRole],
  );

  const papeisNoContextoAtual = useMemo(
    () => papeisAplicaveisNoContexto(papeisDisponiveis, contextoCampo, contextoIgreja),
    [papeisDisponiveis, contextoCampo, contextoIgreja],
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
      papel: defaultPapelParaCriacao(papeisDisponiveis, contextoCampo, contextoIgreja),
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
    podeCriarUsuario &&
    contextoCampo &&
    !contextoIgreja &&
    papeisDisponiveis.some((p) => p === "SECRETARIO_IGREJA" || p === "PROFESSOR");

  if (isLoading) {
    return <UsuariosPageSkeleton />;
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

      <div className={personListGridClassName()}>
        {filtered.map((u) => (
          <PersonGridCard
            key={u.id}
            nome={u.nome}
            subtitle={u.email}
            badges={
              <>
                <Badge variant="outline" className="text-xs">
                  {formatPapelLabel(u.papel) || u.papel}
                </Badge>
                <Badge variant={u.status === "Ativo" ? "default" : "secondary"} className="text-xs">
                  {u.status}
                </Badge>
              </>
            }
            footer={
              <>
                <label className="flex cursor-pointer items-center gap-2">
                  <Switch
                    checked={u.status === "Ativo"}
                    onCheckedChange={() => toggleMutation.mutate(u.id)}
                  />
                  <span className="text-xs text-muted-foreground">
                    {u.status === "Ativo" ? "Ativo" : "Inativo"}
                  </span>
                </label>
                <div className="flex items-center gap-1">
                  {isAdminSistema && can("usuarios", "editar") ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="touch-target h-9 w-9"
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="touch-target h-9 w-9"
                      onClick={() => openEditModal(u)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar usuário</span>
                    </Button>
                  ) : null}
                </div>
              </>
            }
          />
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
                  {papeisNoContextoAtual.map((papel) => (
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
