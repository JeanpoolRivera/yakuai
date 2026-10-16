# YakuAI · Flujo backend v1

```
registro (agricultor→parcela→sensores)
  → ingesta (POST /measurements → normaliza ok/anómalo, 409 duplicado)
  → clima (POST .../weather/refresh → ventana agregada 6h, fallback demo)
  → evaluar (POST .../evaluate → HydroService → no/riega/espera/incompleta, idempotente por hora, inmutable)
  → riego manual (POST /irrigations → activo; corregir crea sucesor, anular cierra)
  → alertas (GET /alerts, compuesto, sin persistir)
  → auditoría 05:30 (repite evaluar por parcela activa + encola WhatsApp si riega/espera)
  → mantenimiento (sensores:revisar 15min → sin_datos; pronósticos:limpiar semanal)
```

Detalle por endpoint en `README.md` §12. Motor en `backend/app/Services/HydroService.php`.
Reglas vigentes en `docs/reglas-v1.md`. Estados en `docs/estados.md`.
