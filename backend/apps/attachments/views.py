"""
Attachment views for file upload and management
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.contenttypes.models import ContentType
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.db import models

from .models import Attachment, AttachmentTag
from .serializers import (
    AttachmentSerializer,
    AttachmentUploadSerializer,
    AttachmentTagSerializer
)


class AttachmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing attachments."""
    
    queryset = Attachment.objects.all()
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['file_type', 'is_public', 'uploaded_by']
    search_fields = ['title', 'original_filename', 'description']
    ordering_fields = ['created_at', 'file_size', 'title']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return AttachmentUploadSerializer
        return AttachmentSerializer
    
    def get_queryset(self):
        """Filter attachments based on user permissions."""
        queryset = super().get_queryset()
        
        # Non-staff users can only see their own uploads and public attachments
        if not self.request.user.is_staff:
            queryset = queryset.filter(
                models.Q(uploaded_by=self.request.user) | 
                models.Q(is_public=True)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        """Set the uploaded_by field when creating."""
        serializer.save(uploaded_by=self.request.user)


class AttachmentTagViewSet(viewsets.ModelViewSet):
    """ViewSet for managing attachment tags."""
    
    queryset = AttachmentTag.objects.all()
    serializer_class = AttachmentTagSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering = ['name']


class FileUploadMixin:
    """Mixin to add file upload capabilities to ViewSets."""
    
    @action(
        detail=True,
        methods=['post'],
        parser_classes=[MultiPartParser, FormParser],
        url_path='upload-file'
    )
    def upload_file(self, request, pk=None):
        """Upload a file and attach it to the object."""
        obj = self.get_object()
        
        # Get the serializer class for file upload
        serializer_class = self.get_file_upload_serializer_class()
        serializer = serializer_class(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            # Create the attachment
            attachment = serializer.save()
            
            # Link the attachment to the object
            content_type = ContentType.objects.get_for_model(obj)
            attachment.content_type = content_type
            attachment.object_id = obj.pk
            attachment.save()
            
            # Handle specific attachment types if needed
            self.handle_attachment_created(obj, attachment, request.data)
            
            # Return the created attachment
            return Response(
                AttachmentSerializer(attachment, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(
        detail=True,
        methods=['get'],
        url_path='files'
    )
    def list_files(self, request, pk=None):
        """List all files attached to the object."""
        obj = self.get_object()
        attachments = Attachment.objects.for_object(obj)
        
        # Filter by file type if specified
        file_type = request.query_params.get('file_type')
        if file_type:
            attachments = attachments.filter(file_type=file_type)
        
        serializer = AttachmentSerializer(
            attachments, 
            many=True, 
            context={'request': request}
        )
        return Response(serializer.data)
    
    @action(
        detail=True,
        methods=['delete'],
        url_path='files/(?P<attachment_id>[^/.]+)'
    )
    def delete_file(self, request, pk=None, attachment_id=None):
        """Delete a specific file attached to the object."""
        obj = self.get_object()
        
        try:
            attachment = Attachment.objects.for_object(obj).get(id=attachment_id)
            
            # Check permissions
            if not request.user.is_staff and attachment.uploaded_by != request.user:
                return Response(
                    {'error': 'Permission denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Handle specific attachment deletion logic
            self.handle_attachment_deleted(obj, attachment)
            
            attachment.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Attachment.DoesNotExist:
            return Response(
                {'error': 'Attachment not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    def get_file_upload_serializer_class(self):
        """Override this method to specify the file upload serializer."""
        return AttachmentUploadSerializer
    
    def handle_attachment_created(self, obj, attachment, request_data):
        """Override this method to handle post-attachment creation logic."""
        pass
    
    def handle_attachment_deleted(self, obj, attachment):
        """Override this method to handle pre-attachment deletion logic."""
        pass
