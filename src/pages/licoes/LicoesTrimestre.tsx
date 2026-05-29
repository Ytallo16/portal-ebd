import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import { isSomenteProfessor } from "@/lib/chamada";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { licoesDestinoAoAbrirLicao, trimestreLabel } from "@/lib/licoesRoutes";
import { fetchLicoes, fetchTrimestres } from "@/lib/portalApi";
import { formatDate } from "@/lib/formatters";
import { Navigate } from "react-router-dom";

export default function LicoesTrimestre() {
  const { ano: anoParam, trimestre: trimestreParam } = useParams();
  const navigate = useNavigate();
  const { activeOrgId, podeCarregarOperacional, isAdminSistema, hasRole, turmasProfessor } =
    usePermissions();
  const somenteProfessor = isSomenteProfessor({ isAdminSistema, hasRole });

  const ano = Number(anoParam);
  const trimestre = Number(trimestreParam);

  if (!Number.isFinite(ano) || !Number.isFinite(trimestre) || trimestre < 1) {
    return <Navigate to="/licoes" replace />;
  }

  const { data: trimestres = [], isLoading: loadingMeta } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "trimestres"),
    queryFn: fetchTrimestres,
    enabled: podeCarregarOperacional,
  });

  const trimestreMeta = trimestres.find((t) => t.numero === trimestre && t.ano === ano);

  const { data: licoes = [], isLoading: loadingLicoes } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "licoes", trimestre, ano),
    queryFn: () => fetchLicoes({ trimestre, ano }),
    enabled: podeCarregarOperacional,
  });

  const quantidadeLicoes = trimestreMeta?.quantidadeLicoes ?? 13;

  const licoesPorNumero = useMemo(() => new Map(licoes.map((l) => [l.numero, l])), [licoes]);

  const grade = useMemo(
    () =>
      Array.from({ length: quantidadeLicoes }, (_, i) => {
        const numero = i + 1;
        return { numero, licao: licoesPorNumero.get(numero) };
      }),
    [quantidadeLicoes, licoesPorNumero],
  );

  if (loadingMeta || loadingLicoes) {
    return <p className="text-sm text-muted-foreground">Carregando lições...</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="touch-target" onClick={() => navigate("/licoes")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{trimestreLabel(trimestre, ano)}</h1>
          {trimestreMeta?.titulo && (
            <p className="text-sm text-muted-foreground">{trimestreMeta.titulo}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {grade.map(({ numero, licao }) => (
          <Card
            key={numero}
            className={`transition-all ${licao ? "cursor-pointer hover:ring-2 hover:ring-primary/50" : "opacity-75"}`}
            onClick={() => {
              if (!licao) return;
              navigate(
                licoesDestinoAoAbrirLicao(ano, trimestre, numero, {
                  somenteProfessor,
                  turmasProfessor,
                }),
              );
            }}
          >
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Lição {numero}</Badge>
                <Badge variant={licao?.status === "Finalizada" ? "default" : "outline"}>
                  {licao?.status ?? "Pendente"}
                </Badge>
              </div>
              <p className="font-medium">{licao?.tema ?? "Lição ainda não cadastrada"}</p>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{licao ? formatDate(licao.data) : "Sem data"}</span>
                {licao && licao.presentes + licao.ausentes > 0 && (
                  <span>
                    {licao.presentes}P / {licao.ausentes}A
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
