import { useMemo } from "react";

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  unit?: string;
}

export function LineChart({
  data,
  height = 200,
  color = "#386c50",
  unit = "",
}: LineChartProps): React.JSX.Element {
  const { points, min, max } = useMemo(() => {
    if (data.length === 0) {
      return { points: "", min: 0, max: 0 };
    }

    const values = data.map((d) => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const width = 100;
    const padding = 5;
    const chartHeight = height - 40;

    const points = data
      .map((d, i) => {
        const x = padding + (i / Math.max(data.length - 1, 1)) * (width - 2 * padding);
        const y = chartHeight - ((d.value - minVal) / range) * (chartHeight - 20);
        return `${x},${y}`;
      })
      .join(" ");

    return { points, min: minVal, max: maxVal };
  }, [data, height]);

  if (data.length === 0) {
    return <p className="muted small">Sin datos para graficar.</p>;
  }

  return (
    <div className="chart-container">
      <svg
        viewBox={`0 0 100 ${height}`}
        className="line-chart"
        role="img"
        aria-label={`Gráfico de línea con ${data.length} puntos`}
      >
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((d, i) => {
          const values = data.map((item) => item.value);
          const minVal = Math.min(...values);
          const maxVal = Math.max(...values);
          const range = maxVal - minVal || 1;
          const width = 100;
          const padding = 5;
          const chartHeight = height - 40;
          const x = padding + (i / Math.max(data.length - 1, 1)) * (width - 2 * padding);
          const y = chartHeight - ((d.value - minVal) / range) * (chartHeight - 20);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="1"
              fill={color}
            >
              <title>{`${d.label}: ${d.value}${unit}`}</title>
            </circle>
          );
        })}
      </svg>
      <div className="chart-labels">
        <span>{`${min}${unit}`}</span>
        <span>{`${max}${unit}`}</span>
      </div>
    </div>
  );
}
