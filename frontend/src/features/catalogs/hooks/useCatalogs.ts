import { useAsync } from "@/hooks/useAsync";
import { listCrops, listSoils } from "@/api/endpoints";
import type { Crop, SoilTexture } from "@/api/types";
import { friendlyError } from "@/api/client";

type CatalogData = { crops: Crop[]; soils: SoilTexture[] };

export function useCatalogs() {
  const { data, loading, error, execute } = useAsync<CatalogData>(async () => {
    try {
      const [crops, soils] = await Promise.all([listCrops(), listSoils()]);
      return { crops, soils };
    } catch (err) {
      throw new Error(friendlyError(err, "No se pudieron cargar los catálogos."));
    }
  });

  return { crops: data?.crops ?? [], soils: data?.soils ?? [], loading, error, load: execute };
}
