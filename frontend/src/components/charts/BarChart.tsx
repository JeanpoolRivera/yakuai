import {
  Bar,
  BarChart as ReBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "./LineChart";

const GRID = "#e1e7ec";
const TICK = "#5d727f";

export function BarChart({
  data,
  height = 200,
  color = "#207c63",
  unit = "",
}: {
  data: ChartPoint[];
  height?: number;
  color?: string;
  unit?: string;
}): React.JSX.Element {
  if (data.length === 0) {
    return <p className="text-sm text-neutral-500">Sin datos para graficar.</p>;
  }
  return (
    <div
      style={{ height }}
      role="img"
      aria-label={`Gráfico de barras con ${data.length} puntos${unit ? ` en ${unit}` : ""}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: TICK }}
            tickLine={false}
            axisLine={{ stroke: GRID }}
          />
          <YAxis tick={{ fontSize: 11, fill: TICK }} tickLine={false} axisLine={false} />
          <Tooltip
            formatter={(value) => [`${value}${unit}`, "Valor"]}
            contentStyle={{ borderRadius: 8, borderColor: GRID, fontSize: 12 }}
          />
          <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} maxBarSize={48} />
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}