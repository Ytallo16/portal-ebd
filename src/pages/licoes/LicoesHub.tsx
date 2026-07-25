import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { CalendarRange, ChevronRight, Settings2, Sparkles } from "lucide-react";

import { LicoesHubSkeleton } from "@/components/skeletons";
import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import { isSomenteProfessor, podeGerenciarTrimestres } from "@/lib/chamada";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  findLicaoDaSemana,
  licoesGerenciarTrimestresPath,
  licoesDestinoAoAbrirLicao,
  licoesTrimestrePath,
  trimestreLabel,
} from "@/lib/licoesRoutes";
import { fetchLicoes, fetchTrimestres, type Trimestre } from "@/lib/portalApi";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const statusTrimestreLabel: Record<Trimestre["status"], string> = {
  PLANEJADO: "Planejado",
  EM_ANDAMENTO: "Em andamento",
  ENCERRADO: "Encerrado",
};

export default function LicoesHub() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    activeOrgId,
    podeCarregarOperacional,
    can,
    isAdminSistema,
    hasRole,
    turmasProfessor,
  } = usePermissions();
  const papelCtx = { isAdminSistema, hasRole };
  const gerenciarTrimestres = podeGerenciarTrimestres(papelCtx);
  const somenteProfessor = isSomenteProfessor(papelCtx);

  const trimestreQuery = Number(searchParams.get("trimestre"));
  const anoQuery = Number(searchParams.get("ano"));
  const destinoLegado =
    Number.isFinite(trimestreQuery) &&
    Number.isFinite(anoQuery) &&
    trimestreQuery >= 1 &&
    anoQuery >= 2000
      ? licoesTrimestrePath(anoQuery, trimestreQuery)
      : null;

  const { data: trimestres = [], isLoading } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "trimestres"),
    queryFn: () => fetchTrimestres(),
    enabled: podeCarregarOperacional && !destinoLegado,
  });

  const trimestreEmAndamento = trimestres.find((t) => t.status === "EM_ANDAMENTO");

  const { data: licoesAtivas = [] } = useQuery({
    queryKey: orgQueryKey(
      activeOrgId,
      "licoes",
      trimestreEmAndamento?.ano,
      trimestreEmAndamento?.numero,
    ),
    queryFn: () =>
      fetchLicoes({
        trimestre: trimestreEmAndamento!.numero,
        ano: trimestreEmAndamento!.ano,
      }),
    enabled:
      podeCarregarOperacional &&
      !destinoLegado &&
      Boolean(trimestreEmAndamento),
  });

  const licaoDaSemana = useMemo(() => findLicaoDaSemana(licoesAtivas), [licoesAtivas]);

  const trimestresOrdenados = useMemo(() => {
    const emAndamento = trimestres.filter((t) => t.status === "EM_ANDAMENTO");
    const outros = trimestres.filter((t) => t.status !== "EM_ANDAMENTO");
    outros.sort((a, b) => b.ano - a.ano || b.numero - a.numero);
    return [...emAndamento, ...outros];
  }, [trimestres]);

  if (destinoLegado) {
    return <Navigate to={destinoLegado} replace />;
  }

  if (isLoading) {
    return <LicoesHubSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lições</h1>
          <p className="text-sm text-muted-foreground">
            Escolha o trimestre para ver e registrar as lições da EBD.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {licaoDaSemana && trimestreEmAndamento && (
            <Button
              className="w-full sm:w-auto"
              onClick={() =>
                navigate(
                  licoesDestinoAoAbrirLicao(
                    trimestreEmAndamento.ano,
                    trimestreEmAndamento.numero,
                    licaoDaSemana.numero,
                    { somenteProfessor, turmasProfessor },
                  ),
                )
              }
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Lição desta semana
            </Button>
          )}
          {gerenciarTrimestres && (
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => navigate(licoesGerenciarTrimestresPath())}
            >
              <Settings2 className="mr-2 h-4 w-4" />
              Gerenciar trimestres
            </Button>
          )}
        </div>
      </div>

      {trimestres.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Nenhum trimestre cadastrado.
            {gerenciarTrimestres && (
              <>
                {" "}
                <button
                  type="button"
                  className="text-primary underline"
                  onClick={() => navigate(licoesGerenciarTrimestresPath())}
                >
                  Cadastrar trimestre
                </button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trimestresOrdenados.map((t) => (
            <TrimestreCard
              key={t.id}
              trimestre={t}
              onOpen={() => navigate(licoesTrimestrePath(t.ano, t.numero))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TrimestreCard({
  trimestre,
  onOpen,
}: {
  trimestre: Trimestre;
  onOpen: () => void;
}) {
  const emAndamento = trimestre.status === "EM_ANDAMENTO";

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:ring-2 hover:ring-primary/50",
        emAndamento && "ring-2 ring-primary/40 border-primary/30",
      )}
      onClick={onOpen}
    >
      <CardContent className="flex items-start justify-between gap-3 p-4 sm:p-6">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-lg">{trimestreLabel(trimestre.numero, trimestre.ano)}</p>
            {emAndamento && (
              <Badge>
                <CalendarRange className="mr-1 h-3 w-3" />
                Atual
              </Badge>
            )}
          </div>
          <Badge
            variant={
              trimestre.status === "ENCERRADO"
                ? "secondary"
                : trimestre.status === "EM_ANDAMENTO"
                  ? "default"
                  : "outline"
            }
          >
            {statusTrimestreLabel[trimestre.status]}
          </Badge>
          <p className="text-xs text-muted-foreground">
            {trimestre.dataInicio ? formatDate(trimestre.dataInicio) : "—"} até{" "}
            {trimestre.dataFim ? formatDate(trimestre.dataFim) : "—"}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}
