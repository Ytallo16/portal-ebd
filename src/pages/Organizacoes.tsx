import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Search, Building2, Landmark, Building, CheckCircle2, XCircle } from "lucide-react";

interface Organizacao {
  id: string;
  nome: string;
  sigla: string;
  tipo: "Sede" | "Filial" | "Congregação";
  cidade: string;
  uf: string;
  responsavel: string;
  membros: number;
  status: "Ativa" | "Inativa";
}

const organizacoesIniciais: Organizacao[] = [
  {
    id: "org-1",
    nome: "AD Dirceu",
    sigla: "ADD",
    tipo: "Sede",
    cidade: "Teresina",
    uf: "PI",
    responsavel: "Pr. Daniel Nascimento",
    membros: 1240,
    status: "Ativa",
  },
  {
    id: "org-2",
    nome: "AD Grande Dirceu II",
    sigla: "ADD-II",
    tipo: "Filial",
    cidade: "Teresina",
    uf: "PI",
    responsavel: "Pr. Marcos Santos",
    membros: 510,
    status: "Ativa",
  },
  {
    id: "org-3",
    nome: "Congregação Vila Nova",
    sigla: "CVN",
    tipo: "Congregação",
    cidade: "Teresina",
    uf: "PI",
    responsavel: "Dc. José Ferreira",
    membros: 220,
    status: "Ativa",
  },
  {
    id: "org-4",
    nome: "Congregação Cristo Vive",
    sigla: "CCV",
    tipo: "Congregação",
    cidade: "Timon",
    uf: "MA",
    responsavel: "Pb. Samuel Barbosa",
    membros: 135,
    status: "Inativa",
  },
];

export default function Organizacoes() {
  const [search, setSearch] = useState("");
  const [organizacoes, setOrganizacoes] = useState<Organizacao[]>(organizacoesIniciais);

  const organizacoesFiltradas = organizacoes.filter((organizacao) => {
    const termo = search.toLowerCase();
    return organizacao.nome.toLowerCase().includes(termo)
      || organizacao.sigla.toLowerCase().includes(termo)
      || organizacao.cidade.toLowerCase().includes(termo)
      || organizacao.responsavel.toLowerCase().includes(termo);
  });

  const { total, ativas, inativas, filiais } = useMemo(() => {
    return {
      total: organizacoes.length,
      ativas: organizacoes.filter((item) => item.status === "Ativa").length,
      inativas: organizacoes.filter((item) => item.status === "Inativa").length,
      filiais: organizacoes.filter((item) => item.tipo !== "Sede").length,
    };
  }, [organizacoes]);

  function alternarStatus(id: string, checked: boolean) {
    setOrganizacoes((estadoAtual) =>
      estadoAtual.map((organizacao) => {
        if (organizacao.id !== id) return organizacao;
        return { ...organizacao, status: checked ? "Ativa" : "Inativa" };
      }),
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Organizações</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie matriz, filiais e congregações vinculadas ao portal.
          </p>
        </div>
        <Button className="touch-target w-full sm:w-auto">Nova organização</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-10 touch-target"
          placeholder="Buscar por nome, cidade, sigla ou responsável..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">Total de organizações</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div>
              <p className="text-xl font-bold">{ativas}</p>
              <p className="text-xs text-muted-foreground">Ativas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <XCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-xl font-bold">{inativas}</p>
              <p className="text-xs text-muted-foreground">Inativas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Building className="h-5 w-5 text-secondary" />
            <div>
              <p className="text-xl font-bold">{filiais}</p>
              <p className="text-xs text-muted-foreground">Filiais e congregações</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {organizacoesFiltradas.map((organizacao) => (
          <Card key={organizacao.id}>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent text-accent-foreground flex items-center justify-center">
                    {organizacao.tipo === "Sede" ? <Landmark className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-semibold">{organizacao.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {organizacao.sigla} • {organizacao.cidade}/{organizacao.uf}
                    </p>
                  </div>
                </div>
                <Badge variant={organizacao.status === "Ativa" ? "default" : "secondary"}>
                  {organizacao.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p className="font-medium">{organizacao.tipo}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Membros</p>
                  <p className="font-medium">{organizacao.membros}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Responsável</p>
                  <p className="font-medium">{organizacao.responsavel}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 p-2">
                <span className="text-xs text-muted-foreground">Portal habilitado para a organização</span>
                <Switch
                  checked={organizacao.status === "Ativa"}
                  onCheckedChange={(checked) => alternarStatus(organizacao.id, checked)}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="touch-target flex-1">Editar</Button>
                <Button variant="ghost" size="sm" className="touch-target flex-1">Gerenciar acesso</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {organizacoesFiltradas.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhuma organização encontrada para os filtros atuais.
        </div>
      )}
    </div>
  );
}
