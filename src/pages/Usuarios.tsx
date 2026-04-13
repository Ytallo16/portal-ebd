import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { KeyRound, Pencil, Search, Users, UserCheck, UserX } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { fetchUsuarioLogado, fetchUsuarios, resetUserPassword, toggleUserActive, updateUsuario, type Usuario } from "@/lib/portalApi";
import { getIniciais } from "@/lib/formatters";

export default function Usuarios() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [resettingUser, setResettingUser] = useState<Usuario | null>(null);
  const [editForm, setEditForm] = useState({ nome: "", email: "", isActive: true });

  const { data: usuarios = [], isLoading } = useQuery({ queryKey: ["usuarios"], queryFn: fetchUsuarios });
  const { data: usuarioLogado } = useQuery({ queryKey: ["me"], queryFn: fetchUsuarioLogado });
  const isAdminGeral = Boolean(usuarioLogado?.isAdminGeral);
  const toggleMutation = useMutation({
    mutationFn: (userId: string) => toggleUserActive(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["usuarios"] }),
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

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando usuários...</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Usuários</h1>

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
                {isAdminGeral ? (
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
                <Button variant="ghost" size="icon" className="touch-target shrink-0" onClick={() => openEditModal(u)}>
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Editar usuário</span>
                </Button>
              </CardContent>
            </Card>
          ))}
      </div>

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
