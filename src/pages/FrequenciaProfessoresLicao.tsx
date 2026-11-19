import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { FrequenciaProfessoresSkeleton, RedirectSkeleton } from "@/components/skeletons";
import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  alteracoesPendentesProfessores,
  chavePresencaProfessor,
  isSomenteProfessor,
  presencaProfessoresDoServidor,
} from "@/lib/chamada";
import { licoesLicaoPath, licoesRegistroTurmaProfessorPath } from "@/lib/licoesRoutes";
import {
  attendanceApi,
  fetchAttendanceSheets,
  fetchLicoes,
  fetchTurmas,
} from "@/lib/portalApi";

export default function FrequenciaProfessoresLicao() {
  const { ano: anoParam, trimestre: trimestreParam, licaoNumero: licaoNumeroParam } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    activeOrgId,
    podeCarregarOperacional,
    can,
    hasRole,
    isAdminSistema,
    turmasProfessor,
    isLoading: loadingUsuario,
  } = usePermissions();

  const ano = Number(anoParam);
  const trimestre = Number(trimestreParam);
  const numeroLicao = Number(licaoNumeroParam);
  const paramsValidos =
    Number.isFinite(ano) &&
    Number.isFinite(trimestre) &&
    Number.isFinite(numeroLicao);
  const somenteProfessor = isSomenteProfessor({ isAdminSistema, hasRole });
  const podeMarcarPresencaProfessor = can("frequencia", "editar") || can("frequencia", "criar");
  const podeConsultarPagina =
    podeCarregarOperacional && paramsValidos && !somenteProfessor;

  /** Só o que o usuário mexeu nesta sessão de edição. */
  const [edicoes, setEdicoes] = useState<Record<string, boolean>>({});

  const { data: licoes = [], isLoading: loadingLicao } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "licoes", trimestre, ano),
    queryFn: () => fetchLicoes({ trimestre, ano }),
    enabled: podeConsultarPagina,
  });

  const { data: turmas = [] } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "turmas"),
    queryFn: fetchTurmas,
    enabled: podeConsultarPagina,
  });

  const licao = licoes.find((item) => item.numero === numeroLicao);
  const lessonId = licao?.id;

  const { data: sheets = [], isLoading: loadingSheets } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "attendance-sheets", lessonId),
    queryFn: () => fetchAttendanceSheets({ lesson: lessonId! }),
    enabled: podeConsultarPagina && Boolean(lessonId),
  });

  const turmasComProfessores = useMemo(
    () =>
      turmas
        .filter((turma) => turma.ativa && turma.professorUsers.length > 0)
        .map((turma) => ({
          ...turma,
          professorUsers: [...turma.professorUsers].sort((a, b) =>
            a.nome.localeCompare(b.nome, "pt-BR"),
          ),
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [turmas],
  );

  const presencaServidor = useMemo(
    () =>
      presencaProfessoresDoServidor({
        turmas: turmasComProfessores,
        sheets,
      }),
    [turmasComProfessores, sheets],
  );

  const pendentes = useMemo(
    () => alteracoesPendentesProfessores(presencaServidor, edicoes),
    [presencaServidor, edicoes],
  );
  const temPendencias = pendentes.length > 0;

  const presencaAtual = useCallback(
    (turmaId: string, professorId: number) => {
      const chave = chavePresencaProfessor(turmaId, professorId);
      return edicoes[chave] ?? presencaServidor[chave] ?? false;
    },
    [edicoes, presencaServidor],
  );

  // Avisa antes de perder alterações não salvas ao fechar ou recarregar a aba.
  useEffect(() => {
    if (!temPendencias) return;
    const avisar = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [temPendencias]);

  const salvarMutation = useMutation({
    mutationFn: async () => {
      if (!lessonId) throw new Error("Lição inválida");

      // Agrupa por turma: uma requisição por turma alterada, com a presença de
      // todos os professores daquela turma.
      const turmasAlteradas = turmasComProfessores.filter((turma) =>
        turma.professorUsers.some((professor) =>
          pendentes.includes(chavePresencaProfessor(turma.id, professor.id)),
        ),
      );

      for (const turma of turmasAlteradas) {
        const sheetExistente = sheets.find((item) => item.classGroup === turma.id);
        const sheet =
          sheetExistente ??
          (await attendanceApi.ensureAttendanceSheet(lessonId, turma.id));

        await attendanceApi.saveAttendanceTeachers(
          sheet.id,
          turma.professorUsers.map((professor) => ({
            user: professor.id,
            presente: presencaAtual(turma.id, professor.id),
          })),
        );
      }

      return turmasAlteradas.length;
    },
    onSuccess: async (turmasSalvas) => {
      // Recarrega antes de limpar as edições, para a tela não piscar os
      // valores antigos do servidor no meio do caminho.
      await queryClient.invalidateQueries({ queryKey: ["attendance-sheets"] });
      setEdicoes({});
      toast.success(
        turmasSalvas === 1
          ? "Frequência salva em 1 turma."
          : `Frequência salva em ${turmasSalvas} turmas.`,
      );
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Não foi possível salvar a frequência dos professores.",
      );
    },
  });

  const salvando = salvarMutation.isPending;

  const marcarTurma = (
    turma: (typeof turmasComProfessores)[number],
    presente: boolean,
  ) => {
    setEdicoes((prev) => {
      const next = { ...prev };
      for (const professor of turma.professorUsers) {
        next[chavePresencaProfessor(turma.id, professor.id)] = presente;
      }
      return next;
    });
  };

  const voltar = () => {
    if (
      temPendencias &&
      !window.confirm(
        "Há frequência não salva nesta lição. Sair e descartar as alterações?",
      )
    ) {
      return;
    }
    navigate(licoesLicaoPath(ano, trimestre, numeroLicao));
  };

  if (!paramsValidos) {
    return <Navigate to="/licoes" replace />;
  }

  if (somenteProfessor && loadingUsuario) {
    return <RedirectSkeleton />;
  }

  if (somenteProfessor) {
    const registroPath = licoesRegistroTurmaProfessorPath(
      ano,
      trimestre,
      numeroLicao,
      turmasProfessor,
    );
    return (
      <Navigate
        to={registroPath ?? licoesLicaoPath(ano, trimestre, numeroLicao)}
        replace
      />
    );
  }

  if (loadingLicao || loadingSheets) {
    return <FrequenciaProfessoresSkeleton />;
  }

  if (!licao) {
    return <Navigate to={licoesLicaoPath(ano, trimestre, numeroLicao)} replace />;
  }

  const totalProfessores = turmasComProfessores.reduce(
    (total, turma) => total + turma.professorUsers.length,
    0,
  );
  const totalPresentes = turmasComProfessores.reduce(
    (total, turma) =>
      total +
      turma.professorUsers.filter((professor) =>
        presencaAtual(turma.id, professor.id),
      ).length,
    0,
  );

  return (
    <div className="animate-fade-in flex min-h-full flex-col">
      <div className="flex-1 space-y-4">
        <div className="flex items-start gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="touch-target shrink-0"
            onClick={voltar}
            aria-label="Voltar para a lição"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 pt-2">
            <h1 className="truncate text-xl font-bold sm:text-2xl">
              Frequência dos professores
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              Lição {numeroLicao} · {licao.tema}
            </p>
          </div>
        </div>

        {turmasComProfessores.length === 0 ? (
          <Card>
            <CardContent className="py-6">
              <p className="text-sm text-muted-foreground">
                Nenhum professor vinculado às turmas ativas desta igreja.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {turmasComProfessores.map((turma) => {
              const presentes = turma.professorUsers.filter((professor) =>
                presencaAtual(turma.id, professor.id),
              ).length;
              const todosPresentes = presentes === turma.professorUsers.length;

              return (
                <Card key={turma.id}>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">
                        {turma.nome}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {presentes} de {turma.professorUsers.length} presente
                        {turma.professorUsers.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    {podeMarcarPresencaProfessor && turma.professorUsers.length > 1 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-xs"
                        disabled={salvando}
                        onClick={() => marcarTurma(turma, !todosPresentes)}
                      >
                        {todosPresentes ? "Limpar" : "Todos"}
                      </Button>
                    ) : null}
                  </CardHeader>
                  <CardContent className="space-y-2 pb-3">
                    {turma.professorUsers.map((professor) => {
                      const chave = chavePresencaProfessor(turma.id, professor.id);
                      const presente = presencaAtual(turma.id, professor.id);
                      const alterado = pendentes.includes(chave);
                      const switchId = `presenca-${chave}`;

                      return (
                        <label
                          key={professor.id}
                          htmlFor={switchId}
                          className="flex min-h-[56px] cursor-pointer items-center justify-between gap-3 rounded-md border px-3 py-2 active:bg-muted/60"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">{professor.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {presente ? "Presente" : "Ausente"}
                              {alterado ? " · não salvo" : ""}
                            </p>
                          </div>
                          {podeMarcarPresencaProfessor ? (
                            <Switch
                              id={switchId}
                              checked={presente}
                              disabled={salvando}
                              onCheckedChange={(checked) =>
                                setEdicoes((prev) => ({ ...prev, [chave]: checked }))
                              }
                            />
                          ) : (
                            <span className="shrink-0 text-sm text-muted-foreground">
                              {presente ? "Presente" : "Ausente"}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {podeMarcarPresencaProfessor && turmasComProfessores.length > 0 ? (
        <div className="safe-area-bottom sticky bottom-0 -mx-3 mt-4 border-t bg-background/95 px-3 pb-3 pt-3 backdrop-blur md:-mx-6 md:px-6">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {totalPresentes} de {totalProfessores} presentes
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {temPendencias
                  ? pendentes.length === 1
                    ? "1 alteração não salva"
                    : `${pendentes.length} alterações não salvas`
                  : "Tudo salvo"}
              </p>
            </div>
            {temPendencias ? (
              <Button
                variant="ghost"
                className="touch-target shrink-0"
                onClick={() => setEdicoes({})}
                disabled={salvando}
              >
                Descartar
              </Button>
            ) : null}
            <Button
              className="touch-target shrink-0"
              onClick={() => salvarMutation.mutate()}
              disabled={!temPendencias || salvando}
            >
              {salvando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
