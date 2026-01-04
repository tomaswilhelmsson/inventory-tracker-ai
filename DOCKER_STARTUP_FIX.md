# Docker Deployment - Backend Startup Issue Fixed

## Problem

The backend container was failing to start with this error:
```
Error: Prisma schema validation - (get-config wasm)
Error code: P1012
error: Error validating datasource `db`: the URL must start with the protocol `file:`.
```

## Root Cause

The `.env` file contained a PostgreSQL DATABASE_URL from the initial Docker setup:
```env
DATABASE_URL=postgresql://inventory:change-this-secure-password@postgres:5432/inventory
```

But the Prisma schema is configured for SQLite:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

## Solution

### Option 1: Quick Fix (Recommended)

Use the provided script:

```bash
./fix-env-for-docker.sh
```

This will:
1. Backup your current .env to .env.backup
2. Create a new .env from .env.docker with correct SQLite configuration
3. Prompt you to edit JWT_SECRET

Then reload the containers:
```bash
./deploy.sh reload
```

### Option 2: Manual Fix

Edit your `.env` file and ensure these values:

```env
# Database URL (SQLite - data persisted in Docker volume)
DATABASE_URL=file:/app/backend/data/inventory.db

# Authentication  
JWT_SECRET=your-secret-key-change-in-production

# Server Configuration
PORT=3000
NODE_ENV=production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:8080

# Frontend Configuration
FRONTEND_PORT=8080
VITE_API_URL=http://localhost:3000

# VAT Configuration
DEFAULT_VAT_RATE=0.25
```

Then reload:
```bash
./deploy.sh reload
```

## Why SQLite for Docker?

**Advantages:**
- ✓ No separate database container needed
- ✓ Simpler setup and management
- ✓ Perfect for small to medium deployments
- ✓ Data persisted in Docker volume
- ✓ Easy backups (just copy the .db file)

**When you might want PostgreSQL:**
- Heavy concurrent write loads
- Need advanced database features
- Large-scale production deployment
- Multi-container orchestration

## Verify It's Working

After applying the fix:

```bash
# Check container status
./deploy.sh status

# View logs
./deploy.sh logs

# You should see:
# 🚀 Server running on http://localhost:3000
```

Access the application:
- Frontend: http://localhost:8080
- Backend: http://localhost:3000
- Health Check: http://localhost:3000/health

## Database Location

With SQLite in Docker:
- Database file: `/app/backend/data/inventory.db` (inside container)
- Docker volume: `inventory-tracker_backend_data`
- Persisted across container restarts

### Backup SQLite Database

```bash
# Create backup
docker cp inventory-tracker-backend:/app/backend/data/inventory.db ./backup.db

# Restore backup
docker cp ./backup.db inventory-tracker-backend:/app/backend/data/inventory.db
./deploy.sh restart
```

## Troubleshooting

### Container still failing?

```bash
# Check logs
docker-compose logs backend

# Check environment variables
docker inspect inventory-tracker-backend | grep DATABASE_URL

# Rebuild from scratch
./deploy.sh build-clean
./deploy.sh reload
```

### Database doesn't persist?

Make sure the Docker volume exists:
```bash
docker volume ls | grep backend_data
```

### Need to reset database?

```bash
./deploy.sh down
docker volume rm inventory-tracker_backend_data
./deploy.sh up
```

## Summary

- ✓ Docker now uses SQLite (simpler setup)
- ✓ Database persisted in Docker volume
- ✓ No PostgreSQL container needed
- ✓ Use `./fix-env-for-docker.sh` to update .env
- ✓ Run `./deploy.sh reload` to apply changes
