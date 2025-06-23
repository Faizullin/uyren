"""
Certificate Management Models - Minimized

This module contains simplified models for managing course completion certificates:
- Certificate: Individual certificates issued to students
"""

from django.db import models
from django.contrib.auth import get_user_model
from apps.core.models import AbstractTimestampedModel
from apps.courses.models import Course
from apps.enrollments.models import Enrollment
import uuid

User = get_user_model()


class Certificate(AbstractTimestampedModel):
    """Individual certificates issued to students."""
    
    # Core relationships
    enrollment = models.OneToOneField(
        Enrollment,
        on_delete=models.CASCADE,
        related_name='certificate'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='certificates'
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='certificates'
    )
    
    # Certificate details
    certificate_number = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique certificate identifier"
    )
    verification_token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        help_text="Token for certificate verification"
    )
    
    # Certificate metadata
    issued_at = models.DateTimeField(auto_now_add=True)
    completion_date = models.DateField()
    final_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Final course score percentage"
    )
    
    # Status
    is_valid = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Certificate'
        verbose_name_plural = 'Certificates'
        ordering = ['-issued_at']

    def __str__(self):
        return f"Certificate {self.certificate_number} - {self.user.email} - {self.course.title}"
    
    def save(self, *args, **kwargs):
        """Generate certificate number if not provided."""
        if not self.certificate_number:
            import time
            self.certificate_number = f"CERT-{int(time.time())}-{self.user.id}"
        super().save(*args, **kwargs)
