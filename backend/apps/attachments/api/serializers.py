from rest_framework import serializers
from ..models import Attachment, AttachmentTag


class AttachmentTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttachmentTag
        fields = ['id', 'name', 'slug', 'color', 'created_at']
        read_only_fields = ['slug', 'created_at']


class AttachmentSerializer(serializers.ModelSerializer):
    tags = AttachmentTagSerializer(many=True, read_only=True)
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)
    file_extension = serializers.CharField(read_only=True)
    file_url = serializers.CharField(read_only=True)
    
    class Meta:
        model = Attachment
        fields = [
            'id', 'file', 'original_filename', 'file_size',
            'file_type', 'mime_type', 'title', 'description', 'alt_text',
            'content_type', 'object_id', 'uploaded_by', 'uploaded_by_name',
            'is_public', 'is_featured', 'file_extension', 'file_url',
            'tags', 'tag_ids', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'file_size', 'file_type', 'mime_type', 'uploaded_by', 'file_extension', 'file_url', 'created_at', 'updated_at'
        ]
    
    def create(self, validated_data):
        tag_ids = validated_data.pop('tag_ids', [])
        validated_data['uploaded_by'] = self.context['request'].user
        
        attachment = super().create(validated_data)
        
        # Add tags
        if tag_ids:
            tags = AttachmentTag.objects.filter(id__in=tag_ids)
            for tag in tags:
                attachment.taggings.create(tag=tag)
        
        return attachment
    
    def update(self, instance, validated_data):
        tag_ids = validated_data.pop('tag_ids', None)
        
        attachment = super().update(instance, validated_data)
        
        # Update tags if provided
        if tag_ids is not None:
            # Remove existing tags
            attachment.taggings.all().delete()
            # Add new tags
            tags = AttachmentTag.objects.filter(id__in=tag_ids)
            for tag in tags:
                attachment.taggings.create(tag=tag)
        
        return attachment


class AttachmentUploadSerializer(serializers.ModelSerializer):
    """Simplified serializer for file upload"""
    
    class Meta:
        model = Attachment
        fields = ['file', 'title', 'description', 'alt_text', 'is_public']
    
    def create(self, validated_data):
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)


class AttachmentListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing attachments"""
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)
    file_url = serializers.CharField(read_only=True)
    
    class Meta:
        model = Attachment
        fields = [
            'id', 'title', 'original_filename',
            'file_type', 'uploaded_by_name', 'is_public', 'is_featured',
            'file_url', 'created_at'
        ]
