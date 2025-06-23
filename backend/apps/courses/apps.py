"""
Course Management Application Configuration

This app handles course management functionality including:
- Course creation and management
- Course categories and tags
- Instructor assignments
- Course prerequisites
"""

from django.apps import AppConfig


class CoursesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.courses'
    verbose_name = 'Courses'
    
    def ready(self):
        # Import signal handlers when they exist
        pass
