# Docker Deployment - Quick Reference

## Daily Commands

```bash
# Start application
./deploy.sh up

# Stop application  
./deploy.sh down

# Restart (after .env changes)
./deploy.sh restart

# Update (after code changes)
./deploy.sh update

# View logs
./deploy.sh logs

# Check status
./deploy.sh status
```

## Data Management

```bash
# Backup database
./backup-docker-db.sh

# Copy local database to Docker
./copy-db-to-docker.sh

# Restore from backup
docker cp backup_docker_YYYYMMDD_HHMMSS.db inventory-tracker:/app/backend/data/inventory.db
./deploy.sh restart
```

## Will My Data Survive?

| Action | Data Safe? |
|--------|-----------|
| `./deploy.sh restart` | ✅ Yes |
| `./deploy.sh update` | ✅ Yes |
| `./deploy.sh down && up` | ✅ Yes |
| `git pull && ./deploy.sh update` | ✅ Yes |
| Rebuild image | ✅ Yes |
| Reboot computer | ✅ Yes |
| `./deploy.sh clean` | ❌ **NO!** (if you confirm) |
| `docker volume rm` | ❌ **NO!** |

## Access URLs

- **Frontend:** http://localhost:8081
- **Backend API:** http://localhost:8081/api
- **Health Check:** `curl http://localhost:8081/api`

## Troubleshooting

```bash
# Container won't start?
./deploy.sh logs

# Port already in use?
# Edit .env: FRONTEND_PORT=8082
./deploy.sh restart

# Database missing?
./copy-db-to-docker.sh

# Clean rebuild
./deploy.sh clean
./deploy.sh update
```

## Backup Strategy

**Daily backup (automated):**
```bash
# Add to crontab
crontab -e
# Add: 0 2 * * * cd /path/to/inventory-tracker && ./backup-docker-db.sh
```

**Manual backup before updates:**
```bash
./backup-docker-db.sh
git pull
./deploy.sh update
```

## Container Info

**Name:** inventory-tracker  
**Image:** inventory-tracker-app  
**Volume:** inventory-tracker_app_data  
**Ports:** 8081 (external) → 8080 (container)

## Quick Checks

```bash
# Is it running?
docker ps | grep inventory-tracker

# How much space?
docker exec inventory-tracker du -sh /app/backend/data

# What's in the database?
docker exec inventory-tracker sh -c "cd backend && npx prisma studio"
# Then open: http://localhost:5555
```

## Emergency Recovery

```bash
# 1. Stop container
./deploy.sh down

# 2. Restore from backup
docker cp backup_docker_YYYYMMDD.db inventory-tracker:/app/backend/data/inventory.db

# 3. Start container
./deploy.sh up
```

## Environment Variables

**Edit `.env` file:**
- `FRONTEND_PORT=8081` - Port for accessing app
- `JWT_SECRET=...` - Change for security
- `DATABASE_URL=...` - Usually don't change
- `NODE_ENV=production` - Production mode
- `DEFAULT_VAT_RATE=0.25` - 25% VAT

**After changing .env:**
```bash
./deploy.sh restart
```

## Updates Workflow

```bash
# 1. Backup first
./backup-docker-db.sh

# 2. Get latest code
git pull

# 3. Update deployment
./deploy.sh update

# 4. Verify it works
open http://localhost:8081
```

## Remember

- ✅ Data persists across updates
- ✅ Always backup before major changes
- ✅ Volume = permanent storage
- ✅ Container = temporary (gets replaced)
- ✅ `./deploy.sh update` rebuilds container, keeps data
