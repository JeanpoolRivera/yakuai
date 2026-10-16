# YakuAI · Estados v1

* **Sensor `status`:** `ok` → `anomalo` (lectura imposible) · `ok` → `sin_datos` (3h sin lectura ok, comando) · `is_active=false` bloquea ingesta (422).
* **Medición `quality`:** `ok` (usable por el motor) / `anomalo` (se guarda, no decide).
* **Evaluación `result` (inmutable):** `no` (revisa turno útil) / `riega` (plan ejecutable) / `espera` (re-chequeo 6h) / `incompleta` (con `reason`: sin_humedad_valida, sin_clima_valido). `is_critical` nunca espera.
* **Riego `status`:** `activo` → `corregido` (crea sucesor con `supersedes_id`) / `activo` → `anulado` (terminal con motivo). Solo `activo` mutable.
* **Pronóstico `origin`:** `owm` / `demo` / `owm_fallo_*` / `owm_error`. Mismo esquema siempre.
