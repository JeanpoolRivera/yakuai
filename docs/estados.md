# YakuAI · Estados observados en el código

- **Sensor status:** ok, anomalo o sin_datos. yakuai:sensores:revisar marca sensores activos sin medición válida en 3 horas como sin_datos. Una lectura anómala queda registrada y actualiza el sensor. Un sensor inactivo rechaza la ingesta con 422.
- **Medición quality:** ok (puede alimentar evaluación) o anomalo (queda registrada; el motor no la usa).
- **Evaluación result:** no, riega, espera o incompleta. Se persiste con snapshot. La restricción de unicidad y el controlador devuelven la evaluación existente para una parcela y hora ya evaluadas.
- **Motivos incompletos:** sin_humedad_valida y sin_clima_valido. next_at se fija a una hora.
- **Próxima revisión:** no a 12 h, espera a 6 h y riega a 24 h, calculadas desde la evaluación.
- **Riego:** activo se puede corregir creando un sucesor con supersedes_id o anular con motivo. La operación conserva los registros previos.
- **Pronóstico origin:** owm, demo, owm_fallo_<status> o owm_error. El fallback conserva el esquema común.
- **Alertas calculadas:** sensor sin datos/anómalo, evaluación incompleta y humedad crítica. No se persisten y no hay una alerta separada de lluvia alta.
