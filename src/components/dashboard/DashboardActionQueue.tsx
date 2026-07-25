import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookMarked,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveOrganizationId, switchOrganizationContext } from "@/lib/api";
import {
  fetchDashboardActions,
  type DashboardAction,
} from "@/lib/portalApi";

const ACTION_ICONS = {
  ATTENDANCE_PENDING: ClipboardList,
  LESSON_TODAY: CalendarClock,
  LESSON_FINALIZE: CheckCircle2,
  MAGAZINE_PAYMENT: BookMarked,
} satisfies Record<DashboardAction["kind"], typeof ClipboardList>;

export function DashboardActionQueue({
  excludeKinds = [],
}: {
  excludeKinds?: DashboardAction["kind"][];
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeOrgId, organizacaoAtiva } = usePermissions();
  const query = useQuery({
    queryKey: orgQueryKey(activeOrgId, "dashboard-actions"),
    queryFn: fetchDashboardActions,
    enabled: Boolean(organizacaoAtiva),
  });

  async function abrirAcao(action: DashboardAction) {
    try {
      if (getActiveOrganizationId() !== String(action.organizationId)) {
        await switchOrganizationContext(action.organizationId);
        await queryClient.invalidateQueries();
      }
      navigate(action.actionPath);
    } catch {
      toast.error("Não foi possível abrir esta pendência.");
    }
  }

  if (!organizacaoAtiva) return null;

  const excluded = new Set(excludeKinds);
  const actions = (query.data?.results ?? []).filter((item) => !excluded.has(item.kind));
  const summaries = query.data?.summaryByOrganization ?? [];
  const multipleOrganizations = summaries.length > 1;

  return (
    <Card className="border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">Ações pendentes</CardTitle>
        </div>
        {query.isFetching ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {query.isError ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm text-destructive">Não foi possível carregar as pendências.</p>
            <Button type="button" size="sm" variant="outline" onClick={() => void query.refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        ) : null}

        {multipleOrganizations ? (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {summaries.map((summary) => (
              <button
                key={summary.organizationId}
                type="button"
                className="flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() =>
                  void abrirAcao({
                    id: `organization:${summary.organizationId}`,
                    kind: "ATTENDANCE_PENDING",
                    title: summary.organizationName,
                    body: "",
                    actionPath: "/",
                    severity: summary.warningCount > 0 ? "WARNING" : "INFO",
                    organizationId: summary.organizationId,
                    organizationName: summary.organizationName,
                    metadata: {},
                  })
                }
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Building2 className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate text-sm font-medium">{summary.organizationName}</span>
                </span>
                <Badge variant={summary.pendingCount > 0 ? "destructive" : "secondary"}>
                  {summary.pendingCount}
                </Badge>
              </button>
            ))}
          </div>
        ) : null}

        {!query.isLoading && !query.isError && actions.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">Tudo em dia por aqui.</p>
          </div>
        ) : null}

        {actions.length > 0 ? (
          <div className="divide-y rounded-lg border">
            {actions.slice(0, 12).map((action) => {
              const Icon = ACTION_ICONS[action.kind];
              return (
                <button
                  key={action.id}
                  type="button"
                  className="flex w-full items-center gap-3 p-3 text-left transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                  onClick={() => void abrirAcao(action)}
                >
                  <span className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{action.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {multipleOrganizations ? `${action.organizationName} · ` : ""}
                      {action.body}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              );
            })}
            {actions.length > 12 ? (
              <p className="p-3 text-center text-xs text-muted-foreground">
                Mais {actions.length - 12} pendência(s). Entre na igreja para visualizar.
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
