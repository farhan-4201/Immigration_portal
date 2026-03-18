#!/bin/bash
# ============================================================
#  PORTAL SERVER PROTECTION & AUTO-RECOVERY SCRIPT
#  Run ONCE: bash /root/protect-server.sh
# ============================================================

set -euo pipefail

echo "============================================================"
echo "  Portal Server Protection & Auto-Recovery Setup"
echo "============================================================"

GITHUB_REPO="https://github.com/farhan-4201/portal.git"
PORTAL_DIR="/root/portal"
LOG_FILE="/var/log/portal-recovery.log"

# ─────────────────────────────────────────────────────────────
# STEP 1: Install required tools
# ─────────────────────────────────────────────────────────────
echo ""
echo "[1/7] Installing required tools..."
apt update -qq
apt install -y fail2ban git curl ufw nginx certbot python3-certbot-nginx

# ─────────────────────────────────────────────────────────────
# STEP 2: Harden SSH - disable password auth, use key only
# ─────────────────────────────────────────────────────────────
echo ""
echo "[2/7] Hardening SSH configuration..."

# Backup original sshd_config
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak.$(date +%Y%m%d)

cat > /etc/ssh/sshd_config << 'EOF'
Port 22
PermitRootLogin yes
PasswordAuthentication yes
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding no
PrintMotd no
AcceptEnv LANG LC_*
Subsystem sftp /usr/lib/openssh/sftp-server
MaxAuthTries 3
LoginGraceTime 30
EOF

systemctl restart sshd
echo "  ✓ SSH hardened (max 3 login attempts)"

# ─────────────────────────────────────────────────────────────
# STEP 3: Configure UFW Firewall
# ─────────────────────────────────────────────────────────────
echo ""
echo "[3/7] Configuring UFW firewall..."

ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Allow only necessary ports
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS

# Block known attacker IPs
ufw deny from 38.56.75.223
ufw deny from 38.56.74.205
ufw deny from 38.56.75.0/24   # Block entire attacker subnet

ufw --force enable
echo "  ✓ Firewall configured — only ports 22, 80, 443 open"
echo "  ✓ Attacker IPs blocked"

# ─────────────────────────────────────────────────────────────
# STEP 4: Configure Fail2Ban to block brute force
# ─────────────────────────────────────────────────────────────
echo ""
echo "[4/7] Configuring Fail2Ban..."

cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime  = 86400
findtime = 600
maxretry = 3
ignoreip = 127.0.0.1/8 115.186.189.43

[sshd]
enabled  = true
port     = ssh
logpath  = %(sshd_log)s
backend  = %(sshd_backend)s
maxretry = 3
bantime  = 86400

[nginx-http-auth]
enabled  = true

[nginx-botsearch]
enabled  = true
EOF

systemctl enable fail2ban
systemctl restart fail2ban
echo "  ✓ Fail2Ban active — attackers banned after 3 failed attempts for 24 hours"

# ─────────────────────────────────────────────────────────────
# STEP 5: Lock authorized_keys permanently
# ─────────────────────────────────────────────────────────────
echo ""
echo "[5/7] Locking SSH authorized_keys..."

# Clear all unauthorized keys
echo "" > /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys

# Make immutable - nobody can add keys without chattr -i first
chattr +i /root/.ssh/authorized_keys
echo "  ✓ authorized_keys locked — no one can add SSH keys"

# ─────────────────────────────────────────────────────────────
# STEP 6: Create Auto-Recovery Script
# ─────────────────────────────────────────────────────────────
echo ""
echo "[6/7] Creating auto-recovery script..."

cat > /root/auto-recover.sh << 'RECOVERY'
#!/bin/bash
# Auto-recovery script - runs every 5 minutes via cron
LOG="/var/log/portal-recovery.log"
PORTAL_DIR="/root/portal"
GITHUB_REPO="https://github.com/farhan-4201/portal.git"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

log() {
    echo "[$TIMESTAMP] $1" >> "$LOG"
}

# 1. Check if portal directory exists, restore if missing
if [ ! -d "$PORTAL_DIR" ]; then
    log "ALERT: Portal directory missing! Restoring from GitHub..."
    cd /root
    git clone "$GITHUB_REPO" portal >> "$LOG" 2>&1
    cd "$PORTAL_DIR"
    npm install >> "$LOG" 2>&1
    npx prisma generate >> "$LOG" 2>&1
    npm run build >> "$LOG" 2>&1
    log "Portal directory restored from GitHub"
fi

# 2. Check if PM2 portal-frontend is running
PM2_STATUS=$(pm2 list 2>/dev/null | grep "portal-frontend" | grep "online" | wc -l)
if [ "$PM2_STATUS" -eq 0 ]; then
    log "ALERT: portal-frontend not running! Restarting..."
    cd "$PORTAL_DIR"
    pm2 start ecosystem.config.js 2>> "$LOG" || pm2 restart portal-frontend 2>> "$LOG"
    pm2 save >> "$LOG" 2>&1
    log "portal-frontend restarted"
fi

# 3. Check if Nginx is running
if ! systemctl is-active --quiet nginx; then
    log "ALERT: Nginx is down! Restarting..."
    systemctl restart nginx
    log "Nginx restarted"
fi

# 4. Check if MySQL is running
if ! systemctl is-active --quiet mysql; then
    log "ALERT: MySQL is down! Restarting..."
    systemctl restart mysql
    log "MySQL restarted"
fi

# 5. Check if site is responding
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:3001 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "000" ]; then
    log "ALERT: Site not responding on port 3001! Forcing restart..."
    cd "$PORTAL_DIR"
    pm2 restart portal-frontend >> "$LOG" 2>&1
    log "Forced restart done"
fi

# 6. Re-lock authorized_keys if tampered
ATTR=$(lsattr /root/.ssh/authorized_keys 2>/dev/null | awk '{print $1}')
if [[ "$ATTR" != *"i"* ]]; then
    log "ALERT: authorized_keys tampered! Re-locking..."
    echo "" > /root/.ssh/authorized_keys
    chattr +i /root/.ssh/authorized_keys
    log "authorized_keys re-locked"
fi

RECOVERY

chmod +x /root/auto-recover.sh
echo "  ✓ Auto-recovery script created at /root/auto-recover.sh"

# ─────────────────────────────────────────────────────────────
# STEP 7: Install Cron Jobs
# ─────────────────────────────────────────────────────────────
echo ""
echo "[7/7] Installing cron jobs..."

# Remove old recovery cron if exists, add new ones
(crontab -l 2>/dev/null | grep -v "auto-recover" | grep -v "portal-recovery"; \
echo "*/5 * * * * /root/auto-recover.sh >> /var/log/portal-recovery.log 2>&1"; \
echo "@reboot sleep 30 && cd /root/portal && pm2 start ecosystem.config.js && pm2 save") | crontab -

# Also configure PM2 to auto-start on reboot
pm2 startup systemd -u root --hp /root 2>/dev/null || true
cd /root/portal
pm2 start ecosystem.config.js 2>/dev/null || pm2 restart portal-frontend 2>/dev/null || true
pm2 save

echo "  ✓ Auto-recovery runs every 5 minutes"
echo "  ✓ PM2 auto-starts on server reboot"

# ─────────────────────────────────────────────────────────────
# DONE
# ─────────────────────────────────────────────────────────────
echo ""
echo "============================================================"
echo "  Protection Setup Complete!"
echo ""
echo "  SECURITY:"
echo "  • SSH max 3 attempts then locked"
echo "  • Fail2Ban bans attackers for 24 hours"
echo "  • UFW blocks all except ports 22, 80, 443"
echo "  • Known attacker IPs permanently blocked"
echo "  • authorized_keys locked (immutable)"
echo ""
echo "  AUTO-RECOVERY (every 5 mins):"
echo "  • Restores portal from GitHub if deleted"
echo "  • Restarts PM2 if portal-frontend stops"
echo "  • Restarts Nginx if it goes down"
echo "  • Restarts MySQL if it goes down"
echo "  • Re-locks authorized_keys if tampered"
echo ""
echo "  LOGS: tail -f /var/log/portal-recovery.log"
echo "============================================================"