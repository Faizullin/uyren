from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from ..models import Post
from .serializers import PostSerializer, PostCreateSerializer, PostUpdateSerializer
from .filters import PostFilter
from apps.core.permissions import (
    IsAuthenticated, 
    IsAuthorOrReadOnly, 
    CanPublishPost,
    IsAdminOrReadOnly
)


class PostViewSet(ModelViewSet):
    """
    ViewSet for managing posts
    """
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated, IsAuthorOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = PostFilter
    search_fields = ['title', 'content', 'excerpt', 'author__username']
    ordering_fields = ['created_at', 'updated_at', 'published_at', 'view_count', 'like_count']
    ordering = ['-created_at']

    def get_permissions(self):
        """
        Instantiate and return the list of permissions required for this view.
        """
        if self.action == 'list':
            permission_classes = [permissions.AllowAny]  # Anyone can list published posts
        elif self.action == 'retrieve':
            permission_classes = [permissions.AllowAny]  # Anyone can view published posts
        elif self.action == 'create':
            permission_classes = [IsAuthenticated, CanPublishPost]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsAuthenticated, IsAuthorOrReadOnly, CanPublishPost]
        elif self.action == 'destroy':
            permission_classes = [IsAuthenticated, IsAuthorOrReadOnly]
        else:
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Filter queryset based on user and action
        """
        queryset = Post.objects.all()
        
        if self.action == 'list':
            # For listing, show published posts to all users
            if not self.request.user.is_authenticated:
                return queryset.published()
            
            # Authenticated users can see their own posts + published posts from others
            if not self.request.user.is_staff:
                from django.db.models import Q
                return queryset.filter(
                    Q(status='published') | Q(author=self.request.user)
                )
        
        elif self.action == 'retrieve':
            # For retrieving, check if user can access the post
            if not self.request.user.is_authenticated:
                return queryset.published()
            
            if not self.request.user.is_staff:
                from django.db.models import Q
                return queryset.filter(
                    Q(status='published') | Q(author=self.request.user)
                )
        
        return queryset

    def get_serializer_class(self):
        """
        Return the appropriate serializer based on action
        """
        if self.action == 'create':
            return PostCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PostUpdateSerializer
        return PostSerializer

    def perform_create(self, serializer):
        """
        Set the author to the current user and handle publication
        """
        post = serializer.save(author=self.request.user)
        
        # Set published_at if status is published
        if post.status == 'published' and not post.published_at:
            post.published_at = timezone.now()
            post.save()

    def perform_update(self, serializer):
        """
        Handle publication timestamp on update
        """
        instance = serializer.instance
        previous_status = instance.status
        
        post = serializer.save()
        
        # Set published_at if status changed to published
        if post.status == 'published' and previous_status != 'published' and not post.published_at:
            post.published_at = timezone.now()
            post.save()

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_posts(self, request):
        """
        Get current user's posts
        """
        queryset = self.get_queryset().filter(author=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def drafts(self, request):
        """
        Get current user's draft posts
        """
        queryset = self.get_queryset().filter(author=request.user, status='draft')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """
        Get featured posts
        """
        queryset = self.get_queryset().filter(is_featured=True, status='published')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        """
        Like a post
        """
        post = self.get_object()
        # TODO: Implement proper like system with user tracking
        post.like_count += 1
        post.save()
        return Response({'message': 'Post liked', 'like_count': post.like_count})

    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny])
    def view(self, request, pk=None):
        """
        Increment view count
        """
        post = self.get_object()
        post.view_count += 1
        post.save()
        return Response({'message': 'View recorded', 'view_count': post.view_count})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAuthorOrReadOnly])
    def publish(self, request, pk=None):
        """
        Publish a draft post
        """
        post = self.get_object()
        
        if post.status == 'published':
            return Response(
                {'error': 'Post is already published'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user can publish
        if not (request.user.is_staff or request.user.is_verified):
            return Response(
                {'error': 'Only verified users can publish posts'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        post.status = 'published'
        post.published_at = timezone.now()
        post.save()
        
        serializer = self.get_serializer(post)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsAuthorOrReadOnly])
    def unpublish(self, request, pk=None):
        """
        Unpublish a post (make it draft)
        """
        post = self.get_object()
        post.status = 'draft'
        post.save()
        
        serializer = self.get_serializer(post)
        return Response(serializer.data)
