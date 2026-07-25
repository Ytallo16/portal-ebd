import { ArrowRight, BellRing, BookOpen, CheckCircle2 } from "lucide-react";

import type { ProfessorDashboardLicaoHoje } from "@/lib/portalApi";

type ProfessorLessonTodayAlertProps = {
  licao: ProfessorDashboardLicaoHoje;
  turmaNome: string;
  onOpen: () => void;
};

export function ProfessorLessonTodayAlert({
  licao,
  turmaNome,
  onOpen,
}: ProfessorLessonTodayAlertProps) {
  return (
    <button
      type="button"
      aria-label={`Abrir registro da lição ${licao.numero} da turma ${turmaNome}`}
      onClick={onOpen}
      className="group relative w-full overflow-hidden rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 p-4 text-left shadow-lg shadow-amber-500/15 transition-all hover:-translate-y-0.5 hover:border-amber-500 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:border-amber-600 dark:from-amber-950/70 dark:via-orange-950/50 dark:to-amber-900/50 sm:p-5"
    >
      <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-amber-300/30 blur-2xl dark:bg-amber-500/15" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
          <div className="relative shrink-0 rounded-2xl bg-amber-500 p-3 text-white shadow-md">
            <BellRing className="h-6 w-6" />
            <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full border-2 border-amber-50 bg-red-500 dark:border-amber-950" />
          </div>

          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                Aula hoje
              </span>
              <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                {turmaNome}
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-amber-950 dark:text-amber-50 sm:text-xl">
              Hoje tem aula na sua turma!
            </h2>
            <p className="mt-1 font-semibold text-amber-900 dark:text-amber-100">
              Lição {licao.numero}: {licao.tema}
            </p>
            <p className="mt-1.5 text-sm text-amber-800 dark:text-amber-200">
              Registre a chamada, visitantes, Bíblias, revistas e oferta.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 rounded-xl bg-white/70 px-3 py-2.5 font-bold text-amber-950 shadow-sm transition-colors group-hover:bg-white dark:bg-black/20 dark:text-amber-100 dark:group-hover:bg-black/30 sm:justify-center">
          {licao.registrada ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : (
            <BookOpen className="h-5 w-5 text-amber-700 dark:text-amber-300" />
          )}
          <span>{licao.registrada ? "Continuar registro" : "Abrir ficha da EBD"}</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  );
}
