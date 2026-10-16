# YakuAI · Backend (Laravel 13 API)

API `api/v1` del sistema de apoyo a la decisión de riego. Fuente de verdad de reglas y contratos.

## Stack

Laravel `^13.17` + PHP `^8.3` + Sanctum `^4.0` + MySQL 8.4 + Redis 7. Tests PHPUnit `^12`.

## Comandos útiles (cwd `backend/`)

```bash
php artisan test                 # suite completa
php artisan yakuai:auditoria:matutina --simulado   # qué haría a las 05:30 sin escribir
php artisan yakuai:sensores:revisar                # marca sin_datos tras 3h
php artisan yakuai:pronosticos:limpiar              # borra pronósticos >30d
```

## Scheduler (`routes/console.php`)

`yakuai:sensores:revisar` cada 15 min · `yakuai:auditoria:matutina` 05:30 diario · `yakuai:pronosticos:limpiar` semanal.

## Reglas vigentes

Ver `../docs/reglas-v1.md` (12h / 6h-2 bloques / 05:30–07:00), `../docs/flujo-backend.md`, `../docs/estados.md`.
Motor: `app/Services/HydroService.php`. Clima: `OwmService.php` (ventana agregada 6h, fallback demo).
