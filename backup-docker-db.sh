#!/bin/bash

# Script to backup database from Docker container

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_docker_${TIMESTAMP}.db"

echo -e "${GREEN}Backing up Docker database...${NC}"

# Check if container is running
if ! docker ps | grep -q inventory-tracker; then
    echo -e "${RED}Error: Container is not running${NC}"
    echo "Start it with: ./deploy.sh up"
    exit 1
fi

# Copy database from container
echo "Copying database from container..."
docker cp inventory-tracker:/app/backend/data/inventory.db "./$BACKUP_FILE"

# Check if successful
if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    echo ""
    echo -e "${GREEN}✓ Backup created successfully!${NC}"
    echo "File: $BACKUP_FILE"
    echo "Size: $SIZE"
    echo ""
    echo "To restore this backup:"
    echo "  docker cp $BACKUP_FILE inventory-tracker:/app/backend/data/inventory.db"
    echo "  ./deploy.sh restart"
else
    echo -e "${RED}Error: Backup failed${NC}"
    exit 1
fi
