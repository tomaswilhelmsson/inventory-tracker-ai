# Docker Deployment Efficiency Guide

This guide explains how to efficiently manage your Docker deployment without unnecessary rebuilds.

## The Problem with Always Rebuilding

When you run `./deploy.sh update`, it:
1. Stops all containers
2. **Rebuilds all Docker images** (5-10 minutes)
3. Restarts containers
4. Runs migrations

This is wasteful if you only changed environment variables!

## Smart Deployment Commands

We've added efficient commands for different scenarios:

### 1. restart - Fastest (0-5 seconds)
```bash
./deploy.sh restart
```

**When to use:**
- Service crashed and needs restarting
- No changes made, just want to restart
- Testing if restart fixes an issue

**What it does:**
- Restarts existing containers
- No rebuild, no recreation

**Time:** ~2-5 seconds

---

### 2. reload - Fast (10-30 seconds)
```bash
./deploy.sh reload
```

**When to use:**
- Changed .env file (ports, passwords, JWT_SECRET, etc.)
- Updated environment variables
- Changed configuration values

**What it does:**
- Stops containers
- **Recreates containers** with new environment
- **Does NOT rebuild images**
- Reuses existing Docker images

**Time:** ~10-30 seconds

**Example .env changes that only need reload:**
```bash
# Changed any of these? Use reload, not update!
JWT_SECRET=new-secret
PORT=3001
POSTGRES_PASSWORD=new-password
FRONTEND_PORT=8081
VITE_API_URL=http://localhost:3001
DEFAULT_VAT_RATE=0.20
```

---

### 3. update - Slow (5-10 minutes)
```bash
./deploy.sh update
```

**When to use:**
- Changed backend source code (TypeScript files)
- Changed frontend source code (Vue files)
- Updated package.json dependencies
- Changed Dockerfile or docker-compose.yml
- Changed Prisma schema

**What it does:**
- Stops containers
- **Rebuilds all Docker images**
- Recreates containers
- Runs migrations
- Cleans up old images

**Time:** ~5-10 minutes (depends on code size)

---

## Real-World Examples

### Example 1: Changed JWT Secret
```bash
# ❌ DON'T DO THIS (wastes 10 minutes)
nano .env  # Change JWT_SECRET
./deploy.sh update

# ✅ DO THIS (takes 20 seconds)
nano .env  # Change JWT_SECRET
./deploy.sh reload
```

### Example 2: Fixed a Bug in Backend
```bash
# ✅ CORRECT - code changed, need rebuild
nano backend/src/services/inventoryService.ts
./deploy.sh update
```

### Example 3: Updated Frontend Component
```bash
# ✅ CORRECT - code changed, need rebuild
nano frontend/src/views/DashboardView.vue
./deploy.sh update
```

### Example 4: Container Crashed
```bash
# ✅ FASTEST - just restart
./deploy.sh restart
```

### Example 5: Changed Multiple .env Values
```bash
# Edit multiple environment variables
nano .env
# PORT=3001
# FRONTEND_PORT=8081
# JWT_SECRET=new-secret

# ✅ CORRECT - only reload needed
./deploy.sh reload
```

---

## Performance Comparison

| Scenario | Bad Approach | Time | Good Approach | Time | Saved |
|----------|--------------|------|---------------|------|-------|
| Changed .env | `update` | 2-10 min | `reload` | 20 sec | Up to 9m 40s |
| Service crash | `update` | 2-10 min | `restart` | 5 sec | Up to 9m 55s |
| Changed code | `reload` | 20 sec | `update` | 1-2 min | ❌ Won't work! |
| Changed code | `build-clean` | 10 min | `update` | 1-2 min | 8 min |
| Changed package.json | `build-clean` | 10 min | `update` | 3-5 min | 5-7 min |

**Note:** With layer caching, `update` is now much faster (1-2 min instead of 10 min) for code changes!

---

## Decision Tree

```
What changed?
│
├─ Nothing (just crashed)
│  └─> ./deploy.sh restart (5 sec)
│
├─ .env file only
│  └─> ./deploy.sh reload (20 sec)
│
├─ Backend code (.ts files)
│  └─> ./deploy.sh update (10 min)
│
├─ Frontend code (.vue files)
│  └─> ./deploy.sh update (10 min)
│
├─ package.json / dependencies
│  └─> ./deploy.sh update (10 min)
│
├─ Dockerfile or docker-compose.yml
│  └─> ./deploy.sh update (10 min)
│
└─ Prisma schema
   └─> ./deploy.sh update (10 min)
```

---

## Understanding Docker Layers

**Why reload is fast:**
- Docker images are already built
- Only recreates containers with new environment
- Reuses cached image layers

**Why update is now faster:**
- Uses Docker layer caching intelligently
- Only rebuilds changed layers
- Package installation cached unless package.json changes
- TypeScript compilation cached unless source changes

### Docker Layer Caching Explained

Our Dockerfiles are optimized to use layer caching:

```dockerfile
# Layer 1: System packages (rarely changes) ✓ CACHED
RUN apk add --no-cache python3 make g++

# Layer 2: npm dependencies (only changes when package.json changes) ✓ CACHED
COPY package*.json ./
RUN npm ci

# Layer 3: Source code (changes frequently) ✗ REBUILT
COPY backend/src ./backend/src
RUN npm run build
```

**What this means for you:**

| You Changed | Layers Rebuilt | Packages Re-downloaded | Time |
|-------------|----------------|----------------------|------|
| Only source code | Layer 3 only | No | ~1-2 min |
| package.json | Layer 2 & 3 | Yes | ~3-5 min |
| Dockerfile | All layers | Yes | ~5-10 min |

**Before optimization:**
- Every build: Download gcc, python, all npm packages (~10 min)

**After optimization:**
- Changed code only: Reuse dependencies, rebuild code (~1-2 min)
- Changed dependencies: Reinstall packages, rebuild code (~3-5 min)

---

## When .env Changes DON'T Need Reload

Some .env values are baked into the build:

```bash
# These are used during Docker BUILD, so need update:
VITE_API_URL=http://localhost:3000  # Baked into frontend build

# These are used at RUNTIME, so only need reload:
PORT=3000                # Read when container starts
DATABASE_URL=...         # Read when container starts
JWT_SECRET=...           # Read when container starts
```

**However**, for simplicity, our current setup requires `reload` for any .env change, and `update` if you want to rebuild with new VITE_API_URL.

---

## When to Use Clean Builds

Use `./deploy.sh build-clean` (no cache) only when:
- Docker cache is corrupted
- You suspect caching issues
- After major dependency changes
- Build errors that don't make sense

**99% of the time, use `./deploy.sh update` (with cache)**

---

## Best Practices

1. **Development workflow:**
   ```bash
   # First time
   ./deploy.sh update
   
   # Code changes (uses cache - fast!)
   ./deploy.sh update
   
   # Config changes (.env)
   ./deploy.sh reload
   
   # Strange build errors?
   ./deploy.sh build-clean
   ```

2. **Production deployment:**
   ```bash
   # Pull latest code
   git pull origin main
   
   # If code changed (uses cache)
   ./deploy.sh update
   
   # If only .env changed
   ./deploy.sh reload
   ```

3. **Quick testing:**
   ```bash
   # Just restart to see if issue resolves
   ./deploy.sh restart
   ```

---

## FAQ

**Q: Can I use `reload` after changing my code?**
A: No! The code is baked into the Docker image. You need `update` to rebuild.

**Q: Will `restart` pick up .env changes?**
A: No! Use `reload` for .env changes. `restart` just restarts existing containers.

**Q: What if I'm not sure which command to use?**
A: Use `update` to be safe. It's slower but always works. Once you understand the differences, you can optimize.

**Q: Can I see what changed?**
A: Yes! Use `git diff` to see code changes, and check if only .env was modified.

---

## Summary

- **restart** - Fastest, no changes
- **reload** - Fast, .env changes only
- **update** - Slow, code changes (required)

Choose wisely and save time!
