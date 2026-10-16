# MEJORAS.md — Rediseño total del frontend (shadcn/ui + Tailwind CSS v4)

> **Nota de reemplazo (2026-10-11):** este archivo fue vaciado y reescrito por orden expresa del usuario.
> El contenido anterior (plan maestro ETAPA I / ETAPA II / PARTE III VD-0…VD-12, 1632 líneas)
> **no se perdió**: está versionado en git y se recupera con:
> `git show HEAD:MEJORAS.md` (commit `74f86e8`).
> Este documento es ahora la referencia única de la sesión de rediseño total.

---

## 1. Alcance y decisiones

### 1.1 Qué cambia y qué NO cambia

| Capa | ¿Cambia? | Detalle |
|------|----------|---------|
| Presentación del frontend (componentes, estilos, layouts, 13 páginas) | **SÍ** | Rediseño total con shadcn/ui + Tailwind v4 |
| Lógica del frontend (`api/`, `hooks/`, `lib/format`, `lib/permissions`, `lib/geo`, `features/`, `app/auth.tsx`, `app/navigation.ts`) | **NO** | Cero cambios |
| Backend (Laravel), BD, Docker, infra | **NO** | Cero cambios |
| Contratos API `/api/v1` | **NO** | Cero cambios |
| Tests (lógica) | Parcial | Solo se actualizan selectores/classNames en Fase 3 |

### 1.2 Stack decidido

**shadcn/ui (copy-paste, primitivas Radix) + Tailwind CSS v4 + Recharts + TanStack Table + date-fns + sonner + react-hook-form + zod.**

Motivos (análisis comparativo vs MUI / Mantine / Chakra / Headless UI, sesión 2026-10-11):
1. Mobile-first real para agricultores (Tailwind responsive + bundle mínimo).
2. Bundle mínimo (~20 KB vs 67–335 KB) para conectividad rural.
3. Control total del diseño agrícola propio (sin look Material/Mantine genérico).
4. Mapas (Leaflet ya instalado) + charts + forms complejos sin licencias de pago.
5. Ownership: componentes en el repo, sin vendor lock-in ni breaking changes externos.
6. Accesibilidad AAA vía primitivas Radix.

### 1.3 Estructura: evolución, no ruptura

Se mantiene la arquitectura de carpetas. Cambios:
- `components/ui/` (PascalCase, legacy) → convive con `components/ui/*.tsx` (minúsculas, shadcn) durante la migración.
- Nuevo: `components/shadcn/` (26 componentes + barrel `shadcn.tsx`), `components/layout/`, `components/charts/`, `components/forms/`, `lib/theme.ts`, `lib/utils.ts` (`cn` + alias `@`), `styles/globals.css`.
- `styles/*.css` legacy (7 archivos + tokens) se reemplazan por **un solo** `styles/globals.css` en Fase 4.

### 1.4 Restricciones heredadas

- Colorimetría y tipografía del **Login** son la fuente del Design System (extraídas 1:1 de `tokens.css` + `login.css`).
- Todo lo demás (espaciado, radios, sombras, breakpoints, z-index, transiciones, layout) a criterio experto, future-proof.

---

## 2. Inventario actual (2026-10-11, rama `master`, 2 commits)

### 2.1 Frontend

```
frontend/src/
├── api/            # client.ts, endpoints.ts, types.ts (INTOCABLE)
├── app/            # App.tsx, auth.tsx, navigation.ts (INTOCABLE salvo imports en Fase 4)
├── components/
│   ├── layout.tsx      # TechShell + FarmerShell + Brand (legacy, a separar en Fase 2)
│   ├── AuthLayout.tsx  # (legacy)
│   ├── LineChart.tsx   # SVG propio (a reemplazar por Recharts en Fase 2)
│   ├── PlotMap.tsx     # Leaflet (a envolver en Fase 2)
│   ├── Toasts.tsx      # (a reemplazar por sonner en Fase 2)
│   ├── ui.tsx          # Barrel LEGACY restaurado (NO TOCAR hasta Fase 3)
│   └── ui/             # PascalCase legacy + minúsculas shadcn (nuevos, §4)
├── design-system/  # OverviewUI.tsx (untracked, preexistente)
├── features/       # overview/useOverview.ts (untracked, preexistente)
├── hooks/          # useCollection.ts (INTOCABLE)
├── lib/            # format.ts, permissions.ts, geo.ts, toast.ts, dom.ts (INTOCABLES)
│   ├── theme.ts    # NUEVO (tokens TS, §3)
│   └── utils.ts    # NUEVO (cn + format — ver E-16)
├── pages/          # 13 páginas + 13 .test.tsx (se rediseñan en Fase 3)
├── styles/         # index.css + 7 legacy (se reemplazan en Fase 4)
│   └── globals.css # NUEVO (Tailwind v4 @theme — ver E-04, E-05, E-11, E-12, E-13)
├── main.tsx        # importa ./styles/index.css (cambio programado Fase 4, ver E-05)
└── qa-preview.tsx
```

### 2.2 Páginas (13) y orden de rediseño (Fase 3)

| # | Página | Ruta | Qué valida |
|---|--------|------|------------|
| 1 | Login | `/login` | Auth layout, forms, panel story oscuro |
| 2 | RecoverPin | `/recuperar-pin` | Steps, reenvío, contacto |
| 3 | Dashboard | `/` (equipo) | DataTable, charts, stats, prioridades |
| 4 | Hoy | `/` (agricultor) | Mobile-first, bottom nav, timeline |
| 5 | Plots | `/parcelas` | Mapa + DataTable + wizard dibujo |
| 6 | Sensors | `/sensores` | Tiempo real, estados, mapa |
| 7 | Irrigations | `/riegos` | Filtros fecha, timeline, modales |
| 8 | Evaluate | `/evaluar` | Wizard, soil-meter, verdict, date pickers |
| 9 | Catalogs | `/catalogos` | Acordeón, tabs, search, glosario |
| 10 | Farmers | `/agricultores` | CRUD, search, paginación |
| 11 | Alerts | `/alertas` | Lista, filtros severidad, acciones |
| 12 | Weather | `/clima` | Charts, cards pronóstico |
| 13 | Validation | `/validacion` | Comparativas, métricas, reportes |

### 2.3 Backend

Intacto. Archivo stray preexistente sin trackear: `backend/NUL` (no generado en esta sesión; pendiente eliminar).

---

## 3. Design System (fuente: Login actual + criterio experto)

### 3.1 Colorimetría — EXACTA del Login (`tokens.css`)

Verde primario: `#edf7f2 / #d9eee4 / #bee0d2 / #97c9b7 / #399279 / #207c63 / #146852 / #103e38 / #092e2b`.
Semánticos: success `#24734d`, warning `#99610b`, danger `#b7353d`, info `#326899`
(+ variantes `-bg/-border/-text` y strengths `#15803d / #b45309 / #b91c1c`).
Neutros: `#f8fafb / #f4f6f8 / #e1e7ec / #a5b3bd / #667b87 / #5d727f / #4d626f / #172b36`.
Dark story: bg `#092e2b`, card `#103e38`, border `#165349`, text `#fff`, muted `#c5d9d4`, accent `#d6e8a9`.
Veredictos: riega `#fff8ea`, no `#eff8f2`, espera `#eff6fc`, incompleta `#f5f6f7`.

### 3.2 Tipografía — EXACTA del Login

Inter / Segoe UI / system; mono SFMono/Consolas.
Escala: 10px kicker · 12px tiny · 13px small/labels · **14px base** · 16px · 18px · 24px · 32px (h1 login) · 40/48/64px story.
Line-height: 1.25 titulares / 1.55 cuerpo / 1.75 story. Tracking: -0.055em títulos, +0.08/+0.12em kickers.

### 3.3 Resto — criterio experto future-proof (implementado en `lib/theme.ts` + `styles/globals.css`)

Espaciado base 4px (0–128px) · Radios 3/6/8/12/16/24/full · Sombras xs–2xl + focus rings por semántico ·
Breakpoints 360/480/768/1024/1280/1536/1920 · z-index 100–900 · Transiciones 120/160/240/320ms `cubic-bezier(.2,.8,.2,1)` ·
Layout: sidebar 248px, topbar 68px, container 1408px, touch 44px.

**Regla de sincronía:** CSS (`globals.css` `@theme`) manda; `theme.ts` lo refleja para uso en JS. Cambiar siempre ambos.

---

## 4. FASE 1 — Setup base · Estado: `COMPLETADO` (2026-10-11)

### 4.1 Hecho (verificado en disco el 2026-10-11)

- [x] `frontend/src/lib/theme.ts` — tokens TS completos + types.
- [x] `frontend/src/lib/utils.ts` — `cn()` + `format` (ver E-16).
- [x] `frontend/src/styles/globals.css` — Tailwind v4 `@theme` con todos los tokens (con defectos: E-11, E-12, E-13).
- [x] `frontend/components.json` — config shadcn/ui (style new-york, css → `src/styles/globals.css`, alias `@/*`, iconLibrary lucide).
- [x] `frontend/package.json` — deps añadidas: 21 `@radix-ui/*` (sin pagination, correcto), `@tanstack/react-table`, `class-variance-authority`, `clsx`, `cmdk`, `date-fns`, `lucide-react`, `recharts`, `react-hook-form`, `sonner`, `tailwind-merge`, `zod`, `@hookform/resolvers`; dev: `tailwindcss@4.3.3` + `@tailwindcss/vite@4.3.3` (correcto; `postcss/autoprefixer` eliminados, correcto en v4).
- [x] 26 componentes shadcn en `frontend/src/components/shadcn/*.tsx`: accordion, avatar, badge, button, card, checkbox, collapsible, dialog, dropdown-menu, form, input, label, navigation-menu, pagination, radio-group, scroll-area, select, separator, sheet, slider, switch, table, tabs, textarea, toast, tooltip (+ barrel `src/components/shadcn.tsx`). Ubicación `shadcn/` en vez de `ui/` por E-19.
- [x] Limpieza de raíz: eliminados `node_modules/`, `package.json`, `package-lock.json` y `home/...` creados por error (ver E-01).
- [x] `frontend/src/components/ui.tsx` restaurado a legacy (build actual no roto por este frente).

### 4.2 Errores de implementación detectados (todos PENDIENTES de corrección)

| ID | Archivo | Síntoma verificado | Causa | Solución | Estado |
|----|---------|-------------------|-------|----------|--------|
| E-01 | (raíz repo) | `npm install` creó `node_modules/`, `package.json`, `package-lock.json` y `home/jeanpool/...` en la RAÍZ | Comandos ejecutados con cwd en raíz (PowerShell + rutas UNC/WSL); `mkdir -p` con ruta Linux creó árbol anidado | Raíz limpiada. Regla: todo `npm/npx` vía WSL con cwd=`frontend/` (ver E-20) | Corregido 2026-10-11 |
| E-02 | `frontend/node_modules` | **No contenía** `@radix-ui/*`, `recharts`, ni `tailwindcss` | Los installs exitosos cayeron en la raíz (E-01) | `npm install` ejecutado vía WSL en `frontend/`: 124 paquetes, 321 auditados | Corregido 2026-10-11 |
| E-03 | 25 componentes nuevos | Importaban `@/lib/utils` sin resolver | Sin alias `@` en `tsconfig.app.json`, `vite.config.ts`, `vitest.config.ts` | Añadidos `paths: {"@/*": ["src/*"]}` + `resolve.alias` en vite y vitest | Corregido 2026-10-11 |
| E-04 | `vite.config.ts` | Sin plugin Tailwind; `globals.css` v4 (`@theme`) no se procesaba | Config intacta legacy | Añadido `@tailwindcss/vite` a plugins (server/proxy intactos) | Corregido 2026-10-11 |
| E-05 | `main.tsx` | Importa `./styles/index.css`; `globals.css` huérfano | Cambio diferido a propósito | Cambiar a `./styles/globals.css` **en Fase 4** (no antes) | Programado |
| E-06 | `shadcn/form.tsx` | `import * as Slot` inválido + import `cva` sin usar (+ conflicto de refs TS2322 en Field/Control) | Plantilla copiada sin adaptar | `import { Slot }`; quitado `cva`; Field/Control sin `forwardRef` (wrappers sin ref) | Corregido 2026-10-11 |
| E-07 | `shadcn/slider.tsx` | `SliderPrimitive.TickMark` inexistente en API Radix → error `tsc` | Línea inventada | Línea eliminada | Corregido 2026-10-11 |
| E-08 | `shadcn/checkbox.tsx` | Check invisible (`text-primary-700` sobre `bg-primary-700`) | Token mal aplicado | `text-white` en checked | Corregido 2026-10-11 |
| E-09 | `shadcn/separator.tsx` | `React.ElementRef<typeof React.Fragment>` inválido → error `tsc` | Implementación casera | Reescrito con `@radix-ui/react-separator` | Corregido 2026-10-11 |
| E-10 | `shadcn/pagination.tsx` | **Archivo inexistente** (falló su creación) | Llamada `write` sin `filePath` | Creado sin Radix (no existe `@radix-ui/react-pagination`): nav + links + ellipsis, etiquetas en español | Corregido 2026-10-11 |
| E-11 | `styles/globals.css` (`*:focus-visible`) | `ring: 3px solid …` no es propiedad CSS válida (ignorada) | Confusión Tailwind↔CSS | Reemplazado por `box-shadow: var(--shadow-focus)` | Corregido 2026-10-11 |
| E-12 | `styles/globals.css:2` | `@import "tailwindcss/preflight"` redundante/riesgoso en v4 | Plantilla v3 | Eliminado (preflight incluido en `@import "tailwindcss"`) | Corregido 2026-10-11 |
| E-13 | `toast/select/dialog/…` + `accordion/collapsible` | Clases `animate-in/fade-in-0/zoom-in-95/slide-in-*`, `animate-accordion-*`, `animate-collapsible-*` sin definición | Dependencia omitida | **Decisión aplicada:** instalado `tw-animate-css@^1.0.0` + `@import` en `globals.css` | Corregido 2026-10-11 |
| E-14 | `shadcn/switch.tsx` | Truco `after:` + `peer-data` no canónico | Estilo improvisado | Reescrito patrón canónico (track + `Thumb` con `translate-x`) | Corregido 2026-10-11 |
| E-15 | (barrel) | Componentes nuevos sin export central | Reversión de seguridad (correcta) | Creado `src/components/shadcn.tsx` (26 exports); `ui.tsx` legacy se retira en Fase 3 por página | Corregido 2026-10-11 |
| E-16 | `lib/utils.ts` vs `lib/format.ts` | `format` duplicaba `lib/format.ts` (verificado: 0 usos del duplicado) | Utilidad creada sin auditar legacy | Duplicado eliminado; `lib/format.ts` queda canónico; `utils.ts` solo exporta `cn` | Corregido 2026-10-11 |
| E-17 | `shadcn/navigation-menu.tsx` | Estructura de viewport/contenido custom divergía del patrón shadcn | Adaptación libre | Reescrito al patrón canónico (content/viewport/indicator + clases de motion) | Corregido 2026-10-11 |
| E-18 | `MEJORAS.md` (working copy) | Apareció **vacío (0 líneas)** en esta sesión; causa desconocida | Sin determinar (no fue edición manual registrada) | Restaurado desde HEAD; reescrito por orden del usuario. Contenido previo recuperable (`§9`) | Registrado |
| E-19 | `tsc -b` | `TS1149`: `ui/button.tsx` vs `ui/Button.tsx` y `ui/dialog.tsx` vs `ui/Dialog.tsx` difieren solo en casing | Nuevos (minúsculas) y legacy (PascalCase) en el mismo directorio | **Resuelto:** nuevos movidos a `src/components/shadcn/`; legacy intacto en `src/components/ui/`; barrel + imports + `components.json` actualizados | Corregido 2026-10-11 |
| E-20 | `npm install` (Windows→WSL) | `EISDIR` en `node_modules/.bin/*`: npm de Windows no maneja symlinks Linux del mount `\\wsl.localhost` | CWD/entorno incorrecto | **Resuelto:** installs y comandos node vía `wsl -d Ubuntu` (Linux nativo). Regla: todo `npm/npx` se ejecuta en WSL, nunca desde PowerShell contra el mount | Corregido 2026-10-11 |
| E-21 | `frontend/dist/` | `EACCES rmdir dist/assets` en `npm run build`: `dist/` y `dist/assets/` pertenecían a **root** (build Docker 2026-10-10) | Artefacto generado por contenedor | **Resuelto por el usuario 2026-10-11:** `sudo rm -rf frontend/dist` + `npm run build` limpio (✓ 6.00s, 1713 módulos, `dist/` regenerado con su usuario) | Corregido |
| E-22 | Servicio `frontend` en crash-loop | `Cannot find module '../lightningcss.linux-x64-musl.node'`: imagen `node:22-alpine` (musl) + volumen `./frontend:/app` monta el `node_modules` del host (glibc) sin binario musl. Introducido por Tailwind v4 (binario nativo; v3 era JS puro) | Incompatibilidad libc host/contenedor | `docker/frontend/Dockerfile`: base `node:22-alpine` → `node:22-slim` (glibc, igual que el host). Requiere `docker compose up --build` | Corregido (pendiente rebuild por el usuario) |

### 4.3 Cierre de Fase 1 (verificado 2026-10-11, vía WSL)

- [x] Corregidos E-02, E-03, E-04 (install + alias `@` + plugin Tailwind v4).
- [x] Corregidos E-06, E-07, E-08, E-09, E-10, E-11, E-12, E-14, E-16, E-17, E-19.
- [x] E-13 decidido y aplicado (`tw-animate-css`).
- [x] Creado E-15 (`src/components/shadcn.tsx`, 26 exports).
- [x] `npx tsc -b` → 0 errores. `npm run lint` → 0 errores (17 warnings preexistentes en páginas legacy). `npm test` → 21 archivos, **139/139** (igual que marca VD-1 en HEAD). `vite build` → ✓ 2.74s (outDir temporal por E-21).
- [x] `main.tsx`/`index.css` intactos (E-05 programado para Fase 4).
- [x] Regla operativa fijada: todo `npm/npx` se ejecuta en WSL con cwd=`frontend/` (E-20).

---

## 5. FASE 2 — Componentes core YakuAI · Estado: `COMPLETADO` (2026-10-11)

Orden aplicado: `F2-8` → `F2-1` → `F2-2` → `F2-4` → `F2-3` → `F2-5` → `F2-6` → `F2-7`.
Verificación: `tsc` 0 errores · `lint` 0 errores (17 warnings legacy, archivos nuevos limpios) · tests 139/139.
Verificación por componente: `tsc` + `lint` + render aislado (story en `qa-preview.tsx` o test) sin romper páginas legacy.

### F2-8 — Patrones sin equivalente shadcn directo (PRIMERO)

| Archivo | Spec |
|---------|------|
| `components/shadcn/page-head.tsx` | `PageHead({eyebrow?, title, description?, actions?})`. Patrón único de cabecera (§3): eyebrow + título + descripción + acciones. Reemplaza `Surface.tsx:PageHead`. |
| `components/shadcn/stat.tsx` | `Stat({label, value, hint?, to?, tone?})`. Cifra tabular + enlace opcional. Reemplaza `Surface.tsx:Stat`. |
| `components/shadcn/feedback.tsx` | `Empty({icon?, title, hint?, action?})`, `Loading({text?})`, `Skeletons`, `Banner({tone, children})`. Reemplaza `Feedback.tsx`. Banner usa `bg-*-50/border-*/text-*` + icono + palabra. |
| `components/shadcn/search-input.tsx` | `SearchInput({value, onChange, placeholder?})`: shadcn `input` + icono lupa + clear. Reemplaza `Field.tsx:SearchInput`. |
| `components/shadcn/stepper.tsx` | `Stepper({steps, current})` + `Pager` (paginación simple legacy `Navigation.tsx:Pager`). Stepper de puntos numerados para wizards; Pager prev/next con `useCollection` (`hooks/useCollection.ts` INTOCABLE). |
| `components/shadcn/confirm.tsx` | `Confirm` sobre shadcn `dialog` (título + mensaje + acciones). Reemplaza `Dialog.tsx:Confirm`. |

### F2-1 — `SoilMeter` v2

- Archivo: `components/shadcn/soil-meter.tsx`. Exportar en `shadcn.tsx`.
- Contrato (de `components/ui/Irrigation.tsx:9-18`, NO cambiar lógica): props `{actual, umbral, critico}` en **porcentaje 0–100** (el caller convierte fracción→% antes).
- Estados: `pct<=critical` → "Crítico — regar hoy" (badge `critica`); `<=threshold` → "Bajo umbral" (`riega`); else "Adecuado" (`ok`). Nulo/no-finito → "Sin dato de humedad".
- Visual: pista redondeada h-10px, fill por estado, marcas PMP/umbral en pastilla legible, cifra `tabular-nums`.
- A11y: `role=progressbar` + `aria-valuenow/min/max/label` (conservar del legacy).
- Usan: Hoy (F3-4), Evaluate (F3-8).

### F2-2 — `VerdictCard`

- Archivo: `components/shadcn/verdict-card.tsx`. Exportar en `shadcn.tsx`.
- Contrato (de `Irrigation.tsx:56-72`): `{tone: riega|no|espera|incompleta, kicker, title, amount?, chips[], action?, children?}`.
- Iconos (conservar mapa): riega=drop, no=check, espera=cloud, incompleta=alert (lucide directo).
- Fondos `bg-verdict-*-bg` + borde semántico + badge textual (nunca solo color).
- Usan: Evaluate (F3-8). Variante hero de página (pantalla completa) se compone en la página, no aquí.

### F2-4 — Charts (Recharts)

- Archivos: `components/charts/{LineChart,AreaChart,BarChart}.tsx` (+ exportar vía `components/charts.ts` o `shadcn.tsx`).
- Compat: props `{data: {label, value}[], height=200, color=primary-700, unit?}` (igual que `LineChart.tsx:8-13` actual) para migración directa.
- `ResponsiveContainer` obligatorio; tooltip con `unit`; vacío → "Sin datos para graficar." (mismo texto legacy).
- Paleta primary + semáforos; cifras tabulares. Reemplaza `LineChart.tsx` SVG en Fase 4.
- Usan: Sensors, Weather, Dashboard (F3).

### F2-3 — `PlotMap` wrapper

- Archivo: `components/shadcn/plot-map.tsx`. Re-exporta y estiliza `components/PlotMap.tsx` (Leaflet + OSM INTACTOS como proveedor).
- Contrato (de `PlotMap.tsx:31-42`): `{plots: {id,name,latitude,longitude,farmerName?}[], editable?, onDraw(DrawResult)?, focus?, zoom?}`; `DrawResult={ring, lat, lng, areaM2}`.
- Defaults: `CHUPACA [-12.0667,-75.2833]`; colores de dibujo (`MARKER_EDGE #285942`, `SKETCH_EDGE #b3541e`…) → migrar a tokens primary/warning.
- Chrome de dibujo ("Fijar punto / Marcar esquinas / Usar contorno") con shadcn `button`; mapa `min-h 280px` móvil + botón ubicación; región `aria-label` + instrucciones `sr-only` (conservar).
- Usan: Plots (F3-5). `PlotMap.tsx` legacy se retira en Fase 4.

### F2-5 — Forms (RHF + zod)

- Archivos: `components/forms/{FormField,FormSection,Wizard}.tsx`.
- `FormField`: shadcn `form.tsx:FormField/FormItem/FormLabel/FormControl/FormMessage` + `input/select/textarea` + hint + error asociado (`aria-describedby`).
- `FormSection`: fieldset con título + descripción + grid 1col móvil / 2col escritorio.
- `Wizard`: `steps[]`, estado `current`, validación zod por paso, `Stepper` F2-8, botones Atrás/Continuar (táctil ≥52px agricultor).
- Usan: Evaluate (selector + confirmación), Plots (wizard 3 pasos), Irrigations (anotar/corregir/anular), Farmers (registro/edición), Sensors (registro + lectura), RecoverPin (pasos).

### F2-6 — Layouts

- Archivos: `components/layout/{Brand,NavSidebar,BottomNav,Topbar,TechShell,FarmerShell}.tsx`.
- Fuente: `components/layout.tsx:10-93` (Brand, TechShell, FarmerShell) + `app/navigation.ts` (`NAVIGATION` 3 grupos/10 ítems, `FARMER_NAVIGATION` 4 ítems, `ROUTE_TITLES`).
- Preservar comportamiento: skip-link, drawer ≤1000px con foco trampeado + Escape, `<Toasts/>` (luego sonner), `document.title` por crumb, redirección por rol en `App.tsx` (NO tocar lógica).
- Visual nuevo con Tailwind: sidebar colapsable desktop / `sheet` móvil; bottomnav fija agricultor; topbar con breadcrumb + fecha + avatar (`initial()` de `lib/format.ts`).
- `AuthLayout.tsx` y Login intactos (no se tocan).

### F2-7 — Toaster (sonner)

- Archivos: `components/shadcn/toaster.tsx` (`<Toaster>` sonner con tokens) + bridge en `lib/toast.ts` (auditar: páginas usan `toastError/toastOk/toastInfo` — mantener firmas, cambiar implementación a sonner).
- Variantes: default / success / destructive. `Toasts.tsx` legacy se retira en Fase 4.
- Verificar que ningún test legacy dependa del DOM de `Toasts` (revisar `test/fixtures` + mocks si falla).

Salida Fase 2: todo lo anterior renderizando aislado + `tsc`/`lint`/`tests` verdes + MEJORAS §5 marcado por componente.

### Cierre 2026-10-11 (todo verificado)

- [x] F2-8: `page-head, stat, feedback (Banner/Empty/Loading/Skeletons), search-input, stepper (Stepper/Pager), confirm` — mismas APIs legacy (iconos `string` → `ReactNode` lucide; `Stat` añade `to?`).
- [x] F2-1/F2-2: `soil-meter` (lógica % + estados legacy intactos) y `verdict-card` (4 tonos, mapa de iconos legacy).
- [x] F2-4: `charts/{LineChart,AreaChart,BarChart}` Recharts, props compatibles con `LineChart.tsx` legacy.
- [x] F2-3: `shadcn/plot-map` envuelve `PlotMap.tsx` (Leaflet OSM intacto).
- [x] F2-5: `forms/{FormField (cloneElement a11y),FormSection,Wizard}` (RHF/zod en páginas Fase 3).
- [x] F2-6: `layout/{Brand,NavSidebar,BottomNav,Topbar,TechShell,FarmerShell}` (misma navegación/roles; drawer→`sheet` móvil).
- [x] F2-7: `shadcn/toaster` sonner tokenizado. Puente `lib/toast.ts` + reemplazo `<Toasts/>` diferidos a Fase 4 (páginas aún usan legacy).
- [x] Barrel `shadcn.tsx` (44 exports). Colisión `FormField` resuelta: barrel exporta el wrapper `forms/`; primitivas `shadcn/form` por ruta profunda.
- [x] Corrección global: tonos `*-200/400/800` inexistentes → `*-100/600` del tema (toast, stat, feedback, verdict).

---

## 6. FASE 3 — Rediseño de las 13 páginas · Estado: `COMPLETADO` (2026-10-11)

Verificación: `tsc` 0 errores · `lint` 0 errores (19 warnings: 17 legacy + 2 fast-refresh benignos en barrels) · tests 21 archivos / **139/139**.

Orden: Login → RecoverPin → Dashboard → Hoy → Plots → Sensors → Irrigations → Evaluate → Catalogs → Farmers → Alerts → Weather → Validation.

Por página: rediseñar con F2 + shadcn → actualizar su `.test.tsx` (solo selectores/classNames, sin cambiar casos) → `vitest` + `lint` + `tsc` verdes → commit.
Regla: la primera página que usa un compartido fija su visual; las siguientes reutilizan.
Al cerrar cada página se retiran sus estilos legacy que queden huérfanos (`login.css`, `shell.css`, `operations.css`, `management.css`, `monitoring.css`, `workspace-v2.css`, `app.css`).
Convención: tamaños medidos 2026-10-11 (líneas incl. imports). Endpoints = `api/endpoints.ts` (INTOCABLE). Legacy-ui = `components/ui.tsx`.

### F3-1 — Login (`pages/Login.tsx`, 236 líneas)

- Preservar: `useAuth().signInPassword`, validación email/PIN, `passwordStrength`, caps-lock hint, `hintFor` por status, `AuthLayout` + story panel (INTACTOS), footer.
- Reemplazar: `Icon` → lucide; `access-*` CSS → shadcn `input`/`button` + `form.tsx` + `Banner` (F2-8) para `access-alert`; `access-strength` con tokens success/warning/danger.
- Test: `Login.test.tsx` (53 líneas). Roles: n/a (pública).

### F3-2 — RecoverPin (`pages/RecoverPin.tsx`, 237 líneas)

- Preservar: flujo `recoverPin` → `resetPin` (email → código → PIN), reenvío, modal contacto, `useNavigate`, `AuthLayout` (INTACTO).
- Reemplazar: `Icon/Modal/Button` legacy → shadcn `dialog` + `button`; pasos con `Wizard`/`Stepper` (F2-5/F2-8).
- Test: `RecoverPin.test.tsx` (63 líneas).

### F3-3 — Dashboard (`pages/Dashboard.tsx`, 143 líneas, equipo)

- Preservar: `listAlerts/listEvaluations/listPlots/listSensors/getMetricsSummary`, KPIs enlazados, frescura, críticas primero (ET-2.12).
- Reemplazar: `PageHead/DataTable/Badge/Banner/Card/Empty/Icon/Skeletons/Stat` → F2-8 + shadcn `table/card/badge` + TanStack donde aplique.
- Test: `Dashboard.test.tsx` (51 líneas). Fija visual de: `PageHead`, `Stat`, `DataTable` patterns, `Skeletons`.

### F3-4 — Hoy (`pages/Hoy.tsx`, 248 líneas, agricultor, mobile-first)

- Preservar: `listEvaluations/listPlots/listSensors`, `latestPerPlot`, filtros `Filter/Sort`, `search`.
- Reemplazar: `Badge/Banner/Empty/Icon/Loading/SearchInput/SoilMeter/Tabs` → F2-1 + F2-8 + shadcn. CTA táctil ≥52px.
- Test: `Hoy.test.tsx` (56 líneas). Fija visual de: `SoilMeter` v2 en lista, `Tabs` filtros, `SearchInput`.

### F3-5 — Plots (`pages/Plots.tsx`, 614 líneas, LA MÁS GRANDE, equipo)

- Preservar: `createPlot/updatePlot/listCrops/listFarmers/listPlots/listSoils`, `PlotInput`, `DrawResult`, `useCollection`, wizard 3 pasos, geolocalización opcional + cálculo área (ET-2.4).
- Reemplazar: 15 legacy (`Badge/Banner/Button/Card/Empty/Field/Loading/Icon/Modal/PageHead/Pager/SearchInput/SelectInput/Stepper/TextInput`) + `PlotMap` → F2-3/F2-5/F2-8 + shadcn. Lazy en `App.tsx` se mantiene.
- Test: `Plots.test.tsx` (57 líneas). Riesgo: dibujo Leaflet en jsdom (mock existente en test — no tocar lógica de mock).

### F3-6 — Sensors (`pages/Sensors.tsx`, 400 líneas, equipo)

- Preservar: `createMeasurement/createSensor/listPlots/listSensors`, `useCollection`, `TIPOS`, lectura manual/demo, calibración, estados ok/atención.
- Reemplazar: 17 legacy (incl. `Tabs/Stat/Modal/Pager`) → shadcn + F2-4 (charts por sensor) + F2-8.
- Test: `Sensors.test.tsx` (95 líneas).

### F3-7 — Irrigations (`pages/Irrigations.tsx`, 439 líneas, ambos roles)

- Preservar: `correctIrrigation/createIrrigation/listIrrigations/listPlots/voidIrrigation`, `useCollection`, `desvioTone`, filtro período (ET-2.8), bloqueo duplicado 24h (FT-1.5), `submitForm` (`lib/dom.ts`).
- Reemplazar: 15 legacy (incl. `Confirm/Modal/Pager/Stat/TextInput`) → shadcn `dialog` + F2-5 + F2-8. Variante agricultor simple / equipo completa.
- Test: `Irrigations.test.tsx` (63 líneas).

### F3-8 — Evaluate (`pages/Evaluate.tsx`, 365 líneas, ambos roles, NÚCLEO DEL SISTEMA)

- Preservar: `createIrrigation/evaluatePlot/getEvaluationMessage/listEvaluations/listIrrigations/listPlots`, `useLocation` plotId, `toast*`, WhatsApp share, `confirming/sharing` states, guía incompletas por rol (ET-2.3), conversión fracción→% antes de `SoilMeter` (FT-1.1, NO tocar).
- Reemplazar: 12 legacy (incl. `SoilMeter/VerdictCard/Card/Field/SelectInput`) → F2-1/F2-2/F2-5 + shadcn. Hero de veredicto por tono (4 variantes) compuesto en página.
- Test: `Evaluate.test.tsx` (78 líneas). Máxima prioridad de QA manual por rol.

### F3-9 — Catalogs (`pages/Catalogs.tsx`, 200 líneas, equipo, solo lectura)

- Preservar: `listCrops/listSoils`, buscador + glosario (ET-2.11), fuente FAO-56/Saxton.
- Reemplazar: 8 legacy (`Badge/Banner/Card/Empty/Icon/Loading/PageHead/SearchInput`) → shadcn `accordion/table` + F2-8.
- Test: `Catalogs.test.tsx` (32 líneas).

### F3-10 — Farmers (`pages/Farmers.tsx`, 241 líneas, técnico/admin)

- Preservar: `createFarmer/listFarmers/updateFarmer`, `useCollection`, `twoInitials`, estado editable (ET-2.5), `submitForm`.
- Reemplazar: 15 legacy (incl. `DataTable/Modal/Pager/SelectInput/TextInput`) → TanStack + shadcn `table/dialog` + F2-5 + `Avatar` shadcn (iniciales).
- Test: `Farmers.test.tsx` (64 líneas).

### F3-11 — Alerts (`pages/Alerts.tsx`, 165 líneas, ambos roles)

- Preservar: `listAlerts`, `useCollection`, explicación+acción por alerta (ET-2.7).
- Reemplazar: 10 legacy (incl. `Pager/Stat/Tabs/PageHead`) → shadcn + F2-8. Severidad con franja + icono + palabra.
- Test: `Alerts.test.tsx` (49 líneas).

### F3-12 — Weather (`pages/Weather.tsx`, 242 líneas, equipo)

- Preservar: `getWeather/listPlots/refreshWeather`, `FRESH_MIN=180`, validación+prellenado (ET-2.10), demo/OWM.
- Reemplazar: 12 legacy (incl. `Card/Field/SelectInput/TextInput`) → shadcn + F2-4 (charts pronóstico/histórico).
- Test: `Weather.test.tsx` (63 líneas).

### F3-13 — Validation (`pages/Validation.tsx`, 177 líneas, técnico/admin)

- Preservar: `runValidation`, `useCollection`, tabs todos/ok/fallos, motivo traducido, `runningRef` anti-doble-ejecución.
- Reemplazar: 12 legacy (incl. `Card/Pager/SearchInput/Tabs`) → shadcn + barra progreso (`progress` Radix ya en deps; crear wrapper si hace falta).
- Test: `Validation.test.tsx` (39 líneas).

---

## 7. FASE 4 — Integración y QA · Estado: `COMPLETADO (agente)` — pendientes de usuario: E-21 + QA visual (2026-10-11)

Secuencia aplicada:

1. [x] Cierre Fase 3 verificado: ninguna `pages/*.tsx` importa `../components/ui` legacy (grep de control).
2. [ ] `sudo rm -rf frontend/dist` (E-21: artefacto root-owned; **lo ejecuta el usuario**; builds verificados con `--outDir /tmp`).
3. [x] `main.tsx`: `globals.css` (+ `login.css`, ver D-15); `qa-preview.tsx` igual (E-05 cerrado).
4. [x] Borrados estilos legacy (`index/tokens/app/shell/operations/management/monitoring`), **excepto `login.css`** (D-15: AuthLayout lo necesita; tokens migrados a `--color-*`).
5. [x] Borrados `components/ui/` PascalCase + `ui.tsx` + `layout.tsx` + `PlotMap/LineChart/Toasts` legacy. `PlotMap` portado íntegro a `shadcn/plot-map` (misma lógica Leaflet).
6. [x] Huérfanos preexistentes **eliminados** (D-17): `design-system/`, `features/`, `workspace-v2.css` (nada en HEAD los importaba).
7. [x] Eliminado `backend/NUL`.
8. [x] `App.tsx` → shells nuevos + shadcn en vista restringida (App.test intacto: Secciones/Navegación agricultor/roles verificados por tests).
9. [x] Verificación: `tsc` 0 · `lint` 0 err (19 warnings benignos) · tests **135/135** (7 portados: SoilMeter×4, FormField, DataTable, FilterTabs; 4 de Modal legacy jubilados con Radix) · `build` ✓.
10. [ ] QA visual manual (**usuario**): escritorio/tablet/móvil × agricultor/técnico/admin (`npm run dev` o servicio `frontend`).
11. [x] `DESIGN_SYSTEM.md` y `README.md` reescritos al nuevo sistema.

---

## 8. Bitácora de la sesión de rediseño (2026-10-11)

- [x] Inventario del proyecto (backend Laravel + frontend React/Vite) y conteo de módulos (14 controladores ≈ 14 dominios; 13 páginas UI).
- [x] Decisión de stack: Tailwind + shadcn/ui (usuario) confirmada con análisis vs MUI/Mantine/Chakra/Headless.
- [x] Extracción 1:1 de colorimetría y tipografía del Login (`tokens.css`, `login.css`, `AuthLayout.tsx`).
- [x] Creación de base: `theme.ts`, `utils.ts`, `globals.css`, `components.json`, 25 componentes `ui/`, `package.json` con deps.
- [x] Limpieza de raíz (E-01) y restauración de `ui.tsx` legacy.
- [x] Cierre de Fase 1: E-01…E-19 corregidos (E-05 programado, E-18 registrado); `tsc` 0 errores, `lint` 0 errores, tests 139/139; nuevos en `components/shadcn/` + barrel `shadcn.tsx`.
- [x] Cierre de Fase 2: F2-1…F2-8 creados y verificados (`tsc`/`lint`/`tests` verdes); barrel con 44 exports.
- [x] Cierre de Fase 3 (2026-10-11): 13/13 páginas rediseñadas (F3-1 Login, F3-2 RecoverPin, F3-3 Dashboard, F3-4 Hoy, F3-5 Plots, F3-6 Sensors, F3-7 Irrigations, F3-8 Evaluate, F3-9 Catalogs, F3-10 Farmers, F3-11 Alerts, F3-12 Weather, F3-13 Validation). Lógica, endpoints, textos y contratos intactos; `tsc` 0, `lint` 0 err, tests 139/139. Solo 1 cambio necesario en tests: mock `PlotMap` → `shadcn/plot-map` (F3-5).
- [x] Cierre de Fase 4 (2026-10-11, agente): shells + `lib/toast`→sonner + `AuthLayout` migrados; legacy y huérfanos eliminados; `tsc` 0, `lint` 0 err, tests **135/135**, `build` ✓. Pendiente usuario: E-21 (`sudo dist`, luego resuelto por usuario) + QA visual.
- [x] Réplica v2 del Login con estructura actual (a pedido 2026-10-11, D-15): `Login.tsx` + `AuthLayout` 100% Tailwind con métricas v2; `login.css` eliminado; `main.tsx`/`qa-preview` solo `globals.css`; `tsc` 0, tests 135/135, `lint` 0 err.
- [x] Réplica v2 del shell con estructura actual (a pedido 2026-10-11, D-26): sidebar 248px + drawer ≤1000px + topbar + footer + farmer flotante; `tsc` 0, App 6/6, tests 135/135, `lint` 0 err, `build` ✓.
- [x] Auditoría final (2026-10-11, a pedido): 0 imports legacy residuales (grep); 0 clases CSS legacy en código nuevo (solo prop `eyebrow`/`chips` y `space-y-0` legítimos); barrel↔archivos consistente (41 shadcn + 3 charts + 4 forms + 6 layout); deps reservadas sin uso documentadas (D-20); suite final `tsc` 0 · `lint` 0 err · 135/135 · `build` ✓.

---

## 9. Recuperación del documento anterior

```bash
git show HEAD:MEJORAS.md > MEJORAS.legacy.md   # plan maestro ETAPA I/II + PARTE III VD-0…VD-12
```

---

## 10. Comandos de verificación (ejecutar con cwd = `frontend/`)

```bash
npm install
npx tsc -b
npm run lint
npm test
npm run build
```

---

## 11. Manual de continuación (leer antes de retomar)

### 11.1 Estado exacto al pausar (2026-10-11)

- Fases 1–4 `COMPLETADAS` por el agente y verificadas (tsc 0, lint 0 err, tests 135/135, build ✓).
- Pendiente **usuario**: E-21 (`sudo rm -rf frontend/dist`), QA visual (escritorio/tablet/móvil × 3 roles) y decisión de commit (NADA commiteado; ver estado git abajo).
- Git (rama `master`): 40+ archivos modificados/eliminados + ~60 nuevos sin trackear. Nada commiteado.
- No queda trabajo de agente pendiente salvo lo que pida el usuario.

### 11.2 Reglas de entorno (incumplirlas rompe cosas: ver E-01, E-20, E-21)

1. Todo `npm/npx/node` se ejecuta **dentro de WSL**: `wsl -d Ubuntu -- bash -lc "cd ~/proyectos/yakuai/frontend && <comando>"`. NUNCA npm de Windows contra `\\wsl.localhost` (symlinks → EISDIR).
2. El shell de la herramienta es **PowerShell 5.1**: NO existe `&&` (usar `;` o llamadas separadas), NO existe `head` (usar `Select-Object -First`), paths con espacios entre comillas. Para bash real, envolver con `wsl -d Ubuntu -- bash -lc "..."`.
3. `git status` puede mostrar **ruido fantasma** en el mount 9P (archivos listados como M con `git diff` vacío y hashes iguales): resolver con `git checkout -- <archivo>` (solo si `git diff --ignore-cr-at-eol` confirma cero cambios reales).
4. CRLF: si un archivo aparece reescrito completo en el diff, verificar `git diff --ignore-cr-at-eol` antes de tocar nada.
5. `frontend/dist/` es root-owned (E-21): no borrar sin `sudo` (pedirlo al usuario); para verificar builds usar `--outDir /tmp/...`.
6. No commitear sin orden expresa. No tocar `backend/`. No tocar `main.tsx`/`index.css` hasta Fase 4 (E-05).

### 11.3 Inventario de archivos creados en esta sesión (todos sin trackear salvo indicados)

- `frontend/components.json` (config shadcn).
- `frontend/src/components/shadcn/` (43 archivos: 26 base + F2-8×6 + soil-meter + verdict-card + plot-map + toaster + filter-tabs + data-table + 4 tests portados) + `frontend/src/components/shadcn.tsx` (barrel ampliado) + `components/charts/` (3) + `components/forms/` (3+1 test) + `components/layout/` (6). 13 páginas reescritas en `frontend/src/pages/`. Legacy eliminado: `components/ui/` PascalCase, `ui.tsx`, `layout.tsx`, `PlotMap/LineChart/Toasts`, 7 CSS; huérfanos eliminados.
- `frontend/src/lib/theme.ts` (245 líneas), `frontend/src/lib/utils.ts` (`cn`).
- `frontend/src/styles/globals.css` (245 líneas, Tailwind v4).
- Modificados (trackeados): `frontend/package.json` (+31 deps incl. `tw-animate-css`), `package-lock.json`, `tsconfig.app.json` (alias `@`), `vite.config.ts` (plugin tailwind + alias), `vitest.config.ts` (alias).
- Preexistentes sin trackear (NO creados aquí, NO tocar hasta Fase 4 §7-paso 6): `frontend/src/design-system/`, `frontend/src/features/`, `frontend/src/styles/workspace-v2.css`, `backend/NUL`.

### 11.4 Baseline de verificación (no regresionar)

`npx tsc -b` → 0 errores · `npm run lint` → 0 errores (17 warnings legacy en páginas) · `npm test` → 21 archivos / 139 tests · `vite build` → ✓.

---

## 12. Registro de decisiones

| ID | Decisión | Motivo | Fecha |
|----|----------|--------|-------|
| D-01 | Stack: shadcn/ui + Tailwind v4 + Recharts + TanStack + date-fns + sonner + RHF/zod | Análisis §1.2 (bundle, mobile-first, control diseño, sin licencias) | 2026-10-11 |
| D-02 | Estructura evolutiva (no ruptura); `api/hooks/lib/features/auth/navigation` intocables | Migración página a página sin breaking changes | 2026-10-11 |
| D-03 | Colores + tipografía 1:1 del Login; resto a criterio experto | Orden del usuario | 2026-10-11 |
| D-04 | Solo frontend (backend/BD/Docker intactos) | Confirmado con usuario | 2026-10-11 |
| D-05 | Nuevos en `components/shadcn/` (no `components/ui/`) | Colisión de casing TS1149 con legacy (E-19) | 2026-10-11 |
| D-06 | `tw-animate-css` para animaciones (E-13) | Vía estándar Tailwind v4; cubre `animate-in/*` + accordion/collapsible | 2026-10-11 |
| D-07 | `lib/format.ts` canónico; duplicado en `utils.ts` eliminado (E-16) | 0 usos del duplicado; `format.test.ts` existe | 2026-10-11 |
| D-08 | Etiquetas de paginación en español ("Anterior/Siguiente") | Locale es-PE del proyecto | 2026-10-11 |
| D-09 | `main.tsx`/`index.css` intactos hasta Fase 4 (E-05) | No romper estilos legacy durante la migración | 2026-10-11 |
| D-10 | MEJORAS.md reescrito (anterior en `git show HEAD:MEJORAS.md`) | Orden expresa del usuario 2026-10-11 | 2026-10-11 |
| D-11 | Selects **nativos** en formularios/wizards; Radix `Select` solo en filtros (ej. orden en Hoy) | `fireEvent.change` de los tests + semántica de formulario; cero fricción en Fase 3 | 2026-10-11 |
| D-12 | Iconos lucide que colisionan con globales se aliasan (`Map` → `MapIcon`) | `new Map()` en `latestPerPlot` rompía runtime (detectado por tests F3-4) | 2026-10-11 |
| D-13 | `badgeVariantForTone()` compartido en `shadcn/badge` + franjas de severidad con `borderLeftColor` inline desde `theme.ts` | Un solo mapeo tono→variante; clases `border-l-*` vs `border-*` compiten en cascada (igual especificidad) | 2026-10-11 |
| D-14 | `DataTable` nuevo con el mismo contrato legacy (`label/rows/columns/rowKey`) | Lo usan 6 páginas; TanStack queda para tablas avanzadas futuras | 2026-10-11 |
| D-15 | Réplica v2 del Login con Tailwind (a pedido 2026-10-11): `Login.tsx` + shell `AuthLayout` reescritos con métricas exactas v2 (50px inputs, card 380px, story clamp, breakpoints 1100/760/380); `login.css` **eliminado** | Mismas clases→utilidades, mismos valores; lógica y tests intactos (135/135) | 2026-10-11 |
| D-21 | Fidelidad total v2 (auditoría + pase 2, 2026-10-11): input 16px (estaba 14), padding panel 48/28 (había override `py-6` erróneo), `cursor-pointer` en botones (preflight v4 lo quita), `AccessBrand` clonado exacto (mark 40×44, radio 12/12/12/3, word 30px/750/-1.5px), set `login-icons.tsx` con los 34 paths 1.8px del HEAD, spinner CSS v2 en submit | Valores verificados contra HEAD + bundle compilado (focus/outline/shadow presentes, 0 `access-`) | 2026-10-11 |
| D-22 | Corrección escala de verdes (QA visual 2026-10-11): `primary-950` estaba en `#051a18` inventado (story casi negro) + `800/900` desplazados; restaurado exacto v2 (`800 #165349`, `900 #103e38`, `950 #092e2b`); eliminado `primary-400` interpolado sin uso. Verificado en bundle compilado | Reporte del usuario (story muy oscuro) | 2026-10-11 |
| D-23 | Reglas de altura compacta `max-height:760px` (las había omitido): story/card/panel/form se compactan en viewports bajos para que el login no scrollee, con query exacta v2 (`min-width:761px` apilada, determinista en cascada). Verificado en bundle compilado | Reporte del usuario (la página scrolleaba) | 2026-10-11 |
| D-24 | Auditoría fina de cascada (2026-10-11): el `focus:[outline]` arbitrario perdía contra `focus:outline-none` base (misma especificidad, posterior) → foco invisible. Fijado con `!important` y verificado en bundle (`outline` + `box-shadow` + `offset` con `!important`). Además: `border` (1px) restituido al submit v2 y `min-w-0` al story | Auditoría pixel a pixel pedida por el usuario | 2026-10-11 |
| D-27 | Sidebar invisible en desktop (QA 2026-10-11): `data-[open=false]:-translate-x-full/invisible` (0,2,0) le ganaba a `min-[1001px]:translate-x-0` (0,1,0) → sidebar siempre oculto. Fijado: base oculta + `data-[open=true]` muestra + `min-[1001px]` muestra; reglas `data-open=false` eliminadas (0 ocurrencias en bundle) | Reporte del usuario (no se veía el lateral) | 2026-10-11 |
| D-28 | Auditoría fina del shell (2026-10-11): avatar era círculo 36px → exacto v2 (40px, radio 7px, borde primary-100, avatar-sm 34px); botones menu/cerrar/salir sin borde → `icon-btn` v2 (44px con borde); sombra bottomnav exacta `0 12px 40px #172b3617`; brand farmer 26px + sin tagline ≤700px; `scrollbar-width:thin` en nav. Todo verificado en bundle compilado | Auditoría v2 pedida por el usuario | 2026-10-11 |
| D-25 | Login 50/50 (mejora a pedido 2026-10-11): grilla desktop `1.1fr/1fr` → `1fr/1fr`. Desviación deliberada del v2 | Usuario | 2026-10-11 |
| D-26 | Réplica exacta del shell v2 con Tailwind (a pedido 2026-10-11): `Brand` (marca exacta + `tone`/`tagline`), `NavSidebar` (248px, links 13px, active con borde, drawer ≤1000px con foco trampeado portado), `Topbar` (68px, migas 12px, separador), `TechShell` (sticky, contenido fluido, footer 10px, compactación ≤820px), `FarmerShell` + `BottomNav` flotante (pill 520px). Iconos v2 vía `login-icons`; `layout/Brand` único (AuthLayout lo reutiliza) | Auditoría v2 vs actual con 15 diferencias | 2026-10-11 |
| D-16 | `lib/toast.ts` → sonner directo (mismas firmas); `<Toasts/>` → `<Toaster/>` en shells; `Toasts.tsx` eliminado | Sin doble render; páginas no tocan nada | 2026-10-11 |
| D-17 | Huérfanos `design-system/`, `features/`, `workspace-v2.css` eliminados | Untracked de otra sesión, 0 imports en HEAD, superados por el nuevo sistema | 2026-10-11 |
| D-18 | Tests portados: SoilMeter×4, FormField, DataTable, FilterTabs; Modal×3 jubilados (Radix los cubre) | Cobertura de lógica crítica sin atarse a implementación legacy | 2026-10-11 |
| D-19 | `Brand` con `tone` light/dark (story panel usa dark) | Wordmark legible sobre verde oscuro sin CSS legacy | 2026-10-11 |
| D-20 | Deps instaladas sin uso aún: RHF/zod/resolvers, date-fns, cmdk, radix alert-dialog/context-menu/popover/progress | Reservadas para wizards con validación, date-pickers y paleta de comandos; costo 0 en bundle (nunca importadas) | 2026-10-11 |
