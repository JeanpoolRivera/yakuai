# Estructura del repositorio

| Ruta | Contenido |
|---|---|
| `backend/app/Http/Controllers/` | Controladores de API. |
| `backend/app/Http/Requests/` | Validación y autorización de solicitudes. |
| `backend/app/Models/` | Modelos y relaciones Eloquent. |
| `backend/app/Services/` | Motor hídrico, sensores, clima, métricas y mensajería. |
| `backend/app/Jobs/`, `backend/app/Console/Commands/` | Cola y comandos operativos. |
| `backend/routes/` | Rutas HTTP y programación del scheduler. |
| `backend/database/` | Migraciones, seeders y factories. |
| `backend/tests/` | Pruebas PHPUnit. |
| `frontend/src/app/`, `api/`, `features/`, `pages/` | Rutas/sesión, cliente API, dominios y pantallas. |
| `frontend/src/design-system/`, `components/`, `styles/` | Primitivas, componentes y estilos. |
| `docker/` | Imágenes y configuración Nginx/PHP. |
| `docs/` | Documentación funcional y operativa. |
| `.github/workflows/` | Integración continua. |

Este mapa agrupa áreas estables y no pretende enumerar cada archivo. El árbol vigente se puede consultar con `rg --files`.

Los archivos `AGENTS.md`, `CLAUDE.md` y las guías bajo `.claude/` contienen instrucciones para herramientas de desarrollo; no son código que ejecute la aplicación.
