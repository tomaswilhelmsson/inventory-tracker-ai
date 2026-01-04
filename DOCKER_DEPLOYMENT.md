# Docker Deployment Guide

This guide explains how to deploy the Inventory Tracker application using Docker.

## Architecture

The application consists of three main services:
- **PostgreSQL**: Database for storing inventory data
- **Backend**: Node.js/Express API server with Prisma ORM
- **Frontend**: Vue.js application served by Nginx

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB of free disk space

## Quick Start

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd inventory-tracker
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

3. **Edit the .env file** with your configuration:
   ```env
   # Database Configuration (PostgreSQL for Docker)
   DATABASE_URL="postgresql://inventory:inventory@postgres:5432/inventory"
   POSTGRES_USER=inventory
   POSTGRES_PASSWORD=your-secure-password
   POSTGRES_DB=inventory
   
   # JWT Secret (change this!)
   JWT_SECRET=your-super-secret-key-change-me
   
   # Server Configuration
   PORT=3000
   NODE_ENV=production
   
   # Frontend Configuration
   FRONTEND_PORT=8080
   VITE_API_URL=http://localhost:3000
   ```

4. **Deploy the application**:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh update
   ```

5. **Access the application**:
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3000

## Deployment Script Commands

The `deploy.sh` script provides several commands optimized for different scenarios:

```bash
# Build Docker images
./deploy.sh build

# Start containers
./deploy.sh up

# Stop containers
./deploy.sh down

# Restart containers (fastest - no rebuild)
./deploy.sh restart

# Reload containers (for .env changes - no rebuild)
./deploy.sh reload

# Full deployment (for code changes - rebuilds images)
./deploy.sh update

# Run database migrations
./deploy.sh migrate

# View container logs
./deploy.sh logs

# Check container status
./deploy.sh status

# Clean up old images and containers
./deploy.sh clean

# Show help
./deploy.sh help
```

### Command Selection Guide

**Choose the right command based on what changed:**

| What Changed | Command | Speed | Rebuilds Images |
|--------------|---------|-------|-----------------|
| Nothing (just restart) | `restart` | Fastest | No |
| .env file only | `reload` | Fast | No |
| Backend/Frontend code | `update` | Slow | Yes |
| Database schema | `update` + `migrate` | Slow | Yes |

**Examples:**

```bash
# You changed JWT_SECRET in .env
./deploy.sh reload

# You modified backend TypeScript files
./deploy.sh update

# You updated a Vue component
./deploy.sh update

# Container crashed, need to restart
./deploy.sh restart

# Changed ports in .env
./deploy.sh reload
```

## Manual Docker Commands

If you prefer to use Docker commands directly:

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Access backend shell
docker-compose exec backend sh

# Access PostgreSQL
docker-compose exec postgres psql -U inventory -d inventory
```

## Environment Variables

### Database Variables
- `POSTGRES_USER`: PostgreSQL username (default: inventory)
- `POSTGRES_PASSWORD`: PostgreSQL password
- `POSTGRES_DB`: PostgreSQL database name (default: inventory)
- `POSTGRES_PORT`: PostgreSQL port (default: 5432)

### Backend Variables
- `DATABASE_URL`: Full PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token generation (required)
- `PORT`: Backend API port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:5173)

### Frontend Variables
- `FRONTEND_PORT`: Nginx port (default: 8080)
- `VITE_API_URL`: Backend API URL for frontend

## Production Deployment

For production deployments:

1. **Update environment variables**:
   - Use strong passwords for `POSTGRES_PASSWORD`
   - Generate a secure `JWT_SECRET`
   - Set `NODE_ENV=production`

2. **Configure domain and SSL**:
   - Update `VITE_API_URL` to your domain
   - Add SSL/TLS certificates to nginx configuration
   - Configure reverse proxy if needed

3. **Database backups**:
   ```bash
   # Backup database
   docker-compose exec postgres pg_dump -U inventory inventory > backup.sql
   
   # Restore database
   docker-compose exec -T postgres psql -U inventory inventory < backup.sql
   ```

4. **Update application**:
   ```bash
   git pull origin main
   ./deploy.sh update
   ```

## Volume Management

The application uses Docker volumes for persistent data:

- `postgres_data`: PostgreSQL database files
- `backend_uploads`: File uploads (if any)

### Backup Volumes
```bash
# Backup PostgreSQL data
docker run --rm -v inventory-tracker_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data

# Restore PostgreSQL data
docker run --rm -v inventory-tracker_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /
```

## Troubleshooting

### Container won't start
```bash
# Check logs
./deploy.sh logs

# Check container status
docker-compose ps
```

### Database connection issues
```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Test connection
docker-compose exec backend npx prisma db pull
```

### Frontend can't connect to backend
- Verify `VITE_API_URL` in .env matches your backend URL
- Check CORS configuration in backend
- Rebuild frontend: `./deploy.sh build`

### Migration issues
```bash
# Reset database (WARNING: deletes all data!)
docker-compose down -v
docker-compose up -d postgres
docker-compose exec backend npx prisma migrate deploy
```

## Development with Docker

For development, you can mount source code as volumes in docker-compose.yml:

```yaml
backend:
  volumes:
    - ./backend/src:/app/src
  command: npm run dev
```

This allows hot-reloading without rebuilding the image.

## Security Considerations

1. **Never commit .env files** with production credentials
2. **Use strong passwords** for database and JWT secret
3. **Enable HTTPS** in production
4. **Regular updates**: Keep base images updated
   ```bash
   docker-compose pull
   ./deploy.sh update
   ```
5. **Limit exposed ports**: Only expose necessary ports in production
6. **Use secrets management**: Consider Docker secrets for sensitive data

## Monitoring

### Health Checks
The application includes health checks:
- Backend: http://localhost:3000/health
- Frontend: http://localhost:8080

### Resource Usage
```bash
# Monitor resource usage
docker stats

# Check disk usage
docker system df
```

## Scaling

To scale the application:

1. Use a managed PostgreSQL service (AWS RDS, Google Cloud SQL, etc.)
2. Deploy multiple backend instances behind a load balancer
3. Use Redis for session management
4. Configure CDN for frontend static assets

## Support

For issues or questions:
- Check the logs: `./deploy.sh logs`
- Review the main README.md
- Open an issue on the repository
