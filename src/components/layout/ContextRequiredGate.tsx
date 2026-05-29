import { useLocation } from "react-router-dom";

import { usePermissions } from "@/auth/usePermissions";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isOperationalPath } from "@/lib/orgContext";
import { isSecretarioCampoUsuario } from "@/lib/orgContextSelection";
import { isTipoIgreja } from "@/lib/portalApi";

export function ContextRequiredGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { requerSelecaoContexto, organizacaoAtiva, isLoading, usuario, isAdminSistema } = usePermissions();
  const secretarioCampo = isSecretarioCampoUsuario(usuario?.papeis ?? [], isAdminSistema);

  if (isLoading) {
    return <p className="p-4 text-sm text-muted-foreground">Carregando contexto...</p>;
  }

  const contextoIgreja = Boolean(organizacaoAtiva && isTipoIgreja(organizacaoAtiva.tipo));
  const precisaIgreja = isOperationalPath(location.pathname) && !contextoIgreja;
  const precisaContextoGeral = requerSelecaoContexto && !organizacaoAtiva && !secretarioCampo;

  if (precisaContextoGeral) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Selecione o contexto</CardTitle>
            <CardDescription>
              Escolha o campo ou a igreja na <strong>barra superior</strong> antes de continuar.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (precisaIgreja) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Selecione uma igreja</CardTitle>
            <CardDescription>
              Para acessar esta área, escolha uma igreja no seletor da <strong>barra superior</strong>.
              O contexto vale para todo o sistema até você alterar.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
