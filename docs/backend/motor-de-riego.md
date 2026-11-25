# Motor de riego

El comportamiento actual está implementado en `HydroService`. Cada evaluación conserva un snapshot de parámetros y entradas. El motor actual orienta la decisión y todavía no acciona el riego de la maqueta.

## Requisitos de datos

- Humedad de sensor con calidad `ok`, de no más de 30 minutos.
- Pronóstico de no más de 180 minutos.
- Cultivo/etapa y textura de suelo existentes en los catálogos.
- Si falta humedad o clima válido, el resultado es `incompleta`, con motivo `sin_humedad_valida` o `sin_clima_valido` y revisión en una hora.

## Cálculo y resultados

1. La etapa se deriva de fecha de siembra y duración acumulada de las etapas.
2. Calcula radiación extraterrestre según FAO-56, ET₀ de Hargreaves y ETc = ET₀ × Kc usando temperaturas máxima y mínima del aire del pronóstico. Si faltan, usa 24 °C/12 °C y guarda `temp_asumida`. El DS18B20 mide temperatura del suelo de la maqueta; una lectura válida de hasta 30 minutos se guarda como `temperatura_suelo_c` en el snapshot y se muestra como contexto. No cambia el resultado hasta que exista una regla agronómica documentada para ese sensor. Aunque ETc se calcula y guarda en el snapshot, no modifica por sí sola el resultado actual.
3. Umbral físico estimado: `CC − p × (CC − PMP)`. En la escala relativa del capacitivo esto equivale a `humedad_umbral_pct = (1 − p) × 100`. Si la lectura supera ese umbral relativo, el resultado es `no` y la próxima revisión queda a 12 horas.
4. Bajo el umbral, estima θ interpolando el índice del sensor entre PMP y CC, y calcula la lámina neta con esa θ y la profundidad radicular. Solo el extremo seco calibrado (0 %) se considera crítico en esta aproximación.
5. Resultado `espera` si no es crítico, probabilidad de lluvia agregada ≥70 % y lluvia efectiva (`lluvia × 0.80`) cubre la lámina. Se revisa en seis horas. La probabilidad es el máximo de los intervalos, no se valida individualmente por bloque.
6. En otro caso produce `riega`; volumen bruto = lámina × área / eficiencia. Expone un rango de 50 L y guarda el plan redondeado. Si existe caudal calcula minutos; planes de más de 90 minutos se distribuyen en jornadas. La revisión queda a 24 horas.

## Horario sugerido

El horario se decide en `proximoInicio`: crítico empieza ahora; para los demás casos se elige próxima ventana adecuada de mañana/tarde, evitando mediodía. El plan exacto y la nota se guardan en `inputs_snapshot.plan`; utilizar esos datos al presentar o compartir el resultado en vez de asumir una hora fija.

La idempotencia es por parcela y hora: si ya hay evaluación para ese intervalo, el controlador devuelve la existente. Los valores de cultivo iniciales se atribuyen a FAO-56 tablas 12 y 22; las clases de suelo a FAO-56 tabla 19 y Saxton & Rawls (2006), según `CatalogSeeder`. Las duraciones de etapa y valores iniciales son provisionales y pendientes de validación local.

## Criterios pendientes para la maqueta

- El capacitivo entrega un índice relativo de 0 a 100, no humedad volumétrica. El motor aproxima el extremo seco a PMP y el húmedo a CC, calcula `humedad_umbral_pct = (1 − p) × 100` y estima θ entre PMP y CC para la lámina. Es una aproximación dependiente de las referencias seco/húmedo del sensor; sin calibración real de la maqueta, la recomendación debe considerarse provisional. El snapshot conserva también `humedad_theta_estimada` y el umbral usado.
- La temperatura del sustrato/cultivo recibida del DS18B20 debe estar disponible para la evaluación explicable. Su efecto cuantitativo en la recomendación debe justificarse con las fuentes técnicas del proyecto; no se añadirá un umbral aislado sin respaldo.
- La temperatura del aire y lluvia de OpenWeather se mantienen como datos climáticos distintos de la temperatura medida en el sustrato.
- La recomendación agronómica de volumen no se envía directamente a la bomba. La maqueta necesita un límite de ejecución a escala, y la orden final debe respetar nivel de agua, presencia de caudal y apagado de seguridad.
- Si OpenWeather devuelve respaldo/demo o el dato está vencido, la interfaz debe identificarlo y no presentarlo como una evaluación con clima observado vigente.
