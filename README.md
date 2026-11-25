# YakuAI

Sistema web de apoyo a decisiones de riego para agricultura familiar. Reúne información de parcelas, cultivos, suelos, mediciones y clima para presentar recomendaciones explicables. La persona agricultora decide y aplica el riego; YakuAI no controla válvulas.

## Inicio rápido

Con Docker instalado y `.env` preparado:

```sh
docker compose up -d --build
```

Frontend: `http://127.0.0.1:8081`; API: `http://127.0.0.1:8082/api/v1`. Para activar scheduler y worker en desarrollo, usa `docker compose --profile produccion up -d --build`. Es un perfil local, no el despliegue productivo.

## Estado y límites

El producto incluye gestión de parcelas/sensores, ingreso manual y simulado de lecturas, evaluación y registro manual de riego, clima con fallback, alertas calculadas y panel operativo. La maqueta Arduino UNO puede enviar lecturas por USB a la pantalla de sensores en Chrome/Edge mientras la computadora permanece conectada; YakuAI no controla la bomba desde la web. WhatsApp automático depende de configuración y worker. Los escenarios demo no son validación de campo.

## Documentación

El índice y las guías por tema están en [docs/README.md](docs/README.md). Consulta [desarrollo local](docs/operacion/desarrollo-local.md), [despliegue](docs/operacion/despliegue-produccion.md), [sensores](docs/integraciones/sensores-y-arduino.md) y [WhatsApp](docs/integraciones/whatsapp-y-mensajeria.md). La referencia exacta de rutas API es `backend/routes/api.php`.
