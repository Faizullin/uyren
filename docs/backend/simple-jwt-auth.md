# Simple JWT Authentication with Firebase

## Overview

This implementation provides a simplified JWT authentication system that integrates with Firebase Authentication without the complexity of refresh tokens. Users authenticate using Firebase ID tokens and receive long-lived JWT access tokens.

## Key Features

- **No Refresh Tokens**: Simplified authentication flow with only access tokens
- **Firebase Integration**: Users authenticate with Firebase ID tokens
- **Automatic User Creation**: New users are automatically created from Firebase data
- **Long-lived Tokens**: 24-hour access tokens reduce the need for frequent re-authentication
- **User Profile Integration**: Firebase user data is automatically mapped to Django user fields

## Authentication Flow

```
1. Client obtains Firebase ID token from Firebase Auth
2. Client sends Firebase ID token to /api/v1/accounts/auth/
3. Backend verifies Firebase token with Firebase Admin SDK
4. Backend creates/retrieves user account
5. Backend generates JWT access token
6. Backend returns access token and user data
7. Client uses access token for subsequent API calls
```

## API Endpoints

### POST /api/v1/accounts/auth/

Simple authentication endpoint that accepts Firebase ID tokens.

**Request:**
```json
{
    "firebase_token": "firebase_id_token_here"
}
```

**Response (Success):**
```json
{
    "access_token": "jwt_access_token_here",
    "user": {
        "id": 1,
        "firebase_uid": "firebase_uid_here",
        "email": "user@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "is_verified": true,
        "profile_picture_url": "https://...",
        "bio": "",
        "created_at": "2025-06-21T10:00:00Z",
        "full_name": "John Doe"
    },
    "is_new_user": false,
    "message": "Authentication successful"
}
```

**Response (Error):**
```json
{
    "error": "Invalid Firebase token"
}
```

## Configuration

### Settings (config/settings/base.py)

```python
# JWT Configuration - Simple access token only
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),  # Long-lived access token
    'REFRESH_TOKEN_LIFETIME': None,  # Disable refresh tokens
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}
```

### Authentication Classes

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    # ... other settings
}
```

## User Model Enhancements

The User model has been enhanced with additional methods:

- `display_name`: Returns the best available display name
- `initials`: Returns user initials for avatar display
- `is_profile_complete()`: Checks if profile is reasonably complete
- `can_publish_posts()`: Checks if user can publish posts
- `get_profile_picture()`: Gets profile picture URL safely

## Usage Examples

### Frontend (JavaScript)

```javascript
// After Firebase authentication
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        const idToken = await user.getIdToken();
        
        // Authenticate with backend
        const response = await fetch('/api/v1/accounts/auth/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                firebase_token: idToken
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Store access token
            localStorage.setItem('access_token', data.access_token);
            
            // Use token for API calls
            const apiResponse = await fetch('/api/v1/posts/', {
                headers: {
                    'Authorization': `Bearer ${data.access_token}`
                }
            });
        }
    }
});
```

### Backend Testing

```bash
# Test authentication with management command
python manage.py test_auth --token "firebase_id_token_here"
```

## Security Considerations

1. **Token Lifetime**: 24-hour tokens reduce security risk while maintaining convenience
2. **Firebase Verification**: All tokens are verified with Firebase Admin SDK
3. **User Creation**: New users are only created with valid Firebase tokens
4. **Email Verification**: User verification status is inherited from Firebase
5. **Profile Updates**: Users can only update their own profiles

## Migration from Refresh Token System

If migrating from a refresh token system:

1. Update frontend to use the new `/auth/` endpoint
2. Remove refresh token storage and logic
3. Handle token expiration by redirecting to Firebase re-authentication
4. Update token refresh logic to re-authenticate with Firebase instead

## Error Handling

Common error scenarios and responses:

- **Invalid Firebase Token**: HTTP 401 with error message
- **Token Format Invalid**: HTTP 400 with validation errors
- **User Creation Failed**: HTTP 500 with error details
- **Firebase Service Unavailable**: HTTP 503 with retry message

## Monitoring and Logging

- Authentication attempts are logged with user creation status
- Failed authentications include error details
- User login timestamps are tracked in `last_login_firebase` field

## Testing

```python
# Test the auth service directly
from apps.accounts.auth_service import SimpleAuthService

auth_service = SimpleAuthService()
result = auth_service.authenticate_with_firebase(firebase_token)

if result['success']:
    access_token = result['access_token']
    user = result['user']
    is_new_user = result['is_new_user']
```

This implementation provides a clean, secure, and maintainable authentication system that integrates seamlessly with Firebase while keeping the backend simple and focused.
