import { matchPath } from "react-router-dom";

import { licoesTrimestrePath, trimestreLabel } from "@/lib/licoesRoutes";

export type BreadcrumbItem = { label: string; to?: string };

export function getLicoesBreadcrumbs(
  pathname: string,
  options?: { somenteProfessor?: boolean },
): BreadcrumbItem[] | null {
  const somenteProfessor = Boolean(options?.somenteProfessor);
  const base = [{ label: "Lições", to: "/licoes" }];

  if (matchPath("/licoes/gerenciar-trimestres", pathname)) {
    return [...base, { label: "Gerenciar trimestres" }];
  }

  const trimestreMatch = matchPath({ path: "/licoes/:ano/:trimestre", end: true }, pathname);
  if (trimestreMatch?.params.ano && trimestreMatch.params.trimestre) {
    const ano = Number(trimestreMatch.params.ano);
    const tri = Number(trimestreMatch.params.trimestre);
    const triPath = licoesTrimestrePath(ano, tri);
    const triLabel = trimestreLabel(tri, ano);

    const turmaMatch = matchPath(
      "/licoes/:ano/:trimestre/:licaoNumero/turmas/:classId",
      pathname,
    );
    if (turmaMatch?.params.licaoNumero) {
      const num = Number(turmaMatch.params.licaoNumero);
      return [
        ...base,
        { label: triLabel, to: triPath },
        somenteProfessor
          ? { label: `Lição ${num}` }
          : { label: `Lição ${num}`, to: `/licoes/${ano}/${tri}/${num}` },
        { label: "Registro da turma" },
      ];
    }

    const licaoMatch = matchPath("/licoes/:ano/:trimestre/:licaoNumero", pathname);
    if (licaoMatch?.params.licaoNumero) {
      return [
        ...base,
        { label: triLabel, to: triPath },
        { label: `Lição ${licaoMatch.params.licaoNumero}` },
      ];
    }

    return [...base, { label: triLabel }];
  }

  if (pathname === "/licoes" || pathname === "/licoes/") {
    return base;
  }

  return null;
}

export function getLicoesPageTitle(
  pathname: string,
  options?: { somenteProfessor?: boolean },
): string | null {
  const somenteProfessor = Boolean(options?.somenteProfessor);
  if (matchPath("/licoes/gerenciar-trimestres", pathname)) {
    return "Gerenciar trimestres";
  }
  if (matchPath("/licoes/:ano/:trimestre/:licaoNumero/turmas/:classId", pathname)) {
    return somenteProfessor ? "Registro da EBD" : "Chamada da turma";
  }
  if (matchPath("/licoes/:ano/:trimestre/:licaoNumero", pathname)) {
    return somenteProfessor ? "Registro da EBD" : "Detalhes da lição";
  }
  if (matchPath("/licoes/:ano/:trimestre", pathname)) {
    return "Lições do trimestre";
  }
  if (pathname === "/licoes" || pathname === "/licoes/") {
    return "Lições";
  }
  return null;
}
