# Calidad y verificación

Los comandos siguientes están definidos como verificaciones del proyecto; su presencia no certifica que se hayan ejecutado o aprobado en una revisión concreta.

Desde `backend/`:

```sh
php artisan test
vendor/bin/pint --test
```

Desde `frontend/`:

```sh
npm test
npm run lint
npx tsc -b
npm run build
```

`scripts/check.sh` agrega validación de Compose y comprobaciones HTTP locales. GitHub Actions ejecuta pruebas backend, lint/build/pruebas frontend y valida configuración/compilación de imágenes de producción. La matriz `GET /api/v1/validation` tiene diez casos deterministas; no es un estudio de precisión agronómica.

Al revisar permisos, cubrir cada rol, token y recurso tanto en lectura como escritura. La visibilidad del frontend no demuestra autorización del backend. Para interfaz, complementar pruebas automatizadas con revisión teclado, contraste y tamaños adaptables descritos en [frontend](../frontend/accesibilidad-y-responsive.md).
