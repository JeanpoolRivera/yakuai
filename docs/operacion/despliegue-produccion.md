# Despliegue de producción

La producción usa `docker-compose.production.yml`: imágenes separadas para app, API Nginx y frontend estático; no monta código del host. MySQL y Redis son servicios internos y app/worker/scheduler montan el volumen de almacenamiento.

## Preparar y desplegar

1. Crear `.env` fuera del control de versiones con `APP_KEY`, contraseñas únicas, URLs HTTPS, `APP_ENV=production`, `APP_DEBUG=false`, datos SMTP y servicios externos requeridos. Ver [configuración](configuracion.md).
2. Asegurar base de datos y Redis, migrar y levantar imágenes:

```sh
docker compose -f docker-compose.production.yml up -d mysql redis
docker compose -f docker-compose.production.yml run --build --rm app php artisan migrate --force
docker compose -f docker-compose.production.yml up -d --build
docker compose -f docker-compose.production.yml ps
```

3. Poner un proxy de entrada con TLS delante del frontend, restringir exposición de red y configurar `X-Forwarded-Proto` según el proxy.
4. Verificar salud de `app`, `api`, `frontend`, `scheduler` y `worker`, además del flujo de correo/clima si están habilitados.

La API no publica un puerto del host en este compose; se sirve a través de la red interna y Nginx. Respaldar `mysql_data` y `app_storage`, y comprobar restauración de backups. No ejecutar `docker compose down -v` en un entorno con datos que deban conservarse: elimina volúmenes. Compose no instala dominio ni certificados.
