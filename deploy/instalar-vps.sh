#!/usr/bin/env bash
# Instala o actualiza Under Clothing en el VPS sin tocar los otros sitios.
# Uso (como root, dentro de la carpeta del proyecto):  bash deploy/instalar-vps.sh
set -euo pipefail

DOMINIO="under-clothing.com"
WEB_PORT=3017
API_PORT=4017
DB_PORT=5433
DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"
paso() { echo -e "\n\033[35m▸ $*\033[0m"; }

paso "1. Puertos libres ($WEB_PORT, $API_PORT, $DB_PORT)"
for p in $WEB_PORT $API_PORT; do
  if ss -ltn | grep -q ":$p "; then
    if ! pm2 jlist 2>/dev/null | grep -q "under-"; then echo "El puerto $p ya lo usa otra app. Cambialo arriba en este script."; exit 1; fi
  fi
done

paso "2. Base de datos"
if ss -ltn | grep -q ":$DB_PORT "; then
  echo "  Ya hay algo escuchando en $DB_PORT (se asume que es la base de Under)."
elif command -v docker >/dev/null 2>&1; then
  docker compose up -d
else
  echo "  No hay Docker. Instalalo (apt install docker.io docker-compose-v2) o cambiá DATABASE_URL en .env a tu PostgreSQL."; exit 1
fi

paso "3. Variables de entorno"
if [ ! -f .env ]; then
  cp .env.example .env
  sed -i "s|^API_PORT=.*|API_PORT=$API_PORT|; s|^WEB_URL=.*|WEB_URL=http://127.0.0.1:$WEB_PORT|; s|^API_URL=.*|API_URL=http://127.0.0.1:$API_PORT|; s|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=https://$DOMINIO|" .env
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -hex 32)|; s|^REVALIDATE_SECRET=.*|REVALIDATE_SECRET=$(openssl rand -hex 24)|; s|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=$(openssl rand -base64 12 | tr -d '/+=')|" .env
  NUEVO=1
else
  echo "  .env ya existe, no se toca"; NUEVO=0
fi

paso "4. Dependencias y build"
npm ci
npm run db:migrate -w apps/api
if [ "$NUEVO" = 1 ]; then paso "   Seed con el contenido relevado (2-3 min)"; npm run db:seed -w apps/api; fi
NODE_ENV=production npm run build

paso "5. PM2"
pm2 delete under-api under-web >/dev/null 2>&1 || true
NODE_ENV=production pm2 start "node dist/main.js" --name under-api --cwd "$DIR/apps/api"
NODE_ENV=production pm2 start "npx next start -p $WEB_PORT -H 127.0.0.1" --name under-web --cwd "$DIR/apps/web"
pm2 save

paso "6. Nginx"
CONF=/etc/nginx/sites-available/$DOMINIO
if [ ! -f "$CONF" ]; then
  sed "s/__WEB_PORT__/$WEB_PORT/g; s/__DOMINIO__/$DOMINIO/g" deploy/nginx.conf > "$CONF"
  ln -sf "$CONF" /etc/nginx/sites-enabled/$DOMINIO
  nginx -t && systemctl reload nginx
else
  echo "  $CONF ya existe, no se toca"
fi

paso "7. Certificado SSL"
if [ ! -d /etc/letsencrypt/live/$DOMINIO ]; then
  certbot --nginx -d $DOMINIO -d www.$DOMINIO --redirect --non-interactive --agree-tos --register-unsafely-without-email || echo "  Certbot falló: revisá que el DNS de $DOMINIO y www apunten a este VPS y corré: certbot --nginx -d $DOMINIO -d www.$DOMINIO"
fi

sleep 3
echo
curl -s -o /dev/null -w "Web local: %{http_code}\n" http://127.0.0.1:$WEB_PORT/ || true
curl -s -o /dev/null -w "API local: %{http_code}\n" http://127.0.0.1:$API_PORT/api/public/site || true
echo -e "\n\033[32m✔ Listo:\033[0m https://$DOMINIO   ·   panel: https://$DOMINIO/admin"
if [ "$NUEVO" = 1 ]; then echo "Usuario: $(grep ^ADMIN_EMAIL .env | cut -d= -f2)   Contraseña: $(grep ^ADMIN_PASSWORD .env | cut -d= -f2)   (guardala)"; fi
