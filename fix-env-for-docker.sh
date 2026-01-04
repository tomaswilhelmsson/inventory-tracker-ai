#!/bin/bash

# Quick setup script for Docker deployment

echo "Setting up .env for Docker deployment..."

# Backup existing .env if it exists
if [ -f .env ]; then
    cp .env .env.backup
    echo "✓ Backed up existing .env to .env.backup"
fi

# Copy template
cp .env.docker .env

echo "✓ Created .env from template"
echo ""
echo "IMPORTANT: Edit .env and change JWT_SECRET!"
echo ""
echo "Then run: ./deploy.sh update"
