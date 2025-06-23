"""
Enrollment Management Admin Configuration - Minimized
"""

from django.contrib import admin
from .models import Enrollment


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    """Admin configuration for Enrollment model."""
    
    list_display = [
        'user', 
        'course', 
        'status', 
        'progress_percentage',
        'amount_paid',
        'enrolled_at',
        'completed_at'
    ]
    list_filter = ['status', 'course', 'enrolled_at', 'completed_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'course__title']
    readonly_fields = ['enrolled_at', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Enrollment Information', {
            'fields': ('user', 'course', 'status')
        }),
        ('Progress', {
            'fields': ('progress_percentage', 'completed_at')
        }),
        ('Payment', {
            'fields': ('amount_paid',)
        }),
        ('Timestamps', {
            'fields': ('enrolled_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
