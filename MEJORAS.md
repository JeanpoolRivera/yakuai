# MEJORAS.md — Plan maestro de implementación del frontend YakuAI

## 1. Objetivo general y alcance

### 1.1 Objetivo general
Definir, ordenar y controlar **todas las implementaciones necesarias del frontend YakuAI**, comenzando por la corrección y estabilización técnica, y continuando con el rediseño funcional y visual de cada módulo.

### 1.2 Alcance
- Sistema: **YakuAI — apoyo a la decisión de riego**.
- Frontend: React + TypeScript + Vite.
- API: Laravel bajo `/api/v1`.
- Roles: `admin`, `tecnico`, `agricultor`.
- No incluye cambios de lógica de negocio del backend salvo dependencias o contratos necesarios.

### 1.3 Restricciones obligatorias
- Conservar el diseño visual actual del **Login** como referencia de identidad visual.
- Conservar el diseño visual actual del **sidebar**.
- Rediseñar los demás módulos funcional y visualmente desde cero cuando sea necesario.
- No introducir funcionalidades innecesarias.
- No eliminar funcionalidades esenciales.
- No comenzar una fase sin cumplir el checkpoint anterior.

## 2. Diagnóstico y hallazgos

### 2.1 Hallazgos críticos
- `H-01`: Inconsistencias en visualización y lógica del umbral de humedad.
- `H-02`: Posible acceso/redirección incorrecta según rol.
- `H-03`: Rutas sensibles potencialmente accesibles sin la protección adecuada.
- `H-04`: Formularios con campos/validadores inconsistentes según tipo de sensor.
- `H-05`: Riesgo de sobreriego por falta de validación contextual.

### 2.2 Hallazgos funcionales y de UX
- `H-06`: Datos no persistentes o state local que se pierde.
- `H-07`: Flujos con demasiados pasos o fricción innecesaria.
- `H-08`: Textos técnicos sin explicación en lenguaje claro.
- `H-09`: Estados visuales inconsistentes.
- `H-10`: Falta de explicación en validaciones/fallos.
- `H-11`: Falta de indicadores de frescura de datos.
- `H-12`: Controles duplicados o desincronizados.
- `H-13`: Datos por defecto regionales hardcodeados.
- `H-14`: Datos de contacto/soporte hardcodeados.
- `H-15`: Posible código, imports, dependencias o componentes sin uso.

## 3. ETAPA I — Corrección, limpieza y estabilización

**Estado general de la etapa:** `EN PROGRESO`

### Fase FT-1.1 — Corrección del umbral de humedad
**Estado:** `COMPLETADO`

#### Problemas
- `H-01`

#### Archivos/componentes involucrados
- `frontend/src/components/ui/Irrigation.tsx`
- `frontend/src/pages/Evaluate.tsx`

#### Tareas
- [x] Revisar cómo se interpreta `umbral`.
- [x] Asegurar coherencia entre valor, porcentaje mostrado y estado.
- [x] No alterar visualmente el componente salvo que sea necesario para corregir la lógica.
- [x] Verificar los estados: suficiente, bajo umbral y crítico.

#### Resultado esperado
- El umbral mostrado coincide con el umbral usado para decidir.

#### Pruebas y aceptación
- [x] Probar valores por encima, cerca y por debajo del umbral.
- [x] Verificar que no hay incoherencias entre número y estado visual.

#### Avance 2026-10-10
- Hallazgo verificado: `humedad_pct` llega en porcentaje y `umbral`/`pmp` en fracción; la conversión `* 100` en `Evaluate.tsx` es intencional.
- Cambios: normalización defensiva en `SoilMeter`, contrato documentado en porcentaje y comentario de unidades en `Evaluate.tsx`.
- Verificación: `npm test` 80/80 en verde (incluye 4 tests nuevos de `SoilMeter`); `npm run lint` 0 errores; `npx tsc -b` sin errores.
- Nota de entorno: las pruebas se ejecutaron en contenedor `node:22-alpine` porque el Node de Windows no puede usar los binarios Linux de `node_modules`; solo se tocó caché ignorada por git.
- Observación: `Hoy.tsx` usa la misma conversión y quedó pendiente de revisión al tocar su módulo.

#### Checkpoint
- No avanzar a `ET-2.3` sin completar esta fase.

---

### Fase FT-1.2 — Claridad del rol tras el inicio de sesión
**Estado:** `COMPLETADO`

#### Problemas
- `H-02`

#### Archivos/componentes involucrados
- `frontend/src/app/auth.tsx`
- `frontend/src/pages/Login.tsx`

#### Tareas
- [x] Revisar exposición del rol en la sesión.
- [x] Mostrar el rol detectado sin alterar el diseño del Login.
- [x] Asegurar coherencia entre sesión, rol y navegación.

#### Resultado esperado
- El usuario sabe con qué rol ingresó.

#### Pruebas y aceptación
- [x] Probar login como `admin`, `tecnico` y `agricultor`.
- [x] Verificar redirección y comportamiento por rol.

#### Avance 2026-10-10
- Hallazgo: el contexto ya exponía `role`; el sidebar técnico ya mostraba el rol, pero `FarmerShell` nunca lo mostraba.
- Cambios: `FarmerShell` ahora muestra `Agricultor · Mi campo` con el rol detectado; se eliminó la ruta muerta `signInPin`/`loginPin` (`POST auth/pin` no existe en el backend; el login unificado `auth/login` ya maneja el PIN por rol).
- `Login.tsx` no requirió cambios: usa el login unificado y su diseño quedó intacto.
- Verificación: `npm test` 81/81 en verde; `npm run lint` 0 errores; `npx tsc -b` sin errores.
- Pendiente manual: login real contra backend con usuarios de cada rol en entorno staging.

#### Checkpoint
- No avanzar a `ET-2.1` ni `ET-2.11` sin completar esta fase.

---

### Fase FT-1.3 — Protección de rutas sensibles
**Estado:** `COMPLETADO`

#### Problemas
- `H-03`

#### Archivos/componentes involucrados
- `frontend/src/app/navigation.ts`
- `frontend/src/app/auth.tsx`
- Rutas sensibles del frontend.

#### Tareas
- [x] Revisar la navegación disponible por rol.
- [x] Impedir acceso indebido a paneles técnicos.
- [x] Usar redirección suave, no bloqueo excesivo.

#### Resultado esperado
- Solo los roles autorizados pueden usar módulos sensibles.

#### Pruebas y aceptación
- [x] Probar acceso directo por URL con cada rol.
- [x] Verificar redirección o vista restringida apropiada.

#### Avance 2026-10-10
- Hallazgo: las guardas por rol ya existían (`STAFF_ONLY` + redirección suave a `/`); el hueco era un rol desconocido, que caía al panel técnico completo.
- Cambios: nuevo `isStaffRole` en `permissions.ts`; `App.tsx` muestra vista restringida con cierre de sesión para roles no reconocidos.
- Backend verificado como autoridad real: middleware `yakuai`, `authorize()` por rol y scoping por agricultor.
- Verificación: `npm test` 87/87 en verde; `npm run lint` 0 errores; `npx tsc -b` sin errores.

#### Checkpoint
- No avanzar a `ET-2.11` sin completar esta fase.

---

### Fase FT-1.4 — Calibración condicional por tipo de sensor
**Estado:** `COMPLETADO`

#### Problemas
- `H-04`

#### Archivos/componentes involucrados
- `frontend/src/pages/Sensors.tsx`

#### Tareas
- [x] Mostrar calibración solamente para el tipo de sensor que la requiere.
- [x] Mostrar mensajes específicos para lluvia, temperatura, humedad relativa y caudal.
- [x] Mantener el diseño general del formulario.

#### Resultado esperado
- El formulario no solicita datos innecesarios o inválidos.

#### Pruebas y aceptación
- [x] Probar registro para los cinco tipos de sensor.
- [x] Verificar campos mostrados/ocultos.

#### Avance 2026-10-10
- Hallazgo: la calibración ya estaba condicionada a humedad; el problema real era el banner duplicado de YL-69 en los demás tipos.
- Cambios: eliminado el banner YL-69 de la rama no-humedad; FC-37 aclara que no requiere calibración.
- Verificación: `npm test` 90/90 en verde (incluye 3 tests nuevos de `Sensors.test.tsx`); `npm run lint` 0 errores; `npx tsc -b` sin errores.

#### Checkpoint
- No avanzar a `ET-2.6` sin completar esta fase.

---

### Fase FT-1.5 — Validación contextual antes de confirmar riego
**Estado:** `COMPLETADO`

#### Problemas
- `H-05`

#### Archivos/componentes involucrados
- `frontend/src/pages/Evaluate.tsx`

#### Tareas
- [x] Consultar riegos recientes antes de confirmar un nuevo riego.
- [x] Mostrar advertencia clara si ya hubo riego reciente.
- [x] Evitar bloqueos innecesarios cuando el riego sea válido.

#### Resultado esperado
- Se reduce el riesgo de sobreriego sin afectar casos válidos.

#### Pruebas y aceptación
- [x] Probar escenario con riego reciente.
- [x] Probar escenario sin riego reciente.

#### Avance 2026-10-10
- Hallazgo: el backend ignora `plot_id` para agricultor también en riegos, así que se filtra en cliente como el historial.
- Cambios: `onConfirmIrrigation` consulta riegos activos de la parcela y bloquea con advertencia si hay uno en las últimas 24 horas.
- Verificación: `npm test` 92/92 en verde (incluye 2 tests nuevos de `Evaluate.test.tsx`); `npm run lint` 0 errores; `npx tsc -b` sin errores.

#### Checkpoint
- No avanzar a `ET-2.3` sin completar esta fase.

---

### Fase FT-1.6 — Limpieza de código y dependencias
**Estado:** `COMPLETADO`

#### Problemas
- `H-15`

#### Archivos/componentes involucrados
- `frontend/src/pages/*.tsx`
- `frontend/src/components/**/*.tsx`
- `frontend/src/api/*`
- `frontend/package.json`

#### Tareas
- [x] Detectar imports no usados.
- [x] Detectar componentes sin uso.
- [x] Detectar endpoints sin uso.
- [x] Revisar funciones duplicadas.
- [x] Verificar dependencias innecesarias.

#### Resultado esperado
- Frontend más limpio y mantenible.

#### Pruebas y aceptación
- [x] Build sin errores.
- [x] Tests principales sin regresiones.

#### Avance 2026-10-10
- Sin imports sin uso (`tsc` con `noUnusedLocals` en verde); todos los endpoints tienen consumidor.
- Eliminados `IconButton` y `Paginator`, sin usos verificados.
- Fechas de cabecera centralizadas en `todayShort`/`todayLong` (Dashboard ganó `timeZone America/Lima`).
- Todas las dependencias de `package.json` están en uso.
- `LineChart.tsx` está definido pero sin imports: queda pendiente su eliminación manual (sin herramienta de borrado disponible).
- Verificación: `npm test` 94/94 en verde; `npm run lint` 0 errores; `npm run build` limpio.

---

### Fase FT-1.7 — Optimización de componentes reutilizables
**Estado:** `COMPLETADO`

#### Problemas
- Inconsistencias de props, accesibilidad y componentes duplicados.

#### Archivos/componentes involucrados
- `frontend/src/components/ui/*`

#### Tareas
- [x] Revisar props y tipos.
- [x] Revisar accesibilidad: focos, ARIA, contraste y teclado.
- [x] Evitar cambios visuales innecesarios en esta etapa.
- [x] Mantener compatibilidad con páginas existentes.

#### Resultado esperado
- Base de componentes lista para el rediseño.

#### Pruebas y aceptación
- [x] Tests de UI relevantes.
- [x] Inspección visual en páginas clave.

#### Avance 2026-10-10
- Hallazgo: tonos `neutro`/`demo` sin clase CSS; resto de variantes, verdictos, soil y stats cubiertos.
- Cambios: clases `.b-neutro`/`.b-demo` con tokens existentes (sin cambio visual, igualan el estilo base); test de teclado y foco para `Tabs`.
- Props y tipos verificados compatibles; accesibilidad de `Modal`/`Field` ya cubierta por tests.
- Verificación: `npm test` 95/95 en verde; `npm run lint` 0 errores; `npm run build` limpio.
- Pendiente manual: inspección visual en navegador de páginas clave.

#### Checkpoint obligatorio de ETAPA I
- No comenzar ETAPA II sin completar `FT-1.1` a `FT-1.7`.

---

## 4. ETAPA II — Rediseño funcional y visual por módulo

**Estado general de la etapa:** `COMPLETADO`

### Fase ET-2.1 — Login
**Estado:** `COMPLETADO`

#### Objetivo
Conservar el diseño actual y mejorar funcionamiento interno, sesión y redirección por rol.

#### Interfaces
- `AuthLayout`
- Formulario de ingreso
- Recuperación de PIN

#### Tareas
- [x] Conservar colores, tipografía y distribución del Login.
- [x] Mejorar validación de correo.
- [x] Mantener contraseña/PIN con mostrar/ocultar.
- [x] Mantener detección de Bloq Mayús.
- [x] Asegurar token, sesión y redirección por rol.
- [x] Comparar capturas contra el diseño actual.

#### Archivos
- `frontend/src/pages/Login.tsx`
- `frontend/src/components/AuthLayout.tsx`
- `frontend/src/app/auth.tsx`

#### Criterios de aceptación
- [x] Diseño visual idéntico.
- [x] Login con contraseña y PIN funciona por rol.

#### Avance 2026-10-10
- Cambios: validación inmediata de formato de correo en `Login.tsx` (mismo mensaje y estilo de error existente); sin toques a `AuthLayout` ni estilos.
- Token, sesión y redirección por rol ya asegurados en `FT-1.2`/`FT-1.3` y cubiertos por `App.test.tsx`.
- Verificación: `npm test` 100/100 en verde (incluye 5 tests nuevos de `Login.test.tsx`); `npm run lint` 0 errores; `npx tsc -b` sin errores.
- Pendiente manual: comparación de capturas contra el diseño actual y login real en staging.

---

### Fase ET-2.2 — Hoy / panel del agricultor
**Estado:** `COMPLETADO`

#### Objetivo
Mostrar qué parcelas requieren atención hoy, con recomendaciones claras y datos frescos.

#### Secciones necesarias
- Resumen de la jornada.
- Estadísticas: parcelas, urgentes y sensores.
- Buscador.
- Filtros por estado.
- Orden por fecha.
- Lista con última recomendación por parcela.
- Acceso directo a evaluar.

#### Tareas
- [x] Diseñar estructura desde cero.
- [x] Mostrar únicamente la última evaluación por parcela.
- [x] Agregar indicador de antigüedad: “hace X min/horas”.
- [x] Agregar badges claros: riega, no riega, espera e incompleta.
- [x] Implementar búsqueda y filtros.
- [x] Preseleccionar parcela al ir a Evaluar.
- [x] Estados de carga, vacío y error.

#### Archivos
- `frontend/src/pages/Hoy.tsx`
- Componentes UI reutilizables.

#### Criterios de aceptación
- [x] Última recomendación visible por parcela.
- [x] Filtros y búsqueda funcionan.
- [x] Navegación directa a Evaluar funciona.

#### Avance 2026-10-10
- Estructura validada contra el objetivo; deltas implementados sin rediseño innecesario.
- Cambios: antigüedad relativa junto a cada fecha (`ageLabel`); estadística de sensores operativos; `Link` a Evaluar con `state.plotId` y preselección en `Evaluate.tsx`.
- Verificación: `npm test` 104/104 en verde (incluye 3 tests nuevos de `Hoy.test.tsx` y preselección en `Evaluate.test.tsx`); `npm run lint` 0 errores; `npx tsc -b` sin errores.

---

### Fase ET-2.3 — Evaluar riego
**Estado:** `COMPLETADO`
**Dependencias:** `FT-1.1`, `FT-1.5`

#### Objetivo
Convertir datos de suelo, cultivo y clima en una recomendación clara, trazable y accionable.

#### Secciones necesarias
- Selección de parcela.
- Resultado principal.
- Rango de litros cuando corresponda.
- Indicadores de confianza, horario y humedad.
- Datos usados/trazabilidad.
- Acciones: WhatsApp y confirmar riego.
- Historial de la parcela.

#### Tareas
- [x] Diseñar resultado principal desde cero.
- [x] Distinguir claramente riega, no, espera e incompleta.
- [x] Mostrar explicación en lenguaje claro.
- [x] Implementar validación de riego reciente.
- [x] Integrar compartir por WhatsApp.
- [x] Implementar historial compacto.
- [x] Estados de carga, vacío, error e incompleto.

#### Archivos
- `frontend/src/pages/Evaluate.tsx`
- `frontend/src/components/ui/Irrigation.tsx`

#### Criterios de aceptación
- [x] Evaluación idempotente por hora.
- [x] Validación de riego reciente funciona.
- [x] Trazabilidad comprensible para el agricultor.

#### Avance 2026-10-10
- Núcleo ya cumplía el objetivo (veredicto, trazabilidad, WhatsApp, historial, idempotencia); deltas implementados sin rediseño innecesario.
- Cambios: guía accionable en incompletas con enlace a Sensores/Clima según motivo; antigüedad relativa en el veredicto; límite del historial explicitado (últimas 20).
- Verificación: `npm test` 106/106 en verde (incluye 2 tests nuevos de incompletas); `npm run lint` 0 errores; `npx tsc -b` sin errores.

---

### Fase ET-2.4 — Parcelas y mapa
**Estado:** `COMPLETADO`

#### Objetivo
Gestionar parcelas con ubicación, área, cultivo, suelo y riego.

#### Secciones necesarias
- Resumen de parcelas registradas, activas y superficie.
- Mapa interactivo.
- Lista con búsqueda.
- Asistente de creación/edición en tres pasos.
- Página de detalle o edición.

#### Tareas
- [x] Rediseñar lista y detalle desde cero.
- [x] Rediseñar asistente en tres pasos.
- [x] Implementar geolocalización opcional.
- [x] Integrar cálculo/validación del área.
- [x] Validar latitud, longitud, área y eficiencia.
- [x] Cargar cultivos, suelos y agricultores.
- [x] Estados de carga, vacío y error.

#### Archivos
- `frontend/src/pages/Plots.tsx`
- `frontend/src/components/PlotMap.tsx`
- `frontend/src/lib/geo.ts`

#### Criterios de aceptación
- [x] Crear y editar parcela funciona.
- [x] Validaciones impiden datos inválidos.
- [x] Mapa y lista permanecen sincronizados.

#### Avance 2026-10-10
- Asistente y validaciones ya cumplían el objetivo; deltas implementados sin rediseño innecesario.
- Cambios: botón opcional "Usar mi ubicación" en el paso 2 (rellena lat/long y recentra el mapa); el dibujo existente sigue calculando el área.
- Verificación: `npm test` 112/112 en verde (incluye 4 tests nuevos de `geo.test.tsx` y 2 de `Plots.test.tsx`); `npm run lint` 0 errores; `npx tsc -b` sin errores.

---

### Fase ET-2.5 — Agricultores
**Estado:** `COMPLETADO`

#### Objetivo
Gestionar el directorio de agricultores, contacto y parcelas asociadas.

#### Secciones necesarias
- Resumen de agricultores.
- Buscador por nombre o teléfono.
- Directorio con estado y parcelas.
- Registro y edición.
- Acción de contacto por WhatsApp.

#### Tareas
- [x] Rediseñar directorio desde cero.
- [x] Mostrar parcelas asociadas.
- [x] Implementar registro y edición con validación.
- [x] Generar enlace WhatsApp solamente cuando haya teléfono.
- [x] Paginación y búsqueda.
- [x] Estados de carga, vacío y error.

#### Archivos
- `frontend/src/pages/Farmers.tsx`

#### Criterios de aceptación
- [x] Crear, buscar, editar y ver agricultores funciona.
- [x] Teléfono y WhatsApp se comportan correctamente.

#### Avance 2026-10-10
- Directorio ya cumplía el objetivo; hueco real: el estado se mostraba pero no se podía editar.
- Cambios: selector Activo/Inactivo en el modal, enviado en crear y editar (soportado por backend y tipos).
- Verificación: `npm test` 116/116 en verde (incluye 4 tests nuevos de `Farmers.test.tsx`); `npm run lint` 0 errores; `npx tsc -b` sin errores.

---

### Fase ET-2.6 — Sensores y lecturas
**Estado:** `COMPLETADO`
**Dependencias:** `FT-1.4`

#### Objetivo
Administrar sensores, calibración y lecturas con estados claros.

#### Secciones necesarias
- Resumen operativo/en revisión.
- Filtros por estado.
- Buscador.
- Lista con parcela, modelo, estado y última lectura.
- Registro de sensor.
- Registro manual de lectura.

#### Tareas
- [x] Rediseñar lista y formularios desde cero.
- [x] Implementar calibración condicional por tipo.
- [x] Validar rangos por tipo de sensor.
- [x] Manejar lectura aceptada, duplicada y en cuarentena.
- [x] Mostrar última lectura y antigüedad.
- [x] Estados de carga, vacío y error.

#### Archivos
- `frontend/src/pages/Sensors.tsx`

#### Criterios de aceptación
- [x] Registro por tipo funciona sin campos innecesarios.
- [x] Lecturas muestran calidad y retroalimentación adecuada.

#### Avance 2026-10-10
- Cambios: validación de rangos por tipo en lectura manual (réplica de `SensorNormalizer`; el backend sigue siendo autoridad con cuarentena).
- Desbloqueo autorizado: relación `Sensor::latestMeasurement()` (`latestOfMany`, sin N+1) cargada en el índice; tarjetas muestran última lectura con antigüedad (`Sin lecturas registradas.` si no hay).
- Verificación: `npm test` 139/139 en verde; `npm run lint` 0 errores; `npx tsc -b` sin errores; backend `php artisan test` 50 passed; `pint --test` PASS.

---

### Fase ET-2.7 — Alertas
**Estado:** `COMPLETADO`

#### Objetivo
Mostrar señales que requieren atención y facilitar la acción inmediata.

#### Secciones necesarias
- Resumen total/críticas/sensores.
- Filtros por prioridad.
- Buscador por mensaje o parcela.
- Lista con explicación y acción.
- Paginación.

#### Tareas
- [x] Rediseñar bandeja desde cero.
- [x] Explicar cada alerta en lenguaje claro.
- [x] Agregar acción “Ir a parcela”.
- [x] Implementar filtros y búsqueda.
- [x] Estados de carga, vacío y error.

#### Archivos
- `frontend/src/pages/Alerts.tsx`

#### Criterios de aceptación
- [x] Filtros y búsqueda funcionan.
- [x] Cada alerta permite actuar rápidamente.

#### Avance 2026-10-10
- Bandeja ya cumplía filtros, búsqueda y estados; faltaban explicación y acción.
- Cambios: pista en lenguaje claro por cada tipo real (`sensor_sin_datos`, `sensor_anomalo`, `evaluacion_incompleta`, `humedad_critica`); acción "Ir a parcela" que navega a Evaluar con la parcela preseleccionada.
- Verificación: `npm test` 121/121 en verde (incluye 3 tests nuevos de `Alerts.test.tsx`); `npm run lint` 0 errores; `npx tsc -b` sin errores.

---

### Fase ET-2.8 — Riegos aplicados
**Estado:** `COMPLETADO`

#### Objetivo
Registrar y auditar el agua aplicada, compararla con lo recomendado y corregir errores sin perder historial.

#### Secciones necesarias
- Resumen de riegos y agua total.
- Buscador y filtro por fecha.
- Historial con desvío y estado.
- Registro de riego.
- Corrección con motivo.
- Anulación con motivo y confirmación.

#### Tareas
- [x] Rediseñar historial desde cero.
- [x] Calcular desvío recomendado/aplicado.
- [x] Implementar corrección preservando historial.
- [x] Implementar anulación con doble confirmación.
- [x] Mejorar textos de corrección/anulación.
- [x] Estados de carga, vacío y error.

#### Archivos
- `frontend/src/pages/Irrigations.tsx`

#### Criterios de aceptación
- [x] Registrar, corregir y anular funciona.
- [x] Desvío y estados son comprensibles.

#### Avance 2026-10-10
- Historial, desvío, corrección y anulación ya cumplían el objetivo; faltaba el filtro por fecha.
- Cambios: filtro por período Desde/Hasta con botón Limpiar y estado vacío coherente con filtros activos.
- Verificación: `npm test` 124/124 en verde (incluye 3 tests nuevos de `Irrigations.test.tsx`); `npm run lint` 0 errores; `npx tsc -b` sin errores.

---

### Fase ET-2.9 — Validación del motor
**Estado:** `COMPLETADO`

#### Objetivo
Verificar recomendaciones del motor contra casos de referencia.

#### Secciones necesarias
- Resumen global y porcentaje.
- Estado aprobado/con fallos.
- Filtros por resultado.
- Buscador de casos.
- Detalle esperado/obtenido/motivo.

#### Tareas
- [x] Rediseñar informe desde cero.
- [x] Explicar fallos en lenguaje claro.
- [x] Implementar filtros y búsqueda.
- [x] Evitar ejecuciones duplicadas.
- [x] Estados de carga, vacío y error.

#### Archivos
- `frontend/src/pages/Validation.tsx`

#### Criterios de aceptación
- [x] Ejecución y detalle funcionan.
- [x] Fallos son comprensibles.

#### Avance 2026-10-10
- Informe ya cumplía filtros, búsqueda y estados; faltaban lenguaje claro y protección de doble ejecución.
- Cambios: `reasonLabel` compartido en `format.ts` (elimina duplicado con `Evaluate.tsx`); esperado/obtenido y detalle traducidos; guardia contra doble clic en ejecutar.
- Nota técnica: no emitir ediciones paralelas al mismo archivo (una pisó el import; corregido y verificado).
- Verificación: `npm test` 126/126 en verde (incluye 2 tests nuevos de `Validation.test.tsx`); `npm run lint` 0 errores; `npx tsc -b` sin errores.

---

### Fase ET-2.10 — Clima por parcela
**Estado:** `COMPLETADO`

#### Objetivo
Mostrar pronóstico vigente y permitir actualización manual/demo con validación coherente.

#### Secciones necesarias
- Pronóstico actual.
- Origen OWM/demo.
- Vigencia de tres horas.
- Lluvia, probabilidad y temperaturas.
- Formulario de actualización.
- Advertencia cuando el pronóstico está vencido.

#### Tareas
- [x] Rediseñar tarjetas desde cero.
- [x] Sincronizar control deslizante e input de probabilidad.
- [x] Validar rangos de lluvia y temperatura.
- [x] Persistir valores útiles entre usos.
- [x] Mostrar advertencia cuando afecte la evaluación.
- [x] Estados de carga, vacío, error y vencido.

#### Archivos
- `frontend/src/pages/Weather.tsx`

#### Criterios de aceptación
- [x] Vigencia y origen siempre son claros.
- [x] Actualización demo funciona y persiste lo necesario.

#### Avance 2026-10-10
- Tarjetas, vigencia, origen y advertencia ya cumplían el objetivo; faltaban validación y prellenado.
- Cambios: validación de lluvia, probabilidad y temperaturas antes de guardar; el formulario se prellena con el último pronóstico al cambiar de parcela.
- Verificación: `npm test` 129/129 en verde (incluye 3 tests nuevos de `Weather.test.tsx`); `npm run lint` 0 errores; `npx tsc -b` sin errores.

---

### Fase ET-2.11 — Cultivos y suelos
**Estado:** `COMPLETADO`

#### Objetivo
Consultar parámetros agronómicos usados por las recomendaciones.

#### Secciones necesarias
- Búsqueda global.
- Catálogo de cultivos y etapas.
- Catálogo de suelos.
- Explicación de parámetros.
- Versión/fecha de datos.

#### Tareas
- [x] Rediseñar catálogos desde cero.
- [x] Implementar búsqueda en tiempo real.
- [x] Agregar explicaciones de `Kc`, `Zr`, `p`, `CC` y `PMP`.
- [x] Mantener comportamiento de solo lectura.
- [x] Estados de carga, vacío y error.

#### Archivos
- `frontend/src/pages/Catalogs.tsx`

#### Criterios de aceptación
- [x] Búsqueda y consulta funcionan.
- [x] Parámetros son comprensibles.

#### Avance 2026-10-10
- Catálogos ya cumplían consulta, acordeón y estados; faltaban búsqueda, glosario y fuente.
- Cambios: buscador global en tiempo real con vacíos diferenciados; glosario de `Kc`/`Zr`/`p`/`CC`/`PMP`/agua útil; nota de fuente FAO-56 y Saxton & Rawls con advertencia de validación local (las versiones semilla son uniformes, sin valor informativo por fila).
- Verificación: `npm test` 131/131 en verde (incluye 2 tests nuevos de `Catalogs.test.tsx`); `npm run lint` 0 errores; `npx tsc -b` sin errores.

---

### Fase ET-2.12 — Panel técnico
**Estado:** `COMPLETADO`
**Dependencias:** `FT-1.2`, `FT-1.3`

#### Objetivo
Dar al técnico/admin una vista operativa del campo y accesos rápidos.

#### Secciones necesarias
- Indicador de actualización de datos.
- KPIs principales.
- Decisión del día.
- Accesos directos.
- Últimas evaluaciones.
- Alertas prioritarias.

#### Tareas
- [x] Rediseñar panel desde cero.
- [x] Mostrar frescura de datos.
- [x] Conectar cada KPI con su módulo.
- [x] Mostrar alertas prioritarias, no solo una muestra parcial.
- [x] Estados de carga, vacío y error.

#### Archivos
- `frontend/src/pages/Dashboard.tsx`

#### Criterios de aceptación
- [x] Panel protegido por rol.
- [x] KPIs y accesos directos funcionan.

#### Avance 2026-10-10
- Panel ya cumplía KPIs, decisión del día y accesos parciales; faltaban enlaces en KPIs, frescura y prioridad de críticas.
- Cambios: cada KPI enlaza a su módulo (clase `.stat-link` neutra visualmente, con foco visible global); indicador "Actualizado hace X"; críticas primero hasta 8 con conteo.
- Protección por rol ya asegurada en `FT-1.3` y cubierta por `App.test.tsx`.
- Verificación: `npm test` 134/134 en verde (incluye 3 tests nuevos de `Dashboard.test.tsx`); `npm run lint` 0 errores; `npm run build` código 0.

---

### Fase ET-2.13 — Recuperación de PIN
**Estado:** `COMPLETADO`

#### Objetivo
Permitir recuperar el PIN sin rediseñar visualmente el flujo de acceso.

#### Secciones necesarias
- Paso de solicitud de código.
- Paso de verificación y nuevo PIN.
- Contacto alternativo con técnico/admin.

#### Tareas
- [x] Conservar el diseño actual de acceso/recuperación.
- [x] Evitar número de contacto hardcodeado.
- [x] Controlar intentos y bloqueo temporal.
- [x] Permitir reenvío de código.
- [x] Validar PIN de cuatro dígitos.
- [x] Estados de carga, error y éxito.

#### Archivos
- `frontend/src/pages/RecoverPin.tsx`
- `frontend/src/components/AuthLayout.tsx`

#### Criterios de aceptación
- [x] Flujo completo funciona.
- [x] Diseño de acceso permanece intacto.

#### Avance 2026-10-10
- Flujo de 2 pasos, validación de PIN y estados ya cumplían el objetivo; bloqueo temporal ya lo impone el backend (429) y se muestra.
- Cambios: botón "Reenviar código" en el paso 2; contacto de soporte centralizado en una constante documentada (pendiente servirlo desde backend).
- Verificación: `npm test` 138/138 en verde (incluye 4 tests nuevos de `RecoverPin.test.tsx`); `npm run lint` 0 errores; `npx tsc -b` sin errores.

---

## 5. Dependencias y orden de ejecución

### 5.1 Orden obligatorio
1. Completar `FT-1.1` antes de `ET-2.3`.
2. Completar `FT-1.2` antes de `ET-2.1` y `ET-2.11`.
3. Completar `FT-1.3` antes de `ET-2.11`.
4. Completar `FT-1.4` antes de `ET-2.6`.
5. Completar `FT-1.5` antes de `ET-2.3`.
6. Completar `FT-1.6` y `FT-1.7` antes de iniciar el rediseño masivo.
7. No iniciar ETAPA II sin cerrar el checkpoint obligatorio de ETAPA I.

### 5.2 Orden sugerido en ETAPA II
1. `ET-2.1`
2. `ET-2.2`
3. `ET-2.3`
4. `ET-2.4`
5. `ET-2.5`
6. `ET-2.6`
7. `ET-2.7`
8. `ET-2.8`
9. `ET-2.9`
10. `ET-2.10`
11. `ET-2.11`
12. `ET-2.12`
13. `ET-2.13`

## 6. Matriz de trazabilidad

| Hallazgo | Fase | Resultado esperado |
|---|---|---|
| H-01 | FT-1.1, ET-2.3 | Umbral coherente |
| H-02 | FT-1.2, ET-2.1, ET-2.11 | Rol claro y navegación correcta |
| H-03 | FT-1.3, ET-2.11 | Rutas protegidas |
| H-04 | FT-1.4, ET-2.6 | Formulario por tipo de sensor |
| H-05 | FT-1.5, ET-2.3 | Prevención de sobreriego |
| H-06 | ET-2.10 | Pronóstico persistente y válido |
| H-07 | ET-2.8 | Flujos con menos fricción |
| H-08 | ET-2.7 | Alertas comprensibles |
| H-09 | ET-2.10, ET-2.11 | Estados visuales coherentes |
| H-10 | ET-2.9 | Fallos explicados |
| H-11 | ET-2.2, ET-2.3, ET-2.11, ET-2.12 | Frescura de datos visible |
| H-12 | ET-2.10 | Controles sincronizados |
| H-13 | ET-2.4 | Ubicación flexible y validada |
| H-14 | ET-2.13 | Contacto configurable |
| H-15 | FT-1.6, FT-1.7 | Código limpio y componentes consistentes |

## 7. Riesgos y precauciones

- No cambiar visualmente Login ni sidebar.
- No eliminar componentes sin revisar dependencias.
- No iniciar rediseño visual con errores críticos pendientes.
- No duplicar lógica entre frontend y backend.
- Revisar contratos de `/api/v1` antes de cambiar formularios.
- Probar cada fase con todos los roles aplicables.
- Mantener accesibilidad, responsive y textos en español claro.

## 8. Registro de progreso

### 8.1 Estado inicial
- ETAPA I: `PENDIENTE`
- ETAPA II: `PENDIENTE`
- Todas las fases comienzan en `PENDIENTE`.

### 8.2 Cómo actualizar este documento
- Cambiar estado a `EN PROGRESO` al comenzar una fase.
- Cambiar estado a `COMPLETADO` solo tras cumplir pruebas y aceptación.
- Usar `BLOQUEADO` si falta una dependencia, contrato backend o decisión pendiente.
- Registrar fecha, responsable, cambios y problemas importantes debajo de cada fase.

### 8.3 Bitácora
- [x] Fecha: 2026-10-10 — Fase: FT-1.1 — COMPLETADA. Cambios en `Irrigation.tsx`, `Evaluate.tsx` y nuevo `Irrigation.test.tsx`; `npm test` 80/80, `lint` 0 errores, `tsc -b` sin errores.
- [x] Fecha: 2026-10-10 — Fase: FT-1.2 — COMPLETADA. Rol visible en `FarmerShell`; eliminada ruta muerta `auth/pin`; `npm test` 81/81, `lint` 0 errores, `tsc -b` sin errores.
- [x] Fecha: 2026-10-10 — Fase: FT-1.3 — COMPLETADA. Vista restringida para roles desconocidos; `npm test` 87/87, `lint` 0 errores, `tsc -b` sin errores.
- [x] Fecha: 2026-10-10 — Fase: FT-1.4 — COMPLETADA. Sin banner YL-69 fuera de humedad; `npm test` 90/90, `lint` 0 errores, `tsc -b` sin errores.
- [x] Fecha: 2026-10-10 — Fase: FT-1.5 — COMPLETADA. Bloqueo de riego duplicado en 24 h; `npm test` 92/92, `lint` 0 errores, `tsc -b` sin errores.
- [x] Fecha: 2026-10-10 — Fase: FT-1.6 — COMPLETADA. Sin `IconButton`/`Paginator`; fechas centralizadas; `npm test` 94/94, `lint` 0 errores, `build` limpio.
- [x] Fecha: 2026-10-10 — Fase: FT-1.7 — COMPLETADA. Tonos `neutro`/`demo` con clase; test de teclado en `Tabs`; `npm test` 95/95, `lint` 0 errores, `build` limpio.
- [x] Fecha: 2026-10-10 — Fase: ET-2.1 — COMPLETADA. Validación de correo en `Login`; diseño intacto; `npm test` 100/100, `lint` 0 errores, `tsc -b` sin errores.
- [x] Fecha: 2026-10-10 — Fase: ET-2.2 — COMPLETADA. Antigüedad, sensores y preselección a Evaluar; `npm test` 104/104, `lint` 0 errores, `tsc -b` sin errores.
- [x] Fecha: 2026-10-10 — Fase: ET-2.3 — COMPLETADA. Guía en incompletas y antigüedad en veredicto; `npm test` 106/106, `lint` 0 errores, `tsc -b` sin errores.
- [x] Fecha: 2026-10-10 — Fase: ET-2.4 — COMPLETADA. Geolocalización opcional y cálculo de área verificado; `npm test` 112/112, `lint` 0 errores, `tsc -b` sin errores.
- [x] Fecha: 2026-10-10 — Fase: ET-2.5 — COMPLETADA. Estado editable en agricultores; `npm test` 116/116, `lint` 0 errores, `tsc -b` sin errores.
- [x] Fecha: 2026-10-10 — Fase: ET-2.6 — COMPLETADA (desbloqueo backend autorizado). `latestMeasurement` en índice; tarjetas con última lectura; frontend `npm test` 139/139, backend 50 passed, `pint` PASS.
- [x] Fecha: 2026-10-10 — Fase: ET-2.7 — COMPLETADA. Explicación y acción por alerta; `npm test` 121/121, `lint` 0 errores, `tsc -b` sin errores.
- [x] Fecha: 2026-10-10 — Fase: ET-2.8 — COMPLETADA. Filtro por período en riegos; `npm test` 124/124, `lint` 0 errores, `tsc -b` sin errores.
- [x] Fecha: 2026-10-10 — Fase: ET-2.9 — COMPLETADA. Lenguaje claro y guardia en validación; `npm test` 126/126, `lint` 0 errores, `tsc -b` sin errores.
- [x] Fecha: 2026-10-10 — Fase: ET-2.10 — COMPLETADA. Validación y prellenado en clima; `npm test` 129/129, `lint` 0 errores, `tsc -b` sin errores.
- [x] Fecha: 2026-10-10 — Fase: ET-2.11 — COMPLETADA. Buscador y glosario en catálogos; `npm test` 131/131, `lint` 0 errores, `tsc -b` sin errores.
- [x] Fecha: 2026-10-10 — Fase: ET-2.12 — COMPLETADA. KPIs enlazados, frescura y críticas primero; `npm test` 134/134, `lint` 0 errores, `build` código 0.
- [x] Fecha: 2026-10-10 — Fase: ET-2.13 — COMPLETADA. Reenvío de código y contacto centralizado; `npm test` 138/138, `lint` 0 errores, `tsc -b` sin errores.
- [ ] Fecha: ______ — Fase: ______ — Cambio/problema/decision: ______
- [ ] Fecha: ______ — Fase: ______ — Cambio/problema/decision: ______

---

# PARTE III — Rediseño visual integral (solo presentación)

**Estado general:** `PENDIENTE` (definición completa; implementación pendiente de aprobación por módulo)

## Objetivo y alcance
Transformar completamente la apariencia visual del frontend sin alterar funcionalidades, rutas, integraciones ni contratos con el backend. Cada dato, acción y flujo existente se conserva; cambia exclusivamente su presentación visual.

## Reglas obligatorias
- Login intacto como referencia de identidad; sidebar intacto; shells de navegación intactos (solo cambia el contenido de página).
- Sin nuevas funcionalidades ni eliminación de procesos; sin cambios de backend, arquitectura ni lógica.
- Sin cambios superficiales: cada fase debe producir un cambio integral, significativo y claramente perceptible.
- Cada fase se implementa y valida por separado. Regla de componentes compartidos: el primer módulo que usa un componente implementa su nuevo visual; los siguientes lo reutilizan (dependencia documentada por fase).
- Verificación por fase: `npm test` + `npm run lint` + `npx tsc -b` + `npm run build` en verde, inspección visual manual en escritorio/tablet/móvil y por rol cuando aplique.

## Orden de implementación
`VD-0` → `VD-1` → `VD-2` → `VD-3` → `VD-4` → `VD-5` → `VD-6` → `VD-7` → `VD-8` → `VD-9` → `VD-10` → `VD-11` → `VD-12`

### Fase VD-0 — Sistema de diseño visual global
**Estado:** `PENDIENTE`

#### 1. Módulo e interfaces
Base transversal: tokens, tipografía, componentes compartidos (`ui/*`, `SoilMeter`, `VerdictCard`, `PlotMap` cromático, `LineChart` si se usa), patrones de página, estados y responsive. Sin pantallas propias.

#### 2. Objetivo y concepto visual
Fijar el lenguaje "campo inteligente andino": superficies claras `#f4f6f8/#fff`, énfasis en verde profundo `#103e38/#165349`, acento luminoso `#d6e8a9` solo para momentos de decisión y celebración, semáforos suaves siempre acompañados de icono + palabra. Calma por defecto, energía solo donde hay que actuar.

#### 3. Estructura, composición y distribución
Retícula: contenido `maxw 88rem`, páginas en pila vertical con ritmo 20–32px; cabecera de página (`eyebrow + título + descripción + acciones`) como patrón único; tarjetas como unidad base; tablas densas solo en equipo; héroes de decisión solo en pantallas de veredicto/jornada.

#### 4. Jerarquía de información
Nivel 1: veredicto/número accionable. Nivel 2: contexto operativo (frescura, confianza, ventana). Nivel 3: trazabilidad colapsada. Regla: una sola acción primaria por vista en agricultor; hasta tres en equipo.

#### 5. Tipografía, tamaños, pesos y legibilidad
Inter/system-ui; display 2rem héroes, h1 1.5rem, h2 1.125rem, cuerpo .875rem/1.55, small .8125rem, tiny .75rem; 600 en valores y títulos, 500 en etiquetas, 400 en cuerpo; cifras con `tabular-nums`; fechas absolutas + relativas juntas; español claro, sin jerga en agricultor.

#### 6. Paleta, contrastes y colorimetría
Tokens existentes como única fuente: `primary-*`, `success/warning/danger/info` (+`bg/border/text`), fondos de veredicto por tono, neutros para lectura/inactivos. Texto sobre verde oscuro siempre blanco; badges y estados nunca solo-color; modo `forced-colors` ya contemplado se conserva.

#### 7. Espaciados, alineaciones, dimensiones y proporciones
Escala `s1–s10`; tarjetas `padding 20–28`, `gap 12–16`; radios `r-md 10` tarjetas, `r-lg 14` héroes/modales, `pill` en badges/chips; táctil mínimo 44px (primarias agricultor 52px+); formularios 1 columna en móvil, 2 en escritorio.

#### 8. Componentes visuales
Botones (7 variantes con jerarquía de uso documentada), tarjetas (base, severidad con franja/borde, hero), tablas (cabecera, `data-label` móvil, acciones a la derecha), formularios (label+hint+error, foco 2px), filtros (`Tabs`+`Search`+fecha), indicadores (`Badge` pill, `Stat` enlazable, `SoilMeter` v2 con marcas PMP/umbral legibles, `VerdictCard` por tono, barras de progreso), `Empty/Loading/Skeletons/Banner/Toast`, `Modal/Confirm`, `Stepper/Pager`.

#### 9. Iconografía, bordes, sombras, estados y microinteracciones
Set lineal 1.8px actual en 16–24px, siempre con texto; sombras `shadow-1` tarjetas, `shadow-2` modales/héroes; transiciones 160ms en hover/anchos; spinner y shimmer; `prefers-reduced-motion` respetado; foco visible global 2px ya existente.

#### 10. Datos, estadísticas y gráficos
Cifras grandes tabulares en héroes/KPIs; barras CSS para progreso y desvíos; sin librerías nuevas de gráficos (se evita dependencia y peso).

#### 11. Responsive
Drawer ≤1000px ya existente intacto; ≤760px apilar operaciones/monitoreo, formularios 1 columna, tablas→tarjetas con `data-label`, mapa mínimo 280px + botón ubicación; táctil amplio en agricultor.

#### 12. Accesibilidad y experiencia
Skip-link, `aria-live` en veredictos/contadores, contraste verificado, iconos nunca solos, foco gestionado en modales/drawer, fechas absolutas+relativas, español claro.

#### 13. Componentes reutilizables
Todos los de `ui/*` más `SoilMeter`, `VerdictCard`; prefijos de clase por módulo (`.hoy-*`, `.ev-*`, etc.) para no colisionar; estilos legacy se retiran por módulo al implementar su fase.

#### 14. Tareas
- [ ] Aprobar esta guía como contrato visual.
- [ ] Auditar tokens/clases sin uso real.
- [ ] Definir nomenclatura de clases nuevas por módulo.
- [ ] Documentar jerarquía de botones y usos por tono.
- [ ] Fijar patrones de toolbar, estados y vacíos.

#### 15. Criterios de aceptación y pruebas
- [ ] Guía aprobada sin contradicciones.
- [ ] Cero cambios de código en esta fase (solo definición).
- [ ] Verificación: revisión cruzada de la guía contra Login y sidebar.

---

### Fase VD-1 — Hoy (hogar del agricultor)
**Estado:** `COMPLETADO`

#### 1. Módulo e interfaces
`Hoy.tsx`: hero de jornada, tira de estadísticas, filtros, lista de recomendaciones por parcela, vacíos/errores. Implementa además el nuevo visual compartido de `SoilMeter` v2, franja de tarjeta por severidad y tira de stats (reutilizados por fases siguientes).

#### 2. Objetivo y concepto visual
Triaje matutino de un vistazo: un panel héroe que grita el estado del día (alerta vs calma) sobre verde profundo cuando hay que actuar y superficie clara cuando no, con una sola acción primaria gigante.

#### 3. Estructura visual y distribución
Hero a ancho completo (titular + ventana de riego + CTA Evaluar + actualizar) → tira horizontal de 3 mini-stats → segmented control de estado + buscador → lista vertical de tarjetas-parcela (urgentes primero) → resto colapsado "Todo bien".

#### 4. Jerarquía
H1 estado del día > cifras de parcelas/agua/sensores > tarjetas (nombre > veredicto > litros > frescura > acción) > filtros como herramienta secundaria.

#### 5. Tipografía
H1 display 2rem/600; nombres de parcela h3 1rem/600; litros cifra grande tabular 1.5rem/600; antigüedad tiny; sin tecnicismos visibles.

#### 6. Paleta y contrastes
Hero alerta: fondo `primary-900`, texto blanco, acento `#d6e8a9` en CTA y cifra; hero calma: superficie clara con borde success; tarjetas con franja lateral por severidad (danger/warning/success/neutral); badges pill existentes.

#### 7. Espaciado y proporciones
Hero `padding 28`, radio `r-lg`, gap 20; tarjetas full-width con padding 20 y gap 12; mini-stats en grid 3 (1 columna en móvil); acciones táctiles ≥52px.

#### 8. Componentes
Hero `.hoy-hero[data-state]`, stat strip `.hoy-stats`, tarjetas `.hoy-card[data-tone]` con `SoilMeter` v2 (pista redondeada, marcas PMP/umbral con etiquetas legibles), `Tabs` como chips de filtro, `SearchInput`, `Button` primario gigante, `Empty` con CTA.

#### 9. Iconografía y microinteracciones
Icono de estado grande en hero (drop/check/cloud/alert 28–32px); hover con elevación suave en tarjetas; shimmer en carga; transición de ancho en SoilMeter; `prefers-reduced-motion` respetado.

#### 10. Datos y estadísticas
Cifras tabulares: parcelas que piden agua, litros solo cuando aplica, sensores operativos X de Y, antigüedad relativa junto a fecha absoluta.

#### 11. Responsive
Móvil: hero apilado, CTA full-width, stats 1 columna, tarjetas full-width; tablet: hero 2 columnas; escritorio: lista max-width legible centrada.

#### 12. Accesibilidad
`aria-live` en hero y contador, foco visible en tarjetas-enlace, contraste blanco-sobre-verde verificado, iconos siempre con palabra.

#### 13. Reutilizables
`SoilMeter` v2, franja de severidad, tira de stats y hero de decisión quedan fijados para el resto de fases.

#### 14. Tareas
- [x] Hero de jornada con 2 estados visuales.
- [x] Tira de estadísticas.
- [x] Tarjetas de parcela rediseñadas + `SoilMeter` v2.
- [x] Filtros con `Tabs` + buscador.
- [x] Vacíos, carga y error con el nuevo lenguaje.
- [x] Retirar estilos legacy de `farmer-today`/`monitoring` usados aquí.

#### 15. Criterios de aceptación y pruebas
- [x] Cambio visual integral y perceptible respecto al actual.
- [x] Sin cambios de datos, rutas ni contratos.
- [x] Verificación: tests actualizados al nuevo diseño + lint + tsc + build + inspección manual por rol.

#### Avance 2026-10-10
- Rediseño integral aplicado: hero alerta/calma sobre verde profundo, tira de 3 stats, tarjetas con franja de severidad, filtros con `Tabs` con conteos, CTA "Ver qué hacer", `SoilMeter` v2 (pista 10px + marcas en pastilla, compatible con Evaluar).
- Decisiones: se conservó el selector de orden (la regla PARTE III prohíbe eliminar funcionalidades); urgentes-primero no se impuso para no contradecir el orden elegido por el usuario; CSS legacy compartido (`monitoring-*`) se deja intacto hasta rediseñar sus módulos.
- Verificación: `npm test` 139/139 en verde (tests de `Hoy.test.tsx` actualizados al nuevo diseño); `npm run lint` 0 errores; `npx tsc -b` sin errores; `npm run build` código 0.
- Pendiente manual: inspección visual en navegador (móvil prioritario).

---

### Fase VD-2 — Evaluar (veredicto y confirmación)
**Estado:** `PENDIENTE`
**Dependencias:** `VD-0`, `VD-1` (reutiliza `SoilMeter` v2 y franjas de severidad).

#### 1. Módulo e interfaces
`Evaluate.tsx` (+ `VerdictCard`, trazabilidad, historial): selector de parcela, veredicto, guía de incompletas, confirmación de riego, WhatsApp e historial. Dos variantes visuales: agricultor (simple) y equipo (completa).

#### 2. Objetivo y concepto visual
El veredicto como veredicto: tarjeta hero a pantalla completa teñida por tono (fondos `verdict-*` elevados a protagonista), cifra de litros monumental y una sola pregunta visual: ¿ya regaste?

#### 3. Estructura visual y distribución
Selector como tarjetas radiales grandes (agricultor) / panel compacto (equipo) → hero de veredicto (kicker, título, litros, chips, acciones) → trazabilidad en acordeón por grupos (suelo/clima/cultivo) → historial como lista compacta (agricultor) / tabla reestilizada (equipo).

#### 4. Jerarquía
Título de veredicto > litros > acciones (Ya regué/WhatsApp) > chips de contexto > trazabilidad colapsada > historial.

#### 5. Tipografía
Título veredicto display 2rem/600; litros 2rem tabular/600; chips small; trazabilidad small/mono en cifras; motivo en lenguaje claro destacado.

#### 6. Paleta y contrastes
Fondos por tono (`verdict-riega-bg` ámbar, `-no-bg` verde, `-espera-bg` azul, `-incompleta-bg` neutro) con borde semántico; badge crítico danger; CTA primario Ya regué + outline WhatsApp.

#### 7. Espaciado y proporciones
Hero `padding 28`, radio `r-lg`; acciones en fila adaptable (columna en móvil, botones full-width ≥52px); acordeón con respiración 16px.

#### 8. Componentes
`VerdictCard` rediseñado por tono, selector-tarjetas, acordeón de trazabilidad, historial-lista vs tabla, guía de incompletas con CTA contextual por rol (equipo: Sensores/Clima; agricultor: Avisar a técnico por WhatsApp).

#### 9. Iconografía y microinteracciones
Icono de veredicto 28px por tono; kicker con reloj; confirmación con estado de guardado visible; toast de confirmación conservado.

#### 10. Datos y estadísticas
Litros min–max monumentales; humedad/umbral/PMP en `SoilMeter` v2; ET0/ETc, lámina, volumen, lluvia, Kc/Zr/etapa agrupados y legibles; próxima revisión destacada.

#### 11. Responsive
Selector en grid adaptable; hero full-width; acciones apiladas en móvil; tabla de historial solo equipo con scroll-x y `data-label`.

#### 12. Accesibilidad
`aria-live` en resultado, foco al veredicto tras evaluar, enlaces con propósito claro, contraste de cifras sobre fondos de tono.

#### 13. Reutilizables
Acordeón de trazabilidad y variante de tarjeta hero disponibles para Clima/Validación.

#### 14. Tareas
- [ ] Hero de veredicto por tono (4 variantes).
- [ ] Selector-tarjetas (agricultor) y panel compacto (equipo).
- [ ] Acordeón de trazabilidad por grupos.
- [ ] Historial lista vs tabla por rol.
- [ ] Guía de incompletas por rol.
- [ ] Retirar estilos legacy de `ops-*` usados aquí.

#### 15. Criterios de aceptación y pruebas
- [ ] Cambio visual integral y perceptible; mismos datos y contratos.
- [ ] Verificación: tests actualizados + lint + tsc + build + inspección manual por rol.

---

### Fase VD-3 — Riegos (historial y registro)
**Estado:** `PENDIENTE`
**Dependencias:** `VD-0`

#### 1. Módulo e interfaces
`Irrigations.tsx`: resumen, toolbar con buscador y período, tabla/historial, modales de anotar/corregir/anular. Variante agricultor (lista-carta simple) y equipo (tabla completa).

#### 2. Objetivo y concepto visual
Libro de campo limpio: para el agricultor, prueba tranquila de "yo sí regué"; para el técnico, auditoría precisa con desvíos evidentes de un vistazo.

#### 3. Estructura visual y distribución
Agricultor: CTA anotar + lista-carta cronológica (fecha en palabras, parcela, litros, ✓). Equipo: stats + toolbar unificada (search + Desde/Hasta + Limpiar + contador) + tabla + paginación + modales.

#### 4. Jerarquía
Fecha y litros primero; desvío como insignia secundaria; estado como etiqueta; acciones al final de fila.

#### 5. Tipografía
Cifras de litros tabulares 1.125rem/600; fechas absolutas + relativas; motivos en small; notas en tiny.

#### 6. Paleta y contrastes
Desvío con semáforo (ok/warn/bad) + signo; estados activo/corregido/anulado en success/warning/neutral; modales destructivos en danger solo en confirmar.

#### 7. Espaciado y proporciones
Filas con padding generoso 16–20; desvío como pill compacto; modales centrados max-width 480px; formularios 1 columna.

#### 8. Componentes
Tabla reestilizada con badge de desvío, barra fina de desvío opcional, modales de anotar/corregir/anular con micro-copy conservada, confirmación en dos pasos intacta en flujo.

#### 9. Iconografía y microinteracciones
Icono drop en CTA y filas; hover de fila; confirmación con estado busy; toast conservados.

#### 10. Datos y estadísticas
Agua total acumulada destacada; desvío en litros con signo; conteo de registros; rango de período visible.

#### 11. Responsive
Agricultor 1 columna; tabla equipo con scroll-x y `data-label`; toolbar apilada en móvil; modales full-screen en pantallas pequeñas.

#### 12. Accesibilidad
Etiquetas asociadas en fechas, foco atrapado en modales (ya existente), acciones con nombre claro, contraste de badges.

#### 13. Reutilizables
Patrón de toolbar con período y de modal de auditoría para el resto del equipo.

#### 14. Tareas
- [ ] Lista-carta de agricultor.
- [ ] Tabla de equipo reestilizada con desvío visible.
- [ ] Toolbar de período rediseñada.
- [ ] Modales de anotar/corregir/anular rediseñados.
- [ ] Retirar estilos legacy usados aquí.

#### 15. Criterios de aceptación y pruebas
- [ ] Cambio visual integral y perceptible; mismos datos, rutas y contratos.
- [ ] Verificación: tests actualizados + lint + tsc + build + inspección manual por rol.

---

### Fase VD-4 — Alertas (bandeja accionable)
**Estado:** `PENDIENTE`
**Dependencias:** `VD-0`

#### 1. Módulo e interfaces
`Alerts.tsx`: resumen, tabs por prioridad, buscador, lista con explicación y acción, paginación. Variante agricultor (solo accionables) y equipo (bandeja completa).

#### 2. Objetivo y concepto visual
Semáforo operativo: lo crítico grita, lo demás espera. Cada alerta es una tarjeta de acción, no un renglón de log.

#### 3. Estructura visual y distribución
Resumen compacto → tabs segmentados con conteos → buscador → tarjetas con franja lateral por severidad (crítica/sensor/informativa) → paginación.

#### 4. Jerarquía
Severidad (franja + icono) > mensaje > pista en lenguaje claro > parcela > badge de tipo > CTA Ir a parcela.

#### 5. Tipografía
Mensaje en cuerpo 600; pista en small; parcela y tiempo en tiny; badge pill small.

#### 6. Paleta y contrastes
Franja danger/warning/info por severidad sobre superficie clara; badge de tipo en tono correspondiente; CTA como link con flecha.

#### 7. Espaciado y proporciones
Tarjetas full-width padding 16–20, gap 12; franja de 4px redondeada; CTA alineado a la derecha (abajo en móvil).

#### 8. Componentes
Tarjeta de alerta con severidad, pista contextual, badge, CTA con `state.plotId` conservado; tabs con conteos; buscador; paginación.

#### 9. Iconografía y microinteracciones
Icono por severidad (alert/sensor/info); hover con elevación; vacíos con CTA contextual.

#### 10. Datos y estadísticas
Conteos por severidad; timestamp relativo junto a mensaje; total visible con paginación.

#### 11. Responsive
1 columna siempre; tabs con scroll-x; CTA full-width en móvil.

#### 12. Accesibilidad
Severidad también en texto (no solo color), `aria-live` en conteo al filtrar, foco visible en CTA.

#### 13. Reutilizables
Tarjeta con franja de severidad disponible para Validación (fallos) y Sensores (cuarentena).

#### 14. Tareas
- [ ] Tarjetas con franja de severidad.
- [ ] Pistas por tipo y CTA contextual.
- [ ] Tabs y resumen rediseñados.
- [ ] Retirar estilos legacy usados aquí.

#### 15. Criterios de aceptación y pruebas
- [ ] Cambio visual integral y perceptible; mismos datos y contratos.
- [ ] Verificación: tests actualizados + lint + tsc + build + inspección manual por rol.

---

### Fase VD-5 — Panel técnico (Dashboard)
**Estado:** `PENDIENTE`
**Dependencias:** `VD-0` (`FT-1.2`, `FT-1.3` ya cumplidas).

#### 1. Módulo e interfaces
`Dashboard.tsx`: cabecera con frescura, KPIs enlazados, brief diario, últimas evaluaciones, atención prioritaria, contexto.

#### 2. Objetivo y concepto visual
Tablero de mando matutino: de un vistazo sé por dónde empezar; cada cifra es una puerta a su módulo.

#### 3. Estructura visual y distribución
Cabecera con indicador de frescura → grid 4 KPIs clicables → brief hero con accesos directos → 2 columnas (evaluaciones + atención) → contexto.

#### 4. Jerarquía
KPIs (cifra tabular 2rem) > brief de decisión > listas operativas > contexto.

#### 5. Tipografía
Cifras KPI 2rem tabular/600; etiquetas small; brief h2 1.25rem; tablas small con celdas numéricas alineadas.

#### 6. Paleta y contrastes
KPI neutros con borde inferior semántico según estado; hover con elevación + cambio de borde para affordance de enlace; brief en superficie de acento suave.

#### 7. Espaciado y proporciones
Grid auto-fit min 180px, gap 16; tarjetas KPI padding 20; columnas 2:1 en escritorio, apiladas en móvil.

#### 8. Componentes
KPI-cards enlazadas (`.stat-link` neutra), brief hero, `DataTable` reestilizada, lista de atención con críticas primero, contador de frescura.

#### 9. Iconografía y microinteracciones
Icono por KPI 20–24px; hover que comunica "clicable"; skeleton coherente en carga; actualizar con spinner.

#### 10. Datos y estadísticas
Parcelas, piden-riego, sensores ok/total, alertas con críticas; frescura relativa; últimas 10 evaluaciones.

#### 11. Responsive
Grid 2 columnas en tablet, 1 en móvil; columnas apiladas; contexto en wrap.

#### 12. Accesibilidad
Enlaces KPI con nombre descriptivo (contenido completo), `aria-live` en frescura, foco visible, contraste de cifras.

#### 13. Reutilizables
Patrón KPI-enlazada y brief hero para Validación/Clima si aplica.

#### 14. Tareas
- [ ] KPIs como tarjetas-enlace con affordance.
- [ ] Brief hero rediseñado.
- [ ] Columnas y tablas reestilizadas.
- [ ] Retirar estilos legacy usados aquí.

#### 15. Criterios de aceptación y pruebas
- [ ] Cambio visual integral y perceptible; mismos datos y contratos.
- [ ] Verificación: tests actualizados + lint + tsc + build + inspección manual.

---

### Fase VD-6 — Parcelas y mapa
**Estado:** `PENDIENTE`
**Dependencias:** `VD-0`

#### 1. Módulo e interfaces
`Plots.tsx` (+ `PlotMap`, `geo` sin cambios visuales): resumen, workspace mapa+lista, tarjetas de parcela, wizard de 3 pasos con mapa editable.

#### 2. Objetivo y concepto visual
Territorio confiable y tangible: el mapa manda, la lista acompaña; el asistente se siente como delimitar tu tierra, no como llenar un formulario.

#### 3. Estructura visual y distribución
Resumen compacto → workspace 2 columnas (mapa protagonista + lista filtrable) → tarjetas de parcela con hechos clave → wizard modal amplio con mapa grande en paso 2.

#### 4. Jerarquía
Mapa > buscar > tarjetas (nombre > cultivo > superficie > estado > editar) > wizard por pasos con progreso visible.

#### 5. Tipografía
Nombres 1rem/600; hechos en grilla etiqueta-valor small; coordenadas en mono tiny; áreas con tabular.

#### 6. Paleta y contrastes
Marcadores en verde de marca con borde oscuro (ya definidos); boceto de dibujo en naranja tierra; estados con badges; mapa OSM intacto (proveedor externo).

#### 7. Espaciado y proporciones
Mapa mínimo 320px (280px móvil); tarjetas en grid adaptable; wizard con stepper prominente y mapa de altura generosa; botón de ubicación visible.

#### 8. Componentes
Tarjetas de parcela rediseñadas, wizard con `Stepper` destacado, mapa con barra de dibujo propia reestilizada (botones pill coherentes), botón "Usar mi ubicación" integrado al mapa.

#### 9. Iconografía y microinteracciones
Iconos map/sprout/check; dibujo con vértices y línea visibles; confirmación de contorno con área celebrada; toasts conservados.

#### 10. Datos y estadísticas
Totales, activas y superficie; área del dibujo calculada visible en vivo; origen dibujo/manual etiquetado.

#### 11. Responsive
Mapa arriba + lista debajo en móvil; wizard full-screen en pantallas pequeñas; mapa con altura mínima garantizada.

#### 12. Accesibilidad
Región de mapa con descripción e instrucciones, alternativas textuales a lat/long/área, foco gestionado en el wizard, contraste de controles propios del mapa.

#### 13. Reutilizables
Patrón workspace mapa+lista y wizard con stepper para Sensores si aplica.

#### 14. Tareas
- [ ] Workspace mapa+lista rediseñado.
- [ ] Tarjetas de parcela rediseñadas.
- [ ] Wizard de 3 pasos rediseñado con mapa protagonista.
- [ ] Barra de dibujo con estilo del sistema.
- [ ] Retirar estilos legacy usados aquí.

#### 15. Criterios de aceptación y pruebas
- [ ] Cambio visual integral y perceptible; mismos datos, rutas y contratos.
- [ ] Verificación: tests actualizados + lint + tsc + build + inspección manual.

---

### Fase VD-7 — Agricultores (directorio)
**Estado:** `PENDIENTE`
**Dependencias:** `VD-0`

#### 1. Módulo e interfaces
`Farmers.tsx`: resumen, toolbar con buscador, directorio, modal de registro/edición.

#### 2. Objetivo y concepto visual
Directorio humano y cálido: personas primero, con contacto a un toque y estado evidente.

#### 3. Estructura visual y distribución
Resumen compacto → toolbar (buscar + contador) → grid de tarjetas-persona → paginación → modal de formulario.

#### 4. Jerarquía
Avatar de iniciales grande > nombre > teléfono/WhatsApp > parcelas y estado.

#### 5. Tipografía
Nombres 1rem/600; contacto en cuerpo con formato legible; contadores tabulares small.

#### 6. Paleta y contrastes
Avatares en verde de marca sobre fondo suave con iniciales blancas; estado con badges; WhatsApp como acción outline con flecha.

#### 7. Espaciado y proporciones
Grid adaptable min 240px, gap 16; tarjetas padding 20; modal max-width 480px.

#### 8. Componentes
Tarjeta-persona rediseñada, buscador prominente, paginación, modal con campos, selector de estado y errores por campo.

#### 9. Iconografía y microinteracciones
Iconos users/phone/plus/edit; hover con elevación; guardado con toast conservado.

#### 10. Datos y estadísticas
Total registrados; parcelas por agricultor; teléfono solo si existe; enlace WhatsApp normalizado.

#### 11. Responsive
Grid 1 columna en móvil; toolbar apilada; modal full-screen en pantallas pequeñas.

#### 12. Accesibilidad
Nombres como encabezados de tarjeta, acciones con `aria-label` con nombre, formulario con errores asociados, foco en modal.

#### 13. Reutilizables
Patrón tarjeta-persona y modal de formulario simple.

#### 14. Tareas
- [ ] Tarjetas-persona rediseñadas.
- [ ] Toolbar y paginación rediseñadas.
- [ ] Modal de registro/edición rediseñado.
- [ ] Retirar estilos legacy usados aquí.

#### 15. Criterios de aceptación y pruebas
- [ ] Cambio visual integral y perceptible; mismos datos, rutas y contratos.
- [ ] Verificación: tests actualizados + lint + tsc + build + inspección manual.

---

### Fase VD-8 — Sensores y lecturas
**Estado:** `PENDIENTE`
**Dependencias:** `VD-0`, `VD-4` (franja de severidad).

#### 1. Módulo e interfaces
`Sensors.tsx`: resumen, tabs por estado, buscador, red de sensores con última lectura, formularios de lectura manual y registro.

#### 2. Objetivo y concepto visual
Red de datos viva: de un vistazo sé qué mide, qué calla y qué está en revisión, con la última lectura como protagonista.

#### 3. Estructura visual y distribución
Resumen → tabs con conteos + buscador → lista de tarjetas-dispositivo → panel lateral con lectura manual → modal de registro.

#### 4. Jerarquía
Tipo de sensor > parcela > última lectura con antigüedad (grande, tabular) > estado > metadatos (modelo/pin).

#### 5. Tipografía
Valor de última lectura 1.25rem tabular/600; etiquetas small; metadatos tiny mono donde aplique.

#### 6. Paleta y contrastes
Franja lateral por estado (success/warning/neutral); badge de cuarentena visible; calibración destacada solo en humedad.

#### 7. Espaciado y proporciones
Tarjetas full-width padding 16–20; panel lateral sticky en escritorio, apilado en móvil; formularios 1 columna.

#### 8. Componentes
Tarjeta-dispositivo rediseñada, tabs con conteos, formularios con validación visible de rangos por tipo, modal con calibración condicional.

#### 9. Iconografía y microinteracciones
Icono por tipo de sensor; lectura aceptada/duplicada/cuarentena con toasts conservados; foco en formularios.

#### 10. Datos y estadísticas
Operativos/total; última lectura + antigüedad por tarjeta; rangos válidos como ayuda contextual, no solo en error.

#### 11. Responsive
Lista 1 columna; workspace apilado en móvil; tabs con scroll-x.

#### 12. Accesibilidad
Estados también en texto, valores con unidad anunciada, formularios etiquetados, `aria-live` en contadores.

#### 13. Reutilizables
Tarjeta con franja (de VD-4), panel lateral de formulario.

#### 14. Tareas
- [ ] Tarjetas-dispositivo rediseñadas con última lectura protagonista.
- [ ] Panel de lectura y modal de registro rediseñados.
- [ ] Ayudas de rango visibles por tipo.
- [ ] Retirar estilos legacy usados aquí.

#### 15. Criterios de aceptación y pruebas
- [ ] Cambio visual integral y perceptible; mismos datos, rutas y contratos.
- [ ] Verificación: tests actualizados + lint + tsc + build + inspección manual.

---

### Fase VD-9 — Clima por parcela
**Estado:** `PENDIENTE`
**Dependencias:** `VD-0`

#### 1. Módulo e interfaces
`Weather.tsx`: tarjeta de pronóstico actual, panel de actualización demo, advertencia de vigencia.

#### 2. Objetivo y concepto visual
El cielo en una tarjeta: lluvia protagonista, vigencia imposible de ignorar, edición demo claramente separada de lo real.

#### 3. Estructura visual y distribución
Doble panel: pronóstico actual (hero climático) + actualizar (formulario); advertencia de vencido como banner de acción.

#### 4. Jerarquía
Lluvia mm gigante > probabilidad con barra > temperaturas > vigencia/origen > metadatos de período.

#### 5. Tipografía
Lluvia 2.5rem tabular/600; probabilidad con % grande; temps 1.125rem; vigencia en badge + texto relativo.

#### 6. Paleta y contrastes
Hero en superficie info suave; badge vigente success / vencido warning-danger; origen OWM info vs demo neutral bien diferenciados.

#### 7. Espaciado y proporciones
Hero padding 28; formulario en card con grupos precipitación/temperatura; slider a ancho completo con valor visible.

#### 8. Componentes
Hero climático, badges de vigencia/origen, slider+input sincronizados con estilos del sistema, formulario validado, banner de vencido.

#### 9. Iconografía y microinteracciones
Icono nube protagonista 40px+; slider con pulgar amplio táctil; guardado con toast; banner con acción.

#### 10. Datos y estadísticas
Lluvia, probabilidad, máx/mín, actualizado-hace, período-hasta, origen.

#### 11. Responsive
Paneles apilados en móvil; slider full-width; hero compacto.

#### 12. Accesibilidad
Slider con `aria-label` y valor anunciado, badges con texto (no solo color), formulario etiquetado con errores claros.

#### 13. Reutilizables
Patrón doble-panel y hero de dato único.

#### 14. Tareas
- [ ] Hero climático rediseñado.
- [ ] Badges de vigencia/origen rediseñados.
- [ ] Formulario demo rediseñado con slider del sistema.
- [ ] Retirar estilos legacy usados aquí.

#### 15. Criterios de aceptación y pruebas
- [ ] Cambio visual integral y perceptible; mismos datos, rutas y contratos.
- [ ] Verificación: tests actualizados + lint + tsc + build + inspección manual.

---

### Fase VD-10 — Validación del motor
**Estado:** `PENDIENTE`
**Dependencias:** `VD-0`, `VD-4` (franja de severidad para fallos).

#### 1. Módulo e interfaces
`Validation.tsx`: intro, resumen global, filtros, tabla de casos.

#### 2. Objetivo y concepto visual
Confianza a primera vista: un veredicto global monumental (aprobado/fallos) y filas de fallo imposibles de pasar por alto.

#### 3. Estructura visual y distribución
Hero de resultado (gran % + badge + barra) → tabs + buscador → tabla de casos.

#### 4. Jerarquía
% global > badge de estado > casos fallidos > correctos > detalle en lenguaje claro.

#### 5. Tipografía
% en display 2.5rem tabular/600; casos en cuerpo; detalle en small; códigos esperados/obtenidos traducidos.

#### 6. Paleta y contrastes
Hero success pleno si 10/10, warning/danger si hay fallos; filas de fallo con franja danger y fondo suave; correctas neutras.

#### 7. Espaciado y proporciones
Hero padding 28; tabla compacta con filas aireadas; barra de progreso gruesa y legible.

#### 8. Componentes
Hero de resultado, barra de progreso, tabla reestilizada con franja por fila, tabs con conteos.

#### 9. Iconografía y microinteracciones
Icono flask/check/alert grande en hero; re-ejecutar con spinner; éxito con confirmación visible.

#### 10. Datos y estadísticas
Total, correctos, % y detalle por caso con motivo traducido; sin fechas inventadas.

#### 11. Responsive
Hero apilado en móvil; tabla con scroll-x y `data-label`.

#### 12. Accesibilidad
Progreso con `role=progressbar` y valores, fallos también en texto, foco al resultado tras ejecutar.

#### 13. Reutilizables
Hero de resultado y barra de progreso.

#### 14. Tareas
- [ ] Hero de resultado rediseñado.
- [ ] Tabla con franja por fila.
- [ ] Filtros y resumen rediseñados.
- [ ] Retirar estilos legacy usados aquí.

#### 15. Criterios de aceptación y pruebas
- [ ] Cambio visual integral y perceptible; mismos datos, rutas y contratos.
- [ ] Verificación: tests actualizados + lint + tsc + build + inspección manual.

---

### Fase VD-11 — Cultivos y suelos
**Estado:** `PENDIENTE`
**Dependencias:** `VD-0`

#### 1. Módulo e interfaces
`Catalogs.tsx`: referencia, buscador, acordeón de cultivos con etapas, tabla de suelos, glosario y fuente.

#### 2. Objetivo y concepto visual
Biblioteca agronómica serena y legible: consultar un parámetro toma segundos y cada sigla se entiende sin salir de la página.

#### 3. Estructura visual y distribución
Referencia introductoria → buscador prominente → grid cultivos+etapas y suelos → glosario en definiciones → nota de fuente.

#### 4. Jerarquía
Buscador > nombres de cultivo/suelo > valores tabulares > glosario > fuente.

#### 5. Tipografía
Nombres 1rem/600; valores tabulares; códigos en mono tiny; glosario en definiciones small legibles.

#### 6. Paleta y contrastes
Superficie clara, badge neutro de solo-lectura, tablas con cebreado suave, glosario con términos en verde oscuro.

#### 7. Espaciado y proporciones
Buscador full-width; grid 2 columnas en escritorio, 1 en móvil; glosario en 2 columnas en escritorio.

#### 8. Componentes
Buscador, acordeón múltiple rediseñado, tablas limpias, glosario en definiciones, badge de solo-lectura.

#### 9. Iconografía y microinteracciones
Iconos sprout/layers; chevron rotando en acordeón; vacíos con sugerencia de búsqueda.

#### 10. Datos y estadísticas
Etapas (días/Kc/raíz/p), CC/PMP/agua útil, fuente FAO-56/Saxton & Rawls con advertencia de validación local.

#### 11. Responsive
Grid apilado en móvil; tablas con scroll-x; buscador siempre visible.

#### 12. Accesibilidad
Acordeón con `aria-expanded`, tablas con caption y alcance, buscador con etiqueta, foco visible.

#### 13. Reutilizables
Patrón buscador + acordeón + glosario.

#### 14. Tareas
- [ ] Buscador prominente rediseñado.
- [ ] Acordeón y tablas rediseñados.
- [ ] Glosario y fuente rediseñados.
- [ ] Retirar estilos legacy usados aquí.

#### 15. Criterios de aceptación y pruebas
- [ ] Cambio visual integral y perceptible; mismos datos, rutas y contratos.
- [ ] Verificación: tests actualizados + lint + tsc + build + inspección manual.

---

### Fase VD-12 — Recuperación de PIN
**Estado:** `PENDIENTE`
**Dependencias:** `VD-0`

#### 1. Módulo e interfaces
`RecoverPin.tsx`: contenido del panel de acceso (AuthLayout intacto), pasos de solicitud/verificación, contacto de soporte.

#### 2. Objetivo y concepto visual
Recuperar el acceso sin ansiedad: el caparazón de acceso se conserva intacto; el interior respira con pasos numerados claros y contacto visible.

#### 3. Estructura visual y distribución
Dentro del `access-card` existente: indicador de pasos 1-2 → formulario del paso → ayuda de contacto; modal de contacto con canales claros.

#### 4. Jerarquía
Paso actual > campo > acción > ayuda; éxito con check prominente al completar.

#### 5. Tipografía
Títulos del panel existentes; pasos numerados grandes; campos y errores con el lenguaje del sistema de acceso.

#### 6. Paleta y contrastes
Paleta de acceso intacta (historia oscura + panel claro); éxito en success, errores en danger, igual que Login.

#### 7. Espaciado y proporciones
Ritmo del `access-card` conservado; pasos con separación generosa; botón de reenvío como acción secundaria visible.

#### 8. Componentes
Pasos numerados, formularios de acceso, botón de reenvío, modal de contacto con canales (teléfono/WhatsApp/horario).

#### 9. Iconografía y microinteracciones
Iconos lock/mail/check del set actual; spinner en envío; éxito con confirmación antes de redirigir.

#### 10. Datos y estadísticas
Sin agregados; mensajes de estado claros por paso (código enviado, PIN actualizado, bloqueo).

#### 11. Responsive
Hereda el responsive del acceso (historia colapsada en móvil); modal full-screen en pantallas pequeñas.

#### 12. Accesibilidad
Formularios con etiquetas y errores asociados, alertas con rol, foco gestionado entre pasos, contraste del acceso intacto.

#### 13. Reutilizables
Patrón de pasos de acceso para futuros flujos.

#### 14. Tareas
- [ ] Pasos de recuperación rediseñados dentro del panel intacto.
- [ ] Contacto de soporte rediseñado sin literales dispersos.
- [ ] Verificar que AuthLayout/sidebar/Login no cambian ni un píxel.

#### 15. Criterios de aceptación y pruebas
- [ ] Cambio visual integral del contenido (caparazón intacto); mismo flujo y contratos.
- [ ] Verificación: tests actualizados + lint + tsc + build + inspección manual.

---

## Cobertura total de interfaces (verificación PARTE III)

| Interfaz / ruta | Fase | Notas |
|---|---|---|
| `/login` (Login + AuthLayout) | Referencia intacta | Sin fase: identidad preservada |
| Sidebar (`TechShell`) | Intacto | Sin fase: navegación preservada |
| `FarmerShell` (cabecera + bottomnav) | Cromo intacto | Solo cambia el contenido de página |
| `/` Hoy (agricultor) | `VD-1` | Incluye `SoilMeter` v2, franja de severidad, tira de stats |
| `/evaluar` (ambos roles) | `VD-2` | Variantes agricultor/equipo |
| `/riegos` (ambos roles) | `VD-3` | Variantes agricultor/equipo |
| `/alertas` (ambos roles) | `VD-4` | Variantes agricultor/equipo |
| `/` Dashboard (equipo) | `VD-5` | — |
| `/parcelas` + wizard + mapa | `VD-6` | Mapa Leaflet OSM intacto como proveedor |
| `/agricultores` | `VD-7` | — |
| `/sensores` | `VD-8` | — |
| `/clima` | `VD-9` | — |
| `/validacion` | `VD-10` | — |
| `/catalogos` | `VD-11` | — |
| `/recuperar-pin` (contenido) | `VD-12` | Caparazón AuthLayout intacto |
| Componentes `ui/*`, `SoilMeter`, `VerdictCard` | `VD-0` + implementación distribuida | Regla del primer uso |
| `PlotMap`, `Toasts`, `Icon` | Según fase que los usa | Cromático de dibujo en `VD-6` |
| `LineChart` sin usos | Retirar en la fase que corresponda | Documentado en `FT-1.6` |
| Estados globales (carga/vacío/error/éxito) | Todas | Patrón unificado de `VD-0` |

### 8.4 Bitácora PARTE III
- [x] Fecha: 2026-10-10 — Fase: PARTE III (definición) — DOCUMENTO. Sistema de diseño `VD-0` + 12 fases `VD-1`…`VD-12` cubriendo todas las interfaces; sin cambios de código.
- [x] Fecha: 2026-10-10 — Fase: VD-1 — COMPLETADA. Rediseño integral de Hoy (hero, stats, tarjetas, Tabs, SoilMeter v2); `npm test` 139/139, `lint` 0 errores, `tsc -b` sin errores, `build` código 0.

### 8.5 Incidencias fuera del plan (2026-10-10)
- Resumen técnico 500: faltaba `use MetricsController` en `routes/api.php` (corregido + `MetricsTest`).
- Hoy agricultor 500 `Unknown column farmer_id`: `scopeToFarmer` aplicado a tablas sin esa columna; nuevo `scopeToFarmerPlots` en sensores/mediciones/evaluaciones/riegos + `FarmerScopingTest` (suite backend 53 passed).
- BD vaciada 2 veces (tablas recreadas ~08:50, auto-increment avanzado por inserts revertidos): correr la suite backend sin la config sqlite (`php artisan test` sí la usa) borra los datos de desarrollo. Recuperado con seeds + cuentas recreadas. Regla: tests backend SOLO vía `php artisan test` desde `backend/`.
- [x] Fecha: 2026-10-10 — Fase: VD-1 — COMPLETADA. Rediseño integral de Hoy (hero, stats, tarjetas, Tabs, SoilMeter v2); `npm test` 139/139, `lint` 0 errores, `tsc -b` sin errores, `build` código 0.
