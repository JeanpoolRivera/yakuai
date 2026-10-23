import { useEffect, useState } from "react";
import { listSensors, listPlots } from '@/api/endpoints';
import type { Sensor, Plot } from "@/api/types";
import { friendlyError } from '@/api/client';


export function useSensors() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const [s, p] = await Promise.all([listSensors(), listPlots()]);
      setSensors(s);
      setPlots(p);
    } catch (err) {
      setError(friendlyError(err, "No se pudieron cargar los sensores."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return { sensors, plots, loading, error, load, setSensors, setPlots };
}
