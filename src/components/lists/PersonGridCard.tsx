import type { ReactNode } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { getIniciais } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type PersonGridCardProps = {
  nome: string;
  subtitle?: string;
  badges?: ReactNode;
  footer?: ReactNode;
  avatarClassName?: string;
  fallbackClassName?: string;
  className?: string;
};

export function PersonGridCard({
  nome,
  subtitle,
  badges,
  footer,
  avatarClassName,
  fallbackClassName,
  className,
}: PersonGridCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        <div className="flex items-start gap-3 p-4">
          <Avatar className={cn("h-11 w-11 shrink-0", avatarClassName)}>
            <AvatarFallback
              className={cn(
                "bg-primary text-sm font-semibold text-primary-foreground",
                fallbackClassName,
              )}
            >
              {getIniciais(nome)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight">{nome}</p>
            {subtitle ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
            {badges ? <div className="mt-2 flex flex-wrap gap-1.5">{badges}</div> : null}
          </div>
        </div>
        {footer ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/25 px-4 py-3">
            {footer}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** Grid padrão para listas de pessoas (usuários, professores, alunos). */
export function personListGridClassName() {
  return "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3";
}
