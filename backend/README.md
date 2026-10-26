# YakuAI · Backend

API REST Laravel 13 bajo /api/v1; la interfaz React se mantiene en el proyecto frontend separado. El dominio del motor está en app/Services/HydroService.php; las rutas son la referencia exacta de métodos y controladores disponibles.

## Stack

Laravel ^13.17, PHP ^8.3, Sanctum ^4.0, MySQL 8.4, Redis 7 y PHPUnit ^12.

La autenticación usa tokens personales de Laravel Sanctum (Bearer), no JWT. El login unificado recibe email y secret; el servidor selecciona PIN o contraseña según el rol de la cuenta.

## Comandos

Desde backend/:

~~~sh
php artisan test
vendor/bin/pint --test
php artisan yakuai:auditoria:matutina --simulado
php artisan yakuai:sensores:revisar
php artisan yakuai:esperas:revisar
php artisan yakuai:pronosticos:limpiar
~~~

--simulado muestra el resultado de la auditoría sin persistir evaluaciones ni encolar mensajes.

## Scheduler y cola

En routes/console.php: sensores cada 15 minutos, re-chequeo de esperas cada 30 minutos, auditoría a las 05:30 y limpieza semanal. En desarrollo, el perfil produccion de docker-compose.yml activa scheduler y worker. El despliegue de producción sin bind mounts usa docker-compose.production.yml; sigue [../docs/despliegue-produccion.md](../docs/despliegue-produccion.md). El comando local es:

~~~sh
docker compose --profile produccion up -d --build
~~~

Las órdenes programadas también dependen de que la zona horaria de Laravel esté configurada correctamente. Sin credenciales de WhatsApp, el servicio escribe una simulación en el log; el envío real requiere el worker activo y credenciales válidas.

## Comportamiento

Ver [../docs/reglas-v1.md](../docs/reglas-v1.md), [../docs/estados.md](../docs/estados.md) y [../docs/flujo-backend.md](../docs/flujo-backend.md).

## Observación de permisos

El middleware global comprueba sesión activa y restringe tokens con capacidad ingerir. La aplicación de roles por recurso no es uniforme: algunas lecturas verifican rol/scoping, pero ciertas mutaciones no tienen una comprobación explícita de rol en el controlador. Revisar esa brecha antes de exponer la API en producción; la UI no constituye una barrera de autorización.
