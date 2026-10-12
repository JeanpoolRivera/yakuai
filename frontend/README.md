# YakuAI · Frontend

Panel agricultor + panel técnico del sistema de apoyo a la decisión de riego.
Consume `api/v1` del backend Laravel; el backend es la fuente de verdad
(endpoints, modelos, permisos y reglas de negocio).

## Stack

React 19 + Vite + react-router-dom + Leaflet (dibujo propio, sin leaflet-draw).
UI: shadcn/ui (primitivas Radix, copy-paste en `src/components/shadcn/`) +
Tailwind CSS v4 (`src/styles/globals.css` + `src/lib/theme.ts`) + Recharts +
TanStack Table + sonner + react-hook-form/zod + lucide-react.

## Estructura

```text
src/
  main.tsx            entrada (router + AuthProvider + globals.css)
  app/
    App.tsx           rutas y puertas por rol
    auth.tsx          sesión (token Sanctum + usuario, cierre auto en 401)
  api/
    client.ts         fetch tipado, {data}/paginados, ApiError, 422-incompleta con data
    types.ts          tipos del contrato backend
    endpoints.ts      una función por recurso
  lib/                theme (tokens), utils (cn), formato es-PE, permisos, geo, toast (sonner), dom
  hooks/              useCollection (buscar/filtrar/paginar en cliente)
  components/
    shadcn.tsx        barrel: 50+ componentes (base + patrones + soil-meter + verdict + datatable…)
    shadcn/           base shadcn + plot-map (Leaflet) + toaster (sonner)
    charts/           wrappers Recharts (Line/Area/Bar)
    forms/            FormField (a11y), FormSection, Wizard
    layout/           Brand, NavSidebar, BottomNav, Topbar, TechShell, FarmerShell
    AuthLayout.tsx    acceso (Login/RecoverPin, intacto)
  pages/              Login, Hoy, Dashboard, Evaluate, Plots, Farmers, Sensors,
                      Weather, Irrigations, Alerts, Catalogs, Validation, RecoverPin
  styles/             globals.css (tokens @theme) + login.css (acceso)
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
