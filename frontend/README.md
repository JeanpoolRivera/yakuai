# YakuAI · Frontend

Panel agricultor + panel técnico del sistema de apoyo a la decisión de riego.
Consume `api/v1` del backend Laravel; el backend es la fuente de verdad
(endpoints, modelos, permisos y reglas de negocio).

## Stack

React 19 + Vite + react-router-dom + Leaflet (+ leaflet-draw para el contorno
de parcelas). Sin UI kits externos: sistema de diseño propio en
`src/styles/tokens.css` + `src/styles/app.css`.

## Estructura

```text
src/
  main.tsx            entrada (router + AuthProvider)
  app/
    App.tsx           rutas y puertas por rol
    auth.tsx          sesión (token Sanctum + usuario, cierre auto en 401)
  api/
    client.ts         fetch tipado, {data}/paginados, ApiError, 422-incompleta con data
    types.ts          tipos del contrato backend
    endpoints.ts      una función por recurso
  lib/                formato es-PE, permisos de vista, geo, toast, dom
  hooks/              useCollection (buscar/filtrar/paginar en cliente)
  components/
    ui.tsx            kit: botones, badges, banners, modales, tabs, veredicto…
    layout.tsx        TechShell (sidebar+topbar) y FarmerShell (bottomnav)
    PlotMap.tsx       Leaflet en chunk separado (lazy)
    Toasts.tsx
  pages/              Login, Hoy, Dashboard, Evaluate, Plots, Farmers, Sensors,
                      Weather, Irrigations, Alerts, Catalogs, Validation
  styles/             tokens (única fuente visual) + componentes/layout
```

## Roles

| Rol | Ve |
|---|---|
| `admin`, `tecnico` (clave) | Todo: resumen, evaluar, parcelas, riegos, alertas, sensores, clima, agricultores, catálogos, validación |
| `agricultor` (PIN 4 dígitos) | Hoy, evaluar, riegos, avisos (solo sus parcelas) |

## Verificación

```sh
npm run build   # tsc -b + vite build
npm run lint    # oxlint, 0 errores
```

El backend valida todo: `php artisan test` (48 tests) desde `backend/`.
Puertos curso: panel `127.0.0.1:8081`, API `127.0.0.1:8082` (según `.env`).
