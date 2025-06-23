"""
LMS API URLs - Centralized LMS API endpoints

This module provides all LMS API endpoints using DRF ViewSets and routers:
- Courses API
- Lessons API  
- Enrollments API
- Assessments API
- Certificates API
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api.views import (
    CourseViewSet,
    LessonViewSet,
    EnrollmentViewSet,
    AssessmentViewSet,
    AssessmentAttemptViewSet,
    CertificateViewSet,
)

app_name = 'lms'

# Create router
router = DefaultRouter()

# Register all LMS viewsets
router.register(r'api/v1/lms/courses', CourseViewSet, basename='course')
router.register(r'api/v1/lms/lessons', LessonViewSet, basename='lesson')
router.register(r'api/v1/lms/enrollments', EnrollmentViewSet, basename='enrollment')
router.register(r'api/v1/lms/assessments', AssessmentViewSet, basename='assessment')
router.register(r'api/v1/lms/assessment-attempts', AssessmentAttemptViewSet, basename='assessment-attempt')
router.register(r'api/v1/lms/certificates', CertificateViewSet, basename='certificate')

urlpatterns = [
    # Include all router URLs
    path('', include(router.urls)),
]
