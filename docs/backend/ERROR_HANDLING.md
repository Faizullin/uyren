# DRF Standardized Error Handling

## Overview

This project implements a standardized error handling system for Django REST Framework (DRF) that ensures all API responses follow a consistent format. The system provides detailed error information, proper HTTP status codes, and comprehensive logging.

## Error Response Format

All API errors follow this standardized format:

```json
{
  "error": {
    "code": "error_code",
    "message": "Human readable error message",
    "details": {
      "field_name": ["Specific validation error"],
      "additional_info": "value"
    },
    "timestamp": "2024-01-01T12:00:00Z",
    "path": "/api/v1/endpoint/",
    "method": "POST",
    "status_code": 400
  }
}
```

## Supported Error Types

### 1. Validation Errors (400 Bad Request)
```json
{
  "error": {
    "code": "validation_error",
    "message": "The provided data is invalid.",
    "details": {
      "email": ["This field is required."],
      "password": ["Password must be at least 8 characters long."]
    },
    "timestamp": "2024-01-01T12:00:00Z",
    "path": "/api/v1/auth/register/",
    "method": "POST",
    "status_code": 400
  }
}
```

### 2. Authentication Errors (401 Unauthorized)
```json
{
  "error": {
    "code": "authentication_required",
    "message": "Authentication credentials were not provided.",
    "timestamp": "2024-01-01T12:00:00Z",
    "path": "/api/v1/protected-endpoint/",
    "method": "GET",
    "status_code": 401
  }
}
```

### 3. Permission Errors (403 Forbidden)
```json
{
  "error": {
    "code": "permission_denied",
    "message": "You do not have permission to perform this action.",
    "details": {
      "required_permission": "attachments.delete_attachment",
      "user_roles": ["user"]
    },
    "timestamp": "2024-01-01T12:00:00Z",
    "path": "/api/v1/attachments/123/",
    "method": "DELETE",
    "status_code": 403
  }
}
```

### 4. Not Found Errors (404 Not Found)
```json
{
  "error": {
    "code": "not_found",
    "message": "The requested resource was not found.",
    "timestamp": "2024-01-01T12:00:00Z",
    "path": "/api/v1/users/999/",
    "method": "GET",
    "status_code": 404
  }
}
```

### 5. Rate Limiting Errors (429 Too Many Requests)
```json
{
  "error": {
    "code": "throttled",
    "message": "Request was throttled. Expected available in 60 seconds.",
    "details": {
      "wait": 60
    },
    "timestamp": "2024-01-01T12:00:00Z",
    "path": "/api/v1/auth/login/",
    "method": "POST",
    "status_code": 429
  }
}
```

### 6. Server Errors (500 Internal Server Error)
```json
{
  "error": {
    "code": "server_error",
    "message": "An internal server error occurred.",
    "timestamp": "2024-01-01T12:00:00Z",
    "path": "/api/v1/complex-operation/",
    "method": "POST",
    "status_code": 500
  }
}
```

## Usage in Views

### Using Custom API Exceptions

```python
from apps.core.exceptions import (
    raise_validation_error,
    raise_authentication_error,
    raise_permission_error,
    raise_not_found_error,
    raise_conflict_error,
    raise_server_error
)

class MyAPIView(APIView):
    def post(self, request):
        # Validation error
        if not request.data.get('email'):
            raise_validation_error(
                message="Email is required",
                details={"email": ["This field is required."]}
            )
        
        # Permission error
        if not request.user.has_permission('my_app.create_resource'):
            raise_permission_error(
                message="Insufficient permissions",
                details={"required_permission": "my_app.create_resource"}
            )
        
        # Not found error
        try:
            obj = MyModel.objects.get(id=request.data['id'])
        except MyModel.DoesNotExist:
            raise_not_found_error(
                message="Resource not found",
                details={"resource_id": request.data['id']}
            )
        
        # Conflict error
        if MyModel.objects.filter(slug=request.data['slug']).exists():
            raise_conflict_error(
                message="Resource already exists",
                details={"conflicting_field": "slug"}
            )
        
        return Response({"success": True})
```

### Using Exception Classes Directly

```python
from apps.core.exceptions import (
    APIValidationError,
    APIPermissionError,
    APINotFoundError
)

class MyViewSet(ModelViewSet):
    def perform_create(self, serializer):
        # Custom validation
        if self.request.user.email_domain_blocked:
            raise APIValidationError(
                detail="Your email domain is not allowed",
                code="blocked_domain"
            )
        
        # Check permissions
        if not self.request.user.can_create_resource():
            raise APIPermissionError(
                detail="You have reached your resource limit",
                code="resource_limit_exceeded"
            )
        
        serializer.save(created_by=self.request.user)
```

## Logging

All exceptions are automatically logged with structured data:

```python
# Logged automatically by the exception handler
logger.error(
    "API Exception: ValidationError - Invalid email format",
    extra={
        'exception_type': 'ValidationError',
        'exception_message': 'Invalid email format',
        'path': '/api/v1/auth/register/',
        'method': 'POST',
        'user': user_instance,
        'traceback': None  # Only for server errors
    }
)
```

## Error Code Reference

| Error Code | Status Code | Description |
|------------|-------------|-------------|
| `validation_error` | 400 | Invalid input data or validation failed |
| `authentication_required` | 401 | No authentication credentials provided |
| `authentication_failed` | 401 | Invalid authentication credentials |
| `permission_denied` | 403 | User lacks required permissions |
| `not_found` | 404 | Requested resource doesn't exist |
| `method_not_allowed` | 405 | HTTP method not supported |
| `not_acceptable` | 406 | Cannot fulfill request with available media types |
| `conflict_error` | 409 | Request conflicts with current state |
| `unsupported_media_type` | 415 | Media type not supported |
| `throttled` | 429 | Rate limit exceeded |
| `server_error` | 500 | Internal server error |
| `parse_error` | 400 | Malformed request body |

## Frontend Integration

### JavaScript/React Example

```javascript
// API client with standardized error handling
class APIClient {
  async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
          ...options.headers
        },
        ...options
      });

      const data = await response.json();

      if (!response.ok) {
        throw new APIError(data.error, response.status);
      }

      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError({
        code: 'network_error',
        message: 'Network request failed',
        status_code: 0
      });
    }
  }
}

class APIError extends Error {
  constructor(errorData, statusCode = null) {
    super(errorData.message || 'An error occurred');
    this.code = errorData.code;
    this.details = errorData.details;
    this.timestamp = errorData.timestamp;
    this.path = errorData.path;
    this.method = errorData.method;
    this.statusCode = statusCode || errorData.status_code;
  }
  
  isValidationError() {
    return this.code === 'validation_error';
  }
  
  isAuthenticationError() {
    return ['authentication_required', 'authentication_failed'].includes(this.code);
  }
  
  isPermissionError() {
    return this.code === 'permission_denied';
  }
  
  isNotFoundError() {
    return this.code === 'not_found';
  }
  
  isServerError() {
    return this.statusCode >= 500;
  }
}

// Usage example
const api = new APIClient();

try {
  const user = await api.request('/api/v1/auth/profile/', {
    method: 'GET'
  });
} catch (error) {
  if (error.isAuthenticationError()) {
    // Redirect to login
    window.location.href = '/login';
  } else if (error.isValidationError()) {
    // Show validation errors
    Object.entries(error.details).forEach(([field, messages]) => {
      showFieldError(field, messages);
    });
  } else if (error.isServerError()) {
    // Show generic error message
    showNotification('Server error occurred. Please try again later.');
  }
}
```

### Error Display Components

```javascript
// React component for displaying API errors
const ErrorDisplay = ({ error }) => {
  if (!error) return null;

  return (
    <div className={`alert alert-${getAlertType(error.code)}`}>
      <h4>{error.message}</h4>
      {error.details && (
        <ul>
          {Object.entries(error.details).map(([field, messages]) => (
            <li key={field}>
              <strong>{field}:</strong> {Array.isArray(messages) ? messages.join(', ') : messages}
            </li>
          ))}
        </ul>
      )}
      {error.timestamp && (
        <small>Occurred at: {new Date(error.timestamp).toLocaleString()}</small>
      )}
    </div>
  );
};

const getAlertType = (errorCode) => {
  switch (errorCode) {
    case 'validation_error':
      return 'warning';
    case 'authentication_required':
    case 'authentication_failed':
      return 'info';
    case 'permission_denied':
      return 'danger';
    case 'not_found':
      return 'info';
    case 'server_error':
      return 'danger';
    default:
      return 'warning';
  }
};
```

## Testing

### Testing Custom Exceptions

```python
from django.test import TestCase
from rest_framework.test import APITestCase
from apps.core.exceptions import APIValidationError

class ErrorHandlingTestCase(APITestCase):
    def test_validation_error_format(self):
        response = self.client.post('/api/v1/test-endpoint/', {})
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)
        
        error = response.data['error']
        self.assertEqual(error['code'], 'validation_error')
        self.assertIn('message', error)
        self.assertIn('timestamp', error)
        self.assertIn('path', error)
        self.assertIn('method', error)
        self.assertIn('status_code', error)
    
    def test_permission_error_format(self):
        # Test permission error
        response = self.client.get('/api/v1/protected-endpoint/')
        
        self.assertEqual(response.status_code, 403)
        error = response.data['error']
        self.assertEqual(error['code'], 'permission_denied')
    
    def test_custom_exception_raising(self):
        with self.assertRaises(APIValidationError):
            from apps.core.exceptions import raise_validation_error
            raise_validation_error("Test error")
```

## Configuration

The exception handler is configured in `config/settings/base.py`:

```python
REST_FRAMEWORK = {
    # ... other settings
    'EXCEPTION_HANDLER': 'apps.core.exceptions.custom_exception_handler',
}
```

## Best Practices

1. **Use appropriate error types**: Choose the correct exception type for the situation
2. **Provide helpful details**: Include relevant information in the `details` field
3. **Log appropriately**: The system automatically logs errors, but you can add custom logging
4. **Be consistent**: Always use the standardized exceptions for API responses
5. **Handle gracefully**: Provide fallback messages for unexpected errors
6. **Test thoroughly**: Ensure your error handling works as expected

## Backward Compatibility

The system maintains backward compatibility by keeping the original `CoreException` classes. You can gradually migrate from the old exceptions to the new API exceptions:

```python
# Old way (still works)
from apps.core.exceptions import ValidationException
raise ValidationException("Error message")

# New way (recommended)
from apps.core.exceptions import raise_validation_error
raise_validation_error("Error message", details={"field": "error"})
```
