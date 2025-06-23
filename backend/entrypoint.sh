#!/bin/bash

# entrypoint.sh - Django Docker entrypoint script
# This script handles database setup, migrations, and other initialization tasks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
    if [ "$DEBUG" = "True" ] || [ "$DEBUG" = "true" ]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

# Function to wait for database
wait_for_db() {
    if [ "$WAIT_FOR_DB" = "True" ] || [ "$WAIT_FOR_DB" = "true" ]; then
        log_info "Waiting for postgres at $DB_HOST:$DB_PORT..."
        while ! nc -z "$DB_HOST" "$DB_PORT"; do
            sleep 0.1
        done
        log_info "Postgres is ready!"
    fi
}


# Function to create database migrations
create_migrations() {
    if [ "$RUN_MAKEMIGRATIONS" = "True" ] || [ "$RUN_MAKEMIGRATIONS" = "true" ]; then
        log_info "Creating database migrations..."
        python manage.py makemigrations
    else
        log_debug "Skipping makemigrations (RUN_MAKEMIGRATIONS=$RUN_MAKEMIGRATIONS)"
    fi
}

# Function to run database migrations
run_migrations() {
    if [ "$RUN_MIGRATIONS" = "True" ] || [ "$RUN_MIGRATIONS" = "true" ]; then
        log_info "Running database migrations..."
        python manage.py migrate
        
        if [ $? -eq 0 ]; then
            log_info "Migrations completed successfully"
        else
            log_error "Migrations failed"
            exit 1
        fi
    else
        log_debug "Skipping migrations (RUN_MIGRATIONS=$RUN_MIGRATIONS)"
    fi
}

# Function to collect static files
collect_static() {
    if [ "$RUN_COLLECTSTATIC" = "True" ] || [ "$RUN_COLLECTSTATIC" = "true" ]; then
        log_info "Collecting static files..."
        python manage.py collectstatic --noinput
        
        if [ $? -eq 0 ]; then
            log_info "Static files collected successfully"
        else
            log_warn "Static files collection failed (this might be OK in development)"
        fi
    else
        log_debug "Skipping collectstatic (RUN_COLLECTSTATIC=$RUN_COLLECTSTATIC)"
    fi
}

# Function to create superuser
create_superuser() {
    if [ "$CREATE_SUPERUSER" = "True" ] || [ "$CREATE_SUPERUSER" = "true" ]; then
        if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
            log_info "Creating superuser..."
            
            # Check if superuser already exists
            if python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); print(User.objects.filter(username='$DJANGO_SUPERUSER_USERNAME').exists())" | grep -q "True"; then
                log_warn "Superuser '$DJANGO_SUPERUSER_USERNAME' already exists, skipping creation"
            else
                python manage.py createsuperuser --noinput \
                    --username "$DJANGO_SUPERUSER_USERNAME" \
                    --email "$DJANGO_SUPERUSER_EMAIL" 
                
                if [ $? -eq 0 ]; then
                    log_info "Superuser created successfully"
                else
                    log_error "Failed to create superuser"
                fi
            fi
        else
            log_warn "Superuser credentials not provided, skipping creation"
            log_debug "Required: DJANGO_SUPERUSER_USERNAME, DJANGO_SUPERUSER_EMAIL, DJANGO_SUPERUSER_PASSWORD"
        fi
    else
        log_debug "Skipping superuser creation (CREATE_SUPERUSER=$CREATE_SUPERUSER)"
    fi
}

# Function to load fixtures/seed data
load_fixtures() {
    if [ "$LOAD_FIXTURES" = "True" ] || [ "$LOAD_FIXTURES" = "true" ]; then
        log_info "Loading fixtures/seed data..."
        
        # Load fixtures if they exist
        for fixture_file in fixtures/*.json fixtures/*.yaml fixtures/*.xml; do
            if [ -f "$fixture_file" ]; then
                log_info "Loading fixture: $fixture_file"
                python manage.py loaddata "$fixture_file"
            fi
        done
        
        # Run custom seed commands if they exist
        if python manage.py help seed > /dev/null 2>&1; then
            log_info "Running seed command..."
            python manage.py seed
        fi
    else
        log_debug "Skipping fixtures loading (LOAD_FIXTURES=$LOAD_FIXTURES)"
    fi
}

# Function to show startup information
show_startup_info() {
    # Extract mode from DJANGO_SETTINGS_MODULE
    SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-config.settings.development}"
    if [[ "$SETTINGS_MODULE" == *"production"* ]]; then
        MODE="PRODUCTION"
    elif [[ "$SETTINGS_MODULE" == *"development"* ]]; then
        MODE="DEVELOPMENT"
    else
        MODE="UNKNOWN"
    fi
    log_info "Mode: $MODE"

    log_info "=========================================="
    log_info "       Uyren Backend Starting Up"
    log_info "=========================================="
    log_info "Environment: $SETTINGS_MODULE"
    log_info "Mode: $MODE"
    log_info "Debug mode: ${DEBUG:-False}"
    log_info "Database: ${DB_HOST:-localhost}:${DB_PORT:-5432}/${DB_NAME:-uyren_dev}"
    log_info "=========================================="
}


# Main execution
main() {
    show_startup_info
    
    # Wait for database
    wait_for_db
    
    # Database operations
    create_migrations
    run_migrations
    
    # Static files
    collect_static
    
    # User management
    create_superuser
    
    # Seed data
    load_fixtures
    
    log_info "Initialization complete! Starting application..."
    
    # Execute the main command
    exec "$@"
}

# Run main function with all arguments
main "$@"
