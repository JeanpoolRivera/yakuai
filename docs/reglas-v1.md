# YakuAI · Reglas v1 vigentes (2026-10-13)

Fuente científica: `docs/papers/FAO56-Allen1998.pdf`, `docs/papers/FAO56-Rev1-2025.pdf`, `docs/papers/Saxton1986-soil-water-characteristics.pdf`.

## 1. Revisión en 12 h — “está bien, reviso en el próximo turno”

Cuando la humedad supera el umbral, no se riega. Próxima revisión en 12 h redondeada al turno útil (05:30 / 17:00, nunca de noche).
Fundamento: la pérdida diaria por evapotranspiración (3–5 mm/día en papa de sierra) frente a reserva útil de francos (15–25 mm) hace que el paso a “vigilar” tome 1–3 días; 12 h es vigilancia conservadora (FAO-56 balance hídrico y programación).

## 2. Espera 6 h = 2 bloques de 3 h — “espero lluvia y re-evalúo solo”

Solo se espera si la lluvia agregada de 6 h × 0,80 cubre lo que falta, con probabilidad ≥70 %, y el suelo no está crítico.
La ventana de 6 h son 2 bloques del pronóstico gratuito, el horizonte fiable en sierra; incluye 2–4 h de infiltración según textura (Saxton 1986). Toda `espera` deja re-evaluación automática a las 6 h: si no llovió → `riega`. Crítico nunca espera.

## 3. Ventana 05:30–07:00 — momento FAO

Todo riego se programa dentro de 05:30–07:00 (menor evaporación, mayor eficiencia, menor enfermedad foliar; FAO-56 momento de aplicación).
Plan ejecutable: litros únicos + minutos (`litros / flow_lpm`) + inicio/fin; si excede la ventana se parte en 2 mañanas. Sin caudal se entrega solo litros.

## 4. Datos vencidos e incompletas

Humedad >30 min o clima >3 h → vencidos → `incompleta` con causa. Reintento según causa: humedad 30 min, clima 3 h. Sin CC/PMP/Zr/p/Kc/área/edad no se inventa.

## 5. Modo actual pre-Arduino (2026-10-13)

Clima OWM real (key activa, `refresh` sin demo). Sensores demo/manual (`origin=demo`) hasta llegada de Arduino. DHT11 informativo (no decide). Cada evaluación guarda su origen para trazabilidad.

## Bibliografía

Allen et al. (1998) FAO-56; Allen et al. (2025) FAO-56 Rev.1; Saxton et al. (1986) Soil Sci. Soc. Am. J. 50(4).
