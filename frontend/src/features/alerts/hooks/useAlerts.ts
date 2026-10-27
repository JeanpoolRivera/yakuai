import { useAsync } from "@/hooks/useAsync";
import { listAlerts } from "@/api/endpoints";
import type { AlertItem } from "@/api/types";
import { friendlyError } from "@/api/client";

export function useAlerts() {
  const { data, loading, error, execute } = useAsync<AlertItem[]>(async () => {
    try {
      return await listAlerts();
    } catch (err) {
      const message = friendlyError(err, "No se pudieron cargar las alertas.");
      throw new Error(message.includes("SQLSTATE[") ? "No se pudieron cargar las alertas. Inténtalo de nuevo en unos minutos." : message);
    }
  });
  const alerts = data ?? [];

  return {
    alerts,
    loading,
    error,
    load: execute,
    criticas: alerts.filter((alert) => alert.tipo.includes("critica")),
    sensores: alerts.filter((alert) => alert.tipo.startsWith("sensor")),
  };
}
