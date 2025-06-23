from apps.assessments.models import Assessment, AssessmentAttempt
from apps.certificates.models import Certificate
from apps.courses.models import Course
from apps.enrollments.models import Enrollment
from rest_framework import serializers
from apps.lessons.models import Lesson
from apps.posts.models import Post
from apps.attachments.serializers import AttachmentSerializer


class UserMiniSerializer(serializers.ModelSerializer):
    """Serializer for User model."""

    class Meta:
        model = Enrollment.user.field.related_model
        fields = ["id", "email", "first_name", "last_name"]


class CourseMiniSerializer(serializers.ModelSerializer):
    """Serializer for Course model."""

    class Meta:
        model = Enrollment.course.field.related_model
        fields = ["id", "title"]


class LessonMiniSerializer(serializers.ModelSerializer):
    """Serializer for Lesson model."""

    class Meta:
        model = Lesson
        fields = ["id", "title", "slug", "order", "is_published"]


class AssessmentMiniSerializer(serializers.ModelSerializer):
    """Serializer for Assessment model."""

    class Meta:
        model = Assessment
        fields = ["id", "title", "assessment_type", "max_score", "is_published"]



"""
Lesson API
"""


class LessonSerializer(serializers.ModelSerializer):
    """Serializer for Lesson model."""

    class LessonPostSerializer(serializers.ModelSerializer):
        """Serializer for Lesson model with Post content."""

        class Meta:
            model = Post
            fields = [
                "id",
                "title",
                "slug",
                "content",
                "status",
            ]

    content_post = LessonPostSerializer(read_only=True)

    class Meta:
        model = Lesson
        fields = [
            "id",
            "course",
            "title",
            "slug",
            "content_post",
            "video",
            "order",
            "is_published",
            "estimated_duration_minutes",
            "created_at",
            "updated_at",
        ]


class LessonListSerializer(serializers.ModelSerializer):
    """Simplified serializer for Lesson list views."""

    course = CourseMiniSerializer(read_only=True)

    class Meta:
        model = Lesson
        fields = [
            "id",
            "course",
            "title",
            "slug",
            "order",
            "is_published",
            "estimated_duration_minutes",
        ]


"""
Course API
"""


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for Course model."""
    thumbnail = AttachmentSerializer(read_only=True)
    thumbnail_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "thumbnail",
            "thumbnail_id",
            "category",
            "tags",
            "status",
            "course_type",
            "price",
            "estimated_duration_hours",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CourseListSerializer(serializers.ModelSerializer):
    """Simplified serializer for Course list views."""
    thumbnail = AttachmentSerializer(read_only=True)

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "thumbnail",
            "category",
            "course_type",
            "price",
            "estimated_duration_hours",
            "status",
            "created_at",
            "updated_at",
        ]


"""
Enrollment API
"""


class EnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for Enrollment model."""

    course = CourseSerializer(read_only=True)
    user = UserMiniSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            "id",
            "user",
            "course",
            "status",
            "enrolled_at",
            "progress_percentage",
            "completed_at",
            "amount_paid",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "enrolled_at", "created_at", "updated_at"]


class EnrollmentListSerializer(serializers.ModelSerializer):
    """Simplified serializer for Enrollment list views."""

    user = UserMiniSerializer(read_only=True)
    course = CourseMiniSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            "id",
            "user",
            "course",
            "status",
            "progress_percentage",
            "enrolled_at",
        ]


"""
Certificate API
"""


class CertificateSerializer(serializers.ModelSerializer):
    """Serializer for Certificate model."""

    user = UserMiniSerializer(read_only=True)
    course = CourseMiniSerializer(read_only=True)

    class Meta:
        model = Certificate
        fields = [
            "id",
            "enrollment",
            "enrollment_id",
            "user",
            "course",
            "certificate_number",
            "verification_token",
            "issued_at",
            "completion_date",
            "final_score",
            "is_valid",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "certificate_number",
            "verification_token",
            "issued_at",
            "created_at",
            "updated_at",
        ]


class CertificateListSerializer(serializers.ModelSerializer):
    """Simplified serializer for Certificate list views."""

    user_email = serializers.CharField(source="user.email", read_only=True)
    course_title = serializers.CharField(source="course.title", read_only=True)

    class Meta:
        model = Certificate
        fields = [
            "id",
            "user",
            "user_email",
            "course",
            "course_title",
            "certificate_number",
            "issued_at",
            "completion_date",
            "final_score",
            "is_valid",
        ]


"""
Assessment API
"""


class AssessmentSerializer(serializers.ModelSerializer):
    """Serializer for Assessment model."""

    course = CourseMiniSerializer(read_only=True)
    lesson = LessonMiniSerializer(read_only=True)

    class Meta:
        model = Assessment
        fields = [
            "id",
            "course",
            "lesson",
            "title",
            "description",
            "assessment_type",
            "max_score",
            "passing_score",
            "time_limit_minutes",
            "max_attempts",
            "is_published",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AssessmentListSerializer(serializers.ModelSerializer):
    """Simplified serializer for Assessment list views."""

    course = CourseMiniSerializer(read_only=True)

    class Meta:
        model = Assessment
        fields = [
            "id",
            "course",
            "title",
            "assessment_type",
            "max_score",
            "passing_score",
            "is_published",
        ]


class AssessmentAttemptSerializer(serializers.ModelSerializer):
    """Serializer for AssessmentAttempt model."""

    assessment = AssessmentMiniSerializer(read_only=True)
    user = UserMiniSerializer(read_only=True)

    class Meta:
        model = AssessmentAttempt
        fields = [
            "id",
            "assessment",
            "user",
            "score",
            "is_passed",
            "completed_at",
            "attempt_number",
            "time_spent_minutes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
