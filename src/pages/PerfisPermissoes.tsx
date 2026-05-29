import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Landmark, Search, ShieldCheck } from "lucide-react";

type AcaoPermissao = "visualizar" | "criar" | "editar" | "excluir" | "aprovar";

interface PermissaoModulo {
  modulo: string;
  descricao: string;
  acoes: Partial<Record<AcaoPermissao, boolean>>;
}

interface PerfilPermissao {
  id: string;
  nome: string;
  descricao: string;
  permissoes: PermissaoModulo[];
}

type EscopoTipo = "campo" | "igreja";

interface Escopo {
  id: string;
  nome: string;
  tipo: EscopoTipo;
}

type ScopeOverrides = Record<string, Record<string, Record<string, Partial<Record<AcaoPermissao, boolean>>>>>;

const acoesPadrao: AcaoPermissao[] = ["visualizar", "criar", "editar", "excluir", "aprovar"];

const labelsAcoes: Record<AcaoPermissao, string> = {
  visualizar: "Visualizar",
  criar: "Criar",
  editar: "Editar",
  excluir: "Excluir",
  aprovar: "Aprovar",
};

const escopos: Escopo[] = [
  { id: "campo", nome: "Campo Sede", tipo: "campo" },
  { id: "igreja-centro", nome: "AD Centro", tipo: "igreja" },
  { id: "igreja-dirceu", nome: "AD Dirceu", tipo: "igreja" },
  { id: "igreja-promorar", nome: "AD Promorar", tipo: "igreja" },
];

const perfisIniciais: PerfilPermissao[] = [
  {
    id: "p1",
    nome: "Administrador do sistema",
    descricao: "Acesso completo em qualquer contexto organizacional",
    permissoes: [
      { modulo: "Dashboard", descricao: "Indicadores e painéis", acoes: { visualizar: true } },
      { modulo: "Lições", descricao: "Cadastro e acompanhamento", acoes: { visualizar: true, criar: true, editar: true, excluir: true, aprovar: true } },
      { modulo: "Turmas", descricao: "Estrutura das classes", acoes: { visualizar: true, criar: true, editar: true, excluir: true } },
      { modulo: "Alunos", descricao: "Cadastro de alunos e dados", acoes: { visualizar: true, criar: true, editar: true, excluir: true } },
      { modulo: "Financeiro", descricao: "Ofertas e relatórios", acoes: { visualizar: true, criar: true, editar: true, aprovar: true } },
      { modulo: "Configurações", descricao: "Usuários e parâmetros", acoes: { visualizar: true, criar: true, editar: true, excluir: true } },
    ],
  },
  {
    id: "p2",
    nome: "Secretário de Igreja",
    descricao: "Gestão completa da igreja local (contexto fixo)",
    permissoes: [
      { modulo: "Dashboard", descricao: "Indicadores e painéis", acoes: { visualizar: true } },
      { modulo: "Lições", descricao: "Cadastro e acompanhamento", acoes: { visualizar: true, criar: true, editar: true, aprovar: true } },
      { modulo: "Turmas", descricao: "Estrutura das classes", acoes: { visualizar: true, criar: true, editar: true } },
      { modulo: "Alunos", descricao: "Cadastro de alunos e dados", acoes: { visualizar: true, criar: true, editar: true } },
      { modulo: "Financeiro", descricao: "Ofertas e relatórios", acoes: { visualizar: true, criar: true, editar: true } },
      { modulo: "Configurações", descricao: "Usuários e parâmetros", acoes: { visualizar: true, editar: true } },
    ],
  },
  {
    id: "p3",
    nome: "Secretário de Campo",
    descricao: "Gestão completa do campo; seleciona igreja para operação local",
    permissoes: [
      { modulo: "Dashboard", descricao: "Indicadores e painéis", acoes: { visualizar: true } },
      { modulo: "Lições", descricao: "Cadastro e acompanhamento", acoes: { visualizar: true, aprovar: true } },
      { modulo: "Turmas", descricao: "Estrutura das classes", acoes: { visualizar: true } },
      { modulo: "Alunos", descricao: "Cadastro de alunos e dados", acoes: { visualizar: true } },
      { modulo: "Financeiro", descricao: "Ofertas e relatórios", acoes: { visualizar: true, aprovar: true } },
      { modulo: "Configurações", descricao: "Usuários e parâmetros", acoes: { visualizar: true } },
    ],
  },
  {
    id: "p4",
    nome: "Professor",
    descricao: "Frequência, ofertas e acompanhamento apenas da turma vinculada",
    permissoes: [
      { modulo: "Dashboard", descricao: "Indicadores e painéis", acoes: { visualizar: true } },
      { modulo: "Lições", descricao: "Cadastro e acompanhamento", acoes: { visualizar: true, editar: true } },
      { modulo: "Turmas", descricao: "Estrutura das classes", acoes: { visualizar: true } },
      { modulo: "Alunos", descricao: "Cadastro de alunos e dados", acoes: { visualizar: true, editar: true } },
      { modulo: "Financeiro", descricao: "Ofertas e relatórios", acoes: { visualizar: true } },
      { modulo: "Configurações", descricao: "Usuários e parâmetros", acoes: { visualizar: true } },
    ],
  },
];

function cloneModulos(modulos: PermissaoModulo[]) {
  return modulos.map((modulo) => ({ ...modulo, acoes: { ...modulo.acoes } }));
}

function clonePerfis(perfis: PerfilPermissao[]) {
  return perfis.map((perfil) => ({ ...perfil, permissoes: cloneModulos(perfil.permissoes) }));
}

function contarAcoesAtivas(modulos: PermissaoModulo[]) {
  return modulos.reduce((total, modulo) => total + Object.values(modulo.acoes).filter(Boolean).length, 0);
}

function montarResumoMudancas(modulosAtuais: PermissaoModulo[], modulosReferencia: PermissaoModulo[]) {
  const mudancas: string[] = [];
  const refPorModulo = new Map(modulosReferencia.map((m) => [m.modulo, m]));

  modulosAtuais.forEach((moduloAtual) => {
    const referencia = refPorModulo.get(moduloAtual.modulo);
    if (!referencia) return;
    acoesPadrao.forEach((acao) => {
      if (moduloAtual.acoes[acao] === undefined || referencia.acoes[acao] === undefined) return;
      const atual = Boolean(moduloAtual.acoes[acao]);
      const ref = Boolean(referencia.acoes[acao]);
      if (atual !== ref) {
        mudancas.push(`${atual ? "+" : "-"} ${labelsAcoes[acao]} em ${moduloAtual.modulo}`);
      }
    });
  });

  return mudancas;
}

export default function PerfisPermissoes() {
  const [search, setSearch] = useState("");
  const [escopoSelecionadoId, setEscopoSelecionadoId] = useState("campo");
  const [perfis, setPerfis] = useState<PerfilPermissao[]>(clonePerfis(perfisIniciais));
  const [perfilSelecionadoId, setPerfilSelecionadoId] = useState(perfisIniciais[0].id);
  const [overrides, setOverrides] = useState<ScopeOverrides>({});
  const [somenteMudancas, setSomenteMudancas] = useState(false);

  const escoposCampo = escopos.filter((escopo) => escopo.tipo === "campo");
  const escoposIgreja = escopos.filter((escopo) => escopo.tipo === "igreja");
  const escopoSelecionado = escopos.find((escopo) => escopo.id === escopoSelecionadoId) ?? escopos[0];
  const perfilSelecionado = perfis.find((perfil) => perfil.id === perfilSelecionadoId) ?? perfis[0];

  const permissoesBase = perfilSelecionado.permissoes;
  const scopeOverrides = overrides[escopoSelecionadoId]?.[perfilSelecionado.id] ?? {};

  const permissoesAtuais = useMemo(() => {
    return permissoesBase.map((modulo) => {
      if (escopoSelecionado.tipo === "campo") return modulo;
      const overrideDoModulo = scopeOverrides[modulo.modulo];
      if (!overrideDoModulo) return modulo;
      return { ...modulo, acoes: { ...modulo.acoes, ...overrideDoModulo } };
    });
  }, [escopoSelecionado.tipo, permissoesBase, scopeOverrides]);

  const mudancasAtuais = useMemo(() => {
    if (escopoSelecionado.tipo === "campo") {
      const perfilInicial = perfisIniciais.find((perfil) => perfil.id === perfilSelecionado.id);
      if (!perfilInicial) return [];
      return montarResumoMudancas(permissoesAtuais, perfilInicial.permissoes);
    }
    return montarResumoMudancas(permissoesAtuais, permissoesBase);
  }, [escopoSelecionado.tipo, perfilSelecionado.id, permissoesAtuais, permissoesBase]);

  const permissoesFiltradas = permissoesAtuais.filter((modulo) => {
    const termo = search.toLowerCase();
    const bateBusca = modulo.modulo.toLowerCase().includes(termo) || modulo.descricao.toLowerCase().includes(termo);
    if (!bateBusca) return false;
    if (!somenteMudancas) return true;
    return mudancasAtuais.some((mudanca) => mudanca.includes(`em ${modulo.modulo}`));
  });

  function atualizarPermissaoPerfil(moduloNome: string, acao: AcaoPermissao, checked: boolean) {
    if (escopoSelecionado.tipo === "campo") {
      setPerfis((estadoAtual) =>
        estadoAtual.map((perfil) => {
          if (perfil.id !== perfilSelecionado.id) return perfil;
          return {
            ...perfil,
            permissoes: perfil.permissoes.map((modulo) => {
              if (modulo.modulo !== moduloNome) return modulo;
              return { ...modulo, acoes: { ...modulo.acoes, [acao]: checked } };
            }),
          };
        }),
      );
      return;
    }

    setOverrides((estadoAtual) => ({
      ...estadoAtual,
      [escopoSelecionadoId]: {
        ...(estadoAtual[escopoSelecionadoId] ?? {}),
        [perfilSelecionado.id]: {
          ...(estadoAtual[escopoSelecionadoId]?.[perfilSelecionado.id] ?? {}),
          [moduloNome]: {
            ...(estadoAtual[escopoSelecionadoId]?.[perfilSelecionado.id]?.[moduloNome] ?? {}),
            [acao]: checked,
          },
        },
      },
    }));
  }

  function sobrescreverModulo(moduloNome: string) {
    const moduloBase = permissoesBase.find((m) => m.modulo === moduloNome);
    if (!moduloBase || escopoSelecionado.tipo === "campo") return;

    setOverrides((estadoAtual) => ({
      ...estadoAtual,
      [escopoSelecionadoId]: {
        ...(estadoAtual[escopoSelecionadoId] ?? {}),
        [perfilSelecionado.id]: {
          ...(estadoAtual[escopoSelecionadoId]?.[perfilSelecionado.id] ?? {}),
          [moduloNome]: { ...moduloBase.acoes },
        },
      },
    }));
  }

  function voltarAHerdar(moduloNome: string) {
    if (escopoSelecionado.tipo === "campo") return;

    setOverrides((estadoAtual) => {
      const scopeMap = estadoAtual[escopoSelecionadoId];
      const profileMap = scopeMap?.[perfilSelecionado.id];
      if (!profileMap || !profileMap[moduloNome]) return estadoAtual;

      const novoProfileMap = { ...profileMap };
      delete novoProfileMap[moduloNome];

      return {
        ...estadoAtual,
        [escopoSelecionadoId]: {
          ...(scopeMap ?? {}),
          [perfilSelecionado.id]: novoProfileMap,
        },
      };
    });
  }

  function resetarContexto() {
    if (escopoSelecionado.tipo === "campo") {
      setPerfis(clonePerfis(perfisIniciais));
      return;
    }

    setOverrides((estadoAtual) => {
      const novoEstado = { ...estadoAtual };
      if (novoEstado[escopoSelecionadoId]?.[perfilSelecionado.id]) {
        const novoEscopo = { ...novoEstado[escopoSelecionadoId] };
        delete novoEscopo[perfilSelecionado.id];
        novoEstado[escopoSelecionadoId] = novoEscopo;
      }
      return novoEstado;
    });
  }

  const corEscopo = escopoSelecionado.tipo === "campo" ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-emerald-100 text-emerald-800 border-emerald-200";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Perfis e permissões</h1>
        <p className="text-sm text-muted-foreground">
          Painel de gestão para Administrador Geral com visão completa de campo e igrejas.
        </p>
      </div>

      <Card className={`border ${corEscopo}`}>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            <p className="text-sm font-medium">
              Escopo atual: {escopoSelecionado.tipo === "campo" ? "Campo" : "Igreja"} · {escopoSelecionado.nome}
            </p>
          </div>
          <Badge variant="outline">
            Modo Administrador Geral
          </Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Árvore de escopo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Campo</p>
            {escoposCampo.map((escopo) => {
              const ativo = escopo.id === escopoSelecionadoId;
              return (
                <button
                  key={escopo.id}
                  type="button"
                  onClick={() => setEscopoSelecionadoId(escopo.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    ativo ? "border-primary bg-accent" : "hover:bg-muted/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-blue-700" />
                    <p className="text-sm font-medium">{escopo.nome}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Base de herança</p>
                </button>
              );
            })}
            <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Igrejas ({escoposIgreja.length})
            </p>
            {escoposIgreja.map((escopo) => {
              const ativo = escopo.id === escopoSelecionadoId;
              return (
                <button
                  key={escopo.id}
                  type="button"
                  onClick={() => setEscopoSelecionadoId(escopo.id)}
                  className={`ml-5 w-[calc(100%-1.25rem)] rounded-lg border p-3 text-left transition-colors ${
                    ativo ? "border-primary bg-accent" : "hover:bg-muted/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-emerald-700" />
                    <p className="text-sm font-medium">{escopo.nome}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pode customizar permissões
                  </p>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base">Perfil em edição</CardTitle>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={resetarContexto}>Resetar contexto</Button>
                  <Button size="sm" className="w-full sm:w-auto">Salvar alterações</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 md:grid-cols-2">
                {perfis.map((perfil) => {
                  const ativo = perfil.id === perfilSelecionado.id;
                  return (
                    <button
                      key={perfil.id}
                      type="button"
                      onClick={() => setPerfilSelecionadoId(perfil.id)}
                      className={`rounded-lg border p-3 text-left transition-colors ${
                        ativo ? "border-primary bg-accent" : "hover:bg-muted/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{perfil.nome}</p>
                        <Badge variant={ativo ? "default" : "secondary"}>
                          {contarAcoesAtivas(perfil.permissoes)} ações
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{perfil.descricao}</p>
                    </button>
                  );
                })}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-10 touch-target"
                  placeholder="Buscar módulo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div>
                <Button
                  size="sm"
                  variant={somenteMudancas ? "default" : "outline"}
                  className="w-full sm:w-auto"
                  onClick={() => setSomenteMudancas((atual) => !atual)}
                >
                  {somenteMudancas ? "Mostrando só mudanças" : "Mostrar só módulos alterados"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Matriz de permissões</CardTitle>
            </CardHeader>
            <CardContent>
              {permissoesFiltradas.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Nenhum módulo encontrado para a busca atual.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Módulo</TableHead>
                      {acoesPadrao.map((acao) => (
                        <TableHead key={acao}>{labelsAcoes[acao]}</TableHead>
                      ))}
                      <TableHead>Herança</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissoesFiltradas.map((modulo) => {
                      const moduloBase = permissoesBase.find((m) => m.modulo === modulo.modulo);
                      const customizado = escopoSelecionado.tipo === "igreja" && Boolean(scopeOverrides[modulo.modulo]);
                      return (
                        <TableRow key={modulo.modulo}>
                          <TableCell>
                            <p className="font-medium">{modulo.modulo}</p>
                            <p className="text-xs text-muted-foreground">{modulo.descricao}</p>
                          </TableCell>
                          {acoesPadrao.map((acao) => {
                            const disponivel = modulo.acoes[acao] !== undefined;
                            if (!disponivel) {
                              return <TableCell key={`${modulo.modulo}-${acao}`} className="text-muted-foreground">—</TableCell>;
                            }
                            return (
                              <TableCell key={`${modulo.modulo}-${acao}`}>
                                <Switch
                                  checked={Boolean(modulo.acoes[acao])}
                                  onCheckedChange={(checked) => atualizarPermissaoPerfil(modulo.modulo, acao, checked)}
                                />
                              </TableCell>
                            );
                          })}
                          <TableCell>
                            {escopoSelecionado.tipo === "campo" ? (
                              <Badge variant="outline">Origem</Badge>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Badge variant={customizado ? "default" : "secondary"}>
                                  {customizado ? "Customizado" : "Herdado"}
                                </Badge>
                                {customizado ? (
                                  <Button variant="ghost" size="sm" onClick={() => voltarAHerdar(modulo.modulo)}>
                                    Voltar a herdar
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (moduloBase) sobrescreverModulo(modulo.modulo);
                                    }}
                                  >
                                    Sobrescrever
                                  </Button>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Resumo antes de salvar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Você está alterando: Administrador Geral &gt; {escopoSelecionado.nome} &gt; {perfilSelecionado.nome}
              </p>
              {mudancasAtuais.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma mudança pendente neste contexto.</p>
              ) : (
                <div className="rounded-lg border p-3">
                  {mudancasAtuais.map((mudanca) => (
                    <p key={mudanca} className="text-sm">{mudanca}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
