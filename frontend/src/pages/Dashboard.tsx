/* Resumen del día (técnico/admin): KPIs, alertas y últimas evaluaciones. */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { friendlyError } from "../api/client";
import { listAlerts, listEvaluations, listPlots, listSensors, getMetricsSummary } from "../api/endpoints";
import type { AlertItem, Evaluation } from "../api/types";
import {
  PageHead,
  DataTable,
  Badge,
  Banner,
  Card,
  Empty,
  Icon,
  Skeletons,
  Stat,
} from "../components/ui";
import { ageLabel, badgeToneForResult, fmtDateTime, fmtNum, resultLabel, todayLong } from "../lib/format";

export function Dashboard(): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plots, setPlots] = useState(0);
  const [sensorsOk, setSensorsOk] = useState(0);
  const [sensorsTotal, setSensorsTotal] = useState(0);
  const [piden, setPiden] = useState(0);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [recent, setRecent] = useState<Evaluation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  async function load(isRefresh = false): Promise<void> {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [p, s, a, e, m] = await Promise.all([
        listPlots(),
        listSensors(),
        listAlerts(),
        listEvaluations(),
        getMetricsSummary(),
      ]);
      setPlots(p.length);
      setSensorsTotal(s.length);
      setSensorsOk(s.filter((x) => x.status === "ok" && x.is_active).length);
      setPiden(m.evaluations_riega);
      setAlerts(a);
      setRecent(e);
      setUpdatedAt(new Date().toISOString());
    } catch (err) {
      setError(friendlyError(err, "No se pudo cargar el resumen."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const criticas = alerts.filter(
    (a) => a.tipo.includes("critica") || a.tipo === "humedad_critica",
  ).length;

  const prioritarias = [...alerts]
    .sort((a, b) => Number(b.tipo.includes("critica")) - Number(a.tipo.includes("critica")))
    .slice(0, 8);

  const today = todayLong();

  return (
    <div className="page dashboard-page">
      <PageHead eyebrow="Vista general" title="El pulso de tu campo" desc="Tus parcelas, las decisiones de riego y lo que necesita atención."
        actions={
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => void load(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Actualizando…
              </>
            ) : (
              <>
                <Icon name="refresh" size={15} />
                Actualizar
              </>
            )}
          </button>
        }/>
      {error ? <Banner kind="bad">{error} <button className="link" onClick={() => void load()}>Reintentar</button></Banner> : loading ? <Skeletons n={4}/> : <>
        <div className="stats dashboard-stats">
          <Link className="stat-link" to="/parcelas">
            <Stat value={fmtNum(plots)} label="Parcelas en seguimiento" icon="map" sub="Unidades de cultivo registradas"/>
          </Link>
          <Link className="stat-link" to="/evaluar">
            <Stat value={fmtNum(piden)} label="Necesitan riego" icon="drop" tone={piden > 0 ? "warn" : "ok"} sub="Según su última evaluación"/>
          </Link>
          <Link className="stat-link" to="/sensores">
            <Stat value={sensorsTotal ? `${sensorsOk}/${sensorsTotal}` : "0"} label="Sensores operativos" icon="sensor" tone={sensorsOk < sensorsTotal ? "warn" : "ok"} sub="Dispositivos activos con datos"/>
          </Link>
          <Link className="stat-link" to="/alertas">
            <Stat value={fmtNum(alerts.length)} label="Alertas por revisar" icon="bell" tone={criticas ? "bad" : alerts.length ? "warn" : "ok"} sub={criticas ? `${criticas} de prioridad crítica` : "Señales del campo"}/>
          </Link>
        </div>
        <section className="daily-brief" aria-labelledby="daily-brief-title">
          <div className="daily-brief-main">
            <span className="brief-icon"><Icon name={piden > 0 ? "drop" : "check"} size={26}/></span>
            <div><p className="eyebrow">Tu siguiente decisión</p><h2 id="daily-brief-title">{piden > 0 ? `${piden} ${piden === 1 ? "parcela necesita" : "parcelas necesitan"} agua.` : "Sin riego urgente por ahora."}</h2>
            <p>Revisa los datos de cada parcela antes de planificar la aplicación de agua.</p></div>
          </div>
          <div className="daily-brief-window"><Icon name="clock" size={20}/><div><span>Ventana recomendada</span><strong>05:30 — 07:00</strong></div></div>
        </section>
        <div className="dashboard-columns">
          <Card title="Últimas evaluaciones" sub="Decisiones registradas por parcela."
            action={<Link className="link small" to="/evaluar">Ver evaluaciones <Icon name="arrow" size={15}/></Link>}>
            {recent.length === 0 ? <Empty icon="gauge" title="Tu primera decisión empieza aquí" hint="Evalúa una parcela para consultar sus recomendaciones." action={<Link className="btn btn-outline" to="/evaluar">Evaluar una parcela</Link>}/> :
            <DataTable label="Últimas evaluaciones" rows={recent} rowKey={e=>e.id} columns={[
              {key:"plot",label:"Parcela",render:e=><span className="table-primary">{e.plot?.name ?? `Parcela #${e.plot_id}`}</span>},
              {key:"date",label:"Evaluada",render:e=><span className="muted">{fmtDateTime(e.evaluated_at)}</span>},
              {key:"result",label:"Decisión",render:e=><Badge tone={badgeToneForResult(e.result,e.is_critical)}>{e.is_critical?"Crítica":resultLabel(e.result)}</Badge>},
            ]}/>}
          </Card>
          <Card title="Requieren atención" sub={alerts.length ? `${alerts.length} señales para revisar${criticas ? " · críticas primero" : ""}` : "Seguimiento del campo"}
            action={<Link className="icon-link" to="/alertas" aria-label="Ver todas las alertas"><Icon name="arrow" size={18}/></Link>}>
            {alerts.length === 0 ? <Empty icon="check" title="Todo al día" hint="No hay alertas pendientes en tus parcelas."/> :
            <div className="attention-list">{prioritarias.map((alert,i)=><div className="attention-item" key={`${alert.tipo}-${alert.plot_id}-${i}`}>
              <span className={"attention-symbol"+(alert.tipo.includes("critica")?" critical":"")}><Icon name={alert.tipo.startsWith("sensor")?"sensor":"alert"} size={17}/></span>
              <div><p>{alert.mensaje}</p><span className="tiny">{alert.plot_id ? `Parcela #${alert.plot_id}` : "Aviso general"}</span></div>
            </div>)}</div>}
            {alerts.length>0?<Link className="btn btn-outline btn-block" to="/alertas">Revisar alertas <Icon name="arrow" size={15}/></Link>:null}
          </Card>
        </div>
        <div className="dashboard-context"><span><Icon name="pin" size={15}/>Chupaca, Junín</span><span>{today}</span><span>Actualizado {ageLabel(updatedAt)}</span></div>
      </>}
    </div>
  );
}
