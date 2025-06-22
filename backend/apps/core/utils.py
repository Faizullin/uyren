from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
import uuid


def validate_future_date(value):
    """Validator to ensure date is not in the future"""
    if value and value > timezone.now().date():
        raise ValidationError('Date cannot be in the future.')


def validate_past_date(value):
    """Validator to ensure date is not in the past"""
    if value and value < timezone.now().date():
        raise ValidationError('Date cannot be in the past.')


class AbstractUUIDModel(models.Model):
    """
    Abstract base class that provides UUID primary key
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    class Meta:
        abstract = True


class AbstractSoftDeleteModel(models.Model):
    """
    Abstract base class that provides soft delete functionality
    """
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        abstract = True
    
    def delete(self, using=None, keep_parents=False):
        """Soft delete the object"""
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


class AbstractActiveModel(models.Model):
    """
    Abstract base class that provides active/inactive status
    """
    is_active = models.BooleanField(default=True)
    
    class Meta:
        abstract = True


class AbstractOrderedModel(models.Model):
    """
    Abstract base class that provides ordering
    """
    order = models.PositiveIntegerField(default=0, db_index=True)
    
    class Meta:
        abstract = True
        ordering = ['order']


class AbstractMetaModel(models.Model):
    """
    Abstract base class that provides metadata fields
    """
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    slug = models.SlugField(max_length=200, unique=True)
    
    class Meta:
        abstract = True
    
    def __str__(self):
        return self.title
