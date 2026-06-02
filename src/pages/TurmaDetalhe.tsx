import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, GraduationCap, Users } from "lucide-react";

import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MobileTableWrap } from "@/components/ui/mobile-table-wrap";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchAlunos, fetchTurmas } from "@/lib/portalApi";
import { formatDate } from "@/lib/formatters";

export default function TurmaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeOrgId, podeCarregarOperacional, turmasProfessor } = usePermissions();

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
                <li key={professor.linkId} className="flex items-center gap-3 px-3 py-2.5">
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:underline"
                    onClick={() =>
                      navigate(`/professores?search=${encodeURIComponent(professor.nome)}`)
                    }
                  >
                    {professor.nome}
                  </button>
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
                      <Badge variant="secondary">{aluno.sexo === "M" ? "Masculino" : "Feminino"}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(aluno.dataNascimento)}</TableCell>
                    <TableCell>{aluno.telefone || "Sem telefone"}</TableCell>
                    <TableCell>{aluno.email || "Sem e-mail"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </MobileTableWrap>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
