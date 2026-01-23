#!/bin/bash

# System Monitoring Script for Gilamchi on Contabo VPS
# This script provides a comprehensive overview of system health

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

clear
echo -e "${BLUE}=========================================="
echo "Gilamchi System Monitor"
echo "==========================================${NC}"
echo ""

# System Information
echo -e "${YELLOW}=== System Information ===${NC}"
echo "Hostname: $(hostname)"
echo "Uptime: $(uptime -p)"
echo "Load Average: $(uptime | awk -F'load average:' '{print $2}')"
echo ""

# CPU Usage
echo -e "${YELLOW}=== CPU Usage ===${NC}"
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}')
echo "CPU Usage: $CPU_USAGE"
echo ""

# Memory Usage
echo -e "${YELLOW}=== Memory Usage ===${NC}"
free -h | grep -E "Mem|Swap"
MEMORY_PERCENT=$(free | grep Mem | awk '{printf("%.1f%%", $3/$2 * 100.0)}')
echo "Memory Used: $MEMORY_PERCENT"
echo ""

# Disk Usage
echo -e "${YELLOW}=== Disk Usage ===${NC}"
df -h / | grep -v Filesystem
DISK_PERCENT=$(df / | grep / | awk '{print $5}')
echo "Root Partition: $DISK_PERCENT used"
echo ""

# Docker Containers Status
echo -e "${YELLOW}=== Docker Containers ===${NC}"
if command -v docker &> /dev/null; then
    cd /root/gilamchi 2>/dev/null || cd $(dirname "$0")
    
    if [ -f "docker-compose.prod.yml" ]; then
        docker compose -f docker-compose.prod.yml ps
    elif [ -f "docker-compose.contabo.yml" ]; then
        docker compose -f docker-compose.contabo.yml ps
    else
        echo "No docker-compose file found"
    fi
    
    echo ""
    echo -e "${YELLOW}=== Docker Resource Usage ===${NC}"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
else
    echo "Docker not installed"
fi
echo ""

# Database Size
echo -e "${YELLOW}=== Database Information ===${NC}"
cd /root/gilamchi 2>/dev/null || cd $(dirname "$0")
if [ -f "docker-compose.prod.yml" ] || [ -f "docker-compose.contabo.yml" ]; then
    COMPOSE_FILE=$([ -f "docker-compose.contabo.yml" ] && echo "docker-compose.contabo.yml" || echo "docker-compose.prod.yml")
    
    DB_SIZE=$(docker compose -f $COMPOSE_FILE exec -T db psql -U gilamchi_user -d gilamchi_db -t -c "SELECT pg_size_pretty(pg_database_size('gilamchi_db'));" 2>/dev/null | xargs)
    
    if [ ! -z "$DB_SIZE" ]; then
        echo "Database Size: $DB_SIZE"
        
        # Table sizes
        echo ""
        echo "Top 5 Largest Tables:"
        docker compose -f $COMPOSE_FILE exec -T db psql -U gilamchi_user -d gilamchi_db -c "
            SELECT 
                schemaname || '.' || tablename AS table,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
            LIMIT 5;
        " 2>/dev/null
    else
        echo "Database not accessible"
    fi
else
    echo "Docker Compose file not found"
fi
echo ""

# Application Health
echo -e "${YELLOW}=== Application Health ===${NC}"
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null)
if [ "$HEALTH_CHECK" = "200" ]; then
    echo -e "${GREEN}✓ Backend API: Healthy${NC}"
else
    echo -e "${RED}✗ Backend API: Unhealthy (HTTP $HEALTH_CHECK)${NC}"
fi

FRONTEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 2>/dev/null)
if [ "$FRONTEND_CHECK" = "200" ]; then
    echo -e "${GREEN}✓ Frontend: Healthy${NC}"
else
    echo -e "${RED}✗ Frontend: Unhealthy (HTTP $FRONTEND_CHECK)${NC}"
fi
echo ""

# Network
echo -e "${YELLOW}=== Network ===${NC}"
echo "Public IP: $(curl -s ifconfig.me 2>/dev/null || echo "Unable to fetch")"
echo "Open Ports:"
ss -tuln | grep LISTEN | awk '{print $5}' | sed 's/.*://' | sort -n | uniq
echo ""

# Recent Backups
echo -e "${YELLOW}=== Recent Backups ===${NC}"
if [ -d "/root/backups" ]; then
    BACKUP_COUNT=$(ls -1 /root/backups/*.sql.gz 2>/dev/null | wc -l)
    if [ $BACKUP_COUNT -gt 0 ]; then
        echo "Total Backups: $BACKUP_COUNT"
        echo "Latest Backups:"
        ls -lht /root/backups/*.sql.gz 2>/dev/null | head -3 | awk '{print $9, "("$5")", $6, $7, $8}'
    else
        echo -e "${YELLOW}No backups found${NC}"
    fi
else
    echo -e "${YELLOW}Backup directory not found${NC}"
fi
echo ""

# Warnings
echo -e "${YELLOW}=== Warnings ===${NC}"
WARNINGS=0

# Check disk space
DISK_USAGE=$(df / | grep / | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo -e "${RED}⚠ Disk usage is above 80%${NC}"
    WARNINGS=$((WARNINGS+1))
fi

# Check memory
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
if [ $MEMORY_USAGE -gt 90 ]; then
    echo -e "${RED}⚠ Memory usage is above 90%${NC}"
    WARNINGS=$((WARNINGS+1))
fi

# Check if containers are running
if command -v docker &> /dev/null; then
    RUNNING_CONTAINERS=$(docker ps --filter "status=running" | grep -c gilamchi 2>/dev/null || echo "0")
    if [ $RUNNING_CONTAINERS -lt 3 ]; then
        echo -e "${RED}⚠ Not all containers are running (expected 3, found $RUNNING_CONTAINERS)${NC}"
        WARNINGS=$((WARNINGS+1))
    fi
fi

if [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ No warnings${NC}"
fi

echo ""
echo -e "${BLUE}=========================================="
echo "Monitoring Complete"
echo "==========================================${NC}"
echo ""
echo "Tip: Run 'watch -n 5 ./monitor.sh' for live monitoring"
echo ""
