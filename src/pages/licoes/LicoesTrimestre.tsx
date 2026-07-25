import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { LicoesTrimestreSkeleton } from "@/components/skeletons";
import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import { isSomenteProfessor } from "@/lib/chamada";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { licoesDestinoAoAbrirLicao, licoesLicaoPath, trimestreLabel } from "@/lib/licoesRoutes";
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
  const paramsValidos =
    Number.isFinite(ano) && Number.isFinite(trimestre) && trimestre >= 1;

  const { data: trimestres = [], isLoading: loadingMeta } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "trimestres"),
    queryFn: () => fetchTrimestres(),
    enabled: podeCarregarOperacional && paramsValidos,
  });

  const trimestreMeta = trimestres.find((t) => t.numero === trimestre && t.ano === ano);

  const { data: licoes = [], isLoading: loadingLicoes } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "licoes", trimestre, ano),
    queryFn: () => fetchLicoes({ trimestre, ano }),
    enabled: podeCarregarOperacional && paramsValidos,
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

  if (!paramsValidos) {
    return <Navigate to="/licoes" replace />;
  }

  if (loadingMeta || loadingLicoes) {
    return <LicoesTrimestreSkeleton />;
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
            className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${licao ? "" : "opacity-75"}`}
            onClick={() => {
              const destino = licao
                ? licoesDestinoAoAbrirLicao(ano, trimestre, numero, {
                    somenteProfessor,
                    turmasProfessor,
                  })
                : licoesLicaoPath(ano, trimestre, numero);
              navigate(destino);
            }}
          >
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Lição {numero}</Badge>
                <Badge variant={licao?.status === "Finalizada" ? "default" : "outline"}>
                  {licao?.status ?? "Pendente"}
                </Badge>
              </div>
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
