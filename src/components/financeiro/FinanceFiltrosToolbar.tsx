import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FinanceFiltrosToolbarProps = {
  className?: string;
  children: ReactNode;
};

export function FinanceFiltrosToolbar({ className, children }: FinanceFiltrosToolbarProps) {
  return (
    <Card className={cn("border-dashed bg-muted/20", className)}>
      <CardContent className="flex flex-col gap-4 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Filtros
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">{children}</div>
      </CardContent>
    </Card>
  );
}

export function FinanceFiltroField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("w-full space-y-1.5 sm:w-auto sm:min-w-[8rem]", className)}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
