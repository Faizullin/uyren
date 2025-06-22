import uuid
from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.utils.text import slugify
from apps.core.models import AbstractTimestampedModel, PublicationStatus


class PostQuerySet(models.QuerySet):
    """Custom queryset for Post model"""
    
    def published(self):
        """Return only published posts"""
        return self.filter(status=PublicationStatus.PUBLISHED)
    
    def drafts(self):
        """Return only draft posts"""
        return self.filter(status=PublicationStatus.DRAFT)
    
    def by_author(self, user):
        """Return posts by specific author"""
        return self.filter(author=user)
    
    def featured(self):
        """Return featured posts"""
        return self.filter(is_featured=True)


class PostManager(models.Manager):
    """Custom manager for Post model"""
    
    def get_queryset(self):
        return PostQuerySet(self.model, using=self._db)
    
    def published(self):
        return self.get_queryset().published()
    
    def drafts(self):
        return self.get_queryset().drafts()
    
    def by_author(self, user):
        return self.get_queryset().by_author(user)
    
    def featured(self):
        return self.get_queryset().featured()


class Post(AbstractTimestampedModel):
    """
    Post model with generic relationships and publication status
    """
    
    # Basic fields
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    content = models.TextField()
    excerpt = models.TextField(max_length=500, blank=True)
    
    # Publication status using TextChoices from core
    status = models.CharField(
        max_length=20, 
        choices=PublicationStatus.choices, 
        default=PublicationStatus.DRAFT
    )
    published_at = models.DateTimeField(null=True, blank=True)
    
    # Author relationship
    author = models.ForeignKey(
        'accounts.User',
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name='posts'
    )
    
    # Many-to-many relationship with attachments
    attachments = models.ManyToManyField(
        'attachments.Attachment',
        blank=True,
        related_name='posts'
    )
    
    # Generic foreign key for flexible relationships - nullable with SET_NULL
    content_type = models.ForeignKey(
        ContentType, 
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Meta fields
    is_featured = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)
    view_count = models.PositiveIntegerField(default=0)
    like_count = models.PositiveIntegerField(default=0)
    
    # SEO fields
    meta_title = models.CharField(max_length=255, blank=True)
    meta_description = models.TextField(max_length=160, blank=True)
    
    # Tags
    tags = models.ManyToManyField('PostTag', blank=True, related_name='posts')
    
    objects = PostManager()
    
    class Meta:
        db_table = 'posts_post'
        verbose_name = 'Post'
        verbose_name_plural = 'Posts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['author']),
            models.Index(fields=['published_at']),
            models.Index(fields=['slug']),
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['is_featured']),
        ]
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        """Override save to auto-generate slug"""
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            
            while Post.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            self.slug = slug
        
        # Auto-generate meta fields if not provided
        if not self.meta_title:
            self.meta_title = self.title
        
        if not self.meta_description and self.excerpt:
            self.meta_description = self.excerpt[:160]
        
        super().save(*args, **kwargs)
      
    @property
    def is_published(self):
        """Check if post is published"""
        return self.status == PublicationStatus.PUBLISHED
    
    def publish(self):
        """Publish the post"""
        from django.utils import timezone
        self.status = PublicationStatus.PUBLISHED
        if not self.published_at:
            self.published_at = timezone.now()
        self.save()
    
    def unpublish(self):
        """Unpublish the post"""
        self.status = PublicationStatus.DRAFT
        self.save()


class PostTag(AbstractTimestampedModel):
    """
    Tag model for categorizing posts
    """
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#000000')  # Hex color
    
    class Meta:
        db_table = 'posts_tag'
        verbose_name = 'Post Tag'
        verbose_name_plural = 'Post Tags'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        """Override save to auto-generate slug"""
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class PostComment(AbstractTimestampedModel):
    """
    Comment model for posts with generic relationship support
    """
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    author = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='post_comments'
    )
    content = models.TextField()
    
    # For nested comments
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )
    
    # Moderation
    is_approved = models.BooleanField(default=True)
    is_flagged = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'posts_comment'
        verbose_name = 'Post Comment'
        verbose_name_plural = 'Post Comments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['post']),
            models.Index(fields=['author']),
            models.Index(fields=['parent']),
            models.Index(fields=['is_approved']),
        ]
    
    def __str__(self):
        return f"Comment by {self.author.email} on {self.post.title}"


class PostLike(AbstractTimestampedModel):
    """
    Like model for posts
    """
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='likes'
    )
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='post_likes'
    )
    
    class Meta:
        db_table = 'posts_like'
        verbose_name = 'Post Like'
        verbose_name_plural = 'Post Likes'
        unique_together = ['post', 'user']
        indexes = [
            models.Index(fields=['post']),
            models.Index(fields=['user']),
        ]
    
    def __str__(self):
        return f"{self.user.email} likes {self.post.title}"
