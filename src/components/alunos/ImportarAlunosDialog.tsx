import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileCheck2,
  FileUp,
  History,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import {
  confirmarImportacaoAlunos,
  desfazerImportacaoAlunos,
  fetchHistoricoImportacoesAlunos,
  importarAlunosEmLote,
  type LoteImportacaoAlunos,
  type ResultadoImportacaoAlunos,
  type Turma,
} from "@/lib/portalApi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const COLUNAS_OBRIGATORIAS = ["nome", "sexo", "data_nascimento", "turma"];
const COLUNAS_OPCIONAIS = [
  "email",
  "telefone",
  "cep",
  "rua",
  "numero",
  "complemento",
  "bairro",
  "cidade",
  "uf",
  "responsavel_nome",
  "responsavel_telefone",
];
const LIMITE_PREVIA = 200;

type ImportarAlunosDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  turmas: Turma[];
  onImported: () => void;
  podeDesfazer?: boolean;
};

function baixarArquivo(nome: string, conteudo: string) {
  const blob = new Blob([`\uFEFF${conteudo}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();
  URL.revokeObjectURL(url);
}

function statusLoteLabel(status: LoteImportacaoAlunos["status_lote"]) {
  return {
    INVALID: "Arquivo inválido",
    VALIDATED: "Aguardando confirmação",
    CONFIRMED: "Confirmado",
    UNDONE: "Desfeito",
    PARTIALLY_UNDONE: "Desfeito parcialmente",
  }[status];
}

function formatarDataHora(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ImportarAlunosDialog({
  open,
  onOpenChange,
  turmas,
  onImported,
  podeDesfazer = false,
}: ImportarAlunosDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacaoAlunos | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [historico, setHistorico] = useState<LoteImportacaoAlunos[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [loteParaDesfazer, setLoteParaDesfazer] = useState<LoteImportacaoAlunos | null>(
    null,
  );

  const resultadosVisiveis = useMemo(
    () => resultado?.resultados.slice(0, LIMITE_PREVIA) ?? [],
    [resultado],
  );

  const carregarHistorico = useCallback(async () => {
    setCarregandoHistorico(true);
    try {
      setHistorico(await fetchHistoricoImportacoesAlunos());
    } catch {
      setHistorico([]);
    } finally {
      setCarregandoHistorico(false);
    }
  }, []);

  useEffect(() => {
    if (open) void carregarHistorico();
  }, [carregarHistorico, open]);

  function limpar() {
    setArquivo(null);
    setResultado(null);
    setLoteParaDesfazer(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function alterarAbertura(proximoOpen: boolean) {
    if (!proximoOpen && !enviando) limpar();
    onOpenChange(proximoOpen);
  }

  function baixarModelo() {
    const turmaExemplo = turmas[0]?.nome ?? "Nome exato da turma";
    const cabecalho = [...COLUNAS_OBRIGATORIAS, ...COLUNAS_OPCIONAIS].join(";");
    const exemplo = [
      "Maria da Silva",
      "F",
      "2001-05-20",
      turmaExemplo,
      "maria@email.com",
      "(86) 99999-9999",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ].join(";");
    baixarArquivo("modelo_importacao_alunos.csv", `${cabecalho}\n${exemplo}\n`);
  }

  function baixarRelatorio() {
    if (!resultado) return;
    const linhas = [
      "linha;nome;status;motivos",
      ...resultado.resultados.map((item) =>
        [
          item.linha,
          `"${item.nome.replace(/"/g, '""')}"`,
          item.status,
          `"${item.motivos.join(" | ").replace(/"/g, '""')}"`,
        ].join(";"),
      ),
    ];
    baixarArquivo(
      `relatorio_${resultado.lote_id}.csv`,
      `${linhas.join("\n")}\n`,
    );
  }

  async function validar() {
    if (!arquivo) {
      toast.error("Selecione um arquivo CSV.");
      return;
    }
    setEnviando(true);
    setResultado(null);
    try {
      const response = await importarAlunosEmLote(arquivo);
      setResultado(response);
      await carregarHistorico();
      if (!response.pode_confirmar) {
        toast.warning("O arquivo não possui alunos válidos para confirmar.");
      } else if (response.invalidos || response.erros_arquivo.length) {
        toast.warning("Arquivo validado com pendências. Revise antes de confirmar.");
      } else {
        toast.success("Arquivo validado. Revise e confirme o cadastro.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível validar o arquivo.");
    } finally {
      setEnviando(false);
    }
  }

  async function confirmar() {
    if (!resultado?.pode_confirmar) return;
    setEnviando(true);
    try {
      const response = await confirmarImportacaoAlunos(resultado.lote_id);
      setResultado(response);
      onImported();
      await carregarHistorico();
      if (response.nao_cadastrados) {
        toast.warning("Lote confirmado com pendências. Confira o relatório.");
      } else {
        toast.success(`${response.cadastrados} aluno(s) cadastrado(s).`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível confirmar o lote.",
      );
    } finally {
      setEnviando(false);
    }
  }

  async function desfazer() {
    if (!loteParaDesfazer) return;
    setEnviando(true);
    try {
      const response = await desfazerImportacaoAlunos(loteParaDesfazer.lote_id);
      setResultado(response);
      setLoteParaDesfazer(null);
      onImported();
      await carregarHistorico();
      if (response.nao_desfeitos) {
        toast.warning(
          "O lote foi desfeito parcialmente. Alunos alterados depois da importação foram preservados.",
        );
      } else {
        toast.success(
          `${response.desativados} aluno(s) inativado(s). Frequências foram preservadas.`,
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível desfazer o lote.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={alterarAbertura}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar alunos em lote</DialogTitle>
            <DialogDescription>
              Primeiro o sistema valida e mostra a prévia. Nenhum aluno é cadastrado até
              você confirmar o lote.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <section className="space-y-2">
              <p className="text-sm font-medium">Colunas obrigatórias</p>
              <div className="flex flex-wrap gap-2">
                {COLUNAS_OBRIGATORIAS.map((coluna) => (
                  <Badge key={coluna} variant="default">{coluna}</Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Em <strong>sexo</strong>, use M, F, Masculino ou Feminino. Em{" "}
                <strong>data_nascimento</strong>, use AAAA-MM-DD ou DD/MM/AAAA. Em{" "}
                <strong>turma</strong>, informe exatamente o nome de uma turma disponível.
              </p>
            </section>

            <section className="space-y-2">
              <p className="text-sm font-medium">Colunas opcionais</p>
              <div className="flex flex-wrap gap-2">
                {COLUNAS_OPCIONAIS.map((coluna) => (
                  <Badge key={coluna} variant="outline">{coluna}</Badge>
                ))}
              </div>
            </section>

            <Button type="button" variant="outline" onClick={baixarModelo}>
              <Download className="mr-2 h-4 w-4" />
              Baixar modelo CSV
            </Button>

            <div className="space-y-2">
              <Label htmlFor="arquivo-alunos">Arquivo CSV</Label>
              <Input
                ref={inputRef}
                id="arquivo-alunos"
                type="file"
                accept=".csv,text/csv"
                disabled={enviando}
                onChange={(event) => {
                  setArquivo(event.target.files?.[0] ?? null);
                  setResultado(null);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Limite de 5 MB e 5.000 alunos. Vírgula e ponto e vírgula são aceitos.
              </p>
            </div>

            {resultado && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Linhas avaliadas</p>
                    <p className="text-2xl font-bold">{resultado.total_linhas}</p>
                  </div>
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/30">
                    <p className="text-xs text-muted-foreground">
                      {resultado.fase === "VALIDACAO" ? "Prontos para cadastrar" : "Cadastrados"}
                    </p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {resultado.fase === "VALIDACAO"
                        ? resultado.validos
                        : resultado.cadastrados}
                    </p>
                  </div>
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-xs text-muted-foreground">Com problema</p>
                    <p className="text-2xl font-bold text-destructive">
                      {resultado.nao_cadastrados}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Etapa</p>
                    <p className="mt-1 font-semibold">
                      {resultado.fase === "VALIDACAO"
                        ? "Prévia"
                        : resultado.fase === "CONFIRMACAO"
                          ? "Confirmado"
                          : "Desfazimento"}
                    </p>
                  </div>
                </div>

                {resultado.erros_arquivo.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Problemas no arquivo</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc space-y-1 pl-5">
                        {resultado.erros_arquivo.map((erro) => <li key={erro}>{erro}</li>)}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {resultado.colunas_ignoradas.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Colunas não importadas</AlertTitle>
                    <AlertDescription>
                      {resultado.colunas_ignoradas.join(", ")} — os nomes não correspondem
                      às colunas aceitas.
                    </AlertDescription>
                  </Alert>
                )}

                {resultado.fase === "VALIDACAO" && resultado.pode_confirmar && (
                  <Alert>
                    <FileCheck2 className="h-4 w-4 text-green-600" />
                    <AlertTitle>Prévia pronta</AlertTitle>
                    <AlertDescription>
                      Revise as linhas abaixo. Somente os {resultado.validos} alunos válidos
                      serão cadastrados após a confirmação.
                    </AlertDescription>
                  </Alert>
                )}

                {resultado.fase === "CONFIRMACAO" &&
                  resultado.cadastrados > 0 &&
                  resultado.nao_cadastrados === 0 && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertTitle>Importação confirmada</AlertTitle>
                      <AlertDescription>
                        Todos os alunos válidos foram cadastrados.
                      </AlertDescription>
                    </Alert>
                  )}

                {resultado.resultados.length > 0 && (
                  <section className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">Prévia e avaliação das linhas</p>
                        {resultado.resultados.length > LIMITE_PREVIA && (
                          <p className="text-xs text-muted-foreground">
                            Exibindo as primeiras {LIMITE_PREVIA} linhas. Baixe o relatório
                            para consultar todas.
                          </p>
                        )}
                      </div>
                      <Button type="button" size="sm" variant="outline" onClick={baixarRelatorio}>
                        <Download className="mr-2 h-4 w-4" />
                        Baixar relatório
                      </Button>
                    </div>
                    <ScrollArea className="h-72 rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Linha</TableHead>
                            <TableHead>Aluno</TableHead>
                            <TableHead className="w-36">Situação</TableHead>
                            <TableHead>Avaliação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {resultadosVisiveis.map((item) => (
                            <TableRow key={`${item.linha}-${item.nome}`}>
                              <TableCell>{item.linha}</TableCell>
                              <TableCell className="font-medium">{item.nome}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    ["VALIDO", "CADASTRADO", "DESFEITO"].includes(item.status)
                                      ? "outline"
                                      : "destructive"
                                  }
                                >
                                  {item.status.replace(/_/g, " ")}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {item.motivos.length
                                  ? item.motivos.join("; ")
                                  : "Dados válidos"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </section>
                )}
              </div>
            )}

            <section className="space-y-2 border-t pt-4">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Histórico de lotes</p>
              </div>
              {carregandoHistorico ? (
                <p className="text-sm text-muted-foreground">Carregando histórico...</p>
              ) : historico.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum lote processado nesta igreja.
                </p>
              ) : (
                <div className="space-y-2">
                  {historico.slice(0, 10).map((lote) => (
                    <div
                      key={lote.lote_id}
                      className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{lote.arquivo_nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatarDataHora(lote.criado_em)} · {lote.cadastrados} cadastrado(s)
                          {" · "}
                          {statusLoteLabel(lote.status_lote)}
                        </p>
                      </div>
                      {podeDesfazer && lote.pode_desfazer && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={enviando}
                          onClick={() => setLoteParaDesfazer(lote)}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Desfazer
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={enviando}
              onClick={() => alterarAbertura(false)}
            >
              Fechar
            </Button>
            <Button type="button" variant="outline" disabled={!arquivo || enviando} onClick={validar}>
              {enviando && !resultado?.pode_confirmar ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileUp className="mr-2 h-4 w-4" />
              )}
              Validar arquivo
            </Button>
            {resultado?.pode_confirmar && resultado.fase === "VALIDACAO" && (
              <Button type="button" disabled={enviando} onClick={confirmar}>
                {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar {resultado.validos} aluno(s)
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(loteParaDesfazer)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !enviando) setLoteParaDesfazer(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desfazer esta importação?</AlertDialogTitle>
            <AlertDialogDescription>
              Os alunos criados pelo lote serão inativados, sem apagar frequências. Alunos
              alterados após a importação serão preservados e informados no relatório.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={enviando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={enviando} onClick={() => void desfazer()}>
              {enviando ? "Desfazendo..." : "Desfazer lote"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
