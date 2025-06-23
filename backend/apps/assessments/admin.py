"""
Assessment Management Admin Configuration - Minimized
"""

from django.contrib import admin
from .models import Assessment, AssessmentAttempt


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    """Admin configuration for Assessment model."""
    
    list_display = [
        'title', 
        'course', 
        'lesson',
        'assessment_type', 
        'max_score',
        'passing_score',
        'is_published',
        'created_at'
    ]
    list_filter = ['assessment_type', 'is_published', 'course', 'created_at']
    search_fields = ['title', 'description', 'course__title', 'lesson__title']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('course', 'lesson', 'title', 'description', 'assessment_type')
        }),
        ('Scoring', {
            'fields': ('max_score', 'passing_score')
        }),
        ('Settings', {
            'fields': ('time_limit_minutes', 'max_attempts', 'is_published')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AssessmentAttempt)
class AssessmentAttemptAdmin(admin.ModelAdmin):
    """Admin configuration for AssessmentAttempt model."""
    
    list_display = [
        'user', 
        'assessment', 
        'attempt_number',
        'score', 
        'is_passed',
        'completed_at',
        'created_at'
    ]
    list_filter = ['is_passed', 'assessment__course', 'completed_at', 'created_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'assessment__title']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Attempt Information', {
            'fields': ('assessment', 'user', 'attempt_number')
        }),
        ('Results', {
            'fields': ('score', 'is_passed', 'completed_at', 'time_spent_minutes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
