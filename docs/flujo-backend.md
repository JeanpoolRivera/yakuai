# YakuAI · Flujo backend observado

~~~text
inicio de sesión unificado (correo + PIN/contraseña)
  → registro de agricultor, parcela y sensor (según pantallas/permisos existentes)
  → ingesta POST /measurements (normaliza lectura; 409 si duplicada)
  → actualización de clima (agrega hasta dos intervalos de 3 h; fallback demo)
  → evaluación (HydroService; guarda resultado y snapshot; idempotencia por parcela/hora)
  → registro manual de riego (corrección crea sucesor; anulación conserva motivo)
  → GET /alerts (sensor anómalo/sin datos, evaluación incompleta, humedad crítica)

Tareas del scheduler:
  cada 15 min  yakuai:sensores:revisar
  cada 30 min  yakuai:esperas:revisar
  05:30 diario yakuai:auditoria:matutina
  semanal      yakuai:pronosticos:limpiar

Mensajes:
  auditoría y re-chequeo → encola SendWhatsAppMessage cuando corresponde
  queue worker → servicio WhatsApp; sin configuración, registra simulación
~~~

En desarrollo, scheduler y worker se activan con el perfil produccion de docker-compose.yml. En producción se ejecutan como servicios separados de docker-compose.production.yml. Sin esos servicios, las órdenes no corren automáticamente. El scheduler usa la zona horaria configurada para la aplicación. El envío real requiere endpoint, token e ID de número telefónico del proveedor.

El controlador de alertas calcula respuestas en tiempo real y no persiste alertas. Los detalles de resultado, horario, frescura y origen están en [reglas-v1.md](reglas-v1.md) y [estados.md](estados.md).

Rutas activas: [backend/routes/api.php](../backend/routes/api.php). Comandos programados: [backend/routes/console.php](../backend/routes/console.php).
