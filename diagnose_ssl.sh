#!/bin/bash

# SSL Diagnostic Script for Gilamchi
# This script helps identify why your SSL certificate might not be working.

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=========================================="
echo "Gilamchi SSL Diagnostic Tool"
echo "=========================================="

# 1. Check Public IP
echo -e "\n${YELLOW}1. Checking Public IP...${NC}"
PUBLIC_IP=$(curl -s ifconfig.me)
echo "Current Public IP: $PUBLIC_IP"

# 2. Check Configured Domain/IP
echo -e "\n${YELLOW}2. Checking Nginx Configuration...${NC}"
if [ -f "frontend/nginx-ssl.conf" ]; then
    CONFIG_DOMAIN=$(grep "server_name" frontend/nginx-ssl.conf | head -n 1 | awk '{print $2}' | sed 's/;//')
    echo "Configured domain in nginx-ssl.conf: $CONFIG_DOMAIN"
    
    if [[ "$CONFIG_DOMAIN" == *"$PUBLIC_IP"* ]]; then
        echo -e "${GREEN}✓ Domain matches current IP (using sslip.io)${NC}"
    else
        echo -e "${RED}✗ Domain does NOT match current IP!${NC}"
        echo "If you moved your server, you need to update nginx-ssl.conf"
    fi
else
    echo -e "${RED}✗ frontend/nginx-ssl.conf not found!${NC}"
fi

# 3. Check Certificate Files
echo -e "\n${YELLOW}3. Checking Certificate Files...${NC}"
CERT_PATH="/etc/letsencrypt/live/$CONFIG_DOMAIN"
if [ -d "$CERT_PATH" ]; then
    echo -e "${GREEN}✓ Certificate directory found: $CERT_PATH${NC}"
    
    if [ -f "$CERT_PATH/fullchain.pem" ]; then
        echo -e "${GREEN}✓ fullchain.pem found${NC}"
        # Check expiration
        EXPIRY=$(openssl x509 -enddate -noout -in "$CERT_PATH/fullchain.pem" | cut -d= -f2)
        echo "Certificate expires on: $EXPIRY"
        
        # Check if expired
        if openssl x509 -checkend 0 -noout -in "$CERT_PATH/fullchain.pem"; then
            echo -e "${GREEN}✓ Certificate is still valid${NC}"
        else
            echo -e "${RED}✗ Certificate has EXPIRED!${NC}"
        fi
    else
        echo -e "${RED}✗ fullchain.pem NOT found!${NC}"
    fi
else
    echo -e "${RED}✗ Certificate directory NOT found for $CONFIG_DOMAIN${NC}"
    echo "Possible locations in /etc/letsencrypt/live/:"
    ls /etc/letsencrypt/live/ 2>/dev/null || echo "None found"
fi

# 4. Check Docker Containers
echo -e "\n${YELLOW}4. Checking Docker Containers...${NC}"
if command -v docker &> /dev/null; then
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep frontend || echo "Frontend container not running"
else
    echo "Docker not found"
fi

# 5. Check Ports
echo -e "\n${YELLOW}5. Checking Ports...${NC}"
echo "Port 80 (HTTP):"
ss -tuln | grep :80 || echo "Nothing listening on port 80"
echo "Port 443 (HTTPS):"
ss -tuln | grep :443 || echo "Nothing listening on port 443"

echo -e "\n${YELLOW}=== Summary & Recommendations ===${NC}"
if [ ! -d "$CERT_PATH" ]; then
    echo "Recommendation: You need to generate a certificate. Run:"
    echo "certbot certonly --standalone -d YOUR_DOMAIN"
fi

echo -e "\nDone."
