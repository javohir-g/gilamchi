#!/bin/bash

# Database Backup Script for Gilamchi
# This script creates compressed backups of the PostgreSQL database

set -e

BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/gilamchi_backup_$DATE.sql"
PROJECT_DIR="/root/gilamchi"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Starting database backup...${NC}"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Navigate to project directory
cd $PROJECT_DIR

# Check if containers are running
if ! docker compose -f docker-compose.prod.yml ps | grep -q "db.*running"; then
    echo -e "${RED}Error: Database container is not running${NC}"
    exit 1
fi

# Perform backup
echo -e "${YELLOW}Creating backup: $BACKUP_FILE${NC}"
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U gilamchi_user gilamchi_db > $BACKUP_FILE

# Check if backup was successful
if [ $? -eq 0 ]; then
    # Compress backup
    echo -e "${YELLOW}Compressing backup...${NC}"
    gzip $BACKUP_FILE
    
    # Get file size
    SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)
    
    echo -e "${GREEN}✓ Backup completed successfully!${NC}"
    echo -e "${GREEN}  File: $BACKUP_FILE.gz${NC}"
    echo -e "${GREEN}  Size: $SIZE${NC}"
    
    # Delete backups older than 7 days
    echo -e "${YELLOW}Cleaning old backups (>7 days)...${NC}"
    DELETED=$(find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete -print | wc -l)
    echo -e "${GREEN}✓ Deleted $DELETED old backup(s)${NC}"
    
    # List all backups
    echo ""
    echo "Available backups:"
    ls -lh $BACKUP_DIR/*.sql.gz 2>/dev/null || echo "No backups found"
else
    echo -e "${RED}✗ Backup failed!${NC}"
    exit 1
fi
