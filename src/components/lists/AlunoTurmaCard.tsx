import { Mail, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters";
import type { Aluno } from "@/lib/portalApi";

type AlunoTurmaCardProps = {
  aluno: Aluno;
};

export function AlunoTurmaCard({ aluno }: AlunoTurmaCardProps) {
  return (
    <article className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 font-semibold leading-tight">{aluno.nome}</p>
        <Badge variant="secondary" className="shrink-0 text-xs">
          {aluno.sexo === "M" ? "M" : "F"}
        </Badge>
      </div>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Nascimento</dt>
          <dd className="font-medium">{formatDate(aluno.dataNascimento)}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Telefone</dt>
          <dd className="flex items-center gap-1.5 font-medium">
            <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {aluno.telefone || "—"}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-2">
          <dt className="shrink-0 text-muted-foreground">E-mail</dt>
          <dd className="flex min-w-0 items-center gap-1.5 text-right font-medium">
            <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{aluno.email || "—"}</span>
          </dd>
        </div>
      </dl>
    </article>
  );
}
