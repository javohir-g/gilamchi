#!/bin/bash

# Restore Database Script for Gilamchi
# Usage: ./restore-db.sh /path/to/backup.sql.gz

set -e

PROJECT_DIR="/root/gilamchi"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: No backup file specified${NC}"
    echo "Usage: $0 /path/to/backup.sql.gz"
    echo ""
    echo "Available backups:"
    ls -lh /root/backups/*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}=========================================="
echo "Database Restore"
echo "==========================================${NC}"
echo ""
echo -e "${YELLOW}Backup file: $BACKUP_FILE${NC}"
echo ""
echo -e "${RED}⚠️  WARNING: This will REPLACE all current data!${NC}"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

cd $PROJECT_DIR

# Stop backend to prevent new connections
echo -e "${YELLOW}Stopping backend...${NC}"
docker compose -f docker-compose.prod.yml stop backend

# Restore database
echo -e "${YELLOW}Restoring database...${NC}"
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | docker compose -f docker-compose.prod.yml exec -T db psql -U gilamchi_user gilamchi_db
else
    cat "$BACKUP_FILE" | docker compose -f docker-compose.prod.yml exec -T db psql -U gilamchi_user gilamchi_db
fi

# Restart backend
echo -e "${YELLOW}Restarting backend...${NC}"
docker compose -f docker-compose.prod.yml start backend

echo ""
echo -e "${GREEN}✓ Database restored successfully!${NC}"
echo ""
