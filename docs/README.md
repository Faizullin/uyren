# Uyren Documentation

Welcome to the Uyren project documentation. This is a comprehensive platform featuring a Django REST API backend and Next.js admin frontend.

## 📖 Documentation Structure

### Backend Documentation
- **[Backend README](backend/README.md)** - Complete backend setup and usage guide
- **[Project Summary](backend/PROJECT_SUMMARY.md)** - High-level project overview and features
- **[Configuration Guide](backend/CONFIGURATION.md)** - Environment and configuration setup
- **[Firebase Setup](backend/FIREBASE_SETUP.md)** - Firebase authentication configuration
- **[Attachments System](backend/ATTACHMENTS.md)** - File upload and management system
- **[Error Handling](backend/ERROR_HANDLING.md)** - DRF standardized error handling

### Frontend Documentation
- **[Frontend README](frontend/README.md)** - Next.js admin frontend setup
- **[Code Execution](frontend/CODE_EXECUTION.md)** - Code runner component documentation

### Deployment Documentation
- **[Docker Setup](deployment/DOCKER_SETUP.md)** - Docker deployment and configuration

## 🚀 Quick Start

### 1. Backend Setup
```bash
# Navigate to backend
cd backend

# Copy environment file
cp .env.example .env

# Set up Firebase (place service-account.json in backend folder)

# Start with Docker
docker-compose -f docker-compose.dev.yml up --build
```

### 2. Frontend Setup
```bash
# Navigate to frontend
cd admin-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🏗️ Architecture Overview

```
uyren/
├── backend/              # Django REST API
│   ├── apps/
│   │   ├── accounts/     # Authentication & user management
│   │   ├── attachments/  # File upload system
│   │   ├── core/        # Shared utilities
│   │   └── posts/       # Content management
│   ├── config/          # Django settings
│   └── service-account.json  # Firebase credentials
├── admin-frontend/      # Next.js admin interface
│   └── src/
│       ├── app/         # Next.js pages
│       ├── components/  # React components
│       └── lib/         # Utilities
└── docs/               # This documentation
```

## 🔧 Key Features

### Backend
- 🔥 Firebase Authentication with JWT
- 📊 PostgreSQL Database with Docker
- 📎 Generic File Attachment System
- 🔐 Role-Based Access Control (RBAC)
- 🛠️ Standardized API Error Handling
- 🐳 Docker Development & Production Setup

### Frontend
- ⚡ Next.js 14 with TypeScript
- 🎨 Tailwind CSS + shadcn/ui
- 📝 Code Editor with Execution
- 📊 Data Management Tables
- 🧩 Reusable Component Library

## 🔗 API Endpoints

Base URL: `http://localhost:8000/api/v1/`

- **Authentication**: `/auth/`
- **User Management**: `/users/`
- **File Attachments**: `/attachments/`
- **Posts**: `/posts/`

## 🚀 Deployment

The project supports both development and production deployment via Docker:

- **Development**: `docker-compose.dev.yml`
- **Production**: `docker-compose.prod.yml`

See [Docker Setup Guide](deployment/DOCKER_SETUP.md) for detailed instructions.

## 🧪 Testing

```bash
# Backend tests
docker-compose -f docker-compose.dev.yml exec backend python manage.py test

# Frontend tests
cd admin-frontend && npm test
```

## 📝 Contributing

1. Read the relevant documentation section
2. Set up your development environment
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For questions or issues:
1. Check the relevant documentation section
2. Review troubleshooting sections
3. Check existing issues
4. Create a new issue if needed

---

**Last Updated**: June 2025  
**Version**: 1.0.0
