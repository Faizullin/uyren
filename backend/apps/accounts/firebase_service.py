import firebase_admin
from firebase_admin import credentials, auth
from django.conf import settings
import os
import json
import tempfile
from apps.core.logging import get_logger

logger = get_logger(__name__)

"""
Firebase Service for handling Firebase Admin SDK initialization and operations.

The service will try to initialize Firebase in the following order:
1. service-account.json file in the backend root folder (recommended)
2. Default credentials (for production with IAM)

To set up Firebase:
1. Download your service account key from Firebase Console
2. Save it as 'service-account.json' in the backend root folder
3. The file is already added to .gitignore for security

Example service-account.json structure:
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
  "client_email": "firebase-adminsdk-...@your-project.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
"""


class FirebaseService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FirebaseService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self._initialize_firebase()
            self._initialized = True
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        if not firebase_admin._apps:
            try:
                # Method 1: Try to use service-account.json file from backend root folder
                backend_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
                service_account_path = os.path.join(backend_root, 'service-account.json')
                
                if os.path.exists(service_account_path):
                    cred = credentials.Certificate(service_account_path)
                    firebase_admin.initialize_app(cred)
                    logger.info(f"Firebase initialized with service account key file: {service_account_path}")
                    return
                  # Method 2: Try to initialize with default credentials (for production with IAM)
                firebase_admin.initialize_app()
                logger.info("Firebase initialized with default credentials")
                
            except Exception as e:
                logger.error(f"Firebase initialization error: {e}")
                logger.warning("Firebase functionality will be disabled")
    
    def verify_firebase_token(self, token):
        """
        Verify Firebase ID token and return decoded token
        """
        try:
            if not firebase_admin._apps:
                logger.error("Firebase not initialized - cannot verify token")
                return None
                
            decoded_token = auth.verify_id_token(token)
            logger.debug(f"Firebase token verified for UID: {decoded_token.get('uid')}")
            return decoded_token
        except Exception as e:
            logger.warning(f"Firebase token verification failed: {e}")
            return None
    
    def get_user_by_uid(self, uid):
        """
        Get Firebase user by UID
        """
        try:
            if not firebase_admin._apps:
                logger.error("Firebase not initialized - cannot get user")
                return None
                
            user_record = auth.get_user(uid)
            logger.debug(f"Retrieved Firebase user: {uid}")
            return user_record
        except Exception as e:
            logger.warning(f"Error getting Firebase user {uid}: {e}")
            return None
