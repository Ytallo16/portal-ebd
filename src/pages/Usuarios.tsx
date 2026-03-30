import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { usuarios, getIniciais } from "@/data/mock";
import { Search, Users, UserCheck, UserX } from "lucide-react";

export default function Usuarios() {
  const [search, setSearch] = useState("");

  const filtered = usuarios.filter(
    (u) =>
      u.nome.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.papel.toLowerCase().includes(search.toLowerCase())
  );

  const ativos = usuarios.filter((u) => u.status === "Ativo").length;
  const inativos = usuarios.filter((u) => u.status === "Inativo").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Usuários</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome, email ou papel..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 touch-target" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-primary" />
            <div><p className="text-xl font-bold">{usuarios.length}</p><p className="text-xs text-muted-foreground">Total</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <UserCheck className="h-5 w-5 text-success" />
            <div><p className="text-xl font-bold">{ativos}</p><p className="text-xs text-muted-foreground">Ativos</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <UserX className="h-5 w-5 text-destructive" />
            <div><p className="text-xl font-bold">{inativos}</p><p className="text-xs text-muted-foreground">Inativos</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {filtered.map((u) => (
          <Card key={u.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {getIniciais(u.nome)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{u.nome}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>
              <Badge variant="secondary" className="shrink-0">{u.papel}</Badge>
              <div className="flex items-center gap-2 shrink-0">
                <Switch checked={u.status === "Ativo"} />
                <span className="text-xs text-muted-foreground hidden sm:inline">{u.status}</span>
              </div>
              <Button variant="ghost" size="sm" className="touch-target shrink-0">Editar</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
