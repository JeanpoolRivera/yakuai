# Plan de implementación — Evaluar riego + migración progresiva

> Mejoras sobre la base actual del módulo **Evaluar riego**, seguidas de la
> adopción progresiva de la nueva arquitectura en el resto de módulos.
> Solo frontend. El contrato API, `HydroService`, autenticación y routing no cambian.

## Principios rectores

- **Strangler Fig**: se migra módulo a módulo; el CSS legacy sigue sirviendo al resto mientras se migra.
- **Contrato estable**: `Evaluation`, `Plot`, endpoints y lógica de negocio intactos.
- **Por rol**: mismas piezas, variaciones por props (`plots`, ayuda, historial), sin duplicar componentes.
- **Cada fase cierra verde**: `npm run test` + `npm run lint` + `tsc` + `npm run build`.

## Estructura destino (patrón replicable)

```text
frontend/src/
├── design-system/
│   ├── tokens/          colors, typography, spacing, radii, shadows, motion, targets
│   ├── primitives/      Button, Badge, Card, StatusPill, SearchInput, EmptyState,
│   │                    LoadingState, Alert, Sheet, Dialog
│   ├── patterns/        piezas transversales (VerdictDisplay, SoilMoistureMeter, ...)
│   └── index.ts
├── features/
│   ├── evaluate/        components/ hooks/ copy.ts types.ts utils.ts
│   ├── sensors/
│   ├── weather/
│   ├── irrigation/
│   ├── dashboard/
│   └── ...
├── shared/              api/, lib/, hooks/ genéricos
└── app/                 App.tsx, routing, providers
```

Regla general: **todo componente nuevo usa solo tokens + primitivos**. Nada de CSS global nuevo.

---

## Parte A — Módulo Evaluar riego (F0–F6)

Estimado: **~7-8 días** enfocados. Dependencias: `F0 → F1 → F2 → F3 → F4 → F5 → F6`.

### Fase 0 — Línea base y contrato (0.5 día)
**Objetivo:** congelar el "antes" y no romper nada.

- Correr suite actual y registrar línea base (test/lint/build).
- Inventariar clases CSS de Evaluar en `styles/field.css` (`.irrigation-*`, `.eval-*`, `.evidence-*`).
- Confirmar tipos (`api/types.ts`) y formateadores (`lib/format.ts`).

**Aceptación:** tests verdes; lista de clases a eliminar y a crear.
**Depende de:** —

### Fase 1 — Design System Foundation: tokens (1 día)
**Objetivo:** una fuente de verdad visual con contraste AA.

- `design-system/tokens/`: `colors.ts`, `typography.ts`, `spacing.ts`, `radii.ts`, `shadows.ts`, `motion.ts`, `targets.ts`.
- Espejar en `globals.css` vía `@theme` (Tailwind v4).
- Corregir los 4 pares de veredicto (hoy `riega` y `espera` fallan AA).

**Aceptación:** todos los pares texto/fondo ≥ 4.5:1 (≥3:1 texto grande e íconos); tokens importables.
**Depende de:** F0.

### Fase 2 — Primitivos accesibles (1 día)
**Objetivo:** átomos reutilizables sin CSS global.

- `design-system/primitives/`: `Button`, `Badge`, `Card`, `StatusPill`, `SearchInput`, `EmptyState`, `LoadingState`, `Alert`, `Sheet`, `Dialog`.
- Targets ≥ 44px; foco visible; estados; `aria-*` correctos; un test por primitivo.

**Aceptación:** navegables por teclado; contraste AA; sin regresiones fuera del módulo.
**Depende de:** F1.

### Fase 3 — Patterns de dominio "evaluate" (2-3 días)
**Objetivo:** piezas específicas del módulo (en `features/evaluate/components/`).

- `PlotSelector` (sidebar desktop / bottom-sheet móvil; badge agricultor si `isStaff`).
- `VerdictDisplay` (hero: icono + kicker + título + volumen + chips; prop `showDeepLinks`).
- `SoilMoistureMeter` (barra con umbral y PMP).
- `EvidenceGrid` (humedad, lluvia 6h, próxima revisión).
- `IrrigationPlan` (inicio/fin/duración/jornadas; visible por defecto si `riega`).
- `HistoryTimeline` (agrupado por día; `canFilterByPlot` si técnico).
- Micro-copy en `features/evaluate/copy.ts`.

**Aceptación:** cada pattern rinde los 4 estados × 2 roles; reutiliza solo primitivos + tokens.
**Depende de:** F2.

### Fase 4 — Composición de la página (1 día)
**Objetivo:** `Evaluate.tsx` como orquestador delgado.

- Hooks: `usePlots`, `useEvaluation`, `useHistory`, `useIrrigationConfirm`.
- Reescribir `pages/Evaluate.tsx` (< 80 líneas): compone patterns y maneja vistas.
- Mover `INCOMPLETE_HELP` y `verdictTitle` a `copy.ts`.
- Mantener idempotencia, auto-refresh OWM, `ApiError 422`, "Ya regué".

**Aceptación:** comportamiento idéntico al actual + jerarquía nueva.
**Depende de:** F3.

### Fase 5 — Accesibilidad y Modo campo (1 día)
**Objetivo:** apto para campo y WCAG 2.2 AA.

- Auditoría: contraste, foco, tabulación, `aria-live`, headings, `prefers-reduced-motion`.
- `FieldModeToggle`: fuente +22%, targets +18%; persistencia en `localStorage`.

**Aceptación:** 0 fallos AA en el módulo; toggle persiste sin romper layout.
**Depende de:** F4.

### Fase 6 — Testing y limpieza (1 día)
**Objetivo:** deuda eliminada, suite adaptada.

- Adaptar `pages/Evaluate.test.tsx` (mismos casos funcionales).
- Tests de patterns (4 estados × 2 roles).
- Eliminar de `field.css` las clases del módulo (solo si nadie más las usa).
- Retirar componentes huérfanos (`verdict-card.tsx`, `VerdictHero.tsx` si quedan sin uso).

**Aceptación:** suite + lint + tsc + build en verde; sin clases muertas.
**Depende de:** F5.

---

## Fase 0 — Resultado (línea base y contrato)

### Línea base (antes de tocar nada)

| Comprobación | Comando | Resultado |
|---|---|---|
| Tests | `npm run test` (WSL) | **159 passed / 25 archivos** |
| Lint | `npm run lint` (oxlint) | **24 warnings, 0 errores** (123 archivos) |
| Build | `npm run build` (`tsc -b && vite build`) | **OK**, 1720 módulos; `index` 553.59 kB (gzip 171.54 kB) |

Notas preexistentes (no bloquean): avisos `act(...)` en `Evaluate.test.tsx`; aviso de chunk > 500 kB; `EACCES` al escribir caché de vitest en `node_modules/.vite` (permisos, no un fallo de test); warning de lint en `Evaluate.tsx:111` (`set-state-in-effect`).

### Inventario de clases CSS del módulo (`styles/field.css`)

`field.css` es **compartido** por Evaluar, Sensores y Clima (vía `components/field/FieldUI.tsx`). Por eso solo se retiran las clases exclusivas de Evaluar, y solo al cerrar F6.

**Exclusivas de Evaluar (eliminadas en F6):**

| Grupo | Clases |
|---|---|
| Layout / selector | `.irrigation-workspace`, `.irrigation-context`, `.irrigation-main`, `.irrigation-search`, `.irrigation-plot-list`, `.irrigation-plot`, `.irrigation-plot-icon`, `.irrigation-context-footer`, `.choice-mark` |
| Preparación | `.evaluation-ready`, `.evaluation-ready-body`, `.evaluation-emblem`, `.evaluation-inputs`, `.evaluation-ready-note` |
| Informe | `.eval-report`, `.eval-report-top`, `.eval-verdict`, `.eval-decision`, `.eval-volume`, `.eval-evidence`, `.evidence-line`, `.eval-report-actions`, `.eval-history` |

**Compartidas (conservar):** `.field-app`, `.field-header`, `.field-eyebrow`, `.field-intro`, `.field-actions`, `.field-button(.solid/.line/.quiet)`, `.field-panel`, `.field-panel-heading`, `.field-step`, `.field-search`, `.field-blank`, `.field-blank-icon`, `.field-loading`, `.field-error`, `.field-status(.good/.warn/.bad/.blue)`, `.field-footnote`, `.field-facts`, `.field-disclosure`, `.field-select`, `.field-segments`, `.field-dialog`, `.field-form*`, `.field-calibration` (y `.device-*`, `.climate-*`, `.sensor-*` de otros módulos).

**Conflictos a resolver en F6 (borrado quirúrgico):**
1. Línea 8 mezcla selectores: `.field-panel,.irrigation-context,.evaluation-ready{...}` → separar antes de borrar.
2. Las media queries (1200 / 800 / 600 px) intercalan clases de Evaluar con compartidas.
3. `sensors.css` sobrescribe `.field-search/.field-select/.field-footnote/.device-table` → no tocar esas base.

**Clases a crear (F1–F3):** tokens (`--t-*`, semántica bg/fg, `--target`) + patterns con Tailwind/CSS Modules (`.verdict-hero`, `.ev-card`, `.meter`, `.plan*`, `.history-*`, `.plot-item`, etc.).

### Contrato de datos (confirmado, no cambia)

- **Tipos** (`api/types.ts`): `Plot`, `Evaluation`, `EvalSnapshot`, `EvalResult`, `Irrigation`, `Role`.
- **Formateadores** (`lib/format.ts`) reutilizables tal cual: `fmtDateTime`, `fmtNum`, `toNum`, `ageLabel`, `resultLabel`, `reasonLabel`, `RESULT_LABEL`, `REASON_LABEL`, `badgeToneForResult`.
- **Copy nuevo** (solo presentación) → `features/evaluate/copy.ts`: `verdictTitle`, `incompleteHelp` por rol, textos de acciones.

### Estructura destino acordada

```text
frontend/src/
├── design-system/{tokens,primitives,patterns}/
└── features/evaluate/{components,hooks,copy.ts}/
```

**Criterio de aceptación F0:** ✅ tests verdes; ✅ lista de clases a eliminar/crear documentada; ✅ contrato y estructura fijados.

**Estado:** ✅ Completada.

---

## Fase 1 — Resultado (tokens y contraste)

### Archivos creados (`design-system/tokens/`)

`colors.ts`, `typography.ts`, `spacing.ts`, `radii.ts`, `shadows.ts`, `motion.ts`, `targets.ts`, `index.ts` (re-export + objeto `tokens`). Son importables desde `@/design-system/tokens`.

### Cambios en `styles/globals.css`

- **Veredictos corregidos** (antes `riega`/`espera` fallaban AA): nuevos pares `bg/fg`.
- **`--color-info-700` añadido**: `Hoy.tsx` usa `badgeVariantForTone("espera") → info`, que resolvía a `text-info-700` sin token (color inexistente). Corregido de paso.
- **`@theme static`** con tokens del design system (`--color-brand*`, `--color-border*`, `--color-focus-ring`, `--target*`) para que se emitan siempre como CSS vars (Tailwind v4 hace tree-shaking de `@theme` no usado).
- **Display type**: `--text-d1/d2/d3` con `clamp()` para títulos del hero.
- `--color-brand` = `#146852` (coincide con el acento actual del módulo), `--color-brand-hover` = `#103e38`, `--color-border-strong` = `#5f7378` para controles.

### Contraste medido (WCAG 2.2)

| Par | Ratio | Nivel |
|---|---|---|
| verdict `riega` | 6.84:1 | AA |
| verdict `no` | 7.40:1 | AAA |
| verdict `espera` | 8.04:1 | AAA |
| verdict `incompleta` | 7.12:1 | AAA |
| semantic `danger` | 7.42:1 | AAA |
| `info-700` sobre `info-50` | 8.31:1 | AAA |
| `border-strong` sobre blanco | 4.99:1 | AA (UI ≥3:1) |
| `brand` sobre blanco | 6.71:1 | AA |

### Hallazgos

- `--color-verdict-*` solo lo consumía **código muerto** (`verdict-card.tsx`, `VerdictHero.tsx`, variantes sin uso de `badge.tsx`) → corregirlo no afectó nada visible. `VerdictCard`/`VerdictHero` son candidatos a eliminar en F6.
- Tailwind v4 **no emite** variables `@theme` sin uso; de ahí `@theme static` para el núcleo del design system.

### Verificación

- Build: ✅ 1720 módulos, tokens presentes en el CSS compilado.
- Lint: ✅ 24 warnings, 0 errores (sin cambios respecto a F0).
- Tests: ✅ 159 passed / 25 archivos.

**Criterio de aceptación F1:** ✅ pares ≥ 4.5:1; ✅ tokens importables; ✅ build/lint/test verdes.

**Estado:** ✅ Completada.

---

## Fase 2 — Resultado (primitivos accesibles)

### Archivos creados (`design-system/primitives/`)

`button.tsx`, `button-variants.ts`, `badge.tsx`, `badge-variants.ts`, `card.tsx`, `status-pill.tsx`, `search-input.tsx`, `empty-state.tsx`, `loading-state.tsx`, `alert.tsx`, `dialog.tsx`, `sheet.tsx`, `index.ts` + un test por primitivo (10 archivos `.test.tsx`). Re-export vía `design-system/index.ts`.

### Decisiones de accesibilidad

| Primitivo | Garantías |
|---|---|
| `Button` | `min-h-11/12` (≥44px), foco visible (`ring-brand/40`), `disabled`, `loading` → `aria-busy` + bloqueo |
| `Badge` | tonos semánticos/veredicto con pares AA; punto decorativo `aria-hidden` |
| `Card` | superficie `border-border` + `bg-white`; títulos `h3` |
| `StatusPill` | tono good/warn/bad/blue/neutral + punto decorativo |
| `SearchInput` | etiqueta `aria-label`, `type=search`, botón limpiar 44px, `Escape` limpia |
| `EmptyState` | icono `aria-hidden`, título/descripción/acción |
| `LoadingState` | `role=status` + `aria-live=polite` |
| `Alert` | `role=alert` (danger) / `role=status` (resto), icono decorativo |
| `Dialog` | Radix: focus trap, `Escape`, `aria-labelledby`, cierre 44px |
| `Sheet` | Radix, `side` bottom/top/left/right; por defecto bottom (modo campo) |

Contraste: los primitivos reutilizan los pares verificados en F1 (`success` 7.4, `warning` 6.8, `info` 8.0, `danger` 7.4, `neutral` 7.1).

### Notas

- Las variantes `cva` se movieron a `*-variants.ts` para no disparar `react(only-export-components)`; el lint queda en **24 warnings** (misma línea base).
- Los primitivos son **aditivos**: ninguna página existente los importa todavía → cero regresiones fuera del módulo.

### Verificación

- Build: ✅ 1720 módulos; clases (`bg-brand`, `bg-success-bg`, `text-danger-fg`, `border-border`, `ring-brand`) y tokens presentes en el CSS compilado.
- Lint: ✅ 24 warnings, 0 errores (igual que F0).
- Tests: ✅ **174 passed / 35 archivos** (+10 archivos, +15 tests).

**Criterio de aceptación F2:** ✅ navegables por teclado; ✅ contraste AA; ✅ sin regresiones.

**Estado:** ✅ Completada.

---

## Fase 3 — Resultado (patterns de dominio)

### Archivos creados (`features/evaluate/`)

- `copy.ts` (micro-copy y `REASON_SHORT` para badges cortos) y `utils.ts` (derivación del snapshot, rangos y fechas).
- `components/`: `PlotSelector.tsx`, `VerdictDisplay.tsx`, `SoilMoistureMeter.tsx`, `EvidenceGrid.tsx`, `IrrigationPlan.tsx`, `HistoryTimeline.tsx`, `index.ts`.
- Tests: un archivo por pattern (30 tests).
- Soporte: `hooks/useMediaQuery.ts` (`useSyncExternalStore`) y tipos `EvalPlan`/`EvalProximoRiego` en `api/types.ts` (aditivos).

### Decisiones por pattern

| Pattern | Comportamiento | Rol |
|---|---|---|
| `PlotSelector` | Búsqueda por parcela/cultivo, `aria-pressed`, "Mostrar más" de 9 en 9, contexto (riego/siembra/cultivo), CTA con `loading`. Desktop: sidebar; móvil (`max-width: 1023px`): resumen + `Sheet` bottom. | Técnico ve badge de agricultor (`showFarmerBadge`) |
| `VerdictDisplay` | Icono + kicker + pill + título + razón + volumen (solo `riega`) + chip de prioridad. Título enfocable (`tabIndex=-1`, `titleRef`) para anunciar el resultado. | `showDeepLinks` → enlaces a Sensores/Clima con `state.plotId`; agricultor ve "Contacta a tu técnico" |
| `SoilMoistureMeter` | `role=progressbar` con nombre accesible, marca de umbral, estados Adecuado/Bajo umbral/Crítico, "Sin lectura" sin barra. | Igual |
| `EvidenceGrid` | Humedad, lluvia 6 h (mm + probabilidad) y próxima revisión + confianza; degrada a "Sin datos". | Igual |
| `IrrigationPlan` | Usa `snapshot.plan` real del backend (inicio/fin/duración/jornadas/nota); si no existe, no rinde. | Igual |
| `HistoryTimeline` | Agrupa por día (`Hoy`/`Ayer`/fecha), badge corto + razón, volumen; vacío → `EmptyState`. | `canFilterByPlot` muestra selector por parcela (solo si hay >1) |

### Bug corregido en F2

`Button` con `asChild` renderizaba `[null, children]`, lo que rompía `Slot` de Radix ("Expected a single React element child"). Se corrigió para ceder el render al hijo único y se añadió test de regresión (`button.test.tsx`).

### Notas

- `IrrigationPlan` y `EvidenceGrid` toleran snapshots incompletos (sin crashes por `null`).
- `HistoryTimeline` usa `<select>` nativo para el filtro: menos JS, foco/teclado nativos, 44px.
- El entorno tenía `node_modules/.vite` propiedad de `root` (EACCES al escribir la caché de vitest); se corrigió el ownership sin cambios de repo.

### Verificación

- Build: ✅ 1720 módulos (mismo grafo; la feature aún no la importa la página).
- Lint: ✅ 24 warnings, 0 errores (línea base intacta).
- Tests: ✅ **205 passed / 41 archivos** (+31 tests, +6 archivos desde F2).

**Criterio de aceptación F3:** ✅ cada pattern cubre 4 estados × 2 roles donde aplica; ✅ solo primitivos + tokens; ✅ sin CSS global nuevo.

**Estado:** ✅ Completada.

---

## Fase 4 — Resultado (composición de la página)

### Archivos

- `features/evaluate/hooks/`: `usePlots.ts`, `useHistory.ts`, `useEvaluation.ts`, `useIrrigationConfirm.ts`, `index.ts`.
- `features/evaluate/components/`: `EvaluateHeader.tsx`, `ReadyToEvaluate.tsx`, `EvaluationHistory.tsx`, `EvaluationReport.tsx`, `EvaluationWorkspace.tsx` (composición de vistas).
- `pages/Evaluate.tsx`: **69 líneas**; solo lee la ruta, conecta hooks y pasa props al workspace.

### Decisiones

| Pieza | Responsabilidad |
|---|---|
| `usePlots` | Carga parcelas, preselección por `state.plotId` o parcela única, `reload` con reintento. |
| `useHistory` | Últimas 20 evaluaciones de la parcela, orden descendente, filtro cliente por `plot_id`, cancelación por secuencia. |
| `useEvaluation` | `refreshWeather` tolerante a fallos, `evaluatePlot`, manejo `ApiError 422` (evaluación incompleta), toasts y `share` por WhatsApp. |
| `useIrrigationConfirm` | Bloqueo de 24 h con riego activo, promedio min/max y `createIrrigation`. |
| `EvaluationWorkspace` | Header + estados (cargando/error/listo/analizando/resultado/historial) y layout sidebar + panel. |
| `EvaluationReport` | Card del resultado: veredicto, evidencias, plan, acciones, detalle del cálculo y nota de idempotencia. |

### Notas

- La página ya **no importa `FieldUI` ni `field.css`**: usa tokens + primitivos (el CSS legacy sigue sirviendo a otros módulos hasta F6).
- Se eliminaron las copias locales de `INCOMPLETE_HELP`/`verdictTitle` (ya viven en `copy.ts` desde F3).
- Acciones con nombres accesibles únicos: sidebar `Evaluar riego`, panel listo `Evaluar esta parcela`, reporte `Quitar selección` (evita ambigüedad con el trigger móvil `Cambiar parcela`).
- El `Sheet` móvil de `PlotSelector` pasó a ser controlado y se cierra al elegir parcela (cubierto por test).
- El test de cambio de parcela se adaptó de `Cambiar parcela` a `Quitar selección`; los 8 casos funcionales se conservan.

### Verificación

- Build: ✅ 1720 módulos; bundle principal 580.58 kB (incluye design-system + feature, antes 553.59 kB).
- Lint: ✅ 24 warnings, 0 errores (el warning de `Evaluate.tsx` se movió a `useHistory.ts`, sin cambio neto).
- Tests: ✅ **205 passed / 41 archivos** (8 de la página, mismos casos funcionales).

**Criterio de aceptación F4:** ✅ comportamiento idéntico; ✅ `Evaluate.tsx` en 69 líneas; ✅ hooks + patterns; ✅ idempotencia, OWM, 422 y “Ya regué” conservados.

**Estado:** ✅ Completada.

---

## Fase 5 — Resultado (accesibilidad AA y modo campo)

### Archivos

- `hooks/useFieldMode.ts`: preferencia en `localStorage` (`yakuai-field-mode`), clase `field-mode` en `<html>`, limpieza al desmontar y sincronización entre pestañas (`storage`).
- `design-system/primitives/field-mode-toggle.tsx`: `role="switch"` + `aria-checked`, nombre visible “Modo campo”, objetivo táctil con `--target-sm`.
- Tests: `useFieldMode.test.ts`, `field-mode-toggle.test.tsx`, `styles/field-mode.test.ts` y un caso de integración en `Evaluate.test.tsx`.

### Modo campo

| Área | Normal | Modo campo |
|---|---|---|
| Tipografía raíz | `16px` | `122%` (`html.field-mode`) |
| `--target-sm` | `2.75rem` (44px) | `52px` |
| `--target-md` | `3rem` (48px) | `57px` |
| `--target-lg` | `3.5rem` (56px) | `66px` |
| `--target-icon` | `2.75rem` (44px) | `52px` |

La escala se aplica solo mientras el módulo está montado; la preferencia persiste al volver. `Button`, `SearchInput`, cierres de `Dialog`/`Sheet`, selector de historial y resumen de cálculo consumen las variables de objetivo.

### Correcciones de contraste (WCAG 2.2 AA)

| Hallazgo | Antes | Después |
|---|---|---|
| Texto secundario `neutral-500` sobre blanco | 4.40:1 ❌ | `neutral-600` 5.01:1 ✅ |
| `neutral-600` sobre `brand-soft` (parcela seleccionada) | — | 4.58:1 ✅ |
| Kicker/volumen del veredicto sobre fondos teñidos | `neutral-600` 4.40–4.53:1 | `neutral-700` ≥5.66:1 ✅ |
| Foco de primitivos | `ring-brand/40` (bajo contraste) | `ring-brand` sólido ✅ |

### Otras garantías

- `prefers-reduced-motion`: animaciones y transiciones reducidas globalmente.
- Resumen de cálculo con objetivo de 44/52px (`min-h-[var(--target-sm)]`).
- Sin cambios de comportamiento: mismos CTA, historial, roles e idempotencia.

### Verificación

- Build: ✅ **1755 módulos**; bundle principal 582.98 kB. CSS compilado contiene `html.field-mode` y los cuatro targets.
- Lint: ✅ 24 warnings, 0 errores (línea base intacta).
- Tests: ✅ **214 passed / 44 archivos** (+9 tests, +3 archivos desde F4).

**Criterio de aceptación F5:** ✅ 0 fallos AA en el módulo; ✅ modo campo persistente; ✅ foco visible; ✅ reduced motion; ✅ sin regresiones.

**Estado:** ✅ Completada.

---

## Fase 6 — Resultado (testing y limpieza)

### Retiro de CSS legacy

Se verificó con búsqueda en todo `frontend/src` (TS/TSX/CSS/tests) que ninguna clase exclusiva de Evaluar tuviera consumidores fuera de `field.css`:

- `irrigation-workspace`, `irrigation-context`, `irrigation-context-footer`, `irrigation-main`, `irrigation-search`, `irrigation-plot-list`, `irrigation-plot`, `irrigation-plot-icon`.
- `evaluation-ready`, `evaluation-ready-body`, `evaluation-emblem`, `evaluation-inputs`, `evaluation-ready-note`.
- `eval-report`, `eval-report-top`, `eval-verdict`, `eval-decision`, `eval-volume`, `eval-evidence`, `evidence-line`, `eval-report-actions`, `eval-history`, `choice-mark`.

`field.css` pasó de **20,700 a 15,028 bytes (−27.4%)** y de 31 a 28 líneas. Se separó el selector mixto de la línea 8 (`.field-panel` conserva su bloque) y se retiraron reglas dentro de las media queries 1200/800/600 sin tocar las compartidas.

**Conservado:** `.field-panel`, `.field-panel-heading`, `.field-disclosure`, `.field-facts`, `.field-search`, `.field-select`, `.field-status`, `.field-dialog`, `.field-form*`, `.field-calibration`, `.device-*`, `.climate-*`, `.sensor-*` y `prefers-reduced-motion`. `FieldUI`/`field.css` siguen sirviendo a Sensores y Clima.

### Huérfanos eliminados

- `components/shadcn/verdict-card.tsx`.
- `components/shadcn/VerdictHero.tsx` y su export en `components/shadcn.tsx`.
- Sin referencias restantes en el código.

### Verificación

- Tests: ✅ **214 passed / 44 archivos** (los 9 casos de `Evaluate.test.tsx` y los tests de patterns se mantienen).
- Lint: ✅ 24 warnings, 0 errores (184 archivos, −2 tras borrar huérfanos).
- Build: ✅ **1755 módulos**; CSS principal 101.79 kB; chunk `FieldUI` de 20.58 → 14.93 kB, sin clases de Evaluar.
- CSS compilado: 0 apariciones de las clases retiradas; las compartidas siguen presentes.

**Criterio de aceptación F6:** ✅ suite + lint + build verdes; ✅ sin clases muertas de Evaluar; ✅ sin componentes huérfanos.

**Estado:** ✅ Completada.

---

## Parte B — Anexo: migración progresiva de los demás módulos

Una vez cerrado Evaluar, el resto se migra **en oleadas**, reutilizando lo ya creado.
Cada módulo es un paquete independiente con su propio mini-plan (mismo formato F0→cierre),
y **no se toca más de un módulo a la vez** salvo que compartan patterns.

### Orden recomendado (por valor / reutilización / riesgo)

| Orden | Módulo | Archivo(s) actuales | Por qué en este punto | Reutiliza | Patterns nuevos |
|:---:|---|---|---|---|---|
| 1 | **Sensores** | `pages/Sensors.tsx` | Comparte medidor de humedad y estados `ok/sin_datos/anómalo`; alto valor operativo | `Card`, `StatusPill`, `EmptyState`, `SoilMoistureMeter` | `SensorTable`, `CalibrationDialog`, `ReadingTrend` |
| 2 | **Clima** | `pages/Weather.tsx` | Alimenta al motor; comparte chips de lluvia y "vigencia/origen" | `Card`, `StatusPill`, `Alert` | `RainPanel`, `TemperaturePanel`, `FreshnessBadge` |
| 3 | **Riegos** | `pages/Irrigations.tsx` | Cadena supersede/anulación; enlaza con Evaluar (recomendado vs aplicado) | `HistoryTimeline`, `StatusPill`, `VerdictDisplay` | `IrrigationCompare`, `CorrectionDialog` |
| 4 | **Dashboard / Hoy** | `pages/Dashboard.tsx`, `pages/Hoy.tsx` | Vista de lote; agrega señales de los anteriores | `KPI`-patterns, `Card`, `VerdictDisplay` | `KpiRow`, `PriorityQueue`, `TrendChart` |
| 5 | **Parcelas + Agricultores** | `pages/Plots.tsx`, `pages/Farmers.tsx` | CRUD con wizard y mapa; mayor complejidad | `Button`, `Dialog`, `EmptyState`, `Stepper` (Wizard) | `PlotWizard`, `PlotMap`, `FarmerForm` |
| 6 | **Catálogos** | `pages/Catalogs.tsx` | Solo lectura; bajo riesgo | `Table`-pattern, `Card`, `Badge` | `CatalogTable` |
| 7 | **Alertas + Validación** | `pages/Alerts.tsx`, `pages/Validation.tsx` | Reportes; cierre del ciclo | `EmptyState`, `StatusPill`, `VerdictDisplay` | `AlertTile`, `ValidationMatrix` |
| 8 | **Auth (login/PIN/recuperar)** | `pages/Login.tsx`, `RecoverPin.tsx`, `components/AuthLayout.tsx` | Ya probado y fuera del workspace; migrar al final o dejar estable | `Button`, `Input`, `Alert` | `AuthCard` (opcional) |

### Reglas de la migración progresiva

1. **Un módulo = un paquete de trabajo** con su F0 (línea base) → cierre (QA + limpieza).
2. **No crear nuevos tokens** salvo necesidad real; si aparece un token nuevo, se agrega a `design-system/tokens` (nunca local).
3. **Promover a `design-system/patterns/`** cualquier pieza usada por 2+ módulos (p. ej. `SoilMoistureMeter`, `HistoryTimeline`).
4. **Retirar CSS legacy por módulo**, no globalmente: borrar solo las clases que queden sin uso comprobado.
5. **Mantener verdes** test/lint/build tras cada módulo; sin migraciones a medias en `main`.
6. **Documentar** en este archivo al cerrar cada módulo (marcar estado en la tabla).

### Estado de migración

| Módulo | Estado | Notas |
|---|---|---|
| Evaluar riego | 🟡 En progreso | F0–F6 completadas; CSS legacy y huérfanos retirados |
| Sensores | ⬜ Pendiente | Oleada 1 |
| Clima | ⬜ Pendiente | Oleada 2 |
| Riegos | ⬜ Pendiente | Oleada 3 |
| Dashboard / Hoy | ⬜ Pendiente | Oleada 4 |
| Parcelas + Agricultores | ⬜ Pendiente | Oleada 5 |
| Catálogos | ⬜ Pendiente | Oleada 6 |
| Alertas + Validación | ⬜ Pendiente | Oleada 7 |
| Auth | ⬜ Pendiente | Oleada 8 (o dejar estable) |

### Definition of Done por módulo

Funcionalidad lista cuando: implementada + tests adaptados (mismos casos funcionales) +
contraste AA verificado + targets ≥ 44px + navegación por teclado + responsive
(móvil/desktop) + clases CSS legacy de ese módulo eliminadas + lint/tsc/build en verde.

---

## Riesgos y mitigación (global)

| Riesgo | Mitigación |
|---|---|
| Clases CSS compartidas entre módulos | Inventariar antes de borrar; borrar solo al cerrar cada módulo |
| Tests acoplados a selectores viejos | Adaptar con los mismos casos funcionales, no reescribir intención |
| Scope creep entre módulos | Regla: un módulo a la vez + `features/<modulo>` aislado |
| Duplicar patterns | Promover a `design-system/patterns/` al segundo uso |
| Regresión global por tokens | Tokens nuevos aditivos; auditar contraste en cada fase |

## Criterio de éxito global

Cuando los 8 módulos estén en verde: 100% de las páginas usan `design-system` +
`features`, sin CSS monolítico (`field.css`, `summary.css`, `workspace.css`)
y con contraste AA y targets accesibles en toda la app.
