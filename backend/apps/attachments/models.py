import os
import uuid
from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.core.validators import FileExtensionValidator
from django.utils.text import slugify
from apps.core.models import AbstractTimestampedModel
from apps.core.constants import (
    ALLOWED_IMAGE_EXTENSIONS, 
    ALLOWED_DOCUMENT_EXTENSIONS,
    MAX_FILE_SIZE
)


def get_file_upload_path(instance, filename):
    """Generate upload path for files"""
    # Get file extension
    ext = filename.split('.')[-1].lower()
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    
    # Create path based on content type and object id
    if instance.content_object:
        model_name = instance.content_object._meta.model_name
        object_id = instance.content_object.pk
        return f"attachments/{model_name}/{object_id}/{unique_filename}"
    
    return f"attachments/orphaned/{unique_filename}"


class AttachmentQuerySet(models.QuerySet):
    """Custom queryset for Attachment model"""
    
    def images(self):
        """Return only image attachments"""
        return self.filter(file_type='image')
    
    def documents(self):
        """Return only document attachments"""
        return self.filter(file_type='document')
    
    def by_user(self, user):
        """Return attachments uploaded by specific user"""
        return self.filter(uploaded_by=user)
    
    def for_object(self, obj):
        """Return attachments for specific object"""
        content_type = ContentType.objects.get_for_model(obj)
        return self.filter(content_type=content_type, object_id=obj.pk)


class AttachmentManager(models.Manager):
    """Custom manager for Attachment model"""
    
    def get_queryset(self):
        return AttachmentQuerySet(self.model, using=self._db)
    
    def images(self):
        return self.get_queryset().images()
    
    def documents(self):
        return self.get_queryset().documents()
    
    def by_user(self, user):
        return self.get_queryset().by_user(user)
    
    def for_object(self, obj):
        return self.get_queryset().for_object(obj)


class Attachment(AbstractTimestampedModel):
    """
    Generic attachment model that can be attached to any model
    """
    FILE_TYPE_CHOICES = [
        ('image', 'Image'),
        ('document', 'Document'),
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('other', 'Other'),
    ]
    
    # File fields
    file = models.FileField(
        upload_to=get_file_upload_path,
        validators=[FileExtensionValidator(
            allowed_extensions=ALLOWED_IMAGE_EXTENSIONS + ALLOWED_DOCUMENT_EXTENSIONS
        )]
    )
    original_filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(help_text="File size in bytes")
    file_type = models.CharField(max_length=20, choices=FILE_TYPE_CHOICES)
    mime_type = models.CharField(max_length=100, blank=True)
    
    # Metadata
    title = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    alt_text = models.CharField(max_length=255, blank=True, help_text="Alternative text for images")
      # Generic foreign key to attach to any model
    content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # User tracking
    uploaded_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploaded_attachments'
    )
    
    # Additional flags
    is_public = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    
    objects = AttachmentManager()
    
    class Meta:
        db_table = 'attachments_attachment'
        verbose_name = 'Attachment'
        verbose_name_plural = 'Attachments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['uploaded_by']),
            models.Index(fields=['file_type']),
            models.Index(fields=['is_public']),
        ]
    
    def __str__(self):
        return self.title or self.original_filename
    
    def save(self, *args, **kwargs):
        """Override save to auto-populate fields"""
        if self.file and not self.original_filename:
            self.original_filename = self.file.name
        
        if self.file and not self.file_size:
            self.file_size = self.file.size
        
        if not self.title:
            # Generate title from filename
            name_without_ext = os.path.splitext(self.original_filename)[0]
            self.title = name_without_ext.replace('_', ' ').replace('-', ' ').title()
        
        # Determine file type based on extension
        if self.file and not self.file_type:
            ext = self.original_filename.split('.')[-1].lower()
            if ext in ALLOWED_IMAGE_EXTENSIONS:
                self.file_type = 'image'
            elif ext in ALLOWED_DOCUMENT_EXTENSIONS:
                self.file_type = 'document'
            elif ext in ['mp4', 'avi', 'mov', 'webm']:
                self.file_type = 'video'
            elif ext in ['mp3', 'wav', 'ogg']:
                self.file_type = 'audio'
            else:
                self.file_type = 'other'
        
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        """Override delete to remove file from storage"""
        if self.file:
            try:
                self.file.delete(save=False)
            except:
                pass
        super().delete(*args, **kwargs)
    
    @property
    def file_extension(self):
        """Get file extension"""
        return os.path.splitext(self.original_filename)[1].lower()
    
    @property
    def file_size_human(self):
        """Get human readable file size"""
        size = self.file_size
        if size is None:
            return ""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"
    
    @property
    def is_image(self):
        """Check if attachment is an image"""
        return self.file_type == 'image'
    
    @property
    def is_document(self):
        """Check if attachment is a document"""
        return self.file_type == 'document'
    
    @property
    def file_url(self):
        """Get file URL"""
        if self.file:
            return self.file.url
        return None


class AttachmentTag(AbstractTimestampedModel):
    """Tags for categorizing attachments"""
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)
    color = models.CharField(max_length=7, default='#007bff', help_text="Hex color code")
    
    class Meta:
        db_table = 'attachments_tag'
        verbose_name = 'Attachment Tag'
        verbose_name_plural = 'Attachment Tags'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class AttachmentTagging(models.Model):
    """Many-to-many relationship between attachments and tags"""
    attachment = models.ForeignKey(Attachment, on_delete=models.CASCADE, related_name='taggings')
    tag = models.ForeignKey(AttachmentTag, on_delete=models.CASCADE, related_name='taggings')
    
    class Meta:
        db_table = 'attachments_tagging'
        unique_together = ['attachment', 'tag']
        verbose_name = 'Attachment Tagging'
        verbose_name_plural = 'Attachment Taggings'
