# Switching to Simple Single-Container Setup

## What Changed

**Before (complex):**
- Two separate containers (frontend + backend)
- Nginx for frontend, Node for backend
- Complex docker-compose.yml

**After (simple):**
- One container (everything together)
- Like your WooCommerce app
- Simple docker-compose.simple.yml

## How to Switch

### Step 1: Stop Old Setup

```bash
# Stop and remove old containers
docker-compose down

# Optional: Remove old images
docker rmi inventory-tracker-backend inventory-tracker-frontend
```

### Step 2: Backup Your Database (Important!)

```bash
# If containers are still running, backup first
docker cp inventory-tracker-backend:/app/backend/data/inventory.db ./backup-before-switch.db

# Or use your local database
cp backend/prisma/data/inventory.db ./backup-before-switch.db
```

### Step 3: Deploy New Setup

```bash
# Make sure .env is configured
cat .env  # Check it exists

# Deploy with new simple setup
./deploy.sh update

# The script now uses docker-compose.simple.yml automatically!
```

### Step 4: Copy Your Database

```bash
# Copy your existing database to new container
./copy-db-to-docker.sh

# Or manually
docker cp backup-before-switch.db inventory-tracker:/app/backend/data/inventory.db
./deploy.sh restart
```

### Step 5: Verify

```bash
# Check status
./deploy.sh status

# Access the app
open http://localhost:8080

# Check logs
./deploy.sh logs
```

## What's Different

### Access URLs

**Before:**
- Frontend: http://localhost:8080
- Backend: http://localhost:3000

**After:**
- Everything: http://localhost:8080
- API calls proxied automatically

### Container Names

**Before:**
- `inventory-tracker-frontend`
- `inventory-tracker-backend`

**After:**
- `inventory-tracker` (one container)

### Database Location

**Before:**
- `inventory-tracker-backend:/app/backend/data/inventory.db`

**After:**
- `inventory-tracker:/app/backend/data/inventory.db`

### Commands

All commands stay the same:
```bash
./deploy.sh build
./deploy.sh up
./deploy.sh down
./deploy.sh restart
./deploy.sh update
./deploy.sh logs
./deploy.sh status
```

They just use `docker-compose.simple.yml` now!

## Files Updated

- ✅ `deploy.sh` - Now uses docker-compose.simple.yml
- ✅ `copy-db-to-docker.sh` - Updated for single container
- ✅ `backup-docker-db.sh` - Updated for single container
- ✅ `DOCKER_QUICK_START.md` - Updated guide

## Cleanup Old Setup

After verifying the new setup works:

```bash
# Remove orphaned old containers
docker-compose down --remove-orphans

# Remove old volumes (if you don't need them)
docker volume ls | grep inventory
docker volume rm inventory-tracker_backend_data  # Old volume
docker volume rm inventory-tracker_backend_uploads  # Old volume
```

## Rollback (If Needed)

If you need to go back to the old two-container setup:

```bash
# Edit deploy.sh and change:
COMPOSE_FILE="docker-compose.yml"  # Instead of docker-compose.simple.yml

# Then deploy
./deploy.sh update
```

## Benefits of New Setup

✅ **Simpler** - One container instead of two  
✅ **Familiar** - Matches your WooCommerce setup  
✅ **Easier** - Less complexity to manage  
✅ **Same performance** - For your use case  
✅ **Same functionality** - Everything still works  

## Summary

The new setup is:
- **Simpler** ✓
- **Easier to understand** ✓  
- **Matches your WooCommerce pattern** ✓
- **Perfect for personal/internal use** ✓

Just run `./deploy.sh update` and you're switched!
