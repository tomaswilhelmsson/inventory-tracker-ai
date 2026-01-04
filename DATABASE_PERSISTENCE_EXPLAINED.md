# Database Persistence - Will Your Data Survive Updates?

## Short Answer

✅ **YES** - Your data persists across updates!

## How Docker Volumes Work

Your database is stored in a **Docker volume**, not in the container itself:

```
┌─────────────────────────────────────┐
│  Container (gets recreated)         │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Application Code             │  │ ← Replaced during update
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Database (points to volume)  │  │ ← Just a pointer
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
             ↓ (mounts)
┌─────────────────────────────────────┐
│  Docker Volume (permanent storage)  │
│                                     │
│  inventory.db (240KB)               │ ← Your actual data
│  - Products                         │
│  - Suppliers                        │
│  - Purchases                        │
│  - Year-end counts                  │
└─────────────────────────────────────┘
```

## Data Persists Through

✅ **Container restart**
```bash
./deploy.sh restart
# Your data: Still there ✓
```

✅ **Container rebuild**
```bash
./deploy.sh update
# Your data: Still there ✓
```

✅ **Container removal and recreation**
```bash
./deploy.sh down
./deploy.sh up
# Your data: Still there ✓
```

✅ **Code updates**
```bash
git pull
./deploy.sh update
# Your data: Still there ✓
```

✅ **Image rebuild**
```bash
docker-compose -f docker-compose.simple.yml build
./deploy.sh up
# Your data: Still there ✓
```

## Data is LOST Only When

❌ **Volume is explicitly deleted**
```bash
docker volume rm inventory-tracker_app_data
# Your data: GONE! ✗
```

❌ **Clean with volume removal**
```bash
./deploy.sh clean
# Prompts: "This will remove volumes"
# If you say YES: Data is gone ✗
```

## Where is Your Data?

### Physical Location

```bash
# Check volume details
docker volume inspect inventory-tracker_app_data

# Output shows something like:
# "Mountpoint": "/var/lib/docker/volumes/inventory-tracker_app_data/_data"
```

### List Volumes

```bash
docker volume ls | grep inventory

# Shows:
# inventory-tracker_app_data
```

### Check Volume Size

```bash
docker exec inventory-tracker du -sh /app/backend/data/

# Shows something like:
# 240K    /app/backend/data/
```

## Update Scenarios

### Scenario 1: Code Change Only

```bash
# You modified backend/frontend code
git pull

./deploy.sh update
```

**What happens:**
1. ✅ Stops container
2. ✅ Rebuilds image with new code
3. ✅ Creates new container
4. ✅ **Mounts same volume** (data intact)
5. ✅ Runs migrations (if any)
6. ✅ Starts with your data

**Result:** Data persists ✓

### Scenario 2: Database Schema Change

```bash
# You added a migration (new column, table, etc.)
git pull

./deploy.sh update
```

**What happens:**
1. ✅ Stops container
2. ✅ Rebuilds image
3. ✅ Creates new container
4. ✅ Mounts same volume (old data)
5. ✅ Runs `npx prisma migrate deploy`
6. ✅ Updates schema (adds column, etc.)
7. ✅ Keeps existing data

**Result:** Data persists + schema updated ✓

### Scenario 3: Complete System Restart

```bash
# Reboot your computer
# Start Docker
./deploy.sh up
```

**What happens:**
1. ✅ Docker starts
2. ✅ Container starts
3. ✅ Mounts volume
4. ✅ All your data is there

**Result:** Data persists ✓

## How docker-compose.simple.yml Ensures This

```yaml
volumes:
  - app_data:/app/backend/data
```

This line means:
- Container path: `/app/backend/data`
- Stored in: Docker volume `app_data`
- Persists: Even when container is deleted

## Backup Your Data (Best Practice)

Even though data persists, **always backup important data!**

### Manual Backup

```bash
# Backup (creates timestamped file)
./backup-docker-db.sh

# Creates: backup_docker_20260104_152030.db
```

### Automated Backup (Recommended)

Add to crontab:
```bash
# Backup every day at 2 AM
crontab -e

# Add this line:
0 2 * * * cd /home/mrsun/code/inventory-tracker && ./backup-docker-db.sh
```

### Before Major Updates

```bash
# Always backup before major changes!
./backup-docker-db.sh

# Then update
./deploy.sh update
```

## Restore Data

If something goes wrong:

```bash
# Restore from backup
docker cp backup_docker_20260104_152030.db inventory-tracker:/app/backend/data/inventory.db

# Restart
./deploy.sh restart
```

## Volume Management

### List all volumes

```bash
docker volume ls
```

### Inspect volume

```bash
docker volume inspect inventory-tracker_app_data
```

### Backup entire volume (advanced)

```bash
# Backup volume to tar file
docker run --rm \
  -v inventory-tracker_app_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/volume-backup.tar.gz /data

# Restore volume from tar file
docker run --rm \
  -v inventory-tracker_app_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/volume-backup.tar.gz -C /
```

## Testing Data Persistence

Want to verify? Try this:

```bash
# 1. Check current data
docker exec inventory-tracker sh -c "ls -lh /app/backend/data/"

# 2. Rebuild everything
./deploy.sh down
./deploy.sh build
./deploy.sh up

# 3. Check data again
docker exec inventory-tracker sh -c "ls -lh /app/backend/data/"

# Same files? Data persisted! ✓
```

## Summary

### Data PERSISTS through:
- ✅ Restarts
- ✅ Rebuilds  
- ✅ Updates
- ✅ Code changes
- ✅ Container recreation
- ✅ Image changes
- ✅ System reboots

### Data is LOST only when:
- ❌ Volume is explicitly deleted
- ❌ `./deploy.sh clean` + confirm removal
- ❌ `docker volume rm inventory-tracker_app_data`

### Best Practice:
- ✅ Backup regularly with `./backup-docker-db.sh`
- ✅ Backup before major updates
- ✅ Store backups off-server
- ✅ Test restore procedure

**Your data is safe across updates!** 🎉
