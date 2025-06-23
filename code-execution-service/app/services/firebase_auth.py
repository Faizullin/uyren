import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, status
import os
from typing import Optional, Dict, Any


class FirebaseAuthService:
    """Firebase authentication service for user verification"""
    
    def __init__(self):
        self._initialized = False
        self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK using service-account.json"""
        if not firebase_admin._apps and not self._initialized:
            try:
                # Look for service-account.json in multiple locations
                # Get the current file's directory and project root
                current_dir = os.path.dirname(__file__)
                app_dir = os.path.dirname(current_dir)
                project_root = os.path.dirname(app_dir)
                
                service_account_paths = [
                    os.path.join(project_root, "service-account.json"),  # Project root
                    os.path.join(app_dir, "service-account.json"),      # App directory
                    "./service-account.json",                           # Current working directory
                    "../service-account.json",                          # Parent directory
                ]
                
                service_account_path = None
                for path in service_account_paths:
                    abs_path = os.path.abspath(path)
                    print(f"Checking for Firebase service account at: {abs_path}")
                    if os.path.exists(abs_path):
                        service_account_path = abs_path
                        break
                
                if service_account_path:
                    cred = credentials.Certificate(service_account_path)
                    firebase_admin.initialize_app(cred)
                    print(f"✅ Firebase initialized with service account: {service_account_path}")
                else:
                    # Try default credentials (for production with IAM)
                    firebase_admin.initialize_app()
                    print("✅ Firebase initialized with default credentials")
                
                self._initialized = True
                
            except Exception as e:
                print(f"❌ Firebase initialization error: {e}")
                print("Firebase functionality will be disabled")
    
    async def verify_firebase_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify Firebase ID token and return decoded token"""
        try:
            if not firebase_admin._apps:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Firebase not initialized"
                )
            
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            decoded_token = auth.verify_id_token(token)
            
            return {
                "uid": decoded_token.get("uid"),
                "email": decoded_token.get("email"),
                "name": decoded_token.get("name"),
                "email_verified": decoded_token.get("email_verified", False),
                "firebase_claims": decoded_token
            }
            
        except auth.InvalidIdTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Firebase token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except auth.ExpiredIdTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Expired Firebase token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token verification failed: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    async def get_user_by_uid(self, uid: str) -> Optional[Dict[str, Any]]:
        """Get Firebase user by UID"""
        try:
            if not firebase_admin._apps:
                return None
            
            user_record = auth.get_user(uid)
            return {
                "uid": user_record.uid,
                "email": user_record.email,
                "display_name": user_record.display_name,
                "email_verified": user_record.email_verified,
                "disabled": user_record.disabled,
                "custom_claims": user_record.custom_claims or {}
            }
            
        except Exception as e:
            print(f"Error getting Firebase user {uid}: {e}")
            return None


# Global Firebase auth service instance
firebase_auth_service = FirebaseAuthService()
