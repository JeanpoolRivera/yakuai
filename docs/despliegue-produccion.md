# Despliegue de producción

La configuración de desarrollo permanece en `docker-compose.yml`: monta el código local y ejecuta Vite. Para producción se usa `docker-compose.production.yml`, que construye imágenes inmutables, sirve el frontend estático con Nginx y no monta código del host.

## Preparar variables

1. Copia `.env.example` a `.env` y define secretos únicos para producción: `APP_KEY`, `DB_PASSWORD` y `MYSQL_ROOT_PASSWORD`.
2. Configura `APP_URL` con el dominio HTTPS público, `APP_ENV=production`, `APP_DEBUG=false`, `MAIL_MAILER=smtp` y los datos reales de SMTP. Configura `OWM_KEY` si se requiere pronóstico real. Las credenciales opcionales de WhatsApp/Brevo solo se incluyen si esos servicios se habilitan.
3. Conserva el archivo `.env` fuera del repositorio. `.dockerignore` excluye los archivos de entorno de los contextos de build.

Por defecto, el frontend se publica en `127.0.0.1:${FRONTEND_PORT:-8081}`. Coloca un proxy de entrada con TLS en el mismo host y configura el reenvío de `X-Forwarded-Proto`. Si el proxy se ejecuta fuera del host, configura `FRONTEND_BIND=0.0.0.0` y limita el puerto al proxy mediante el firewall; el tráfico público debe terminar TLS en ese proxy. La API no publica un puerto de host: solo se alcanza desde la red interna de Compose a través del frontend.

## Construir y desplegar

Desde la raíz del proyecto:

```sh
docker compose -f docker-compose.production.yml up -d mysql redis
docker compose -f docker-compose.production.yml run --build --rm app php artisan migrate --force
docker compose -f docker-compose.production.yml up -d --build
docker compose -f docker-compose.production.yml ps
```

La migración se ejecuta explícitamente antes de levantar la versión. Scheduler y worker usan la misma imagen PHP de producción. No se debe ejecutar `docker compose down -v` en un entorno con datos reales: elimina los volúmenes de base de datos y archivos de aplicación.

Respaldar tanto `mysql_data` como `app_storage`. Para actualizar, construir y levantar las nuevas imágenes con Compose; revisar salud de `app`, `api`, `frontend`, `scheduler` y `worker`. La API devuelve `Cache-Control: no-store, private`; el service worker no conserva respuestas `/api/` y elimina su caché anterior al actualizarse.

La pila no instala certificados TLS ni configura un dominio: el proxy de entrada y la gestión de certificados son responsabilidad del entorno donde se despliegue.