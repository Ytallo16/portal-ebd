import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  Camera,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerfilSkeleton } from "@/components/skeletons";
import { UserAvatar } from "@/components/UserAvatar";
import { ApiError } from "@/lib/api";
import {
  changeMinhaSenha,
  fetchUsuarioLogado,
  removeFotoPerfil,
  updateMeuPerfil,
  uploadFotoPerfil,
} from "@/lib/portalApi";

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  return fallback;
}

function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return "Formato inválido. Use JPEG, PNG ou WebP.";
  }
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return "A imagem deve ter no máximo 5 MB.";
  }
  return null;
}

export default function MeuPerfil() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: usuarioLogado, isLoading } = useQuery({ queryKey: ["me"], queryFn: fetchUsuarioLogado });

  const [nome, setNome] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  useEffect(() => {
    if (usuarioLogado) {
      setNome(usuarioLogado.nome);
    }
  }, [usuarioLogado]);

  const invalidateMe = () => {
    queryClient.invalidateQueries({ queryKey: ["me"] });
  };

  const updateNomeMutation = useMutation({
    mutationFn: () => updateMeuPerfil({ nome: nome.trim() }),
    onSuccess: () => {
      toast.success("Nome atualizado com sucesso.");
      invalidateMe();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Não foi possível atualizar o nome.")),
  });

  const uploadFotoMutation = useMutation({
    mutationFn: (file: File) => uploadFotoPerfil(file),
    onSuccess: () => {
      toast.success("Foto de perfil atualizada.");
      invalidateMe();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Não foi possível enviar a foto.")),
  });

  const removeFotoMutation = useMutation({
    mutationFn: () => removeFotoPerfil(),
    onSuccess: () => {
      toast.success("Foto de perfil removida.");
      invalidateMe();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Não foi possível remover a foto.")),
  });

  const changeSenhaMutation = useMutation({
    mutationFn: () =>
      changeMinhaSenha({
        senhaAtual,
        novaSenha,
        confirmarSenha,
      }),
    onSuccess: () => {
      toast.success("Senha alterada com sucesso.");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Não foi possível alterar a senha.")),
  });

  if (isLoading || !usuarioLogado) {
    return <PerfilSkeleton />;
  }

  const nomeAlterado = nome.trim() !== usuarioLogado.nome;
  const isAtivo = usuarioLogado.status === "Ativo";
  const enviandoFoto = uploadFotoMutation.isPending || removeFotoMutation.isPending;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateAvatarFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    uploadFotoMutation.mutate(file);
  };

  const handleSalvarNome = () => {
    const nomeTrimmed = nome.trim();
    if (nomeTrimmed.length < 2) {
      toast.error("O nome deve ter pelo menos 2 caracteres.");
      return;
    }
    updateNomeMutation.mutate();
  };

  const handleAlterarSenha = () => {
    if (novaSenha.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast.error("As senhas não coincidem.");
      return;
    }
    changeSenhaMutation.mutate();
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 animate-fade-in px-2 pb-8 sm:px-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie suas informações pessoais e preferências de acesso.
        </p>
      </div>

      <Card className="overflow-hidden border shadow-sm">
        <div className="h-32 bg-gradient-to-br from-primary/25 via-primary/10 to-transparent" />
        <CardContent className="relative px-6 pb-6 pt-0">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end">
            <div className="-mt-14 flex shrink-0 flex-col items-center gap-2">
              <div className="relative">
                <UserAvatar
                  nome={usuarioLogado.nome}
                  fotoUrl={usuarioLogado.fotoUrl}
                  className="h-28 w-28 ring-4 ring-background shadow-md"
                  fallbackClassName="text-3xl"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={enviandoFoto}
                  className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-background transition-transform hover:scale-105 disabled:opacity-70"
                  title="Alterar foto (JPEG, PNG ou WebP — máx. 5 MB)"
                >
                  {uploadFotoMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              {usuarioLogado.fotoUrl ? (
                <button
                  type="button"
                  className="text-xs text-destructive hover:underline disabled:opacity-60"
                  onClick={() => removeFotoMutation.mutate()}
                  disabled={enviandoFoto}
                >
                  {removeFotoMutation.isPending ? "Removendo…" : "Remover foto"}
                </button>
              ) : null}
            </div>

            <div className="min-w-0 flex-1 text-center sm:pb-1 sm:text-left">
              <h2 className="truncate text-xl font-bold">{usuarioLogado.nome}</h2>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{usuarioLogado.email}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Badge variant="secondary" className="font-normal">
                  {usuarioLogado.papel}
                </Badge>
                <Badge
                  variant={isAtivo ? "default" : "destructive"}
                  className="gap-1 font-normal"
                >
                  {isAtivo ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : null}
                  {usuarioLogado.status}
                </Badge>
              </div>
            </div>
          </div>

          {usuarioLogado.organizacaoAtiva ? (
            <div className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-muted/50 px-4 py-2.5 text-sm text-muted-foreground sm:justify-start">
              <Building2 className="h-4 w-4 shrink-0 text-primary" />
              <span>
                Contexto ativo:{" "}
                <span className="font-medium text-foreground">{usuarioLogado.organizacaoAtiva.nome}</span>
              </span>
            </div>
          ) : null}

        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Tabs defaultValue="conta" className="w-full">
            <div className="border-b px-4 sm:px-6">
              <TabsList className="h-auto w-full justify-start gap-6 rounded-none bg-transparent p-0">
                <TabsTrigger
                  value="conta"
                  className="gap-2 rounded-none border-b-2 border-transparent px-1 pb-3 pt-4 text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <UserRound className="h-4 w-4" />
                  Conta
                </TabsTrigger>
                <TabsTrigger
                  value="seguranca"
                  className="gap-2 rounded-none border-b-2 border-transparent px-1 pb-3 pt-4 text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Segurança
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="conta" className="mt-0 p-4 sm:p-6">
              <div className="space-y-5 pb-2">
                <div>
                  <h3 className="text-sm font-semibold">Dados pessoais</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Informações exibidas no portal e nos relatórios.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome completo</Label>
                    <Input
                      id="nome"
                      value={nome}
                      onChange={(event) => setNome(event.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        value={usuarioLogado.email}
                        disabled
                        className="bg-muted/40 pl-9"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado aqui.</p>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    onClick={handleSalvarNome}
                    disabled={!nomeAlterado || updateNomeMutation.isPending}
                    className="min-w-[140px]"
                  >
                    {updateNomeMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar alterações"
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seguranca" className="mt-0 p-4 sm:p-6">
              <div className="space-y-5 pb-2">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <KeyRound className="h-4 w-4 text-primary" />
                    Alterar senha
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Use uma senha forte com pelo menos 6 caracteres.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="senha-atual">Senha atual</Label>
                    <Input
                      id="senha-atual"
                      type="password"
                      value={senhaAtual}
                      onChange={(event) => setSenhaAtual(event.target.value)}
                      autoComplete="current-password"
                      placeholder="Digite sua senha atual"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nova-senha">Nova senha</Label>
                      <Input
                        id="nova-senha"
                        type="password"
                        value={novaSenha}
                        onChange={(event) => setNovaSenha(event.target.value)}
                        autoComplete="new-password"
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmar-senha">Confirmar nova senha</Label>
                      <Input
                        id="confirmar-senha"
                        type="password"
                        value={confirmarSenha}
                        onChange={(event) => setConfirmarSenha(event.target.value)}
                        autoComplete="new-password"
                        placeholder="Repita a nova senha"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    onClick={handleAlterarSenha}
                    disabled={
                      !senhaAtual ||
                      !novaSenha ||
                      !confirmarSenha ||
                      changeSenhaMutation.isPending
                    }
                    className="min-w-[140px]"
                  >
                    {changeSenhaMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Alterando...
                      </>
                    ) : (
                      "Alterar senha"
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
