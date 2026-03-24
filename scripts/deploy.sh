#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   DEPLOY_USER=user DEPLOY_HOST=host DEPLOY_PATH=/var/www/portal ./scripts/deploy.sh

: "${DEPLOY_USER:?Set DEPLOY_USER env var (ssh user)}"
: "${DEPLOY_HOST:?Set DEPLOY_HOST env var (ssh host)}"
: "${DEPLOY_PATH:?Set DEPLOY_PATH env var (path to repo on remote)}"

echo "Deploying to ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}..."

ssh "${DEPLOY_USER}@${DEPLOY_HOST}" bash <<'EOF'
set -euo pipefail
cd "${DEPLOY_PATH}"
echo "Fetching latest code..."
git fetch --all --prune
git reset --hard origin/main
echo "Installing dependencies..."
npm ci
echo "Generating Prisma client..."
npx prisma generate --schema=prisma/schema.prisma || true
echo "Running migrations (if any)..."
npx prisma migrate deploy --schema=prisma/schema.prisma || true
echo "Building app..."
npm run build

# Restart application using ecosystem.config.js
if command -v pm2 >/dev/null 2>&1; then
  echo "Restarting with pm2..."
  pm2 restart ecosystem.config.js --env production 2>/dev/null || pm2 start ecosystem.config.js --env production
  echo "Saving PM2 process list for auto-restart on reboot..."
  pm2 save
else
  echo "Attempting systemd restart (service name: portal-frontend)"
  sudo systemctl restart portal-frontend || echo "systemd service 'portal-frontend' not found; please restart manually"
fi

# Ensure Nginx is running
echo "Checking Nginx..."
systemctl is-active --quiet nginx && echo "Nginx: OK" || { echo "Nginx is down — starting..."; systemctl start nginx; }

# Verify app is responding
echo "Verifying deployment..."
sleep 3
curl -sf --max-time 10 http://localhost:3001 > /dev/null && echo "App: OK" || echo "WARNING: App not responding on port 3001!"

echo "Deployment complete."
EOF

echo "Done."
