# YakuAI · Comportamiento vigente del motor

Esta página describe lo que ejecuta backend/app/Services/HydroService.php y los procesos que lo invocan. Especifica comportamiento de software; los parámetros deben validarse con datos agronómicos de campo antes de usar YakuAI como guía productiva.

## Frescura y evaluación incompleta

- Una medición de humedad de más de 30 minutos, ausente o anómala produce incompleta con motivo sin_humedad_valida.
- Un pronóstico ausente o de más de 180 minutos produce incompleta con motivo sin_clima_valido.
- En los casos incompletos, next_at se fija a una hora desde la evaluación. El motor no redondea ese tiempo a un turno.
- Una medición válida se normaliza con referencias seca/mojada del sensor. Lecturas anómalas se guardan, pero el motor no las usa.

## Umbral, evapotranspiración y litros

El motor calcula etapa a partir de fecha de siembra y duración de las etapas, ET₀ con Hargreaves y radiación extraterrestre FAO-56, ETc como ET₀ × Kc y umbral a partir de CC, PMP y p. Si faltan las referencias relacionales de cultivo o suelo, el cálculo falla; el código no las inventa.

La lámina neta usa CC, humedad normalizada y profundidad de raíz. El volumen bruto considera área y eficiencia. La respuesta expone un rango de 50 L: min = floor(volumen/50) × 50 y max = min + 50. El plan guarda litros redondeados y, si existe caudal, minutos calculados por ceil(litros / L/min).

## Resultado no

Si la humedad supera el umbral, el resultado es no y la revisión siguiente se fija exactamente a 12 horas. El motor no redondea a las 05:30 o 17:00.

## Resultado espera

El pronóstico OWM agrega la lluvia de hasta dos intervalos de 3 horas. El motor espera si se cumplen todas estas condiciones:

- probabilidad agregada máxima igual o mayor a 70 %;
- lluvia agregada de 6 h × 0,80 cubre la lámina neta;
- la humedad no está en nivel crítico (humedad <= PMP).

El motor compara el total agregado; **no comprueba por separado que cada bloque de 3 horas tenga probabilidad suficiente**. El siguiente chequeo queda a 6 horas. yakuai:esperas:revisar, programado cada 30 minutos con el scheduler, vuelve a evaluar las esperas vencidas usando medición y pronóstico recientes. El resultado posterior depende de esos datos; no se fuerza automáticamente a riega.

## Resultado riega y horario sugerido

- Humedad crítica: inicio sugerido ahora.
- No crítico entre 05:30 y 10:00 o entre 16:00 y 19:00: inicio sugerido en 15 minutos.
- Antes de 05:30: inicio sugerido a las 05:30.
- Entre 10:00 y 16:00: inicio sugerido a las 16:00.
- Después de 19:00: inicio sugerido a las 05:30 del día siguiente.

Si no hay caudal, se muestran litros sin minutos. El plan divide aplicaciones mayores a 90 minutos en jornadas de 90 minutos; la nota describe mañanas de 05:30–07:00. Por ello, el plan vigente **no limita todos los riegos a 05:30–07:00**: contempla tarde y crítico inmediato.

La evaluación de resultado riega asigna next_at a 24 horas; la espera usa 6 horas y el resultado no, 12 horas.

## Clima y origen

OwmService consulta pronóstico de 3 horas y agrega hasta dos intervalos siguientes. Guarda el payload OWM en raw_json. Sin clave o si hay error, guarda un pronóstico demo/fallback del mismo esquema. Que la ejecución use datos reales depende de la configuración de OWM_KEY.

El motor usa temperaturas máxima y mínima del pronóstico. Si faltan, sustituye por 24 °C y 12 °C y registra temp_asumida en el snapshot. La lectura DHT11 no alimenta actualmente ET₀.

## Fuentes de parámetros

Los PDFs de FAO-56 y Saxton están en [papers/](papers/), como referencias científicas. Su presencia no implica que todos los horarios u otros parámetros del código hayan sido validados por esos estudios en Chupaca.
