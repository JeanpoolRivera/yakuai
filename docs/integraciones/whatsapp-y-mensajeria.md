# WhatsApp y mensajería

Hay dos flujos distintos:

1. **Compartir manualmente:** el endpoint `GET /evaluations/{evaluation}/mensaje` produce texto y el frontend ofrece compartirlo; la persona confirma/envía desde su aplicación. No es un envío automático del backend.
2. **Avisos automáticos:** `AuditoriaMatutina` y `EsperasRevisar` encolan `SendWhatsAppMessage` cuando corresponde. El worker ejecuta `WhatsAppService` para evaluaciones `riega` o `espera`.

El servicio implementa una solicitud de estilo WhatsApp Cloud API: `WHATSAPP_API_URL`, `WHATSAPP_API_KEY` y `WHATSAPP_PHONE_NUMBER_ID`. Si falta cualquiera, registra una simulación en logs y devuelve éxito simulado; esto no significa que el destinatario recibió el mensaje. `WHATSAPP_PROVIDER` y `WHATSAPP_RECIPIENT_PHONE` aparecen en `.env.example`, pero el servicio mostrado no los lee directamente. La auditoría matutina usa primero el teléfono del agricultor y luego el teléfono de su cuenta activa; la revisión de esperas usa el teléfono guardado en el registro del agricultor.

El trabajo configura tres intentos con backoff declarado; fallos HTTP o excepciones se registran. Los mensajes deben reflejar la evaluación y el plan guardado; no inferir que un teléfono de ejemplo, simulación o mensaje compartido manual equivale a una notificación entregada.
