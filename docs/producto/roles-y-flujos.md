# Roles y flujos

## Roles visibles

| Rol | Áreas de la interfaz |
|---|---|
| Agricultor | Hoy, evaluar, mis riegos y alertas de sus parcelas. |
| Técnico | Panel operativo, evaluación, parcelas, riegos, alertas, sensores, clima, agricultores, catálogos y validación. |
| Administrador | Las áreas del técnico y rutas backend de gestión de usuarios. |

La navegación del frontend mejora la experiencia, pero no es un control de seguridad. Los permisos de API se aplican en middleware, solicitudes y controladores; consulta [autenticación y autorización](../backend/autenticacion-y-autorizacion.md).

## Flujo de evaluación

```text
Arduino y sensores → lectura validada → parcela, cultivo, suelo y OpenWeather
  → evaluación explicable → confirmación de la persona → riego protegido en maqueta
  → caudal y resultado real → historial
```

El agricultor debe ver la recomendación, su motivo y la acción disponible en lenguaje sencillo. El técnico debe poder revisar conexión, antigüedad y calidad de lecturas, calibración y diagnóstico del equipo sin saturar la vista del agricultor.

El botón **Regar** se ofrece únicamente cuando una evaluación válida recomienda riego, en modo real y con Arduino conectado. El Arduino mantiene las protecciones locales, incluida la condición del flotador y los límites de ejecución. El caudalímetro permite registrar lo realmente aplicado. Las recomendaciones de no regar, esperar por lluvia o evaluación incompleta no habilitan la bomba.

El modo de simulación permite escoger escenarios de evaluación para demostrar recomendaciones y estados aunque las condiciones físicas no aparezcan durante la exposición. Debe identificarse siempre como **Simulación**, usar las reglas del motor y no accionar la bomba ni confundirse con mediciones reales.

La evaluación actual puede refrescar automáticamente el pronóstico si no existe o tiene más de 120 minutos. El motor exige humedad válida de hasta 30 minutos y pronóstico de hasta 180 minutos; si no los tiene, guarda resultado incompleto. Una evaluación por parcela y hora devuelve el registro existente. El panel actual lee el puerto USB, pero aún no envía órdenes de riego ni completa el flujo descrito como objetivo.

## Datos y avisos

Las alertas se calculan al consultar la API y no se persisten como filas. El scheduler revisa estados y reevaluaciones; el worker procesa los trabajos de cola. Los avisos automáticos por WhatsApp son distintos del texto que una persona comparte manualmente. Consulta [tareas y colas](../operacion/tareas-y-colas.md).
