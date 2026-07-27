import { Card, CardContent } from "@/components/ui/card";
import { Users, ChevronRight, Building2, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { usePermissions } from "@/auth/usePermissions";

export default function Configuracoes() {
  const navigate = useNavigate();
  const { isAdminSistema, organizacaoAtiva } = usePermissions();

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
          onClick={() => navigate("/configuracoes/usuarios")}
        >
          <CardContent className="p-5 sm:p-6 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <div className="min-w-0">
                <p className="font-semibold">Usuários</p>
                <p className="text-sm text-muted-foreground">Gerenciar usuários do sistema</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        {isAdminSistema && (
          <Card
            className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
            onClick={() => navigate("/configuracoes/organizacoes")}
          >
            <CardContent className="p-5 sm:p-6 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-primary" />
                <div className="min-w-0">
                  <p className="font-semibold">Organizações</p>
                  <p className="text-sm text-muted-foreground">
                    Gerenciar instâncias do portal (campos e igrejas individuais)
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        )}

        {isAdminSistema && organizacaoAtiva && (
          <Card
            className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
            onClick={() => navigate("/configuracoes/registro-atividades")}
          >
            <CardContent className="p-5 sm:p-6 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-6 w-6 text-primary" />
                <div className="min-w-0">
                  <p className="font-semibold">Registro de atividades</p>
                  <p className="text-sm text-muted-foreground">
                    Consultar ações realizadas em {organizacaoAtiva.nome}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
