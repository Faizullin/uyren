import os
import mimetypes
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from apps.core.constants import MAX_FILE_SIZE, ALLOWED_IMAGE_EXTENSIONS, ALLOWED_DOCUMENT_EXTENSIONS


def validate_file_size(file):
    """Validate file size"""
    if file.size > MAX_FILE_SIZE:
        raise ValidationError(f'File size must be less than {MAX_FILE_SIZE / (1024 * 1024):.1f} MB')


def validate_file_extension(file):
    """Validate file extension"""
    ext = os.path.splitext(file.name)[1].lower().lstrip('.')
    allowed_extensions = ALLOWED_IMAGE_EXTENSIONS + ALLOWED_DOCUMENT_EXTENSIONS
    
    if ext not in allowed_extensions:
        raise ValidationError(
            f'File extension .{ext} is not allowed. '
            f'Allowed extensions: {", ".join(allowed_extensions)}'
        )


def get_file_mime_type(file):
    """Get MIME type for a file"""
    mime_type, _ = mimetypes.guess_type(file.name)
    return mime_type or 'application/octet-stream'


def get_content_type_for_model(model_name, app_label=None):
    """Get ContentType for a model"""
    try:
        if app_label:
            return ContentType.objects.get(app_label=app_label, model=model_name.lower())
        else:
            return ContentType.objects.get(model=model_name.lower())
    except ContentType.DoesNotExist:
        return None


def attach_file_to_object(file, obj, user, **kwargs):
    """Helper function to attach a file to any Django model instance"""
    from .models import Attachment
    
    content_type = ContentType.objects.get_for_model(obj)
    
    attachment = Attachment.objects.create(
        file=file,
        content_type=content_type,
        object_id=obj.pk,
        uploaded_by=user,
        **kwargs
    )
    
    return attachment


def get_attachments_for_object(obj, file_type=None):
    """Get all attachments for a specific object"""
    from .models import Attachment
    
    content_type = ContentType.objects.get_for_model(obj)
    queryset = Attachment.objects.filter(
        content_type=content_type,
        object_id=obj.pk
    )
    
    if file_type:
        queryset = queryset.filter(file_type=file_type)
    
    return queryset


def get_object_images(obj):
    """Get all image attachments for an object"""
    return get_attachments_for_object(obj, file_type='image')


def get_object_documents(obj):
    """Get all document attachments for an object"""
    return get_attachments_for_object(obj, file_type='document')


class AttachmentMixin:
    """
    Mixin to add attachment functionality to any model
    """
    
    def get_attachments(self):
        """Get all attachments for this object"""
        return get_attachments_for_object(self)
    
    def get_images(self):
        """Get all image attachments for this object"""
        return get_object_images(self)
    
    def get_documents(self):
        """Get all document attachments for this object"""
        return get_object_documents(self)
    
    def attach_file(self, file, user, **kwargs):
        """Attach a file to this object"""
        return attach_file_to_object(file, self, user, **kwargs)
    
    @property
    def attachment_count(self):
        """Get total number of attachments"""
        return self.get_attachments().count()
    
    @property
    def image_count(self):
        """Get total number of image attachments"""
        return self.get_images().count()
    
    @property
    def document_count(self):
        """Get total number of document attachments"""
        return self.get_documents().count()
