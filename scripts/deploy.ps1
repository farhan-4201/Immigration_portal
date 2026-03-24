param(
    [Parameter(Mandatory=$true)][string]$DeployUser,
    [Parameter(Mandatory=$true)][string]$DeployHost,
    [Parameter(Mandatory=$true)][string]$DeployPath
)

Write-Host "Deploying to $DeployUser@$DeployHost:$DeployPath"

$sshTarget = "$DeployUser@$DeployHost"

$remoteScript = @'
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
if command -v pm2 >/dev/null 2>&1; then
  echo "Restarting with pm2..."
  pm2 restart ecosystem.config.js --env production 2>/dev/null || pm2 start ecosystem.config.js --env production
  echo "Saving PM2 process list for auto-restart on reboot..."
  pm2 save
else
  echo "Attempting systemd restart (service name: portal-frontend)"
  sudo systemctl restart portal-frontend || echo "systemd service 'portal-frontend' not found; please restart manually"
fi
echo "Deployment complete."
'@

ssh $sshTarget "bash -s" <<< $remoteScript

Write-Host "Done."
