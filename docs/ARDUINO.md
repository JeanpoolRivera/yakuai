# Guía Arduino UNO — YakuAI (maqueta curso)

Solo cuando el backend/frontend ya funcionen con demo. No alimenta 220V:
USB de la laptop.

## 1. Material mínimo

YL-69 + LM393 (humedad), FC-37 (lluvia sí/no), DHT11 (aire), UNO,
protoboard, cables dupont, LED verde/rojo opcional.

## 2. Conexiones

| Sensor | VCC | GND | Señal |
|---|---|---|---|
| YL-69 (LM393) | 5V | GND | A0 |
| FC-37 | 5V | GND | D2 (digital) |
| DHT11 | 5V | GND | D4 (librería DHT) |

## 3. Calibración YL-69 (obligatoria)

1. Al aire 2 min → anota `seco` (ej. 1020).
2. En agua hasta la marca 2 min → anota `mojado` (ej. 320).
3. Registra el sensor en el panel con esos 2 números.
4. Rangos: >850 seco, 500-850 húmedo, <500 mojado.

## 4. Formato de envío (cuando haya gateway)

El Arduino no habla directo con la API en maqueta: se carga manual/demo
en el panel. En fase real, el gateway manda:

```json
POST /api/v1/measurements
Authorization: Bearer TOKEN_SENSOR_INGERIR
{
  "sensor_id": 1,
  "measured_at": "2026-09-22T10:00:00",
  "raw_value": 650,
  "origin": "sensor"
}
```

El token se crea con ability `ingerir` (solo ingesta, nada más).
Duplicados (mismo sensor + fecha) devuelven 409 con la existente.

## 5. Límites honestos de la maqueta

YL-69 se oxida en semanas (campo real: capacitivo). FC-37 no mide mm
(campo real: balancín). DHT11 ±2 °C (campo real: BME280). El caudal
YF-S201 es opcional y va en la manguera.
