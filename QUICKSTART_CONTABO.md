# Quick Start Guide - Contabo VPS Deployment

This is a quick reference for deploying Gilamchi on Contabo Cloud VPS 10.

For detailed instructions, see [CONTABO_DEPLOYMENT.md](./CONTABO_DEPLOYMENT.md)

## 🚀 Quick Deployment (5 minutes)

### 1. Connect to VPS
```bash
ssh root@YOUR_VPS_IP
```

### 2. Clone Repository
```bash
cd /root
git clone https://github.com/YOUR_USERNAME/gilamchi.git
cd gilamchi
```

### 3. Run Automated Deployment
```bash
chmod +x deploy.sh
bash deploy.sh
```

The script will:
- ✅ Update system
- ✅ Install Docker
- ✅ Configure firewall
- ✅ Setup environment
- ✅ Build and start application

### 4. Access Your Application
```
http://YOUR_VPS_IP
```

## 📋 Manual Deployment

If you prefer manual setup:

```bash
# 1. Update system
apt update && apt upgrade -y

# 2. Install Docker
curl -fsSL https://get.docker.com | sh

# 3. Configure environment
cp .env.prod.example .env.prod
nano .env.prod  # Edit passwords and secrets

# 4. Deploy
docker compose -f docker-compose.prod.yml up -d --build
```

## 🔐 SSL/HTTPS Setup

```bash
# 1. Install Certbot
apt install -y certbot python3-certbot-nginx

# 2. Stop frontend temporarily
docker compose -f docker-compose.prod.yml stop frontend

# 3. Get certificate
certbot certonly --standalone -d yourdomain.com

# 4. Update nginx config (see CONTABO_DEPLOYMENT.md)

# 5. Restart
docker compose -f docker-compose.prod.yml up -d
```

## 🔧 Useful Commands

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart services
docker compose -f docker-compose.prod.yml restart

# Stop everything
docker compose -f docker-compose.prod.yml down

# Update application
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build

# Backup database
chmod +x backup-db.sh
./backup-db.sh

# Restore database
chmod +x restore-db.sh
./restore-db.sh /root/backups/backup_file.sql.gz
```

## 📊 Monitoring

```bash
# Resource usage
htop

# Docker stats
docker stats

# Disk space
df -h

# Container status
docker compose -f docker-compose.prod.yml ps
```

## 🆘 Troubleshooting

**Website not loading?**
```bash
docker compose -f docker-compose.prod.yml logs -f
```

**Database errors?**
```bash
docker compose -f docker-compose.prod.yml exec db pg_isready -U gilamchi_user
```

**Out of space?**
```bash
docker system prune -a
```

## 📚 Documentation

- **Full Guide**: [CONTABO_DEPLOYMENT.md](./CONTABO_DEPLOYMENT.md)
- **Eskiz VPS Guide**: [VPS_DEPLOYMENT_ESKIZ.md](./VPS_DEPLOYMENT_ESKIZ.md)
- **General Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🎯 Contabo VPS 10 Specs

- **CPU**: 4 vCPU Cores
- **RAM**: 8 GB (perfect for CLIP AI model)
- **Storage**: 75 GB NVMe
- **Network**: 200 Mbit/s
- **Snapshots**: 1 included

## ✅ Post-Deployment Checklist

- [ ] Application accessible via IP
- [ ] SSL certificate installed
- [ ] Domain configured
- [ ] Automated backups setup
- [ ] Firewall configured
- [ ] Create Contabo snapshot
- [ ] Test all features

---

**Need help?** See the full deployment guide: [CONTABO_DEPLOYMENT.md](./CONTABO_DEPLOYMENT.md)
