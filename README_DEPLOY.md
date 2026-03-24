# Deployment Instructions

Important: Do NOT paste or store production credentials in chat or git. If you shared server passwords earlier, rotate them immediately.

Prerequisites (local machine):
- `ssh` client installed
- Your SSH key added to the remote server (recommended) or be prepared to enter password interactively
- Node.js & npm available on the remote server
- `prisma` installed in project (we use `npx prisma`)

Quick deploy (bash):

```bash
export DEPLOY_USER=youruser
export DEPLOY_HOST=your.server.example.com
export DEPLOY_PATH=/var/www/portal   # path to repo on the server
./scripts/deploy.sh
```

Quick deploy (PowerShell):

```powershell
.\	ools\deploy.ps1 -DeployUser youruser -DeployHost your.server.example.com -DeployPath /var/www/portal
```

What the scripts do (safe defaults):
- SSH to server
- `git fetch` + `git reset --hard origin/main` (deploys main branch)
- `npm ci` to install dependencies
- `npx prisma generate` and `npx prisma migrate deploy` (attempts to apply migrations)
- `npm run build`
- attempts to restart the app via `pm2` (service name `portal`) or `systemd` (`portal` service). Adjust to match your production process.

Recommended manual checklist before first deploy:
1. Rotate any leaked credentials.
2. On the server, ensure repository at `DEPLOY_PATH` exists and is owned by your deploy user.
3. Create a systemd unit or pm2 process named `portal` (or update the scripts to use your process manager).
4. Ensure environment variables (DATABASE_URL, JWT_SECRET, NODE_ENV, etc.) are properly set on the server (systemd unit, pm2 ecosystem file, or `.env`).
5. Backup the database before running migrations.

Rollback: If a deploy breaks, you can SSH and run:

```bash
cd /var/www/portal
git reset --hard HEAD@{1}
npm ci
npx prisma migrate resolve --applied <migration-name> # if needed
pm2 restart portal
```

If you want, I can:
- Create a `pm2` ecosystem file and a `systemd` unit example.
- Add a GitHub Actions workflow for automated CI/CD (push-to-main deploy).
