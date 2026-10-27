# YakuAI

Sistema web de apoyo a decisiones de riego para agricultura familiar. Combina datos de parcela, cultivo y suelo, lecturas de sensores y pronóstico meteorológico para mostrar una recomendación explicable. YakuAI recomienda; la persona agricultora decide y aplica el riego.

## Estado funcional actual

| Área | Implementación comprobada en código | Límite actual |
|---|---|---|
| Acceso | Inicio unificado por correo y PIN/contraseña; el backend determina el rol. Recuperación de PIN por código. | Tokens de Laravel Sanctum, no JWT. |
| Agricultores y parcelas | Alta, consulta y edición; mapa permite ubicar y dibujar el contorno de una parcela. | No hay endpoints de borrado. El área también puede ingresarse manualmente. |
| Cultivos y suelos | Lectura de cultivos/etapas y texturas de suelo. | La interfaz y API son de consulta; no hay edición ni versionado de catálogos. |
| Sensores | Alta, consulta, edición, normalización/calibración de humedad e ingreso de mediciones manuales o simuladas. | Arduino no envía directamente en esta versión. |
| Clima | OpenWeatherMap por coordenadas, agregado de dos intervalos de 3 horas y fallback demo con el mismo esquema. | Que use OWM real depende de OWM_KEY; si falta o falla, guarda demo/fallback. |
| Evaluación | ET₀ Hargreaves, etapa de cultivo, umbral de humedad, lluvia, rango de litros, confianza y snapshot inmutable. | El comportamiento vigente está descrito en [docs/reglas-v1.md](docs/reglas-v1.md). |
| Riegos | Registro manual, corrección con sucesor y anulación con motivo; historial de riegos. | No acciona válvulas. |
| Alertas | Sensores sin datos/anómalos, evaluaciones incompletas y humedad crítica. | No se genera una alerta específica por lluvia alta. |
| Validación | Matriz determinista de 10 casos demo. | Es una validación de escenarios, no evidencia de precisión en campo. |
| Tareas automáticas | Revisión de sensores cada 15 min, re-chequeo de esperas cada 30 min, auditoría diaria 05:30 y limpieza semanal. | En desarrollo requieren el perfil `produccion` de `docker-compose.yml`; `docker-compose.production.yml` los inicia como servicios separados. |
| WhatsApp | Servicio y trabajos en cola para avisos de auditoría y re-chequeos. | Envío real requiere credenciales y worker activo; sin configuración el servicio simula el envío en logs. |

## Roles y permisos

El frontend ofrece Hoy, Evaluar, Mis riegos y Alertas a agricultores; el personal técnico y administrador ven el panel de operación. El backend aplica scoping de lectura para parcelas del agricultor y limita algunas rutas por rol.

**Autorización:** las rutas privadas requieren Sanctum y el middleware de cuenta activa/capacidades. Las operaciones de usuarios están limitadas a administradores; las mutaciones de agricultores, parcelas y sensores limitan el acceso a personal técnico y administradores mediante solicitudes de validación y comprobaciones de controlador. El control se reparte entre middleware, solicitudes y controladores, así que revisa la ruta y su autorización en backend antes de cambiar permisos. La visibilidad de botones en el frontend no sustituye autorización de la API.

## Arquitectura y ejecución

- Frontend: React 19, Vite, TypeScript, Tailwind CSS v4, React Router, Leaflet y componentes propios/Radix.
- Backend: Laravel 13, PHP 8.3, Sanctum, MySQL 8.4 y Redis 7.
- API: JSON bajo /api/v1.
- Puertos por defecto del compose: frontend 127.0.0.1:8081; API 127.0.0.1:8082.
- El perfil produccion inicia scheduler y worker.

Para desarrollo local, con .env preparado:

~~~sh
docker compose up -d --build
docker compose --profile produccion up -d --build
~~~

La segunda orden añade scheduler y worker al entorno local; no es el despliegue de producción. La guía de producción está en [docs/despliegue-produccion.md](docs/despliegue-produccion.md). Para desarrollo, ver [frontend/README.md](frontend/README.md) y [backend/README.md](backend/README.md).

## Contratos API principales

Rutas protegidas usan Laravel Sanctum. POST /api/v1/auth/login recibe email y secret; el backend valida PIN para agricultor o contraseña para personal. También existen POST /auth/recover-pin, POST /auth/reset-pin, GET /auth/me, POST /auth/logout y POST /auth/refresh.

Recursos principales: users, farmers, plots, sensors, measurements, crops, soil-textures, plots/{plot}/weather, plots/{plot}/evaluate, evaluations, irrigations, alerts, validation y metrics/*. El listado exacto y los métodos están en [backend/routes/api.php](backend/routes/api.php).

## Documentación de referencia

- Dominio y requisitos: este README.
- Reglas del motor: [docs/reglas-v1.md](docs/reglas-v1.md).
- Estados: [docs/estados.md](docs/estados.md).
- Flujo, scheduler y colas: [docs/flujo-backend.md](docs/flujo-backend.md).
- Diseño implementado: [frontend/DESIGN_SYSTEM.md](frontend/DESIGN_SYSTEM.md).
- Integración física futura: [docs/ARDUINO.md](docs/ARDUINO.md).
- Despliegue de producción: [docs/despliegue-produccion.md](docs/despliegue-produccion.md).


## Comprobaciones

Desde frontend/: npm test, npm run lint, npx tsc -b y npm run build.
Desde backend/: php artisan test y vendor/bin/pint --test.

La ejecución de esas órdenes es la que confirma el estado de cada revisión; este README no afirma que las suites estén verdes permanentemente.