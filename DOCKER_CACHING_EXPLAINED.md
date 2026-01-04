# Docker Layer Caching Explained

This document explains how our optimized Docker builds work and why they're much faster.

## The Problem (Before Optimization)

**Old Dockerfile (simplified):**
```dockerfile
FROM node:20-alpine
COPY . .                          # Copies EVERYTHING
RUN npm ci                        # Installs packages
RUN npm run build                 # Builds code
```

**Problem:** Every time you change ANY file, Docker rebuilds EVERYTHING:
- Downloads all npm packages again (~300MB)
- Reinstalls gcc, python, make
- Rebuilds entire application

**Time:** ~10 minutes per build

---

## The Solution (After Optimization)

**New Dockerfile (optimized):**
```dockerfile
# Stage 1: Dependencies (cached unless package.json changes)
FROM node:20-alpine AS deps
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci                        # Only reruns if package.json changed

# Stage 2: Build (cached unless source code changes)
FROM node:20-alpine AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY backend/src ./backend/src   # Only copies source
RUN npm run build                 # Only reruns if source changed
```

**Result:** Docker caches layers and only rebuilds what changed!

---

## How Docker Layer Caching Works

Docker builds images in layers. Each instruction creates a new layer:

```
┌─────────────────────────────────────┐
│ Layer 6: CMD ["node", "server.js"] │ ← Never changes
├─────────────────────────────────────┤
│ Layer 5: COPY dist                 │ ← Changes when code changes
├─────────────────────────────────────┤
│ Layer 4: RUN npm run build         │ ← Changes when code changes
├─────────────────────────────────────┤
│ Layer 3: COPY src                  │ ← Changes when code changes
├─────────────────────────────────────┤
│ Layer 2: RUN npm ci                │ ← Changes when package.json changes
├─────────────────────────────────────┤
│ Layer 1: COPY package.json         │ ← Changes when package.json changes
├─────────────────────────────────────┤
│ Layer 0: FROM node:20-alpine       │ ← Never changes
└─────────────────────────────────────┘
```

**Cache Invalidation:** When a layer changes, all layers BELOW it must rebuild.

---

## Real-World Examples

### Example 1: Changed Source Code Only

```bash
# You edited: backend/src/services/inventoryService.ts
./deploy.sh update
```

**What happens:**
```
Layer 0: FROM node:20-alpine       ✓ CACHED (already downloaded)
Layer 1: COPY package.json         ✓ CACHED (package.json unchanged)
Layer 2: RUN npm ci                ✓ CACHED (dependencies unchanged)
Layer 3: COPY src                  ✗ REBUILT (source changed)
Layer 4: RUN npm run build         ✗ REBUILT (source changed)
Layer 5: COPY dist                 ✗ REBUILT (build output changed)
```

**Time:** ~1-2 minutes (only rebuilding TypeScript)

---

### Example 2: Changed package.json

```bash
# You added a new dependency: npm install express-session
./deploy.sh update
```

**What happens:**
```
Layer 0: FROM node:20-alpine       ✓ CACHED
Layer 1: COPY package.json         ✗ REBUILT (package.json changed)
Layer 2: RUN npm ci                ✗ REBUILT (must reinstall packages)
Layer 3: COPY src                  ✗ REBUILT (cache invalidated)
Layer 4: RUN npm run build         ✗ REBUILT (cache invalidated)
Layer 5: COPY dist                 ✗ REBUILT (cache invalidated)
```

**Time:** ~3-5 minutes (reinstalling all packages)

---

### Example 3: Changed .env Only

```bash
# You edited .env file
./deploy.sh reload
```

**What happens:**
```
No layers rebuilt!
Docker recreates containers with new environment variables
```

**Time:** ~20 seconds

---

## Multi-Stage Build Benefits

Our Dockerfiles use multi-stage builds:

```dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
...

# Stage 2: Build application
FROM node:20-alpine AS builder
COPY --from=deps /app/node_modules ./node_modules
...

# Stage 3: Production runtime
FROM node:20-alpine AS production
COPY --from=builder /app/dist ./dist
...
```

**Benefits:**
1. **Layer caching:** Each stage can be cached independently
2. **Smaller images:** Production stage only includes compiled code
3. **Faster rebuilds:** Can reuse deps stage if package.json unchanged

---

## Cache Statistics

Here's what gets cached at each stage:

### Backend Build
```
Stage 1 (deps):
  - Alpine Linux base         ~5 MB   (always cached)
  - Python, gcc, make         ~150 MB (always cached)
  - node_modules              ~300 MB (cached unless package.json changes)

Stage 2 (builder):
  - Source code copy          ~5 MB   (rebuilds when code changes)
  - TypeScript compilation    ~10 MB  (rebuilds when code changes)

Stage 3 (production):
  - Compiled JavaScript       ~5 MB   (rebuilds when code changes)
```

### Frontend Build
```
Stage 1 (deps):
  - Alpine Linux base         ~5 MB   (always cached)
  - node_modules              ~200 MB (cached unless package.json changes)

Stage 2 (builder):
  - Source code copy          ~2 MB   (rebuilds when code changes)
  - Vite build                ~3 MB   (rebuilds when code changes)

Stage 3 (production):
  - Nginx base                ~40 MB  (always cached)
  - Built static files        ~3 MB   (rebuilds when code changes)
```

---

## Build Time Comparison

### Before Optimization (No Caching)
| What Changed | Time | Why |
|--------------|------|-----|
| Source code | 10 min | Downloads everything |
| package.json | 10 min | Downloads everything |
| .env file | 10 min | Downloads everything (wasteful!) |

### After Optimization (With Caching)
| What Changed | Time | Why |
|--------------|------|-----|
| Source code | 1-2 min | Only rebuilds code layers |
| package.json | 3-5 min | Reinstalls packages + rebuilds code |
| .env file | 20 sec | No rebuild needed (use `reload`) |

---

## How to Clear Docker Cache

Sometimes you need to clear the cache:

```bash
# Option 1: Clean build (clears cache for this project)
./deploy.sh build-clean

# Option 2: Clear all Docker cache (system-wide)
docker system prune -a

# Option 3: Clear build cache only
docker builder prune
```

**Warning:** This removes all cached layers and next build will be slow!

---

## Best Practices for Fast Builds

1. **Separate dependencies from source:**
   ```dockerfile
   # ✓ GOOD: Dependencies cached separately
   COPY package.json ./
   RUN npm ci
   COPY src ./
   
   # ✗ BAD: Everything copied together
   COPY . ./
   RUN npm ci
   ```

2. **Order instructions by change frequency:**
   ```dockerfile
   # Rarely changes → Top
   FROM node:20-alpine
   RUN apk add python3
   
   # Sometimes changes → Middle
   COPY package.json ./
   RUN npm ci
   
   # Frequently changes → Bottom
   COPY src ./
   RUN npm run build
   ```

3. **Use .dockerignore to exclude unnecessary files:**
   ```
   node_modules
   dist
   *.test.ts
   .git
   ```

---

## Monitoring Build Cache

Check if Docker is using cache:

```bash
./deploy.sh build

# Output shows cache usage:
# Step 3/10 : RUN npm ci
#  ---> Using cache          ← Good! Using cached layer
#  ---> a1b2c3d4e5f6

# Step 5/10 : COPY src ./
#  ---> 123456abcdef          ← Rebuilding this layer
```

Look for `---> Using cache` messages!

---

## FAQ

**Q: Why does the first build take so long?**
A: No cache exists yet. Subsequent builds will be faster.

**Q: Does cache work across different machines?**
A: No, cache is local to your machine. CI/CD systems can use remote cache.

**Q: When should I use `build-clean`?**
A: Only when you have mysterious build errors. 99% of the time use `update`.

**Q: How much disk space does cache use?**
A: Run `docker system df` to check. Typically 1-2GB per project.

**Q: Can I share cache between projects?**
A: Base layers (like `node:20-alpine`) are shared, but project dependencies are separate.

---

## Summary

- ✓ **Changed code only:** ~1-2 min (cache saves 8+ min)
- ✓ **Changed dependencies:** ~3-5 min (cache saves 5+ min)  
- ✓ **Changed .env:** ~20 sec with `reload` (cache saves 10+ min)
- ✗ **Clean build:** ~10 min (no cache used)

**Use cache whenever possible - it's a huge time saver!**
