# YakuAI Backend

API REST Laravel 13 bajo `/api/v1`. La arquitectura y recursos se documentan en [API y recursos](../docs/backend/api-y-recursos.md); permisos en [autenticación y autorización](../docs/backend/autenticacion-y-autorizacion.md), y operación en [tareas y colas](../docs/operacion/tareas-y-colas.md).

## Comandos locales

Desde `backend/`:

```sh
php artisan test
vendor/bin/pint --test
php artisan yakuai:auditoria:matutina --simulado
php artisan yakuai:sensores:revisar
php artisan yakuai:esperas:revisar
php artisan yakuai:pronosticos:limpiar
```

`--simulado` muestra la auditoría sin persistir evaluaciones ni encolar mensajes. Para iniciar la pila local, consulta [desarrollo local](../docs/operacion/desarrollo-local.md).
