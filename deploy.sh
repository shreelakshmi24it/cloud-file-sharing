#!/bin/bash

# Cloud File Sharing - Quick Deployment Script
# This script helps you deploy quickly using Docker

set -e

echo "============================================="
echo "Cloud File Sharing - Production Deployment"
echo "============================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo ""
    echo "Please create a .env file with your production environment variables."
    echo "You can use the template files as a starting point:"
    echo "  - backend/.env.production.example"
    echo "  - frontend/.env.production.example"
    echo ""
    echo "Create .env in the project root with all required variables."
    exit 1
fi

echo "✅ Environment file found"
echo ""

# Load environment variables
source .env

# Check required variables
REQUIRED_VARS=(
    "DB_PASSWORD"
    "REDIS_PASSWORD"
    "JWT_SECRET"
    "JWT_REFRESH_SECRET"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "S3_BUCKET_NAME"
)

MISSING_VARS=()
for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        MISSING_VARS+=("$VAR")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "❌ Missing required environment variables:"
    for VAR in "${MISSING_VARS[@]}"; do
        echo "  - $VAR"
    done
    echo ""
    echo "Please set these variables in your .env file."
    exit 1
fi

echo "✅ All required environment variables are set"
echo ""

# Ask what to do
echo "What would you like to do?"
echo "1) Build and start all services"
echo "2) Stop all services"
echo "3) View logs"
echo "4) Run database migrations"
echo "5) Check service health"
echo "6) Clean up (remove containers and volumes)"
echo ""
read -p "Enter your choice (1-6): " CHOICE

case $CHOICE in
    1)
        echo ""
        echo "🚀 Building and starting services..."
        docker-compose build
        docker-compose up -d
        echo ""
        echo "✅ Services started successfully!"
        echo ""
        echo "Services:"
        docker-compose ps
        echo ""
        echo "Next steps:"
        echo "1. Run migrations: ./deploy.sh and choose option 4"
        echo "2. Check health: ./deploy.sh and choose option 5"
        echo "3. View logs: ./deploy.sh and choose option 3"
        ;;
    2)
        echo ""
        echo "🛑 Stopping services..."
        docker-compose down
        echo "✅ Services stopped"
        ;;
    3)
        echo ""
        echo "📝 Viewing logs (Ctrl+C to exit)..."
        docker-compose logs -f
        ;;
    4)
        echo ""
        echo "🔄 Running database migrations..."
        docker-compose exec backend npm run migrate
        echo "✅ Migrations completed"
        ;;
    5)
        echo ""
        echo "🏥 Checking service health..."
        echo ""
        echo "Services status:"
        docker-compose ps
        echo ""
        echo "Testing backend health endpoint..."
        if curl -f http://localhost:5000/health > /dev/null 2>&1; then
            echo "✅ Backend is healthy"
        else
            echo "❌ Backend health check failed"
        fi
        echo ""
        echo "Testing frontend..."
        if curl -f http://localhost:80 > /dev/null 2>&1; then
            echo "✅ Frontend is accessible"
        else
            echo "❌ Frontend is not accessible"
        fi
        echo ""
        echo "Testing PostgreSQL..."
        if docker-compose exec -T postgres pg_isready -U ${DB_USER:-postgres} > /dev/null 2>&1; then
            echo "✅ PostgreSQL is ready"
        else
            echo "❌ PostgreSQL is not ready"
        fi
        echo ""
        echo "Testing Redis..."
        if docker-compose exec -T redis redis-cli -a ${REDIS_PASSWORD} ping > /dev/null 2>&1; then
            echo "✅ Redis is ready"
        else
            echo "❌ Redis is not ready"
        fi
        ;;
    6)
        echo ""
        echo "⚠️  WARNING: This will remove all containers and volumes (including database data)!"
        read -p "Are you sure? (yes/no): " CONFIRM
        if [ "$CONFIRM" = "yes" ]; then
            echo "🗑️  Cleaning up..."
            docker-compose down -v
            echo "✅ Cleanup completed"
        else
            echo "❌ Cleanup cancelled"
        fi
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "Done!"
