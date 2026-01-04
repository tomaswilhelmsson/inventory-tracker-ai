# Backend Dockerfile for Inventory Tracker
# This Dockerfile expects to be built from the root directory
FROM node:20-alpine AS deps

# Install dependencies for native modules and OpenSSL for Prisma (cached layer)
RUN apk add --no-cache python3 make g++ openssl openssl-dev

WORKDIR /app

# Copy only package files first (for better caching)
COPY package*.json ./

# Install dependencies (this layer is cached unless package.json changes)
RUN npm ci && npm cache clean --force

# Build stage
FROM node:20-alpine AS builder

# Install build tools and OpenSSL for Prisma (cached layer)
RUN apk add --no-cache python3 make g++ openssl openssl-dev

WORKDIR /app

# Copy dependencies from deps stage (reuse if package.json unchanged)
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

# Copy only necessary backend files (exclude tests)
COPY backend/src ./backend/src
COPY backend/prisma ./backend/prisma
COPY backend/tsconfig.json ./backend/tsconfig.json

# Generate Prisma Client (only regenerates if schema changes)
WORKDIR /app/backend
RUN npx prisma generate

# Build TypeScript (only rebuilds if source changes)
WORKDIR /app
RUN npm run build:backend

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install runtime dependencies: dumb-init and OpenSSL for Prisma (cached layer)
RUN apk add --no-cache dumb-init openssl

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy backend prisma schema and generate client
COPY backend/prisma ./backend/prisma
WORKDIR /app/backend
RUN npx prisma generate

# Copy built application from builder stage
COPY --from=builder /app/backend/dist ./dist

WORKDIR /app/backend

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/server.js"]
