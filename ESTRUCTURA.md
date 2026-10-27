# Estructura del proyecto YakuAI

Este documento muestra el árbol actual del repositorio y explica dónde vive cada parte del sistema. El inventario incluye código, configuración y documentación del proyecto; no incluye archivos secretos ni contenido generado por instalaciones o ejecuciones.

## Mapa general

- `backend/`: API REST Laravel, lógica de dominio, persistencia, tareas programadas y pruebas.
- `frontend/`: aplicación web React/TypeScript organizada por módulos funcionales.
- `docker/` y `docker-compose*.yml`: imágenes, servidores web y orquestación para desarrollo y producción.
- `docs/`: reglas del motor, operación, integración futura, prototipos y fuentes de consulta.
- `scripts/`: utilidades para preparar y verificar el entorno.
- `.github/workflows/`: automatización de integración continua.

## Árbol de archivos

```text
yakuai/
|-- .cursor
|-- .github
|   \-- workflows
|       \-- ci.yml
|-- backend
|   |-- .claude
|   |   \-- skills
|   |       |-- deploying-to-cloud
|   |       |   |-- reference
|   |       |   |   \-- checklists.md
|   |       |   \-- SKILL.md
|   |       |-- infer-conventions
|   |       |   |-- references
|   |       |   |   \-- checklist.md
|   |       |   \-- SKILL.md
|   |       |-- laravel-best-practices
|   |       |   |-- rules
|   |       |   |   |-- advanced-queries.md
|   |       |   |   |-- architecture.md
|   |       |   |   |-- blade-views.md
|   |       |   |   |-- caching.md
|   |       |   |   |-- collections.md
|   |       |   |   |-- config.md
|   |       |   |   |-- db-performance.md
|   |       |   |   |-- eloquent.md
|   |       |   |   |-- error-handling.md
|   |       |   |   |-- events-notifications.md
|   |       |   |   |-- http-client.md
|   |       |   |   |-- mail.md
|   |       |   |   |-- migrations.md
|   |       |   |   |-- queue-jobs.md
|   |       |   |   |-- routing.md
|   |       |   |   |-- scheduling.md
|   |       |   |   |-- security.md
|   |       |   |   |-- style.md
|   |       |   |   \-- validation.md
|   |       |   \-- SKILL.md
|   |       \-- testing-best-practices
|   |           |-- rules
|   |           |   |-- assertions.md
|   |           |   |-- endpoint-tests.md
|   |           |   |-- finding-features.md
|   |           |   |-- isolation.md
|   |           |   |-- naming.md
|   |           |   |-- performance.md
|   |           |   |-- review.md
|   |           |   |-- security.md
|   |           |   \-- test-data.md
|   |           \-- SKILL.md
|   |-- app
|   |   |-- Concerns
|   |   |   \-- BelongsToFarmer.php
|   |   |-- Console
|   |   |   \-- Commands
|   |   |       |-- AuditoriaMatutina.php
|   |   |       |-- EsperasRevisar.php
|   |   |       |-- PronosticosLimpiar.php
|   |   |       |-- SensoresRevisar.php
|   |   |       \-- SensoresSimular.php
|   |   |-- Http
|   |   |   |-- Controllers
|   |   |   |   |-- AlertController.php
|   |   |   |   |-- AuthController.php
|   |   |   |   |-- Controller.php
|   |   |   |   |-- CropController.php
|   |   |   |   |-- EvaluationController.php
|   |   |   |   |-- FarmerController.php
|   |   |   |   |-- HealthController.php
|   |   |   |   |-- IrrigationController.php
|   |   |   |   |-- MeasurementController.php
|   |   |   |   |-- MetricsController.php
|   |   |   |   |-- PlotController.php
|   |   |   |   |-- SensorController.php
|   |   |   |   |-- SoilTextureController.php
|   |   |   |   |-- UserController.php
|   |   |   |   |-- ValidationController.php
|   |   |   |   \-- WeatherController.php
|   |   |   |-- Middleware
|   |   |   |   |-- EnsureActiveUser.php
|   |   |   |   |-- PreventApiCaching.php
|   |   |   |   \-- RequestCorrelation.php
|   |   |   \-- Requests
|   |   |       |-- Auth
|   |   |       |   \-- LoginRequest.php
|   |   |       |-- FarmerRequest.php
|   |   |       |-- IrrigationRequest.php
|   |   |       |-- MeasurementRequest.php
|   |   |       |-- PlotRequest.php
|   |   |       |-- SensorRequest.php
|   |   |       \-- UserRequest.php
|   |   |-- Jobs
|   |   |   \-- SendWhatsAppMessage.php
|   |   |-- Models
|   |   |   |-- AuditLog.php
|   |   |   |-- Crop.php
|   |   |   |-- CropStage.php
|   |   |   |-- Evaluation.php
|   |   |   |-- Farmer.php
|   |   |   |-- Forecast.php
|   |   |   |-- Irrigation.php
|   |   |   |-- Measurement.php
|   |   |   |-- Plot.php
|   |   |   |-- Sensor.php
|   |   |   |-- SoilTexture.php
|   |   |   \-- User.php
|   |   |-- Providers
|   |   |   \-- AppServiceProvider.php
|   |   \-- Services
|   |       |-- HydroService.php
|   |       |-- MessageService.php
|   |       |-- MetricsService.php
|   |       |-- OwmService.php
|   |       |-- SensorNormalizer.php
|   |       |-- ValidationService.php
|   |       \-- WhatsAppService.php
|   |-- bootstrap
|   |   |-- app.php
|   |   \-- providers.php
|   |-- config
|   |   |-- app.php
|   |   |-- auth.php
|   |   |-- cache.php
|   |   |-- cors.php
|   |   |-- database.php
|   |   |-- filesystems.php
|   |   |-- logging.php
|   |   |-- mail.php
|   |   |-- queue.php
|   |   |-- sanctum.php
|   |   |-- services.php
|   |   \-- session.php
|   |-- database
|   |   |-- factories
|   |   |   \-- UserFactory.php
|   |   |-- migrations
|   |   |   |-- 0001_01_01_000000_create_users_table.php
|   |   |   |-- 0001_01_01_000001_create_cache_table.php
|   |   |   |-- 0001_01_01_000002_create_jobs_table.php
|   |   |   |-- 2026_09_22_031514_create_personal_access_tokens_table.php
|   |   |   |-- 2026_09_22_031859_add_role_pin_active_to_users_table.php
|   |   |   |-- 2026_09_22_032020_create_crops_table.php
|   |   |   |-- 2026_09_22_032021_create_crop_stages_table.php
|   |   |   |-- 2026_09_22_032023_create_soil_textures_table.php
|   |   |   |-- 2026_09_22_032150_create_farmers_table.php
|   |   |   |-- 2026_09_22_032151_create_plots_table.php
|   |   |   |-- 2026_09_22_033053_create_sensors_table.php
|   |   |   |-- 2026_09_22_033054_create_measurements_table.php
|   |   |   |-- 2026_09_22_033553_create_forecasts_table.php
|   |   |   |-- 2026_09_22_034330_add_farmer_id_to_users_table.php
|   |   |   |-- 2026_09_22_035331_create_evaluations_table.php
|   |   |   |-- 2026_09_22_040630_create_irrigations_table.php
|   |   |   |-- 2026_09_28_000000_add_phone_to_users_table.php
|   |   |   |-- 2026_09_28_100000_create_audit_logs_table.php
|   |   |   |-- 2026_09_28_110000_add_backup_code_to_users_table.php
|   |   |   \-- 2026_10_26_000000_add_catalog_source_metadata.php
|   |   |-- seeders
|   |   |   |-- AdminSeeder.php
|   |   |   |-- CatalogSeeder.php
|   |   |   |-- DatabaseSeeder.php
|   |   |   \-- SimulacionSeeder.php
|   |   |-- .gitignore
|   |   \-- database.sqlite
|   |-- public
|   |   |-- .htaccess
|   |   |-- favicon.ico
|   |   |-- index.php
|   |   \-- robots.txt
|   |-- resources
|   |   |-- css
|   |   |-- js
|   |   \-- views
|   |       \-- emails
|   |           \-- pin-recovery.blade.php
|   |-- routes
|   |   |-- api.php
|   |   |-- console.php
|   |   \-- web.php
|   |-- tests
|   |   |-- Feature
|   |   |   |-- AccessMatrixTest.php
|   |   |   |-- ApiCacheHeadersTest.php
|   |   |   |-- AuthenticationTest.php
|   |   |   |-- CatalogPlotTest.php
|   |   |   |-- ClosingTest.php
|   |   |   |-- ExampleTest.php
|   |   |   |-- FarmerScopingTest.php
|   |   |   |-- IngestionTest.php
|   |   |   |-- IrrigationTest.php
|   |   |   |-- MetricsTest.php
|   |   |   |-- MotorTest.php
|   |   |   |-- SensorLatestReadingTest.php
|   |   |   |-- ValidationMatrixTest.php
|   |   |   \-- WeatherTest.php
|   |   |-- Unit
|   |   |   \-- ExampleTest.php
|   |   \-- TestCase.php
|   |-- .editorconfig
|   |-- .env.example
|   |-- .gitattributes
|   |-- .gitignore
|   |-- .mcp.json
|   |-- AGENTS.md
|   |-- artisan
|   |-- boost.json
|   |-- CLAUDE.md
|   |-- composer.json
|   |-- composer.lock
|   |-- phpunit.xml
|   \-- README.md
|-- docker
|   |-- frontend
|   |   |-- Dockerfile
|   |   |-- Dockerfile.production
|   |   \-- nginx.production.conf
|   |-- nginx
|   |   |-- default.conf
|   |   |-- Dockerfile.production
|   |   \-- production.conf
|   \-- php
|       |-- Dockerfile
|       |-- opcache-production.ini
|       \-- zz-yakuai.conf
|-- docs
|   |-- papers
|   |   |-- 01_Architectural-Software-Patterns-IoT.pdf
|   |   |-- 02_Experimental-IoT-Drip-Irrigation.pdf
|   |   |-- 03_Microservices-vs-Monolithic.pdf
|   |   |-- 04_Restful-API-Architecture-Laravel.pdf
|   |   |-- AquaCrop-IoT_Smart-Irrigation-Platform_2025.pdf
|   |   |-- FAO56-Allen1998.pdf
|   |   |-- FAO56-Rev1-2025.pdf
|   |   |-- FarmConnect_React-Agriculture_2025.pdf
|   |   \-- Saxton1986-soil-water-characteristics.pdf
|   |-- prototipos
|   |   |-- evaluar-riego-actual.html
|   |   |-- evaluar-riego-v2.html
|   |   |-- resumen-propuesta.html
|   |   |-- resumen-propuestav2.html
|   |   |-- YakuAI · Panel técnico v4.html
|   |   \-- yakuai-panel-tecnico.html
|   |-- ARDUINO.md
|   |-- despliegue-produccion.md
|   |-- estados.md
|   |-- flujo-backend.md
|   \-- reglas-v1.md
|-- frontend
|   |-- public
|   |   |-- favicon.svg
|   |   |-- icon-192.svg
|   |   |-- icon-512.svg
|   |   \-- sw.js
|   |-- src
|   |   |-- api
|   |   |   |-- client.test.ts
|   |   |   |-- client.ts
|   |   |   |-- endpoints.ts
|   |   |   \-- types.ts
|   |   |-- app
|   |   |   |-- App.test.tsx
|   |   |   |-- App.tsx
|   |   |   |-- auth-context.ts
|   |   |   |-- auth.tsx
|   |   |   |-- AuthBootstrap.test.tsx
|   |   |   \-- navigation.ts
|   |   |-- components
|   |   |   |-- charts
|   |   |   |   |-- AreaChart.tsx
|   |   |   |   |-- BarChart.tsx
|   |   |   |   \-- LineChart.tsx
|   |   |   |-- dashboard
|   |   |   |   |-- overview.test.ts
|   |   |   |   \-- overview.ts
|   |   |   |-- field
|   |   |   |   \-- FieldUI.tsx
|   |   |   |-- forms
|   |   |   |   |-- FormField.test.tsx
|   |   |   |   |-- FormField.tsx
|   |   |   |   |-- FormSection.tsx
|   |   |   |   \-- Wizard.tsx
|   |   |   |-- layout
|   |   |   |   |-- BottomNav.tsx
|   |   |   |   |-- Brand.tsx
|   |   |   |   |-- FarmerShell.tsx
|   |   |   |   |-- NavSidebar.tsx
|   |   |   |   |-- TechShell.tsx
|   |   |   |   \-- Topbar.tsx
|   |   |   |-- sensors
|   |   |   |   |-- SensorOverview.test.ts
|   |   |   |   |-- SensorOverview.tsx
|   |   |   |   \-- sensorValue.ts
|   |   |   |-- shadcn
|   |   |   |   |-- accordion.tsx
|   |   |   |   |-- avatar.tsx
|   |   |   |   |-- badge-utils.ts
|   |   |   |   |-- badge.test.tsx
|   |   |   |   |-- badge.tsx
|   |   |   |   |-- button.tsx
|   |   |   |   |-- card.tsx
|   |   |   |   |-- checkbox.tsx
|   |   |   |   |-- collapsible.tsx
|   |   |   |   |-- confirm.tsx
|   |   |   |   |-- data-table.test.tsx
|   |   |   |   |-- data-table.tsx
|   |   |   |   |-- dialog.tsx
|   |   |   |   |-- dropdown-menu.tsx
|   |   |   |   |-- feedback.tsx
|   |   |   |   |-- filter-tabs.test.tsx
|   |   |   |   |-- filter-tabs.tsx
|   |   |   |   |-- form.tsx
|   |   |   |   |-- input.tsx
|   |   |   |   |-- KPI.tsx
|   |   |   |   |-- label.tsx
|   |   |   |   |-- navigation-menu-variants.ts
|   |   |   |   |-- navigation-menu.tsx
|   |   |   |   |-- page-head.tsx
|   |   |   |   |-- pagination.tsx
|   |   |   |   |-- PaginationControls.tsx
|   |   |   |   |-- plot-map.tsx
|   |   |   |   |-- plot-outline.tsx
|   |   |   |   |-- radio-group.tsx
|   |   |   |   |-- scroll-area.tsx
|   |   |   |   |-- search-input.tsx
|   |   |   |   |-- select.tsx
|   |   |   |   |-- separator.tsx
|   |   |   |   |-- sheet.tsx
|   |   |   |   |-- slider.tsx
|   |   |   |   |-- soil-meter.test.tsx
|   |   |   |   |-- soil-meter.tsx
|   |   |   |   |-- Stat.tsx
|   |   |   |   |-- Stepper.tsx
|   |   |   |   |-- switch.tsx
|   |   |   |   |-- table.tsx
|   |   |   |   |-- tabs.tsx
|   |   |   |   |-- textarea.tsx
|   |   |   |   |-- toast.tsx
|   |   |   |   |-- toaster.tsx
|   |   |   |   |-- tooltip.tsx
|   |   |   |   \-- Wizard.tsx
|   |   |   |-- workspace
|   |   |   |   \-- WorkspaceKit.tsx
|   |   |   |-- AuthLayout.tsx
|   |   |   |-- login-icons.tsx
|   |   |   \-- shadcn.tsx
|   |   |-- design-system
|   |   |   |-- primitives
|   |   |   |   |-- alert.test.tsx
|   |   |   |   |-- alert.tsx
|   |   |   |   |-- badge-variants.ts
|   |   |   |   |-- badge.test.tsx
|   |   |   |   |-- badge.tsx
|   |   |   |   |-- button-variants.ts
|   |   |   |   |-- button.test.tsx
|   |   |   |   |-- button.tsx
|   |   |   |   |-- card.test.tsx
|   |   |   |   |-- card.tsx
|   |   |   |   |-- dialog.test.tsx
|   |   |   |   |-- dialog.tsx
|   |   |   |   |-- empty-state.test.tsx
|   |   |   |   |-- empty-state.tsx
|   |   |   |   |-- field-mode-toggle.test.tsx
|   |   |   |   |-- field-mode-toggle.tsx
|   |   |   |   |-- index.ts
|   |   |   |   |-- input.tsx
|   |   |   |   |-- loading-state.test.tsx
|   |   |   |   |-- loading-state.tsx
|   |   |   |   |-- metric-card.test.tsx
|   |   |   |   |-- metric-card.tsx
|   |   |   |   |-- search-input.test.tsx
|   |   |   |   |-- search-input.tsx
|   |   |   |   |-- sheet.test.tsx
|   |   |   |   \-- sheet.tsx
|   |   |   |-- tokens
|   |   |   |   |-- colors.ts
|   |   |   |   |-- index.ts
|   |   |   |   |-- motion.ts
|   |   |   |   |-- radii.ts
|   |   |   |   |-- shadows.ts
|   |   |   |   |-- spacing.ts
|   |   |   |   |-- targets.ts
|   |   |   |   \-- typography.ts
|   |   |   \-- index.ts
|   |   |-- features
|   |   |   |-- alerts
|   |   |   |   |-- components
|   |   |   |   |   |-- AlertsWorkspace.tsx
|   |   |   |   |   \-- index.ts
|   |   |   |   |-- hooks
|   |   |   |   |   |-- index.ts
|   |   |   |   |   \-- useAlerts.ts
|   |   |   |   |-- copy.ts
|   |   |   |   |-- index.ts
|   |   |   |   \-- utils.ts
|   |   |   |-- auth
|   |   |   |   |-- components
|   |   |   |   |   |-- index.ts
|   |   |   |   |   |-- LoginWorkspace.tsx
|   |   |   |   |   \-- RecoverPinWorkspace.tsx
|   |   |   |   |-- copy.ts
|   |   |   |   |-- index.ts
|   |   |   |   \-- utils.ts
|   |   |   |-- catalogs
|   |   |   |   |-- components
|   |   |   |   |   |-- CatalogsWorkspace.tsx
|   |   |   |   |   \-- index.ts
|   |   |   |   |-- hooks
|   |   |   |   |   |-- index.ts
|   |   |   |   |   \-- useCatalogs.ts
|   |   |   |   |-- copy.ts
|   |   |   |   |-- index.ts
|   |   |   |   \-- utils.ts
|   |   |   |-- dashboard
|   |   |   |   |-- components
|   |   |   |   |   |-- DashboardWorkspace.tsx
|   |   |   |   |   \-- index.ts
|   |   |   |   |-- hooks
|   |   |   |   |   |-- index.ts
|   |   |   |   |   \-- useDashboard.ts
|   |   |   |   |-- copy.ts
|   |   |   |   \-- index.ts
|   |   |   |-- evaluate
|   |   |   |   |-- components
|   |   |   |   |   |-- EvaluationWorkspace.tsx
|   |   |   |   |   |-- EvidenceGrid.test.tsx
|   |   |   |   |   |-- EvidenceGrid.tsx
|   |   |   |   |   |-- HistoryTimeline.test.tsx
|   |   |   |   |   |-- HistoryTimeline.tsx
|   |   |   |   |   |-- index.ts
|   |   |   |   |   |-- IrrigationPlan.test.tsx
|   |   |   |   |   |-- IrrigationPlan.tsx
|   |   |   |   |   |-- PlotSelector.test.tsx
|   |   |   |   |   |-- PlotSelector.tsx
|   |   |   |   |   |-- SoilMoistureMeter.test.tsx
|   |   |   |   |   |-- SoilMoistureMeter.tsx
|   |   |   |   |   |-- VerdictDisplay.test.tsx
|   |   |   |   |   \-- VerdictDisplay.tsx
|   |   |   |   |-- hooks
|   |   |   |   |   |-- index.ts
|   |   |   |   |   |-- useEvaluation.ts
|   |   |   |   |   |-- useHistory.ts
|   |   |   |   |   |-- useIrrigationConfirm.ts
|   |   |   |   |   \-- usePlots.ts
|   |   |   |   |-- copy.ts
|   |   |   |   |-- index.ts
|   |   |   |   \-- utils.ts
|   |   |   |-- farmers
|   |   |   |   |-- components
|   |   |   |   |   |-- FarmersWorkspace.tsx
|   |   |   |   |   \-- index.ts
|   |   |   |   |-- hooks
|   |   |   |   |   |-- index.ts
|   |   |   |   |   \-- useFarmers.ts
|   |   |   |   |-- copy.ts
|   |   |   |   |-- index.ts
|   |   |   |   \-- utils.ts
|   |   |   |-- hoy
|   |   |   |   |-- components
|   |   |   |   |   |-- HoyWorkspace.tsx
|   |   |   |   |   \-- index.ts
|   |   |   |   |-- hooks
|   |   |   |   |   |-- index.ts
|   |   |   |   |   \-- useHoy.ts
|   |   |   |   |-- copy.ts
|   |   |   |   |-- index.ts
|   |   |   |   \-- utils.ts
|   |   |   |-- irrigations
|   |   |   |   |-- components
|   |   |   |   |   |-- index.ts
|   |   |   |   |   |-- IrrigationAnnulDialog.tsx
|   |   |   |   |   |-- IrrigationCorrectDialog.tsx
|   |   |   |   |   |-- IrrigationCreateDialog.tsx
|   |   |   |   |   |-- IrrigationDetail.test.tsx
|   |   |   |   |   |-- IrrigationDetail.tsx
|   |   |   |   |   |-- IrrigationDialogs.test.tsx
|   |   |   |   |   |-- IrrigationFilters.test.tsx
|   |   |   |   |   |-- IrrigationFilters.tsx
|   |   |   |   |   |-- IrrigationHeader.test.tsx
|   |   |   |   |   |-- IrrigationHeader.tsx
|   |   |   |   |   |-- IrrigationLedger.test.tsx
|   |   |   |   |   |-- IrrigationLedger.tsx
|   |   |   |   |   |-- IrrigationSummaryCards.test.tsx
|   |   |   |   |   |-- IrrigationSummaryCards.tsx
|   |   |   |   |   |-- IrrigationsWorkspace.test.tsx
|   |   |   |   |   \-- IrrigationsWorkspace.tsx
|   |   |   |   |-- hooks
|   |   |   |   |   |-- index.ts
|   |   |   |   |   |-- useIrrigationFilters.test.ts
|   |   |   |   |   |-- useIrrigationFilters.ts
|   |   |   |   |   |-- useIrrigationMutations.test.ts
|   |   |   |   |   |-- useIrrigationMutations.ts
|   |   |   |   |   |-- useIrrigations.test.ts
|   |   |   |   |   \-- useIrrigations.ts
|   |   |   |   |-- copy.test.ts
|   |   |   |   |-- copy.ts
|   |   |   |   |-- index.ts
|   |   |   |   |-- utils.test.ts
|   |   |   |   \-- utils.ts
|   |   |   |-- plots
|   |   |   |   |-- components
|   |   |   |   |   |-- index.ts
|   |   |   |   |   \-- PlotsWorkspace.tsx
|   |   |   |   \-- index.ts
|   |   |   |-- sensors
|   |   |   |   |-- components
|   |   |   |   |   |-- index.ts
|   |   |   |   |   \-- SensorsWorkspace.tsx
|   |   |   |   |-- hooks
|   |   |   |   |   |-- index.ts
|   |   |   |   |   \-- useSensors.ts
|   |   |   |   |-- copy.ts
|   |   |   |   |-- index.ts
|   |   |   |   \-- utils.ts
|   |   |   |-- validation
|   |   |   |   |-- components
|   |   |   |   |   |-- index.ts
|   |   |   |   |   \-- ValidationWorkspace.tsx
|   |   |   |   |-- hooks
|   |   |   |   |   |-- index.ts
|   |   |   |   |   \-- useValidation.ts
|   |   |   |   |-- copy.ts
|   |   |   |   |-- index.ts
|   |   |   |   \-- utils.ts
|   |   |   \-- weather
|   |   |       |-- components
|   |   |       |   |-- index.ts
|   |   |       |   \-- WeatherWorkspace.tsx
|   |   |       |-- hooks
|   |   |       |   |-- index.ts
|   |   |       |   \-- useWeather.ts
|   |   |       \-- index.ts
|   |   |-- hooks
|   |   |   |-- useAsync.ts
|   |   |   |-- useCollection.test.ts
|   |   |   |-- useCollection.ts
|   |   |   |-- useDebounce.ts
|   |   |   |-- useFieldMode.test.ts
|   |   |   |-- useFieldMode.ts
|   |   |   \-- useMediaQuery.ts
|   |   |-- lib
|   |   |   |-- dom.ts
|   |   |   |-- format.test.ts
|   |   |   |-- format.ts
|   |   |   |-- geo.test.ts
|   |   |   |-- geo.ts
|   |   |   |-- permissions.test.ts
|   |   |   |-- permissions.ts
|   |   |   |-- theme.ts
|   |   |   |-- toast.ts
|   |   |   \-- utils.ts
|   |   |-- pages
|   |   |   |-- Alerts.test.tsx
|   |   |   |-- Alerts.tsx
|   |   |   |-- Catalogs.test.tsx
|   |   |   |-- Catalogs.tsx
|   |   |   |-- Dashboard.test.tsx
|   |   |   |-- Dashboard.tsx
|   |   |   |-- Evaluate.test.tsx
|   |   |   |-- Evaluate.tsx
|   |   |   |-- Farmers.test.tsx
|   |   |   |-- Farmers.tsx
|   |   |   |-- Hoy.test.tsx
|   |   |   |-- Hoy.tsx
|   |   |   |-- Irrigations.test.tsx
|   |   |   |-- Irrigations.tsx
|   |   |   |-- Login.test.tsx
|   |   |   |-- Login.tsx
|   |   |   |-- Plots.test.tsx
|   |   |   |-- Plots.tsx
|   |   |   |-- RecoverPin.test.tsx
|   |   |   |-- RecoverPin.tsx
|   |   |   |-- Sensors.test.tsx
|   |   |   |-- Sensors.tsx
|   |   |   |-- Validation.test.tsx
|   |   |   |-- Validation.tsx
|   |   |   |-- Weather.test.tsx
|   |   |   \-- Weather.tsx
|   |   |-- styles
|   |   |   |-- auth.css
|   |   |   |-- field-mode.test.ts
|   |   |   |-- globals.css
|   |   |   \-- shells.css
|   |   |-- test
|   |   |   |-- fixtures.ts
|   |   |   \-- setup.ts
|   |   |-- main.tsx
|   |   \-- qa-preview.tsx
|   |-- .dockerignore
|   |-- .gitignore
|   |-- .oxlintrc.json
|   |-- components.json
|   |-- DESIGN_SYSTEM.md
|   |-- index.html
|   |-- package-lock.json
|   |-- package.json
|   |-- qa-preview.html
|   |-- README.md
|   |-- tsconfig.app.json
|   |-- tsconfig.json
|   |-- tsconfig.node.json
|   |-- vite.config.ts
|   \-- vitest.config.ts
|-- scripts
|   |-- check.sh
|   \-- setup.sh
|-- .dockerignore
|-- .env.example
|-- .gitignore
|-- docker-compose.production.yml
|-- docker-compose.yml
|-- ESTRUCTURA.md
|-- README.md
\-- sonar-project.properties
```

## Directorios y archivos omitidos

Para mantener este mapa legible y evitar registrar datos locales, se omiten `.git/`, `.scannerwork/`, `node_modules/`, `vendor/`, `dist/`, `dist-ssr/`, `backend/storage/`, las carpetas `cache/`, los archivos `.env` y las cachés de PHPUnit. Las plantillas de entorno (`.env.example`) sí aparecen en el árbol.

El árbol es una fotografía del repositorio al momento de generar este documento. Si se agregan, mueven o eliminan archivos, actualiza esta sección para reflejar la estructura vigente.

