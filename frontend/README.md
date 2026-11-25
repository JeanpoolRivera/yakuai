# YakuAI Frontend

Panel web React 19 y TypeScript con Vite, React Router, Tailwind CSS, Leaflet y componentes compartidos. Consume la API Laravel `/api/v1`. El cálculo y la autorización pertenecen al backend.

## Comandos

Desde `frontend/`:

```sh
npm ci
npm run dev
npm test
npm run lint
npx tsc -b
npm run build
```

En Docker local, Vite se publica por defecto en `http://127.0.0.1:8081`; la API se publica en el puerto 8082. La producción sirve la compilación mediante Nginx.

## Referencias

- [Rutas y pantallas por rol](../docs/frontend/interfaz-y-navegacion.md)
- [Sistema visual](../docs/frontend/sistema-visual.md)
- [Accesibilidad y diseño adaptable](../docs/frontend/accesibilidad-y-responsive.md)
- [Desarrollo local](../docs/operacion/desarrollo-local.md)

`qa-preview.html` utiliza fixtures locales para revisión visual; no es una ruta de producto ni persiste datos.
