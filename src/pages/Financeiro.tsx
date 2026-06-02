import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermissions } from "@/auth/usePermissions";
import { FinanceiroSkeleton } from "@/components/skeletons";
import { FinanceiroCampo } from "@/pages/financeiro/FinanceiroCampo";
import { FinanceiroIgreja } from "@/pages/financeiro/FinanceiroIgreja";

export default function Financeiro() {
  const { contextoCampo, contextoIgreja, podeVisualizarFinanceiro, isLoading } = usePermissions();

  if (isLoading) {
    return <FinanceiroSkeleton />;
  }

  if (!podeVisualizarFinanceiro) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sem permissão</CardTitle>
            <CardDescription>Você não tem acesso ao módulo financeiro.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (contextoCampo) {
    return <FinanceiroCampo />;
  }

  if (contextoIgreja) {
    return <FinanceiroIgreja />;
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Selecione o contexto</CardTitle>
          <CardDescription>
            Escolha o campo ou uma igreja no seletor da barra superior para ver o financeiro.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
