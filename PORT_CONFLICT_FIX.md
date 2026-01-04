# Port Conflict Issue - 404 Error

## Problem

Getting 404 when trying to login because Docker containers can't start - port 3000 is already in use by your local development server.

## Current Situation

- **Local dev backend**: Running on port 3000
- **Docker backend**: Trying to use port 3000 (conflict!)

## Solution Options

### Option 1: Stop Local Dev (Simplest)

If you want to use Docker only:

```bash
# Stop local development server
pkill -f "ts-node backend/src/server.ts"
pkill -f "nodemon"

# Start Docker
./deploy.sh up

# Access:
# Frontend: http://localhost:8080
# Backend: http://localhost:3000
```

### Option 2: Use Different Ports for Docker (Keep Both Running)

If you want to run both local dev AND Docker simultaneously:

**Step 1: Edit your .env file**

Change these lines:
```env
PORT=3001                          # Changed from 3000
FRONTEND_PORT=8080
VITE_API_URL=http://localhost:3001 # Changed from 3000
FRONTEND_URL=http://localhost:8080
```

**Step 2: Rebuild frontend** (because VITE_API_URL is baked into the build)

```bash
./deploy.sh update
```

**Step 3: Access your services**

**Local Development:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

**Docker:**
- Frontend: http://localhost:8080
- Backend: http://localhost:3001

## Recommended: Option 1 (Simpler)

For production use, just use Docker and stop local dev:

```bash
# 1. Stop local dev
pkill -f "ts-node backend/src/server.ts"
pkill -f nodemon

# 2. Start Docker
./deploy.sh up

# 3. Check status
./deploy.sh status

# 4. Access
open http://localhost:8080
```

## Why You Got 404

The 404 happened because:
1. Frontend container couldn't start (depends on backend)
2. Backend container couldn't start (port conflict)
3. When you accessed http://localhost:8080, nothing was running

## Verify It's Fixed

After applying the fix:

```bash
# Check containers are running
./deploy.sh status

# Should show:
# ✓ Backend API is running at: http://localhost:3000 (or 3001)
# ✓ Frontend is running at: http://localhost:8080
```

## Quick Commands

```bash
# Check what's using port 3000
lsof -i :3000

# Kill local dev servers
pkill -f "ts-node"
pkill -f nodemon
pkill -f vite

# Start Docker
./deploy.sh up

# View logs if issues
./deploy.sh logs
```
