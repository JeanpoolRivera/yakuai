import { useAsync } from "@/hooks/useAsync";
import { listSensors, listPlots } from "@/api/endpoints";
import type { Sensor, Plot } from "@/api/types";
import { friendlyError } from "@/api/client";

type SensorsData = { sensors: Sensor[]; plots: Plot[] };

export function useSensors() {
  const { data, loading, error, execute, setData } = useAsync<SensorsData>(async () => {
    try {
      const [sensors, plots] = await Promise.all([listSensors(), listPlots()]);
      return { sensors, plots };
    } catch (err) {
      throw new Error(friendlyError(err, "No se pudieron cargar los sensores."));
    }
  });

  const updateSensors = (sensors: Sensor[] | ((current: Sensor[]) => Sensor[])): void => {
    setData((current) => current ? { ...current, sensors: typeof sensors === "function" ? sensors(current.sensors) : sensors } : null);
  };
  const updatePlots = (plots: Plot[] | ((current: Plot[]) => Plot[])): void => {
    setData((current) => current ? { ...current, plots: typeof plots === "function" ? plots(current.plots) : plots } : null);
  };

  return { sensors: data?.sensors ?? [], plots: data?.plots ?? [], loading, error, load: execute, setSensors: updateSensors, setPlots: updatePlots };
}
