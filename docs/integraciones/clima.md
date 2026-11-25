# Integración de clima

`OwmService` consulta el pronóstico de OpenWeatherMap por latitud/longitud de parcela, con unidades métricas y español. Agrega los dos primeros intervalos de tres horas: suma lluvia, toma probabilidad máxima y obtiene temperaturas extremas. Guarda la respuesta original y origen `owm`.

Se requiere `OWM_KEY`. Sin clave se genera pronóstico demo; ante respuesta no exitosa se guarda `owm_fallo_<status>` y ante excepción `owm_error`. El esquema de fallback es compatible, pero sus valores no son observaciones ni un pronóstico real. El endpoint manual de actualización también usa el mismo servicio.

Al evaluar, el controlador intenta actualizar si no hay pronóstico o tiene más de 120 minutos. El motor acepta pronóstico de hasta 180 minutos. Si faltan temperaturas, el motor usa 24 °C y 12 °C y deja constancia en el snapshot. DHT11 no aporta temperatura a ese cálculo.

Variables principales: `OWM_KEY`, `OWM_TIMEOUT`. Fuente de implementación: `backend/app/Services/OwmService.php` y `backend/config/services.php`.
