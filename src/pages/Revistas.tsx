import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { turmas, controleRevistas } from "@/data/mock";
import { Search, BookMarked, CheckCircle, Clock, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Revistas() {
  const [selectedTurma, setSelectedTurma] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  if (!selectedTurma) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Revistas</h1>
        <p className="text-sm text-muted-foreground">Selecione uma turma para gerenciar as revistas</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {turmas.map((t) => (
            <Card
              key={t.id}
              className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
              onClick={() => setSelectedTurma(t.id)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm" style={{ backgroundColor: t.cor }}>
                  {t.nome.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{t.nome}</p>
                  <p className="text-xs text-muted-foreground">{t.totalAlunos} alunos</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const turma = turmas.find((t) => t.id === selectedTurma)!;
  const revistas = controleRevistas.filter((r) => r.turmaId === selectedTurma);
  const professores = revistas.filter((r) => r.tipo === "professor");
  const alunosRev = revistas.filter((r) => r.tipo === "aluno");

  const filterList = (list: typeof revistas) =>
    list.filter((r) => r.nome.toLowerCase().includes(search.toLowerCase()));

  const total = revistas.length;
  const entregues = revistas.filter((r) => r.recebeu).length;
  const pagas = revistas.filter((r) => r.pagou).length;
  const pendentes = revistas.filter((r) => r.recebeu && !r.pagou).length;

  const getStatus = (r: typeof revistas[0]) => {
    if (!r.recebeu) return { label: "Não recebeu", icon: XCircle, variant: "destructive" as const };
    if (r.pagou) return { label: "Regular", icon: CheckCircle, variant: "default" as const };
    return { label: "Pendente", icon: Clock, variant: "secondary" as const };
  };

  const renderTable = (list: typeof revistas) => (
    <div className="space-y-2">
      {filterList(list).map((r) => {
        const status = getStatus(r);
        return (
          <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{r.nome}</p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Recebeu</span>
                <Switch checked={r.recebeu} />
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Pagou</span>
                <Switch checked={r.pagou} />
              </div>
              <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="touch-target" onClick={() => setSelectedTurma(null)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Revistas — {turma.nome}</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 touch-target" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: total, icon: BookMarked },
          { label: "Entregues", value: entregues, icon: CheckCircle },
          { label: "Pagas", value: pagas, icon: CheckCircle },
          { label: "Pendentes", value: pendentes, icon: Clock },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <k.icon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xl font-bold">{k.value}</p>
                <p className="text-xs text-muted-foreground">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="professores">
        <TabsList className="touch-target">
          <TabsTrigger value="professores" className="touch-target">Professores</TabsTrigger>
          <TabsTrigger value="alunos" className="touch-target">Alunos</TabsTrigger>
        </TabsList>
        <TabsContent value="professores" className="mt-4">{renderTable(professores)}</TabsContent>
        <TabsContent value="alunos" className="mt-4">{renderTable(alunosRev)}</TabsContent>
      </Tabs>
    </div>
  );
}
