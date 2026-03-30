import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Search, ShieldCheck, KeyRound, Boxes, Plus } from "lucide-react";

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

const acoesPadrao: AcaoPermissao[] = ["visualizar", "criar", "editar", "excluir", "aprovar"];

const labelsAcoes: Record<AcaoPermissao, string> = {
  visualizar: "Visualizar",
  criar: "Criar",
  editar: "Editar",
  excluir: "Excluir",
  aprovar: "Aprovar",
};

const perfisIniciais: PerfilPermissao[] = [
  {
    id: "p1",
    nome: "Administrador",
    descricao: "Acesso completo ao sistema",
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
    descricao: "Gestão operacional da igreja local",
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
    descricao: "Acompanha múltiplas organizações",
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
    descricao: "Registro de frequência e acompanhamento da turma",
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
  return modulos.map((modulo) => ({
    ...modulo,
    acoes: { ...modulo.acoes },
  }));
}

function contarAcoesAtivas(modulos: PermissaoModulo[]) {
  return modulos.reduce((total, modulo) => {
    return total + Object.values(modulo.acoes).filter(Boolean).length;
  }, 0);
}

export default function PerfisPermissoes() {
  const [search, setSearch] = useState("");
  const [perfis, setPerfis] = useState<PerfilPermissao[]>(
    perfisIniciais.map((perfil) => ({ ...perfil, permissoes: cloneModulos(perfil.permissoes) })),
  );
  const [perfilSelecionadoId, setPerfilSelecionadoId] = useState(perfisIniciais[0].id);

  const perfilSelecionado = perfis.find((perfil) => perfil.id === perfilSelecionadoId) ?? perfis[0];

  const permissoesFiltradas = perfilSelecionado.permissoes.filter(
    (modulo) =>
      modulo.modulo.toLowerCase().includes(search.toLowerCase())
      || modulo.descricao.toLowerCase().includes(search.toLowerCase()),
  );

  function atualizarPerfilAtual(campo: "nome" | "descricao", valor: string) {
    setPerfis((estadoAtual) =>
      estadoAtual.map((perfil) => {
        if (perfil.id !== perfilSelecionado.id) return perfil;
        return { ...perfil, [campo]: valor };
      }),
    );
  }

  function atualizarPermissaoPerfil(moduloNome: string, acao: AcaoPermissao, checked: boolean) {
    setPerfis((estadoAtual) =>
      estadoAtual.map((perfil) => {
        if (perfil.id !== perfilSelecionado.id) return perfil;

        return {
          ...perfil,
          permissoes: perfil.permissoes.map((modulo) => {
            if (modulo.modulo !== moduloNome) return modulo;
            return {
              ...modulo,
              acoes: { ...modulo.acoes, [acao]: checked },
            };
          }),
        };
      }),
    );
  }

  function resetarPerfilSelecionado() {
    const perfilInicial = perfisIniciais.find((perfil) => perfil.id === perfilSelecionado.id);
    if (!perfilInicial) return;

    setPerfis((estadoAtual) =>
      estadoAtual.map((perfil) => {
        if (perfil.id !== perfilSelecionado.id) return perfil;
        return { ...perfilInicial, permissoes: cloneModulos(perfilInicial.permissoes) };
      }),
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Perfis e permissões</h1>
        <p className="text-sm text-muted-foreground">
          Defina perfis de acesso. Em um cenário SaaS, estes perfis podem ser aplicados por campo e organizações.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-10 touch-target"
          placeholder="Buscar módulo ou permissão..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold">{perfis.length}</p>
              <p className="text-xs text-muted-foreground">Perfis cadastrados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <KeyRound className="h-5 w-5 text-success" />
            <div>
              <p className="text-xl font-bold">{contarAcoesAtivas(perfilSelecionado.permissoes)}</p>
              <p className="text-xs text-muted-foreground">Ações ativas no perfil</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Boxes className="h-5 w-5 text-warning" />
            <div>
              <p className="text-xl font-bold">{perfilSelecionado.permissoes.length}</p>
              <p className="text-xs text-muted-foreground">Módulos monitorados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Plus className="h-5 w-5 text-secondary" />
            <div>
              <p className="text-xl font-bold">1</p>
              <p className="text-xs text-muted-foreground">Perfil em edição</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid xl:grid-cols-[320px_1fr] gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Perfis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {perfis.map((perfil) => {
              const ativo = perfil.id === perfilSelecionado.id;

              return (
                <button
                  key={perfil.id}
                  type="button"
                  onClick={() => setPerfilSelecionadoId(perfil.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">Editar perfil</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="touch-target" onClick={resetarPerfilSelecionado}>
                  Resetar
                </Button>
                <Button size="sm" className="touch-target">Salvar alterações</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Nome do perfil</label>
                <Input
                  value={perfilSelecionado.nome}
                  onChange={(e) => atualizarPerfilAtual("nome", e.target.value)}
                  className="touch-target"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Descrição</label>
                <Input
                  value={perfilSelecionado.descricao}
                  onChange={(e) => atualizarPerfilAtual("descricao", e.target.value)}
                  className="touch-target"
                />
              </div>
            </div>

            {permissoesFiltradas.map((modulo) => (
              <div key={modulo.modulo} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{modulo.modulo}</p>
                    <p className="text-xs text-muted-foreground">{modulo.descricao}</p>
                  </div>
                  <Badge variant="outline">
                    {Object.values(modulo.acoes).filter(Boolean).length} ações
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
                  {acoesPadrao.map((acao) => {
                    const possuiAcao = modulo.acoes[acao] !== undefined;
                    if (!possuiAcao) {
                      return (
                        <div key={`${modulo.modulo}-${acao}`} className="rounded-md border bg-muted/40 p-2 text-center text-xs text-muted-foreground">
                          {labelsAcoes[acao]}: —
                        </div>
                      );
                    }

                    return (
                      <label key={`${modulo.modulo}-${acao}`} className="flex items-center justify-between rounded-md border p-2 text-xs">
                        <span>{labelsAcoes[acao]}</span>
                        <Switch
                          checked={Boolean(modulo.acoes[acao])}
                          onCheckedChange={(checked) => atualizarPermissaoPerfil(modulo.modulo, acao, checked)}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            {permissoesFiltradas.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nenhum módulo encontrado para a busca atual.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
