from rest_framework import serializers
from ..models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'firebase_uid', 'username', 'email', 'first_name', 'last_name',
            'profile_picture_url', 'bio', 'date_of_birth', 'is_verified', 
            'last_login_firebase', 'created_at', 'full_name'
        )
        read_only_fields = ('id', 'firebase_uid', 'is_verified', 'last_login_firebase', 'created_at', 'full_name')


class FirebaseAuthSerializer(serializers.Serializer):
    firebase_token = serializers.CharField(required=True)
    
    def validate_firebase_token(self, value):
        if not value:
            raise serializers.ValidationError("Firebase token is required")
        return value


class SimpleAuthResponseSerializer(serializers.Serializer):
    """Serializer for simple authentication response"""
    access_token = serializers.CharField(read_only=True)
    user = UserSerializer(read_only=True)
    message = serializers.CharField(read_only=True)
    is_new_user = serializers.BooleanField(read_only=True)


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'bio', 'date_of_birth', 'profile_picture_url')
        
    def validate_profile_picture_url(self, value):
        if value and not value.startswith(('http://', 'https://')):
            raise serializers.ValidationError("Profile picture URL must be a valid URL")
        return value
