"""
LMS (Learning Management System) Application Configuration

This module contains configuration for the LMS app, which provides
comprehensive learning management functionality including:
- Course management
- Lesson management
- Enrollment system
- Progress tracking
- Assessment tools
- Content management
"""

from django.apps import AppConfig


class LmsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.lms'
    verbose_name = 'Learning Management System'
    
    def ready(self):
        # Import signal handlers
        pass  # Will be implemented when we add signals
