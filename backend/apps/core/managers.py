from django.db import models
from django.utils import timezone


class ActiveManager(models.Manager):
    """Manager that returns only active objects"""
    
    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)


class SoftDeleteManager(models.Manager):
    """Manager that excludes soft-deleted objects"""
    
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)
    
    def deleted(self):
        """Return only soft-deleted objects"""
        return super().get_queryset().filter(is_deleted=True)
    
    def with_deleted(self):
        """Return all objects including soft-deleted"""
        return super().get_queryset()


class TimestampedManager(models.Manager):
    """Manager for timestamped models with useful methods"""
    
    def created_today(self):
        """Return objects created today"""
        today = timezone.now().date()
        return self.filter(created_at__date=today)
    
    def created_this_week(self):
        """Return objects created this week"""
        week_ago = timezone.now() - timezone.timedelta(days=7)
        return self.filter(created_at__gte=week_ago)
    
    def created_this_month(self):
        """Return objects created this month"""
        month_ago = timezone.now() - timezone.timedelta(days=30)
        return self.filter(created_at__gte=month_ago)
    
    def updated_today(self):
        """Return objects updated today"""
        today = timezone.now().date()
        return self.filter(updated_at__date=today)
