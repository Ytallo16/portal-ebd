import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Search,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { Navigate } from "react-router-dom";

import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListRowSkeleton, PageHeaderSkeleton, SearchBarSkeleton } from "@/components/skeletons";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getIniciais } from "@/lib/formatters";
import {
  fetchRegistrosAtividade,
  type RegistroAtividade,
} from "@/lib/portalApi";

function formatarDataHora(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

const EVENT_LABELS: Record<RegistroAtividade["eventType"], string> = {
  CREATE: "Criação",
  UPDATE: "Edição",
  DELETE: "Exclusão",
  LOGIN: "Acesso",
  REQUEST: "Operação",
};

const FIELD_LABELS: Record<string, string> = {
  nome: "Nome",
  email: "E-mail",
  telefone: "Telefone",
  data_nascimento: "Nascimento",
  class_group_id: "Turma",
  organization_id: "Organização",
  is_active: "Ativo",
  ativo: "Ativo",
  status: "Situação",
  presente: "Presença",
  oferta_valor: "Oferta",
  visitantes: "Visitantes",
  biblias: "Bíblias",
  revistas: "Revistas",
  recebeu: "Recebeu revista",
  pagou: "Pagou revista",
  metodo_pagamento: "Método de pagamento",
};

function fieldLabel(field: string) {
  return FIELD_LABELS[field] ?? field.replaceAll("_", " ");
}

function valueLabel(value: unknown) {
  if (value === null || value === undefined || value === "") return "vazio";
  if (value === true) return "Sim";
  if (value === false) return "Não";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function ActivityItem({ item }: { item: RegistroAtividade }) {
  const changes = Object.entries(item.changes);
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {getIniciais(item.actorName) || "S"}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{item.action}</p>
                  <Badge variant="outline">{EVENT_LABELS[item.eventType]}</Badge>
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5 shrink-0" />
                  {formatarDataHora(item.createdAt)}
                </p>
              </div>
              <Badge
                variant={item.succeeded ? "secondary" : "destructive"}
                className="w-fit shrink-0"
              >
                {item.succeeded ? (
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                ) : (
                  <XCircle className="mr-1 h-3.5 w-3.5" />
                )}
                {item.succeeded ? "Concluída" : "Falhou"} · {item.statusCode}
              </Badge>
            </div>

            <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Responsável</p>
                <p className="truncate font-medium" title={item.actorEmail}>
                  {item.actorName}
                </p>
                {item.actorEmail && (
                  <p className="truncate text-xs text-muted-foreground">{item.actorEmail}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Área</p>
                <p className="font-medium">
                  {item.resource}
                  {item.objectReference ? ` · ${item.objectReference}` : ""}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Operação</p>
                <p className="font-medium">{item.method}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Endereço IP</p>
                <p className="font-medium">{item.ipAddress || "Não identificado"}</p>
              </div>
            </div>

            <div className="rounded-md bg-muted/60 px-3 py-2">
              <p className="break-all font-mono text-xs text-muted-foreground">{item.path}</p>
            </div>

            {changes.length > 0 && (
              <details className="rounded-md border px-3 py-2">
                <summary className="cursor-pointer text-sm font-medium">
                  Ver campos registrados ({changes.length})
                </summary>
                <div className="mt-3 space-y-2">
                  {changes.map(([field, values]) => (
                    <div
                      key={field}
                      className="grid gap-1 border-t pt-2 text-xs sm:grid-cols-[10rem_1fr]"
                    >
                      <span className="font-medium capitalize">{fieldLabel(field)}</span>
                      <span className="break-words text-muted-foreground">
                        {valueLabel(values.antes)} → {valueLabel(values.depois)}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RegistroAtividades() {
  const { activeOrgId, organizacaoAtiva, isAdminSistema, isLoading: loadingPermissions } =
    usePermissions();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [result, setResult] = useState<"all" | "success" | "failure">("all");
  const [eventType, setEventType] = useState<"all" | "CREATE" | "UPDATE" | "DELETE">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, result, eventType, dateFrom, dateTo]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: orgQueryKey(
      activeOrgId,
      "activity-logs",
      page,
      debouncedSearch,
      result,
      eventType,
      dateFrom,
      dateTo,
    ),
    queryFn: () =>
      fetchRegistrosAtividade({
        page,
        search: debouncedSearch,
        result,
        eventType,
        dateFrom,
        dateTo,
      }),
    enabled: Boolean(isAdminSistema && activeOrgId && organizacaoAtiva),
    placeholderData: (previous) => previous,
  });

  if (loadingPermissions) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <SearchBarSkeleton />
        <ListRowSkeleton />
      </div>
    );
  }

  if (!isAdminSistema) {
    return <Navigate to="/" replace />;
  }

  if (!activeOrgId || !organizacaoAtiva) {
    return <Navigate to="/configuracoes/organizacoes" replace />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Registro de atividades</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ações realizadas em {organizacaoAtiva.nome}, com responsável, resultado, data e hora.
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          <ShieldCheck className="mr-1.5 h-4 w-4" />
          Somente administrador
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Activity className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold">{data?.count ?? 0}</p>
              <p className="text-xs text-muted-foreground">Atividades encontradas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <UserRound className="h-5 w-5 text-primary" />
            <div className="min-w-0">
              <p className="truncate font-semibold">{organizacaoAtiva.nome}</p>
              <p className="text-xs text-muted-foreground">Organização selecionada</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por usuário, ação, área ou rota..."
              className="pl-10"
            />
          </div>
          <Select
            value={eventType}
            onValueChange={(value: "all" | "CREATE" | "UPDATE" | "DELETE") =>
              setEventType(value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="CREATE">Criações</SelectItem>
              <SelectItem value="UPDATE">Edições</SelectItem>
              <SelectItem value="DELETE">Exclusões</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={result}
            onValueChange={(value: "all" | "success" | "failure") => setResult(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os resultados</SelectItem>
              <SelectItem value="success">Concluídas</SelectItem>
              <SelectItem value="failure">Com falha</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              aria-label="Data inicial"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => setDateFrom(event.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              aria-label="Data final"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => setDateTo(event.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <ListRowSkeleton count={6} />
      ) : data?.items.length ? (
        <div className="space-y-3">
          <div className="flex min-h-5 justify-end">
            {isFetching && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Atualizando registros...
              </span>
            )}
          </div>
          {data.items.map((item) => (
            <ActivityItem key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <Activity className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">Nenhuma atividade encontrada</p>
            <p className="text-sm text-muted-foreground">
              As próximas alterações realizadas nesta organização aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Página {data.page} de {data.totalPages} · {data.count} atividade(s)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!data.hasPrevious || isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              disabled={!data.hasNext || isFetching}
              onClick={() => setPage((current) => current + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
