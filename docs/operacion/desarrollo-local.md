# Desarrollo local

Requiere Docker Desktop/Engine con Compose y archivo `.env` basado en `.env.example`. Desde la raíz:

```sh
docker compose up -d --build
```

En una base vacía, aplica migraciones y carga los seeders que necesite el entorno de desarrollo:

```sh
docker compose run --rm app php artisan migrate --force
docker compose run --rm app php artisan db:seed --force
```

Frontend: `http://127.0.0.1:8081` por defecto. API: `http://127.0.0.1:8082/api/v1`. Compose usa Vite para frontend; el perfil `produccion` del compose de desarrollo añade scheduler y worker:

```sh
docker compose --profile produccion up -d --build
```

Ese perfil activa procesos de fondo para desarrollo; no equivale al compose de despliegue. El primer arranque construye imágenes, instala dependencias e inicializa servicios y puede tardar. Para configuración, consulte [configuración](configuracion.md); para comandos de revisión, [calidad y verificación](calidad-y-verificacion.md).
