import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Button } from "@/components/ui/button";
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
import { turmaExigeResponsavel } from "@/lib/alunos";
import { formatDate, formatarCep, formatarTelefone, getIniciais } from "@/lib/formatters";
import { buscarEnderecoPorCep } from "@/lib/viacep";
import {
  deleteAluno,
  updateAluno,
  type Aluno,
  type Turma,
} from "@/lib/portalApi";

type FormAluno = {
  nome: string;
  sexo: "M" | "F";
  dataNascimento: string;
  email: string;
  telefone: string;
  turmaId: string;
  endereco: Aluno["endereco"];
};

function alunoParaForm(aluno: Aluno): FormAluno {
  return {
    nome: aluno.nome,
    sexo: aluno.sexo,
    dataNascimento: aluno.dataNascimento,
    email: aluno.email,
    telefone: formatarTelefone(aluno.telefone),
    turmaId: aluno.turmaId,
    endereco: {
      ...aluno.endereco,
      cep: formatarCep(aluno.endereco.cep),
    },
  };
}

function CampoLeitura({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {titulo}
      </h3>
      {children}
    </section>
  );
}

type AlunoDetalheModalProps = {
  aluno: Aluno;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  podeEditar: boolean;
  podeExcluir: boolean;
  somenteProfessor: boolean;
  turmasFormulario: Turma[];
  turmaNameById: Map<string, string>;
  turmaFaixaEtariaById: Map<string, string>;
};

export function AlunoDetalheModal({
  aluno,
  open,
  onOpenChange,
  podeEditar,
  podeExcluir,
  somenteProfessor,
  turmasFormulario,
  turmaNameById,
  turmaFaixaEtariaById,
}: AlunoDetalheModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormAluno>(() => alunoParaForm(aluno));
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const ultimoCepBuscado = useRef("");

  useEffect(() => {
    setForm(alunoParaForm(aluno));
    ultimoCepBuscado.current = aluno.endereco.cep.replace(/\D/g, "");
  }, [aluno]);

  useEffect(() => {
    if (!open) setConfirmDeleteOpen(false);
  }, [open]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateAluno(aluno.id, {
        nome: form.nome.trim(),
        sexo: form.sexo,
        dataNascimento: form.dataNascimento,
        email: form.email.trim(),
        telefone: formatarTelefone(form.telefone),
        turmaId: form.turmaId,
        endereco: form.endereco,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["alunos"] });
      toast.success("Aluno salvo.");
      onOpenChange(false);
    },
    onError: () => toast.error("Não foi possível salvar o aluno."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAluno(aluno.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["alunos"] });
      toast.success("Aluno excluído.");
      onOpenChange(false);
    },
    onError: () => toast.error("Não foi possível excluir o aluno."),
  });

  const nomeTurma = turmaNameById.get(aluno.turmaId) ?? "";
  const faixaEtariaTurma = turmaFaixaEtariaById.get(aluno.turmaId) ?? "";
  const exibeResponsaveis =
    turmaExigeResponsavel(faixaEtariaTurma, nomeTurma) &&
    aluno.responsaveis &&
    aluno.responsaveis.length > 0;

  const enderecoVisivel =
    podeEditar ||
    Boolean(form.endereco.rua || form.endereco.cidade || form.endereco.cep);

  function atualizarEndereco(campo: keyof Aluno["endereco"], valor: string) {
    setForm((prev) => ({
      ...prev,
      endereco: { ...prev.endereco, [campo]: valor },
    }));
  }

  async function onCepChange(valor: string) {
    const cepFormatado = formatarCep(valor);
    atualizarEndereco("cep", cepFormatado);

    const digits = cepFormatado.replace(/\D/g, "");
    if (digits.length !== 8 || digits === ultimoCepBuscado.current) {
      return;
    }

    setBuscandoCep(true);
    try {
      const endereco = await buscarEnderecoPorCep(digits);
      if (!endereco) {
        toast.error("CEP não encontrado.");
        return;
      }

      ultimoCepBuscado.current = digits;
      setForm((prev) => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          cep: endereco.cep,
          rua: endereco.rua || prev.endereco.rua,
          bairro: endereco.bairro || prev.endereco.bairro,
          cidade: endereco.cidade || prev.endereco.cidade,
          uf: endereco.uf || prev.endereco.uf,
        },
      }));
    } catch {
      toast.error("Não foi possível buscar o CEP.");
    } finally {
      setBuscandoCep(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim() || !form.dataNascimento) return;
    updateMutation.mutate();
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle className="flex items-center gap-3 pr-6">
            <Avatar className="h-11 w-11">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                {getIniciais(podeEditar ? form.nome : aluno.nome)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 text-left">
              <p className="truncate text-lg font-semibold leading-tight">
                {podeEditar ? form.nome || aluno.nome : aluno.nome}
              </p>
              {!somenteProfessor && nomeTurma && (
                <p className="truncate text-sm font-normal text-muted-foreground">
                  {nomeTurma}
                </p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-6 overflow-y-auto px-6 py-5 text-sm">
            <Secao titulo="Identificação">
              {podeEditar ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="nome">Nome completo</Label>
                    <Input
                      id="nome"
                      value={form.nome}
                      onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label>Sexo</Label>
                      <Select
                        value={form.sexo}
                        onValueChange={(value: "M" | "F") =>
                          setForm((p) => ({ ...p, sexo: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Masculino</SelectItem>
                          <SelectItem value="F">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="nascimento">Nascimento</Label>
                      <Input
                        id="nascimento"
                        type="date"
                        value={form.dataNascimento}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, dataNascimento: e.target.value }))
                        }
                        required
                      />
                    </div>
                    {!somenteProfessor && (
                      <div className="space-y-1.5">
                        <Label>Turma</Label>
                        <Select
                          value={form.turmaId || undefined}
                          onValueChange={(turmaId) => setForm((p) => ({ ...p, turmaId }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a turma" />
                          </SelectTrigger>
                          <SelectContent>
                            {turmasFormulario.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <CampoLeitura label="Nome completo" value={aluno.nome} />
                  <CampoLeitura
                    label="Sexo"
                    value={aluno.sexo === "M" ? "Masculino" : "Feminino"}
                  />
                  <CampoLeitura
                    label="Nascimento"
                    value={formatDate(aluno.dataNascimento)}
                  />
                  {!somenteProfessor && (
                    <CampoLeitura label="Turma" value={nomeTurma} />
                  )}
                </div>
              )}
            </Secao>

            <Secao titulo="Contato">
              {podeEditar ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      type="text"
                      inputMode="numeric"
                      maxLength={15}
                      placeholder="(86) 99999-9999"
                      value={form.telefone}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          telefone: formatarTelefone(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <CampoLeitura label="E-mail" value={aluno.email} />
                  <CampoLeitura
                    label="Telefone"
                    value={formatarTelefone(aluno.telefone)}
                  />
                </div>
              )}
            </Secao>

            {enderecoVisivel && (
              <Secao titulo="Endereço">
                {podeEditar ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="cep">CEP</Label>
                      <div className="relative">
                        <Input
                          id="cep"
                          type="text"
                          inputMode="numeric"
                          maxLength={9}
                          placeholder="00000-000"
                          value={form.endereco.cep}
                          disabled={buscandoCep}
                          onChange={(e) => void onCepChange(e.target.value)}
                        />
                        {buscandoCep && (
                          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="uf">UF</Label>
                      <Input
                        id="uf"
                        maxLength={2}
                        value={form.endereco.uf}
                        onChange={(e) =>
                          atualizarEndereco(
                            "uf",
                            e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase(),
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        value={form.endereco.cidade}
                        onChange={(e) => atualizarEndereco("cidade", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input
                        id="bairro"
                        value={form.endereco.bairro}
                        onChange={(e) => atualizarEndereco("bairro", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                      <Label htmlFor="rua">Rua</Label>
                      <Input
                        id="rua"
                        value={form.endereco.rua}
                        onChange={(e) => atualizarEndereco("rua", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="numero">Número</Label>
                      <Input
                        id="numero"
                        value={form.endereco.numero}
                        onChange={(e) => atualizarEndereco("numero", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="complemento">Complemento</Label>
                      <Input
                        id="complemento"
                        value={form.endereco.complemento}
                        onChange={(e) => atualizarEndereco("complemento", e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <CampoLeitura label="CEP" value={formatarCep(aluno.endereco.cep)} />
                    <CampoLeitura label="UF" value={aluno.endereco.uf} />
                    <CampoLeitura label="Cidade" value={aluno.endereco.cidade} />
                    <CampoLeitura label="Bairro" value={aluno.endereco.bairro} />
                    <CampoLeitura label="Rua" value={aluno.endereco.rua} />
                    <CampoLeitura label="Número" value={aluno.endereco.numero} />
                    <CampoLeitura label="Complemento" value={aluno.endereco.complemento} />
                  </div>
                )}
              </Secao>
            )}

            {exibeResponsaveis && (
              <Secao titulo="Responsáveis">
                <p className="-mt-1 text-xs text-muted-foreground">
                  Pais, mães ou tutores legais — contato alternativo do aluno.
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {aluno.responsaveis!.map((r, i) => (
                    <div
                      key={`${r.nome}-${i}`}
                      className="rounded-lg border border-border/60 px-3 py-2.5"
                    >
                      <p className="font-medium">{r.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatarTelefone(r.telefone) || "Sem telefone"}
                      </p>
                    </div>
                  ))}
                </div>
              </Secao>
            )}
          </div>

          {(podeEditar || podeExcluir) && (
            <DialogFooter className="border-t px-6 py-4 sm:justify-between">
              {podeExcluir ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  title="Excluir aluno"
                  disabled={deleteMutation.isPending || updateMutation.isPending}
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Excluir aluno</span>
                </Button>
              ) : (
                <span />
              )}
              {podeEditar && (
                <Button
                  type="submit"
                  disabled={
                    updateMutation.isPending ||
                    deleteMutation.isPending ||
                    !form.nome.trim() ||
                    !form.dataNascimento
                  }
                >
                  {updateMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              )}
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir aluno?</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir {aluno.nome}? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
