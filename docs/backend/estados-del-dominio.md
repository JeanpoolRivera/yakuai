# Estados del dominio

| Entidad | Valores/comportamiento |
|---|---|
| Sensor | `ok`, `anomalo`, `sin_datos`; además conserva `is_active`. El comando periódico marca `sin_datos` a sensores activos en estado `ok` que carecen de medición `ok` en tres horas. |
| Medición | `quality`: `ok` o `anomalo`; la anomalía se conserva y no alimenta el motor. Orígenes aceptados: `manual`, `sensor`, `demo`. |
| Evaluación | `no`, `riega`, `espera`, `incompleta`; guarda snapshot, motivo y `next_at`. Revisión: 12 h, 24 h, 6 h o 1 h según resultado, respectivamente. |
| Riego | `activo`, `corregido`, `anulado`; corrección crea sucesor y anulación conserva motivo. |
| Pronóstico | Origen `owm`, `demo`, `owm_fallo_<status>` u `owm_error`. |
| Alertas | Respuesta calculada, no filas persistidas: sensor activo anómalo/sin datos, evaluación incompleta y humedad crítica. No hay alerta separada por lluvia alta. |

Un duplicado de medición por sensor y fecha devuelve HTTP 409. Ingresar datos a sensor inactivo devuelve 422. Para la implementación del comando de sensores y sus límites, consulte [tareas y colas](../operacion/tareas-y-colas.md).
