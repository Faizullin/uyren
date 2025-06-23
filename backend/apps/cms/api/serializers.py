"""
CMS API Serializers

Simplified serializers using existing Post and Attachment models.
"""

from rest_framework import serializers
from apps.posts.models import Post
from apps.attachments.models import Attachment


class AttachmentSerializer(serializers.ModelSerializer):
    """Serializer for Attachment model - for listing and viewing"""
    
    class Meta:
        model = Attachment
        fields = [
            'id', 'title', 'description', 'alt_text','name', 'original_filename',
            'url', 'file_type', 'file_size', 'file_size_human', 'mime_type', 
            'is_public', 'is_featured', 'uploaded_by', 
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'name', 'file_type', 'file_size', 'file_size_human', 
            'mime_type', 'uploaded_by', 'created_at', 'updated_at'
        ]


class AttachmentUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating attachment metadata only"""
    
    class Meta:
        model = Attachment
        fields = ['title', 'description', 'alt_text', 'is_public', 'is_featured']


class AttachmentUploadSerializer(serializers.ModelSerializer):
    """Serializer for uploading new attachments"""
    
    file = serializers.FileField(required=True, allow_empty_file=False, write_only=True)
    
    class Meta:
        model = Attachment
        fields = ['file', 'title', 'description', 'alt_text', 'is_public', 'is_featured']
        
    def validate_file(self, value):
        """Validate uploaded file"""
        if not value:
            raise serializers.ValidationError("File is required.")
        
        max_size = 10 * 1024 * 1024  # 10MB
        if hasattr(value, 'size') and value.size > max_size:
            raise serializers.ValidationError("File size cannot exceed 10MB.")
            
        return value
    
    def create(self, validated_data):
        """Create attachment with file metadata"""
        file_obj = validated_data.get('file')
        if file_obj:
            validated_data['file_size'] = file_obj.size
            validated_data['mime_type'] = getattr(file_obj, 'content_type', '')
            validated_data['original_filename'] = file_obj.name
        
        attachment = super().create(validated_data)
        # Update URL field with full file URL
        if attachment.file:
            request = self.context.get('request')
            if request:
                attachment.url = request.build_absolute_uri(attachment.file.url)
            else:
                attachment.url = attachment.file.url
            attachment.save(update_fields=['url'])
        
        return attachment
    
    def update(self, instance, validated_data):
        """Update attachment with new file"""
        file_obj = validated_data.get('file')
        if file_obj:
            validated_data['file_size'] = file_obj.size
            validated_data['mime_type'] = getattr(file_obj, 'content_type', '')
            validated_data['original_filename'] = file_obj.name
        
        attachment = super().update(instance, validated_data)
        # Update URL field with full file URL
        if attachment.file:
            request = self.context.get('request')
            if request:
                attachment.url = request.build_absolute_uri(attachment.file.url)
            else:
                attachment.url = attachment.file.url
            attachment.save(update_fields=['url'])
        
        return attachment


class AttachmentReplaceSerializer(serializers.ModelSerializer):
    """Serializer for replacing attachment file only"""
    
    file = serializers.FileField(
        required=True, 
        allow_empty_file=False, 
        write_only=True,
        help_text="Upload a new file to replace the existing attachment."
    )
    
    class Meta:
        model = Attachment
        fields = ['file']
        
    def validate_file(self, value):
        """Validate replacement file"""
        if not value:
            raise serializers.ValidationError("File is required for replacement.")
        
        max_size = 10 * 1024 * 1024  # 10MB
        if hasattr(value, 'size') and value.size > max_size:
            raise serializers.ValidationError("File size cannot exceed 10MB.")
            
        return value
    
    def update(self, instance, validated_data):
        """Update file and related metadata"""
        file_obj = validated_data.get('file')
        if file_obj:
            instance.file = file_obj
            instance.file_size = file_obj.size
            instance.mime_type = getattr(file_obj, 'content_type', '')
            instance.original_filename = file_obj.name
            # Update URL field with full file URL
            request = self.context.get('request')
            if request:
                instance.url = request.build_absolute_uri(instance.file.url)
            else:
                instance.url = instance.file.url
            instance.save()
        
        return instance


class PostAuthorSerializer(serializers.ModelSerializer):
    """Serializer for Post author details"""
    
    class Meta:
        model = Post.author.field.related_model
        fields = ['id', 'username', 'email']
        read_only_fields = ['id', 'username', 'email']
            
class PostListSerializer(serializers.ModelSerializer):
    """Serializer for Post model in list views"""
    
    author = PostAuthorSerializer(read_only=True)
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'excerpt', 'status', 'is_featured', 'is_pinned',
            'published_at', 'view_count', 'like_count', 'author',  'created_at',   'post_type',
        ]
        read_only_fields = [
            'id', 'slug', 'author', 'view_count', 'like_count', 'created_at',
             'post_type', 'status', 'published_at', 
        ]



class PostDetailSerializer(PostListSerializer):
    """Serializer for Post model in detail views"""
    
    author = PostAuthorSerializer(read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)
    
    class Meta(PostListSerializer.Meta):
        fields = PostListSerializer.Meta.fields + [
            'meta_title', 'meta_description',
            'attachments', 'updated_at'
        ]
        read_only_fields = PostListSerializer.Meta.read_only_fields + [
            'attachments', 'updated_at',
        ]


class PostCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating Posts"""
    
    class Meta:
        model = Post
        fields = [
            'title','excerpt', 'status', 'is_featured', 'is_pinned',
            'meta_title', 'meta_description',
            ]
        read_only_fields = ['id', 'status']


class PostSaveContentSerializer(serializers.ModelSerializer):
    """Serializer for saving Post content"""
    
    class Meta:
        model = Post
        fields = ['content']
        

class PostPublishSerializer(serializers.ModelSerializer):
    """Serializer for publishing a Post"""
    
    class Meta:
        model = Post
        fields = [ 'status',]
