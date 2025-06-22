#!/bin/bash

# Docker management script for Uyren backend
# Usage: ./docker-manage.sh [command] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEV_COMPOSE_FILE="docker-compose.dev.yml"
PROD_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE="backend/.env"
ENV_EXAMPLE="backend/.env.example"

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# Help function
show_help() {
    echo "Uyren Docker Management Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  setup              Initial project setup"
    echo "  dev                Start development environment"
    echo "  prod               Start production environment"
    echo "  stop               Stop all services"
    echo "  down               Stop and remove containers"
    echo "  build              Build containers"
    echo "  logs               View logs"
    echo "  shell              Access backend shell"
    echo "  django             Run Django commands"
    echo "  db                 Database operations"
    echo "  clean              Clean up Docker resources"
    echo ""
    echo "Options:"
    echo "  --build            Force rebuild containers"
    echo "  --detach, -d       Run in background"
    echo "  --follow, -f       Follow logs"
    echo ""
    echo "Examples:"
    echo "  $0 setup                    # Initial setup"
    echo "  $0 dev --build              # Start dev with rebuild"
    echo "  $0 logs --follow            # Follow logs"
    echo "  $0 django migrate           # Run migrations"
    echo "  $0 db reset                 # Reset database"
}

# Setup function
setup_project() {
    log_info "Setting up Uyren backend project..."
    
    # Check if .env exists
    if [ ! -f "$ENV_FILE" ]; then
        log_info "Creating environment file from template..."
        cp "$ENV_EXAMPLE" "$ENV_FILE"
        log_warn "Please edit $ENV_FILE with your configuration"
    else
        log_info "Environment file already exists"
    fi
    
    # Create necessary directories
    log_info "Creating necessary directories..."
    mkdir -p backend/staticfiles backend/media backend/logs
    
    # Set permissions for entrypoint script
    if [ -f "backend/entrypoint.sh" ]; then
        chmod +x backend/entrypoint.sh
        log_info "Made entrypoint.sh executable"
    fi
    
    log_info "Setup complete! Run '$0 dev' to start development environment"
}

# Development environment
start_dev() {
    local build_flag=""
    local detach_flag=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --build)
                build_flag="--build"
                shift
                ;;
            --detach|-d)
                detach_flag="-d"
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
    
    log_info "Starting development environment..."
    docker-compose -f "$DEV_COMPOSE_FILE" up $build_flag $detach_flag
}

# Production environment
start_prod() {
    local build_flag=""
    local detach_flag="-d"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --build)
                build_flag="--build"
                shift
                ;;
            --no-detach)
                detach_flag=""
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
    
    log_info "Starting production environment..."
    docker-compose -f "$PROD_COMPOSE_FILE" up $build_flag $detach_flag
}

# Stop services
stop_services() {
    log_info "Stopping services..."
    docker-compose -f "$DEV_COMPOSE_FILE" stop 2>/dev/null || true
    docker-compose -f "$PROD_COMPOSE_FILE" stop 2>/dev/null || true
}

# Stop and remove containers
down_services() {
    log_info "Stopping and removing containers..."
    docker-compose -f "$DEV_COMPOSE_FILE" down 2>/dev/null || true
    docker-compose -f "$PROD_COMPOSE_FILE" down 2>/dev/null || true
}

# Build containers
build_containers() {
    log_info "Building containers..."
    docker-compose -f "$DEV_COMPOSE_FILE" build
}

# View logs
view_logs() {
    local follow_flag=""
    local service="backend"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --follow|-f)
                follow_flag="-f"
                shift
                ;;
            --service)
                service="$2"
                shift 2
                ;;
            *)
                service="$1"
                shift
                ;;
        esac
    done
    
    log_info "Viewing logs for $service..."
    docker-compose -f "$DEV_COMPOSE_FILE" logs $follow_flag "$service"
}

# Access backend shell
backend_shell() {
    log_info "Accessing backend shell..."
    docker-compose -f "$DEV_COMPOSE_FILE" exec backend bash
}

# Run Django commands
run_django() {
    local cmd="$*"
    log_info "Running Django command: $cmd"
    docker-compose -f "$DEV_COMPOSE_FILE" exec backend python manage.py $cmd
}

# Database operations
db_operations() {
    local operation="$1"
    
    case "$operation" in
        migrate)
            log_info "Running database migrations..."
            docker-compose -f "$DEV_COMPOSE_FILE" exec backend python manage.py migrate
            ;;
        makemigrations)
            log_info "Creating database migrations..."
            docker-compose -f "$DEV_COMPOSE_FILE" exec backend python manage.py makemigrations
            ;;
        reset)
            log_warn "This will destroy all data! Are you sure? (y/N)"
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                log_info "Resetting database..."
                docker-compose -f "$DEV_COMPOSE_FILE" down -v
                docker-compose -f "$DEV_COMPOSE_FILE" up -d db
                sleep 5
                docker-compose -f "$DEV_COMPOSE_FILE" up -d backend
            else
                log_info "Database reset cancelled"
            fi
            ;;
        shell)
            log_info "Accessing database shell..."
            docker-compose -f "$DEV_COMPOSE_FILE" exec db psql -U postgres -d uyren_dev
            ;;
        *)
            log_error "Unknown database operation: $operation"
            echo "Available operations: migrate, makemigrations, reset, shell"
            ;;
    esac
}

# Clean up Docker resources
clean_docker() {
    log_info "Cleaning up Docker resources..."
    
    # Stop all containers
    down_services
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    # Remove unused networks
    docker network prune -f
    
    log_info "Docker cleanup complete"
}

# Main command handler
case "$1" in
    setup)
        setup_project
        ;;
    dev)
        shift
        start_dev "$@"
        ;;
    prod)
        shift
        start_prod "$@"
        ;;
    stop)
        stop_services
        ;;
    down)
        down_services
        ;;
    build)
        build_containers
        ;;
    logs)
        shift
        view_logs "$@"
        ;;
    shell)
        backend_shell
        ;;
    django)
        shift
        run_django "$@"
        ;;
    db)
        shift
        db_operations "$@"
        ;;
    clean)
        clean_docker
        ;;
    help|--help|-h|"")
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
