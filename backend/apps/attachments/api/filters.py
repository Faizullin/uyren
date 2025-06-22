import django_filters
from django_filters import rest_framework as filters
from ..models import Attachment, AttachmentTag


class AttachmentFilter(filters.FilterSet):
    """Filter class for Attachment model"""
    
    # File type filtering
    file_type = filters.ChoiceFilter(choices=Attachment.FILE_TYPE_CHOICES)
    
    # Date range filtering
    created_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    
    # File size filtering
    min_file_size = filters.NumberFilter(field_name='file_size', lookup_expr='gte')
    max_file_size = filters.NumberFilter(field_name='file_size', lookup_expr='lte')
    
    # Boolean filters
    is_public = filters.BooleanFilter()
    is_featured = filters.BooleanFilter()
    
    # User filtering
    uploaded_by = filters.ModelChoiceFilter(
        queryset=None,  # Will be set in __init__
        field_name='uploaded_by'
    )
    
    # Content type filtering for generic relationships
    content_type = filters.NumberFilter(field_name='content_type__id')
    object_id = filters.NumberFilter()
    
    # Tag filtering
    tags = filters.ModelMultipleChoiceFilter(
        queryset=AttachmentTag.objects.all(),
        field_name='taggings__tag',
        to_field_name='id'
    )
    
    class Meta:
        model = Attachment
        fields = [
            'file_type', 'is_public', 'is_featured', 'uploaded_by',
            'content_type', 'object_id', 'tags'
        ]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Set the queryset for uploaded_by filter
        from apps.accounts.models import User
        self.filters['uploaded_by'].queryset = User.objects.all()
