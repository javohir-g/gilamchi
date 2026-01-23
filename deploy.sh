#!/bin/bash

# Gilamchi Deployment Script for Contabo VPS
# This script automates the initial deployment process

set -e  # Exit on error

echo "=========================================="
echo "Gilamchi Deployment Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use: sudo bash deploy.sh)${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Updating system...${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}Step 2: Installing essential packages...${NC}"
apt install -y curl wget git nano ufw fail2ban htop

echo -e "${YELLOW}Step 3: Configuring firewall...${NC}"
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo -e "${GREEN}✓ Firewall configured${NC}"

echo -e "${YELLOW}Step 4: Installing Docker...${NC}"
# Remove old versions
apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Install prerequisites
apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Enable Docker
systemctl enable docker
systemctl start docker

echo -e "${GREEN}✓ Docker installed: $(docker --version)${NC}"
echo -e "${GREEN}✓ Docker Compose installed: $(docker compose version)${NC}"

echo -e "${YELLOW}Step 5: Checking for .env.prod file...${NC}"
if [ ! -f ".env.prod" ]; then
    echo -e "${YELLOW}Creating .env.prod from example...${NC}"
    cp .env.prod.example .env.prod
    
    echo -e "${RED}⚠️  IMPORTANT: You must edit .env.prod and change:${NC}"
    echo -e "${RED}   - POSTGRES_PASSWORD${NC}"
    echo -e "${RED}   - SECRET_KEY${NC}"
    echo -e "${RED}   - ALLOWED_HOSTS${NC}"
    echo -e "${RED}   - CORS_ORIGINS${NC}"
    echo ""
    echo -e "${YELLOW}Generate a secret key with:${NC}"
    echo "python3 -c \"import secrets; print(secrets.token_urlsafe(32))\""
    echo ""
    read -p "Press Enter to edit .env.prod now, or Ctrl+C to exit and edit manually..."
    nano .env.prod
else
    echo -e "${GREEN}✓ .env.prod already exists${NC}"
fi

echo -e "${YELLOW}Step 6: Building and starting Docker containers...${NC}"
echo -e "${YELLOW}This may take 5-10 minutes on first run (downloading CLIP model)...${NC}"
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo -e "${GREEN}=========================================="
echo "✓ Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "Your application should be running at:"
echo -e "${GREEN}http://$(curl -s ifconfig.me)${NC}"
echo ""
echo "Useful commands:"
echo "  View logs:    docker compose -f docker-compose.prod.yml logs -f"
echo "  Stop:         docker compose -f docker-compose.prod.yml down"
echo "  Restart:      docker compose -f docker-compose.prod.yml restart"
echo ""
echo "Next steps:"
echo "  1. Test your application in a browser"
echo "  2. Setup SSL/HTTPS (see CONTABO_DEPLOYMENT.md)"
echo "  3. Configure your domain"
echo "  4. Setup automated backups"
echo ""
