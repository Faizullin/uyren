"""
Course Management Admin Configuration - Minimized
"""

from django.contrib import admin
from .models import Course


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    """Admin configuration for Course model."""
    
    list_display = [
        'title', 
        'category', 
        'course_type', 
        'status', 
        'price',
        'estimated_duration_hours',
        'created_at'
    ]
    list_filter = ['status', 'course_type', 'category', 'created_at']
    search_fields = ['title', 'description', 'tags']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'description', 'thumbnail')
        }),
        ('Categorization', {
            'fields': ('category', 'tags')
        }),
        ('Settings', {
            'fields': ('status', 'course_type', 'price', 'estimated_duration_hours')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
