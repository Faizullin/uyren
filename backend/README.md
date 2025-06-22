# Uyren Backend

A Django REST API backend with Firebase authentication integration, modular architecture, and Docker support for development and production environments.

## Features

- 🔥 Firebase Authentication with JWT integration
- 🔐 JWT Token Authentication & refresh
- 👤 Custom User Model with Firebase UID mapping
- 📊 PostgreSQL Database with Docker support
- 🐳 Docker & Docker Compose for dev/prod environments
- 🔧 Abstract Models & Utilities (core app)
- � File Attachments with generic relations (attachments app)
- �📝 Centralized logging system
- 🛠️ Django Debug Toolbar (development)
- 🌍 Environment-based configuration with django-environ
- 📋 Automated database migrations and setup
- 🏷️ Comprehensive API documentation

## Project Structure

```
backend/
├── apps/
│   ├── accounts/          # User authentication, Firebase integration & profiles
│   ├── attachments/       # File uploads with generic relations
│   └── core/             # Shared utilities, abstract models & logging
├── config/               # Django settings (base, development, production)
│   ├── settings/
│   │   ├── base.py       # Common settings
│   │   ├── development.py # Development environment
│   │   └── production.py  # Production environment
│   └── urls.py           # Main URL configuration
├── scripts/              # Management and deployment scripts
├── requirements.txt      # Python dependencies
├── manage.py            # Django management script
├── entrypoint.sh        # Docker entrypoint with auto-migrations
├── docker-compose.dev.yml    # Development environment
├── docker-compose.prod.yml   # Production environment
├── Dockerfile.dev       # Development Docker image
├── Dockerfile.prod      # Production Docker image
├── docker-manage.sh     # Docker management script
├── .env                 # Environment variables (DO NOT COMMIT)
├── .env.example         # Environment template
├── .env.prod.example    # Production environment template
└── .gitignore          # Git ignore rules
```

## Quick Start with Docker

### Option 1: Using Docker Management Script (Recommended)

We provide a convenient script for managing Docker operations:

```bash
# Make the script executable (Linux/Mac)
chmod +x docker-manage.sh

# Start development environment
./docker-manage.sh dev up

# Start production environment
./docker-manage.sh prod up

# View logs
./docker-manage.sh dev logs

# Run database migrations
./docker-manage.sh dev migrate

# Create superuser
./docker-manage.sh dev createsuperuser

# Access Django shell
./docker-manage.sh dev shell

# Run tests
./docker-manage.sh dev test

# Stop services
./docker-manage.sh dev down

# Clean up (remove containers, volumes, images)
./docker-manage.sh dev clean
```

**Windows Users**: Use `docker-manage.bat` instead:
```cmd
docker-manage.bat dev up
docker-manage.bat dev logs
```

### Option 2: Manual Docker Commands

```bash
# Development environment
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml logs -f

# Production environment
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml logs -f
```

## Environment Setup

### 1. Clone and Navigate

```bash
git clone <repository-url>
cd uyren/backend
```

### 2. Environment Configuration

#### Development Environment

Copy and configure the development environment:
```bash
cp .env.example .env
```

Edit `.env` with your development configuration:
```bash
# Django Configuration
SECRET_KEY=your-secret-key-here
DEBUG=True
ENVIRONMENT=development

# Database Configuration
DB_NAME=uyren_dev
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432

# Firebase Configuration (choose one method)
# Method 1: Service Account Key File Path
FIREBASE_SERVICE_ACCOUNT_KEY=/path/to/serviceAccountKey.json

# Method 2: Service Account JSON (as environment variable)
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Development Settings
RUN_MIGRATIONS=true
RUN_COLLECTSTATIC=false
CREATE_SUPERUSER=false
LOAD_FIXTURES=false
```

#### Production Environment

For production, copy the production template:
```bash
cp .env.prod.example .env.prod
```

Configure production settings:
```bash
# Django Configuration
SECRET_KEY=your-production-secret-key
DEBUG=False
ENVIRONMENT=production
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database Configuration
DB_NAME=uyren_prod
DB_USER=postgres
DB_PASSWORD=secure-password
DB_HOST=db
DB_PORT=5432

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_KEY=/app/firebase-key.json

# Production Settings
RUN_MIGRATIONS=true
RUN_COLLECTSTATIC=true
CREATE_SUPERUSER=false
LOAD_FIXTURES=false

# Security Settings
SECURE_SSL_REDIRECT=True
SECURE_PROXY_SSL_HEADER=HTTP_X_FORWARDED_PROTO,https
```

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Go to Project Settings > Service Accounts
4. Generate a new private key
5. Download the JSON file

**Option A**: Save file and update path in `.env`:
```bash
FIREBASE_SERVICE_ACCOUNT_KEY=/path/to/serviceAccountKey.json
```

**Option B**: Use JSON content directly in `.env`:
```bash
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project",...}'
```

## API Endpoints

### Authentication

- `POST /api/auth/firebase-auth/` - Authenticate with Firebase token
- `POST /api/auth/logout/` - Logout user
- `POST /api/auth/token/refresh/` - Refresh JWT token

### User Profile

- `GET /api/auth/profile/` - Get user profile
- `PUT /api/auth/profile/` - Update user profile
- `GET /api/auth/me/` - Get current user info
- `POST /api/auth/refresh-firebase-data/` - Refresh user data from Firebase

### Health Check

- `GET /api/health/` - API health check

## Authentication Flow

1. **Client**: Authenticate with Firebase and get ID token
2. **Client**: Send Firebase ID token to `/api/auth/firebase-auth/`
3. **Backend**: Verify token with Firebase
4. **Backend**: Create/update user in database
5. **Backend**: Return JWT tokens + user data
6. **Client**: Use JWT tokens for subsequent API calls

## Core Utilities

### Abstract Models

- `AbstractTimestampedModel` - Adds created_at/updated_at fields
- `AbstractActiveTimestampedModel` - Adds active status + timestamps
- `AbstractSoftDeleteTimestampedModel` - Adds soft delete + timestamps

### Custom Managers

- `TimestampedManager` - Useful methods for timestamped models
- `ActiveManager` - Only returns active objects
- `SoftDeleteManager` - Excludes soft-deleted objects

### Usage Example

```python
from apps.core.models import AbstractTimestampedModel

class Post(AbstractTimestampedModel):
    title = models.CharField(max_length=200)
    content = models.TextField()
    
    # Automatically gets created_at, updated_at fields
    # and TimestampedManager with useful methods
```

## Development

### Running Tests

```bash
docker-compose -f docker-compose.dev.yml exec backend python manage.py test
```

### Checking Logs

```bash
docker-compose -f docker-compose.dev.yml logs backend
```

### Shell Access

```bash
docker-compose -f docker-compose.dev.yml exec backend python manage.py shell
```

## Configuration

### JWT Settings

JWT tokens are configured in `config/settings/base.py`:
- Access token lifetime: 60 minutes
- Refresh token lifetime: 7 days
- Automatic rotation enabled

### CORS Settings

CORS is configured to allow requests from:
- `http://localhost:3000` (React dev server)
- `http://127.0.0.1:3000`

## Database Schema

### User Model

```python
class User(AbstractUser, AbstractTimestampedModel):
    firebase_uid = CharField(unique=True)
    email = EmailField(unique=True)
    profile_picture_url = URLField(optional)
    bio = TextField(optional)
    date_of_birth = DateField(optional)
    is_verified = BooleanField(default=False)
    last_login_firebase = DateTimeField(optional)
```

## Error Handling

The API uses standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Security Features

- Firebase token verification
- JWT authentication
- CORS protection
- SQL injection prevention (Django ORM)
- XSS protection
- CSRF protection

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests
4. Run tests and ensure they pass
5. Submit a pull request


