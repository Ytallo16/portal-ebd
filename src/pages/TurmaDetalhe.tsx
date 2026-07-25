import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, GraduationCap, Pencil, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

import { TurmaDetalheSkeleton } from "@/components/skeletons";
import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { AlunoTurmaCard } from "@/components/lists/AlunoTurmaCard";
import { TurmaFormDialog } from "@/components/turmas/TurmaFormDialog";
import { MobileTableWrap } from "@/components/ui/mobile-table-wrap";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api";
import { isSomenteProfessor } from "@/lib/chamada";
import { fetchAlunos, fetchTurmas, teachersApi, type TurmaProfessor } from "@/lib/portalApi";
import { formatDate } from "@/lib/formatters";

export default function TurmaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeOrgId, podeCarregarOperacional, turmasProfessor, can, isAdminSistema, hasRole } =
    usePermissions();
  const somenteProfessor = isSomenteProfessor({ isAdminSistema, hasRole });
  const podeEditarTurma = can("turmas", "editar") && !somenteProfessor;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isVincularOpen, setIsVincularOpen] = useState(false);
  const [professorSelecionado, setProfessorSelecionado] = useState("");
  const [professorParaRemover, setProfessorParaRemover] = useState<TurmaProfessor | null>(null);

  const { data: turmas = [], isLoading: loadingTurmas } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "turmas"),
    queryFn: fetchTurmas,
    enabled: podeCarregarOperacional,
  });
  const { data: alunos = [], isLoading: loadingAlunos } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "alunos"),
    queryFn: () => fetchAlunos(),
    enabled: podeCarregarOperacional,
  });
  const { data: professoresIgreja = [] } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "professores-igreja"),
    queryFn: teachersApi.fetchProfessoresIgreja,
    enabled: podeCarregarOperacional && podeEditarTurma,
  });

  const turmaFromLista = turmas.find((t) => t.id === id);
  const turmaFromProfessor = turmasProfessor.find((t) => String(t.id) === id);
  const turma =
    turmaFromLista ??
    (turmaFromProfessor
      ? {
          id: String(turmaFromProfessor.id),
          nome: turmaFromProfessor.nome,
          faixaEtaria: "",
          professores: [],
          professorUsers: [],
          totalAlunos: alunos.filter((a) => a.turmaId === id).length,
          cor: "#3B82F6",
          ativa: true,
        }
      : undefined);
  const alunosDaTurma = useMemo(
    () => alunos.filter((a) => a.turmaId === id).sort((a, b) => a.nome.localeCompare(b.nome)),
    [alunos, id],
  );

  const professoresDisponiveis = useMemo(() => {
    const jaVinculadosNestaTurma = new Set(
      turmaFromLista?.professorUsers.map((professor) => String(professor.id)) ?? [],
    );
    return professoresIgreja.filter(
      (professor) => !jaVinculadosNestaTurma.has(professor.id),
    );
  }, [professoresIgreja, turmaFromLista]);

  function invalidarTurmas() {
    void queryClient.invalidateQueries({ queryKey: ["turmas"] });
  }

  function reportarErro(error: unknown, fallback: string) {
    toast.error(error instanceof ApiError && error.message ? error.message : fallback);
  }

  const vincularMutation = useMutation({
    mutationFn: () => teachersApi.addProfessorTurma(String(id), professorSelecionado),
    onSuccess: () => {
      invalidarTurmas();
      setIsVincularOpen(false);
      setProfessorSelecionado("");
      toast.success("Professor vinculado à turma.");
    },
    onError: (error) => reportarErro(error, "Não foi possível vincular o professor."),
  });

  const desvincularMutation = useMutation({
    mutationFn: (linkId: string) => teachersApi.removeProfessorTurma(linkId),
    onSuccess: () => {
      invalidarTurmas();
      setProfessorParaRemover(null);
      toast.success("Professor removido da turma.");
    },
    onError: (error) => reportarErro(error, "Não foi possível remover o professor."),
  });

  if (loadingTurmas || loadingAlunos) {
    return <TurmaDetalheSkeleton />;
  }

  if (!turma) {
    return (
      <p className="text-sm text-muted-foreground">
        Turma não encontrada ou você não tem acesso a ela.
      </p>
    );
  }

  const totalMasculino = alunosDaTurma.filter((a) => a.sexo === "M").length;
  const totalFeminino = alunosDaTurma.filter((a) => a.sexo === "F").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button variant="ghost" size="icon" className="touch-target" onClick={() => navigate("/turmas")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold break-words">{turma.nome}</h1>
          <p className="text-sm text-muted-foreground">{turma.faixaEtaria}</p>
        </div>
        {podeEditarTurma && turmaFromLista ? (
          <Button
            variant="outline"
            className="touch-target w-full sm:w-auto"
            onClick={() => setIsEditOpen(true)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar turma
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold">{alunosDaTurma.length}</p>
              <p className="text-xs text-muted-foreground">Alunos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <GraduationCap className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold">{turma.professorUsers.length}</p>
              <p className="text-xs text-muted-foreground">Professores</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Composição</p>
            <p className="mt-1 text-sm font-medium">
              {totalMasculino} masculino(s) · {totalFeminino} feminino(s)
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-2">
          <CardTitle className="text-base">Professores da turma</CardTitle>
          {podeEditarTurma ? (
            <Button
              size="sm"
              variant="outline"
              className="touch-target shrink-0"
              onClick={() => {
                setProfessorSelecionado("");
                setIsVincularOpen(true);
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar professor
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {turma.professorUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum professor vinculado.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {turma.professorUsers.map((professor) => (
                <li key={professor.linkId} className="flex items-center gap-3 px-3 py-2.5">
                  <button
                    type="button"
                    className="flex-1 text-left text-sm font-medium text-primary hover:underline"
                    onClick={() =>
                      navigate(`/professores?search=${encodeURIComponent(professor.nome)}`)
                    }
                  >
                    {professor.nome}
                  </button>
                  {podeEditarTurma ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="touch-target h-9 w-9 shrink-0 text-destructive"
                      onClick={() => setProfessorParaRemover(professor)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remover {professor.nome} da turma</span>
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Informações da Turma</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Nome:</span> {turma.nome}
          </p>
          <p>
            <span className="text-muted-foreground">Faixa etária:</span> {turma.faixaEtaria}
          </p>
          <p>
            <span className="text-muted-foreground">Situação:</span>{" "}
            {turma.ativa ? "Ativa" : "Inativa"}
          </p>
          <Button className="mt-2 w-full touch-target sm:w-auto" onClick={() => navigate(`/turmas/${turma.id}/licoes`)}>
            Ver Lições e Frequência
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Alunos da Turma</CardTitle>
        </CardHeader>
        <CardContent>
          {alunosDaTurma.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum aluno cadastrado nesta turma.</p>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {alunosDaTurma.map((aluno) => (
                  <AlunoTurmaCard key={aluno.id} aluno={aluno} />
                ))}
              </div>
              <div className="hidden md:block">
                <MobileTableWrap minWidthClass="min-w-[36rem]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Sexo</TableHead>
                        <TableHead>Nascimento</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>E-mail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alunosDaTurma.map((aluno) => (
                        <TableRow key={aluno.id}>
                          <TableCell className="font-medium">{aluno.nome}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {aluno.sexo === "M" ? "Masculino" : "Feminino"}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(aluno.dataNascimento)}</TableCell>
                          <TableCell>{aluno.telefone || "Sem telefone"}</TableCell>
                          <TableCell>{aluno.email || "Sem e-mail"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </MobileTableWrap>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {turmaFromLista ? (
        <TurmaFormDialog open={isEditOpen} onOpenChange={setIsEditOpen} turma={turmaFromLista} />
      ) : null}

      <Dialog
        open={isVincularOpen}
        onOpenChange={(open) => {
          setIsVincularOpen(open);
          if (!open) setProfessorSelecionado("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar professor</DialogTitle>
            <DialogDescription>
              Escolha um professor desta igreja para lecionar em {turma.nome}. Um professor
              pode participar de mais de uma turma.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {professoresDisponiveis.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum professor disponível. Cadastre um usuário com o perfil Professor em
                Usuários ou verifique se todos já estão vinculados a esta turma.
              </p>
            ) : (
              <Select value={professorSelecionado} onValueChange={setProfessorSelecionado}>
                <SelectTrigger className="touch-target">
                  <SelectValue placeholder="Selecione o professor" />
                </SelectTrigger>
                <SelectContent>
                  {professoresDisponiveis.map((professor) => (
                    <SelectItem key={professor.id} value={professor.id}>
                      {professor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsVincularOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => vincularMutation.mutate()}
                disabled={!professorSelecionado || vincularMutation.isPending}
              >
                {vincularMutation.isPending ? "Vinculando..." : "Vincular"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(professorParaRemover)}
        onOpenChange={(open) => {
          if (!open) setProfessorParaRemover(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover professor</AlertDialogTitle>
            <AlertDialogDescription>
              Confirma remover {professorParaRemover?.nome ?? "este professor"} da turma{" "}
              {turma.nome}? O usuário continua cadastrado e pode ser vinculado a outra turma.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={desvincularMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                professorParaRemover && desvincularMutation.mutate(professorParaRemover.linkId)
              }
              disabled={desvincularMutation.isPending}
            >
              {desvincularMutation.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
