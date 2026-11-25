# Modelo de datos

Las migraciones de `backend/database/migrations/` son la fuente de verdad del esquema. Las entidades principales son:

| Entidad | Relación y propósito |
|---|---|
| Usuario | Rol, credenciales, estado activo y vínculo opcional con agricultor; puede tener tokens, auditorías e invitaciones. |
| Agricultor | Persona titular de parcelas y, opcionalmente, cuenta de acceso. |
| Invitación | Hash del token, correo, expiración y aceptación para activar cuenta de agricultor. |
| Parcela | Agricultor, ubicación, área, cultivo/fecha de siembra, suelo, sistema y eficiencia de riego; caudal opcional. |
| Cultivo y etapa | Catálogo y parámetros por etapa: duración, Kc, raíz y fracción de agotamiento. |
| Textura de suelo | Catálogo de capacidad de campo, punto de marchitez y metadatos de fuente. |
| Sensor y medición | Sensor adscrito a parcela; lecturas crudas/normalizadas, calidad, origen y fecha. |
| Pronóstico | Parcela, ventana, temperaturas, lluvia, probabilidad, payload de origen y marca de procedencia. |
| Evaluación | Resultado, entradas congeladas en snapshot, confianza, motivo, revisión siguiente y criticidad. |
| Riego | Registro manual vinculado opcionalmente a evaluación; correcciones se enlazan como sucesores y anulaciones conservan motivo. |
| Auditoría | Acción, actor opcional, IP y detalles de eventos relevantes. |

Las restricciones de claves foráneas limitan el borrado de registros relacionados. Las rutas de producto no ofrecen eliminación de los recursos principales. Para nombres de columnas y restricciones exactos, consultar las migraciones.
