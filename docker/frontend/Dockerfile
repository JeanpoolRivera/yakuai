# Debian slim (glibc): comparte node_modules del host vía volumen.
# Alpine (musl) rompe los binarios nativos de Tailwind v4 instalados en el host (ver MEJORAS.md E-22).
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
