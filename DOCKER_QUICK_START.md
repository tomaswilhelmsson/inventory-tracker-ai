# Docker Quick Start

Get the Inventory Tracker running in Docker in 3 steps.

## Quick Setup

```bash
# 1. Create .env file
cp .env.docker .env

# 2. Edit .env and change JWT_SECRET
nano .env

# 3. Deploy
./deploy.sh update
```

That's it! Access at **http://localhost:8080**

## Single Container Setup

This uses a **simple single-container setup** (like your WooCommerce app):
- ✅ One container for everything
- ✅ Frontend served on port 8080
- ✅ Backend API on same container
- ✅ Simple and easy to manage

## Common Commands

```bash
./deploy.sh build    # Build image
./deploy.sh up       # Start container
./deploy.sh down     # Stop container
./deploy.sh restart  # Restart container
./deploy.sh update   # Rebuild and restart
./deploy.sh logs     # View logs
./deploy.sh status   # Check status
./deploy.sh clean    # Remove old images
```

## Using Your Existing Database

Copy your local database to Docker:
```bash
./copy-db-to-docker.sh
```

This copies `backend/prisma/data/inventory.db` to the container.

## Database Backup & Restore

**Backup:**
```bash
./backup-docker-db.sh
# Creates: backup_docker_YYYYMMDD_HHMMSS.db
```

**Restore:**
```bash
docker cp backup_docker_20260104_123456.db inventory-tracker:/app/backend/data/inventory.db
./deploy.sh restart
```

## Ports

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8080/api (proxied)

Everything runs on **one port** from **one container**!

## Troubleshooting

### Port already in use?

```bash
# Check what's using port 8080
lsof -i :8080

# Kill it or use different port in .env
FRONTEND_PORT=8081
```

### Container won't start?

```bash
# Check logs
./deploy.sh logs

# Rebuild from scratch
./deploy.sh clean
./deploy.sh update
```

### Lost your data?

```bash
# Restore from backup
docker cp backup_docker_*.db inventory-tracker:/app/backend/data/inventory.db
./deploy.sh restart
```

## Notes

- Uses SQLite database stored in Docker volume
- Data persists across container restarts
- One simple container (not separate frontend/backend)
- Perfect for personal/internal use
