import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, Paperclip, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ACCEPT_ANEXO, formatarTamanhoArquivo, validarAnexo } from "@/lib/anexos";
import {
  excluirAnexoLicao,
  fetchAnexosLicao,
  uploadAnexoLicao,
} from "@/lib/portalApi";

type Props = {
  licaoId: string;
  podeEnviar: boolean;
};

export function LicaoAnexos({ licaoId, podeEnviar }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [descricao, setDescricao] = useState("");

  const queryKey = ["anexos-licao", licaoId];

  const { data: anexos = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchAnexosLicao(licaoId),
    enabled: Boolean(licaoId),
  });

  const upload = useMutation({
    mutationFn: (arquivo: File) => uploadAnexoLicao(licaoId, arquivo, descricao),
    onSuccess: () => {
      setDescricao("");
      if (inputRef.current) inputRef.current.value = "";
      void queryClient.invalidateQueries({ queryKey });
      toast({ title: "Arquivo anexado" });
    },
    onError: (erro: Error) => {
      toast({ title: "Não foi possível anexar", description: erro.message, variant: "destructive" });
    },
  });

  const excluir = useMutation({
    mutationFn: (anexoId: string) => excluirAnexoLicao(anexoId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      toast({ title: "Anexo removido" });
    },
    onError: (erro: Error) => {
      toast({ title: "Não foi possível remover", description: erro.message, variant: "destructive" });
    },
  });

  function aoSelecionarArquivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;

    const erro = validarAnexo(arquivo);
    if (erro) {
      toast({ title: "Arquivo inválido", description: erro, variant: "destructive" });
      evento.target.value = "";
      return;
    }

    upload.mutate(arquivo);
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Paperclip className="h-4 w-4" />
          Materiais da lição
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {podeEnviar && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Descrição (opcional)"
              value={descricao}
              onChange={(evento) => setDescricao(evento.target.value)}
              className="sm:max-w-xs"
            />
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT_ANEXO}
              onChange={aoSelecionarArquivo}
              className="hidden"
            />
            <Button
              type="button"
              variant="secondary"
              disabled={upload.isPending}
              onClick={() => inputRef.current?.click()}
            >
              {upload.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Anexar arquivo
            </Button>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando anexos...</p>
        ) : anexos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum material anexado nesta lição.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {anexos.map((anexo) => (
              <li key={anexo.id} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{anexo.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatarTamanhoArquivo(anexo.tamanho)}
                    {anexo.autorNome ? ` · ${anexo.autorNome}` : ""}
                    {anexo.descricao ? ` · ${anexo.descricao}` : ""}
                  </p>
                </div>
                <Button asChild variant="ghost" size="icon" title="Baixar">
                  <a href={anexo.url} target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
                {anexo.podeExcluir && (
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Excluir"
                    disabled={excluir.isPending}
                    onClick={() => excluir.mutate(anexo.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
