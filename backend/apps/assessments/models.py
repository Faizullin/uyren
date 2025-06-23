"""
Assessment Management Models - Minimized

This module contains simplified models for managing assessments:
- Assessment: Basic assessment entity for courses/lessons
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model
from apps.core.models import AbstractTimestampedModel
from apps.courses.models import Course
from apps.lessons.models import Lesson

User = get_user_model()


class Assessment(AbstractTimestampedModel):
    """Basic assessment entity for courses/lessons."""
    
    # Assessment types
    QUIZ = 'quiz'
    ASSIGNMENT = 'assignment'
    EXAM = 'exam'
    
    TYPE_CHOICES = [
        (QUIZ, 'Quiz'),
        (ASSIGNMENT, 'Assignment'),
        (EXAM, 'Exam'),
    ]
    
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='assessments'
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='assessments',
        null=True,
        blank=True
    )
    
    # Basic information
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    assessment_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=QUIZ)
    
    # Scoring
    max_score = models.PositiveIntegerField(default=100)
    passing_score = models.PositiveIntegerField(default=70)
    
    # Settings
    time_limit_minutes = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Time limit in minutes"
    )
    max_attempts = models.PositiveIntegerField(default=1)
    is_published = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Assessment'
        verbose_name_plural = 'Assessments'
        ordering = ['course', 'lesson', 'title']

    def __str__(self):
        return f"{self.course.title} - {self.title}"


class AssessmentAttempt(AbstractTimestampedModel):
    """Student assessment attempts and results."""
    
    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name='attempts'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='assessment_attempts'
    )
    
    # Results
    score = models.PositiveIntegerField(default=0)
    is_passed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Attempt tracking
    attempt_number = models.PositiveIntegerField(default=1)
    time_spent_minutes = models.PositiveIntegerField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Assessment Attempt'
        verbose_name_plural = 'Assessment Attempts'
        unique_together = ['assessment', 'user', 'attempt_number']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.assessment.title} (Attempt {self.attempt_number})"
