#!/bin/bash

# Script to copy local database to Docker container

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Copying database to Docker container...${NC}"

# Check if local database exists
LOCAL_DB="backend/prisma/data/inventory.db"
if [ ! -f "$LOCAL_DB" ]; then
    echo -e "${RED}Error: Local database not found at $LOCAL_DB${NC}"
    exit 1
fi

# Get database size
DB_SIZE=$(ls -lh "$LOCAL_DB" | awk '{print $5}')
echo -e "Found local database: ${GREEN}$DB_SIZE${NC}"

# Check if container is running
if ! docker ps | grep -q inventory-tracker; then
    echo -e "${YELLOW}Container is not running. Starting it...${NC}"
    docker-compose -f docker-compose.simple.yml up -d
    sleep 3
fi

# Backup existing database in container (if any)
echo "Creating backup of container database..."
docker cp inventory-tracker:/app/backend/data/inventory.db ./backup-docker-db.db 2>/dev/null || echo "No existing database to backup"

# Copy local database to container
echo "Copying local database to container..."
docker cp "$LOCAL_DB" inventory-tracker:/app/backend/data/inventory.db

# Restart container to pick up new database
echo "Restarting container..."
docker-compose -f docker-compose.simple.yml restart

# Wait for startup
sleep 3

# Verify
echo ""
echo -e "${GREEN}✓ Database copied successfully!${NC}"
echo ""
docker exec inventory-tracker sh -c "ls -lh /app/backend/data/inventory.db"
echo ""
echo -e "${GREEN}Container is running with your local data!${NC}"
echo "Access: http://localhost:8080"
