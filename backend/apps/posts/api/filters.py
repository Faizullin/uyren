import django_filters
from django_filters import rest_framework as filters
from ..models import Post, PostTag


class PostFilter(filters.FilterSet):
    """Filter class for Post model"""
    
    # Date range filters
    created_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    published_after = filters.DateTimeFilter(field_name='published_at', lookup_expr='gte')
    published_before = filters.DateTimeFilter(field_name='published_at', lookup_expr='lte')
    
    # Tag filters
    tags = filters.ModelMultipleChoiceFilter(
        field_name='tags',
        queryset=PostTag.objects.all(),
        conjoined=False  # OR logic instead of AND
    )
    tag_names = filters.CharFilter(method='filter_by_tag_names')
    
    # Author filter
    author_email = filters.CharFilter(field_name='author__email', lookup_expr='icontains')
    
    # Content filters
    title_contains = filters.CharFilter(field_name='title', lookup_expr='icontains')
    content_contains = filters.CharFilter(field_name='content', lookup_expr='icontains')
    
    # Boolean filters
    is_featured = filters.BooleanFilter()
    is_pinned = filters.BooleanFilter()
    
    # Numeric range filters
    view_count_min = filters.NumberFilter(field_name='view_count', lookup_expr='gte')
    view_count_max = filters.NumberFilter(field_name='view_count', lookup_expr='lte')
    like_count_min = filters.NumberFilter(field_name='like_count', lookup_expr='gte')
    like_count_max = filters.NumberFilter(field_name='like_count', lookup_expr='lte')
    
    class Meta:
        model = Post
        fields = {
            'status': ['exact', 'in'],
            'author': ['exact'],
            'created_at': ['exact', 'gte', 'lte'],
            'published_at': ['exact', 'gte', 'lte'],
        }
    
    def filter_by_tag_names(self, queryset, name, value):
        """Filter posts by comma-separated tag names"""
        if value:
            tag_names = [tag.strip() for tag in value.split(',')]
            return queryset.filter(tags__name__in=tag_names).distinct()
        return queryset
