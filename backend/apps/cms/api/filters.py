"""
CMS API Filters

Simplified filters using existing Post and Attachment models.
"""

import django_filters
from django.db import models
from apps.posts.models import Post
from apps.attachments.models import Attachment


class PostFilter(django_filters.FilterSet):
    """Filter for Post model"""
    
    # Text search
    search = django_filters.CharFilter(method='filter_search')
    
    # Status and meta filters
    status = django_filters.ChoiceFilter(choices=Post._meta.get_field('status').choices)
    is_featured = django_filters.BooleanFilter()
    is_pinned = django_filters.BooleanFilter()
    
    # Date filters
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    published_after = django_filters.DateTimeFilter(field_name='published_at', lookup_expr='gte')
    published_before = django_filters.DateTimeFilter(field_name='published_at', lookup_expr='lte')
    
    # Author filters
    author = django_filters.UUIDFilter(field_name='author__id')
    author_username = django_filters.CharFilter(field_name='author__username', lookup_expr='icontains')
    
    # Metrics filters
    view_count_min = django_filters.NumberFilter(field_name='view_count', lookup_expr='gte')
    view_count_max = django_filters.NumberFilter(field_name='view_count', lookup_expr='lte')
    like_count_min = django_filters.NumberFilter(field_name='like_count', lookup_expr='gte')
    like_count_max = django_filters.NumberFilter(field_name='like_count', lookup_expr='lte')
      # Attachment filters
    has_attachments = django_filters.BooleanFilter(method='filter_has_attachments')
    
    class Meta:
        model = Post
        fields = [
            'search', 'status', 'is_featured', 'is_pinned',
            'created_after', 'created_before', 'published_after', 'published_before',
            'author', 'author_username', 'view_count_min', 'view_count_max',
            'like_count_min', 'like_count_max', 'has_attachments'
        ]
    
    def filter_search(self, queryset, name, value):
        """Full-text search across title, content, and excerpt"""
        if not value:
            return queryset
        
        return queryset.filter(
            models.Q(title__icontains=value) |
            models.Q(content__icontains=value) |
            models.Q(excerpt__icontains=value) |
            models.Q(meta_title__icontains=value) |
            models.Q(meta_description__icontains=value)
        ).distinct()
    
    def filter_has_attachments(self, queryset, name, value):
        """Filter posts that have or don't have attachments"""
        if value is True:
            return queryset.filter(attachments__isnull=False).distinct()
        elif value is False:
            return queryset.filter(attachments__isnull=True)
        return queryset


class AttachmentFilter(django_filters.FilterSet):
    """Filter for Attachment model"""
    
    # Text search
    search = django_filters.CharFilter(method='filter_search')
    
    # Type filters
    file_type = django_filters.ChoiceFilter(choices=Attachment._meta.get_field('file_type').choices)
    mime_type = django_filters.CharFilter(lookup_expr='icontains')
    
    # Boolean filters
    is_public = django_filters.BooleanFilter()
    
    # Date filters
    uploaded_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    uploaded_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    
    uploaded_by = django_filters.UUIDFilter(field_name='uploaded_by__id')
 
    # File size filters
    file_size_min = django_filters.NumberFilter(field_name='file_size', lookup_expr='gte')
    file_size_max = django_filters.NumberFilter(field_name='file_size', lookup_expr='lte')
    
    # Usage filters
    orphaned = django_filters.BooleanFilter(method='filter_orphaned')
    
    class Meta:
        model = Attachment
        fields = [
            'search', 'file_type', 'mime_type', 'is_public',
            'uploaded_after', 'uploaded_before', 'uploaded_by', 
            'file_size_min', 'file_size_max', 'orphaned'
        ]
    
    def filter_search(self, queryset, name, value):
        """Search across name, description, and alt_text"""
        if not value:
            return queryset
        
        return queryset.filter(
            models.Q(name__icontains=value) |
            models.Q(description__icontains=value) |
            models.Q(alt_text__icontains=value)
        ).distinct()
    
    def filter_orphaned(self, queryset, name, value):
        """Filter attachments that are or aren't attached to any posts"""
        if value is True:
            return queryset.filter(posts__isnull=True)
        elif value is False:
            return queryset.filter(posts__isnull=False).distinct()
        return queryset
