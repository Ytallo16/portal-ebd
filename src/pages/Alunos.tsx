import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, GraduationCap, Plus } from "lucide-react";
import { createAluno, fetchAlunos, fetchTurmas } from "@/lib/portalApi";
import { getIniciais } from "@/lib/formatters";

export default function Alunos() {
  const queryClient = useQueryClient();
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

  const { data: turmas = [] } = useQuery({ queryKey: ["turmas"], queryFn: fetchTurmas });
  const { data: alunos = [], isLoading } = useQuery({ queryKey: ["alunos"], queryFn: () => fetchAlunos() });
  const createMutation = useMutation({
    mutationFn: createAluno,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alunos"] }),
  });

  const turmaNameById = useMemo(() => {
    const map = new Map<string, string>();
    turmas.forEach((t) => map.set(t.id, t.nome));
    return map;
  }, [turmas]);

  const filtered = alunos.filter(
    (a) =>
      a.nome.toLowerCase().includes(search.toLowerCase()) ||
      (turmaNameById.get(a.turmaId) ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const selectedAluno = filtered.find((a) => a.id === selectedAlunoId) ?? alunos.find((a) => a.id === selectedAlunoId) ?? null;

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando alunos...</p>;
  }

  async function onCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createMutation.mutateAsync(form);
    setIsCreateOpen(false);
    setForm({ nome: "", sexo: "M", dataNascimento: "", email: "", telefone: "", turmaId: "" });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Alunos</h1>
        <Button className="w-full sm:w-auto" onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Aluno
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou turma..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 touch-target"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold">{alunos.length}</p>
              <p className="text-xs text-muted-foreground">Total de Alunos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <GraduationCap className="h-5 w-5 text-secondary" />
            <div>
              <p className="text-xl font-bold">{turmas.length}</p>
              <p className="text-xs text-muted-foreground">Total de Turmas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((a) => (
          <Card
            key={a.id}
            className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
            onClick={() => setSelectedAlunoId(a.id)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {getIniciais(a.nome)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{a.nome}</p>
                <Badge variant="secondary" className="text-xs mt-1">{turmaNameById.get(a.turmaId) ?? "—"}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={Boolean(selectedAluno)} onOpenChange={() => setSelectedAlunoId(null)}>
        {selectedAluno && (
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{selectedAluno.nome}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Sexo</span><p>{selectedAluno.sexo === "M" ? "Masculino" : "Feminino"}</p></div>
                <div><span className="text-muted-foreground">Nascimento</span><p>{new Date(selectedAluno.dataNascimento + "T12:00:00").toLocaleDateString("pt-BR")}</p></div>
                <div><span className="text-muted-foreground">Email</span><p>{selectedAluno.email || "—"}</p></div>
                <div><span className="text-muted-foreground">Telefone</span><p>{selectedAluno.telefone || "—"}</p></div>
                <div><span className="text-muted-foreground">Turma</span><p>{turmaNameById.get(selectedAluno.turmaId) ?? "—"}</p></div>
              </div>

              <div>
                <p className="text-muted-foreground mb-1">Endereço</p>
                <p>{selectedAluno.endereco.rua}, {selectedAluno.endereco.numero} {selectedAluno.endereco.complemento}</p>
                <p>{selectedAluno.endereco.bairro} — {selectedAluno.endereco.cidade}/{selectedAluno.endereco.uf}</p>
                <p>CEP: {selectedAluno.endereco.cep}</p>
              </div>

              {selectedAluno.responsaveis && selectedAluno.responsaveis.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1">Responsáveis</p>
                  {selectedAluno.responsaveis.map((r, i) => (
                    <div key={i} className="flex justify-between py-1">
                      <span>{r.nome}</span>
                      <span className="text-muted-foreground">{r.telefone}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <Button className="flex-1 touch-target">Editar</Button>
                <Button variant="destructive" className="touch-target">Excluir</Button>
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Aluno</DialogTitle>
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
            <div>
              <Label>Turma</Label>
              <Select value={form.turmaId} onValueChange={(value) => setForm((prev) => ({ ...prev, turmaId: value }))}>
                <SelectTrigger><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
                <SelectContent>
                  {turmas.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>{turma.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={(e) => setForm((prev) => ({ ...prev, telefone: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || !form.turmaId}>Criar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
