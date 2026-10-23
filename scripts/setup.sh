#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Crear el volumen MySQL solo si no existe en esta computadora.
docker volume inspect yakuai-nuevo_mysql_data >/dev/null 2>&1 || docker volume create yakuai-nuevo_mysql_data >/dev/null

if [ ! -f .env ]; then
  cp .env.example .env
  python3 -c "import secrets,base64;print('APP_KEY=base64:'+base64.b64encode(secrets.token_bytes(32)).decode())" > /tmp/yakuai_key
  sed -i "s|^APP_KEY=.*|$(cat /tmp/yakuai_key)|" .env
  sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$(python3 -c 'import secrets;print(secrets.token_hex(12))')|" .env
  sed -i "s|^MYSQL_ROOT_PASSWORD=.*|MYSQL_ROOT_PASSWORD=$(python3 -c 'import secrets;print(secrets.token_hex(12))')|" .env
  rm -f /tmp/yakuai_key
  chmod 600 .env
  echo ".env generado (no se muestran secretos)."
else
  echo ".env existente, se conserva."
fi

echo "OWM_KEY: pegala en .env (solo servidor). Hoy da 401: pendiente activacion."

docker compose build
docker compose up -d --wait mysql redis
docker compose run --rm --no-deps app composer install --no-interaction --prefer-dist
docker compose run --rm --no-deps frontend npm ci
docker compose run --rm --no-deps app php artisan migrate --force
docker compose run --rm --no-deps app php artisan db:seed --force
docker compose up -d --wait --wait-timeout 180
docker compose ps
