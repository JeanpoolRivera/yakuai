# Interfaz y navegación

La aplicación React monta rutas y sesión en `frontend/src/app/`, páginas en `frontend/src/pages/` y módulos por dominio en `frontend/src/features/`. Las rutas protegidas redirigen a `/login` si no hay sesión; una ruta desconocida del área autenticada vuelve al inicio.

| Ruta | Personal | Agricultor |
|---|---:|---:|
| `/` | Resumen operativo | Hoy |
| `/evaluar` | Sí | Sí |
| `/riegos` | Historial operativo | Mis riegos |
| `/alertas` | Sí | Sí, ámbito de sus parcelas |
| `/parcelas`, `/sensores`, `/clima`, `/agricultores`, `/catalogos`, `/validacion` | Sí | No |
| `/login`, `/recuperar-pin`, `/activar-cuenta` | Acceso público/activación | Acceso público/activación |

El administrador y el técnico comparten la navegación principal del personal. La gestión de usuarios tiene rutas API, pero no una pantalla dedicada en el frontend actual. Los controles de navegación son experiencia de usuario; el backend debe autorizar los recursos. Véase [autenticación y autorización](../backend/autenticacion-y-autorizacion.md).

`frontend/qa-preview.html` usa fixtures locales para revisión visual; no es una ruta de producto ni persiste información.
