import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, Landmark, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { organizacoesIniciais } from "@/pages/organizacoesData";

export default function OrganizacaoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();

  const organizacao = useMemo(
    () => organizacoesIniciais.find((item) => item.id === id),
    [id],
  );

  const igrejasVinculadas = useMemo(() => {
    if (!organizacao) return [];
    if (organizacao.tipo === "Sede") {
      return organizacoesIniciais.filter((item) => item.parentId === organizacao.id);
    }
    return organizacoesIniciais.filter((item) => item.id === organizacao.id);
  }, [organizacao]);

  if (!organizacao) {
    return <p className="text-sm text-muted-foreground">Organização não encontrada.</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button variant="ghost" size="icon" className="touch-target" onClick={() => navigate("/configuracoes/organizacoes")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold break-words">{organizacao.nome}</h1>
          <p className="text-sm text-muted-foreground">{organizacao.sigla} · {organizacao.cidade}/{organizacao.uf}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            {organizacao.tipo === "Sede" ? <Landmark className="h-5 w-5 text-primary" /> : <Building2 className="h-5 w-5 text-primary" />}
            <div>
              <p className="text-xl font-bold">{organizacao.tipo}</p>
              <p className="text-xs text-muted-foreground">Tipo da organização</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold">{organizacao.membros}</p>
              <p className="text-xs text-muted-foreground">Membros</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge className="mt-1" variant={organizacao.status === "Ativa" ? "default" : "secondary"}>
              {organizacao.status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Informações da Organização</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Nome:</span> {organizacao.nome}</p>
          <p><span className="text-muted-foreground">Sigla:</span> {organizacao.sigla}</p>
          <p><span className="text-muted-foreground">Tipo:</span> {organizacao.tipo}</p>
          <p><span className="text-muted-foreground">Cidade/UF:</span> {organizacao.cidade}/{organizacao.uf}</p>
          <p><span className="text-muted-foreground">Responsável:</span> {organizacao.responsavel}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {organizacao.tipo === "Sede" ? "Igrejas da Organização" : "Dados da Igreja"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {igrejasVinculadas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma igreja vinculada encontrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Membros</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {igrejasVinculadas.map((igreja) => (
                  <TableRow key={igreja.id}>
                    <TableCell className="font-medium">{igreja.nome}</TableCell>
                    <TableCell>{igreja.tipo}</TableCell>
                    <TableCell>{igreja.cidade}/{igreja.uf}</TableCell>
                    <TableCell>{igreja.membros}</TableCell>
                    <TableCell>
                      <Badge variant={igreja.status === "Ativa" ? "default" : "secondary"}>{igreja.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
