import { type ReactNode } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getIniciais } from "@/lib/formatters";

const ITENS_POR_COLUNA = 5;

export function chunkEmColunas<T>(items: T[], tamanho = ITENS_POR_COLUNA): T[][] {
  const colunas: T[][] = [];
  for (let i = 0; i < items.length; i += tamanho) {
    colunas.push(items.slice(i, i + tamanho));
  }
  return colunas;
}

export type AniversarianteItem = {
  key: string;
  nome: string;
  legenda?: string;
  badge: ReactNode;
};

type BirthdayColumnsProps = {
  items: AniversarianteItem[];
  emptyMessage: string;
};

export function BirthdayColumns({ items, emptyMessage }: BirthdayColumnsProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  const colunas = chunkEmColunas(items);

  return (
    <div
      className={cn(
        "grid w-full gap-x-8 gap-y-3",
        colunas.length === 1 && "grid-cols-1",
        colunas.length === 2 && "grid-cols-1 sm:grid-cols-2",
        colunas.length >= 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {colunas.map((coluna, indiceColuna) => (
        <div key={indiceColuna} className="flex min-w-0 flex-col gap-3">
          {coluna.map((item) => (
            <div key={item.key} className="flex min-w-0 items-center gap-2.5">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                  {getIniciais(item.nome)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.nome}</p>
                {item.legenda ? (
                  <p className="truncate text-xs text-muted-foreground">{item.legenda}</p>
                ) : null}
              </div>
              <div className="shrink-0 whitespace-nowrap">{item.badge}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
