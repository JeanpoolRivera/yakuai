#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose config --quiet
docker compose exec -T app php artisan test --no-ansi
docker compose exec -T frontend npm run lint
docker compose exec -T frontend npm run build
docker compose exec -T nginx wget -q -O /dev/null http://127.0.0.1/api/v1/health
node -e "fetch(`http://127.0.0.1:${FRONTEND_PORT:-8081}`).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
docker compose ps
