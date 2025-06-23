"""
Core exceptions - Migration to drf-standardized-errors

This module has been updated to use drf-standardized-errors library 
for consistent API error responses across the application.

The drf-standardized-errors library provides:
- Consistent error response format
- Proper HTTP status codes  
- Field-specific validation errors
- Built-in support for all DRF exceptions

Standard error response format from drf-standardized-errors:
{
    "type": "validation_error",
    "errors": [
        {
            "code": "required",
            "detail": "This field is required.",
            "attr": "field_name"
        }
    ]
}

For non-field errors:
{
    "type": "validation_error", 
    "errors": [
        {
            "code": "invalid",
            "detail": "Error message",
            "attr": null
        }
    ]
}

Use standard DRF exceptions directly:
- rest_framework.exceptions.ValidationError (400)
- rest_framework.exceptions.AuthenticationFailed (401)
- rest_framework.exceptions.NotAuthenticated (401)  
- rest_framework.exceptions.PermissionDenied (403)
- rest_framework.exceptions.NotFound (404)
- rest_framework.exceptions.MethodNotAllowed (405)
- rest_framework.exceptions.Throttled (429)
- rest_framework.exceptions.APIException (500)

Example usage:
    from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied
    
    # Field-specific validation error
    raise ValidationError({'email': ['This field is required.']})
    
    # Non-field validation error  
    raise ValidationError('Invalid data provided.')
    
    # Resource not found
    raise NotFound('User not found.')
    
    # Permission denied
    raise PermissionDenied('You do not have permission to perform this action.')
"""

from rest_framework.exceptions import (
    ValidationError,
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    NotFound,
    MethodNotAllowed,
    NotAcceptable,
    UnsupportedMediaType,
    Throttled,
    ParseError,
    APIException
)
import logging

logger = logging.getLogger(__name__)


# Legacy Core Exceptions (DEPRECATED - use standard DRF exceptions)
class CoreException(Exception):
    """Base exception for core app - DEPRECATED"""
    pass


class ValidationException(CoreException):
    """DEPRECATED - Use rest_framework.exceptions.ValidationError"""
    pass


class AuthenticationException(CoreException):
    """DEPRECATED - Use rest_framework.exceptions.AuthenticationFailed"""
    pass


class PermissionException(CoreException):
    """DEPRECATED - Use rest_framework.exceptions.PermissionDenied"""
    pass


class NotFoundError(CoreException):
    """DEPRECATED - Use rest_framework.exceptions.NotFound"""
    pass


class DuplicateError(CoreException):
    """DEPRECATED - Use rest_framework.exceptions.ValidationError"""
    pass


class FirebaseAuthError(AuthenticationException):
    """DEPRECATED - Use rest_framework.exceptions.AuthenticationFailed"""
    pass


class InvalidTokenError(AuthenticationException):
    """DEPRECATED - Use rest_framework.exceptions.AuthenticationFailed"""
    pass


# Legacy convenience functions (DEPRECATED)
def raise_validation_error(message=None, details=None):
    """
    DEPRECATED - Use: raise ValidationError(message) or raise ValidationError({'field': [message]})
    
    Migration examples:
    OLD: raise_validation_error("Invalid data", details={'field': 'error'})
    NEW: raise ValidationError({'field': ['error']})
    
    OLD: raise_validation_error("Invalid data")  
    NEW: raise ValidationError("Invalid data")
    """
    logger.warning(
        "raise_validation_error is deprecated. "
        "Use rest_framework.exceptions.ValidationError directly."
    )
    if details and isinstance(details, dict):
        raise ValidationError(details)
    else:
        raise ValidationError(message or "Validation error")


def raise_authentication_error(message=None, details=None):
    """
    DEPRECATED - Use: raise AuthenticationFailed(message)
    
    Migration example:
    OLD: raise_authentication_error("Invalid token")
    NEW: raise AuthenticationFailed("Invalid token")
    """
    logger.warning(
        "raise_authentication_error is deprecated. "
        "Use rest_framework.exceptions.AuthenticationFailed directly."
    )
    raise AuthenticationFailed(message or "Authentication failed")


def raise_permission_error(message=None, details=None):
    """
    DEPRECATED - Use: raise PermissionDenied(message)
    
    Migration example:
    OLD: raise_permission_error("Access denied")
    NEW: raise PermissionDenied("Access denied")
    """
    logger.warning(
        "raise_permission_error is deprecated. "
        "Use rest_framework.exceptions.PermissionDenied directly."
    )
    raise PermissionDenied(message or "Permission denied")


def raise_not_found_error(message=None, details=None):
    """
    DEPRECATED - Use: raise NotFound(message)
    
    Migration example:
    OLD: raise_not_found_error("User not found")
    NEW: raise NotFound("User not found")
    """
    logger.warning(
        "raise_not_found_error is deprecated. "
        "Use rest_framework.exceptions.NotFound directly."
    )
    raise NotFound(message or "Not found")


def raise_conflict_error(message=None, details=None):
    """
    DEPRECATED - Use: raise ValidationError(message) for conflict situations
    
    Migration example:
    OLD: raise_conflict_error("Duplicate resource")
    NEW: raise ValidationError("Resource with this name already exists")
    """
    logger.warning(
        "raise_conflict_error is deprecated. "
        "Use rest_framework.exceptions.ValidationError directly."
    )
    if details and isinstance(details, dict):
        raise ValidationError(details)
    else:
        raise ValidationError(message or "Conflict error")


def raise_server_error(message=None, details=None):
    """
    DEPRECATED - Use: raise APIException(message)
    
    Migration example:
    OLD: raise_server_error("Internal error")
    NEW: raise APIException("Internal error")
    """
    logger.warning(
        "raise_server_error is deprecated. "
        "Use rest_framework.exceptions.APIException directly."
    )
    raise APIException(message or "Server error")


# Standard DRF exceptions are now handled by drf-standardized-errors
# No custom exception handler needed - the library handles everything!

# Migration guide examples:

def validation_examples():
    """Examples of proper ValidationError usage with drf-standardized-errors"""
    
    # Field-specific validation error
    raise ValidationError({
        'email': ['This field is required.'],
        'password': ['Password must be at least 8 characters.']
    })
    
    # Non-field validation error
    raise ValidationError('The provided data is invalid.')
    
    # Multiple non-field errors
    raise ValidationError(['Error 1', 'Error 2'])


def authentication_examples():
    """Examples of proper authentication error usage"""
    
    # Simple authentication error
    raise AuthenticationFailed('Invalid credentials.')
    
    # Not authenticated (no credentials)
    raise NotAuthenticated('Authentication credentials were not provided.')


def permission_examples():
    """Examples of proper permission error usage"""
    
    # Simple permission error
    raise PermissionDenied('You do not have permission to perform this action.')


def not_found_examples():
    """Examples of proper NotFound error usage"""
    
    # Simple not found error
    raise NotFound('The requested resource was not found.')
    
    # Specific resource not found
    raise NotFound('User with id 123 not found.')


def other_examples():
    """Examples of other standard DRF errors"""
    
    # Parse error
    raise ParseError('Malformed JSON.')
    
    # Method not allowed
    raise MethodNotAllowed('POST')
    
    # Throttled
    raise Throttled(wait=60)
    
    # Generic server error
    raise APIException('An unexpected error occurred.')
