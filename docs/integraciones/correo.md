# Correo

El correo se usa para invitaciones/activación de agricultores y recuperación de PIN. El código envía a través del mailer SMTP de Laravel; `.env.example` está preparado para Brevo SMTP. Una cuenta solo recibirá mensajes reales si el host tiene credenciales válidas, remitente permitido y conectividad SMTP.

Variables efectivas de ejemplo: `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_SCHEME`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`. `config/services.php` contiene además entradas `BREVO_*`, pero `config/mail.php` configura el transporte SMTP desde `MAIL_*`; las entradas `BREVO_*` por sí solas no configuran ese mailer.

La invitación expira a las 24 horas. El código de recuperación se conserva temporalmente y expira a los 10 minutos. El frontend puede mostrar el estado del proceso, pero el proveedor SMTP y su disponibilidad son externos. Nunca registrar códigos, contraseñas SMTP ni secretos en documentación pública.
