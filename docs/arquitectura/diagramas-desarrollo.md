# Diagramas de desarrollo

Estos diagramas resumen la arquitectura y las prácticas que se pueden observar en el repositorio. No representan un historial de cada decisión ni reemplazan las rutas, el código y las pruebas como fuente de verdad.

## Flujo general del sistema

```mermaid
flowchart LR
  P[Personal técnico / agricultor] --> UI[Frontend React + TypeScript]
  UI -->|HTTP JSON /api/v1| R[Rutas Laravel]
  R --> M[Middleware de autenticación y permisos]
  M --> C[Controladores]
  C --> S[Servicios de dominio e integraciones]
  C --> E[Modelos Eloquent]
  S --> E
  E --> DB[(MySQL)]
  S --> WX[Servicio de clima / fallback]
  S --> Q[Cola Redis, cuando aplica]
  Q --> W[Worker y mensajería opcional]
  C -->|JSON| UI
```

La interfaz presenta la recomendación, pero el cálculo y la autorización se ejecutan en Laravel. La persona usuaria decide y aplica el riego; el sistema no acciona válvulas.

## Backend: MVC de Laravel con servicios de dominio

```mermaid
flowchart TD
  Cliente[Frontend o dispositivo de ingreso] --> Ruta[Route /api/v1]
  Ruta --> Middleware[auth:sanctum + yakuai]
  Middleware --> Controlador[Controller\ncoordina caso de uso y respuesta JSON]
  Controlador --> Validacion[Validación y autorización\nprincipalmente en el controlador]
  Controlador --> Servicio[Service\nreglas de dominio / integración]
  Controlador --> Modelo[Model Eloquent]
  Servicio --> Modelo
  Modelo --> BD[(Base de datos)]
  Controlador --> Respuesta[JSON: data, errores o paginación]
  Respuesta --> Cliente
```

**Cómo clasificarlo:** es una aplicación monolítica Laravel organizada con el patrón MVC y una capa adicional de servicios. Las rutas dirigen la petición; los controladores coordinan; los modelos Eloquent representan y consultan datos; servicios como `HydroService`, `OwmService` y `SensorNormalizer` concentran lógica de dominio o integración. La validación observada se hace con `$request->validate()` en los controladores; el repositorio no muestra una capa general de Form Requests para estos flujos.

## Frontend: organización por funcionalidades y componentes

```mermaid
flowchart TD
  Entrada[main.tsx\nReact + Router + AuthProvider] --> App[App.tsx\nrutas protegidas y shells por rol]
  App --> Paginas[pages/\npantallas y composición]
  Paginas --> Features[features/\nutilidades y lógica por dominio]
  Paginas --> Hooks[hooks/\nestado y comportamiento reutilizable]
  Paginas --> UI[components/ + design-system/\ncomponentes visuales compartidos]
  Paginas --> API[api/endpoints.ts\noperaciones tipadas]
  API --> Cliente[api/client.ts\nfetch, token, errores y paginación]
  Cliente -->|JSON| Backend[Laravel /api/v1]
  Backend --> Cliente
  Cliente --> Paginas
```

**Cómo clasificarlo:** frontend React/TypeScript modular, orientado a funcionalidades y con componentes reutilizables (no MVC). Las páginas componen pantallas; `features/` agrupa código específico de cada dominio; `hooks/` reutiliza comportamiento; `design-system/` y `components/` comparten patrones visuales. Un cliente HTTP central agrega el token Sanctum y normaliza respuestas y errores. La aplicación separa experiencias de personal técnico y agricultores mediante rutas y shells por rol.

## Ciclo de desarrollo asistido por IA

```mermaid
flowchart LR
  Persona[Desarrollador define objetivo y contexto] --> Solicitud[Solicitud acotada a la IA]
  Solicitud --> Borrador[IA propone análisis, código o documentación]
  Borrador --> Revision[Persona revisa contra reglas del dominio y repositorio]
  Revision -->|ajustes| Solicitud
  Revision --> Verificacion[Verificación con revisión de código y pruebas existentes]
  Verificacion -->|falla o falta evidencia| Revision
  Verificacion --> Aprobacion[Persona acepta el cambio]
  Aprobacion --> Integracion[Integrar y documentar]
```

Este es un **flujo recomendado para documentar el uso de IA**, no una afirmación de que todos los cambios del proyecto se hayan producido así. El repositorio inspeccionado no registra qué asistente, modelo o prompts se usaron, ni conserva un historial de revisión humana por cambio; por ello no es posible verificar retrospectivamente la metodología real de IA. La IA debe apoyar el trabajo, mientras que las reglas de riego, permisos, datos y aceptación quedan bajo revisión humana. En el producto actual, “YakuAI” no significa que haya un modelo generativo integrado: las recomendaciones de riego se calculan con reglas deterministas en el backend.

## Ciclo de entrega que se desprende del repositorio

```mermaid
flowchart LR
  Necesidad[Necesidad funcional] --> Dominio[Definir flujo y reglas del dominio]
  Dominio --> Implementacion[Implementar API y/o pantalla]
  Implementacion --> Pruebas[Pruebas unitarias y de integración existentes]
  Pruebas --> Revision[Revisar resultado y documentación]
  Revision -->|corrección| Implementacion
  Revision --> Entrega[Compilar / integrar cambio]
```

El repositorio contiene pruebas PHPUnit y Vitest, además de comandos de build y lint. El diagrama refleja un ciclo de trabajo compatible con esos artefactos; no demuestra que cada contribución histórica haya seguido exactamente esos pasos.
