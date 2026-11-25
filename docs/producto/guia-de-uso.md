# Guía de uso

Esta guía resume las tareas principales en la interfaz. Los nombres de navegación pueden variar ligeramente según el rol.

## Ingreso

En `/login`, el personal inicia con correo y contraseña; el agricultor usa correo y PIN de cuatro dígitos. Una cuenta de agricultor nueva se activa desde la invitación recibida por correo. Si olvidó el PIN, puede solicitar un código de recuperación por correo.

## Agricultor

1. En **Hoy**, revisa el estado de sus parcelas y avisos disponibles.
2. En **Evaluar**, selecciona una parcela y solicita una evaluación. El resultado depende de que haya humedad válida reciente y un pronóstico vigente.
3. Si la evaluación propone regar, revisa el volumen y el plan mostrado; la aplicación no ejecuta el riego.
4. Registra el riego realizado en **Mis riegos**. Las correcciones conservan el registro anterior.
5. Revisa **Alertas** y comparte el resumen desde el botón de WhatsApp si desea enviarlo manualmente.

## Personal técnico y administrador

El panel permite consultar el resumen, evaluar, gestionar parcelas y agricultores, registrar sensores y consultar clima, alertas, catálogos y validación. En **Evaluar**, el personal técnico puede simular escenarios de humedad y lluvia para la presentación, incluso sin Arduino. La simulación calcula con las reglas del motor, pero no guarda lecturas ni evaluaciones y no activa la bomba. También existe una simulación de lectura para sensores de humedad activos y calibrados. El administrador cuenta además con rutas de gestión de usuarios.

Esta guía no sustituye la autorización del backend. Si faltan datos o una acción falla, el mensaje de la interfaz y los registros del backend ayudan a identificar el motivo; véase [mantenimiento y diagnóstico](../operacion/mantenimiento-y-diagnostico.md).
