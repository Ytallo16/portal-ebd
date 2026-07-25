import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArchiveRestore, FileUp, Plus, Search, UserRound, Users } from "lucide-react";
import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import { isSomenteProfessor } from "@/lib/chamada";
import {
  createAluno,
  fetchAlunosPage,
  fetchTurmas,
  studentsApi,
} from "@/lib/portalApi";
import { formatarTelefone, getIniciais } from "@/lib/formatters";
import { AlunosPageSkeleton } from "@/components/skeletons";
import { AlunoDetalheModal } from "@/pages/AlunoDetalheModal";
import { ImportarAlunosDialog } from "@/components/alunos/ImportarAlunosDialog";

export default function Alunos() {
  const queryClient = useQueryClient();
  const {
    activeOrgId,
    podeCarregarOperacional,
    can,
    isAdminSistema,
    hasRole,
    turmasProfessor,
  } = usePermissions();
  const somenteProfessor = isSomenteProfessor({ isAdminSistema, hasRole });
  const podeCriarMatriculado = can("alunos", "criar");
  const podeExcluirMatriculado = can("alunos", "excluir");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [selectedAlunoId, setSelectedAlunoId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    sexo: "M" as "M" | "F",
    dataNascimento: "",
    email: "",
    telefone: "",
    turmaId: "",
  });

  const { data: turmas = [] } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "turmas"),
    queryFn: fetchTurmas,
    enabled: podeCarregarOperacional,
  });
  const { data: paginaAlunos, isLoading } = useQuery({
    queryKey: orgQueryKey(
      activeOrgId,
      "alunos",
      "pagina",
      mostrarInativos,
      deferredSearch,
      page,
    ),
    queryFn: () =>
      fetchAlunosPage({
        search: deferredSearch,
        page,
        pageSize: 24,
        inativos: mostrarInativos,
      }),
    enabled: podeCarregarOperacional,
  });
  const alunos = useMemo(() => paginaAlunos?.items ?? [], [paginaAlunos]);
  const createMutation = useMutation({
    mutationFn: createAluno,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alunos"] });
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
    },
  });

  const turmaNameById = useMemo(() => {
    const map = new Map<string, string>();
    turmas.forEach((t) => map.set(t.id, t.nome));
    turmasProfessor.forEach((t) => map.set(String(t.id), t.nome));
    return map;
  }, [turmas, turmasProfessor]);

  const turmaFaixaEtariaById = useMemo(() => {
    const map = new Map<string, string>();
    turmas.forEach((t) => map.set(t.id, t.faixaEtaria));
    return map;
  }, [turmas]);

  const idsTurmasProfessor = useMemo(
    () => new Set(turmasProfessor.map((t) => String(t.id))),
    [turmasProfessor],
  );

  const matriculadosVisiveis = useMemo(() => {
    const todos = studentsApi.buildMatriculadosAlunos(alunos, turmas);
    if (!somenteProfessor) return todos;
    return todos.filter((item) => idsTurmasProfessor.has(item.turmaId));
  }, [alunos, turmas, somenteProfessor, idsTurmasProfessor]);

  const totalAlunos = paginaAlunos?.total ?? 0;

  const turmaIdProfessorUnico = useMemo(() => {
    if (!somenteProfessor || turmasProfessor.length !== 1) return "";
    return String(turmasProfessor[0].id);
  }, [somenteProfessor, turmasProfessor]);

  const turmaNomeProfessorUnico =
    turmasProfessor.length === 1 ? turmasProfessor[0].nome : "";

  const turmasFormulario = somenteProfessor
    ? turmas.filter((t) => idsTurmasProfessor.has(t.id))
    : turmas;

  function abrirNovoMatriculado() {
    setForm((prev) => ({
      ...prev,
      turmaId: turmaIdProfessorUnico || prev.turmaId,
    }));
    setIsCreateOpen(true);
  }

  const selectedAluno =
    alunos.find((a) => a.id === selectedAlunoId) ?? null;

  if (!podeCarregarOperacional) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">Alunos</h1>
        <p className="text-sm text-muted-foreground">
          Selecione uma igreja no contexto para visualizar e gerenciar alunos.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <AlunosPageSkeleton />;
  }

  async function onCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    const turmaId = turmaIdProfessorUnico || form.turmaId;
    if (!turmaId) return;

    await createMutation.mutateAsync({ ...form, turmaId });
    setIsCreateOpen(false);
    setForm({ nome: "", sexo: "M", dataNascimento: "", email: "", telefone: "", turmaId: "" });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {mostrarInativos ? "Alunos inativos" : "Alunos"}
          </h1>
          {mostrarInativos && (
            <p className="text-sm text-muted-foreground">
              Cadastros preservados que podem ser restaurados.
            </p>
          )}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {podeExcluirMatriculado && (
            <Button
              className="w-full sm:w-auto"
              variant="outline"
              onClick={() => {
                setMostrarInativos((current) => !current);
                setPage(1);
                setSelectedAlunoId(null);
              }}
            >
              <ArchiveRestore className="mr-2 h-4 w-4" />
              {mostrarInativos ? "Ver ativos" : "Ver inativos"}
            </Button>
          )}
          {podeCriarMatriculado && !mostrarInativos && (
            <>
            <Button className="w-full sm:w-auto" variant="outline" onClick={() => setIsImportOpen(true)}>
              <FileUp className="mr-2 h-4 w-4" />
              Importar alunos
            </Button>
            <Button className="w-full sm:w-auto" onClick={abrirNovoMatriculado}>
              <Plus className="mr-2 h-4 w-4" />
              Novo aluno
            </Button>
            </>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={
            somenteProfessor
              ? "Buscar aluno..."
              : "Buscar por nome ou turma..."
          }
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-10 touch-target"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold">{totalAlunos}</p>
              <p className="text-xs text-muted-foreground">
                {mostrarInativos ? "Inativos visíveis" : "Alunos visíveis"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <UserRound className="h-5 w-5 text-secondary" />
            <div>
              <p className="text-xl font-bold">{matriculadosVisiveis.length}</p>
              <p className="text-xs text-muted-foreground">Nesta página</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {matriculadosVisiveis.length === 0 ? (
          <p className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
            Nenhum aluno encontrado.
          </p>
        ) : (
          matriculadosVisiveis.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer transition-all hover:ring-2 hover:ring-primary/50"
              onClick={() => {
                if (item.alunoId) setSelectedAlunoId(item.alunoId);
              }}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                    {getIniciais(item.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{item.nome}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {mostrarInativos && (
                      <Badge variant="secondary" className="text-xs">Inativo</Badge>
                    )}
                    {(!somenteProfessor || turmasProfessor.length > 1) && (
                      <Badge variant="outline" className="text-xs">
                        {item.turmaNome || turmaNameById.get(item.turmaId) || "—"}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {paginaAlunos && paginaAlunos.totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Página {paginaAlunos.page} de {paginaAlunos.totalPages} ·{" "}
            {paginaAlunos.total} aluno(s)
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={page >= paginaAlunos.totalPages}
              onClick={() =>
                setPage((current) => Math.min(paginaAlunos.totalPages, current + 1))
              }
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {selectedAluno && (
        <AlunoDetalheModal
          aluno={selectedAluno}
          open={Boolean(selectedAluno)}
          onOpenChange={(open) => {
            if (!open) setSelectedAlunoId(null);
          }}
          podeEditar={can("alunos", "editar") && selectedAluno.isActive}
          podeExcluir={podeExcluirMatriculado && selectedAluno.isActive}
          podeRestaurar={podeExcluirMatriculado && !selectedAluno.isActive}
          somenteProfessor={somenteProfessor}
          turmasFormulario={turmasFormulario}
          turmaNameById={turmaNameById}
          turmaFaixaEtariaById={turmaFaixaEtariaById}
        />
      )}

      <ImportarAlunosDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        turmas={turmasFormulario}
        podeDesfazer={podeExcluirMatriculado}
        onImported={() => {
          queryClient.invalidateQueries({ queryKey: ["alunos"] });
          queryClient.invalidateQueries({ queryKey: ["turmas"] });
        }}
      />

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo aluno</DialogTitle>
            <DialogDescription>Preencha os dados para matricular o aluno na turma.</DialogDescription>
            {somenteProfessor && turmaNomeProfessorUnico && (
              <p className="text-sm text-muted-foreground">
                O aluno será cadastrado na turma {turmaNomeProfessorUnico}.
              </p>
            )}
          </DialogHeader>
          <form className="space-y-4" onSubmit={onCreateSubmit}>
            <div>
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Sexo</Label>
                <Select value={form.sexo} onValueChange={(value: "M" | "F") => setForm((prev) => ({ ...prev, sexo: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data de nascimento</Label>
                <Input type="date" value={form.dataNascimento} onChange={(e) => setForm((prev) => ({ ...prev, dataNascimento: e.target.value }))} required />
              </div>
            </div>
            {(!somenteProfessor || turmasProfessor.length > 1) && (
              <div>
                <Label>Turma</Label>
                <Select
                  value={form.turmaId}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, turmaId: value }))}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
                  <SelectContent>
                    {turmasFormulario.map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>{turma.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={15}
                  placeholder="(86) 99999-9999"
                  value={form.telefone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, telefone: formatarTelefone(e.target.value) }))
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button
                type="submit"
                disabled={
                  createMutation.isPending ||
                  !(turmaIdProfessorUnico || form.turmaId)
                }
              >
                Criar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
