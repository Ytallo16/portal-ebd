import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, BookMarked, DollarSign, Loader2, Users, UserPlus } from "lucide-react";

import { ApiError } from "@/lib/api";
import { ClasseDetalheSkeleton } from "@/components/skeletons";
import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import type { Turma } from "@/lib/portalApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { licoesRegistroTurmaProfessorPath, licoesVoltarDaTurmaPath } from "@/lib/licoesRoutes";
import {
  chamadaStatusLabel,
  getChamadaTurmaStatus,
  isSomenteProfessor,
  mensagemBloqueioChamada,
  podeEditarChamadaNaTurma,
  professorPodeRegistrarChamada,
} from "@/lib/chamada";
import { formatCurrency, getIniciais } from "@/lib/formatters";
import {
  ensureAttendanceSheet,
  fetchAlunos,
  fetchAttendanceByLessonClass,
  fetchLicoes,
  fetchTurmas,
  saveAttendanceRecords,
  updateAttendanceSheet,
} from "@/lib/portalApi";

type PresencaMap = Record<string, boolean>;

export default function ClasseDetalhe() {
  const {
    ano: anoParam,
    trimestre: trimestreParam,
    licaoNumero: licaoNumeroParam,
    classId,
  } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    activeOrgId,
    podeCarregarOperacional,
    can,
    isAdminSistema,
    hasRole,
    turmasProfessor,
    usuario,
    isLoading: loadingUsuario,
    organizacaoAtiva,
  } = usePermissions();

  const ano = Number(anoParam);
  const trimestre = Number(trimestreParam);
  const numeroLicao = Number(licaoNumeroParam);

  const [visitantes, setVisitantes] = useState(0);
  const [biblias, setBiblias] = useState(0);
  const [revistas, setRevistas] = useState(0);
  const [ofertaValor, setOfertaValor] = useState("0");
  const [professorId, setProfessorId] = useState<string>("");
  const [presencas, setPresencas] = useState<PresencaMap>({});

  if (
    !Number.isFinite(ano) ||
    !Number.isFinite(trimestre) ||
    !Number.isFinite(numeroLicao) ||
    !classId
  ) {
    return <Navigate to="/licoes" replace />;
  }

  const podeEditarFrequencia = can("frequencia", "criar") || can("frequencia", "editar");
  const isProfessor = isSomenteProfessor({ isAdminSistema, hasRole });
  const ensinaEstaTurma = turmasProfessor.some((t) => String(t.id) === classId);
  const voltarPath = () =>
    licoesVoltarDaTurmaPath(ano, trimestre, numeroLicao, isProfessor);

  const { data: licoes = [], isLoading: loadingLicoes } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "licoes", trimestre, ano),
    queryFn: () => fetchLicoes({ trimestre, ano }),
    enabled: podeCarregarOperacional,
  });

  const licao = licoes.find((l) => l.numero === numeroLicao);
  const lessonId = licao?.id;

  const { data: turmas = [], isLoading: loadingTurmas } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "turmas"),
    queryFn: fetchTurmas,
    enabled: podeCarregarOperacional,
  });

  const turmaFromProfessor = turmasProfessor.find((t) => String(t.id) === classId);
  const turmaFromLista = turmas.find((t) => t.id === classId);
  const turma: Turma | undefined =
    turmaFromLista ??
    (turmaFromProfessor
      ? {
          id: String(turmaFromProfessor.id),
          nome: turmaFromProfessor.nome,
          faixaEtaria: "",
          professores: [],
          professorUsers: [],
          totalAlunos: 0,
          cor: "#3B82F6",
          ativa: true,
        }
      : undefined);

  const carregandoContexto =
    loadingUsuario ||
    (podeCarregarOperacional && (loadingLicoes || loadingTurmas));

  const { data: alunos = [] } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "alunos"),
    queryFn: () => fetchAlunos(),
    enabled: podeCarregarOperacional,
  });

  const alunosDaTurma = useMemo(
    () => alunos.filter((a) => a.turmaId === classId),
    [alunos, classId],
  );

  const {
    data: sheet,
    isLoading: loadingSheet,
    isError: sheetLoadError,
    error: sheetError,
    isFetched: sheetFetched,
    refetch: refetchSheet,
  } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "attendance-classe", lessonId, classId),
    queryFn: async () => {
      if (!lessonId || !classId || !turma) return null;
      const existing = await fetchAttendanceByLessonClass(lessonId, classId);
      if (existing) return existing;
      const podeCriar =
        podeEditarFrequencia &&
        (!isProfessor || professorPodeRegistrarChamada(turmasProfessor, classId));
      if (!podeCriar) return null;
      const meuId = usuario?.id ? Number(usuario.id) : null;
      const professorPadrao =
        turma.professorUsers.find((p) => p.id === meuId)?.id ??
        turma.professorUsers[0]?.id ??
        null;
      return ensureAttendanceSheet(lessonId, classId, professorPadrao);
    },
    enabled: podeCarregarOperacional && Boolean(lessonId && classId && turma),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 403) return false;
      return failureCount < 1;
    },
  });

  useEffect(() => {
    if (!sheet) return;
    setVisitantes(sheet.visitantes);
    setBiblias(sheet.biblias);
    setRevistas(sheet.revistas);
    setOfertaValor(String(sheet.ofertaValor));
    setProfessorId(sheet.professor ? String(sheet.professor) : "");

    const map: PresencaMap = {};
    for (const aluno of alunosDaTurma) {
      const registro = sheet.records.find((r) => r.student === aluno.id);
      map[aluno.id] = registro?.presente ?? false;
    }
    setPresencas(map);
  }, [sheet, alunosDaTurma]);

  const podeEditarChamada = podeEditarChamadaNaTurma({
    podeEditarFrequencia,
    isProfessor,
    turmasProfessor,
    classId,
  });
  const mensagemBloqueio = mensagemBloqueioChamada({
    podeEditarFrequencia,
  });
  const somenteLeitura = !podeEditarChamada;

  const statusChamada = getChamadaTurmaStatus(sheet);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!sheet || !lessonId) throw new Error("Chamada não disponível");

      await updateAttendanceSheet(sheet.id, {
        professor: professorId ? Number(professorId) : null,
        visitantes,
        biblias,
        revistas,
        ofertaValor: Number(ofertaValor.replace(",", ".")) || 0,
      });

      const records = alunosDaTurma.map((aluno) => ({
        student: aluno.id,
        presente: Boolean(presencas[aluno.id]),
      }));

      return saveAttendanceRecords(sheet.id, records);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["attendance-classe"] });
      void queryClient.invalidateQueries({ queryKey: ["attendance-sheets"] });
      void queryClient.invalidateQueries({ queryKey: ["licoes"] });
      toast.success("Registro da EBD salvo.");
      void refetchSheet();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível salvar o registro da EBD.");
    },
  });

  const iniciarChamadaMutation = useMutation({
    mutationFn: async () => {
      if (!lessonId || !classId || !turma) throw new Error("Dados incompletos");
      return ensureAttendanceSheet(lessonId, classId, turma.professorUsers[0]?.id ?? null);
    },
    onSuccess: () => {
      void refetchSheet();
      toast.success("Registro da EBD iniciado.");
    },
    onError: () => toast.error("Não foi possível iniciar o registro."),
  });

  const presentes = alunosDaTurma.filter((a) => presencas[a.id]).length;
  const ausentes = alunosDaTurma.length - presentes;
  const pct = Math.round((presentes / Math.max(alunosDaTurma.length, 1)) * 100);

  if (carregandoContexto) {
    return <ClasseDetalheSkeleton />;
  }

  if (isProfessor && !podeEditarFrequencia) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Sem permissão de frequência no contexto atual
          {organizacaoAtiva?.nome ? ` (${organizacaoAtiva.nome})` : ""}. Selecione a igreja em que você
          leciona no seletor no topo da página (ex.: AD Dirceu).
        </p>
        <Button variant="outline" onClick={() => navigate("/licoes")}>
          Voltar às lições
        </Button>
      </div>
    );
  }

  if (!licao) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Lição {numeroLicao} não encontrada neste trimestre.
        </p>
        <Button variant="outline" onClick={() => navigate(voltarPath())}>
          Voltar
        </Button>
      </div>
    );
  }

  if (!turma) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Turma não encontrada no contexto atual. Confira se a igreja correta está selecionada no
          topo da página.
        </p>
        <Button variant="outline" onClick={() => navigate(voltarPath())}>
          Voltar
        </Button>
      </div>
    );
  }

  if (sheetLoadError) {
    const semPermissao =
      sheetError instanceof ApiError && sheetError.status === 403;
    return (
      <div className="space-y-4">
        <HeaderTurma turmaNome={turma.nome} licao={licao} onBack={() => navigate(voltarPath())} />
        <p className="text-sm text-muted-foreground">
          {semPermissao
            ? "Acesso negado. Selecione a igreja em que você leciona (ex.: AD Dirceu) no menu do topo e tente de novo."
            : "Não foi possível carregar o registro desta turma."}
        </p>
        <Button variant="outline" onClick={() => navigate(voltarPath())}>
          Voltar
        </Button>
      </div>
    );
  }

  if (isProfessor && !ensinaEstaTurma) {
    const destino = licoesRegistroTurmaProfessorPath(
      ano,
      trimestre,
      numeroLicao,
      turmasProfessor,
    );
    return <Navigate to={destino ?? voltarPath()} replace />;
  }

  if (!loadingSheet && !sheet && !podeEditarFrequencia) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Nenhum registro da EBD para esta turma.</p>
        <Button variant="outline" onClick={() => navigate(voltarPath())}>
          Voltar à lição
        </Button>
      </div>
    );
  }

  if (!loadingSheet && !sheet && podeEditarFrequencia && !podeEditarChamada) {
    return (
      <div className="space-y-4">
        <HeaderTurma
          turmaNome={turma.nome}
          licao={licao}
          onBack={() => navigate(voltarPath())}
        />
        {mensagemBloqueio && (
          <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
            {mensagemBloqueio}
          </p>
        )}
        <Button variant="outline" onClick={() => navigate(voltarPath())}>
          Voltar à lição
        </Button>
      </div>
    );
  }

  if (!loadingSheet && !sheet && podeEditarChamada) {
    return (
      <div className="space-y-6 animate-fade-in">
        <HeaderTurma
          turmaNome={turma.nome}
          licao={licao}
          onBack={() => navigate(voltarPath())}
        />
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Ainda não há registro para {turma.nome} nesta lição. Inclua presenças, bíblias,
              revistas, visitantes e oferta.
            </p>
            <Button
              onClick={() => iniciarChamadaMutation.mutate()}
              disabled={iniciarChamadaMutation.isPending}
            >
              {iniciarChamadaMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Iniciar registro da EBD
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingSheet || (!sheet && !sheetFetched)) {
    return <ClasseDetalheSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <HeaderTurma
        turmaNome={turma.nome}
        licao={licao}
        status={statusChamada}
        onBack={() => navigate(voltarPath())}
      />

      {mensagemBloqueio && (
        <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
          {mensagemBloqueio}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 sm:gap-4">
        <StatCard icon={Users} label="Presentes" value={presentes} />
        <StatCard icon={UserPlus} label="Ausentes" value={ausentes} />
        <StatCard icon={UserPlus} label="Visitantes" value={visitantes} />
        <StatCard icon={BookOpen} label="Bíblias" value={biblias} />
        <StatCard icon={BookMarked} label="Revistas" value={revistas} />
        <StatCard
          icon={DollarSign}
          label="Oferta"
          value={formatCurrency(Number(ofertaValor.replace(",", ".")) || 0)}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Totais da EBD (bíblias, revistas, ofertas)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Visitantes">
            <Input
              type="number"
              min={0}
              value={visitantes}
              disabled={somenteLeitura}
              onChange={(e) => setVisitantes(Number(e.target.value || 0))}
            />
          </Field>
          <Field label="Bíblias">
            <Input
              type="number"
              min={0}
              value={biblias}
              disabled={somenteLeitura}
              onChange={(e) => setBiblias(Number(e.target.value || 0))}
            />
          </Field>
          <Field label="Revistas">
            <Input
              type="number"
              min={0}
              value={revistas}
              disabled={somenteLeitura}
              onChange={(e) => setRevistas(Number(e.target.value || 0))}
            />
          </Field>
          <Field label="Oferta (R$)">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={ofertaValor}
              disabled={somenteLeitura}
              onChange={(e) => setOfertaValor(e.target.value)}
            />
          </Field>
          <Field label="Professor responsável" className="sm:col-span-2">
            <Select
              value={professorId || "none"}
              disabled={somenteLeitura || turma.professorUsers.length === 0}
              onValueChange={(v) => setProfessorId(v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o professor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não informado</SelectItem>
                {turma.professorUsers.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Lista de chamada ({pct}%)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {alunosDaTurma.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum aluno nesta turma.</p>
          ) : (
            alunosDaTurma.map((aluno) => (
              <div
                key={aluno.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold">
                      {getIniciais(aluno.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{aluno.nome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {presencas[aluno.id] ? "Presente" : "Ausente"}
                  </span>
                  <Switch
                    checked={Boolean(presencas[aluno.id])}
                    disabled={somenteLeitura}
                    onCheckedChange={(checked) =>
                      setPresencas((prev) => ({ ...prev, [aluno.id]: checked }))
                    }
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {!somenteLeitura && (
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </div>
      )}
    </div>
  );
}

function HeaderTurma({
  turmaNome,
  licao,
  status,
  onBack,
}: {
  turmaNome: string;
  licao: { numero: number };
  status?: ReturnType<typeof getChamadaTurmaStatus>;
  onBack: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="icon" className="touch-target" onClick={onBack}>
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div>
        <h1 className="text-2xl font-bold">{turmaNome}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Lição {licao.numero}</Badge>
          {status && (
            <Badge variant={status === "registrada" ? "default" : "outline"}>
              {chamadaStatusLabel[status]}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-2 p-4">
        <Icon className="h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="truncate text-lg font-bold sm:text-xl">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
