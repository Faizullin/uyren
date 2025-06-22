"""
CMS API Views

Simplified CMS API using existing Post and Attachment models.
Provides CRUD operations for post management with post_type="post".
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.permissions import BasePermission
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone

from apps.core.permissions import IsAuthenticated
from apps.posts.models import Post
from apps.attachments.models import Attachment
from .serializers import PostListSerializer, PostDetailSerializer, PostCreateUpdateSerializer, AttachmentSerializer
from .filters import PostFilter, AttachmentFilter


class IsAdminUser(BasePermission):
    """
    Custom permission to only allow admin users to access CMS operations.
    """
    message = "Only admin users can access CMS operations."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_staff

    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and request.user.is_staff


class PostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Post CRUD operations
    
    Manages posts with post_type="post" for CMS functionality.
    """
    
    queryset = Post.objects.select_related('author').prefetch_related('attachments')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PostFilter
    search_fields = ['title', 'content', 'excerpt', 'meta_title']
    ordering_fields = ['created_at', 'updated_at', 'published_at', 'title', 'view_count']
    ordering = ['-created_at']
    pemission_classes = [IsAdminUser]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return PostListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PostCreateUpdateSerializer
        return PostDetailSerializer
    
    def get_queryset(self):
        """Filter queryset - Admin users see all posts"""
        queryset = super().get_queryset()
        
        # Only admin users can access CMS, so return all posts
        return queryset
    
    def perform_create(self, serializer):
        """Set author when creating post"""
        serializer.save(author=self.request.user)
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish post"""
        post = self.get_object()
        post.status = 'published'
        post.published_at = timezone.now()
        post.save()
        
        serializer = self.get_serializer(post)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        """Unpublish post"""
        post = self.get_object()
        post.status = 'draft'
        post.save()
        
        serializer = self.get_serializer(post)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def feature(self, request, pk=None):
        """Feature post"""
        post = self.get_object()
        post.is_featured = True
        post.save()
        
        serializer = self.get_serializer(post)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def unfeature(self, request, pk=None):
        """Unfeature post"""
        post = self.get_object()
        post.is_featured = False
        post.save()
        
        serializer = self.get_serializer(post)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def increment_views(self, request, pk=None):
        """Increment view count for post"""
        post = self.get_object()
        post.view_count += 1
        post.save(update_fields=['view_count'])
        
        return Response({'view_count': post.view_count})
    
    @action(detail=True, methods=['post'])
    def attach_file(self, request, pk=None):
        """Attach file to post"""
        post = self.get_object()
        attachment_id = request.data.get('attachment_id')
        
        if not attachment_id:
            return Response(
                {'error': 'attachment_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            attachment = Attachment.objects.get(id=attachment_id)
            post.attachments.add(attachment)
            
            serializer = self.get_serializer(post)
            return Response(serializer.data)
            
        except Attachment.DoesNotExist:
            return Response(
                {'error': 'Attachment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['delete'])
    def detach_file(self, request, pk=None):
        """Detach file from post"""
        post = self.get_object()
        attachment_id = request.data.get('attachment_id')
        
        if not attachment_id:
            return Response(
                {'error': 'attachment_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            attachment = Attachment.objects.get(id=attachment_id)
            post.attachments.remove(attachment)
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Attachment.DoesNotExist:
            return Response(
                {'error': 'Attachment not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class AttachmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Attachment CRUD operations
    
    Provides file upload and management capabilities.
    """
    
    queryset = Attachment.objects.select_related('uploaded_by')
    serializer_class = AttachmentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = AttachmentFilter
    search_fields = ['name', 'description', 'alt_text']
    ordering_fields = ['created_at', 'updated_at', 'name', 'file_size']
    ordering = ['-created_at']
    parser_classes = [MultiPartParser, JSONParser]
    
    def get_permissions(self):
        """Set permissions based on action - Admin only for all CMS operations"""
        permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter queryset - Admin users see all attachments"""
        queryset = super().get_queryset()
        
        # Only admin users can access CMS, so return all attachments
        return queryset
    
    def perform_create(self, serializer):
        """Set uploader when creating attachment"""
        serializer.save(uploaded_by=self.request.user)
    
    @action(detail=False, methods=['post'])
    def upload(self, request):
        """Upload a new file"""
        serializer = AttachmentSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            attachment = serializer.save(uploaded_by=request.user)
            return Response(
                AttachmentSerializer(attachment, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def posts(self, request, pk=None):
        """Get posts that use this attachment"""
        attachment = self.get_object()
        posts = attachment.posts.all()
        
        # Admin users see all posts
        post_data = []
        for post in posts:
            post_data.append({
                'id': post.id,
                'title': post.title,
                'slug': post.slug,
                'status': post.status,
                'created_at': post.created_at
            })
        
        return Response({'posts': post_data})
    
    @action(detail=False, methods=['get'])
    def orphaned(self, request):
        """Get orphaned attachments (not attached to any posts)"""
        orphaned_attachments = self.get_queryset().filter(posts__isnull=True)
        
        page = self.paginate_queryset(orphaned_attachments)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(orphaned_attachments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['delete'])
    def cleanup_orphaned(self, request):
        """Delete orphaned attachments"""
        # All CMS users are admin, so no need for additional permission check
        
        orphaned_attachments = Attachment.objects.filter(posts__isnull=True)
        count = orphaned_attachments.count()
        
        # Delete the files and database records
        for attachment in orphaned_attachments:
            if attachment.file:
                attachment.file.delete()
            attachment.delete()
        
        return Response({'deleted_count': count})
