"""
Lesson Management Admin Configuration - Minimized
"""

from django.contrib import admin
from .models import Lesson


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    """Admin configuration for Lesson model."""
    
    list_display = [
        'title', 
        'course', 
        'order', 
        'is_published',
        'estimated_duration_minutes',
        'created_at'
    ]
    list_filter = ['is_published', 'course', 'created_at']
    search_fields = ['title', 'course__title']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('course', 'title', 'slug')
        }),
        ('Content', {
            'fields': ('content_post', 'video')
        }),
        ('Settings', {
            'fields': ('order', 'is_published', 'estimated_duration_minutes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
