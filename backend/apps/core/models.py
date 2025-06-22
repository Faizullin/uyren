from django.db import models
from .managers import TimestampedManager, ActiveManager, SoftDeleteManager


class PublicationStatus(models.TextChoices):
    """Publication status choices for content models"""
    DRAFT = 'draft', 'Draft'
    PUBLISHED = 'published', 'Published'
    SCHEDULED = 'scheduled', 'Scheduled'
    ARCHIVED = 'archived', 'Archived'


class AbstractTimestampedModel(models.Model):
    """
    Abstract base class that provides created_at and updated_at fields
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = TimestampedManager()
    
    class Meta:
        abstract = True
        ordering = ['-created_at']
        
    def save(self, *args, **kwargs):
        """Override save to ensure updated_at is always updated"""
        super().save(*args, **kwargs)


class AbstractActiveTimestampedModel(AbstractTimestampedModel):
    """
    Abstract base class that combines timestamped and active functionality
    """
    is_active = models.BooleanField(default=True)
    
    objects = ActiveManager()
    all_objects = TimestampedManager()
    
    class Meta:
        abstract = True
        ordering = ['-created_at']


class AbstractSoftDeleteTimestampedModel(AbstractTimestampedModel):
    """
    Abstract base class that combines timestamped and soft delete functionality
    """
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    objects = SoftDeleteManager()
    all_objects = TimestampedManager()
    
    class Meta:
        abstract = True
        ordering = ['-created_at']
    
    def delete(self, using=None, keep_parents=False):
        """Soft delete the object"""
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(using=using)
    
    def hard_delete(self, using=None, keep_parents=False):
        """Permanently delete the object"""
        super().delete(using=using, keep_parents=keep_parents)
    
    def restore(self):
        """Restore a soft-deleted object"""
        self.is_deleted = False
        self.deleted_at = None
        self.save()
