# YakuAI · Sistema visual implementado

Este documento resume los tokens y patrones que existen en el frontend. Es una descripción del código; las verificaciones WCAG y de todos los tamaños indicados son objetivos que requieren QA específico.

## Identidad y paleta actual

La interfaz usa una base teal/azul pizarra, verdes semánticos para éxito/vegetación, ocre para advertencia y tonos rojos para error. Los valores de tokens usados por el código incluyen:

- Marca principal: teal #0B6672; hover #09525C; suave #DFF0ED; profundo #112D3B; acento #83C9C1.
- Neutrales: lienzo #F4F7F5, blanco para superficies, borde #DCE6E3, texto #18313B y secundario #536A72.
- Estados: éxito #246B50 sobre #E8F3ED; advertencia #885600 sobre #FFF3D7; información #0B6672 sobre #E4F2F1; error #A63B32 sobre #FCE9E5.
- Datos de gráficos definidos en tokens: agua #087F8C, vegetación #246B50, suelo #885600, temperatura #A63B32 y luz #A36A09.
- Tipografía: Inter con fallbacks Segoe UI y Arial. frontend/index.html carga Inter desde Google Fonts; los fallbacks sirven si esa conexión no está disponible.
- Escala base de texto 16 px; secundarios 14 px y etiquetas desde 12 px. Espaciado basado en 4 px. El objetivo táctil global es 44 px y el modo campo lo aumenta.

La paleta verde bosque (#203B2D/#315E42) descrita en una versión anterior no coincide con los tokens vigentes y deja de ser referencia.

## Tokens y componentes

- src/styles/globals.css define variables CSS/Tailwind globales; importa shells.css.
- src/design-system/tokens contiene escalas tipadas; src/lib/theme.ts las reexpone para consumidores TypeScript.
- Botón, tarjeta, badge y diálogo tienen primitivas compartidas; las rutas antiguas en components/shadcn actúan como adaptadores.
- components/workspace/WorkspaceKit.tsx comparte encabezados, métricas, estados vacíos, error, carga y badges entre módulos.
- Los estilos de acceso están en styles/auth.css; el login usa panel ilustrado y formulario en mitades iguales en escritorio.

Los tokens CSS, escalas TypeScript y valores de lib/theme.ts duplican parte de la información. Al modificar un token hay que contrastar las tres fuentes y revisar el build.

## Interacción y accesibilidad

Hay foco visible global, estados de carga/error en formularios, etiquetas accesibles, tamaños táctiles definidos y respeto a prefers-reduced-motion. Estos mecanismos no equivalen por sí solos a conformidad WCAG 2.2 AA.

La documentación previa pedía probar 320, 360, 390, 768, 1024 y 1280 px. La conformidad de cada vista, la navegación completa por teclado y la ausencia de overflow requieren validación visual y de accesibilidad; este documento no declara esa revisión completada.
