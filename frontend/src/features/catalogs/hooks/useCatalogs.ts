import { useEffect, useState } from "react";
import { listCrops, listSoils } from "@/api/endpoints";
import type { Crop, SoilTexture } from "@/api/types";
import { friendlyError } from "@/api/client";

export function useCatalogs() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [soils, setSoils] = useState<SoilTexture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const [c, s] = await Promise.all([listCrops(), listSoils()]);
      setCrops(c);
      setSoils(s);
    } catch (err) {
      setError(friendlyError(err, "No se pudieron cargar los catálogos."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return { crops, soils, loading, error, load };
}