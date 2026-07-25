import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileTableWrap } from "@/components/ui/mobile-table-wrap";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarRange, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { licoesTrimestrePath } from "@/lib/licoesRoutes";
import { TrimestresPageSkeleton } from "@/components/skeletons";
import { orgQueryKey, usePermissions } from "@/auth/usePermissions";
import { podeGerenciarTrimestres } from "@/lib/chamada";
import { createTrimestre, deleteTrimestre, fetchTrimestres, type Trimestre, updateTrimestre } from "@/lib/portalApi";

type FormState = {
  dataInicio: string;
  dataFim: string;
  quantidadeLicoes: number;
};

const initialForm: FormState = {
  dataInicio: "",
  dataFim: "",
  quantidadeLicoes: 13,
};

const statusLabel: Record<Trimestre["status"], string> = {
  PLANEJADO: "Planejado",
  EM_ANDAMENTO: "Em andamento",
  ENCERRADO: "Encerrado",
};

function deriveNumeroEAno(dataInicio: string, fallback?: { numero: number; ano: number }) {
  if (!dataInicio) {
    return fallback ?? { numero: 1, ano: new Date().getFullYear() };
  }
  const data = new Date(`${dataInicio}T12:00:00`);
  const mes = data.getMonth() + 1;
  const numero = Math.min(4, Math.max(1, Math.ceil(mes / 3)));
  return { numero, ano: data.getFullYear() };
}

export default function Trimestres() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeOrgId, podeCarregarOperacional, isAdminSistema, hasRole } = usePermissions();
  const podeGerenciar = podeGerenciarTrimestres({ isAdminSistema, hasRole });
  const { data: trimestres = [], isLoading } = useQuery({
    queryKey: orgQueryKey(activeOrgId, "trimestres"),
    queryFn: () => fetchTrimestres(),
    enabled: podeCarregarOperacional && podeGerenciar,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Trimestre | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  const createMutation = useMutation({
    mutationFn: createTrimestre,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trimestres"] }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { numero: number; ano: number } & FormState }) =>
      updateTrimestre(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trimestres"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteTrimestre,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trimestres"] }),
  });

  const estatisticas = useMemo(() => {
    return {
      total: trimestres.length,
      planejados: trimestres.filter((item) => item.status === "PLANEJADO").length,
      andamento: trimestres.filter((item) => item.status === "EM_ANDAMENTO").length,
      encerrados: trimestres.filter((item) => item.status === "ENCERRADO").length,
    };
  }, [trimestres]);

  function openCreate() {
    setEditing(null);
    setForm(initialForm);
    setIsDialogOpen(true);
  }

  function openEdit(item: Trimestre) {
    setEditing(item);
    setForm({
      dataInicio: item.dataInicio ?? "",
      dataFim: item.dataFim ?? "",
      quantidadeLicoes: item.quantidadeLicoes ?? 13,
    });
    setIsDialogOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { numero, ano } = deriveNumeroEAno(
      form.dataInicio,
      editing ? { numero: editing.numero, ano: editing.ano } : undefined,
    );

    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, payload: { ...form, numero, ano } });
    } else {
      await createMutation.mutateAsync({ ...form, numero, ano });
    }
    setIsDialogOpen(false);
  }

  if (!podeGerenciar) {
    return <Navigate to="/licoes" replace />;
  }

  if (isLoading) {
    return <TrimestresPageSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" className="touch-target shrink-0" onClick={() => navigate("/licoes")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Gerenciar trimestres</h1>
            <p className="text-sm text-muted-foreground">
              Cadastre períodos, datas e quantidade de lições de cada trimestre.
            </p>
          </div>
        </div>
        <Button className="w-full sm:w-auto" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Trimestre
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{estatisticas.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Planejados</p><p className="text-2xl font-bold">{estatisticas.planejados}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Em andamento</p><p className="text-2xl font-bold">{estatisticas.andamento}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Encerrados</p><p className="text-2xl font-bold">{estatisticas.encerrados}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Lista de Trimestres</CardTitle>
        </CardHeader>
        <CardContent>
          {trimestres.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhum trimestre cadastrado.
            </div>
          ) : (
            <MobileTableWrap minWidthClass="min-w-[36rem]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trimestre</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Qtd. Lições</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trimestres.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => navigate(licoesTrimestrePath(item.ano, item.numero))}
                  >
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center gap-2">
                        {item.numero}º/{item.ano}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.dataInicio ? formatDate(item.dataInicio) : "—"} até{" "}
                      {item.dataFim ? formatDate(item.dataFim) : "—"}
                    </TableCell>
                    <TableCell>{item.quantidadeLicoes}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === "ENCERRADO" ? "secondary" : item.status === "EM_ANDAMENTO" ? "default" : "outline"}>
                        {statusLabel[item.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(item);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(item.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </MobileTableWrap>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Trimestre" : "Novo Trimestre"}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data início</Label>
                <Input
                  type="date"
                  value={form.dataInicio}
                  onChange={(e) => setForm((prev) => ({ ...prev, dataInicio: e.target.value }))}
                />
              </div>
              <div>
                <Label>Data fim</Label>
                <Input
                  type="date"
                  value={form.dataFim}
                  onChange={(e) => setForm((prev) => ({ ...prev, dataFim: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Quantidade de lições</Label>
              <Input
                type="number"
                min={1}
                max={52}
                value={form.quantidadeLicoes}
                onChange={(e) => setForm((prev) => ({ ...prev, quantidadeLicoes: Number(e.target.value || 13) }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                <CalendarRange className="mr-2 h-4 w-4" />
                {editing ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
