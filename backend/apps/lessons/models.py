"""
Lesson Management Models - Minimized

This module contains simplified models for managing lessons:
- Lesson: Individual lesson entities referencing Post for content
"""

from django.db import models
from apps.core.models import AbstractTimestampedModel
from apps.attachments.models import Attachment
from apps.courses.models import Course
from apps.posts.models import Post


class Lesson(AbstractTimestampedModel):
    """Individual lesson entities with content referenced from Post."""
    
    # Basic Information
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='lessons'
    )
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200)
    
    # Link to Post for content (with post_type="lesson")
    content_post = models.OneToOneField(
        Post,
        on_delete=models.CASCADE,
        related_name='lesson',
        null=True,
        blank=True,
        help_text="Post with post_type='lesson' for lesson content"
    )
    
    # Media attachments
    video = models.ForeignKey(
        Attachment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lesson_videos'
    )
    
    # Lesson Settings
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    
    # Duration
    estimated_duration_minutes = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Estimated completion time in minutes"
    )
    
    class Meta:
        verbose_name = 'Lesson'
        verbose_name_plural = 'Lessons'
        ordering = ['course', 'order']
        unique_together = ['course', 'slug']

    def __str__(self):
        return f"{self.course.title} - {self.title}"
    
    def save(self, *args, **kwargs):
        """Override save to ensure content_post has correct post_type."""
        if self.content_post and not self.content_post.post_type:
            self.content_post.post_type = 'lesson'
            self.content_post.save()
        super().save(*args, **kwargs)
