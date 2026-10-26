# YakuAI · Frontend

Panel web para agricultores y personal técnico/administrador. Consume la API Laravel bajo /api/v1. Las reglas de cálculo y los permisos deben resolverse en backend; los componentes frontend presentan los resultados y estados recibidos.

## Tecnologías utilizadas

React 19, TypeScript, Vite 6, React Router 7, Tailwind CSS v4, Leaflet, Radix UI, lucide-react y sonner. Recharts está instalado, pero no encontré gráficos importados por las páginas actuales. TanStack Table, react-hook-form, zod, date-fns y cmdk también están instalados sin imports de producción; no forman parte del flujo activo hasta integrarse.

## Estructura actual

~~~text
src/
  main.tsx                entrada y providers
  app/                    rutas diferidas, sesión y navegación por rol
  api/                    cliente, tipos y funciones de endpoint
  features/                módulos por dominio (auth, hoy, evaluar, parcelas,
                           agricultores, riegos, alertas, sensores, clima,
                           catálogos, validación y dashboard)
  components/layout/       shells de agricultor y personal
  components/workspace/    elementos compartidos de los módulos
  components/shadcn/       componentes Radix y adaptadores visuales
  design-system/           primitivas y tokens tipados
  hooks/, lib/              hooks compartidos, permisos, formato y utilidades
  styles/                   tokens globales y estilos de componentes
  pages/                    adaptadores de ruta para los módulos
~~~

## Rutas por rol

Personal técnico y administrador: resumen, evaluar, parcelas, riegos, alertas, sensores, clima, agricultores, catálogos y validación.

Agricultor: Hoy, evaluar, sus riegos y alertas de sus parcelas. El backend debe seguir imponiendo permisos; véase la brecha indicada en [../backend/README.md](../backend/README.md).

## Desarrollo y verificación

Con dependencias instaladas, desde frontend/:

~~~sh
npm run dev
npm test
npm run lint
npx tsc -b
npm run build
~~~

El puerto por defecto en Docker es 8081. La API usa 8082, sujeto a .env. Los comandos indican cómo verificar el proyecto; su presencia aquí no certifica que hayan pasado en la última ejecución.

## Vista aislada para QA

`qa-preview.html` monta las rutas de la aplicación con fixtures locales; no persiste cambios ni usa datos reales. Está disponible en el servidor de Vite para revisión visual y no es una ruta de producto.

Para el contenedor de producción (frontend compilado y Nginx, sin servidor Vite), consulta [../docs/despliegue-produccion.md](../docs/despliegue-produccion.md).
