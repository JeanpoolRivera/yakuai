# Accesibilidad y diseño adaptable

El frontend incluye etiquetas para campos, foco visible global, estados de carga/error y respeto a `prefers-reduced-motion`. El modo de campo aumenta los objetivos táctiles. Estos recursos mejoran la interacción, pero no constituyen por sí solos certificación WCAG.

El diseño utiliza breakpoints Tailwind y layouts adaptables; los tamaños táctiles y de texto están descritos en [sistema visual](sistema-visual.md). Para declarar compatibilidad por viewport hace falta revisar visualmente las páginas en anchos de teléfono, tablet y escritorio, y comprobar que no haya overflow.

## Comprobaciones recomendadas al modificar interfaz

- Recorrer todos los formularios y navegación con teclado, verificando orden y foco.
- Comprobar contraste de textos, estados y controles sobre sus fondos.
- Revisar zoom y ancho reducido, incluidos mapas, tablas, diálogos y gráficos.
- Como anchos de referencia para QA manual, revisar 320, 360, 390, 768, 1024 y 1280 px.
- Confirmar que errores y estados no se comuniquen solo con color.
- Verificar nombres accesibles y que los cambios dinámicos sean perceptibles.

La documentación no afirma conformidad WCAG 2.2 AA ni QA visual completo sin una revisión registrada.
