# YakuAI — Resumen de Contexto del Proyecto

> Documento de contexto para informes. Se actualiza incrementalmente.
> Fuente principal de verdad: `README.md`, `composer.json`, `package.json`, `.env.example`, `docker-compose.yml`.

---

## 1. Identidad del proyecto

- **Nombre:** YakuAI
- **Descripción:** Sistema de apoyo a la decisión de riego para agricultura familiar (Chupaca, Junín, Perú). Combina parcela + cultivo/suelo + sensores Arduino baratos + pronóstico OpenWeatherMap para producir una recomendación explicable (regar / no regar / esperar + cantidad en rango + momento + confianza + próxima revisión).
- **Filosofía:** El sistema recomienda; el agricultor decide y riega.
- **Idioma:** Español.
- **Unidades:** mm / L / m².
- **Fechas:** UTC con vista America/Lima.
- **Código limpio:** Pint (backend), oxlint + tsc (frontend), commits convencionales, ramas `main` + `feat/*`.

---

## 2. Problemática y objetivo

- **Problema:** Regar a ojo desperdicia agua o estresa el cultivo. La humedad sola, sin suelo, etapa, clima y riego anterior, no alcanza para decidir bien.
- **Objetivo:** Responder "¿riego ahora o en las próximas horas y cuánta agua conviene aplicar?" con trazabilidad de lo usado para decidir.
- **Alcance v1 (curso-maqueta):** 4 cultivos (papa, maíz choclo, haba seca, zanahoria); 3 sensores lógicos (YL-69, FC-37, DHT11) con ingesta manual/demo y Arduino después; OWM con key de servidor; mapa con área del dibujo; panel agricultor simple + panel técnico; riego aplicado manual; notificación en panel + compartir por WhatsApp (sin envío real).
- **Fuera de v1:** NPK→litros, mapa→suelo, válvulas, IA predictiva, multipunto, Penman-Monteith completo, WhatsApp/SMS automático real.

---

## 3. Usuarios y roles

| Rol | Ve | Crea/edita | Restricción |
|---|---|---|---|
| **Admin** | Todo | Usuarios, catálogos, todo | Solo él toca parámetros FAO |
| **Técnico** | Sus parcelas, sensores, clima, historial | Agricultores, parcelas, sensores, riegos | No toca catálogos ni usuarios |
| **Agricultor (PIN)** | Solo sus parcelas | Evaluar, registrar su riego | No configura |
| **Sensor (token)** | Nada | Solo `POST /mediciones` | Alcance ingesta |

- **Auth:** JWT corto + PIN 4 dígitos por cuenta. Sesión/redis.
- Bloqueo por intentos en PIN; token sensor solo para ingesta.

---

## 4. Stack técnico

### 4.1 Backend — Laravel 13 API + MySQL + Redis

| Componente | Detalle |
|---|---|
| Framework | Laravel 13.17 (`^13.17`) |
| PHP | `^8.3` (platform `8.3.33`) |
| Auth | Laravel Sanctum `^4.0` |
| Testing | Pest/PHPUnit `^12.5.12`, Mockery, Faker |
| Linting | Laravel Pint |
| Autoload | PSR-4: `App\` → `app/`, `Database\Factories`, `Database\Seeders` |
| Tests PSR-4 | `Tests\` → `tests/` |
| BD | MySQL 8.4 (`mysql:8.4`), sqlite para testing (in-memory) |
| Cache/Sesión/Cola | Redis (`redis:7-alpine`) |
| API | REST JSON `api/v1`, prefijo `/api/v1`, Sanctum |

**Dependencias clave del `composer.json`:**
- `laravel/framework`, `laravel/sanctum`, `laravel/tinker` (producción)
- `fakerphp/faker`, `mockery/mockery`, `nunomaduro/collision`, `phpunit/phpunit` (dev)

### 4.2 Frontend — React + Vite + Leaflet

| Componente | Detalle |
|---|---|
| React | `^19.2.8` |
| React Router | `^7.18.4` |
| Leaflet | `^1.9.4` + `leaflet-draw` `^1.0.4` |
| TypeScript | `~6.0.2` |
| Vite | `^8.3.0` |
| Linting | oxlint `^1.81.0` |
| Build | `tsc -b && vite build` |
| Node | `node:22-alpine` |

### 4.3 Infraestructura — Docker Compose

| Servicio | Imagen | Puerto local | Perfil |
|---|---|---|---|
| `mysql` | `mysql:8.4` | 3306 (interno) | siempre |
| `redis` | `redis:7-alpine` | 6379 (interno) | siempre |
| `app` | `yakuai-php:dev` (PHP 8.3-FPM) | 9000 (interno) | siempre |
| `nginx` | `nginx:1.27-alpine` | `127.0.0.1:8082` | siempre |
| `frontend` | `node:22-alpine` (Vite) | `127.0.0.1:8081` | siempre |
| `scheduler` | `yakuai-php:dev` | — | `produccion` |
| `worker` | `yakuai-php:dev` | — | `produccion` |

- **Compose up normal:** 5 servicios (mysql, redis, app, nginx, frontend).
- **Perfil `produccion`:** `docker compose --profile produccion up -d --build` agrega scheduler + worker.
- Healthchecks en todos los servicios.
- Volúmenes: `mysql_data`, `redis_data`.

**Dockerfiles:**
- `docker/php/Dockerfile`: `php:8.3-fpm-bookworm`, extensiones (bcmath, mbstring, pdo_mysql, pdo_sqlite, pcntl, zip, redis pecl-6.2.0), usuario `yakuai:1000`.
- `docker/frontend/Dockerfile`: `node:22-alpine`, usuario `node`, expone 5173.
- `docker/nginx/default.conf`: root `/var/www/html/public`, fastcgi a `app:9000`, client_max_body_size 2m.

---

## 5. Estructura de archivos

### 5.1 Backend (`backend/`)

```
backend/
├── app/
│   ├── Console/          # Comandos Artisan
│   ├── Http/
│   │   ├── Controllers/  # 15 controladores
│   │   │   ├── AuthController.php
│   │   │   ├── CropController.php
│   │   │   ├── EvaluationController.php
│   │   │   ├── FarmerController.php
│   │   │   ├── HealthController.php
│   │   │   ├── IrrigationController.php
│   │   │   ├── MeasurementController.php
│   │   │   ├── PlotController.php
│   │   │   ├── SensorController.php
│   │   │   ├── SoilTextureController.php
│   │   │   ├── UserController.php
│   │   │   ├── ValidationController.php
│   │   │   ├── WeatherController.php
│   │   │   └── Controller.php
│   │   └── ...
│   ├── Models/           # 11 modelos Eloquent
│   │   ├── Crop.php, CropStage.php, Evaluation.php, Farmer.php
│   │   ├── Forecast.php, Irrigation.php, Measurement.php
│   │   ├── Plot.php, Sensor.php, SoilTexture.php, User.php
│   │   └── ...
│   ├── Providers/
│   └── Services/         # 5 servicios de dominio
│       ├── HydroService.php      # Motor hídrico (ET0 Hargreaves + Ra FAO, umbral, espera 6h, rango 50L)
│       ├── OwmService.php        # Integración OpenWeatherMap
│       ├── SensorNormalizer.php  # Normalización YL-69 / DHT11 / FC-37
│       ├── ValidationService.php # Validaciones de negocio
│       └── MessageService.php    # Mensajes de recomendación / WhatsApp
├── bootstrap/
├── config/               # Configuración Laravel (database, app, etc.)
├── database/
│   ├── migrations/       # 16 migraciones
│   │   ├── 0001_01_01_000000_create_users_table.php
│   │   ├── 0001_01_01_000001_create_cache_table.php
│   │   ├── 0001_01_01_000002_create_jobs_table.php
│   │   ├── 2026_09_22_031859_add_role_pin_active_to_users_table.php
│   │   ├── 2026_09_22_032020_create_crops_table.php
│   │   ├── 2026_09_22_032021_create_crop_stages_table.php
│   │   ├── 2026_09_22_032023_create_soil_textures_table.php
│   │   ├── 2026_09_22_032150_create_farmers_table.php
│   │   ├── 2026_09_22_032151_create_plots_table.php
│   │   ├── 2026_09_22_033053_create_sensors_table.php
│   │   ├── 2026_09_22_033054_create_measurements_table.php
│   │   ├── 2026_09_22_033553_create_forecasts_table.php
│   │   ├── 2026_09_22_034330_add_farmer_id_to_users_table.php
│   │   ├── 2026_09_22_035331_create_evaluations_table.php
│   │   └── 2026_09_22_040630_create_irrigations_table.php
│   ├── seeders/          # 4 seeders
│   │   ├── AdminSeeder.php
│   │   ├── CatalogSeeder.php    # 4 cultivos + 16 etapas + 5 suelos
│   │   ├── DatabaseSeeder.php
│   │   └── SimulacionSeeder.php # 10 casos demo
│   └── factories/
├── routes/
│   ├── api.php           # API v1 completa (77 líneas)
│   ├── console.php
│   └── web.php
├── public/               # Punto de entrada público
├── resources/            # Views/lang/lang files
├── storage/              # Logs, cache, sesiones
├── tests/
│   ├── Feature/          # 9 tests funcionales
│   │   ├── AuthenticationTest.php
│   │   ├── CatalogPlotTest.php
│   │   ├── ClosingTest.php
│   │   ├── ExampleTest.php
│   │   ├── IngestionTest.php
│   │   ├── IrrigationTest.php
│   │   ├── MotorTest.php
│   │   ├── ValidationMatrixTest.php
│   │   └── WeatherTest.php
│   ├── Unit/             # 1 test unitario
│   └── TestCase.php
├── vendor/               # Dependencias composer
├── composer.json
├── composer.lock
├── phpunit.xml           # Testing: sqlite in-memory, BCRYPT_ROUNDS=4
├── vite.config.js        # Vite config para backend
└── .env / .env.example   # Variables de entorno
```

### 5.2 Frontend (`frontend/`)

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts     # Cliente HTTP base
│   │   ├── endpoints.ts  # Funciones de acceso a cada recurso (221 líneas)
│   │   └── types.ts      # Tipos TypeScript del dominio (212 líneas)
│   ├── app/              # Configuración de la app
│   ├── components/
│   │   ├── layout.tsx    # Layout de la aplicación
│   │   ├── PlotMap.tsx   # Mapa Leaflet con dibujo
│   │   ├── Toasts.tsx    # Sistema de notificaciones
│   │   └── ui.tsx        # Componentes UI reutilizables
│   ├── hooks/            # Hooks personalizados
│   ├── lib/
│   │   ├── dom.ts        # Utilidades DOM
│   │   ├── format.ts     # Formateo de valores
│   │   ├── geo.ts        # Utilidades geográficas
│   │   ├── permissions.ts # Control de permisos por rol
│   │   └── toast.ts      # Gestión de toasts
│   ├── pages/            # 12 páginas
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Evaluate.tsx
│   │   ├── Plots.tsx
│   │   ├── Farmers.tsx
│   │   ├── Sensors.tsx
│   │   ├── Weather.tsx
│   │   ├── Irrigations.tsx
│   │   ├── Alerts.tsx
│   │   ├── Catalogs.tsx
│   │   ├── Validation.tsx
│   │   └── Hoy.tsx
│   ├── styles/           # Estilos globales
│   ├── main.tsx          # Punto de entrada
│   ├── qa-preview.tsx    # Vista previa QA
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   └── tsconfig.node.json
├── public/
├── dist/                 # Build de producción
├── node_modules/
├── package.json          # React 19, Vite 8, Leaflet 1.9, oxlint, TypeScript 6
├── .oxlintrc.json
└── vite.config.ts
```

---

## 6. Modelo de datos (11 tablas)

| Tabla | Campos clave | Relación |
|---|---|---|
| `users` | email, password, role (admin/tecnico/agricultor), pin, active, farmer_id | Auth + scoping |
| `farmers` | name, phone, is_active | → plots (1:N) |
| `crops` | code, name, scientific_name, is_active | → crop_stages (1:N) |
| `crop_stages` | crop_id, stage (ini/des/med/fin), days, kc, root_depth_m, depletion_fraction, version | FAO-56 |
| `soil_textures` | code, name, field_capacity, wilting_point, source, version | CC/PMP |
| `plots` | farmer_id, name, lat, lon, boundary, area_m2, area_origin, crop_id, sowing_date, soil_texture_code, irrigation_system, irrigation_efficiency, flow_lpm, status | + sensors, measurements, forecasts, evaluations |
| `sensors` | plot_id, type, model, pin, dry_ref, wet_ref, status, is_active | → measurements (1:N) |
| `measurements` | sensor_id, plot_id, measured_at, raw_value, norm_value, quality, origin | YL-69/DHT11/FC-37 |
| `forecasts` | plot_id, fetched_at, issued_at, period_from/to, temp_max/min, rain_mm, rain_prob, raw_json, origin | OWM |
| `evaluations` | plot_id, evaluated_at, stage, snapshot (JSON), result (riega/no/espera/incompleta), min_L, max_L, confidence, reason, next_at, is_critical | → irrigations (1:N) |
| `irrigations` | plot_id, evaluation_id, supersedes_id, occurred_at, recommended_liters, applied_liters, origin, note, status | Cadena supersede/anulación |
| `notifications` | evaluation_id, canal, mensaje, estado | Alertas |
| `audit` | actor, acción, entidad, antes, después, fecha | Trazabilidad parámetros |

**Índices:** (plot, fecha). Unicidad: (sensor+medido_en), (plot+evaluada_en/hora).

**Catálogos sembrados:** 4 cultivos (papa, maíz choclo, haba seca, zanahoria) + 16 etapas + 5 suelos.

---

## 7. API REST (`api/v1`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/health` | — | Salud |
| POST | `/auth/login` | — | Login técnico/admin → JWT |
| POST | `/auth/pin` | — | PIN agricultor → JWT limitado |
| GET | `/auth/me` | JWT | Usuario actual |
| POST | `/auth/logout` | JWT | Cerrar sesión |
| CRUD | `/users` | JWT rol | Gestión de usuarios |
| GET | `/crops`, `/crops/{id}`, `/soil-textures` | JWT | Catálogos (solo lectura) |
| CRUD | `/farmers` | JWT | Agricultores |
| CRUD | `/plots` | JWT | Parcelas (wizard 3 pasos, área dibujo) |
| CRUD | `/sensors` | JWT | Sensores + calibración 2 puntos |
| GET | `/measurements` | JWT | Listar mediciones |
| POST | `/measurements` | JWT / token sensor | Ingesta (manual/demo/Arduino) |
| GET/POST | `/plots/{id}/weather`, `refresh` | JWT | Clima OWM + demo |
| POST | `/plots/{id}/evaluate` | JWT | Evaluación idempotente (parcela+hora) |
| GET | `/evaluations`, `/evaluations/{id}`, `/{id}/mensaje` | JWT | Historial + texto recomendación |
| GET/POST | `/irrigations`, `/{id}/corregir`, `/{id}/anular` | JWT | Riego aplicado + corrección |
| GET | `/alerts` | JWT | Alertas del panel |
| GET | `/validation` | JWT | Validación curso (10 casos) |

**Reglas:**
- Prefijo `/api/v1`, autenticación Sanctum.
- Idempotencia: evaluación por parcela+hora (doble clic = 1 evaluación).
- Evaluaciones inmutables (snapshot).
- Scoping por agricultor (técnico solo ve sus parcelas).
- Token sensor: solo `POST /measurements`.

---

## 8. Motor hídrico (HydroService)

**Fórmulas (FAO-56 Allen 1998):**

- **Radiación extraterrestre Ra:** Ec. 21-28, cálculo con latitud, día del año, declinación, ángulo horario.
- **ET0 Hargreaves:** Ec. 52, solo temperatura (Tmax, Tmin, Ra).
- **Kc:** Por etapa de cultivo (catálogo versionado).
- **ETc = Kc × ET0**
- **Umbral:** Zr (raíz) × P (fracción de agotamiento) × CC (capacidad de campo).
- **Lluvia efectiva:** Prob ≥ 70% + mm que cubren lo que falta, en 2 bloques seguidos → espera 6h. Si suelo crítico, se riega igual.
- **Salida:** Rango de 50 L + momento 05:30-07:00 + confianza por frescura + próxima hora.
- **Constantes:** `PROB_MIN = 0.70`, `RAIN_EFF = 0.80`, `MEASURE_MAX_MIN = 30`, `FORECAST_MAX_MIN = 180`, `WAIT_HOURS = 6`.

**Reglas de negocio (README §6):**
1. Sin CC/PMP/Zr/p/Kc/área/edad → incompleta ("dato pendiente"), no inventar.
2. Lectura > 30 min o clima > 3 h → vencidos.
3. YL-69: >850 seco, 500-850 húmedo, <500 mojado (calibrable).
4. FC-37 solo aviso sí/no. HR DHT11 solo se muestra; temperatura alimenta ET0.
5. Lluvia solo pospone si prob ≥ 70% + mm cubren lo que falta, 2 bloques seguidos, espera 6h; si suelo crítico, se riega igual.
6. Salida en rango 50L + momento 05:30-07:00 + confianza + próxima hora. Haba = seca. MO por defecto 1%.

---

## 9. Sensores y calibración

| Sensor | Tipo | Modelo | Rango | Notas |
|---|---|---|---|---|
| YL-69 | Humedad suelo | YL-69 | >850 seco, 500-850 húmedo, <500 mojado | Calibrable 2 puntos |
| FC-37 | Humedad suelo | FC-37 | Solo aviso sí/no | No da mm |
| DHT11 | Aire temp/HR | DHT11 | HR solo muestra; T alimenta ET0 | — |
| YF-S201 | Caudal | YF-S201 | Litros/min | Tipo caudal |

- **SensorNormalizer:** Normaliza valores crudos a escala 0-100.
- **Calibración:** 2 puntos (seco_ref, mojado_ref).
- **Estados:** ok, anomalo, sin_datos.
- **Duplicados:** 409 si sensor+medido_en ya existe.
- **Vigencia:** lectura > 30 min → vencido; clima > 3 h → vencido.

---

## 10. Variables de entorno

```env
APP_NAME=YakuAI
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8082
APP_LOCALE=es
APP_TIMEZONE=America/Lima
APP_UID=1000
APP_GID=1000
API_PORT=8082
FRONTEND_PORT=8081
LOG_CHANNEL=stderr
LOG_LEVEL=debug
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=yakuai
DB_USERNAME=yakuai
DB_PASSWORD=
MYSQL_ROOT_PASSWORD=
SESSION_DRIVER=redis
CACHE_STORE=redis
QUEUE_CONNECTION=redis
REDIS_CLIENT=phpredis
REDIS_HOST=redis
REDIS_PORT=6379
MAIL_MAILER=log
OWM_KEY=            # Solo servidor, nunca repo
OWM_TIMEOUT=15
YAKUAI_MODE=demo    # demo / real
```

**Puertos:** panel `127.0.0.1:8081`, API `127.0.0.1:8082`.

---

## 11. Testing

### Backend
- **Framework:** Pest/PHPUnit (`phpunit.xml`, sqlite in-memory, BCRYPT_ROUNDS=4, DB=:memory:)
- **Test suites:** `Unit` (tests/Unit), `Feature` (tests/Feature)
- **Tests:** 48 tests verdes (Authentication, CatalogPlot, Closing, Example, Ingestion, Irrigation, Motor, ValidationMatrix, Weather)
- **Cobertura:** auth, catálogos, parcelas con scoping, ingesta, clima, motor hidráulico, validación 10/10 casos

### Frontend
- **Linting:** oxlint (`npm run lint`)
- **Build:** `tsc -b && vite build`
- **TypeScript:** strict mode
- 0 errores

### Tests de validación (10 casos demo)
- Endpoint `GET /validation` → `ValidationReport` con `total`, `passed`, `cases[]` (caso, esperado, obtenido, ok, detalle).
- 10/10 casos verificados.

---

## 12. Estado actual del proyecto

### Implementado (F1-F8)
| Feature | Estado | Detalle |
|---|---|---|
| F1 Auth por rol + PIN | ✅ Implementado | Login real verificado, JWT + PIN 4 dígitos |
| F2 CRUD agricultores/parcelas | ✅ Implementado | Wizard 3 pasos, área dibujo |
| F3 Catálogos versionados | ✅ Implementado | 4 cultivos + 16 etapas + 5 suelos seed |
| F4 Sensores + ingesta | ✅ Implementado | CRUD, normalizador, calibración 2 pts, duplicados 409 |
| F5 Clima OWM | ✅ Implementado | Ventana 6 h, fallback demo/owm_fallo |
| F4 Motor | ✅ Implementado | HydroService ET0 Hargreaves + Ra FAO, umbral, espera 6h, rango 50L, idempotencia, 39 tests |
| F5 Evaluar + paneles | ✅ Implementado | Página Evaluar con tarjeta, colores, historial |
| F6 Riegos e historial | ✅ Implementado | Cadena supersede/anulación, alertas, 44 tests |
| F7 Validación curso | ✅ Implementado | Endpoint + página 10/10, 46 tests |
| F8 Cierre y puerta real | ✅ Implementado | Textos WhatsApp + compartir, tipo caudal, docs/ARDUINO.md |
| Auth | ✅ Implementado | 23 tests verdes totales (F1) |

### Pendiente
- **Key OWM:** Da 401 al no tener clave activa. Mitigación: demo con mismo esquema.

### Propuesto (no implementado)
- F6 Motor completo con todas las variantes de lluvia y crítico (parcialmente implementado en HydroService).
- F7 Evaluación inmutable con snapshot (parcialmente).
- F8 WhatsApp/SMS automático real.
- IA predictiva, Penman-Monteith completo, válvulas, mapa→suelo, NPK→litros, multipunto.

---

## 13. Documentación y referencias

| Archivo | Contenido |
|---|---|
| `README.md` | Documento maestro del proyecto (283 líneas) |
| `docs/ARDUINO.md` | Guía Arduino para ingesta |
| `FAO56-Allen1998.pdf` | Referencia FAO-56 |
| `FAO56-Rev1-2025.pdf` | Revisión FAO-56 2025 |
| `Saxton1986-soil-water-characteristics.pdf` | Características suelo |
| `backend/AGENTS.md` | Guidelines Laravel Boost |
| `backend/CLAUDE.md` | Configuración Claude Code |

---

## 14. Roadmap (fases)

```
F0 Entorno y contratos → F1 Catálogos/usuarios/parcelas/mapa → F2 Ingesta → F3 Clima → F4 Motor → F5 Evaluar+paneles → F6 Riegos+historial → F7 Validación curso → F8 Cierre
```

- **F0** bloquea todo (compose, .env.example, contratos, fixtures).
- **F3** (clima) depende de key OWM activa.
- F1-F8 en paralelo donde sea posible (catálogos y mapa, ingesta y clima).

---

## 15. Riesgos y decisiones pendientes

| Riesgo | Mitigación |
|---|---|
| Key OWM inactiva | Demo con mismo esquema |
| YL-69 deriva | Recalibración + capacitivo en real |
| Pronóstico fallido con suelo crítico | Nunca esperar si crítico |
| Celular compartido | PIN por cuenta |

**Pendientes:** Formato PIN (propuesto 4 dígitos), set de 10 casos (propuesto armarlo en F0). Stack Laravel+React y puertos 8080/8081 ya decididos.

---

## 16. Cómo se levanta el proyecto

```bash
# Entorno desarrollo
cd yakuai
docker compose up -d --build          # 5 servicios
docker compose --profile produccion up -d --build  # + scheduler + worker

# Testing backend
cd backend && php artisan test          # 48 tests

# Frontend
cd frontend && npm install && npm run dev   # Vite dev server
npm run build && npm run lint           # Build + oxlint
```

---

> **Última actualización:** 2026-09-27 (contexto del proyecto).
> **Próxima actualización:** Al hacer cambios en funcionalidades, modelos, APIs o arquitectura.
