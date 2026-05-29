import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";

import { usePermissions } from "@/auth/usePermissions";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { switchOrganizationContext } from "@/lib/api";
import {
  groupOrganizations,
  igrejasDoSecretarioCampo,
  isSecretarioCampoUsuario,
} from "@/lib/orgContextSelection";
import { cn } from "@/lib/utils";
import { isTipoCampo } from "@/lib/portalApi";

type OrgContextSwitcherProps = {
  variant?: "header" | "card";
  /** Força lista só de igrejas (ex.: card ao tentar abrir turmas no contexto campo). */
  igrejaOnly?: boolean;
};

export function OrgContextSwitcher({ variant = "card", igrejaOnly = false }: OrgContextSwitcherProps) {
  const queryClient = useQueryClient();
  const { organizacaoAtiva, organizacoesDisponiveis, isLoading, hasRole, isAdminSistema, usuario } =
    usePermissions();

  const mutation = useMutation({
    mutationFn: (organizationId: string) => switchOrganizationContext(organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries();
    },
  });

  const papeis = usuario?.papeis ?? [];
  const secretarioCampo = isSecretarioCampoUsuario(papeis, isAdminSistema);
  const somenteIgrejas = igrejaOnly || secretarioCampo;

  const { campos, igrejas: todasIgrejas } = groupOrganizations(organizacoesDisponiveis);
  const igrejas = secretarioCampo ? igrejasDoSecretarioCampo(organizacoesDisponiveis) : todasIgrejas;
  const opcoes = somenteIgrejas ? igrejas : [...campos, ...todasIgrejas];

  if (isLoading) {
    return null;
  }

  if (somenteIgrejas && igrejas.length === 0) {
    return <p className="text-xs text-muted-foreground">Nenhuma igreja disponível.</p>;
  }

  if (!somenteIgrejas && opcoes.length <= 1) {
    return null;
  }

  if (somenteIgrejas && igrejas.length <= 1) {
    return null;
  }

  const valueInList = organizacaoAtiva && opcoes.some((o) => o.id === organizacaoAtiva.id);
  const value = valueInList ? String(organizacaoAtiva!.id) : undefined;
  const contextoCampoAtivo = Boolean(organizacaoAtiva && isTipoCampo(organizacaoAtiva.tipo));

  return (
    <Select
      value={value}
      onValueChange={(next) => mutation.mutate(next)}
      disabled={mutation.isPending}
    >
      <SelectTrigger
        className={cn(
          "h-8 text-xs",
          variant === "header"
            ? "w-[min(100%,14rem)] border-input bg-background sm:w-56"
            : "w-full border-sidebar-border bg-sidebar-accent/30",
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <Building2 className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <SelectValue
            placeholder={
              secretarioCampo && contextoCampoAtivo ? "Selecione uma igreja" : "Selecione o contexto"
            }
          />
        </div>
      </SelectTrigger>
      <SelectContent>
        {!somenteIgrejas && campos.length > 0 && (
          <SelectGroup>
            <SelectLabel>Campos</SelectLabel>
            {campos.map((org) => (
              <SelectItem key={org.id} value={String(org.id)}>
                {org.nome}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        {igrejas.length > 0 && (
          <SelectGroup>
            <SelectLabel>Igrejas</SelectLabel>
            {igrejas.map((org) => (
              <SelectItem key={org.id} value={String(org.id)}>
                {secretarioCampo ? org.nome : org.parentNome ? `${org.parentNome} · ${org.nome}` : org.nome}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}
