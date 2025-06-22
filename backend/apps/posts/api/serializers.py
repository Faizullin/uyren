from rest_framework import serializers
from ..models import Post, PostTag, PostComment, PostLike


class PostTagSerializer(serializers.ModelSerializer):
    """Serializer for PostTag model"""
    
    class Meta:
        model = PostTag
        fields = ['id', 'name', 'slug', 'description', 'color', 'created_at']
        read_only_fields = ['id', 'slug', 'created_at']


class PostCommentSerializer(serializers.ModelSerializer):
    """Serializer for PostComment model"""
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    replies = serializers.SerializerMethodField()
    
    class Meta:
        model = PostComment
        fields = [
            'id', 'content', 'author', 'author_name', 'parent', 
            'replies', 'is_approved', 'created_at'
        ]
        read_only_fields = ['id', 'author', 'created_at']
    
    def get_replies(self, obj):
        if obj.replies.exists():
            return PostCommentSerializer(obj.replies.all(), many=True).data
        return []


class PostSerializer(serializers.ModelSerializer):
    """Serializer for Post model"""
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    tags = PostTagSerializer(many=True, read_only=True)
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    attachment_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    comments_count = serializers.SerializerMethodField()
    is_published = serializers.ReadOnlyField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'content', 'excerpt', 'status',
            'published_at', 'author', 'author_name', 'attachments',
            'attachment_ids', 'tags', 'tag_ids', 'is_featured',
            'is_pinned', 'view_count', 'like_count', 'meta_title',
            'meta_description', 'comments_count', 'is_published',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'slug', 'author', 'view_count', 'like_count',
            'created_at', 'updated_at'
        ]
    
    def get_comments_count(self, obj):
        return obj.comments.filter(is_approved=True).count()
    
    def create(self, validated_data):
        tag_ids = validated_data.pop('tag_ids', [])
        attachment_ids = validated_data.pop('attachment_ids', [])
        
        post = Post.objects.create(**validated_data)
        
        if tag_ids:
            post.tags.set(tag_ids)
        
        if attachment_ids:
            post.attachments.set(attachment_ids)
        
        return post
    
    def update(self, instance, validated_data):
        tag_ids = validated_data.pop('tag_ids', None)
        attachment_ids = validated_data.pop('attachment_ids', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if tag_ids is not None:
            instance.tags.set(tag_ids)
        
        if attachment_ids is not None:
            instance.attachments.set(attachment_ids)
        
        return instance


class PostListSerializer(serializers.ModelSerializer):
    """Simplified serializer for post list views"""
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    tags = PostTagSerializer(many=True, read_only=True)
    comments_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'excerpt', 'status', 'published_at',
            'author', 'author_name', 'tags', 'is_featured', 'view_count',
            'like_count', 'comments_count', 'created_at'
        ]
    
    def get_comments_count(self, obj):
        return obj.comments.filter(is_approved=True).count()


class PostLikeSerializer(serializers.ModelSerializer):
    """Serializer for PostLike model"""
    
    class Meta:
        model = PostLike
        fields = ['id', 'post', 'user', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
