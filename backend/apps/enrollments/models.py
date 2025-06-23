"""
Enrollment Management Models - Minimized

This module contains simplified models for managing student enrollments:
- Enrollment: Main enrollment entity linking students to courses
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model
from apps.core.models import AbstractTimestampedModel
from apps.courses.models import Course

User = get_user_model()


class Enrollment(AbstractTimestampedModel):
    """Main enrollment entity linking students to courses."""
    
    # Enrollment status
    ACTIVE = 'active'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'
    
    STATUS_CHOICES = [
        (ACTIVE, 'Active'),
        (COMPLETED, 'Completed'),
        (CANCELLED, 'Cancelled'),
    ]
    
    # Core fields
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    
    # Enrollment details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=ACTIVE)
    enrolled_at = models.DateTimeField(auto_now_add=True)
    
    # Progress tracking
    progress_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Payment information (for paid courses)
    amount_paid = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)]
    )
    
    class Meta:
        verbose_name = 'Enrollment'
        verbose_name_plural = 'Enrollments'
        unique_together = ['user', 'course']
        ordering = ['-enrolled_at']

    def __str__(self):
        return f"{self.user.email} - {self.course.title}"
    
    @property
    def is_completed(self):
        """Check if enrollment is completed."""
        return self.status == self.COMPLETED or self.progress_percentage >= 100
