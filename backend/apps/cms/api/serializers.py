"""
CMS API Serializers

Simplified serializers using existing Post and Attachment models.
"""

from rest_framework import serializers
from apps.posts.models import Post
from apps.attachments.models import Attachment


class AttachmentSerializer(serializers.ModelSerializer):
    """Serializer for Attachment model"""
    
    uploaded_by_name = serializers.CharField(source='uploaded_by.display_name', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Attachment
        fields = [
            'id', 'title', 'description', 'file', 'file_type', 'file_size',
            'file_size_human', 'mime_type', 'is_public', 'alt_text',
            'uploaded_by', 'uploaded_by_name', 'file_url', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'file_size', 'file_size_human', 'mime_type',
            'uploaded_by', 'uploaded_by_name', 'file_url', 'created_at', 'updated_at'
        ]
    
    def get_file_url(self, obj):
        """Get file URL"""
        if obj.file:
            return obj.file.url
        return None
    
    def create(self, validated_data):
        """Create attachment with file metadata"""
        # Get file metadata
        file_obj = validated_data.get('file')
        if file_obj:
            validated_data['file_size'] = file_obj.size
            validated_data['mime_type'] = getattr(file_obj, 'content_type', '')
        
        return super().create(validated_data)


class PostListSerializer(serializers.ModelSerializer):
    """Serializer for Post model in list views"""
    
    author_name = serializers.CharField(source='author.display_name', read_only=True)
    attachment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'excerpt', 'status', 'is_featured', 'is_pinned',
            'published_at', 'view_count', 'like_count', 'author', 'author_name',
            'attachment_count', 'created_at'
        ]
        read_only_fields = [
            'id', 'slug', 'author', 'author_name', 'view_count', 'like_count',
            'attachment_count', 'created_at'
        ]
    
    def get_attachment_count(self, obj):
        """Get the number of attachments for this post"""
        return obj.attachments.count()


class PostDetailSerializer(PostListSerializer):
    """Serializer for Post model in detail views"""
    
    attachments = AttachmentSerializer(many=True, read_only=True)
    
    class Meta(PostListSerializer.Meta):
        fields = PostListSerializer.Meta.fields + [
            'content', 'meta_title', 'meta_description',
            'attachments', 'updated_at'
        ]
        read_only_fields = PostListSerializer.Meta.read_only_fields + [
            'attachments', 'updated_at'
        ]


class PostCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating Posts"""
    
    attachment_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False,
        help_text="List of attachment IDs to associate with this post"    )
    
    class Meta:
        model = Post
        fields = [
            'title', 'content', 'excerpt', 'status', 'is_featured', 'is_pinned',
            'meta_title', 'meta_description', 'published_at',
            'attachment_ids'        ]
    
    def create(self, validated_data):
        """Create post with attachments"""
        attachment_ids = validated_data.pop('attachment_ids', [])
        
        post = Post.objects.create(**validated_data)
        
        # Handle attachments
        if attachment_ids:
            attachments = Attachment.objects.filter(id__in=attachment_ids)
            post.attachments.set(attachments)
        
        return post
    
    def update(self, instance, validated_data):
        """Update post with attachments"""
        attachment_ids = validated_data.pop('attachment_ids', None)
        
        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update attachments
        if attachment_ids is not None:
            attachments = Attachment.objects.filter(id__in=attachment_ids)
            instance.attachments.set(attachments)
        
        return instance
    
    def validate_attachment_ids(self, value):
        """Validate attachment IDs"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Attachment IDs must be a list")
        
        # Validate that all attachments exist
        existing_attachments = Attachment.objects.filter(id__in=value)
        if len(existing_attachments) != len(value):
            raise serializers.ValidationError("One or more attachment IDs are invalid")
        
        return value
