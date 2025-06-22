from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.contrib.contenttypes.models import ContentType
from django.db.models import Count
from django.utils import timezone


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint"""
    return Response({
        'status': 'healthy',
        'message': 'Uyren Backend API is running',
        'timestamp': timezone.now(),
        'version': '1.0.0'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_info(request):
    """API information endpoint for authenticated users"""
    return Response({
        'user': request.user.email,
        'is_staff': request.user.is_staff,
        'is_verified': getattr(request.user, 'is_verified', False),
        'api_version': '1.0.0',
        'available_endpoints': {
            'accounts': '/api/v1/accounts/',
            'posts': '/api/v1/posts/',
            'attachments': '/api/v1/attachments/',
            'core': '/api/v1/core/'
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Dashboard statistics for authenticated users"""
    user = request.user
    
    # Import models here to avoid circular imports
    from apps.posts.models import Post
    from apps.attachments.models import Attachment
    
    # User's personal stats
    user_posts = Post.objects.filter(author=user) if hasattr(user, 'posts') else Post.objects.none()
    user_attachments = Attachment.objects.filter(uploaded_by=user)
    
    stats = {
        'user_stats': {
            'total_posts': user_posts.count(),
            'published_posts': user_posts.filter(status='published').count(),
            'draft_posts': user_posts.filter(status='draft').count(),
            'total_attachments': user_attachments.count(),
            'total_file_size': sum(att.file_size for att in user_attachments) if user_attachments.exists() else 0,
        },
        'recent_activity': {
            'latest_post': user_posts.first().title if user_posts.exists() else None,
            'latest_post_date': user_posts.first().created_at if user_posts.exists() else None,
        }
    }
    
    # Add global stats for staff users
    if user.is_staff:
        stats['global_stats'] = {
            'total_users': user.__class__.objects.count(),
            'total_posts': Post.objects.count(),
            'published_posts': Post.objects.filter(status='published').count(),
            'total_attachments': Attachment.objects.count(),
        }
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_stats(request):
    """Admin-only statistics endpoint"""
    from apps.posts.models import Post
    from apps.attachments.models import Attachment
    from apps.accounts.models import User
    
    # Content type statistics
    content_types = ContentType.objects.annotate(
        attachment_count=Count('attachment')
    ).values('model', 'attachment_count')
    
    stats = {
        'users': {
            'total': User.objects.count(),
            'active': User.objects.filter(is_active=True).count(),
            'verified': User.objects.filter(is_verified=True).count(),
            'staff': User.objects.filter(is_staff=True).count(),
        },
        'posts': {
            'total': Post.objects.count(),
            'published': Post.objects.filter(status='published').count(),
            'drafts': Post.objects.filter(status='draft').count(),
            'featured': Post.objects.filter(is_featured=True).count(),
        },
        'attachments': {
            'total': Attachment.objects.count(),
            'images': Attachment.objects.filter(file_type='image').count(),
            'documents': Attachment.objects.filter(file_type='document').count(),
            'orphaned': Attachment.objects.filter(content_object__isnull=True).count(),
        },
        'content_types': list(content_types),
        'recent_activity': {
            'recent_users': User.objects.order_by('-created_at')[:5].values(
                'id', 'email', 'created_at', 'is_verified'
            ),
            'recent_posts': Post.objects.order_by('-created_at')[:5].values(
                'id', 'title', 'status', 'author__email', 'created_at'
            ),
        }
    }
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([AllowAny])
def publication_status_choices(request):
    """Get available publication status choices"""
    from apps.core.models import PublicationStatus
    
    return Response({
        'choices': [
            {'value': choice[0], 'label': choice[1]} 
            for choice in PublicationStatus.choices
        ]
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def report_issue(request):
    """Report an issue or bug"""
    issue_type = request.data.get('type', 'bug')
    description = request.data.get('description', '')
    url = request.data.get('url', '')
    
    if not description:
        return Response(
            {'error': 'Description is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Here you would typically save to a bug tracking system
    # For now, just log it
    report_data = {
        'user': request.user.email,
        'type': issue_type,
        'description': description,
        'url': url,
        'timestamp': timezone.now(),
        'user_agent': request.META.get('HTTP_USER_AGENT', ''),
    }
    
    # TODO: Implement actual issue tracking (e.g., save to database, send email, etc.)
    
    return Response({
        'message': 'Issue reported successfully',
        'report_id': f"ISSUE-{timezone.now().strftime('%Y%m%d%H%M%S')}"
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def system_status(request):
    """System status endpoint"""
    from django.db import connection
    
    try:
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        db_status = 'healthy'
    except Exception:
        db_status = 'unhealthy'
    
    return Response({
        'database': db_status,
        'api': 'healthy',
        'timestamp': timezone.now(),
        'uptime': 'running'  # In a real system, you'd calculate actual uptime
    })
