import logging
import sys
from django.conf import settings


class ColoredFormatter(logging.Formatter):
    """Custom formatter with colors for different log levels"""
    
    COLORS = {
        'DEBUG': '\033[36m',     # Cyan
        'INFO': '\033[32m',      # Green
        'WARNING': '\033[33m',   # Yellow
        'ERROR': '\033[31m',     # Red
        'CRITICAL': '\033[35m',  # Magenta
    }
    RESET = '\033[0m'
    
    def format(self, record):
        if hasattr(record, 'levelname') and record.levelname in self.COLORS:
            record.levelname = f"{self.COLORS[record.levelname]}{record.levelname}{self.RESET}"
        return super().format(record)


def get_logger(name=None):
    """
    Get a logger instance with consistent configuration
    
    Args:
        name (str): Logger name, defaults to calling module name
    
    Returns:
        logging.Logger: Configured logger instance
    """
    if name is None:
        # Get the name of the calling module
        frame = sys._getframe(1)
        name = frame.f_globals.get('__name__', 'unknown')
    
    logger = logging.getLogger(name)
    
    # Avoid duplicate handlers
    if not logger.handlers:
        # Console handler
        console_handler = logging.StreamHandler()
        
        if settings.DEBUG:
            formatter = ColoredFormatter(
                '%(asctime)s [%(levelname)s] %(name)s: %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
        else:
            formatter = logging.Formatter(
                '%(asctime)s [%(levelname)s] %(name)s: %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
        
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
        
        # Set level based on settings
        if settings.DEBUG:
            logger.setLevel(logging.DEBUG)
        else:
            logger.setLevel(logging.INFO)
    
    return logger


class LoggerMixin:
    """
    Mixin to add logging capabilities to any class
    """
    
    @property
    def logger(self):
        if not hasattr(self, '_logger'):
            self._logger = get_logger(self.__class__.__module__)
        return self._logger


def log_function_call(func):
    """
    Decorator to log function calls with arguments and return values
    """
    def wrapper(*args, **kwargs):
        logger = get_logger(func.__module__)
        
        # Log function entry
        args_str = ', '.join([str(arg) for arg in args[1:]])  # Skip 'self'
        kwargs_str = ', '.join([f"{k}={v}" for k, v in kwargs.items()])
        all_args = ', '.join(filter(None, [args_str, kwargs_str]))
        
        logger.debug(f"Calling {func.__name__}({all_args})")
        
        try:
            result = func(*args, **kwargs)
            logger.debug(f"{func.__name__} completed successfully")
            return result
        except Exception as e:
            logger.error(f"{func.__name__} failed with error: {e}")
            raise
    
    return wrapper


def log_model_changes(sender, instance, created, **kwargs):
    """
    Signal handler to log model changes
    """
    logger = get_logger('django.models')
    
    action = 'created' if created else 'updated'
    model_name = sender.__name__
    
    logger.info(f"{model_name} {action}: {instance}")


# Commonly used loggers
auth_logger = get_logger('apps.accounts.auth')
firebase_logger = get_logger('apps.accounts.firebase')
attachment_logger = get_logger('apps.attachments')
api_logger = get_logger('apps.api')
security_logger = get_logger('security')


class SecurityLoggerMixin:
    """
    Mixin for security-related logging
    """
    
    def log_security_event(self, event_type, message, user=None, ip_address=None, **extra):
        """
        Log security-related events
        
        Args:
            event_type (str): Type of security event
            message (str): Description of the event
            user: User object if available
            ip_address (str): IP address if available
            **extra: Additional context data
        """
        security_logger.warning(
            f"SECURITY_{event_type.upper()}: {message}",
            extra={
                'user': str(user) if user else 'Anonymous',
                'ip_address': ip_address,
                'event_type': event_type,
                **extra
            }
        )
    
    def log_auth_attempt(self, success, user=None, ip_address=None, method='unknown'):
        """Log authentication attempts"""
        event_type = 'auth_success' if success else 'auth_failure'
        message = f"Authentication {'succeeded' if success else 'failed'} via {method}"
        
        self.log_security_event(
            event_type, message, user=user, ip_address=ip_address, method=method
        )
    
    def log_permission_denied(self, resource, user=None, ip_address=None):
        """Log permission denied events"""
        message = f"Permission denied for resource: {resource}"
        self.log_security_event(
            'permission_denied', message, user=user, ip_address=ip_address, resource=resource
        )
