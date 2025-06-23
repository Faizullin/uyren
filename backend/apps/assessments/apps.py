"""
Assessment Management Application Configuration

This app handles assessment functionality including:
- Quiz creation and management
- Assignment creation and submissions
- Question management with multiple types
- Grading and scoring systems
"""

from django.apps import AppConfig


class AssessmentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.assessments'
    verbose_name = 'Assessments'
    
    def ready(self):
        # Import signal handlers when they exist
        pass
