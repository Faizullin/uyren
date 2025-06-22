from django.contrib.auth.backends import BaseBackend
from django.contrib.auth import get_user_model
from .firebase_service import FirebaseService

User = get_user_model()


class FirebaseAuthenticationBackend(BaseBackend):
    """
    Custom authentication backend for Firebase
    """
    
    def authenticate(self, request, firebase_token=None, **kwargs):
        if not firebase_token:
            return None
            
        firebase_service = FirebaseService()
        decoded_token = firebase_service.verify_firebase_token(firebase_token)
        
        if not decoded_token:
            return None
            
        firebase_uid = decoded_token.get('uid')
        email = decoded_token.get('email', '')
        
        if not firebase_uid:
            return None
            
        try:
            # Try to get existing user
            user = User.objects.get(firebase_uid=firebase_uid)
            return user
        except User.DoesNotExist:
            # Create new user if doesn't exist
            firebase_user = firebase_service.get_user_by_uid(firebase_uid)
            if firebase_user:
                user = User.objects.create(
                    firebase_uid=firebase_uid,
                    email=email or firebase_user.email or f"{firebase_uid}@firebase.user",
                    username=email or firebase_user.email or firebase_uid,
                    first_name=firebase_user.display_name.split(' ')[0] if firebase_user.display_name else '',
                    last_name=' '.join(firebase_user.display_name.split(' ')[1:]) if firebase_user.display_name and len(firebase_user.display_name.split(' ')) > 1 else '',
                    profile_picture_url=firebase_user.photo_url or '',
                    is_verified=firebase_user.email_verified,
                )
                return user
        
        return None
    
    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
