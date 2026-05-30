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
  igrejasDoCampo,
  igrejasDoSecretarioCampo,
  instanciasTopLevel,
  isSecretarioCampoUsuario,
} from "@/lib/orgContextSelection";
import { cn } from "@/lib/utils";
import { isTipoCampo, isTipoIgreja, type OrganizacaoContexto } from "@/lib/portalApi";

type OrgContextSwitcherProps = {
  variant?: "header" | "card";
  /** Força lista só de igrejas (ex.: card ao tentar abrir turmas no contexto campo). */
  igrejaOnly?: boolean;
};

function SelectIgrejas({
  igrejas,
  value,
  placeholder,
  variant,
  compacto,
  onChange,
  disabled,
}: {
  igrejas: OrganizacaoContexto[];
  value?: string;
  placeholder: string;
  variant: "header" | "card";
  compacto: boolean;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
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
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Igrejas</SelectLabel>
          {igrejas.map((org) => (
            <SelectItem key={org.id} value={String(org.id)}>
              {compacto ? org.nome : org.parentNome ? `${org.parentNome} · ${org.nome}` : org.nome}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function OrgContextSwitcher({ variant = "card", igrejaOnly = false }: OrgContextSwitcherProps) {
  const queryClient = useQueryClient();
  const { organizacaoAtiva, organizacoesDisponiveis, isLoading, isAdminSistema, usuario } =
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
  const contextoCampoAtivo = Boolean(organizacaoAtiva && isTipoCampo(organizacaoAtiva.tipo));
  const contextoIgrejaAtivo = Boolean(organizacaoAtiva && isTipoIgreja(organizacaoAtiva.tipo));

  if (isLoading) {
    return null;
  }

  // Admin (ou qualquer um) já dentro de uma igreja: sem select no header
  if (contextoIgrejaAtivo && !igrejaOnly) {
    return null;
  }

  // Admin dentro de um campo: listar só igrejas desse campo
  if (isAdminSistema && contextoCampoAtivo && organizacaoAtiva) {
    const igrejas = igrejasDoCampo(organizacoesDisponiveis, organizacaoAtiva.id);
    if (igrejas.length === 0) {
      return <p className="text-xs text-muted-foreground">Nenhuma igreja cadastrada neste campo.</p>;
    }
    const valueInList = organizacaoAtiva && igrejas.some((o) => o.id === organizacaoAtiva.id);
    return (
      <SelectIgrejas
        igrejas={igrejas}
        value={valueInList ? String(organizacaoAtiva!.id) : undefined}
        placeholder="Selecione uma igreja"
        variant={variant}
        compacto
        disabled={mutation.isPending}
        onChange={(next) => mutation.mutate(next)}
      />
    );
  }

  // Secretário de campo (ou card forçando igrejas): igrejas do(s) campo(s) dele
  if (secretarioCampo || igrejaOnly) {
    const igrejas = secretarioCampo
      ? igrejasDoSecretarioCampo(organizacoesDisponiveis)
      : organizacaoAtiva && contextoCampoAtivo
        ? igrejasDoCampo(organizacoesDisponiveis, organizacaoAtiva.id)
        : groupOrganizations(organizacoesDisponiveis).igrejas;

    if (igrejas.length === 0) {
      return <p className="text-xs text-muted-foreground">Nenhuma igreja disponível.</p>;
    }

    const valueInList = organizacaoAtiva && igrejas.some((o) => o.id === organizacaoAtiva.id);
    return (
      <SelectIgrejas
        igrejas={igrejas}
        value={valueInList ? String(organizacaoAtiva!.id) : undefined}
        placeholder="Selecione uma igreja"
        variant={variant}
        compacto
        disabled={mutation.isPending}
        onChange={(next) => mutation.mutate(next)}
      />
    );
  }

  // Admin sem contexto de campo/igreja: escolher instância (campo ou igreja individual)
  if (isAdminSistema) {
    const instancias = instanciasTopLevel(organizacoesDisponiveis);
    if (instancias.length <= 1) {
      return null;
    }
    const valueInList = organizacaoAtiva && instancias.some((o) => o.id === organizacaoAtiva.id);
    return (
      <Select
        value={valueInList ? String(organizacaoAtiva!.id) : undefined}
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
            <SelectValue placeholder="Selecione a instância" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Instâncias</SelectLabel>
            {instancias.map((org) => (
              <SelectItem key={org.id} value={String(org.id)}>
                {org.nome}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  }

  // Demais perfis: campos + igrejas
  const { campos, igrejas } = groupOrganizations(organizacoesDisponiveis);
  const opcoes = [...campos, ...igrejas];
  if (opcoes.length <= 1) {
    return null;
  }

  const valueInList = organizacaoAtiva && opcoes.some((o) => o.id === organizacaoAtiva.id);
  return (
    <Select
      value={valueInList ? String(organizacaoAtiva!.id) : undefined}
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
          <SelectValue placeholder="Selecione o contexto" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {campos.length > 0 && (
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
                {org.parentNome ? `${org.parentNome} · ${org.nome}` : org.nome}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}
