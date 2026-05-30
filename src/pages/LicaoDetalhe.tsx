import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  BookMarked,
  DollarSign,
  CheckCircle,
  Loader2,
  Users,
} from "lucide-react";

import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  chamadaStatusLabel,
  getChamadaTurmaStatus,
  isSecretarioOuAdmin,
  isSomenteProfessor,
  type ChamadaTurmaStatus,
} from "@/lib/chamada";
import {
  fetchAttendanceSheets,
  fetchLessonSchedules,
  fetchLicoes,
  fetchTurmas,
  finalizeLesson,
  saveLessonSchedulesBulk,
  type FinalizeLessonError,
} from "@/lib/portalApi";
import {
  licoesRegistroTurmaProfessorPath,
  licoesTrimestrePath,
  licoesTurmaPath,
} from "@/lib/licoesRoutes";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function statusBadgeVariant(status: ChamadaTurmaStatus) {
  if (status === "registrada") return "default" as const;
  return "outline" as const;
}

export default function LicaoDetalhe() {
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
  const papelCtx = { isAdminSistema, hasRole };
  const secretarioOuAdmin = isSecretarioOuAdmin(papelCtx);
  const isProfessor = isSomenteProfessor(papelCtx);
  const idsTurmasProfessor = useMemo(
    () => new Set(turmasProfessor.map((t) => String(t.id))),
    [turmasProfessor],
  );
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [escalaForm, setEscalaForm] = useState<Record<string, string>>({});

  const ano = Number(anoParam);
  const trimestre = Number(trimestreParam);
  const numeroLicao = Number(licaoNumeroParam);

  if (!Number.isFinite(ano) || !Number.isFinite(trimestre) || !Number.isFinite(numeroLicao)) {
    return <Navigate to="/licoes" replace />;
  }

  if (isProfessor && loadingUsuario) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  if (isProfessor) {
    const registroPath = licoesRegistroTurmaProfessorPath(
      ano,
      trimestre,
      numeroLicao,
      turmasProfessor,
    );
    if (registroPath) {
      return <Navigate to={registroPath} replace />;
    }
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Nenhuma turma vinculada ao seu usuário. Peça à secretaria para associá-lo como professor
          de uma turma.
        </p>
        <Button variant="outline" onClick={() => navigate(licoesTrimestrePath(ano, trimestre))}>
          Voltar ao trimestre
        </Button>
      </div>
    );
  }

  const { data: licoes = [], isLoading: loadingLicao } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "licoes", trimestre, ano),
    queryFn: () => fetchLicoes({ trimestre, ano }),
    enabled: podeCarregarOperacional,
  });

  const licao = licoes.find((l) => l.numero === numeroLicao);
  const lessonId = licao?.id;
  const lessonFinalizada = licao?.status === "Finalizada";

  const { data: turmas = [] } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "turmas"),
    queryFn: fetchTurmas,
    enabled: podeCarregarOperacional,
  });

  const { data: sheets = [] } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "attendance-sheets"),
    queryFn: fetchAttendanceSheets,
    enabled: podeCarregarOperacional,
  });

  const podeEscalarProfessores =
    secretarioOuAdmin && (can("licoes", "editar") || can("licoes", "criar"));

  const { data: escalas = [] } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "lesson-schedules", lessonId),
    queryFn: () => fetchLessonSchedules({ lessonId: lessonId! }),
    enabled: podeCarregarOperacional && Boolean(lessonId),
  });

  useEffect(() => {
    if (!lessonId) return;
    const next: Record<string, string> = {};
    turmas.forEach((turma) => {
      const escala = escalas.find((item) => item.classGroupId === turma.id);
      next[turma.id] = escala?.professorId ?? "";
    });
    setEscalaForm(next);
  }, [lessonId, escalas, turmas]);

  const saveEscalaMutation = useMutation({
    mutationFn: () => {
      if (!lessonId) throw new Error("Lição inválida");
      return saveLessonSchedulesBulk(
        lessonId,
        turmas.map((turma) => ({
          classGroupId: turma.id,
          professorId: escalaForm[turma.id] || null,
        })),
      );
    },
    onSuccess: () => {
      toast.success("Escala de professores salva.");
      void queryClient.invalidateQueries({ queryKey: ["lesson-schedules"] });
    },
    onError: () => toast.error("Não foi possível salvar a escala."),
  });

  const escalaPorTurma = useMemo(() => {
    const map = new Map<string, (typeof escalas)[number]>();
    escalas.forEach((item) => map.set(item.classGroupId, item));
    return map;
  }, [escalas]);

  const turmasBase = useMemo(() => {
    if (isProfessor) {
      return turmas.filter((t) => idsTurmasProfessor.has(t.id));
    }
    return turmas;
  }, [turmas, isProfessor, idsTurmasProfessor]);

  const turmasComChamada = useMemo(() => {
    if (!lessonId) return [];

    return turmasBase.map((t) => {
      const sheet = sheets.find((s) => s.lesson === lessonId && s.classGroup === t.id);
      const status = getChamadaTurmaStatus(sheet);
      const presentes = sheet?.records.filter((r) => r.presente).length ?? 0;
      const ausentes = sheet?.records.filter((r) => !r.presente).length ?? 0;
      const professorNome =
        sheet?.professor != null
          ? t.professorUsers.find((p) => p.id === sheet.professor)?.nome ??
            t.professores[0] ??
            "—"
          : escalaPorTurma.get(t.id)?.professorNome ?? "—";

      return {
        turmaId: t.id,
        turmaNome: t.nome,
        turmaLabel: t.nome.length > 10 ? `${t.nome.slice(0, 10)}…` : t.nome,
        status,
        presentes,
        ausentes,
        biblias: sheet?.biblias ?? 0,
        revistas: sheet?.revistas ?? 0,
        oferta: sheet?.ofertaValor ?? 0,
        professorNome,
        sheet,
      };
    });
  }, [lessonId, turmasBase, sheets, escalaPorTurma]);

  const primeiraTurmaPendente = turmasComChamada.find((t) => t.status === "nao_iniciada");

  const todasTurmasComRegistro =
    turmasComChamada.length > 0 && turmasComChamada.every((t) => t.sheet);

  const chamadaPorClasse = turmasComChamada.filter(
    (c) => c.presentes > 0 || c.ausentes > 0,
  );

  const totalPresentes =
    chamadaPorClasse.reduce((acc, item) => acc + item.presentes, 0) || licao?.presentes || 0;
  const totalAusentes =
    chamadaPorClasse.reduce((acc, item) => acc + item.ausentes, 0) || licao?.ausentes || 0;
  const totalBiblias = turmasComChamada.reduce((acc, item) => acc + item.biblias, 0);
  const totalRevistas = turmasComChamada.reduce((acc, item) => acc + item.revistas, 0);
  const totalOfertas = turmasComChamada.reduce((acc, item) => acc + item.oferta, 0);

  const pctPresenca =
    totalPresentes + totalAusentes > 0
      ? Math.round((totalPresentes / (totalPresentes + totalAusentes)) * 100)
      : 0;

  const podeFinalizarLicao =
    secretarioOuAdmin &&
    (can("licoes", "editar") || can("licoes", "aprovar")) &&
    !lessonFinalizada &&
    todasTurmasComRegistro;

  const finalizeMutation = useMutation({
    mutationFn: () => finalizeLesson(lessonId!),
    onSuccess: () => {
      toast.success("Lição finalizada com sucesso.");
      setConfirmFinalize(false);
      void queryClient.invalidateQueries({ queryKey: ["licoes"] });
      void queryClient.invalidateQueries({ queryKey: ["attendance-sheets"] });
    },
    onError: (error: Error & FinalizeLessonError) => {
      const pendentes = error.turmasPendentes?.length
        ? ` Turmas pendentes: ${error.turmasPendentes.join(", ")}.`
        : "";
      toast.error(`${error.message}${pendentes}`);
      setConfirmFinalize(false);
    },
  });

  const professoresNaLicao = useMemo(() => {
    const vistos = new Set<string>();
    return turmasComChamada.flatMap((t) => {
      const nome = t.professorNome;
      if (nome === "—" || vistos.has(`${nome}-${t.turmaId}`)) return [];
      vistos.add(`${nome}-${t.turmaId}`);
      return [
        {
          nome,
          turma: t.turmaNome,
          registrado: Boolean(t.sheet),
          escalado: Boolean(escalaPorTurma.get(t.turmaId)?.professorId),
        },
      ];
    });
  }, [turmasComChamada, escalaPorTurma]);

  if (loadingLicao) {
    return <p className="text-sm text-muted-foreground">Carregando lição...</p>;
  }

  if (!licao) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Lição {numeroLicao} ainda não cadastrada neste trimestre.
        </p>
        <Button variant="outline" onClick={() => navigate(licoesTrimestrePath(ano, trimestre))}>
          Voltar ao trimestre
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="touch-target"
            onClick={() => navigate(licoesTrimestrePath(ano, trimestre))}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Lição {licao.numero} — {licao.tema}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">{formatDate(licao.data)}</span>
              <Badge variant={licao.status === "Finalizada" ? "default" : "outline"}>
                {licao.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {primeiraTurmaPendente && !lessonFinalizada && (
            <Button
              variant="outline"
              onClick={() =>
                navigate(
                  licoesTurmaPath(ano, trimestre, numeroLicao, primeiraTurmaPendente.turmaId),
                )
              }
            >
              {isProfessor ? "Registrar minha EBD" : "Registrar EBD"}
            </Button>
          )}
          {podeFinalizarLicao && (
            <Button onClick={() => setConfirmFinalize(true)}>Finalizar lição</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold">{totalBiblias}</p>
              <p className="text-xs text-muted-foreground">Bíblias</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <BookMarked className="h-5 w-5 text-secondary" />
            <div>
              <p className="text-xl font-bold">{totalRevistas}</p>
              <p className="text-xs text-muted-foreground">Revistas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <DollarSign className="h-5 w-5 text-success" />
            <div>
              <p className="text-xl font-bold">{formatCurrency(totalOfertas)}</p>
              <p className="text-xs text-muted-foreground">Ofertas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Frequência por turma</CardTitle>
          </CardHeader>
          <CardContent>
            {chamadaPorClasse.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma chamada registrada ainda.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chamadaPorClasse} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="turmaLabel" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="presentes" fill="hsl(142,71%,45%)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="ausentes" fill="hsl(0,72%,51%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resumo de presença</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="relative h-32 w-32">
              <svg viewBox="0 0 36 36" className="h-32 w-32 -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="hsl(207,79%,33%)"
                  strokeWidth="3"
                  strokeDasharray={`${pctPresenca}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{pctPresenca}%</span>
                <span className="text-xs text-muted-foreground">Presença</span>
              </div>
            </div>
            <div className="mt-4 flex gap-6 text-sm">
              <span className="font-medium text-success">{totalPresentes} presentes</span>
              <span className="font-medium text-destructive">{totalAusentes} ausentes</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {podeEscalarProfessores && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Escala de professores
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Defina quem ministra esta lição em cada turma. O professor verá a aula no painel dele.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {turmas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma turma cadastrada.</p>
            ) : (
              <>
                <div className="space-y-3">
                  {turmas.map((turma) => (
                    <div
                      key={turma.id}
                      className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium">{turma.nome}</p>
                        <p className="text-xs text-muted-foreground">{turma.faixaEtaria}</p>
                      </div>
                      <Select
                        value={escalaForm[turma.id] || "__none"}
                        onValueChange={(value) =>
                          setEscalaForm((prev) => ({
                            ...prev,
                            [turma.id]: value === "__none" ? "" : value,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full sm:w-56 touch-target">
                          <SelectValue placeholder="Selecione o professor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">Sem professor</SelectItem>
                          {turma.professorUsers.length === 0 ? (
                            <SelectItem value="__empty" disabled>
                              Nenhum professor vinculado à turma
                            </SelectItem>
                          ) : (
                            turma.professorUsers.map((professor) => (
                              <SelectItem key={professor.id} value={String(professor.id)}>
                                {professor.nome}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => saveEscalaMutation.mutate()}
                    disabled={saveEscalaMutation.isPending || !lessonId}
                  >
                    {saveEscalaMutation.isPending ? "Salvando..." : "Salvar escala"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Registro por turma</CardTitle>
          <p className="text-xs text-muted-foreground">
            Clique na turma para registrar ou revisar presenças, totais e ofertas.
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-2">Turma</th>
                <th className="p-2">Professor</th>
                <th className="p-2">Status</th>
                <th className="p-2 text-center">Presentes</th>
                <th className="p-2 text-center">Bíblias</th>
                <th className="p-2 text-center">Revistas</th>
                <th className="p-2 text-center">Oferta</th>
                <th className="p-2 text-center">%</th>
              </tr>
            </thead>
            <tbody>
              {turmasComChamada.map((t) => {
                const total = t.presentes + t.ausentes;
                return (
                  <tr
                    key={t.turmaId}
                    className="cursor-pointer border-b transition-colors hover:bg-muted/50"
                    onClick={() =>
                      navigate(licoesTurmaPath(ano, trimestre, numeroLicao, t.turmaId))
                    }
                  >
                    <td className="p-2 font-medium">{t.turmaNome}</td>
                    <td className="p-2 text-muted-foreground">{t.professorNome}</td>
                    <td className="p-2">
                      <Badge variant={statusBadgeVariant(t.status)}>
                        {chamadaStatusLabel[t.status]}
                      </Badge>
                    </td>
                    <td className="p-2 text-center text-success">{t.presentes}</td>
                    <td className="p-2 text-center">{t.biblias}</td>
                    <td className="p-2 text-center">{t.revistas}</td>
                    <td className="p-2 text-center">{formatCurrency(t.oferta)}</td>
                    <td className="p-2 text-center">
                      {total > 0 ? `${Math.round((t.presentes / total) * 100)}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Professores escalados / nas chamadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {professoresNaLicao.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum professor escalado ou registrado nas fichas.
            </p>
          ) : (
            professoresNaLicao.map((p) => (
              <div key={`${p.nome}-${p.turma}`} className="flex items-center gap-2 text-sm">
                <CheckCircle
                  className={`h-4 w-4 ${p.registrado ? "text-success" : p.escalado ? "text-primary" : "text-muted-foreground"}`}
                />
                <span>
                  {p.nome} <span className="text-muted-foreground">({p.turma})</span>
                  {!p.registrado && p.escalado ? (
                    <span className="ml-1 text-xs text-muted-foreground">· escalado</span>
                  ) : null}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmFinalize} onOpenChange={setConfirmFinalize}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar lição?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as turmas ativas já têm registro da EBD. Após confirmar, a lição ficará
              encerrada (os registros das turmas continuam editáveis).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={finalizeMutation.isPending}
              onClick={() => finalizeMutation.mutate()}
            >
              {finalizeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
