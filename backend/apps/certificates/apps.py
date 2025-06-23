"""
Certificate Management Application Configuration

This app handles certificate functionality including:
- Certificate template design and management
- Certificate generation and issuance
- Certificate verification and authenticity
- Certificate sharing and tracking
"""

from django.apps import AppConfig


class CertificatesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.certificates'
    verbose_name = 'Certificates'
    
    def ready(self):
        # Import signal handlers when they exist
        pass
