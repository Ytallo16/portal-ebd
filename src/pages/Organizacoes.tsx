import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Search, Building2, Landmark, Building, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { organizacoesIniciais, type Organizacao } from "@/pages/organizacoesData";

export default function Organizacoes() {
  const navigate = useNavigate();
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {organizacoesFiltradas.map((organizacao) => (
          <Card
            key={organizacao.id}
            className="cursor-pointer transition-all hover:ring-2 hover:ring-primary/40"
            onClick={() => navigate(`/configuracoes/organizacoes/${organizacao.id}`)}
          >
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-accent text-accent-foreground flex items-center justify-center">
                      {organizacao.tipo === "Sede" ? <Landmark className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                    </div>
                  <div className="min-w-0">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p className="font-medium">{organizacao.tipo}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Membros</p>
                  <p className="font-medium">{organizacao.membros}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Responsável</p>
                  <p className="font-medium">{organizacao.responsavel}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 p-2">
                <span className="text-xs text-muted-foreground">Portal habilitado para a organização</span>
                <Switch
                  checked={organizacao.status === "Ativa"}
                  onClick={(e) => e.stopPropagation()}
                  onCheckedChange={(checked) => alternarStatus(organizacao.id, checked)}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" size="sm" className="touch-target flex-1" onClick={(e) => e.stopPropagation()}>
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="touch-target flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/configuracoes/organizacoes/${organizacao.id}`);
                  }}
                >
                  Ver detalhes
                </Button>
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
