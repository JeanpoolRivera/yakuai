# API y recursos

La API JSON está bajo `/api/v1`; las rutas implementadas en `backend/routes/api.php` son la referencia exacta. Salvo salud y autenticación inicial/activación/recuperación, requieren Sanctum y el middleware `yakuai`.

| Método | Ruta | Función |
|---|---|---|
| GET | `/health` | Estado del API. |
| POST | `/auth/login`, `/auth/activate-farmer`, `/auth/recover-pin`, `/auth/reset-pin` | Acceso, activación y recuperación. |
| GET / POST | `/users`; GET / PATCH `/users/{user}` | Gestión de usuarios. |
| GET / POST | `/farmers`; GET / PATCH `/farmers/{farmer}`; POST `/farmers/{farmer}/invitation` | Agricultores e invitaciones. |
| GET / POST | `/plots`; GET / PATCH `/plots/{plot}` | Parcelas. |
| GET / POST | `/sensors`; GET / PATCH `/sensors/{sensor}`; POST `/sensors/{sensor}/simular` | Sensores y simulación. |
| POST | `/plots/{plot}/arduino/configure` | Reutilizar o crear de forma idempotente el conjunto fijo de sensores de la maqueta para una parcela. |
| GET / POST | `/measurements` | Consultar e ingresar mediciones. |
| GET | `/crops`, `/crops/{crop}`, `/soil-textures`, `/soil-textures/{soilTexture}` | Catálogos de consulta. |
| GET | `/plots/{plot}/weather` | Consultar último pronóstico. |
| POST | `/plots/{plot}/weather/refresh` | Actualizar pronóstico. |
| POST | `/plots/{plot}/evaluate` | Crear/obtener evaluación de la hora vigente. |
| POST | `/plots/{plot}/evaluate-demo` | Calcular un escenario ficticio para técnico/admin sin guardar mediciones, pronóstico ni evaluación. Recibe `humedad_pct` (0–100 relativo), `rain_mm` (0–200) y `rain_prob` (0–1). |
| GET | `/evaluations`, `/evaluations/{evaluation}`, `/evaluations/{evaluation}/mensaje` | Consultar evaluación y texto para compartir. |
| GET / POST | `/irrigations`; POST `/irrigations/{riego}/corregir`, `/irrigations/{riego}/anular` | Historial y registro de riegos. |
| GET | `/alerts`, `/validation`, `/metrics/summary`, `/metrics/evaluations`, `/metrics/sensors` | Alertas, escenarios y métricas. |
| GET | `/auth/me` | Consultar sesión actual. |
| POST | `/auth/logout`, `/auth/refresh` | Cerrar o renovar sesión. |

`GET /user` es una ruta auxiliar heredada del esqueleto Laravel. Las respuestas y códigos concretos dependen de cada controlador; las pruebas en `backend/tests/Feature/` documentan escenarios cubiertos. La base local típica es `http://127.0.0.1:8082/api/v1`.
