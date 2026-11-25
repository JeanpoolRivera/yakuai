# Tareas y colas

`backend/routes/console.php` programa estas tareas en la zona horaria de Laravel (`APP_TIMEZONE`, en ejemplo `America/Lima`):

| Frecuencia | Comando | Efecto |
|---|---|---|
| Cada 15 min | `yakuai:sensores:revisar` | Marca sensores activos `ok` sin lectura `ok` en tres horas como `sin_datos`. |
| Cada 30 min | `yakuai:esperas:revisar` | Reevalúa esperas vencidas; resultado depende de datos recientes. |
| Diario 05:30 | `yakuai:auditoria:matutina` | Evalúa parcelas activas; `--simulado` muestra resultados sin guardar ni encolar. |
| Semanal | `yakuai:pronosticos:limpiar` | Limpia pronósticos antiguos según el comando. |

La auditoría matutina y la revisión de esperas pueden encolar `SendWhatsAppMessage` cuando hay resultado que avisar y teléfono disponible. En desarrollo requieren `docker-compose.yml` con perfil `produccion`; en producción hay servicios scheduler y worker dedicados en `docker-compose.production.yml`. Sin scheduler no hay ejecución automática; sin worker se acumulan trabajos Redis.

También existe `yakuai:sensores:simular` para datos demo. Consultar logs de comandos y worker cuando haya fallos. El nombre del perfil de desarrollo no significa que sea configuración de producción.
