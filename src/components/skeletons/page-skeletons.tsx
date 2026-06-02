import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageHeaderSkeleton({
  subtitle = false,
  action = false,
  className,
}: {
  subtitle?: boolean;
  action?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 sm:w-56" />
        {subtitle ? <Skeleton className="h-4 w-full max-w-md" /> : null}
      </div>
      {action ? <Skeleton className="h-10 w-full sm:w-36" /> : null}
    </div>
  );
}

export function KpiGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-3 p-4">
            <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function CardGridSkeleton({
  count = 6,
  cols = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
}: {
  count?: number;
  cols?: string;
}) {
  return (
    <div className={cn("grid gap-4", cols)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ListRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 rounded-lg border p-2">
      <div className="flex gap-2 border-b pb-2">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-2 py-2">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SearchBarSkeleton() {
  return <Skeleton className="h-10 w-full rounded-md" />;
}

export function ChartCardSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className={cn("w-full rounded-md", tall ? "h-[220px]" : "h-[180px]")} />
      </CardContent>
    </Card>
  );
}

/** Shell enquanto permissões / app inicializam (antes do AppLayout). */
export function AppShellSkeleton() {
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-muted/40">
      <aside className="hidden w-64 shrink-0 border-r bg-muted/60 p-4 md:block">
        <Skeleton className="mb-6 h-8 w-32" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 items-center gap-2 border-b bg-card px-3 py-2">
          <Skeleton className="h-9 w-9 shrink-0" />
          <Skeleton className="hidden h-4 w-40 md:block" />
          <div className="flex flex-1 justify-end gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
        <main className="flex-1 space-y-6 overflow-hidden p-3 md:p-6">
          <PageHeaderSkeleton action />
          <KpiGridSkeleton />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ChartCardSkeleton />
            <ChartCardSkeleton />
          </div>
        </main>
      </div>
    </div>
  );
}

export function PageContentSkeleton({ withKpis = true, withCards = true }: { withKpis?: boolean; withCards?: boolean }) {
  return (
    <div className="space-y-6 animate-pulse">
      <PageHeaderSkeleton action />
      {withKpis ? <KpiGridSkeleton count={3} /> : null}
      {withCards ? <CardGridSkeleton count={6} /> : <ListRowSkeleton />}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Skeleton className="h-4 w-56" />
      <KpiGridSkeleton />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCardSkeleton />
        <div className="xl:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent className="space-y-3">
              <ListRowSkeleton count={4} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function DashboardProfessorSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <KpiGridSkeleton />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCardSkeleton />
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <ListRowSkeleton count={5} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent>
            <ListRowSkeleton count={4} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function LicaoDetalheSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="mb-2 h-6 w-12" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <ChartCardSkeleton tall />
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={5} cols={6} />
        </CardContent>
      </Card>
    </div>
  );
}

export function ClasseDetalheSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <Skeleton className="h-8 w-14" />
              <Skeleton className="mt-2 h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <ListRowSkeleton count={8} />
        </CardContent>
      </Card>
    </div>
  );
}

export function TurmaDetalheSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-8 w-12" />
              <Skeleton className="mt-2 h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={6} cols={5} />
        </CardContent>
      </Card>
    </div>
  );
}

export function LicoesHubSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <PageHeaderSkeleton subtitle action />
      <CardGridSkeleton count={4} cols="grid-cols-1 sm:grid-cols-2" />
    </div>
  );
}

export function LicoesTrimestreSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-8 w-52" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function RevistasSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <PageHeaderSkeleton subtitle />
      <CardGridSkeleton count={4} cols="grid-cols-1 sm:grid-cols-2" />
    </div>
  );
}

export function RevistasChecklistSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <PageHeaderSkeleton subtitle />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <Skeleton className="h-6 w-10" />
              <Skeleton className="mt-2 h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <SearchBarSkeleton />
      <ListRowSkeleton count={10} />
    </div>
  );
}

export function FinanceiroSkeleton({ campo = false }: { campo?: boolean }) {
  return (
    <div className="space-y-6 animate-pulse">
      <PageHeaderSkeleton subtitle />
      {campo ? <Skeleton className="h-16 w-full rounded-lg" /> : null}
      <KpiGridSkeleton />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={5} cols={4} />
        </CardContent>
      </Card>
    </div>
  );
}

export function PerfilSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl animate-pulse space-y-6 px-2 sm:px-0">
      <Skeleton className="h-8 w-40" />
      <div className="overflow-hidden rounded-xl border bg-card">
        <Skeleton className="h-28 w-full" />
        <div className="flex flex-col items-center gap-4 px-6 pb-8 pt-0">
          <Skeleton className="-mt-12 h-28 w-28 rounded-full ring-4 ring-background" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export function RedirectSkeleton() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 animate-pulse">
      <Skeleton className="h-12 w-12 rounded-full" />
      <Skeleton className="h-4 w-40" />
    </div>
  );
}

export function NotificationListSkeleton() {
  return (
    <div className="space-y-1 p-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3 rounded-md p-2">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function UsuariosPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <PageHeaderSkeleton action />
      <SearchBarSkeleton />
      <KpiGridSkeleton count={3} />
      <CardGridSkeleton count={6} cols="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" />
    </div>
  );
}

export function AlunosPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <PageHeaderSkeleton action />
      <SearchBarSkeleton />
      <ListRowSkeleton count={10} />
    </div>
  );
}

export function ProfessoresPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <PageHeaderSkeleton />
      <SearchBarSkeleton />
      <CardGridSkeleton count={2} cols="grid-cols-1 sm:grid-cols-2" />
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <CardGridSkeleton count={4} cols="grid-cols-1 sm:grid-cols-2" />
        </CardContent>
      </Card>
      <CardGridSkeleton count={6} cols="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" />
    </div>
  );
}

export function TrimestresPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <PageHeaderSkeleton action />
      <KpiGridSkeleton count={3} />
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={5} cols={5} />
        </CardContent>
      </Card>
    </div>
  );
}

export function OrganizacaoDetalheSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-8 w-56" />
      </div>
      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={4} cols={4} />
        </CardContent>
      </Card>
    </div>
  );
}

export function FrequenciaProfessoresSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-8 w-64" />
      </div>
      <Card>
        <CardContent className="space-y-4 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3 border-b pb-3 last:border-0">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-9 w-28" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
