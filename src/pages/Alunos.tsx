import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, UserRound, Users } from "lucide-react";
import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import { isSomenteProfessor } from "@/lib/chamada";
import {
  createAluno,
  fetchAlunos,
  fetchTurmas,
  studentsApi,
} from "@/lib/portalApi";
import { formatarTelefone, getIniciais } from "@/lib/formatters";
import { AlunosPageSkeleton } from "@/components/skeletons";
import { AlunoDetalheModal } from "@/pages/AlunoDetalheModal";

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
  const [search, setSearch] = useState("");
  const [selectedAlunoId, setSelectedAlunoId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
  const { data: alunos = [], isLoading } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "alunos"),
    queryFn: () => fetchAlunos(),
    enabled: podeCarregarOperacional,
  });
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

  const filtered = matriculadosVisiveis.filter((item) => {
    const termo = search.toLowerCase();
    return (
      item.nome.toLowerCase().includes(termo) ||
      item.turmaNome.toLowerCase().includes(termo)
    );
  });

  const totalAlunos = matriculadosVisiveis.length;

  const turmaIdProfessor = useMemo(() => {
    if (!somenteProfessor || turmasProfessor.length === 0) return "";
    return String(turmasProfessor[0].id);
  }, [somenteProfessor, turmasProfessor]);

  const turmaNomeProfessor = turmasProfessor[0]?.nome ?? "";

  const turmasFormulario = somenteProfessor
    ? turmas.filter((t) => idsTurmasProfessor.has(t.id))
    : turmas;

  function abrirNovoMatriculado() {
    setForm((prev) => ({
      ...prev,
      turmaId: somenteProfessor ? turmaIdProfessor : prev.turmaId,
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
    const turmaId = somenteProfessor ? turmaIdProfessor : form.turmaId;
    if (!turmaId) return;

    await createMutation.mutateAsync({ ...form, turmaId });
    setIsCreateOpen(false);
    setForm({ nome: "", sexo: "M", dataNascimento: "", email: "", telefone: "", turmaId: "" });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Alunos</h1>
        {podeCriarMatriculado && (
          <Button className="w-full sm:w-auto" onClick={abrirNovoMatriculado}>
            <Plus className="mr-2 h-4 w-4" />
            Novo aluno
          </Button>
        )}
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
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 touch-target"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold">{matriculadosVisiveis.length}</p>
              <p className="text-xs text-muted-foreground">Alunos visíveis</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <UserRound className="h-5 w-5 text-secondary" />
            <div>
              <p className="text-xl font-bold">{totalAlunos}</p>
              <p className="text-xs text-muted-foreground">Alunos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
            Nenhum aluno encontrado.
          </p>
        ) : (
          filtered.map((item) => (
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

      {selectedAluno && (
        <AlunoDetalheModal
          aluno={selectedAluno}
          open={Boolean(selectedAluno)}
          onOpenChange={(open) => {
            if (!open) setSelectedAlunoId(null);
          }}
          podeEditar={can("alunos", "editar")}
          podeExcluir={can("alunos", "excluir")}
          somenteProfessor={somenteProfessor}
          turmasFormulario={turmasFormulario}
          turmaNameById={turmaNameById}
          turmaFaixaEtariaById={turmaFaixaEtariaById}
        />
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo aluno</DialogTitle>
            {somenteProfessor && turmaNomeProfessor && (
              <p className="text-sm text-muted-foreground">
                O aluno será cadastrado na turma {turmaNomeProfessor}.
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
            {!somenteProfessor && (
              <div>
                <Label>Turma</Label>
                <Select
                  value={form.turmaId}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, turmaId: value }))}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
                  <SelectContent>
                    {turmas.map((turma) => (
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
                  (!somenteProfessor && !form.turmaId) ||
                  (somenteProfessor && !turmaIdProfessor)
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
