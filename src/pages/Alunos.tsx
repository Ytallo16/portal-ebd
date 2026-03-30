import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { alunos, turmas, getIniciais, getTurmaNome } from "@/data/mock";
import { Search, Users, GraduationCap } from "lucide-react";

export default function Alunos() {
  const [search, setSearch] = useState("");
  const [selectedAluno, setSelectedAluno] = useState<typeof alunos[0] | null>(null);

  const filtered = alunos.filter(
    (a) =>
      a.nome.toLowerCase().includes(search.toLowerCase()) ||
      getTurmaNome(a.turmaId).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Alunos</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou turma..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 touch-target"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((a) => (
          <Card
            key={a.id}
            className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
            onClick={() => setSelectedAluno(a)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {getIniciais(a.nome)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{a.nome}</p>
                <Badge variant="secondary" className="text-xs mt-1">{getTurmaNome(a.turmaId)}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={!!selectedAluno} onOpenChange={() => setSelectedAluno(null)}>
        {selectedAluno && (
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{selectedAluno.nome}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Sexo</span><p>{selectedAluno.sexo === "M" ? "Masculino" : "Feminino"}</p></div>
                <div><span className="text-muted-foreground">Nascimento</span><p>{new Date(selectedAluno.dataNascimento + "T12:00:00").toLocaleDateString("pt-BR")}</p></div>
                <div><span className="text-muted-foreground">Email</span><p>{selectedAluno.email || "—"}</p></div>
                <div><span className="text-muted-foreground">Telefone</span><p>{selectedAluno.telefone}</p></div>
                <div><span className="text-muted-foreground">Turma</span><p>{getTurmaNome(selectedAluno.turmaId)}</p></div>
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

              <div className="flex gap-2 pt-2">
                <Button className="flex-1 touch-target">Editar</Button>
                <Button variant="destructive" className="touch-target">Excluir</Button>
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}
