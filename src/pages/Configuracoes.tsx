import { Card, CardContent } from "@/components/ui/card";
import { Users, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Configuracoes() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        <Card
          className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
          onClick={() => navigate("/configuracoes/usuarios")}
        >
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <div>
                <p className="font-semibold">Usuários</p>
                <p className="text-sm text-muted-foreground">Gerenciar usuários e permissões</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
