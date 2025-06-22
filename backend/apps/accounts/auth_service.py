from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from .firebase_service import FirebaseService

User = get_user_model()


class SimpleAuthService:
    """
    Simple authentication service that handles Firebase ID token verification
    and returns JWT access token without refresh token complexity
    """
    
    def __init__(self):
        self.firebase_service = FirebaseService()
    
    def authenticate_with_firebase(self, firebase_token):
        """
        Authenticate user with Firebase ID token and return JWT access token
        
        Returns:
            dict: {
                'access_token': str,
                'user': User instance,
                'is_new_user': bool,
                'message': str
            }
        """
        try:
            # Verify Firebase token
            decoded_token = self.firebase_service.verify_firebase_token(firebase_token)
            
            if not decoded_token:
                return {
                    'error': 'Invalid Firebase token',
                    'success': False
                }
            
            firebase_uid = decoded_token.get('uid')
            email = decoded_token.get('email', '')
            
            if not firebase_uid:
                return {
                    'error': 'Firebase UID not found in token',
                    'success': False
                }
            
            # Try to get existing user or create new one
            user, is_new_user = self._get_or_create_user(firebase_uid, email, decoded_token)
            
            if not user:
                return {
                    'error': 'Failed to create or retrieve user',
                    'success': False
                }
            
            # Update last login
            user.last_login_firebase = timezone.now()
            user.save()
            
            # Generate JWT access token
            access_token = AccessToken.for_user(user)
            
            return {
                'access_token': str(access_token),
                'user': user,
                'is_new_user': is_new_user,
                'message': 'Authentication successful',
                'success': True
            }
            
        except Exception as e:
            return {
                'error': f'Authentication failed: {str(e)}',
                'success': False
            }
    
    def _get_or_create_user(self, firebase_uid, email, decoded_token):
        """
        Get existing user or create new user from Firebase token data
        
        Returns:
            tuple: (User instance, is_new_user boolean)
        """
        try:
            # Try to get existing user by Firebase UID
            user = User.objects.get(firebase_uid=firebase_uid)
            return user, False
            
        except User.DoesNotExist:
            # Try to get existing user by email if provided
            if email:
                try:
                    existing_user = User.objects.get(email=email)
                    # Update existing user with Firebase UID
                    existing_user.firebase_uid = firebase_uid
                    existing_user.save()
                    return existing_user, False
                except User.DoesNotExist:
                    pass
            
            # Create new user
            return self._create_user_from_firebase(firebase_uid, email, decoded_token)
    
    def _create_user_from_firebase(self, firebase_uid, email, decoded_token):
        """
        Create new user from Firebase token data
        
        Returns:
            tuple: (User instance, True)
        """
        try:
            # Get additional user data from Firebase if needed
            firebase_user = self.firebase_service.get_user_by_uid(firebase_uid)
            
            # Prepare user data
            user_data = {
                'firebase_uid': firebase_uid,
                'email': email or (firebase_user.email if firebase_user else f"{firebase_uid}@firebase.local"),
                'username': email or (firebase_user.email if firebase_user else firebase_uid),
                'is_verified': decoded_token.get('email_verified', False)
            }
            
            # Add optional fields from Firebase user record
            if firebase_user:
                if firebase_user.display_name:
                    name_parts = firebase_user.display_name.split(' ', 1)
                    user_data['first_name'] = name_parts[0]
                    if len(name_parts) > 1:
                        user_data['last_name'] = name_parts[1]
                
                if firebase_user.photo_url:
                    user_data['profile_picture_url'] = firebase_user.photo_url
                
                # Update verification status from Firebase user record
                user_data['is_verified'] = firebase_user.email_verified
                
            # Create user
            user = User.objects.create(**user_data)
            return user, True
            
        except Exception as e:
            # If user creation fails, return None
            print(f"Error creating user: {str(e)}")
            return None, False
    
    def validate_token_format(self, token):
        """
        Basic validation of token format
        
        Returns:
            bool: True if token format is valid
        """
        if not token:
            return False
        
        if not isinstance(token, str):
            return False
        
        # Firebase ID tokens are typically long JWT tokens
        if len(token) < 100:
            return False
        
        # Basic JWT format check (should have 3 parts separated by dots)
        parts = token.split('.')
        if len(parts) != 3:
            return False
        
        return True
