"""
Course Management Models - Minimized

This module contains simplified models for managing courses:
- Course: Main course entity with essential metadata only
"""

from django.db import models
from django.core.validators import MinValueValidator
from apps.core.models import AbstractTimestampedModel
from apps.attachments.models import Attachment


class Course(AbstractTimestampedModel):
    """Main course entity with essential metadata only."""
    
    # Basic Information
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField()
    
    # Media
    thumbnail = models.ForeignKey(
        Attachment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='course_thumbnails'
    )
    
    # Simple category as CharField instead of FK
    category = models.CharField(max_length=100, blank=True)
    
    # Simple tags as CharField instead of M2M
    tags = models.CharField(max_length=500, blank=True, help_text="Comma-separated tags")
    
    # Course Settings
    status = models.CharField(
        max_length=20, 
        choices=[
            ('draft', 'Draft'),
            ('published', 'Published'),
            ('archived', 'Archived'),
        ],
        default='draft'
    )
    course_type = models.CharField(
        max_length=20,
        choices=[
            ('free', 'Free'),
            ('paid', 'Paid'),
        ],
        default='free'
    )
    
    # Pricing (for paid courses)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)]
    )
    
    # Course Duration
    estimated_duration_hours = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Estimated completion time in hours"
    )
    
    class Meta:
        verbose_name = 'Course'
        verbose_name_plural = 'Courses'
        ordering = ['-created_at']

    def __str__(self):
        return self.title
