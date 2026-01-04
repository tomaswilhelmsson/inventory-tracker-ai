#!/bin/bash

# Inventory Tracker Deployment Script
# Usage: ./deploy.sh [command]
#
# Commands:
#   build     - Build the Docker image
#   up        - Start the container
#   down      - Stop the container
#   restart   - Restart the container
#   update    - Pull latest code, rebuild and restart (full deploy)
#   logs      - Show container logs
#   status    - Show container status
#   clean     - Remove old images and containers

set -e

# Configuration
APP_NAME="inventory-tracker"
IMAGE_NAME="${APP_NAME}"
COMPOSE_FILE="docker-compose.simple.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        log_error ".env file not found!"
        echo "Please create a .env file. You can use:"
        echo "  cp .env.docker .env"
        echo ""
        echo "Then edit .env and set your JWT_SECRET"
        exit 1
    fi
}

# Build the Docker image
build() {
    check_env
    log_info "Building Docker image..."
    docker-compose -f ${COMPOSE_FILE} build
    log_info "Build completed successfully!"
}

# Start the container
up() {
    check_env
    log_info "Starting container..."
    docker-compose -f ${COMPOSE_FILE} up -d
    log_info "Container started!"
    status
}

# Stop the container
down() {
    log_info "Stopping container..."
    docker-compose -f ${COMPOSE_FILE} down
    log_info "Container stopped!"
}

# Restart the container
restart() {
    log_info "Restarting container..."
    docker-compose -f ${COMPOSE_FILE} restart
    log_info "Container restarted!"
    status
}

# Full deployment: rebuild and restart
update() {
    log_info "Starting full deployment..."
    
    # Stop existing container
    log_info "Stopping existing container..."
    docker-compose -f ${COMPOSE_FILE} down || true
    
    # Build new image
    build
    
    # Start container
    up
    
    # Clean up old images
    log_info "Cleaning up old images..."
    docker image prune -f
    
    log_info "Deployment completed successfully!"
}

# Show logs
logs() {
    docker-compose -f ${COMPOSE_FILE} logs -f
}

# Show status
status() {
    echo ""
    log_info "Container Status:"
    docker-compose -f ${COMPOSE_FILE} ps
    echo ""
    
    # Check if container is running and show URL
    if docker-compose -f ${COMPOSE_FILE} ps | grep -q "Up"; then
        FRONTEND_PORT=${FRONTEND_PORT:-8080}
        log_info "Application is running at: http://localhost:${FRONTEND_PORT}"
        log_info "  - Frontend: http://localhost:${FRONTEND_PORT}"
        log_info "  - Backend API: http://localhost:${FRONTEND_PORT}/api"
    fi
}

# Clean up old images and containers
clean() {
    log_warn "This will remove:"
    echo "  - Stopped containers"
    echo "  - Dangling images"
    echo "  - Build cache"
    echo ""
    read -p "Are you sure? (y/N) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Cleaning up..."
        docker-compose -f ${COMPOSE_FILE} down --rmi local -v || true
        docker image prune -f
        docker builder prune -f
        log_info "Cleanup completed!"
    else
        log_info "Cleanup cancelled."
    fi
}

# Show help
help() {
    echo "Inventory Tracker Deployment Script"
    echo ""
    echo "Usage: ./deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  build     - Build the Docker image"
    echo "  up        - Start the container"
    echo "  down      - Stop the container"
    echo "  restart   - Restart the container"
    echo "  update    - Pull latest, rebuild and restart (full deploy)"
    echo "  logs      - Show container logs"
    echo "  status    - Show container status"
    echo "  clean     - Remove old images and containers"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh build    # Build the image"
    echo "  ./deploy.sh up       # Start the application"
    echo "  ./deploy.sh update   # Deploy updates"
}

# Main command handler
case "${1:-help}" in
    build)
        build
        ;;
    up)
        up
        ;;
    down)
        down
        ;;
    restart)
        restart
        ;;
    update)
        update
        ;;
    logs)
        logs
        ;;
    status)
        status
        ;;
    clean)
        clean
        ;;
    help|--help|-h)
        help
        ;;
    *)
        log_error "Unknown command: $1"
        help
        exit 1
        ;;
esac
