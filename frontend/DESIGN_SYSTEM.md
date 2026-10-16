# YakuAI · Sistema visual (shadcn/ui + Tailwind CSS v4)

> Reescrito 2026-10-11 (rediseño total, ver `MEJORAS.md`). La versión anterior
> (CSS por módulos + componentes propios) fue retirada en Fase 4.

## Alcance

Capa de presentación: tokens, componentes, layouts y 13 páginas.
No se modificaron rutas, autenticación, peticiones, contratos, cálculos, permisos, eventos ni datos.

## Reglas del sistema

- Fuente única de valores: `src/styles/globals.css` (`@theme` Tailwind v4) reflejada en `src/lib/theme.ts` para JS. Cambiar siempre ambos.
- Excepción retirada 2026-10-13: `src/styles/login.css` fue eliminado (réplica v2 Tailwind); acceso usa `globals.css`.
- Tipografía: Inter / Segoe UI / system-ui (sin descargas). Base 14 px, titulares 24–32 px, tiny 12 px.
- Espaciado base 4 px. Radios: 6 px controles, 8–12 px tarjetas, 12–16 px modales, pill en badges/avatar.
- Verde primario `#146852` (acción) / `#092e2b` (superficies oscuras); acento `#d6e8a9` solo en momentos de decisión. Semáforos siempre con icono + palabra, nunca solo color.
- Iconos: **lucide-react** directo (se retiró el set SVG propio). Excepción: el mapa usa sus marcadores Leaflet.
- Controles: táctil mínimo 44 px (primarias agricultor 52 px+). Foco visible con `box-shadow` (`--shadow-focus`).
- Movimiento: 120/160/240/320 ms `cubic-bezier(.2,.8,.2,1)`; animaciones Radix vía `tw-animate-css`.
- Tablas: scroll horizontal en contenedor con `aria-label`, nunca en toda la página; `data-label` por celda.
- Formularios: selects **nativos** estilizados (compatibilidad + semántica); Radix `Select` solo en filtros.
- Regla de imports: `@/lib/utils`, `@/components/shadcn/*`; alias `@` configurado en `tsconfig.app.json`, `vite.config.ts` y `vitest.config.ts`.

## Organización

| Ruta | Responsabilidad |
|---|---|
| `styles/globals.css` | Tokens `@theme`, base, utilidades, variantes de componente |
| `styles/login.css` | Acceso y recuperación (AuthLayout intacto) |
| `lib/theme.ts` | Tokens en TS + types |
| `lib/utils.ts` | `cn()` (formato vive en `lib/format.ts`) |
| `components/shadcn/` | base shadcn + barrel `components/shadcn.tsx` |
| `components/shadcn/plot-map.tsx` | Mapa Leaflet (proveedor OSM intacto) |
| `components/charts/` | Wrappers Recharts (Line/Area/Bar) |
| `components/forms/` | FormField (a11y por clonado), FormSection, Wizard |
| `components/layout/` | Brand, NavSidebar, BottomNav, Topbar, TechShell, FarmerShell |
| `pages/` | 13 páginas (lógica y contratos intactos) |

## Composición responsive

- Escritorio: sidebar persistente 248 px + contenido max 1408 px.
- Móvil: sidebar en `sheet`; bottom-nav fija en agricultor (con safe-area).
- Formularios 1 columna en móvil, 2 en escritorio (`sm:`).
- Breakpoints: 360 / 480 / 768 / 1024 / 1280 / 1536 / 1920.

## Validación realizada · 11/10/2026

- `tsc -b`: 0 errores. `lint`: 0 errores (19 advertencias benignas).
- `vitest`: 135/135 (incluye 7 tests portados: SoilMeter×4, FormField, DataTable, FilterTabs).
- `vite build`: correcto.
- Pendiente manual: inspección visual escritorio/tablet/móvil × rol.
