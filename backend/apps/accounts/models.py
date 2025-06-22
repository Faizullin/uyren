from django.db import models
from django.contrib.auth.models import AbstractUser
from apps.core.models import AbstractTimestampedModel


class User(AbstractUser, AbstractTimestampedModel):
    firebase_uid = models.CharField(max_length=128, unique=True)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    profile_picture_url = models.URLField(max_length=500, null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    last_login_firebase = models.DateTimeField(null=True, blank=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'firebase_uid']
    
    def __str__(self):
        return self.email
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    @property
    def display_name(self):
        """Return the best available display name"""
        if self.full_name:
            return self.full_name
        if self.username:
            return self.username
        return self.email.split('@')[0] if self.email else f"User {self.id}"
    
    @property
    def initials(self):
        """Return user initials for avatar display"""
        if self.first_name and self.last_name:
            return f"{self.first_name[0]}{self.last_name[0]}".upper()
        elif self.first_name:
            return self.first_name[0].upper()
        elif self.email:
            return self.email[0].upper()
        return "U"
    
    def get_profile_picture(self):
        """Get profile picture URL or return None"""
        return self.profile_picture_url if self.profile_picture_url else None
    
    def is_profile_complete(self):
        """Check if user profile is reasonably complete"""
        return bool(
            self.first_name and 
            self.last_name and 
            self.email and 
            self.bio
        )
    
    def can_publish_posts(self):
        """Check if user can publish posts"""
        return self.is_verified or self.is_staff or self.is_superuser
    
    class Meta:
        db_table = 'accounts_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['firebase_uid']),
            models.Index(fields=['email']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['created_at']),
        ]
