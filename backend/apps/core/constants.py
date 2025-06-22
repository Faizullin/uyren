"""
Common constants used across the application
"""

# HTTP Status Messages
HTTP_200_OK = "Success"
HTTP_201_CREATED = "Created successfully"
HTTP_400_BAD_REQUEST = "Bad request"
HTTP_401_UNAUTHORIZED = "Unauthorized"
HTTP_403_FORBIDDEN = "Forbidden"
HTTP_404_NOT_FOUND = "Not found"
HTTP_500_INTERNAL_SERVER_ERROR = "Internal server error"

# Authentication Messages
AUTH_SUCCESS = "Authentication successful"
AUTH_FAILED = "Authentication failed"
AUTH_INVALID_TOKEN = "Invalid authentication token"
AUTH_TOKEN_EXPIRED = "Authentication token expired"
AUTH_USER_NOT_FOUND = "User not found"

# Validation Messages
VALIDATION_REQUIRED_FIELD = "This field is required"
VALIDATION_INVALID_EMAIL = "Invalid email format"
VALIDATION_INVALID_URL = "Invalid URL format"
VALIDATION_FUTURE_DATE = "Date cannot be in the future"
VALIDATION_PAST_DATE = "Date cannot be in the past"

# Firebase Messages
FIREBASE_TOKEN_INVALID = "Invalid Firebase token"
FIREBASE_USER_NOT_FOUND = "Firebase user not found"
FIREBASE_AUTH_FAILED = "Firebase authentication failed"

# Database Constants
MAX_CHAR_LENGTH = 255
MAX_TEXT_LENGTH = 1000
MAX_URL_LENGTH = 500
MAX_EMAIL_LENGTH = 254

# Pagination
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# File Upload
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
ALLOWED_DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'xlsx', 'xls', 'ppt', 'pptx']
ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'avi', 'mov', 'webm', 'mkv']
ALLOWED_AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'flac', 'm4a']

# Cache Keys
CACHE_USER_PREFIX = "user:"
CACHE_SESSION_PREFIX = "session:"
CACHE_TIMEOUT_SHORT = 300  # 5 minutes
CACHE_TIMEOUT_MEDIUM = 1800  # 30 minutes
CACHE_TIMEOUT_LONG = 3600  # 1 hour

# Date Formats
DATE_FORMAT = "%Y-%m-%d"
DATETIME_FORMAT = "%Y-%m-%d %H:%M:%S"
TIME_FORMAT = "%H:%M:%S"
