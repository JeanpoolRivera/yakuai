import { useEffect, useState } from "react";
import { listAlerts } from "@/api/endpoints";
import type { AlertItem } from "@/api/types";
import { friendlyError } from "@/api/client";

export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      setAlerts(await listAlerts());
    } catch (err) {
      const message = friendlyError(err, "No se pudieron cargar las alertas.");
      setError(message.includes("SQLSTATE[") ? "No se pudieron cargar las alertas. Inténtalo de nuevo en unos minutos." : message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const criticas = alerts.filter((a) => a.tipo.includes("critica"));
  const sensores = alerts.filter((a) => a.tipo.startsWith("sensor"));

  return {
    alerts,
    loading,
    error,
    load,
    criticas,
    sensores,
  };
}