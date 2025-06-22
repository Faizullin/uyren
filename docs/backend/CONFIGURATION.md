# Configuration Guide

This guide explains how to configure the Uyren backend using django-environ for environment-based settings.

## Environment Variables

The project uses `django-environ` for configuration management, which provides a clean way to handle environment variables with type casting and default values.

### Required Settings

Create a `.env` file in the backend directory based on `.env.example`:

```bash
cp .env.example .env
```

### Core Settings

```env
# Django Core
SECRET_KEY=your-very-long-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
```

### Database Configuration

**Option 1: Using DATABASE_URL (Recommended)**
```env
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/uyren_dev
```

**Option 2: Individual Settings**
```env
DB_NAME=uyren_dev
DB_USER=postgres
DB_PASSWORD=postgres123
DB_HOST=localhost
DB_PORT=5432
```

### Firebase Configuration

Firebase authentication now uses a `service-account.json` file placed in the backend root folder. No environment variables are needed for Firebase configuration.

## Firebase Setup Steps

### 1. Download Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Download the JSON file

### 2. Configure Firebase

1. Rename the downloaded file to `service-account.json`
2. Place it in the backend root folder (same level as `manage.py`)
3. The file is already added to `.gitignore` for security

### 3. Test Firebase Connection

```bash
python manage.py test_firebase
```

## Development Features

### Django Debug Toolbar

The debug toolbar is automatically enabled in development when `DEBUG=True`. It provides:

- SQL query analysis
- Template rendering information
- Cache usage statistics
- Signal tracking
- Request/response headers

Access it at: `http://localhost:8000/__debug__/`

### Enhanced Logging

Development logging is configured to:
- Log to console with verbose formatting
- Log to file: `logs/debug.log`
- Separate loggers for Django and app-specific code

Configure log level:
```env
DJANGO_LOG_LEVEL=DEBUG
```

## Environment-Specific Settings

### Development Settings

```python
# config/settings/development.py
from .base import *

DEBUG = True
DATABASES['default'].update({'HOST': 'db'})  # Docker
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Debug toolbar enabled automatically
# Enhanced logging to console and file
```

### Production Settings

```python
# config/settings/production.py
from .base import *

DEBUG = False
# Security headers enabled
# SMTP email backend
# Optimized database connections
```

## Docker Configuration

### Development Docker

The docker-compose.dev.yml is configured to work with environment variables:

```yaml
services:
  backend:
    environment:
      - DEBUG=1
      - DATABASE_URL=postgresql://postgres:postgres123@db:5432/uyren_dev
```

### Environment in Docker

Mount your `.env` file or pass environment variables:

```yaml
volumes:
  - ./.env:/app/.env
# OR
environment:
  - SECRET_KEY=${SECRET_KEY}
  - DATABASE_URL=${DATABASE_URL}
```

For Firebase, mount the service account file:
```yaml
volumes:
  - ./service-account.json:/app/service-account.json
```

## Type Casting and Defaults

django-environ provides automatic type casting:

```python
# In settings/base.py
env = environ.Env(
    DEBUG=(bool, False),                    # Cast to boolean, default False
    SECRET_KEY=(str, 'fallback-key'),       # String with default
    ALLOWED_HOSTS=(list, ['localhost']),    # Comma-separated to list
    DATABASE_URL=(str, 'sqlite:///db.sqlite3'),  # Database URL
)

# Usage examples:
DEBUG = env('DEBUG')                        # True/False from env
PORT = env.int('PORT', default=8000)        # Cast to integer
FEATURE_ENABLED = env.bool('FEATURE_ENABLED', False)  # Boolean
EMAIL_ADMINS = env.list('EMAIL_ADMINS')     # Comma-separated list
CACHE_URL = env.cache_url('CACHE_URL')      # Parse cache URL
```

## Security Best Practices

### Secret Key Generation

```python
# Generate a new secret key
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

### Environment File Security

- Never commit `.env` files to version control
- Never commit `service-account.json` to version control (already in .gitignore)
- Use different `.env` files for different environments
- Restrict file permissions: `chmod 600 .env` and `chmod 600 service-account.json`
- Use secrets management in production (AWS Secrets Manager, etc.)

### Production Checklist

- [ ] `DEBUG=False`
- [ ] Strong `SECRET_KEY`
- [ ] Proper `ALLOWED_HOSTS`
- [ ] Secure database credentials
- [ ] HTTPS configuration
- [ ] Proper Firebase service account setup with `service-account.json`

## Troubleshooting

### Common Issues

**Firebase not initializing:**
```bash
# Test Firebase configuration
python manage.py test_firebase

# Check if service-account.json exists
ls -la service-account.json

# Verify JSON format
python -m json.tool service-account.json
```

**Database connection issues:**
```bash
# Test database connection
python manage.py dbshell

# Check database URL parsing
python manage.py shell
>>> from django.conf import settings
>>> print(settings.DATABASES)
```

**Debug toolbar not showing:**
- Ensure `DEBUG=True`
- Check `INTERNAL_IPS` settings
- Verify debug toolbar in `INSTALLED_APPS`

### Environment Variable Debugging

```python
# In Django shell
from django.conf import settings
import environ

env = environ.Env()
print("Current environment variables:")
for key in ['DEBUG', 'SECRET_KEY', 'DATABASE_URL']:
    print(f"{key}: {env(key, default='NOT_SET')}")
```

## Migration from python-decouple

If migrating from python-decouple:

1. Update imports:
   ```python
   # Old
   from decouple import config
   
   # New
   import environ
   env = environ.Env()
   ```

2. Update usage:
   ```python
   # Old
   DEBUG = config('DEBUG', default=True, cast=bool)
   
   # New
   DEBUG = env.bool('DEBUG', default=True)
   ```

3. Update requirements.txt:
   ```
   # Remove
   python-decouple==3.8
   
   # Keep
   django-environ==0.11.2
   ```
