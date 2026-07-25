import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Medal, Search, TrendingUp, UserPlus, UserRoundCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

import { PersonGridCard, personListGridClassName } from "@/components/lists/PersonGridCard";
import { ListRowSkeleton, ProfessoresPageSkeleton } from "@/components/skeletons";
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
import { cn } from "@/lib/utils";

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
  const [vincularTarget, setVincularTarget] = useState<{
    professorId: string;
    nome: string;
    turmaIds: string[];
    turmaNomes: string[];
  } | null>(null);
  const [turmaSelecionadaVinculo, setTurmaSelecionadaVinculo] = useState("");
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

  const vinculosProfessores = useMemo(() => {
    const todos = teachersApi.buildMatriculadosProfessores(turmas);
    if (!somenteProfessor) return todos;
    const idsTurmasProfessor = new Set(turmasProfessor.map((turma) => String(turma.id)));
    return todos.filter((item) => idsTurmasProfessor.has(item.turmaId));
  }, [turmas, somenteProfessor, turmasProfessor]);

  const professores = useMemo(() => {
    const agrupados = new Map<
      string,
      {
        professorId: string;
        nome: string;
        turmaIds: string[];
        turmaNomes: string[];
      }
    >();
    vinculosProfessores.forEach((vinculo) => {
      const atual = agrupados.get(vinculo.professorId) ?? {
        professorId: vinculo.professorId,
        nome: vinculo.nome,
        turmaIds: [],
        turmaNomes: [],
      };
      atual.turmaIds.push(vinculo.turmaId);
      atual.turmaNomes.push(vinculo.turmaNome);
      agrupados.set(vinculo.professorId, atual);
    });
    return Array.from(agrupados.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR"),
    );
  }, [vinculosProfessores]);

  const filtrados = professores.filter((item) => {
    const termo = search.toLowerCase();
    return (
      item.nome.toLowerCase().includes(termo) ||
      item.turmaNomes.some((nome) => nome.toLowerCase().includes(termo))
    );
  });

  const totalTurmas = useMemo(
    () => new Set(vinculosProfessores.map((item) => item.turmaId)).size,
    [vinculosProfessores],
  );
  const anosDisponiveis = useMemo(() => {
    const anos = new Set<number>([getAnoAtual()]);
    trimestres.forEach((item) => anos.add(item.ano));
    return Array.from(anos).sort((a, b) => b - a);
  }, [trimestres]);
  const mediaPresenca =
    ranking.length === 0
      ? 0
      : ranking.reduce((acc, item) => acc + item.presencaPct, 0) / ranking.length;
  const turmasDisponiveisParaVinculo = useMemo(() => {
    if (!vincularTarget) return [];
    const vinculadas = new Set(vincularTarget.turmaIds);
    return turmas.filter((turma) => !vinculadas.has(turma.id));
  }, [turmas, vincularTarget]);

  const atribuirMutation = useMutation({
    mutationFn: async () => {
      if (!vincularTarget || !turmaSelecionadaVinculo) {
        throw new Error("Selecione uma turma.");
      }
      await teachersApi.addProfessorTurma(
        turmaSelecionadaVinculo,
        vincularTarget.professorId,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["turmas"] });
      setVincularTarget(null);
      setTurmaSelecionadaVinculo("");
      toast.success("Professor vinculado à nova turma.");
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
    return <ProfessoresPageSkeleton />;
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
              <p className="text-xs text-muted-foreground">Professores vinculados</p>
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
            <ListRowSkeleton count={5} />
          ) : ranking.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Não há dados de frequência de professores para este filtro.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ranking.map((item, index) => (
                <Card key={`${item.professorId}-${index}`} className="overflow-hidden">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                        index === 0
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {index + 1}º
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-tight">{item.professorNome}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.turmaNomes.join(", ") || "Sem turma"}
                      </p>
                      <p className="mt-2 text-lg font-bold text-primary">
                        {item.presencaPct.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.presencas} presenças · {item.ausencias} ausências
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className={personListGridClassName()}>
        {filtrados.length === 0 ? (
          <p className="text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
            Nenhum professor encontrado.
          </p>
        ) : (
          filtrados.map((item) => (
            <PersonGridCard
              key={item.professorId}
              nome={item.nome}
              fallbackClassName="bg-secondary text-secondary-foreground"
              badges={
                <>
                  <Badge className="text-xs">Professor</Badge>
                  {item.turmaNomes.map((turmaNome) => (
                    <Badge key={turmaNome} variant="outline" className="text-xs">
                      {turmaNome}
                    </Badge>
                  ))}
                </>
              }
              footer={
                podeEditarProfessores ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full touch-target sm:w-auto"
                    onClick={() => {
                      setVincularTarget({
                        professorId: item.professorId,
                        nome: item.nome,
                        turmaIds: item.turmaIds,
                        turmaNomes: item.turmaNomes,
                      });
                      setTurmaSelecionadaVinculo("");
                    }}
                    disabled={item.turmaIds.length >= turmas.length}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Vincular a outra turma
                  </Button>
                ) : null
              }
            />
          ))
        )}
      </div>

      <Dialog
        open={Boolean(vincularTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setVincularTarget(null);
            setTurmaSelecionadaVinculo("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular professor a outra turma</DialogTitle>
            <DialogDescription>
              {vincularTarget?.nome ?? "Professor"} continuará nas turmas atuais. Escolha
              uma turma adicional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Turmas atuais</p>
              <p className="text-sm font-medium">
                {vincularTarget?.turmaNomes.join(", ") || "—"}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Turma adicional</p>
              <Select
                value={turmaSelecionadaVinculo}
                onValueChange={setTurmaSelecionadaVinculo}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmasDisponiveisParaVinculo.map((turma) => (
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
                  setVincularTarget(null);
                  setTurmaSelecionadaVinculo("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => atribuirMutation.mutate()}
                disabled={!turmaSelecionadaVinculo || atribuirMutation.isPending}
              >
                {atribuirMutation.isPending ? "Vinculando..." : "Confirmar vínculo"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
