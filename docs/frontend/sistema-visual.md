# Sistema visual

El sistema visual está implementado en `frontend/src/design-system/`, `frontend/src/styles/`, `frontend/src/lib/theme.ts` y componentes compartidos. Este documento describe los valores existentes; al cambiar un token hay que revisar CSS global, tokens TypeScript y consumidores.

## Identidad

- Marca principal teal `#0B6672`, hover `#09525C`, suave `#DFF0ED`, profundo `#112D3B` y acento `#83C9C1`.
- Lienzo `#F4F7F5`, superficies blancas, borde `#DCE6E3`, texto `#18313B` y secundario `#536A72`.
- Éxito `#246B50` sobre `#E8F3ED`; advertencia `#885600` sobre `#FFF3D7`; información `#0B6672` sobre `#E4F2F1`; error `#A63B32` sobre `#FCE9E5`.
- Colores de datos de gráficos definidos en tokens: agua `#087F8C`, vegetación `#246B50`, suelo `#885600`, temperatura `#A63B32` y luz `#A36A09`.
- Tipografía Inter con fallbacks Segoe UI y Arial. Inter se carga desde Google Fonts; el sistema tiene fallbacks si no hay conexión.
- Escala base de texto 16 px, secundarios 14 px, etiquetas desde 12 px; espaciado en múltiplos de 4 px.
- El objetivo táctil base es 44 px; el modo de campo aumenta el área táctil.

## Componentes y patrones

Primitivas de botón, tarjeta, badge, campos, alertas, diálogos, sheets, estados vacíos/carga y métricas se comparten entre páginas. `WorkspaceKit` agrupa encabezados y patrones de módulo; los adaptadores existentes bajo `components/shadcn/` preservan usos anteriores.

El modo de campo ofrece objetivos táctiles mayores. Recharts se usa en componentes reutilizables de área, barra y línea. No usar paletas históricas como fuente de verdad: los tokens del frontend son la referencia.

`src/styles/globals.css` define variables CSS/Tailwind globales e importa `shells.css`; tokens tipados están en `src/design-system/tokens/` y se reexportan mediante `src/lib/theme.ts`. Los estilos de acceso están en `src/styles/auth.css`. La vista de login usa composición con panel ilustrado y formulario, adaptada por breakpoint.

Los valores de CSS, los tokens TypeScript y `lib/theme.ts` duplican parte de la información. Al cambiar un token, comparar las tres fuentes y comprobar las vistas que lo consumen.
