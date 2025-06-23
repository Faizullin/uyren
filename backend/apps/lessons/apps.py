"""
Lesson Management Application Configuration

This app handles lesson management functionality including:
- Course modules and structure
- Individual lesson content and media
- Lesson resources and materials
- Content organization and delivery
"""

from django.apps import AppConfig


class LessonsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.lessons'
    verbose_name = 'Lessons'
    
    def ready(self):
        # Import signal handlers when they exist
        pass
