"""
Attachment serializers for file upload and validation
"""

from rest_framework import serializers
from django.core.exceptions import ValidationError
from django.contrib.contenttypes.models import ContentType
from .models import Attachment, AttachmentTag
from apps.core.constants import (
    ALLOWED_IMAGE_EXTENSIONS,
    ALLOWED_DOCUMENT_EXTENSIONS,
    ALLOWED_VIDEO_EXTENSIONS,
    ALLOWED_AUDIO_EXTENSIONS,
    MAX_FILE_SIZE
)


class AttachmentUploadSerializer(serializers.ModelSerializer):
    """Serializer for uploading attachments with validation."""
    
    class Meta:
        model = Attachment
        fields = [
            'file',
            'title',
            'description',
            'alt_text',
            'is_public',
            'is_featured'
        ]
        extra_kwargs = {
            'title': {'required': False},
            'description': {'required': False},
            'alt_text': {'required': False},
        }
    
    def validate_file(self, value):
        """Validate uploaded file."""
        if not value:
            raise ValidationError("No file provided.")
        
        # Check file size
        if value.size > MAX_FILE_SIZE:
            raise ValidationError(
                f"File size too large. Maximum allowed size is {MAX_FILE_SIZE / (1024*1024):.1f}MB."
            )
        
        # Get file extension
        file_extension = value.name.split('.')[-1].lower() if '.' in value.name else ''
        
        # Check if extension is allowed
        allowed_extensions = (
            ALLOWED_IMAGE_EXTENSIONS + 
            ALLOWED_DOCUMENT_EXTENSIONS + 
            ALLOWED_VIDEO_EXTENSIONS + 
            ALLOWED_AUDIO_EXTENSIONS
        )
        
        if file_extension not in allowed_extensions:
            raise ValidationError(
                f"File type '{file_extension}' not allowed. "
                f"Allowed types: {', '.join(allowed_extensions)}"
            )
        
        return value
    
    def create(self, validated_data):
        """Create attachment with proper metadata."""
        file = validated_data['file']
        
        # Auto-populate fields based on file
        validated_data['original_filename'] = file.name
        validated_data['file_size'] = file.size
        
        # Set uploaded_by from request context
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['uploaded_by'] = request.user
        
        return super().create(validated_data)


class AttachmentSerializer(serializers.ModelSerializer):
    """Full serializer for attachment display."""
    
    file_size_human = serializers.ReadOnlyField()
    file_extension = serializers.ReadOnlyField()
    
    class Meta:
        model = Attachment
        fields = [
            'id',
            'url',
            'name',
            'original_filename',
            'title',
            'description',
            'alt_text',
            'file_size',
            'file_size_human',
            'file_type',
            'file_extension',
            'mime_type',
            'is_public',
            'is_featured',
            'uploaded_by',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id',
            'name',
            'original_filename',
            'file_size',
            'file_type',
            'mime_type',
            'uploaded_by',
            'created_at',
            'updated_at'
        ]


class AttachmentTagSerializer(serializers.ModelSerializer):
    """Serializer for attachment tags."""
    
    class Meta:
        model = AttachmentTag
        fields = ['id', 'name', 'slug', 'color', 'created_at']
        read_only_fields = ['id', 'slug', 'created_at']
