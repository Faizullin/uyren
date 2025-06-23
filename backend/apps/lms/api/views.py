

from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.lessons.models import Lesson
from apps.courses.models import Course
from apps.enrollments.models import Enrollment
from apps.certificates.models import Certificate
from apps.assessments.models import Assessment, AssessmentAttempt
from apps.attachments.views import FileUploadMixin
from .serializers import (
    LessonSerializer, LessonListSerializer,
    CourseSerializer, CourseListSerializer,
    EnrollmentSerializer, EnrollmentListSerializer,
    CertificateSerializer, CertificateListSerializer,
    AssessmentSerializer, AssessmentListSerializer,
    AssessmentAttemptSerializer
)


"""
Lesson API Views
"""

class LessonViewSet(viewsets.ModelViewSet):
    """CRUD operations for Lesson model."""
    
    queryset = Lesson.objects.select_related('course', 'content_post', ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['course', 'is_published']
    search_fields = ['title', 'course__title']
    ordering_fields = ['title', 'order', 'created_at']
    ordering = ['course', 'order']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return LessonListSerializer
        return LessonSerializer


"""
Course API Views
"""

class CourseViewSet(viewsets.ModelViewSet):
    """CRUD operations for Course model with file upload capabilities."""
    
    queryset = Course.objects.all().select_related('thumbnail')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'course_type', 'category']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['title', 'created_at', 'estimated_duration_hours']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return CourseListSerializer
        return CourseSerializer




"""
Enrollment API Views
"""
class EnrollmentViewSet(viewsets.ModelViewSet):
    """CRUD operations for Enrollment model."""
    
    queryset = Enrollment.objects.select_related('user', 'course').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'course', 'user']
    search_fields = ['user__email', 'course__title']
    ordering_fields = ['enrolled_at', 'progress_percentage', 'completed_at']
    ordering = ['-enrolled_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return EnrollmentListSerializer
        return EnrollmentSerializer
    
    def get_queryset(self):
        """Filter enrollments based on user permissions."""
        queryset = super().get_queryset()
        # Users can only see their own enrollments unless they're staff
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        return queryset


"""
Certificate API Views
"""
class CertificateViewSet(viewsets.ModelViewSet):
    """CRUD operations for Certificate model."""
    
    queryset = Certificate.objects.select_related('user', 'course', 'enrollment').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['course', 'user', 'is_valid']
    search_fields = ['certificate_number', 'user__email', 'course__title']
    ordering_fields = ['issued_at', 'completion_date', 'final_score']
    ordering = ['-issued_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return CertificateListSerializer
        return CertificateSerializer
    
    def get_queryset(self):
        """Filter certificates based on user permissions."""
        queryset = super().get_queryset()
        # Users can only see their own certificates unless they're staff
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        return queryset
    
    @action(detail=True, methods=['get'])
    def verify(self, request, pk=None):
        """Verify certificate authenticity."""
        certificate = self.get_object()
        return Response({
            'valid': certificate.is_valid,
            'certificate_number': certificate.certificate_number,
            'user': certificate.user.email,
            'course': certificate.course.title,
            'issued_at': certificate.issued_at,
            'completion_date': certificate.completion_date,
            'final_score': certificate.final_score
        })

"""
Assessment API Views
"""
class AssessmentViewSet(viewsets.ModelViewSet):
    """CRUD operations for Assessment model."""
    
    queryset = Assessment.objects.select_related('course', 'lesson').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['assessment_type', 'course', 'lesson', 'is_published']
    search_fields = ['title', 'description', 'course__title']
    ordering_fields = ['title', 'created_at', 'max_score']
    ordering = ['course', 'lesson', 'title']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return AssessmentListSerializer
        return AssessmentSerializer


class AssessmentAttemptViewSet(viewsets.ModelViewSet):
    """CRUD operations for AssessmentAttempt model."""
    
    queryset = AssessmentAttempt.objects.select_related('assessment', 'user').all()
    serializer_class = AssessmentAttemptSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['assessment', 'user', 'is_passed']
    search_fields = ['assessment__title', 'user__email']
    ordering_fields = ['created_at', 'score', 'attempt_number']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter attempts based on user permissions."""
        queryset = super().get_queryset()
        # Users can only see their own attempts unless they're staff
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        return queryset
