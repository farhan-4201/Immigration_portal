#!/bin/bash
# One-time server setup script for permanent reliability
# Run this ONCE on the VPS: bash /root/portal/scripts/server-setup.sh

set -euo pipefail

echo "========================================="
echo "  Portal Server Permanent Setup"
echo "========================================="

# 1. Ensure Nginx is installed and enabled
echo ""
echo "[1/8] Ensuring Nginx is installed and enabled on boot..."
if ! command -v nginx &> /dev/null; then
    apt update && apt install -y nginx
fi
systemctl enable nginx
systemctl start nginx

# Ensure the correct Nginx config is in place (conf.d takes priority)
NGINX_CONF="/etc/nginx/conf.d/hrservices.conf"
WILDCARD_CERT="/etc/letsencrypt/live/hrservices.me-0001/fullchain.pem"
WILDCARD_KEY="/etc/letsencrypt/live/hrservices.me-0001/privkey.pem"

if [ ! -f "$NGINX_CONF" ]; then
    echo "  ⚠ Nginx config missing! Restoring from repo..."
    cp /root/portal/nginx/hrservices.conf "$NGINX_CONF"
fi

# Ensure correct wildcard cert paths are set (hrservices.me-0001)
sed -i "s|live/hrservices.me/fullchain.pem|live/hrservices.me-0001/fullchain.pem|g" "$NGINX_CONF"
sed -i "s|live/hrservices.me/privkey.pem|live/hrservices.me-0001/privkey.pem|g" "$NGINX_CONF"

# Remove duplicate config from sites-enabled if it exists
if [ -L /etc/nginx/sites-enabled/hrservices.conf ]; then
    rm /etc/nginx/sites-enabled/hrservices.conf
    echo "  ✓ Removed duplicate hrservices.conf from sites-enabled"
fi

nginx -t && systemctl reload nginx
echo "  ✓ Nginx enabled on boot with correct wildcard SSL cert"

# 2. Ensure MySQL is bound to localhost only
echo ""
echo "[2/8] Securing MySQL (bind to localhost only)..."
MYSQL_CONF="/etc/mysql/mysql.conf.d/mysqld.cnf"
if grep -q "^bind-address\s*=\s*0.0.0.0" "$MYSQL_CONF" 2>/dev/null; then
    sed -i "s/^bind-address\s*=\s*0.0.0.0/bind-address = 127.0.0.1/" "$MYSQL_CONF"
    echo "  ✓ MySQL bind-address changed to 127.0.0.1"
    systemctl restart mysql
else
    # Ensure bind-address is set to 127.0.0.1
    if ! grep -q "^bind-address" "$MYSQL_CONF" 2>/dev/null; then
        echo "bind-address = 127.0.0.1" >> "$MYSQL_CONF"
        systemctl restart mysql
    fi
    echo "  ✓ MySQL already bound to localhost"
fi

# Also bind mysqlx to localhost
if grep -q "^mysqlx-bind-address\s*=\s*0.0.0.0" "$MYSQL_CONF" 2>/dev/null; then
    sed -i "s/^mysqlx-bind-address\s*=\s*0.0.0.0/mysqlx-bind-address = 127.0.0.1/" "$MYSQL_CONF"
    systemctl restart mysql
fi
echo "  ✓ MySQL secured"

# 3. Ensure Docker and Containerd are disabled (not used in this project)
echo ""
echo "[3/8] Ensuring Docker/Containerd are disabled (not used)..."
for svc in docker containerd; do
    if systemctl is-active --quiet "$svc"; then
        systemctl stop "$svc"
        echo "  ✓ Stopped $svc"
    fi
    if systemctl is-enabled --quiet "$svc" 2>/dev/null; then
        systemctl disable "$svc"
        echo "  ✓ Disabled $svc"
    fi
done
echo "  ✓ Docker/Containerd disabled"

# 4. Ensure PM2 startup is configured
echo ""
echo "[4/8] Configuring PM2 auto-start on reboot..."
pm2 startup systemd -u root --hp /root 2>/dev/null || true
cd /root/portal
pm2 restart ecosystem.config.js --env production 2>/dev/null || pm2 start ecosystem.config.js --env production
pm2 save
echo "  ✓ PM2 startup configured and process list saved"

# 5. Install health check cron job (every 5 minutes)
echo ""
echo "[5/8] Installing health check cron job..."
chmod +x /root/portal/scripts/server-health-check.sh

# Remove old cron entry if exists, then add new one
(crontab -l 2>/dev/null | grep -v "server-health-check" ; echo "*/5 * * * * /root/portal/scripts/server-health-check.sh >> /var/log/portal-health.log 2>&1") | crontab -
echo "  ✓ Health check runs every 5 minutes"

# 6. Set up log rotation for health check logs
echo ""
echo "[6/8] Setting up log rotation..."
cat > /etc/logrotate.d/portal-health << 'EOF'
/var/log/portal-health.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    create 0644 root root
}
EOF
echo "  ✓ Log rotation configured (7 days)"

# 7. Backup Nginx config
echo ""
echo "[7/8] Backing up Nginx config..."
mkdir -p /root/nginx-backup
cp /etc/nginx/conf.d/hrservices.conf /root/nginx-backup/hrservices.conf.bak 2>/dev/null || true
echo "  ✓ Nginx config backed up to /root/nginx-backup/"

# 8. Ensure SSL auto-renewal is working
echo ""
echo "[8/8] Checking SSL auto-renewal..."
if command -v certbot &> /dev/null; then
    certbot renew --dry-run 2>/dev/null && echo "  ✓ SSL auto-renewal is working" || echo "  ⚠ SSL renewal test failed — check certbot config"
else
    echo "  ⚠ Certbot not installed — run: apt install -y certbot python3-certbot-nginx"
fi

echo ""
echo "========================================="
echo "  Setup Complete! Your server now has:"
echo "  • Nginx auto-starts on boot"
echo "  • Nginx uses wildcard cert (hrservices.me-0001)"
echo "  • MySQL bound to localhost only (not public)"
echo "  • Docker/Containerd disabled (ports 6001/6002/8000 closed)"
echo "  • PM2 auto-starts portal-frontend on boot"
echo "  • Health check runs every 5 minutes"
echo "  • SSL auto-renewal via certbot"
echo "========================================="
echo ""
echo "To verify: pm2 status && systemctl status nginx && systemctl status mysql && crontab -l"
