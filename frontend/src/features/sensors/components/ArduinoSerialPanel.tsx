import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Cable, CircleStop, Usb } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart as ReLineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { configureArduino } from "@/api/endpoints";
import type { Plot, Sensor } from "@/api/types";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { arduinoSerial, type ArduinoReading } from "../arduinoSerial";
import { getArduinoIngestionSnapshot, setArduinoConfiguration, subscribeArduinoIngestion } from "../arduinoIngestion";
interface ChartPoint {
  time: string;
  label: string;
  moisture: number;
  temperature: number | null;
  flow: number;
}

const GRID = "#e1e7ec";
const TICK = "#5d727f";
const MAX_POINTS = 180;

function moisturePercent(raw: number, sensor?: Sensor): number | null {
  if (!sensor || sensor.dry_ref === null || sensor.wet_ref === null || sensor.dry_ref === sensor.wet_ref) return null;
  const percent = ((sensor.dry_ref - raw) / (sensor.dry_ref - sensor.wet_ref)) * 100;
  return Math.round(Math.max(0, Math.min(100, percent)) * 10) / 10;
}

function LiveMetric({ label, value, detail }: { label: string; value: string; detail: string }): React.JSX.Element {
  return <Card className="min-w-0 rounded-xl border-neutral-200 p-4 shadow-none">
    <p className="text-xs font-medium text-neutral-600">{label}</p>
    <p className="mt-1 truncate text-2xl font-semibold tabular-nums text-neutral-900">{value}</p>
    <p className="mt-1 truncate text-xs text-neutral-500">{detail}</p>
  </Card>;
}

function TrendCard({
  title,
  unit,
  color,
  data,
  dataKey,
  calibrated = true,
  maxReference,
}: {
  title: string;
  unit: string;
  color: string;
  data: ChartPoint[];
  dataKey: "moisture" | "temperature" | "flow";
  calibrated?: boolean;
  maxReference?: number;
}): React.JSX.Element {
  const points = data.filter((point) => point[dataKey] !== null);
  return <Card className="min-w-0 rounded-xl border-neutral-200 p-4 shadow-none">
    <div className="flex items-start justify-between gap-2">
      <div><h3 className="text-sm font-semibold text-neutral-900">{title}</h3><p className="mt-0.5 text-xs text-neutral-500">Últimos 3 minutos · {unit}</p></div>
      {!calibrated ? <span className="rounded-full bg-warning-50 px-2 py-1 text-[10px] font-medium text-warning-700">Sin calibrar</span> : null}
    </div>
    {points.length < 2 ? <div className="grid h-44 place-items-center text-xs text-neutral-500">Conecta el Arduino para ver la tendencia.</div> :
      <div className="mt-3 h-44" role="img" aria-label={`Tendencia de ${title} durante los últimos tres minutos`}>
        <ResponsiveContainer width="100%" height="100%">
          <ReLineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="label" interval="preserveStartEnd" tick={{ fontSize: 10, fill: TICK }} tickLine={false} axisLine={{ stroke: GRID }} />
            <YAxis width={42} tick={{ fontSize: 10, fill: TICK }} tickLine={false} axisLine={false} />
            <Tooltip formatter={(value) => [`${Number(value).toFixed(1)} ${unit}`, title]} labelFormatter={(label) => `Hora: ${label}`} contentStyle={{ borderRadius: 8, borderColor: GRID, fontSize: 12 }} />
            {maxReference !== undefined ? <ReferenceLine y={maxReference} stroke="#A63B32" strokeDasharray="4 4" /> : null}
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} connectNulls={false} />
          </ReLineChart>
        </ResponsiveContainer>
      </div>}
    {maxReference !== undefined ? <p className="mt-1 text-[11px] text-neutral-500">Límite indicado para YF-S401: {maxReference} L/min</p> : null}
  </Card>;
}

export function ArduinoSerialPanel({ sensors, plots, load }: { sensors: Sensor[]; plots: Plot[]; load: () => Promise<unknown> }): React.JSX.Element {
  const connection = useSyncExternalStore(arduinoSerial.subscribe, arduinoSerial.getSnapshot, arduinoSerial.getSnapshot);
  const ingestion = useSyncExternalStore(subscribeArduinoIngestion, getArduinoIngestionSnapshot, getArduinoIngestionSnapshot);
  const [selectedPlotId, setSelectedPlotId] = useState(() => String(ingestion.configuration?.plot_id ?? ""));
  const [configuring, setConfiguring] = useState(false);
  const [configError, setConfigError] = useState("");
  const connected = connection.connected;
  const reading = connection.reading;
  const [history, setHistory] = useState<ChartPoint[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const lastRefreshRef = useRef(0);

  function handleReading(data: ArduinoReading): void {
    setError("");
    setMessage("Arduino conectado · recibiendo lecturas");
    const humiditySensor = sensors.find((sensor) => sensor.id === ingestion.configuration?.sensors.humedad);
    const percent = moisturePercent(data.humedad_raw, humiditySensor);
    const time = new Date(arduinoSerial.getSnapshot().lastReceivedAt ?? Date.now());
    const point: ChartPoint = {
      time: time.toISOString(),
      label: time.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      moisture: percent ?? data.humedad_raw,
      temperature: data.ds18_detectado ? data.temperatura_c : null,
      flow: data.caudal_l_min,
    };
    setHistory((current) => [...current, point].slice(-MAX_POINTS));

  }

  useEffect(() => arduinoSerial.subscribeReading(handleReading), [sensors, ingestion.configuration]);

  useEffect(() => {
    if (ingestion.savedCount > 0 && Date.now() - lastRefreshRef.current >= 15000) {
      lastRefreshRef.current = Date.now();
      void load();
    }
  }, [ingestion.savedCount, load]);

  async function configure(): Promise<void> {
    const targetPlotId = Number(selectedPlotId);
    if (!targetPlotId) return;
    setConfigError("");
    setConfiguring(true);
    try {
      const configuration = await configureArduino(targetPlotId);
      setArduinoConfiguration(configuration);
      setMessage("Arduino configurado · lecturas guardadas para la parcela seleccionada");
      await load();
    } catch (cause) {
      setConfigError(cause instanceof Error ? cause.message : "No se pudo configurar el Arduino para esta parcela.");
    } finally {
      setConfiguring(false);
    }
  }

  async function connect(): Promise<void> {
    setError("");
    setMessage("");
    setHistory([]);
    try {
      await arduinoSerial.connect();
      setMessage("Arduino conectado · recibiendo lecturas");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo conectar con el Arduino.");
    }
  }

  async function disconnect(): Promise<void> {
    setMessage("Arduino desconectado.");
    await arduinoSerial.disconnect();
  }

  const mappedHumidity = sensors.find((sensor) => sensor.id === ingestion.configuration?.sensors.humedad);
  const humidity = reading ? moisturePercent(reading.humedad_raw, mappedHumidity) : null;
  const hasWater = reading?.flotador === "Hay agua suficiente";
  const statusLabel = !connected ? connection.connecting ? "Conectando…" : "Desconectado" : connection.lastReceivedAt ? "Recibiendo datos" : "Puerto abierto";
  const lastUpdateLabel = connection.lastReceivedAt ? new Date(connection.lastReceivedAt).toLocaleTimeString("es-PE") : "Sin lecturas";
  const serialError = error || connection.error;

  return <section className="space-y-4" aria-labelledby="live-monitor-heading">
    <Card className="overflow-hidden rounded-2xl border-neutral-200 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700"><Usb size={19} aria-hidden="true" /></span>
          <div className="min-w-0">
            <h2 id="live-monitor-heading" className="font-semibold text-neutral-900">Monitoreo en vivo</h2>
            <p className="text-xs text-neutral-500">Arduino UNO · USB · 9600 baudios</p>
          </div>
          <span className={`ml-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${connected && connection.lastReceivedAt ? "bg-success-50 text-success-700" : connected || connection.connecting ? "bg-warning-50 text-warning-700" : "bg-neutral-100 text-neutral-600"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${connected && connection.lastReceivedAt ? "bg-success-600" : connected || connection.connecting ? "bg-warning-600" : "bg-neutral-400"}`} />{statusLabel}
          </span>
        </div>
        {connected ? <Button variant="outline" size="sm" onClick={() => void disconnect()}><CircleStop size={15} aria-hidden="true" />Desconectar</Button> : <Button size="sm" onClick={() => void connect()} disabled={connection.connecting}><Cable size={15} aria-hidden="true" />{connection.connecting ? "Conectando…" : "Conectar Arduino"}</Button>}
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <div className={`rounded-xl border p-4 ${reading ? hasWater ? "border-success-100 bg-success-50" : "border-danger-100 bg-danger-50" : "border-neutral-200 bg-neutral-50"}`}>
            <p className="text-xs font-medium text-neutral-600">Agua en el recipiente</p>
            <p className={`mt-1 text-base font-semibold ${reading ? hasWater ? "text-success-800" : "text-danger-700" : "text-neutral-700"}`}>{reading ? hasWater ? "Hay agua suficiente" : "No hay suficiente agua" : "Esperando flotador"}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs font-medium text-neutral-600">Bomba</p>
            <p className="mt-1 text-base font-semibold text-neutral-900">{reading ? reading.bomba ? "Encendida" : "Apagada" : "—"}</p>
            <p className="mt-1 text-xs text-neutral-500">Estado reportado por el Arduino</p>
          </div>
          <LiveMetric label="Humedad del suelo" value={reading ? humidity !== null ? `${humidity.toFixed(1)} %` : `${reading.humedad_raw} ADC` : "—"} detail={reading ? humidity !== null ? "Capacitivo V1.2 · calibrado" : "Capacitivo V1.2 · falta calibración" : "Capacitivo V1.2"} />
          <LiveMetric label="Temperatura de tierra" value={reading?.ds18_detectado && reading.temperatura_c !== null ? `${reading.temperatura_c.toFixed(1)} °C` : reading ? "No detectado" : "—"} detail="DS18B20 impermeable" />
          <LiveMetric label="Caudal" value={reading ? `${reading.caudal_l_min.toFixed(2)} L/min` : "—"} detail={reading && reading.caudal_l_min > 6 ? "Supera el rango indicado · revisar calibración" : "YF-S401 · rango indicado hasta 6 L/min"} />
          <LiveMetric label="Volumen acumulado" value={reading ? `${reading.volumen_l.toFixed(3)} L` : "—"} detail="Desde el último reinicio del Arduino" />
        </div>

        {serialError ? <p role="alert" className="rounded-lg border border-danger-100 bg-danger-50 px-3 py-2 text-sm text-danger-700">{serialError}</p> : null}
        {ingestion.error ? <p role="alert" className="rounded-lg border border-danger-100 bg-danger-50 px-3 py-2 text-sm text-danger-700">No se pudo guardar una lectura: {ingestion.error}</p> : null}
        {message ? <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500"><p role="status">{message}</p><span>Último dato: {lastUpdateLabel}{ingestion.savedCount ? ` · ${ingestion.savedCount} lecturas guardadas` : ""}</span></div> : null}

        <details className="group rounded-xl border border-neutral-200">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-neutral-800 [&::-webkit-details-marker]:hidden">Ver tendencias <span className="ml-1 text-xs font-normal text-neutral-500">Últimos 3 minutos</span></summary>
          <div className="grid gap-3 border-t border-neutral-200 p-3 xl:grid-cols-3">
          <TrendCard title="Humedad del suelo" unit={humidity !== null ? "%" : "ADC"} color="#087F8C" data={history} dataKey="moisture" calibrated={humidity !== null} />
          <TrendCard title="Temperatura de tierra" unit="°C" color="#207C63" data={history} dataKey="temperature" />
          <TrendCard title="Caudal" unit="L/min" color="#0B6672" data={history} dataKey="flow" maxReference={6} />
          </div>
        </details>

        <details className="group rounded-xl border border-primary-200 bg-primary-50/40">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-neutral-800 [&::-webkit-details-marker]:hidden">
            <span><span className="block font-semibold">Parcela de la maqueta</span><span className="mt-0.5 block text-xs font-normal text-neutral-600">{ingestion.configuration ? `Configurado · ${plots.find((plot) => plot.id === ingestion.configuration?.plot_id)?.name ?? `parcela #${ingestion.configuration.plot_id}`}` : "Selecciona dónde guardar las lecturas"}</span></span><span className="shrink-0 text-xs font-medium text-primary-700">{ingestion.configuration ? "Cambiar" : "Configurar"}</span>
          </summary>
          <div className="space-y-3 border-t border-primary-200 p-4">
            <p className="text-sm leading-relaxed text-neutral-700">Vincula automáticamente los cinco componentes físicos a esta parcela. Solo necesitas configurarlo una vez.</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label htmlFor="arduino-plot" className="grid flex-1 gap-1 text-xs font-medium text-neutral-700">Parcela de la maqueta<select id="arduino-plot" disabled={connected || configuring} value={selectedPlotId} onChange={(event) => setSelectedPlotId(event.target.value)} className="min-h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm disabled:bg-neutral-100"><option value="">Selecciona una parcela</option>{plots.map((plot) => <option key={plot.id} value={plot.id}>{plot.name}</option>)}</select></label>
              <Button variant="outline" onClick={() => void configure()} disabled={connected || configuring || !selectedPlotId}>{configuring ? "Configurando…" : ingestion.configuration?.plot_id === Number(selectedPlotId) ? "Actualizar configuración" : "Configurar Arduino"}</Button>
            </div>
            {!ingestion.configuration ? <p className="text-xs text-warning-700">Sin esta asignación, los datos se muestran en vivo pero no se guardan.</p> : null}
            <p className="text-xs text-neutral-600">La humedad requiere calibración antes de usarse en recomendaciones.</p>
            {configError ? <p role="alert" className="text-sm text-danger-700">{configError}</p> : null}
          </div>
        </details>
      </div>
    </Card>
    <p className="px-1 text-xs text-neutral-500">Conecta el Arduino por USB y mantén YakuAI abierto para recibir y guardar lecturas.</p>
  </section>;
}
