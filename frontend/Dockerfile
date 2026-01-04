# Frontend Dockerfile for Inventory Tracker
# Dependencies stage - cached unless package.json changes
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only package files first (for better caching)
COPY package*.json ./

# Install dependencies (this layer is cached unless package.json changes)
RUN npm ci && npm cache clean --force

# Build stage
FROM node:20-alpine AS builder

# Build argument for API URL
ARG VITE_API_URL=http://localhost:3000

WORKDIR /app

# Copy dependencies from deps stage (reuse if package.json unchanged)
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

# Copy source code (only rebuilds if code changes)
COPY . .

# Set environment variable for Vite build
ENV VITE_API_URL=$VITE_API_URL

# Build the application (skip TypeScript checking for Docker builds)
RUN npm run build:docker

# Production stage with nginx
FROM nginx:alpine AS production

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
