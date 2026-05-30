import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, GraduationCap, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import { ApiError } from "@/lib/api";
import { isSomenteProfessor } from "@/lib/chamada";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  addProfessorTurma,
  fetchAlunos,
  fetchProfessoresIgreja,
  fetchTurmas,
  removeProfessorTurma,
} from "@/lib/portalApi";
import { formatDate } from "@/lib/formatters";

export default function TurmaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeOrgId, podeCarregarOperacional, can, isAdminSistema, hasRole, turmasProfessor } =
    usePermissions();
  const somenteProfessor = isSomenteProfessor({ isAdminSistema, hasRole });
  const podeEditarProfessores = !somenteProfessor && (isAdminSistema || can("turmas", "editar"));
  const podeVerProfessoresDisponiveis = isAdminSistema || can("usuarios", "visualizar");

  const [professorSelecionado, setProfessorSelecionado] = useState("");
  const [removerTarget, setRemoverTarget] = useState<{ linkId: string; nome: string } | null>(null);

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
    queryFn: fetchProfessoresIgreja,
    enabled: podeCarregarOperacional && podeEditarProfessores && podeVerProfessoresDisponiveis,
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
        }
      : undefined);
  const alunosDaTurma = useMemo(
    () => alunos.filter((a) => a.turmaId === id).sort((a, b) => a.nome.localeCompare(b.nome)),
    [alunos, id],
  );

  const professoresDisponiveis = useMemo(() => {
    if (!turma) return [];
    const professoresEmOutrasTurmas = new Set<number>();
    turmas.forEach((t) => {
      if (t.id === turma.id) return;
      t.professorUsers.forEach((p) => professoresEmOutrasTurmas.add(p.id));
    });
    const vinculadosEstaTurma = new Set(turma.professorUsers.map((p) => p.id));
    return professoresIgreja.filter(
      (p) =>
        !vinculadosEstaTurma.has(Number(p.id)) && !professoresEmOutrasTurmas.has(Number(p.id)),
    );
  }, [professoresIgreja, turma, turmas]);

  const invalidateTurmas = () => {
    queryClient.invalidateQueries({ queryKey: ["turmas"] });
  };

  const addMutation = useMutation({
    mutationFn: () => addProfessorTurma(id!, professorSelecionado),
    onSuccess: () => {
      invalidateTurmas();
      setProfessorSelecionado("");
      toast.success("Professor adicionado à turma. Ele verá a turma após atualizar a página ou entrar novamente.");
    },
    onError: (error) => {
      const msg =
        error instanceof ApiError && error.message
          ? error.message
          : "Não foi possível adicionar o professor.";
      toast.error(msg);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (linkId: string) => removeProfessorTurma(linkId),
    onSuccess: () => {
      invalidateTurmas();
      setRemoverTarget(null);
      toast.success("Professor removido da turma.");
    },
    onError: () => toast.error("Não foi possível remover o professor."),
  });

  if (loadingTurmas || loadingAlunos) {
    return <p className="text-sm text-muted-foreground">Carregando dados da turma...</p>;
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
        <div>
          <h1 className="text-2xl font-bold break-words">{turma.nome}</h1>
          <p className="text-sm text-muted-foreground">{turma.faixaEtaria}</p>
        </div>
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
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Professores da turma</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {turma.professorUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum professor vinculado.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {turma.professorUsers.map((professor) => (
                <li key={professor.linkId} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="text-sm font-medium">{professor.nome}</span>
                  {podeEditarProfessores ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() =>
                        setRemoverTarget({ linkId: professor.linkId, nome: professor.nome })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remover {professor.nome}</span>
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          {podeEditarProfessores ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              {podeVerProfessoresDisponiveis ? (
                <>
                  <div className="flex-1">
                    <Select value={professorSelecionado} onValueChange={setProfessorSelecionado}>
                      <SelectTrigger className="touch-target">
                        <SelectValue placeholder="Selecione um professor" />
                      </SelectTrigger>
                      <SelectContent>
                        {professoresDisponiveis.length === 0 ? (
                          <SelectItem value="__empty" disabled>
                            Nenhum professor disponível
                          </SelectItem>
                        ) : (
                          professoresDisponiveis.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nome}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    className="touch-target"
                    disabled={!professorSelecionado || addMutation.isPending}
                    onClick={() => addMutation.mutate()}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sem permissão para listar professores da igreja.
                </p>
              )}
            </div>
          ) : null}
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
                      <Badge variant="secondary">{aluno.sexo === "M" ? "Masculino" : "Feminino"}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(aluno.dataNascimento)}</TableCell>
                    <TableCell>{aluno.telefone || "Sem telefone"}</TableCell>
                    <TableCell>{aluno.email || "Sem e-mail"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(removerTarget)} onOpenChange={(open) => !open && setRemoverTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover professor</AlertDialogTitle>
            <AlertDialogDescription>
              Confirma remover {removerTarget?.nome ?? "este professor"} desta turma?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={removeMutation.isPending}
              onClick={() => removerTarget && removeMutation.mutate(removerTarget.linkId)}
            >
              {removeMutation.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
