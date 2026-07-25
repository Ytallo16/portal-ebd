import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { FrequenciaProfessoresSkeleton, RedirectSkeleton } from "@/components/skeletons";
import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  isSomenteProfessor,
  selecionarAlvoFrequenciaProfessor,
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
  const [presencaLocal, setPresencaLocal] = useState<Record<string, boolean>>({});
  const [salvandoProfessor, setSalvandoProfessor] = useState<Record<number, boolean>>({});
  const [turmaSelecionada, setTurmaSelecionada] = useState<Record<number, string>>({});
  const podeConsultarPagina =
    podeCarregarOperacional && paramsValidos && !somenteProfessor;

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

  const { data: sheets = [] } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "attendance-sheets"),
    queryFn: fetchAttendanceSheets,
    enabled: podeConsultarPagina,
  });

  const licao = licoes.find((item) => item.numero === numeroLicao);
  const lessonId = licao?.id;

  const professores = useMemo(() => {
    if (!lessonId) return [];
    const map = new Map<
      string,
      {
        id: number;
        nome: string;
        turmas: string[];
        presente: boolean;
        targets: Array<{
          classGroupId: string;
          turmaNome: string;
          sheetId?: string;
          professorId: number;
          presente: boolean;
        }>;
      }
    >();

    turmas.forEach((turma) => {
      const sheet = sheets.find((item) => item.lesson === lessonId && item.classGroup === turma.id);
      turma.professorUsers.forEach((prof) => {
        const current = map.get(String(prof.id));
        const presenteNaTurma = sheet?.professor === prof.id ? Boolean(sheet.professorPresente) : false;
        const target = {
          classGroupId: turma.id,
          turmaNome: turma.nome,
          sheetId: sheet?.id,
          professorId: prof.id,
          presente: presenteNaTurma,
        };

        if (!current) {
          map.set(String(prof.id), {
            id: prof.id,
            nome: prof.nome,
            turmas: [turma.nome],
            presente: presenteNaTurma,
            targets: [target],
          });
          return;
        }

        current.presente = current.presente || presenteNaTurma;
        if (!current.turmas.includes(turma.nome)) current.turmas.push(turma.nome);
        current.targets.push(target);
      });
    });

    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [lessonId, turmas, sheets]);

  const marcarPresencaMutation = useMutation({
    mutationFn: async ({
      professorId,
      target,
      presente,
    }: {
      professorId: number;
      target: {
        classGroupId: string;
        sheetId?: string;
        professorId: number;
      };
      presente: boolean;
    }) => {
      if (!lessonId) throw new Error("Lição inválida");

      const sheet =
        target.sheetId != null
          ? { id: target.sheetId }
          : await attendanceApi.ensureAttendanceSheet(
              lessonId,
              target.classGroupId,
              target.professorId,
            );
      await attendanceApi.updateAttendanceSheet(sheet.id, {
        professor: target.professorId,
        professorPresente: presente,
      });
    },
    onMutate: ({ professorId, target, presente }) => {
      const stateKey = `${professorId}:${target.classGroupId}`;
      setPresencaLocal((prev) => ({ ...prev, [stateKey]: presente }));
      setSalvandoProfessor((prev) => ({ ...prev, [professorId]: true }));
    },
    onSuccess: (_, variables) => {
      setSalvandoProfessor((prev) => ({ ...prev, [variables.professorId]: false }));
      void queryClient.invalidateQueries({ queryKey: ["attendance-sheets"] });
    },
    onError: (_, variables) => {
      setSalvandoProfessor((prev) => ({ ...prev, [variables.professorId]: false }));
      setPresencaLocal((prev) => {
        const next = { ...prev };
        delete next[
          `${variables.professorId}:${variables.target.classGroupId}`
        ];
        return next;
      });
      toast.error("Não foi possível atualizar frequência dos professores.");
    },
  });

  useEffect(() => {
    if (professores.length === 0) {
      setPresencaLocal({});
      return;
    }
    setPresencaLocal((prev) => {
      const next: Record<string, boolean> = {};
      professores.forEach((professor) => {
        professor.targets.forEach((target) => {
          const stateKey = `${professor.id}:${target.classGroupId}`;
          next[stateKey] = prev[stateKey] ?? target.presente;
        });
      });
      return next;
    });
  }, [professores]);

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

  if (loadingLicao) {
    return <FrequenciaProfessoresSkeleton />;
  }

  if (!licao) {
    return <Navigate to={licoesLicaoPath(ano, trimestre, numeroLicao)} replace />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="touch-target"
          onClick={() => navigate(licoesLicaoPath(ano, trimestre, numeroLicao))}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Frequência dos professores</h1>
          <p className="text-sm text-muted-foreground">Lição {numeroLicao}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Professores da igreja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {professores.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum professor vinculado às turmas desta igreja.
            </p>
          ) : (
            professores.map((professor) => {
              const target = selecionarAlvoFrequenciaProfessor(
                professor.targets,
                turmaSelecionada[professor.id],
              );
              const stateKey = target
                ? `${professor.id}:${target.classGroupId}`
                : null;
              const presenteSelecionado =
                target && stateKey
                  ? (presencaLocal[stateKey] ?? target.presente)
                  : false;
              return (
                <div
                  key={professor.id}
                  className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{professor.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      Turmas: {professor.turmas.join(", ")}
                    </p>
                  </div>
                  {podeMarcarPresencaProfessor ? (
                    <div className="flex items-center gap-3">
                      {professor.targets.length > 1 ? (
                        <select
                          aria-label={`Turma para registrar a frequência de ${professor.nome}`}
                          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                          value={turmaSelecionada[professor.id] ?? ""}
                          disabled={Boolean(salvandoProfessor[professor.id])}
                          onChange={(event) =>
                            setTurmaSelecionada((prev) => ({
                              ...prev,
                              [professor.id]: event.target.value,
                            }))
                          }
                        >
                          <option value="">Selecione a turma</option>
                          {professor.targets.map((item) => (
                            <option
                              key={item.classGroupId}
                              value={item.classGroupId}
                            >
                              {item.turmaNome}
                            </option>
                          ))}
                        </select>
                      ) : null}
                      <Switch
                        checked={presenteSelecionado}
                        disabled={
                          Boolean(salvandoProfessor[professor.id]) || !target
                        }
                        onCheckedChange={(checked) => {
                          if (!target) {
                            toast.info(
                              "Selecione a turma antes de registrar a frequência.",
                            );
                            return;
                          }
                          marcarPresencaMutation.mutate({
                            professorId: professor.id,
                            target,
                            presente: checked,
                          });
                        }}
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {professor.presente ? "Presente" : "Ausente"}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
