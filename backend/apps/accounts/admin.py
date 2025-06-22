from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'username', 'firebase_uid', 'first_name', 'last_name', 'is_staff', 'is_verified', 'created_at')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'is_verified', 'created_at')
    search_fields = ('email', 'username', 'firebase_uid', 'first_name', 'last_name')
    ordering = ('-created_at',)
    readonly_fields = ('firebase_uid', 'created_at', 'updated_at', 'last_login_firebase')
    
    fieldsets = (
        (None, {
            'fields': ('username', 'email', 'firebase_uid')
        }),
        ('Personal info', {
            'fields': ('first_name', 'last_name', 'profile_picture_url', 'bio', 'date_of_birth')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'is_verified', 'groups', 'user_permissions'),
        }),
        ('Important dates', {
            'fields': ('last_login', 'last_login_firebase', 'date_joined', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
