# YakuAI: resumen y alcance

YakuAI es un sistema de apoyo a decisiones de riego para agricultura familiar. El producto final integra los datos de la maqueta conectada al Arduino con los datos de la parcela, el cultivo, el suelo y el pronóstico meteorológico para recomendar si corresponde regar. Cuando la evaluación recomienda riego, la persona usuaria lo confirma desde YakuAI y la maqueta ejecuta la acción mediante el Arduino, con protecciones locales.

La maqueta representa una parcela a escala. El sensor capacitivo mide humedad del sustrato; el DS18B20 mide la temperatura del sustrato/cultivo de la maqueta; OpenWeather aporta temperatura del aire y datos meteorológicos. El caudalímetro mide el agua aplicada, el flotador informa si hay agua disponible y el relé conmuta la bomba.

## Funciones del producto

- Gestión de agricultores, parcelas, sensores y riegos por el personal autorizado.
- Acceso de personal con contraseña y de agricultores con PIN, con activación por invitación y recuperación de PIN por correo.
- Catálogos de cultivos, etapas y texturas de suelo en modo consulta.
- Recepción de lecturas reales del Arduino por USB y modo de simulación claramente identificado para demostraciones.
- Evaluación explicable que combina las lecturas disponibles con parcela, cultivo, suelo y clima.
- Confirmación del riego recomendado, ejecución protegida en la maqueta y registro del resultado medido.
- Consulta de clima, evaluación de riego, historial de lecturas y riegos.
- Alertas calculadas para sensores problemáticos, evaluaciones incompletas y humedad crítica.
- Panel operativo, métricas y escenarios deterministas de validación.

## Límites que deben comunicarse

- El objetivo del producto incluye conexión USB bidireccional con Arduino para recibir lecturas y confirmar la ejecución del riego. La interfaz actual recibe telemetría; el envío de órdenes de riego y el flujo completo aún están pendientes de implementación. La simulación es independiente de las lecturas reales y no debe activar la bomba.
- El envío automático de WhatsApp requiere configuración y worker. El botón de compartir prepara texto para que el usuario lo envíe desde su aplicación.
- Sin `OWM_KEY`, o ante errores del proveedor, el backend registra clima demo/fallback.
- Los valores iniciales de cultivos y suelos se basan en las fuentes indicadas en los catálogos, pero sus duraciones y valores predeterminados requieren validación local. La humedad relativa generada por calibración de dos puntos debe comprobarse antes de compararla con CC/PMP. Los escenarios simulados prueban el recorrido de la interfaz, no precisión agronómica en campo.

Para ver quién usa cada función, consulta [roles y flujos](roles-y-flujos.md). Para los límites de cada integración, consulta [integraciones](../README.md#integraciones).
