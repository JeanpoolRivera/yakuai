# MEJORAS v1 — Reglas vigentes (2026-10-13)

> Bitácora detallada anterior archivada en `docs/MEJORAS-historia.md`.
> Este archivo es la única referencia vigente.

## Decisiones cerradas v1

* **12h** (está bien → próximo turno útil), **6h = 2 bloques de 3h** (espera lluvia + re-chequeo), **05:30–07:00** ventana FAO. Detalle y citas en `docs/reglas-v1.md`.
* **Plan ejecutable:** litros únicos + minutos (`litros / flow_lpm`) + inicio/fin; si excede ventana se parte en 2 mañanas.
* **Cierre espera:** toda `espera` deja re-evaluación a las 6h; si no llovió → `riega`.
* **Turno útil:** nunca de noche; mañana 05:30 / tarde 17:00.

## Documentación vigente

| Doc | Estado |
|---|---|
| `README.md` | Maestro (corregir §6 “2 bloques” → agregado 6h) |
| `docs/reglas-v1.md`, `docs/flujo-backend.md`, `docs/estados.md` | Fuente v1 |
| `docs/ARDUINO.md` | OK |
| `frontend/README.md`, `frontend/DESIGN_SYSTEM.md` | OK con retoques aplicados |
| `docs/MEJORAS-historia.md`, `docs/RESUMEN-legacy.md` | Solo historia |
| `docs/prototipos/` | Maquetas, no spec |
| `docs/papers/` | Fuentes (3 FAO/Saxton vigentes, 6 complementarios) |
