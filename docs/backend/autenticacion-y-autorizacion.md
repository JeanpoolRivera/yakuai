# Autenticación y autorización

## Inicio de sesión

Se utilizan tokens personales Bearer de Laravel Sanctum, no JWT. El endpoint unificado recibe correo y `secret`; el servidor trata el secreto como PIN de cuatro dígitos para agricultores y como contraseña para el resto. Los tokens creados expiran en ocho horas. La invitación activa cuentas de agricultor; la recuperación usa un código enviado por correo.

Al iniciar sesión, el token del agricultor recibe capacidades `ver`, `evaluar` y `regar`; el token del personal recibe alcance completo. El middleware `EnsureActiveUser` verifica que la cuenta esté activa, aplica capacidades para tokens Bearer limitados y los controladores/resolvers aplican restricciones por rol y parcela.

## Roles y controles relevantes

- Gestión de usuarios: administrador.
- Gestión de agricultores, parcelas y sensores: personal técnico/administrador según Form Requests.
- Lecturas, evaluaciones, clima, riegos, alertas e historial se filtran o comprueban por parcela en los controladores pertinentes.
- La interfaz oculta pantallas según rol, pero esa navegación no sustituye la autorización del API.

## Observación de seguridad a verificar

En el código revisado, `AuthController::refresh` elimina el token vigente y crea un token con capacidad `*`. `MeasurementRequest` acepta el rol técnico/administrador o cualquier token con capacidad `ingerir`, y `MeasurementController::store` no verifica pertenencia del sensor a la parcela del agricultor. Por tanto, la documentación no debe afirmar que el alcance de mediciones queda garantizado para agricultores. Esta observación describe el código estático; no equivale a una prueba de explotación. Referencias: `AuthController.php`, `EnsureActiveUser.php`, `MeasurementRequest.php` y `MeasurementController.php`.

Revisar y mantener esta nota según el código y la cobertura de autorización vigente. No exponer tokens ni secretos en reportes o logs.
