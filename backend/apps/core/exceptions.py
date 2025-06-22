"""
Core exceptions and error handling for standardized API responses.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.http import Http404
from django.core.exceptions import PermissionDenied, ValidationError as DjangoValidationError
from rest_framework.exceptions import (
    ValidationError,
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied as DRFPermissionDenied,
    NotFound,
    MethodNotAllowed,
    NotAcceptable,
    UnsupportedMediaType,
    Throttled,
    ParseError,
    APIException
)
import logging
import traceback
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


# Legacy Core Exceptions (keeping for backward compatibility)
class CoreException(Exception):
    """Base exception for core app"""
    pass


class ValidationException(CoreException):
    """Exception raised for validation errors"""
    pass


class AuthenticationException(CoreException):
    """Exception raised for authentication errors"""
    pass


class PermissionException(CoreException):
    """Exception raised for permission errors"""
    pass


class NotFoundError(CoreException):
    """Exception raised when a resource is not found"""
    pass


class DuplicateError(CoreException):
    """Exception raised when trying to create a duplicate resource"""
    pass


class FirebaseAuthError(AuthenticationException):
    """Exception raised for Firebase authentication errors"""
    pass


class InvalidTokenError(AuthenticationException):
    """Exception raised for invalid token errors"""
    pass


# DRF API Exceptions for standardized responses
class APIError(APIException):
    """Base API error class for custom exceptions."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'A server error occurred.'
    default_code = 'error'

    def __init__(self, detail=None, code=None, status_code=None):
        if status_code:
            self.status_code = status_code
        super().__init__(detail, code)


class APIValidationError(APIError):
    """Custom validation error."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Invalid input data.'
    default_code = 'validation_error'


class APIAuthenticationError(APIError):
    """Custom authentication error."""
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = 'Authentication credentials were not provided or are invalid.'
    default_code = 'authentication_error'


class APIPermissionError(APIError):
    """Custom permission error."""
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'You do not have permission to perform this action.'
    default_code = 'permission_error'


class APINotFoundError(APIError):
    """Custom not found error."""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'The requested resource was not found.'
    default_code = 'not_found'


class APIConflictError(APIError):
    """Custom conflict error."""
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'The request could not be completed due to a conflict.'
    default_code = 'conflict_error'


class APIRateLimitError(APIError):
    """Custom rate limit error."""
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = 'Request was throttled. Expected available in %s seconds.'
    default_code = 'throttled'


class APIServerError(APIError):
    """Custom server error."""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'A server error occurred.'
    default_code = 'server_error'


def custom_exception_handler(exc, context) -> Response:
    """
    Custom exception handler that returns standardized error responses.
    
    Standardized error response format:
    {
        "error": {
            "code": "error_code",
            "message": "Human readable error message",
            "details": {...},  # Additional error details
            "timestamp": "2024-01-01T00:00:00Z",
            "path": "/api/v1/endpoint/",
            "method": "POST",
            "status_code": 400
        }
    }
    """
    # Get the standard DRF error response
    response = exception_handler(exc, context)
    
    # Get request information
    request = context.get('request')
    path = request.path if request else None
    method = request.method if request else None
    
    # Import here to avoid circular imports
    from django.utils import timezone
    
    # Log the exception
    logger.error(
        f"API Exception: {exc.__class__.__name__} - {str(exc)}",
        extra={
            'exception_type': exc.__class__.__name__,
            'exception_message': str(exc),
            'path': path,
            'method': method,
            'user': getattr(request, 'user', None) if request else None,
            'traceback': traceback.format_exc() if not isinstance(exc, (
                ValidationError, AuthenticationFailed, NotAuthenticated,
                DRFPermissionDenied, NotFound, MethodNotAllowed
            )) else None
        }
    )
    
    if response is not None:
        # Map DRF exceptions to our error codes and messages
        error_mapping = {
            ValidationError: {
                'code': 'validation_error',
                'message': 'The provided data is invalid.'
            },
            AuthenticationFailed: {
                'code': 'authentication_failed',
                'message': 'Authentication credentials are invalid.'
            },
            NotAuthenticated: {
                'code': 'authentication_required',
                'message': 'Authentication credentials were not provided.'
            },
            DRFPermissionDenied: {
                'code': 'permission_denied',
                'message': 'You do not have permission to perform this action.'
            },
            NotFound: {
                'code': 'not_found',
                'message': 'The requested resource was not found.'
            },
            MethodNotAllowed: {
                'code': 'method_not_allowed',
                'message': f'Method "{method}" not allowed.'
            },
            NotAcceptable: {
                'code': 'not_acceptable',
                'message': 'The request cannot be fulfilled with the available media types.'
            },
            UnsupportedMediaType: {
                'code': 'unsupported_media_type',
                'message': 'The media type is not supported.'
            },
            Throttled: {
                'code': 'throttled',
                'message': 'Request was throttled.'
            },
            ParseError: {
                'code': 'parse_error',
                'message': 'Malformed request.'
            }
        }
        
        # Handle our custom API errors
        if isinstance(exc, APIError):
            error_code = getattr(exc, 'default_code', 'api_error')
            error_message = str(exc.detail) if hasattr(exc, 'detail') else str(exc)
        else:
            # Handle DRF built-in exceptions
            error_info = error_mapping.get(exc.__class__, {
                'code': 'api_error',
                'message': 'An error occurred.'
            })
            error_code = error_info['code']
            error_message = error_info['message']
        
        # Extract details from the original response
        details = response.data if response.data != error_message else None
        
        # Handle validation errors specially to preserve field-specific errors
        if isinstance(exc, (ValidationError, DjangoValidationError)):
            if isinstance(response.data, dict):
                details = response.data
            elif isinstance(response.data, list):
                details = {'non_field_errors': response.data}
            else:
                details = {'error': response.data}
        
        # Handle throttling specially to include wait time
        if isinstance(exc, Throttled):
            wait_time = getattr(exc, 'wait', None)
            if wait_time:
                error_message = f'Request was throttled. Expected available in {wait_time} seconds.'
                details = {'wait': wait_time}
        
        # Create standardized error response
        custom_response_data = {
            'error': {
                'code': error_code,
                'message': error_message,
                'timestamp': timezone.now().isoformat(),
                'path': path,
                'method': method,
                'status_code': response.status_code
            }
        }
        
        # Add details if available
        if details:
            custom_response_data['error']['details'] = details
        
        response.data = custom_response_data
    
    else:
        # Handle non-DRF exceptions (Django exceptions)
        from django.utils import timezone
        
        if isinstance(exc, Http404):
            status_code = status.HTTP_404_NOT_FOUND
            error_code = 'not_found'
            error_message = 'The requested resource was not found.'
        elif isinstance(exc, PermissionDenied):
            status_code = status.HTTP_403_FORBIDDEN
            error_code = 'permission_denied'
            error_message = 'You do not have permission to perform this action.'
        elif isinstance(exc, DjangoValidationError):
            status_code = status.HTTP_400_BAD_REQUEST
            error_code = 'validation_error'
            error_message = 'The provided data is invalid.'
        else:
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            error_code = 'server_error'
            error_message = 'An internal server error occurred.'
        
        # Create response for non-DRF exceptions
        response_data = {
            'error': {
                'code': error_code,
                'message': error_message,
                'timestamp': timezone.now().isoformat(),
                'path': path,
                'method': method,
                'status_code': status_code
            }
        }
        
        # Add details for validation errors
        if isinstance(exc, DjangoValidationError):
            if hasattr(exc, 'message_dict'):
                response_data['error']['details'] = exc.message_dict
            elif hasattr(exc, 'messages'):
                response_data['error']['details'] = {'non_field_errors': exc.messages}
        
        response = Response(response_data, status=status_code)
    
    return response


def handle_api_exception(exc_class, message=None, details=None, status_code=None):
    """
    Helper function to raise standardized API exceptions.
    
    Args:
        exc_class: Exception class to raise
        message: Custom error message
        details: Additional error details
        status_code: HTTP status code
    """
    exception = exc_class(detail=message, code=getattr(exc_class, 'default_code', 'error'))
    if status_code:
        exception.status_code = status_code
    if details:
        exception.detail = {'message': message or str(exception.detail), 'details': details}
    raise exception


# Convenience functions for common errors
def raise_validation_error(message=None, details=None):
    """Raise a standardized validation error."""
    handle_api_exception(APIValidationError, message, details)


def raise_authentication_error(message=None, details=None):
    """Raise a standardized authentication error."""
    handle_api_exception(APIAuthenticationError, message, details)


def raise_permission_error(message=None, details=None):
    """Raise a standardized permission error."""
    handle_api_exception(APIPermissionError, message, details)


def raise_not_found_error(message=None, details=None):
    """Raise a standardized not found error."""
    handle_api_exception(APINotFoundError, message, details)


def raise_conflict_error(message=None, details=None):
    """Raise a standardized conflict error."""
    handle_api_exception(APIConflictError, message, details)


def raise_server_error(message=None, details=None):
    """Raise a standardized server error."""
    handle_api_exception(APIServerError, message, details)
