import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  FinanceLancamentosTable,
  financeLancamentosPageSize,
} from "@/components/financeiro/FinanceLancamentosTable";
import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import { fetchFinanceLancamentos, type FinanceResumoFilters } from "@/lib/portalApi";
import { cn } from "@/lib/utils";

type FinanceLancamentosSectionProps = {
  className?: string;
  title?: string;
  filters?: FinanceResumoFilters;
  showIgrejaColumn?: boolean;
  emptyMessage?: string;
};

export function FinanceLancamentosSection({
  className,
  title,
  filters = {},
  showIgrejaColumn = false,
  emptyMessage,
}: FinanceLancamentosSectionProps) {
  const [page, setPage] = useState(1);
  const { activeOrgId, podeVisualizarFinanceiro } = usePermissions();

  useEffect(() => {
    setPage(1);
  }, [filters.classId, filters.lessonId, filters.trimestre, filters.ano, filters.dateFrom, filters.dateTo]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "finance-lancamentos", filters, page),
    queryFn: () =>
      fetchFinanceLancamentos({
        ...filters,
        page,
        pageSize: financeLancamentosPageSize(),
      }),
    enabled: podeVisualizarFinanceiro,
    placeholderData: (previous) => previous,
  });

  return (
    <FinanceLancamentosTable
      className={cn("min-w-0", className)}
      title={title}
      recentes={data?.items ?? []}
      paginacao={
        data?.paginacao ?? {
          page: 1,
          pageSize: financeLancamentosPageSize(),
          total: 0,
          totalPages: 1,
        }
      }
      page={page}
      onPageChange={setPage}
      showIgrejaColumn={showIgrejaColumn}
      emptyMessage={emptyMessage}
      isLoading={isLoading}
      isFetching={isFetching}
    />
  );
}
