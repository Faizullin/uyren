# Docker Setup Guide

This guide explains how to set up and run the Uyren backend using Docker with comprehensive environment configuration.

## Quick Start

1. **Clone the repository and navigate to the project directory**
2. **Copy environment file**:
   ```bash
   cp backend/.env.example backend/.env
   ```
3. **Set up Firebase**: Place `service-account.json` in backend folder
4. **Start development environment**:
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

## Environment Configuration

### Environment Files

The project uses environment files for configuration:

- **`.env`** - Active development environment (git-ignored)
- **`.env.example`** - Template for development environment
- **`.env.production.example`** - Template for production environment

### Key Environment Variables

#### Database Operations (Entrypoint Script)
```bash
# Control what happens during container startup
RUN_MIGRATIONS=True          # Run database migrations
RUN_MAKEMIGRATIONS=False     # Create new migrations
RUN_COLLECTSTATIC=True       # Collect static files
CREATE_SUPERUSER=True        # Create Django superuser
LOAD_FIXTURES=False          # Load test data/fixtures
```

#### Superuser Creation
```bash
# Required for automatic superuser creation
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@example.com
DJANGO_SUPERUSER_PASSWORD=admin123
```

#### Docker Configuration
```bash
# Port configuration
BACKEND_PORT=8000   # Backend application port
DB_PORT=5432        # PostgreSQL port
```

#### Firebase Configuration
```bash
# Firebase is now configured using service-account.json file
# No environment variables needed for Firebase
```

## Firebase Setup

1. **Download Service Account Key**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

2. **Place the Service Account File**:
   - Rename the downloaded file to `service-account.json`
   - Place it in the `backend/` folder (same level as `manage.py`)
   - The file is already added to `.gitignore` for security

3. **Docker Volume Mount**:
   ```yaml
   # In docker-compose files
   volumes:
     - ./backend/service-account.json:/app/service-account.json:ro
   ```

## Docker Compose Files

### Development: `docker-compose.dev.yml`
- Uses `Dockerfile.dev`
- Includes Django debug toolbar
- Volume mounts for live code reloading
- Runs with Django development server

### Production: `docker-compose.prod.yml`
- Uses `Dockerfile.prod`
- Includes Nginx reverse proxy
- Optimized for production performance
- Runs with Gunicorn WSGI server

## Entrypoint Script Features

The `entrypoint.sh` script automatically handles:

1. **Database Readiness**: Waits for PostgreSQL to be available
2. **Migrations**: Runs database migrations if enabled
3. **Static Files**: Collects static files for production
4. **Superuser**: Creates admin user if credentials provided
5. **Fixtures**: Loads test data if available
6. **Firebase Test**: Tests Firebase connection in debug mode

### Entrypoint Script Logs

The script provides colored output:
- 🟢 **INFO**: General information
- 🟡 **WARN**: Warnings (non-critical issues)
- 🔴 **ERROR**: Errors (will stop execution)
- 🔵 **DEBUG**: Debug information (only in debug mode)

## Development Workflow

### Initial Setup
```bash
# 1. Copy environment file
cp backend/.env.example backend/.env

# 2. Set up Firebase service account
# Place service-account.json in backend/ folder

# 3. Update other configuration in .env if needed
# Edit backend/.env with your settings

# 4. Start development environment
docker-compose -f docker-compose.dev.yml up --build
```

### Daily Development
```bash
# Start services
docker-compose -f docker-compose.dev.yml up

# View logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Run Django commands
docker-compose -f docker-compose.dev.yml exec backend python manage.py shell
docker-compose -f docker-compose.dev.yml exec backend python manage.py createsuperuser

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Database Operations
```bash
# Run migrations manually
docker-compose -f docker-compose.dev.yml exec backend python manage.py migrate

# Create new migrations
docker-compose -f docker-compose.dev.yml exec backend python manage.py makemigrations

# Reset database (careful!)
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build
```

## Production Deployment

### Setup
```bash
# 1. Create production environment file
cp backend/.env.production.example backend/.env.production

# 2. Set up Firebase service account
# Place service-account.json in backend/ folder

# 3. Update production settings
# Edit backend/.env.production with your production values

# 4. Build and start production services
docker-compose -f docker-compose.prod.yml up --build -d
```

### Production Environment Variables
- Set `DEBUG=False`
- Use strong `SECRET_KEY`
- Configure proper `ALLOWED_HOSTS`
- Set up email configuration
- Enable security settings
- Use production database credentials

## Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check if database is running
docker-compose -f docker-compose.dev.yml ps db

# View database logs
docker-compose -f docker-compose.dev.yml logs db
```

**Migrations Failed**
```bash
# Run migrations manually
docker-compose -f docker-compose.dev.yml exec backend python manage.py migrate

# Check migration status
docker-compose -f docker-compose.dev.yml exec backend python manage.py showmigrations
```

**Static Files Not Loading**
```bash
# Collect static files manually
docker-compose -f docker-compose.dev.yml exec backend python manage.py collectstatic
```

**Firebase Connection Issues**
```bash
# Check if service-account.json exists
ls -la backend/service-account.json

# Verify JSON format
python -m json.tool backend/service-account.json

# Test Firebase connection
docker-compose -f docker-compose.dev.yml exec backend python manage.py test_firebase
```

### Viewing Logs
```bash
# All services
docker-compose -f docker-compose.dev.yml logs

# Specific service
docker-compose -f docker-compose.dev.yml logs backend
docker-compose -f docker-compose.dev.yml logs db

# Follow logs
docker-compose -f docker-compose.dev.yml logs -f backend
```

### Accessing Services
```bash
# Backend shell
docker-compose -f docker-compose.dev.yml exec backend bash

# Django shell
docker-compose -f docker-compose.dev.yml exec backend python manage.py shell

# Database shell
docker-compose -f docker-compose.dev.yml exec db psql -U postgres -d uyren_dev
```

## Security Notes

- Never commit `.env` files to version control
- Never commit `service-account.json` to version control (already in .gitignore)
- Use strong passwords in production
- Keep Firebase service account keys secure
- Regularly update dependencies
- Use HTTPS in production
- Configure proper CORS settings

## File Structure

```
├── docker-compose.dev.yml          # Development Docker Compose
├── docker-compose.prod.yml         # Production Docker Compose
├── backend/
│   ├── .env                        # Active environment (git-ignored)
│   ├── .env.example               # Development template
│   ├── .env.production.example    # Production template
│   ├── service-account.json       # Firebase credentials (git-ignored)
│   ├── .gitignore                 # Git ignore rules
│   ├── entrypoint.sh              # Docker entrypoint script
│   ├── Dockerfile.dev             # Development Dockerfile
│   ├── Dockerfile.prod            # Production Dockerfile
│   └── requirements.txt           # Python dependencies
```
