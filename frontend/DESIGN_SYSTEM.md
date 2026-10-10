# YakuAI · Sistema visual

## Alcance

Capa de presentación: estilos compartidos, composiciones responsive, iconos y clases visuales.
No se modificaron rutas, autenticación, peticiones, contratos, cálculos, permisos, eventos ni datos.

## Reglas del sistema

- Fuente única de valores: `src/styles/tokens.css`.
- Tipografía: pila local Inter / Segoe UI / system-ui. No descarga fuentes ni introduce dependencias externas.
- Escala de espacio: múltiplos de 4 px. Paneles de 24 px; separación principal de 24 px; móvil de 16–20 px.
- Títulos de pantalla: 26–32 px; títulos de sección: 17–20 px; cuerpo: 14 px; metadatos: 12–13 px.
- Verde profundo para navegación y resúmenes prioritarios; verde de acción para botones; superficies neutras para lectura.
- Colores semánticos conservados para éxito, advertencia, error e información. Mantener siempre las etiquetas junto al color.
- Radios: 8 px en controles, 12 px en elementos secundarios, 16 px en paneles y 20 px en diálogos.
- Iconos: SVG compartidos de 24 unidades con trazo 1.8. Evitar mezclar emojis o familias de iconos.
- Controles: objetivos táctiles de 44 px como mínimo; campos del acceso de 52 px.
- Foco: contorno visible de 2 px y separación de 2–3 px; no eliminarlo.
- Movimiento: transiciones discretas de 160 ms. Respetar `prefers-reduced-motion`.
- Tablas: desplazamiento dentro de `.table-wrap`, nunca en toda la página.

## Organización

| Archivo | Responsabilidad |
|---|---|
| tokens.css | Color, tipografía, espacios, radios, sombras, capas y movimiento |
| app.css | Componentes compartidos, navegación, formularios, tablas, estados y diálogos |
| login.css | Acceso y recuperación; selectores aislados bajo `.access` |
| operations.css | Resumen, evaluación, riegos y alertas |
| monitoring.css | Sensores, clima y resumen agricultor |
| management.css | Agricultores, parcelas, catálogos y validación |
| components/ui.tsx | Componentes existentes e iconografía compartida |

No introducir estilos globales para `.dialog`, `.btn` o `.overlay` en las hojas de una pantalla.
Usar los componentes existentes y los tokens antes de crear otra variante.

## Composición responsive

- Escritorio: navegación lateral persistente y contenido de ancho limitado.
- Hasta 1000 px: navegación en panel superpuesto, conservando el mecanismo existente.
- Hasta 760 px: acceso en una columna; los resúmenes y la evaluación se apilan.
- Hasta 640 px: formularios en una columna, indicadores operativos en dos columnas,
  pasos del asistente con columnas iguales y resumen agricultor compacto.
- Las grillas usan `minmax(0, 1fr)` para evitar que pestañas o textos expandan la página.

## Validación realizada · 29/09/2026

- Compilación de producción: correcta.
- Lint: 0 errores; 15 advertencias existentes.
- Pruebas: 62 correctas / 66. Los mismos cuatro fallos se reprodujeron en una copia
  del código anterior: tres del cliente HTTP y uno del formato de fecha «set.» frente a «sep».
  No se cambiaron por estar fuera del alcance visual.
- Revisión de escritorio a 1440 px, móvil a 390 px y comprobación de anchura de las
  trece pantallas a 320, 768 y 1024 px.
- Se corrigió y volvió a verificar el desbordamiento de filtros de alertas a 320 px.
- Se inspeccionaron formularios de agricultor y parcela, menú móvil, filtros, estados vacíos
  y diálogos con las hojas de acceso cargadas.
- Las pantallas internas se revisaron mediante una entrada temporal con datos ficticios y
  escrituras bloqueadas. Esa entrada se retiró del código final.
- No constituye una validación funcional autenticada ni una auditoría completa WCAG.

## Observaciones previas, fuera del alcance

- La ruta raíz `/` renderiza Dashboard/Hoy directamente, fuera de ShellRoutes;
  por ello puede aparecer sin navegación. El arnés visual presentó los componentes dentro
  de sus shells existentes. No se modificó el enrutamiento.
- El service worker usa caché primero para los recursos del servidor de desarrollo.
  Una sesión antigua puede mostrar estilos anteriores; la verificación usó un origen local
  separado y la entrada de QA sin registrar service worker. No se modificó su comportamiento.

### Corrección de entrega visual

Se incrementó la versión de la caché estática en public/sw.js para renovar los recursos
antiguos del navegador. Se verificó el acceso real en localhost:8081 después de la
actualización y recarga: campos de radio 8 px, botón sin gradiente y nuevo fondo neutro.
No se alteró la estrategia de caché de API ni los flujos de autenticación.
