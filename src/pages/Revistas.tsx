import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookMarked,
  CalendarRange,
  CheckCircle,
  ChevronRight,
  Clock,
  Package,
  Search,
  Users,
  XCircle,
} from "lucide-react";

import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trimestreLabel } from "@/lib/licoesRoutes";
import {
  METODOS_PAGAMENTO_REVISTA,
  type MetodoPagamentoRevista,
} from "@/lib/revistasConstants";
import {
  fetchLicoes,
  fetchPublicationControls,
  fetchTrimestres,
  fetchTurmas,
  syncPublicationControls,
  updatePublicationControl,
  type ControleRevista,
  type Trimestre,
} from "@/lib/portalApi";
import { cn } from "@/lib/utils";

type StatusFiltro = "todos" | "nao_recebeu" | "pendente" | "regular";
type Passo = "turma" | "trimestre" | "checklist";

const statusTrimestreLabel: Record<Trimestre["status"], string> = {
  PLANEJADO: "Planejado",
  EM_ANDAMENTO: "Em andamento",
  ENCERRADO: "Encerrado",
};

function getStatusRevista(r: ControleRevista) {
  if (!r.recebeu) return { key: "nao_recebeu" as const, label: "Não recebeu", variant: "destructive" as const };
  if (r.pagou) return { key: "regular" as const, label: "Regular", variant: "default" as const };
  return { key: "pendente" as const, label: "Pendente pagamento", variant: "secondary" as const };
}

function resumoRevistas(lista: ControleRevista[]) {
  const total = lista.length;
  const entregues = lista.filter((r) => r.recebeu).length;
  const pagas = lista.filter((r) => r.pagou).length;
  const pendentes = lista.filter((r) => r.recebeu && !r.pagou).length;
  const naoRecebeu = lista.filter((r) => !r.recebeu).length;
  return { total, entregues, pagas, pendentes, naoRecebeu };
}

export default function Revistas() {
  const queryClient = useQueryClient();
  const { activeOrgId, podeCarregarOperacional, can, isAdminSistema } = usePermissions();
  const podeEditar = isAdminSistema || can("revistas", "editar");

  const [selectedTurma, setSelectedTurma] = useState<string | null>(null);
  const [selectedTrimestreId, setSelectedTrimestreId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("todos");

  const passo: Passo = !selectedTurma ? "turma" : !selectedTrimestreId ? "trimestre" : "checklist";

  const { data: trimestres = [], isLoading: loadingTrimestres } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "trimestres"),
    queryFn: fetchTrimestres,
    enabled: podeCarregarOperacional,
  });

  const { data: turmas = [], isLoading: loadingTurmas } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "turmas"),
    queryFn: fetchTurmas,
    enabled: podeCarregarOperacional,
  });

  const trimestreAtivo = useMemo(
    () => trimestres.find((t) => t.id === selectedTrimestreId) ?? null,
    [trimestres, selectedTrimestreId],
  );

  const trimestreId = trimestreAtivo?.id ?? null;
  const trimestreEncerrado = trimestreAtivo?.status === "ENCERRADO";
  const switchesDisabled = !podeEditar || trimestreEncerrado;

  const { data: controleTurma = [], isLoading: loadingControleTurma } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "revistas", "turma", selectedTurma),
    queryFn: () => fetchPublicationControls({ classId: selectedTurma! }),
    enabled: podeCarregarOperacional && passo === "trimestre" && Boolean(selectedTurma),
  });

  const { data: controleRevistas = [], isLoading: loadingRevistas } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "revistas", trimestreId, selectedTurma),
    queryFn: () =>
      fetchPublicationControls({
        trimestreId: trimestreId!,
        classId: selectedTurma!,
      }),
    enabled: podeCarregarOperacional && passo === "checklist" && Boolean(trimestreId && selectedTurma),
  });

  const { data: licoesTrimestre = [] } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "licoes", trimestreAtivo?.ano, trimestreAtivo?.numero),
    queryFn: () =>
      fetchLicoes({
        trimestre: trimestreAtivo!.numero,
        ano: trimestreAtivo!.ano,
      }),
    enabled: podeCarregarOperacional && passo === "checklist" && Boolean(trimestreAtivo),
  });

  const nomePublicacao = licoesTrimestre[0]?.revista;

  const invalidateRevistas = () => {
    queryClient.invalidateQueries({ queryKey: ["revistas"] });
  };

  const syncMutation = useMutation({
    mutationFn: () => syncPublicationControls(trimestreId!, selectedTurma!),
    onSuccess: invalidateRevistas,
  });

  const toggleMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<{ recebeu: boolean; pagou: boolean; metodo_pagamento: string }>;
    }) => updatePublicationControl(id, payload),
    onSuccess: invalidateRevistas,
  });

  const trimestresOrdenados = useMemo(() => {
    const emAndamento = trimestres.filter((t) => t.status === "EM_ANDAMENTO");
    const outros = trimestres.filter((t) => t.status !== "EM_ANDAMENTO");
    outros.sort((a, b) => b.ano - a.ano || b.numero - a.numero);
    return [...emAndamento, ...outros];
  }, [trimestres]);

  const listaOrdenada = useMemo(
    () =>
      [...controleRevistas].sort((a, b) => {
        if (a.tipo !== b.tipo) return a.tipo === "professor" ? -1 : 1;
        return a.nome.localeCompare(b.nome, "pt-BR");
      }),
    [controleRevistas],
  );

  const resumoPorTrimestre = useMemo(() => {
    const map = new Map<string, ControleRevista[]>();
    for (const item of controleTurma) {
      const key = item.trimestreId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [controleTurma]);

  if (loadingTurmas || (passo !== "turma" && loadingTrimestres)) {
    return <p className="text-sm text-muted-foreground">Carregando revistas...</p>;
  }

  const renderResumoCards = (resumo: ReturnType<typeof resumoRevistas>) => (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
      {[
        { label: "Total", value: resumo.total, icon: Users },
        { label: "Entregues", value: resumo.entregues, icon: Package },
        { label: "Pagas", value: resumo.pagas, icon: CheckCircle },
        { label: "Aguardando pagamento", value: resumo.pendentes, icon: Clock },
        { label: "Não recebeu", value: resumo.naoRecebeu, icon: XCircle },
      ].map((k) => (
        <Card key={k.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <k.icon className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-xl font-bold">{k.value}</p>
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const filtrarLista = (lista: ControleRevista[]) =>
    lista.filter((r) => {
      const matchSearch = r.nome.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      const status = getStatusRevista(r).key;
      if (statusFiltro === "todos") return true;
      if (statusFiltro === "nao_recebeu") return status === "nao_recebeu";
      if (statusFiltro === "pendente") return status === "pendente";
      return status === "regular";
    });

  const renderListaPessoas = (lista: ControleRevista[]) => {
    const filtrada = filtrarLista(lista);
    const professores = filtrada.filter((r) => r.tipo === "professor");
    const alunos = filtrada.filter((r) => r.tipo === "aluno");

    const renderLinha = (r: ControleRevista) => (
      <div key={r.id} className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{r.nome}</p>
          <p className="text-xs text-muted-foreground">
            {r.tipo === "professor" ? "Professor" : "Aluno"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Recebeu
            <Switch
              checked={r.recebeu}
              disabled={switchesDisabled || toggleMutation.isPending}
              onCheckedChange={(value) =>
                toggleMutation.mutate({ id: r.id, payload: { recebeu: value } })
              }
            />
          </label>

          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Pagou
            <Switch
              checked={r.pagou}
              disabled={switchesDisabled || toggleMutation.isPending}
              onCheckedChange={(value) =>
                toggleMutation.mutate({
                  id: r.id,
                  payload: { pagou: value, metodo_pagamento: value ? r.metodoPagamento : "" },
                })
              }
            />
          </label>

          {r.pagou ? (
            <Select
              value={r.metodoPagamento || undefined}
              disabled={switchesDisabled || toggleMutation.isPending}
              onValueChange={(value) =>
                toggleMutation.mutate({
                  id: r.id,
                  payload: { metodo_pagamento: value as MetodoPagamentoRevista },
                })
              }
            >
              <SelectTrigger className="h-8 w-[7.5rem] text-xs">
                <SelectValue placeholder="Método" />
              </SelectTrigger>
              <SelectContent>
                {METODOS_PAGAMENTO_REVISTA.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      </div>
    );

    if (filtrada.length === 0) {
      return <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma pessoa neste filtro.</p>;
    }

    return (
      <div className="space-y-4">
        {professores.length > 0 ? (
          <section>
            <p className="mb-1 px-1 text-xs font-medium text-muted-foreground">Professores</p>
            <Card>
              <CardContent className="divide-y p-0">{professores.map(renderLinha)}</CardContent>
            </Card>
          </section>
        ) : null}
        {alunos.length > 0 ? (
          <section>
            <p className="mb-1 px-1 text-xs font-medium text-muted-foreground">Alunos</p>
            <Card>
              <CardContent className="divide-y p-0">{alunos.map(renderLinha)}</CardContent>
            </Card>
          </section>
        ) : null}
      </div>
    );
  };

  function voltarParaTurmas() {
    setSelectedTurma(null);
    setSelectedTrimestreId(null);
    setSearch("");
    setStatusFiltro("todos");
  }

  function voltarParaTrimestres() {
    setSelectedTrimestreId(null);
    setSearch("");
    setStatusFiltro("todos");
  }

  // Passo 1 — escolher turma
  if (passo === "turma") {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Revistas</h1>
          <p className="text-sm text-muted-foreground">
            Passo 1 de 3 — selecione a turma para controlar entrega e pagamento das revistas.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {turmas.map((t) => (
            <Card
              key={t.id}
              className="cursor-pointer transition-all hover:ring-2 hover:ring-primary/50"
              onClick={() => setSelectedTurma(t.id)}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-primary-foreground"
                  style={{ backgroundColor: t.cor }}
                >
                  {t.nome.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{t.nome}</p>
                  <p className="text-xs text-muted-foreground">{t.totalAlunos} alunos</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const turma = turmas.find((t) => t.id === selectedTurma)!;

  // Passo 2 — escolher trimestre da turma
  if (passo === "trimestre") {
    if (trimestres.length === 0) {
      return (
        <div className="space-y-4 animate-fade-in">
          <Button variant="ghost" size="icon" className="touch-target" onClick={voltarParaTurmas}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Revistas — {turma.nome}</h1>
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Nenhum trimestre cadastrado. Crie um trimestre em Lições antes de controlar as revistas.
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <Button variant="ghost" size="icon" className="touch-target shrink-0 self-start" onClick={voltarParaTurmas}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Revistas — {turma.nome}</h1>
            <p className="text-sm text-muted-foreground">
              Passo 2 de 3 — escolha o trimestre. Cada trimestre tem sua própria lista de revistas entregues e pagas.
            </p>
          </div>
        </div>

        {loadingControleTurma ? (
          <p className="text-sm text-muted-foreground">Carregando trimestres...</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {trimestresOrdenados.map((t) => {
              const itens = resumoPorTrimestre.get(t.id) ?? [];
              const resumo = resumoRevistas(itens);
              const semControle = itens.length === 0;

              return (
                <Card
                  key={t.id}
                  className={cn(
                    "cursor-pointer transition-all hover:ring-2 hover:ring-primary/50",
                    t.status === "EM_ANDAMENTO" && "ring-1 ring-primary/30",
                  )}
                  onClick={() => setSelectedTrimestreId(t.id)}
                >
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <CalendarRange className="h-5 w-5 shrink-0 text-primary" />
                        <div>
                          <p className="font-semibold">{trimestreLabel(t.numero, t.ano)}</p>
                          <p className="text-xs text-muted-foreground">{statusTrimestreLabel[t.status]}</p>
                        </div>
                      </div>
                      {t.status === "EM_ANDAMENTO" ? (
                        <Badge>Atual</Badge>
                      ) : null}
                    </div>
                    {semControle ? (
                      <p className="text-xs text-muted-foreground">Controle ainda não iniciado neste trimestre</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {resumo.entregues}/{resumo.total} entregues · {resumo.pendentes} aguardando pagamento
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Passo 3 — lista da turma no trimestre
  const resumoTurma = resumoRevistas(controleRevistas);
  const semControles = !loadingRevistas && controleRevistas.length === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <Button variant="ghost" size="icon" className="touch-target shrink-0 self-start" onClick={voltarParaTrimestres}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <h1 className="break-words text-2xl font-bold">Revistas — {turma.nome}</h1>
              <p className="text-sm text-muted-foreground">
                {trimestreAtivo ? trimestreLabel(trimestreAtivo.numero, trimestreAtivo.ano) : ""}
                {nomePublicacao ? ` · ${nomePublicacao}` : ""}
                {" — "}marque recebimento, pagamento e método de cada pessoa da turma.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={trimestreAtivo?.status === "EM_ANDAMENTO" ? "default" : "secondary"}>
                {trimestreAtivo ? statusTrimestreLabel[trimestreAtivo.status] : ""}
              </Badge>
              {trimestreEncerrado ? (
                <span className="text-xs text-muted-foreground">Trimestre encerrado — somente visualização</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {loadingRevistas ? (
        <p className="text-sm text-muted-foreground">Carregando checklist...</p>
      ) : semControles ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-4 p-6">
            <div className="flex items-center gap-3">
              <BookMarked className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">Iniciar controle deste trimestre</p>
                <p className="text-sm text-muted-foreground">
                  Gera a lista de alunos e professores desta turma para{" "}
                  {trimestreAtivo ? trimestreLabel(trimestreAtivo.numero, trimestreAtivo.ano) : "este trimestre"}.
                </p>
              </div>
            </div>
            {podeEditar && !trimestreEncerrado ? (
              <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
                {syncMutation.isPending ? "Gerando..." : "Iniciar controle do trimestre"}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">Aguardando secretaria iniciar o controle.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {renderResumoCards(resumoTurma)}

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="touch-target pl-10"
              />
            </div>
            <Select value={statusFiltro} onValueChange={(v) => setStatusFiltro(v as StatusFiltro)}>
              <SelectTrigger className="w-full sm:w-52 touch-target">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="nao_recebeu">Não recebeu</SelectItem>
                <SelectItem value="pendente">Pendente pagamento</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {renderListaPessoas(listaOrdenada)}
        </>
      )}
    </div>
  );
}
