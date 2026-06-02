import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, GraduationCap, Medal, Search, TrendingUp, UserRoundCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import { ApiError } from "@/lib/api";
import { isSomenteProfessor } from "@/lib/chamada";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchTrimestres, fetchTurmas, rankingApi, teachersApi } from "@/lib/portalApi";

function getAnoAtual() {
  return new Date().getFullYear();
}

export default function Professores() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { activeOrgId, podeCarregarOperacional, can, isAdminSistema, hasRole, turmasProfessor } =
    usePermissions();
  const somenteProfessor = isSomenteProfessor({ isAdminSistema, hasRole });
  const podeEditarProfessores = !somenteProfessor && (isAdminSistema || can("turmas", "editar"));
  const [search, setSearch] = useState("");
  const [transferirTarget, setTransferirTarget] = useState<{
    professorId: string;
    nome: string;
    turmaAtualId: string;
    turmaAtualNome: string;
  } | null>(null);
  const [turmaSelecionadaTransferencia, setTurmaSelecionadaTransferencia] = useState("");
  const [ano, setAno] = useState(String(getAnoAtual()));
  const [trimestre, setTrimestre] = useState("1");
  const [turmaIdRanking, setTurmaIdRanking] = useState("todas");
  const searchParam = searchParams.get("search") ?? "";

  useEffect(() => {
    if (searchParam) setSearch(searchParam);
  }, [searchParam]);

  const { data: turmas = [], isLoading } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "turmas"),
    queryFn: fetchTurmas,
    enabled: podeCarregarOperacional,
  });
  const { data: trimestres = [] } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "trimestres", Number(ano)),
    queryFn: () => fetchTrimestres({ ano: Number(ano) }),
    enabled: podeCarregarOperacional,
  });
  const { data: ranking = [], isLoading: loadingRanking } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "ranking-professores", Number(ano), Number(trimestre), turmaIdRanking),
    queryFn: () =>
      rankingApi.fetchProfessorRanking({
        ano: Number(ano),
        trimestre: Number(trimestre),
        classId: turmaIdRanking === "todas" ? undefined : turmaIdRanking,
      }),
    enabled: podeCarregarOperacional,
  });

  const professores = useMemo(() => {
    const todos = teachersApi.buildMatriculadosProfessores(turmas);
    if (!somenteProfessor) return todos;
    const idsTurmasProfessor = new Set(turmasProfessor.map((turma) => String(turma.id)));
    return todos.filter((item) => idsTurmasProfessor.has(item.turmaId));
  }, [turmas, somenteProfessor, turmasProfessor]);

  const filtrados = professores.filter((item) => {
    const termo = search.toLowerCase();
    return item.nome.toLowerCase().includes(termo) || item.turmaNome.toLowerCase().includes(termo);
  });

  const totalTurmas = useMemo(() => new Set(professores.map((item) => item.turmaId)).size, [professores]);
  const anosDisponiveis = useMemo(() => {
    const anos = new Set<number>([getAnoAtual()]);
    trimestres.forEach((item) => anos.add(item.ano));
    return Array.from(anos).sort((a, b) => b - a);
  }, [trimestres]);
  const mediaPresenca =
    ranking.length === 0
      ? 0
      : ranking.reduce((acc, item) => acc + item.presencaPct, 0) / ranking.length;
  const vinculoPorProfessorId = useMemo(
    () => new Map(professores.map((item) => [item.professorId, item])),
    [professores],
  );
  const turmasDisponiveisParaTransferencia = useMemo(() => {
    if (!transferirTarget) return [];
    return turmas.filter(
      (turma) => turma.professorUsers.length === 0 || turma.id === transferirTarget.turmaAtualId,
    );
  }, [turmas, transferirTarget]);

  const atribuirMutation = useMutation({
    mutationFn: async () => {
      if (!transferirTarget || !turmaSelecionadaTransferencia) {
        throw new Error("Selecione a turma de destino.");
      }
      const vinculoAtual = vinculoPorProfessorId.get(transferirTarget.professorId);
      if (vinculoAtual?.turmaId === turmaSelecionadaTransferencia) return;
      if (vinculoAtual) {
        await teachersApi.removeProfessorTurma(vinculoAtual.linkId);
      }
      await teachersApi.addProfessorTurma(
        turmaSelecionadaTransferencia,
        transferirTarget.professorId,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["turmas"] });
      setTransferirTarget(null);
      setTurmaSelecionadaTransferencia("");
      toast.success("Vínculo de professor atualizado com sucesso.");
    },
    onError: (error) => {
      const msg =
        error instanceof ApiError && error.message
          ? error.message
          : "Não foi possível atualizar vínculo do professor.";
      toast.error(msg);
    },
  });

  if (!podeCarregarOperacional) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Selecione uma igreja</CardTitle>
            <CardDescription>
              Para acessar esta área, escolha uma igreja no seletor da <strong>barra superior</strong>.
              O contexto vale para todo o sistema até você alterar.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando professores...</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Professores</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou turma..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-10 touch-target"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <GraduationCap className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold">{professores.length}</p>
              <p className="text-xs text-muted-foreground">Vínculos de professor</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-secondary" />
            <div>
              <p className="text-xl font-bold">{totalTurmas}</p>
              <p className="text-xs text-muted-foreground">Turmas com professor</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ranking de presença</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Ano</p>
              <Select value={ano} onValueChange={setAno}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {anosDisponiveis.map((item) => (
                    <SelectItem key={item} value={String(item)}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Trimestre</p>
              <Select value={trimestre} onValueChange={setTrimestre}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1º trimestre</SelectItem>
                  <SelectItem value="2">2º trimestre</SelectItem>
                  <SelectItem value="3">3º trimestre</SelectItem>
                  <SelectItem value="4">4º trimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Turma</p>
              <Select value={turmaIdRanking} onValueChange={setTurmaIdRanking}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as turmas</SelectItem>
                  {turmas.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>{turma.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Medal className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xl font-bold">{ranking.length}</p>
                  <p className="text-xs text-muted-foreground">Professores ranqueados</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xl font-bold">{mediaPresenca.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Média geral de presença</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <UserRoundCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xl font-bold">{ranking[0]?.presencaPct.toFixed(1) ?? "0.0"}%</p>
                  <p className="text-xs text-muted-foreground">Melhor presença</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {loadingRanking ? (
            <p className="text-sm text-muted-foreground">Carregando ranking...</p>
          ) : ranking.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Não há dados de frequência de professores para este filtro.
            </p>
          ) : (
            <div className="space-y-2">
              {ranking.map((item, index) => (
                <div
                  key={`${item.professorId}-${index}`}
                  className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium">
                      {index + 1}º {item.professorNome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Turmas: {item.turmaNomes.join(", ") || "Sem turma"}
                    </p>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">{item.presencaPct.toFixed(1)}%</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {item.presencas} presenças · {item.ausencias} ausências
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {filtrados.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum professor encontrado.</p>
        ) : (
          filtrados.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{item.nome}</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="default" className="text-xs">Professor</Badge>
                    <Badge variant="outline" className="text-xs">{item.turmaNome || "Sem turma"}</Badge>
                  </div>
                </div>
                {podeEditarProfessores ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTransferirTarget({
                        professorId: item.professorId,
                        nome: item.nome,
                        turmaAtualId: item.turmaId,
                        turmaAtualNome: item.turmaNome || "Sem turma",
                      });
                      setTurmaSelecionadaTransferencia(item.turmaId);
                    }}
                  >
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    Transferir
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog
        open={Boolean(transferirTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setTransferirTarget(null);
            setTurmaSelecionadaTransferencia("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir professor</DialogTitle>
            <DialogDescription>
              {transferirTarget?.nome ?? "Professor"} está na turma{" "}
              {transferirTarget?.turmaAtualNome ?? "atual"}.
              Escolha a nova turma para concluir a transferência.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Turma atual</p>
              <p className="text-sm font-medium">{transferirTarget?.turmaAtualNome ?? "—"}</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Nova turma</p>
              <Select
                value={turmaSelecionadaTransferencia}
                onValueChange={setTurmaSelecionadaTransferencia}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a turma de destino" />
                </SelectTrigger>
                <SelectContent>
                  {turmasDisponiveisParaTransferencia.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setTransferirTarget(null);
                  setTurmaSelecionadaTransferencia("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => atribuirMutation.mutate()}
                disabled={!turmaSelecionadaTransferencia || atribuirMutation.isPending}
              >
                {atribuirMutation.isPending ? "Transferindo..." : "Confirmar transferência"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
