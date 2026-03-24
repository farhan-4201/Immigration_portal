#!/bin/bash
# Server Health Check & Auto-Recovery Script
# This script checks if Nginx and PM2 processes are running and restarts them if not.
# Install as a cron job: crontab -e → */5 * * * * /root/portal-frontend/scripts/server-health-check.sh >> /var/log/portal-health.log 2>&1

LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')] [HealthCheck]"

# --- Check Nginx ---
if ! systemctl is-active --quiet nginx; then
    echo "$LOG_PREFIX WARNING: Nginx is down! Attempting restart..."
    systemctl start nginx
    if systemctl is-active --quiet nginx; then
        echo "$LOG_PREFIX Nginx restarted successfully."
    else
        echo "$LOG_PREFIX CRITICAL: Nginx failed to restart!"
        # Try reinstalling if config is missing
        if [ ! -f /etc/nginx/nginx.conf ]; then
            echo "$LOG_PREFIX nginx.conf missing — reinstalling Nginx..."
            apt-get install -y nginx > /dev/null 2>&1
            # Restore our config if it was wiped
            if [ ! -f /etc/nginx/conf.d/hrservices.conf ]; then
                cat > /etc/nginx/conf.d/hrservices.conf << 'NGINXEOF'
server {
    listen 80;
    server_name hrservices.me *.hrservices.me;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /_next/static {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
NGINXEOF
            fi
            rm -f /etc/nginx/sites-enabled/default
            systemctl start nginx
            echo "$LOG_PREFIX Nginx reinstalled and started."
        fi
    fi
else
    echo "$LOG_PREFIX Nginx: OK"
fi

# --- Check PM2 / Next.js ---
if ! command -v pm2 &> /dev/null; then
    echo "$LOG_PREFIX WARNING: PM2 not found in PATH, trying with full path..."
    export PATH=$PATH:/usr/local/bin:/root/.nvm/versions/node/*/bin
fi

PM2_STATUS=$(pm2 jlist 2>/dev/null)
FRONTEND_RUNNING=$(echo "$PM2_STATUS" | grep -c '"name":"portal-frontend".*"status":"online"')

if [ "$FRONTEND_RUNNING" -eq 0 ]; then
    echo "$LOG_PREFIX WARNING: portal-frontend is down! Attempting restart..."
    cd /root/portal-frontend
    pm2 restart portal-frontend 2>/dev/null || pm2 start ecosystem.config.js --env production
    pm2 save
    echo "$LOG_PREFIX portal-frontend restarted."
else
    echo "$LOG_PREFIX portal-frontend: OK"
fi

# --- Check if Next.js is actually responding ---
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:3001 2>/dev/null)
if [ "$HTTP_STATUS" = "000" ] || [ -z "$HTTP_STATUS" ]; then
    echo "$LOG_PREFIX WARNING: Next.js not responding on port 3001! Force restarting..."
    cd /root/portal-frontend
    pm2 restart portal-frontend 2>/dev/null || pm2 start ecosystem.config.js --env production
    pm2 save
    sleep 5
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:3001 2>/dev/null)
    echo "$LOG_PREFIX After restart, Next.js HTTP status: $HTTP_STATUS"
else
    echo "$LOG_PREFIX Next.js responding: HTTP $HTTP_STATUS"
fi

# --- Check public access ---
PUBLIC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://hrservices.me 2>/dev/null)
if [ "$PUBLIC_STATUS" = "000" ] || [ -z "$PUBLIC_STATUS" ]; then
    echo "$LOG_PREFIX WARNING: hrservices.me not reachable publicly (may be DNS/firewall issue)"
else
    echo "$LOG_PREFIX Public access: HTTP $PUBLIC_STATUS"
fi

echo "$LOG_PREFIX Health check complete."
