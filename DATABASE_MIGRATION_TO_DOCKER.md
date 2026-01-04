# Migrating Your Database to Docker

## Quick Migration

To copy your existing local database to the Docker container:

```bash
./copy-db-to-docker.sh
```

That's it! Your Docker deployment now has all your existing data.

## What This Does

1. Finds your local database: `backend/prisma/data/inventory.db`
2. Backs up any existing Docker database (if present)
3. Copies your local database to the container
4. Restarts the backend
5. Verifies the database is in place

## Manual Migration (Step by Step)

If you prefer to do it manually:

```bash
# 1. Make sure containers are running
./deploy.sh up

# 2. Copy database to container
docker cp backend/prisma/data/inventory.db inventory-tracker-backend:/app/backend/data/inventory.db

# 3. Restart backend
./deploy.sh restart

# 4. Verify
docker-compose exec backend sh -c "ls -lh /app/backend/data/inventory.db"
```

## Database Locations

**Local (development):**
- Path: `backend/prisma/data/inventory.db`
- Used by: `npm run dev:backend`

**Docker (production):**
- Container path: `/app/backend/data/inventory.db`
- Docker volume: `inventory-tracker_backend_data`
- Persisted across container restarts

## Backup Strategies

### Regular Backups

**Option 1: Automated script**
```bash
./backup-docker-db.sh
```

**Option 2: Manual backup**
```bash
docker cp inventory-tracker-backend:/app/backend/data/inventory.db ./backup_$(date +%Y%m%d).db
```

### Schedule Automatic Backups

Add to your crontab:
```bash
# Backup every day at 2 AM
0 2 * * * cd /home/mrsun/code/inventory-tracker && ./backup-docker-db.sh
```

## Restoring from Backup

```bash
# Restore specific backup
docker cp backup_docker_20260104_123456.db inventory-tracker-backend:/app/backend/data/inventory.db
./deploy.sh restart
```

## Syncing Between Local and Docker

### Copy Docker DB to Local
```bash
docker cp inventory-tracker-backend:/app/backend/data/inventory.db backend/prisma/data/inventory.db
```

### Copy Local DB to Docker
```bash
./copy-db-to-docker.sh
```

## Data Persistence

The database is stored in a Docker volume, which means:

✅ **Data persists** when you:
- Restart containers (`./deploy.sh restart`)
- Stop and start containers (`./deploy.sh down` then `./deploy.sh up`)
- Rebuild images (`./deploy.sh update`)

❌ **Data is lost** when you:
- Remove the volume (`docker volume rm inventory-tracker_backend_data`)
- Use `./deploy.sh clean` and confirm volume deletion

## Checking Your Data

### View database size
```bash
docker-compose exec backend sh -c "ls -lh /app/backend/data/inventory.db"
```

### Count records
```bash
docker-compose exec backend npx prisma studio
# Opens Prisma Studio to browse your data
```

### Query directly
```bash
docker-compose exec backend sh -c "sqlite3 /app/backend/data/inventory.db 'SELECT COUNT(*) FROM products;'"
```

## Volume Management

### List volumes
```bash
docker volume ls | grep inventory
```

### Inspect volume
```bash
docker volume inspect inventory-tracker_backend_data
```

### Backup entire volume
```bash
docker run --rm -v inventory-tracker_backend_data:/data -v $(pwd):/backup alpine tar czf /backup/volume-backup.tar.gz /data
```

### Restore entire volume
```bash
docker run --rm -v inventory-tracker_backend_data:/data -v $(pwd):/backup alpine tar xzf /backup/volume-backup.tar.gz -C /
```

## Migration Checklist

When moving from local development to Docker:

- [ ] Backup local database first
- [ ] Deploy Docker containers (`./deploy.sh update`)
- [ ] Copy database to Docker (`./copy-db-to-docker.sh`)
- [ ] Verify data in Docker (check products, suppliers, etc.)
- [ ] Set up regular backups (`./backup-docker-db.sh`)
- [ ] Test the application at http://localhost:8080
- [ ] Keep local database as fallback

## Troubleshooting

### Database not copying?
```bash
# Check if container is running
docker ps | grep backend

# Check local database exists
ls -lh backend/prisma/data/inventory.db
```

### Data not showing up?
```bash
# Check database permissions
docker-compose exec backend sh -c "ls -la /app/backend/data/"

# Restart backend
./deploy.sh restart
```

### Lost your data?
```bash
# If you have a backup
docker cp backup_docker_YYYYMMDD_HHMMSS.db inventory-tracker-backend:/app/backend/data/inventory.db
./deploy.sh restart

# If you have the local database
./copy-db-to-docker.sh
```

## Best Practices

1. **Always backup before major changes**
   ```bash
   ./backup-docker-db.sh
   ```

2. **Keep your local database in sync** (for development)
   ```bash
   docker cp inventory-tracker-backend:/app/backend/data/inventory.db backend/prisma/data/inventory.db
   ```

3. **Test backups regularly**
   ```bash
   # Create test backup
   ./backup-docker-db.sh
   
   # Try restoring it
   docker cp backup_docker_*.db inventory-tracker-backend:/app/backend/data/inventory.db
   ./deploy.sh restart
   ```

4. **Store backups off-server** (for production)
   - Upload to cloud storage (S3, Google Cloud, etc.)
   - Keep multiple versions
   - Test restore procedures

## Summary

✅ **Migrated**: Your local database is now in Docker  
✅ **Persistent**: Data survives container restarts  
✅ **Backed up**: Use `./backup-docker-db.sh` anytime  
✅ **Reversible**: Can always copy data back to local  

Your data is safe in Docker! 🎉
