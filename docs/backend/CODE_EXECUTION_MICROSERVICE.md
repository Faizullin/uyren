# Code Execution Microservice Integration Guide

## Overview

This document describes the integration of the new FastAPI-based code execution microservice with the existing Django backend. The microservice handles code submissions, executes them via third-party APIs, and sends results back to the main application via webhooks.

## Architecture

```
┌─────────────────┐    ┌────────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Django Backend   │    │  Code Execution │
│   (Next.js)     │◄───┤   (Main Service)   │◄───┤   Microservice  │
└─────────────────┘    └────────────────────┘    └─────────────────┘
                                │                          │
                                │                          │
                                ▼                          ▼
                       ┌────────────────────┐    ┌─────────────────┐
                       │   PostgreSQL       │    │  Third-party    │
                       │   (Main DB)        │    │  Code Execution │
                       └────────────────────┘    │  API            │
                                                 └─────────────────┘
```

## Components Added

### 1. FastAPI Microservice (`code-execution-service/`)

**Key Files:**
- `app/main.py` - FastAPI application entry point
- `app/config.py` - Service configuration
- `app/database.py` - Database models and connection
- `app/services/code_execution.py` - Third-party API integration
- `app/services/webhook.py` - Webhook notifications
- `app/routes/` - API endpoints
- `Dockerfile.dev` & `Dockerfile.prod` - Container definitions

**Features:**
- RESTful API for code submissions and contests
- Asynchronous code execution via third-party services
- Webhook notifications to main backend
- Support for multiple programming languages
- Health checks and monitoring endpoints

### 2. Django Backend Integration (`backend/apps/code_execution/`)

**Key Files:**
- `models.py` - Database models for contests and submissions
- `views.py` - API endpoints and webhook handler
- `serializers.py` - Data serialization
- `services.py` - Microservice communication
- `admin.py` - Django admin interface

**Features:**
- Contest management
- Code submission tracking
- Webhook endpoint for result notifications
- Integration with existing user authentication
- Admin interface for monitoring

## API Endpoints

### Microservice Endpoints

```
GET    /health/                     - Health check
GET    /health/ready                - Readiness check
POST   /api/v1/submissions/         - Create submission
GET    /api/v1/submissions/{id}     - Get submission
GET    /api/v1/submissions/         - List submissions
POST   /api/v1/submissions/{id}/execute - Execute submission
POST   /api/v1/contests/            - Create contest
GET    /api/v1/contests/{id}        - Get contest
GET    /api/v1/contests/            - List contests
PUT    /api/v1/contests/{id}        - Update contest
DELETE /api/v1/contests/{id}        - Delete contest
```

### Django Backend Endpoints

```
GET    /api/code-execution/contests/     - List contests
POST   /api/code-execution/contests/     - Create contest
GET    /api/code-execution/submissions/  - List submissions
POST   /api/code-execution/submissions/  - Create submission
GET    /api/code-execution/health/       - Microservice health
POST   /api/webhooks/code-execution/     - Webhook endpoint
```

## Setup Instructions

### 1. Environment Configuration

Create environment files for both services:

**Backend (.env):**
```env
# Existing variables...

# Code Execution Service
CODE_EXECUTION_SERVICE_URL=http://localhost:8001
CODE_EXECUTION_TIMEOUT=30.0
CODE_EXECUTION_WEBHOOK_SECRET=your-webhook-secret-key
```

**Microservice (code-execution-service/.env):**
```env
# Database
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/uyren_code_execution

# Code Execution API
CODE_EXECUTION_API_URL=https://onlinecompiler.io/api/v2/run-code/
CODE_EXECUTION_API_KEY=your-api-key

# Backend Service
BACKEND_SERVICE_URL=http://localhost:8000
BACKEND_WEBHOOK_SECRET=your-webhook-secret-key
```

### 2. Development Setup

#### Option A: Docker (Recommended)

1. Uncomment the code execution service in `docker-compose.dev.yml`
2. Run: `docker-compose -f docker-compose.dev.yml up`

#### Option B: Local Development

1. Set up the microservice:
   ```bash
   ./manage-code-execution.sh setup
   ./manage-code-execution.sh dev
   ```

2. Run Django migrations:
   ```bash
   python manage.py makemigrations code_execution
   python manage.py migrate
   ```

### 3. Usage Examples

#### Creating a Contest

```python
import httpx

# Via Django API
contest_data = {
    "title": "Python Coding Challenge",
    "description": "Basic Python programming contest",
    "is_active": True
}

async with httpx.AsyncClient() as client:
    response = await client.post(
        "http://localhost:8000/api/code-execution/contests/",
        json=contest_data,
        headers={"Authorization": "Bearer your-jwt-token"}
    )
    contest = response.json()
```

#### Submitting Code

```python
submission_data = {
    "contest": 1,
    "code": "print('Hello, World!')",
    "language": "python",
    "input_data": ""
}

async with httpx.AsyncClient() as client:
    response = await client.post(
        "http://localhost:8000/api/code-execution/submissions/",
        json=submission_data,
        headers={"Authorization": "Bearer your-jwt-token"}
    )
    submission = response.json()
```

## Webhook Integration

The microservice sends webhook notifications when code execution completes:

### Webhook Payload

```json
{
  "submission_id": 123,
  "user_id": 456,
  "contest_id": 789,
  "status": "completed",
  "output": "Hello, World!",
  "error_output": null,
  "execution_time": "0.045s",
  "memory_usage": "8.2MB",
  "completed_at": "2024-01-15T10:30:00Z"
}
```

### Webhook Security

- Webhooks are secured using HMAC-SHA256 signatures
- The signature is sent in the `X-Webhook-Secret` header
- Configure `CODE_EXECUTION_WEBHOOK_SECRET` in both services

## Supported Languages

| Language   | Compiler/Runtime | Identifier    |
|------------|------------------|---------------|
| Python     | python-3.9.7     | python        |
| JavaScript | nodejs-16.17.0   | javascript    |
| Java       | java-17.0.2      | java          |
| C++        | gcc-9.4.0        | cpp           |
| C          | gcc-9.4.0        | c             |
| C#         | dotnet-6.0       | csharp        |
| Go         | go-1.18.3        | go            |
| Rust       | rust-1.62.0      | rust          |

## Database Schema

### New Django Models

#### Contest
- `id` - Primary key
- `title` - Contest title
- `description` - Contest description
- `created_at` - Creation timestamp
- `is_active` - Whether contest is active
- `start_time` - Contest start time
- `end_time` - Contest end time
- `max_participants` - Maximum participants

#### CodeSubmission
- `id` - Primary key
- `microservice_submission_id` - Reference to microservice
- `user` - Foreign key to User model
- `contest` - Foreign key to Contest model
- `code` - Source code
- `language` - Programming language
- `status` - Execution status
- `output` - Program output
- `error_output` - Error messages
- `execution_time` - Execution time
- `memory_usage` - Memory usage
- `score` - Contest score
- `is_correct` - Automated grading result

#### ContestParticipant
- `id` - Primary key
- `contest` - Foreign key to Contest
- `user` - Foreign key to User
- `joined_at` - Join timestamp
- `final_score` - Final contest score
- `rank` - Contest rank

### Microservice Models

#### Contest
- `id` - Primary key
- `title` - Contest title
- `description` - Contest description
- `created_at` - Creation timestamp
- `is_active` - Whether contest is active

#### Submission
- `id` - Primary key
- `contest_id` - Foreign key to contests
- `user_id` - Reference to main app user
- `code` - Source code
- `language` - Programming language
- `status` - Execution status
- `output` - Program output
- `error_output` - Error messages
- `execution_time` - Execution time
- `memory_usage` - Memory usage
- `webhook_sent` - Whether webhook was sent
- `webhook_response` - Webhook response status

## Deployment Considerations

### Production Setup

1. **Environment Variables**: Set production values for all configuration
2. **Database**: Use separate PostgreSQL instances for each service
3. **Security**: Configure proper API keys and webhook secrets
4. **Monitoring**: Set up logging and health checks
5. **Scaling**: Configure load balancing for the microservice

### Docker Production

Update `docker-compose.prod.yml` to include:

```yaml
  code-execution-service:
    build:
      context: ./code-execution-service
      dockerfile: Dockerfile.prod
    container_name: uyren_code_execution_prod
    env_file:
      - ./code-execution-service/.env.prod
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/uyren_code_execution
      - BACKEND_SERVICE_URL=http://backend:8000
    expose:
      - "8001"
    depends_on:
      - db
      - redis
      - backend
    networks:
      - uyren_network
    restart: unless-stopped
```

## Monitoring and Debugging

### Health Checks

```bash
# Check microservice health
curl http://localhost:8001/health/

# Check database connectivity
curl http://localhost:8001/health/ready

# Check from Django backend
curl http://localhost:8000/api/code-execution/health/
```

### Logs

```bash
# Docker logs
docker-compose logs -f code-execution-service

# Service logs
tail -f code-execution-service/logs/app.log

# Django logs
tail -f backend/logs/django.log
```

## Security Best Practices

1. **API Keys**: Store third-party API keys securely
2. **Webhook Secrets**: Use strong, unique webhook secrets
3. **Input Validation**: Validate all user inputs
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Code Sandboxing**: Rely on third-party service for secure execution
6. **Network Security**: Use proper firewall rules and network isolation

## Troubleshooting

### Common Issues

1. **Microservice Not Starting**
   - Check database connection
   - Verify environment variables
   - Check port availability

2. **Webhook Failures**
   - Verify webhook secret configuration
   - Check network connectivity
   - Review Django logs for errors

3. **Code Execution Timeouts**
   - Check third-party API status
   - Verify API key validity
   - Review timeout settings

### Debug Commands

```bash
# Test microservice directly
curl -X POST http://localhost:8001/api/v1/submissions/ \
  -H "Content-Type: application/json" \
  -d '{"code":"print(\"test\")", "language":"python", "user_id":1}'

# Test webhook endpoint
curl -X POST http://localhost:8000/api/webhooks/code-execution/ \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your-secret" \
  -d '{"submission_id":1, "user_id":1, "status":"completed", "completed_at":"2024-01-01T00:00:00Z"}'
```

## Future Enhancements

1. **Batch Processing**: Support for multiple submissions
2. **Contest Scheduling**: Automated contest management
3. **Real-time Updates**: WebSocket support for live results
4. **Code Analysis**: Static code analysis and quality metrics
5. **Plagiarism Detection**: Code similarity checking
6. **Custom Test Cases**: User-defined test cases for problems
7. **Leaderboards**: Real-time contest leaderboards
8. **Code Review**: Peer code review features

## Contributing

When adding new features:

1. Update both microservice and Django models as needed
2. Maintain API compatibility
3. Add appropriate tests
4. Update documentation
5. Follow security best practices
6. Test webhook integration thoroughly

## Support

For issues or questions:
1. Check the logs for error details
2. Verify configuration settings
3. Test individual components separately
4. Review the webhook payload format
5. Check network connectivity between services
