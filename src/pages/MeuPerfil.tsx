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
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function PerfilSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl animate-pulse space-y-6 px-2 sm:px-0">
      <div className="h-8 w-40 rounded-md bg-muted" />
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="h-28 bg-muted" />
        <div className="flex flex-col items-center gap-4 px-6 pb-8 pt-0">
          <div className="-mt-12 h-28 w-28 rounded-full bg-muted ring-4 ring-background" />
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-4 w-56 rounded bg-muted" />
        </div>
      </div>
      <div className="h-64 rounded-xl border bg-card" />
    </div>
  );
}

export default function MeuPerfil() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: usuarioLogado, isLoading } = useQuery({ queryKey: ["me"], queryFn: fetchUsuarioLogado });

  const [nome, setNome] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  useEffect(() => {
    if (usuarioLogado) {
      setNome(usuarioLogado.nome);
    }
  }, [usuarioLogado]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

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
      setSelectedFile(null);
      invalidateMe();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Não foi possível enviar a foto.")),
  });

  const removeFotoMutation = useMutation({
    mutationFn: () => removeFotoPerfil(),
    onSuccess: () => {
      toast.success("Foto de perfil removida.");
      setSelectedFile(null);
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

  const fotoExibida = previewUrl ?? usuarioLogado.fotoUrl;
  const nomeAlterado = nome.trim() !== usuarioLogado.nome;
  const fotoEmEdicao = Boolean(selectedFile);
  const isAtivo = usuarioLogado.status === "Ativo";

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateAvatarFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSelectedFile(file);
  };

  const handleSalvarNome = () => {
    const nomeTrimmed = nome.trim();
    if (nomeTrimmed.length < 2) {
      toast.error("O nome deve ter pelo menos 2 caracteres.");
      return;
    }
    updateNomeMutation.mutate();
  };

  const handleSalvarFoto = () => {
    if (!selectedFile) return;
    uploadFotoMutation.mutate(selectedFile);
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
            <div className="relative -mt-14 shrink-0">
              <UserAvatar
                nome={usuarioLogado.nome}
                fotoUrl={fotoExibida}
                className="h-28 w-28 ring-4 ring-background shadow-md"
                fallbackClassName="text-3xl"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-background transition-transform hover:scale-105"
                title="Alterar foto"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
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

          {fotoEmEdicao ? (
            <div className="mt-4 flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium">Nova foto selecionada</p>
                <p className="truncate text-xs text-muted-foreground">{selectedFile?.name}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedFile(null)}
                  disabled={uploadFotoMutation.isPending}
                >
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSalvarFoto}
                  disabled={uploadFotoMutation.isPending}
                >
                  {uploadFotoMutation.isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Salvar foto
                </Button>
              </div>
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

              <Separator className="my-8" />

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold">Foto de perfil</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    JPEG, PNG ou WebP — máximo 5 MB.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/20 px-6 py-8 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border transition-transform group-hover:scale-105">
                    <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Clique para escolher uma foto</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      ou use o ícone de câmera no avatar acima
                    </p>
                  </div>
                </button>

                {usuarioLogado.fotoUrl && !fotoEmEdicao ? (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeFotoMutation.mutate()}
                      disabled={removeFotoMutation.isPending}
                    >
                      {removeFotoMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Remover foto atual
                    </Button>
                  </div>
                ) : null}
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
