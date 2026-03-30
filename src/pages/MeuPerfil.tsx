import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { fetchUsuarioLogado } from "@/lib/portalApi";

export default function MeuPerfil() {
  const { data: usuarioLogado, isLoading } = useQuery({ queryKey: ["me"], queryFn: fetchUsuarioLogado });

  if (isLoading || !usuarioLogado) {
    return <p className="text-sm text-muted-foreground">Carregando perfil...</p>;
  }

  return (
    <div className="mx-auto mt-4 w-full max-w-md space-y-6 animate-fade-in px-2 sm:mt-8 sm:px-0">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
              {usuarioLogado.iniciais}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="text-xl font-bold">{usuarioLogado.nome}</p>
            <p className="text-sm text-muted-foreground">{usuarioLogado.email}</p>
          </div>
          <div className="flex gap-2">
            <Badge>{usuarioLogado.papel}</Badge>
            <Badge variant="secondary">{usuarioLogado.status}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
