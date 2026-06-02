import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { monthLabel } from "@/lib/portalApi";

type EvolutionPoint = { mes: string; valor: number };
type BarPoint = { label: string; valor: number; fill?: string };

const FINANCE_BAR_FILL = "hsl(207, 79%, 33%)";

export function FinanceEvolutionChart({
  title,
  data,
}: {
  title: string;
  data: EvolutionPoint[];
}) {
  const chartData = data.map((d) => ({
    mes: monthLabel(d.mes),
    valor: d.valor,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Line type="monotone" dataKey="valor" stroke="hsl(207,79%,33%)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function FinanceBarChart({
  title,
  data,
}: {
  title: string;
  data: BarPoint[];
}) {
  const chartData = data.map((d) => ({
    label: d.label.length > 10 ? `${d.label.slice(0, 10)}…` : d.label,
    valor: d.valor,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Bar dataKey="valor" fill={FINANCE_BAR_FILL} radius={[4, 4, 0, 0]}>
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry.fill ?? FINANCE_BAR_FILL} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function FinanceKpiGrid({
  items,
}: {
  items: Array<{ label: string; value: string; icon: React.ReactNode; accent?: string }>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((kpi) => (
        <Card key={kpi.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={kpi.accent}>{kpi.icon}</div>
            <div>
              <p className="text-xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
