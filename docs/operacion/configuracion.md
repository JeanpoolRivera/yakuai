# Configuración

`.env.example` enumera variables de referencia; los valores de producción deben ser secretos propios y no deben guardarse en el repositorio. El script `scripts/setup.sh` puede generar `.env` local y claves aleatorias si el archivo todavía no existe.

| Grupo | Variables principales | Uso |
|---|---|---|
| Laravel | `APP_ENV`, `APP_KEY`, `APP_DEBUG`, `APP_URL`, `APP_TIMEZONE` | Entorno, cifrado, URL y reloj de tareas. |
| Web | `FRONTEND_URL`, `FRONTEND_PORT`, `FRONTEND_BIND`, `API_PORT` | Orígenes y puertos Compose. |
| MySQL | `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `MYSQL_ROOT_PASSWORD` | Conexión y credenciales de base. |
| Redis | `REDIS_HOST`, `REDIS_PORT`, `CACHE_STORE`, `SESSION_DRIVER`, `QUEUE_CONNECTION` | Caché, sesión y cola. |
| SMTP | `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` | Invitaciones y recuperación. |
| Clima | `OWM_KEY`, `OWM_TIMEOUT` | OpenWeatherMap; sin clave se usa fallback. |
| WhatsApp | `WHATSAPP_API_URL`, `WHATSAPP_API_KEY`, `WHATSAPP_PHONE_NUMBER_ID` | Envío automático opcional; el servicio simula si falta alguna. |

`WHATSAPP_PROVIDER` y `WHATSAPP_RECIPIENT_PHONE` están en el ejemplo, pero no son leídas directamente por el servicio de envío. El destinatario de un trabajo se obtiene desde datos del agricultor en los comandos que lo encolan. `MAIL_*` es lo que lee `config/mail.php`; las claves `BREVO_*` de `config/services.php` no configuran por sí solas el mailer SMTP.

En producción establecer `APP_DEBUG=false`, TLS en proxy de entrada, contraseñas robustas y limitar exposición de puertos. No publicar credenciales en capturas o documentación.
