# Deployment Guide for Contabo Cloud VPS 10

This guide is specifically tailored for deploying the Gilamchi application on **Contabo Cloud VPS 10** with the following specifications:
- **CPU**: 4 vCPU Cores
- **RAM**: 8 GB
- **Storage**: 75 GB NVMe (or 150 GB SSD)
- **Network**: 200 Mbit/s Port
- **Snapshot**: 1 Snapshot included

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Server Setup](#initial-server-setup)
3. [Install Docker & Docker Compose](#install-docker--docker-compose)
4. [Deploy the Application](#deploy-the-application)
5. [SSL/HTTPS Setup (Optional but Recommended)](#sslhttps-setup-optional-but-recommended)
6. [Domain Configuration](#domain-configuration)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Backup Strategy](#backup-strategy)
9. [Performance Optimization](#performance-optimization)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

✅ **What you need:**
- Contabo Cloud VPS 10 account (or higher)
- SSH access credentials (sent to your email after purchase)
- Domain name (optional, for custom domain setup)
- Basic Linux command line knowledge

⚠️ **Important Notes:**
- With **8 GB RAM**, this server is perfect for the CLIP AI model (requires minimum 4 GB)
- No swap file needed (unlike 1GB VPS)
- NVMe storage provides excellent I/O performance for PostgreSQL

---

## Initial Server Setup

### 1. Connect to Your VPS

After purchasing from Contabo, you'll receive:
- IP Address
- Root password
- SSH access details

Connect via SSH:
```bash
ssh root@YOUR_VPS_IP
# Enter the password from your email
```

### 2. Update the System

```bash
# Update package lists and upgrade existing packages
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git nano ufw fail2ban htop
```

### 3. Configure Firewall (UFW)

```bash
# Allow SSH (IMPORTANT: Do this first!)
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw --force enable

# Check status
ufw status
```

### 4. Secure SSH Access (Recommended)

```bash
# Edit SSH config
nano /etc/ssh/sshd_config
```

Make these changes:
```
PermitRootLogin yes  # Change to 'no' after creating a non-root user
PasswordAuthentication yes  # Consider using SSH keys instead
```

Restart SSH:
```bash
systemctl restart sshd
```

### 5. Install Fail2Ban (Protection against brute-force attacks)

```bash
# Fail2ban is already installed, just enable it
systemctl enable fail2ban
systemctl start fail2ban
```

---

## Install Docker & Docker Compose

### 1. Install Docker

```bash
# Remove old versions (if any)
apt remove -y docker docker-engine docker.io containerd runc

# Install prerequisites
apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

### 2. Enable Docker to Start on Boot

```bash
systemctl enable docker
systemctl start docker
```

---

## Deploy the Application

### 1. Clone Your Repository

#### Option A: Via Git (Recommended)
```bash
# Navigate to home directory
cd /root

# Clone your repository
git clone https://github.com/YOUR_USERNAME/gilamchi.git
cd gilamchi
```

#### Option B: Manual Upload
Use FileZilla, SCP, or rsync to upload your project folder to `/root/gilamchi`.

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.prod.example .env.prod

# Edit the configuration
nano .env.prod
```

**IMPORTANT: Change these values!**

```env
# Database credentials (CHANGE THESE!)
POSTGRES_USER=gilamchi_user
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD_HERE_min_16_chars
POSTGRES_DB=gilamchi_db

# Application settings
APP_NAME=Gilamchi
APP_VERSION=1.0.0
ALGORITHM=HS256

# Security (GENERATE A NEW SECRET KEY!)
SECRET_KEY=GENERATE_A_LONG_RANDOM_STRING_HERE_AT_LEAST_32_CHARS
DEBUG=false

# CORS and Hosts
ALLOWED_HOSTS=YOUR_DOMAIN.com,YOUR_VPS_IP
CORS_ORIGINS=https://YOUR_DOMAIN.com,http://YOUR_VPS_IP

# Token settings
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=7

# Timezone
TIMEZONE=Asia/Tashkent
```

**Generate a secure SECRET_KEY:**
```bash
# Option 1: Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Option 2: Using OpenSSL
openssl rand -base64 32
```

Save the file: `Ctrl+O`, `Enter`, `Ctrl+X`

### 3. Build and Launch

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build
```

This will:
1. ✅ Download and setup PostgreSQL 15
2. ✅ Build the Backend (Python, FastAPI, CLIP model)
3. ✅ Build the Frontend (React, Vite)
4. ✅ Start all services in the background

**First build time:** 5-10 minutes (downloading CLIP model and PyTorch)

### 4. Verify Deployment

```bash
# Check running containers
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Press Ctrl+C to exit logs
```

### 5. Test the Application

Open your browser and navigate to:
```
http://YOUR_VPS_IP
```

You should see your Gilamchi application! 🎉

---

## SSL/HTTPS Setup (Optional but Recommended)

For production, you should use HTTPS. Here's how to set it up with **Certbot** and **Let's Encrypt** (free SSL certificates).

### Prerequisites
- A domain name pointing to your VPS IP
- Port 80 and 443 open (already done in firewall setup)

### 1. Install Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### 2. Stop the Frontend Container Temporarily

```bash
docker compose -f docker-compose.prod.yml stop frontend
```

### 3. Obtain SSL Certificate

```bash
# Replace with your actual domain
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts:
- Enter your email
- Agree to terms
- Choose whether to share your email

Certificates will be saved to:
- `/etc/letsencrypt/live/yourdomain.com/fullchain.pem`
- `/etc/letsencrypt/live/yourdomain.com/privkey.pem`

### 4. Update Nginx Configuration

Create a new nginx config for SSL:

```bash
nano /root/gilamchi/frontend/nginx-ssl.conf
```

Add this content:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # HSTS (optional but recommended)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

### 5. Update docker-compose.prod.yml

Edit the docker-compose file:

```bash
nano docker-compose.prod.yml
```

Update the frontend service to mount SSL certificates:

```yaml
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: always
    ports:
      - "80:80"
      - "443:443"  # Add HTTPS port
    depends_on:
      - backend
    volumes:
      # Mount SSL certificates
      - /etc/letsencrypt:/etc/letsencrypt:ro
      # Use SSL nginx config
      - ./frontend/nginx-ssl.conf:/etc/nginx/conf.d/default.conf:ro
```

### 6. Restart Services

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 7. Test HTTPS

Visit: `https://yourdomain.com`

### 8. Auto-Renew SSL Certificates

Let's Encrypt certificates expire after 90 days. Set up auto-renewal:

```bash
# Test renewal
certbot renew --dry-run

# If successful, certbot will auto-renew via cron
# Check the cron job:
systemctl status certbot.timer
```

---

## Domain Configuration

### 1. Point Your Domain to Contabo VPS

In your domain registrar's control panel (e.g., Namecheap, GoDaddy, etc.):

**Add A Records:**
```
Type: A
Host: @
Value: YOUR_VPS_IP
TTL: 3600

Type: A
Host: www
Value: YOUR_VPS_IP
TTL: 3600
```

**Wait for DNS propagation** (can take 5 minutes to 48 hours, usually ~30 minutes)

### 2. Verify DNS

```bash
# Check if domain points to your IP
nslookup yourdomain.com
dig yourdomain.com
```

---

## Monitoring & Maintenance

### 1. View Application Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f db
```

### 2. Monitor Resource Usage

```bash
# Real-time monitoring
htop

# Docker stats
docker stats

# Disk usage
df -h

# Check PostgreSQL size
docker compose -f docker-compose.prod.yml exec db psql -U gilamchi_user -d gilamchi_db -c "SELECT pg_size_pretty(pg_database_size('gilamchi_db'));"
```

### 3. Restart Services

```bash
# Restart all services
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend
```

### 4. Update Application

```bash
# Pull latest code
cd /root/gilamchi
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Backup Strategy

### 1. Database Backup

**Manual Backup:**
```bash
# Create backup directory
mkdir -p /root/backups

# Backup database
docker compose -f docker-compose.prod.yml exec db pg_dump -U gilamchi_user gilamchi_db > /root/backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

**Automated Daily Backups:**

Create a backup script:
```bash
nano /root/backup-db.sh
```

Add this content:
```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/gilamchi_backup_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform backup
cd /root/gilamchi
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U gilamchi_user gilamchi_db > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Delete backups older than 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

Make it executable:
```bash
chmod +x /root/backup-db.sh
```

**Schedule Daily Backups:**
```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /root/backup-db.sh >> /var/log/backup.log 2>&1
```

### 2. Restore from Backup

```bash
# Stop backend
docker compose -f docker-compose.prod.yml stop backend

# Restore database
gunzip -c /root/backups/gilamchi_backup_YYYYMMDD_HHMMSS.sql.gz | docker compose -f docker-compose.prod.yml exec -T db psql -U gilamchi_user gilamchi_db

# Restart backend
docker compose -f docker-compose.prod.yml start backend
```

### 3. Use Contabo Snapshots

Contabo Cloud VPS 10 includes **1 free snapshot**. Use it wisely:

1. Log in to Contabo Control Panel
2. Navigate to your VPS
3. Click "Create Snapshot"
4. Name it (e.g., "Before major update")

**Best practice:** Create a snapshot before major updates or changes.

---

## Performance Optimization

### 1. Optimize PostgreSQL for 8GB RAM

Edit PostgreSQL settings:

```bash
# Access PostgreSQL container
docker compose -f docker-compose.prod.yml exec db bash

# Edit postgresql.conf
apt update && apt install -y nano
nano /var/lib/postgresql/data/postgresql.conf
```

Add/modify these settings:
```conf
# Memory Settings (optimized for 8GB RAM)
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
work_mem = 32MB

# Connection Settings
max_connections = 100

# Performance
random_page_cost = 1.1  # For NVMe/SSD
effective_io_concurrency = 200

# Logging (optional, for debugging)
log_min_duration_statement = 1000  # Log slow queries (>1s)
```

Restart database:
```bash
exit
docker compose -f docker-compose.prod.yml restart db
```

### 2. Optimize Backend Workers

Edit `.env.prod`:
```bash
nano .env.prod
```

With 8GB RAM and 4 vCPU, you can run multiple workers:
```env
# Recommended: (CPU cores * 2) + 1 = 9 workers
# But start conservative with 4
WORKERS=4
```

Update `docker-compose.prod.yml`:
```yaml
  backend:
    # ...
    environment:
      - WORKERS=4  # Adjust based on load
```

Restart:
```bash
docker compose -f docker-compose.prod.yml restart backend
```

### 3. Enable Redis Caching (Optional)

Add Redis to `docker-compose.prod.yml`:

```yaml
  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:  # Add this
```

Update backend environment:
```yaml
  backend:
    environment:
      - REDIS_URL=redis://redis:6379
```

Restart:
```bash
docker compose -f docker-compose.prod.yml up -d
```

---

## Troubleshooting

### Problem: Cannot connect to VPS

**Solution:**
```bash
# Check if SSH is running
systemctl status sshd

# Check firewall
ufw status

# Ensure port 22 is allowed
ufw allow 22/tcp
```

### Problem: Website not loading

**Solution:**
```bash
# Check if containers are running
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs -f

# Restart services
docker compose -f docker-compose.prod.yml restart
```

### Problem: Database connection errors

**Solution:**
```bash
# Check database health
docker compose -f docker-compose.prod.yml exec db pg_isready -U gilamchi_user

# Check database logs
docker compose -f docker-compose.prod.yml logs db

# Verify credentials in .env.prod
cat .env.prod | grep POSTGRES
```

### Problem: Out of disk space

**Solution:**
```bash
# Check disk usage
df -h

# Clean Docker images and containers
docker system prune -a

# Clean old logs
journalctl --vacuum-time=7d
```

### Problem: High memory usage

**Solution:**
```bash
# Check memory
free -h

# Check which container uses most memory
docker stats

# Reduce backend workers in .env.prod
# WORKERS=2
```

### Problem: SSL certificate renewal fails

**Solution:**
```bash
# Stop frontend temporarily
docker compose -f docker-compose.prod.yml stop frontend

# Renew manually
certbot renew

# Restart frontend
docker compose -f docker-compose.prod.yml start frontend
```

---

## Useful Commands Reference

```bash
# View all running containers
docker compose -f docker-compose.prod.yml ps

# Stop all services
docker compose -f docker-compose.prod.yml down

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# View logs (all services)
docker compose -f docker-compose.prod.yml logs -f

# View logs (specific service)
docker compose -f docker-compose.prod.yml logs -f backend

# Execute command in container
docker compose -f docker-compose.prod.yml exec backend bash

# Check resource usage
docker stats

# Clean unused Docker resources
docker system prune -a

# Backup database
docker compose -f docker-compose.prod.yml exec db pg_dump -U gilamchi_user gilamchi_db > backup.sql

# Restore database
cat backup.sql | docker compose -f docker-compose.prod.yml exec -T db psql -U gilamchi_user gilamchi_db
```

---

## Next Steps

After successful deployment:

1. ✅ **Test all functionality** - Create products, make sales, test user roles
2. ✅ **Setup SSL/HTTPS** - Essential for production
3. ✅ **Configure automated backups** - Protect your data
4. ✅ **Monitor performance** - Use `htop` and `docker stats`
5. ✅ **Setup domain** - Professional appearance
6. ✅ **Create Contabo snapshot** - Before any major changes

---

## Support & Resources

- **Contabo Support**: https://contabo.com/support/
- **Docker Documentation**: https://docs.docker.com/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Let's Encrypt**: https://letsencrypt.org/

---

**Congratulations! Your Gilamchi application is now running on Contabo Cloud VPS 10! 🎉**
