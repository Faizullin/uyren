"""
CMS API Views

Simplified CMS API using existing Post and Attachment models.
Provides CRUD operations for post management with post_type="post".
"""

from apps.core.models import PublicationStatus
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
from .serializers import (
    PostListSerializer, PostDetailSerializer, PostCreateUpdateSerializer, 
    AttachmentSerializer, AttachmentUpdateSerializer, AttachmentUploadSerializer, AttachmentReplaceSerializer,
    PostPublishSerializer, PostSaveContentSerializer
)
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
        serializer.save(author=self.request.user, content="", post_type="post")
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish post"""
        post = self.get_object()
        
        serializer = PostPublishSerializer(post, data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        post.status = serializer.validated_data["status"]
        if post.status == PublicationStatus.PUBLISHED:
            post.published_at = timezone.now()
        post.save()
        return Response(PostDetailSerializer(post, context={'request': request}).data)
    

    @action(detail=True, methods=['get', 'post'])
    def content(self, request, pk=None):
        """
        GET: Load post content for editing.
        POST: Save post content after editing.
        """
        post = self.get_object()
        if request.method == 'GET':
            # Return content and metadata for editing
            return Response({
                'instance': PostDetailSerializer(post, context={'request': request}).data,
                'attachments': AttachmentSerializer(post.attachments.all(), many=True, context={'request': request}).data,
                'content': post.content,
            })
        elif request.method == 'POST':
            serializer = PostSaveContentSerializer(post, data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            post.content = serializer.validated_data["content"]
            post.save(update_fields=['content'])
            return Response({
                'instance': PostDetailSerializer(post, context={'request': request}).data,
                'attachments': AttachmentSerializer(post.attachments.all(), many=True, context={'request': request}).data,
                'content': post.content,
            })


class AttachmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Attachment operations
    
    Provides file upload and metadata management capabilities.
    Standard create is disabled - use upload action instead.
    """
    
    queryset = Attachment.objects.select_related('uploaded_by')
    serializer_class = AttachmentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = AttachmentFilter
    search_fields = ['title', 'description', 'alt_text', 'original_filename']
    ordering_fields = ['created_at', 'updated_at', 'title', 'file_size']
    ordering = ['-created_at']
    parser_classes = [MultiPartParser, JSONParser]
    
    def get_permissions(self):
        """Set permissions based on action - Admin only for all CMS operations"""
        permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action in ['update', 'partial_update']:
            return AttachmentUpdateSerializer
        elif self.action == 'upload':
            return AttachmentUploadSerializer
        return AttachmentSerializer
    
    def create(self, request, *args, **kwargs):
        """Disable standard create - use upload action instead"""
        return Response(
            {
                'error': 'Direct creation not allowed. Use /upload/ endpoint instead.',
                'upload_url': request.build_absolute_uri() + 'upload/'
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    def perform_update(self, serializer):
        """Update attachment metadata only"""
        serializer.save()
    
    @action(detail=False, methods=['post'])
    def upload(self, request):
        """Upload a new file or update existing attachment"""
        # Check if this is an update to existing attachment
        attachment_id = request.data.get('attachment_id')
        
        if attachment_id:
            # Update existing attachment
            try:
                attachment = Attachment.objects.get(id=attachment_id)
                
                # If new file provided, update it
                if 'file' in request.data:
                    # Delete old file
                    if attachment.file:
                        attachment.file.delete(save=False)
                    
                    # Use upload serializer for file update
                    serializer = AttachmentUploadSerializer(
                        attachment, 
                        data=request.data, 
                        partial=True,
                        context={'request': request}                    )
                else:
                    # Update metadata only
                    serializer = AttachmentUpdateSerializer(
                        attachment,
                        data=request.data,
                        partial=True,
                        context={'request': request}
                    )
                
                if serializer.is_valid():
                    updated_attachment = serializer.save()
                    return Response(
                        AttachmentSerializer(updated_attachment, context={'request': request}).data,
                        status=status.HTTP_200_OK
                    )
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                    
            except Attachment.DoesNotExist:
                return Response(
                    {'error': 'Attachment not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Create new attachment
            serializer = AttachmentUploadSerializer(
                data=request.data, 
                context={'request': request}
            )
            
            if serializer.is_valid():
                attachment = serializer.save(uploaded_by=request.user)
                return Response(
                    AttachmentSerializer(attachment, context={'request': request}).data,
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def replace_file(self, request, pk=None):
        """Replace file for existing attachment while keeping metadata"""
        attachment = self.get_object()
        
        if 'file' not in request.data:
            return Response(
                {'error': 'File is required for replacement'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete old file
        if attachment.file:
            attachment.file.delete(save=False)
        
        # Update with new file
        serializer = AttachmentReplaceSerializer(
            attachment,
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            updated_attachment = serializer.save()
            return Response(
                AttachmentSerializer(updated_attachment, context={'request': request}).data,
                status=status.HTTP_200_OK
            )
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def orphaned(self, request):
        """Get orphaned attachments (not attached to any posts)"""
        # Assuming attachments are related to posts via content_object or a specific relation
        orphaned_attachments = self.get_queryset().filter(content_object__isnull=True)
        
        page = self.paginate_queryset(orphaned_attachments)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(orphaned_attachments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['delete'])
    def cleanup_orphaned(self, request):
        """Delete orphaned attachments"""
        orphaned_attachments = Attachment.objects.filter(content_object__isnull=True)
        count = orphaned_attachments.count()
        
        # Delete the files and database records
        for attachment in orphaned_attachments:
            if attachment.file:
                attachment.file.delete(save=False)
            attachment.delete()
        
        return Response({'deleted_count': count})
    
    @action(detail=True, methods=['get'])
    def usage(self, request, pk=None):
        """Get usage information for this attachment"""
        attachment = self.get_object()
        
        usage_info = {
            'attachment_id': attachment.id,
            'title': attachment.title,
            'file_type': attachment.file_type,
            'is_orphaned': attachment.content_object is None,
            'content_object': None
        }
        
        if attachment.content_object:
            usage_info['content_object'] = {
                'model': attachment.content_type.model,
                'object_id': attachment.object_id,
                'title': str(attachment.content_object)
            }
        
        return Response(usage_info)

