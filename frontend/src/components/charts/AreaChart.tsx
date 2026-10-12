import {
  Area,
  AreaChart as ReAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "./LineChart";

const GRID = "#e1e7ec";
const TICK = "#5d727f";

export function AreaChart({
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
  const gid = `yk-area-${color.replace("#", "")}`;
  return (
    <div
      style={{ height }}
      role="img"
      aria-label={`Gráfico de área con ${data.length} puntos${unit ? ` en ${unit}` : ""}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ReAreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
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
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gid})`}
            dot={{ r: 3, fill: color }}
            activeDot={{ r: 5 }}
          />
        </ReAreaChart>
      </ResponsiveContainer>
    </div>
  );
}