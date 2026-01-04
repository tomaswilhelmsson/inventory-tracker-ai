# Login Issue - FIXED! ✅

## Problem

Login button did nothing - frontend couldn't reach the backend API.

## Root Cause

Frontend was built with `VITE_API_URL=http://localhost:3000` which is:
- ❌ The internal container port (not accessible from browser)  
- ❌ Different from the external port (8081)

## Solution Applied

Rebuilt frontend with `VITE_API_URL=/api` (relative URL):
- ✅ Uses the same host/port as frontend
- ✅ http-server proxies `/api` requests to backend at `localhost:3000`
- ✅ Browser can reach the API

## How It Works Now

```
Browser (your computer)
    ↓
http://localhost:8081/  (frontend)
    ↓
http://localhost:8081/api/auth/login  (API request)
    ↓
http-server proxy (inside container)
    ↓
http://localhost:3000/api/auth/login  (backend, inside container)
```

## Test the API

```bash
# Test login endpoint
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YOUR_PASSWORD"}'
```

## Default User

Your database has an admin user:
- Username: `admin`
- Password: (whatever you set during seed/import)

If you don't know the password, you can create a new user or reset it.

## If Login Still Doesn't Work

### 1. Check browser console (F12)

Look for errors like:
- Network errors
- CORS errors
- 404 errors

### 2. Check container logs

```bash
# In another terminal
docker logs -f inventory-tracker

# Try to login
# Watch for API requests in the logs
```

### 3. Verify API is accessible

```bash
# Should return 401 (invalid credentials) - that's good!
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# Should show: {"error":"Invalid credentials"}
```

## Create a Test User

If you need to create a new user:

```bash
docker exec inventory-tracker node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createUser() {
  const hash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      username: 'testuser',
      passwordHash: hash
    }
  });
  console.log('User created:', user.username);
  await prisma.\$disconnect();
}

createUser();
"
```

Then login with:
- Username: `testuser`
- Password: `password123`

## Summary

✅ **Frontend rebuilt** with correct API URL  
✅ **Proxy working** - requests reach backend  
✅ **Admin user exists** in database  
✅ **API responds** to login requests  

Try logging in at: **http://localhost:8081**

If it still doesn't work, check the browser console (F12) for errors!
