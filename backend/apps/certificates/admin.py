"""
Certificate Management Admin Configuration - Minimized
"""

from django.contrib import admin
from .models import Certificate


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    """Admin configuration for Certificate model."""
    
    list_display = [
        'certificate_number', 
        'user', 
        'course', 
        'completion_date',
        'final_score',
        'is_valid',
        'issued_at'
    ]
    list_filter = ['is_valid', 'course', 'issued_at', 'completion_date']
    search_fields = [
        'certificate_number', 
        'verification_token',
        'user__email', 
        'user__first_name', 
        'user__last_name', 
        'course__title'
    ]
    readonly_fields = ['certificate_number', 'verification_token', 'issued_at', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Certificate Information', {
            'fields': ('enrollment', 'user', 'course')
        }),
        ('Certificate Details', {
            'fields': ('certificate_number', 'verification_token', 'completion_date', 'final_score')
        }),
        ('Status', {
            'fields': ('is_valid',)
        }),
        ('Timestamps', {
            'fields': ('issued_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
