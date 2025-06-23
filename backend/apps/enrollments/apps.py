"""
Enrollment Management Application Configuration

This app handles student enrollment functionality including:
- Course enrollment and registration
- Group enrollment management
- Course reviews and ratings
- Student wishlist functionality
"""

from django.apps import AppConfig


class EnrollmentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.enrollments'
    verbose_name = 'Enrollments'
    
    def ready(self):
        # Import signal handlers when they exist
        pass
