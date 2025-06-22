from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.contrib.contenttypes.models import ContentType

from ..models import Attachment
from .serializers import AttachmentSerializer, AttachmentUploadSerializer
from .filters import AttachmentFilter
from apps.core.permissions import (
    IsAuthenticated, 
    IsOwnerOrReadOnly,
    CanAccessAttachment,
    IsAdminOrReadOnly
)


class AttachmentViewSet(ModelViewSet):
    """
    ViewSet for managing attachments
    """
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    permission_classes = [IsAuthenticated, CanAccessAttachment]
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = AttachmentFilter
    search_fields = ['original_filename', 'alt_text', 'description']
    ordering_fields = ['created_at', 'file_size', 'original_filename']
    ordering = ['-created_at']

    def get_permissions(self):
        """
        Instantiate and return the list of permissions required for this view.
        """
        if self.action == 'list':
            permission_classes = [IsAuthenticated]
        elif self.action == 'retrieve':
            permission_classes = [IsAuthenticated, CanAccessAttachment]
        elif self.action == 'create':
            permission_classes = [IsAuthenticated]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
        elif self.action == 'destroy':
            permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
        else:
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Filter queryset based on user permissions
        """
        queryset = Attachment.objects.all()
        
        if self.request.user.is_staff:
            return queryset
        
        # Regular users can only see their own attachments and public ones
        from django.db.models import Q
        return queryset.filter(
            Q(uploaded_by=self.request.user) |
            Q(content_object__isnull=True) |  # Orphaned attachments
            Q(posts__status='published')  # Attachments linked to published posts
        ).distinct()

    def get_serializer_class(self):
        """
        Return the appropriate serializer based on action
        """
        if self.action == 'create':
            return AttachmentUploadSerializer
        return AttachmentSerializer

    def perform_create(self, serializer):
        """
        Set the uploader to the current user
        """
        serializer.save(uploaded_by=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_attachments(self, request):
        """
        Get current user's attachments
        """
        queryset = self.get_queryset().filter(uploaded_by=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def images(self, request):
        """
        Get image attachments
        """
        queryset = self.get_queryset().filter(file_type='image')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def documents(self, request):
        """
        Get document attachments
        """
        queryset = self.get_queryset().filter(file_type='document')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def bulk_upload(self, request):
        """
        Upload multiple files at once
        """
        files = request.FILES.getlist('files')
        if not files:
            return Response(
                {'error': 'No files provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_attachments = []
        errors = []
        
        for file in files:
            serializer = AttachmentUploadSerializer(data={'file': file})
            if serializer.is_valid():
                attachment = serializer.save(uploaded_by=request.user)
                uploaded_attachments.append(AttachmentSerializer(attachment).data)
            else:
                errors.append({
                    'filename': file.name,
                    'errors': serializer.errors
                })
        
        response_data = {
            'uploaded': uploaded_attachments,
            'errors': errors,
            'success_count': len(uploaded_attachments),
            'error_count': len(errors)
        }
        
        if errors and not uploaded_attachments:
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(response_data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsOwnerOrReadOnly])
    def attach_to_object(self, request, pk=None):
        """
        Attach this file to a specific object
        """
        attachment = self.get_object()
        
        content_type_id = request.data.get('content_type_id')
        object_id = request.data.get('object_id')
        
        if not content_type_id or not object_id:
            return Response(
                {'error': 'content_type_id and object_id are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            content_type = ContentType.objects.get(id=content_type_id)
            content_object = content_type.get_object_for_this_type(id=object_id)
            
            # Check if user has permission to attach to this object
            if hasattr(content_object, 'author') and content_object.author != request.user:
                if not request.user.is_staff:
                    return Response(
                        {'error': 'You can only attach files to your own content'}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            attachment.content_object = content_object
            attachment.save()
            
            serializer = self.get_serializer(attachment)
            return Response(serializer.data)
            
        except ContentType.DoesNotExist:
            return Response(
                {'error': 'Invalid content type'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Object not found: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['delete'], permission_classes=[IsAuthenticated, IsOwnerOrReadOnly])
    def detach_from_object(self, request, pk=None):
        """
        Detach this file from its current object
        """
        attachment = self.get_object()
        attachment.content_object = None
        attachment.save()
        
        serializer = self.get_serializer(attachment)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attachment_stats(request):
    """
    Get attachment statistics for the current user
    """
    user_attachments = Attachment.objects.filter(uploaded_by=request.user)
    
    stats = {
        'total_files': user_attachments.count(),
        'total_size': sum(att.file_size for att in user_attachments),
        'images_count': user_attachments.filter(file_type='image').count(),
        'documents_count': user_attachments.filter(file_type='document').count(),
        'orphaned_count': user_attachments.filter(content_object__isnull=True).count(),
    }
    
    return Response(stats)
