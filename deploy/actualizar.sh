#!/usr/bin/env bash
# Después de subir código nuevo: compila y reinicia sin tocar la base ni el .env.
set -euo pipefail
cd "$(dirname "$0")/.."
npm ci && npm run db:migrate -w apps/api && NODE_ENV=production npm run build
pm2 restart under-api under-web && pm2 save
