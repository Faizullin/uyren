from django.contrib import admin
from .models import Attachment, AttachmentTag, AttachmentTagging


@admin.register(AttachmentTag)
class AttachmentTagAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'color', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at']


class AttachmentTaggingInline(admin.TabularInline):
    model = AttachmentTagging
    extra = 1


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'original_filename', 'file_type', 'file_size_human',
        'uploaded_by', 'content_type', 'object_id', 'is_public', 'created_at'
    ]
    list_filter = [
        'file_type', 'is_public', 'is_featured', 'content_type', 'created_at'
    ]
    search_fields = ['title', 'description', 'original_filename']
    readonly_fields = [
        'file_size', 'file_type', 'mime_type', 'file_size_human',
        'file_extension', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('File Information', {
            'fields': ('file', 'original_filename', 'file_size', 'file_size_human', 'file_type', 'mime_type')
        }),
        ('Metadata', {
            'fields': ('title', 'description', 'alt_text')
        }),
        ('Relationship', {
            'fields': ('content_type', 'object_id', 'uploaded_by')
        }),
        ('Flags', {
            'fields': ('is_public', 'is_featured')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [AttachmentTaggingInline]
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'uploaded_by', 'content_type'
        ).prefetch_related('taggings__tag')
