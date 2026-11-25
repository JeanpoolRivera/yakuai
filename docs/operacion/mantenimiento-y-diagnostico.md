# Mantenimiento y diagnóstico

## Comprobaciones iniciales

- `docker compose ps` para ver estado/health de servicios.
- `docker compose logs --tail=100 app`, `worker`, `scheduler`, `nginx` o `frontend` para localizar errores recientes.
- `GET /api/v1/health` para comprobar respuesta del API.
- Revisar si scheduler está activo y si la cola Redis tiene worker cuando una tarea o aviso no se procesa.
- Confirmar `APP_TIMEZONE`, credenciales y origen en datos de clima; el origen `demo`, `owm_fallo_*` o `owm_error` indica fallback.

## Operaciones cuidadosas

- Antes de migraciones de producción, confirmar backup reciente y espacio disponible.
- Respaldar tanto base MySQL como `app_storage`; probar restauración periódicamente.
- No revelar `.env`, tokens Bearer, PIN, contraseña SMTP, API keys ni datos personales en logs compartidos.
- Los registros de riego y correcciones tienen historial; no manipular tablas manualmente sin procedimiento aprobado.

Para el comportamiento esperado de las tareas, ver [tareas y colas](tareas-y-colas.md); para configurar servicios, ver [configuración](configuracion.md).
