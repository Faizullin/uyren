from rest_framework import permissions
from rest_framework.permissions import BasePermission
from django.contrib.auth import get_user_model

User = get_user_model()


class IsAuthenticated(permissions.IsAuthenticated):
    """
    Custom IsAuthenticated permission that provides better error messages
    """
    message = "Authentication credentials were not provided or are invalid."


class IsOwnerOrReadOnly(BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    Assumes the model instance has an `author` or `user` attribute.
    """
    message = "You do not have permission to modify this resource."

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Write permissions are only allowed to the owner of the object
        owner_field = getattr(obj, 'author', None) or getattr(obj, 'user', None) or getattr(obj, 'uploaded_by', None)
        return owner_field and owner_field == request.user


class IsOwner(BasePermission):
    """
    Custom permission to only allow owners of an object to access it.
    """
    message = "You do not have permission to access this resource."

    def has_object_permission(self, request, view, obj):
        owner_field = getattr(obj, 'author', None) or getattr(obj, 'user', None) or getattr(obj, 'uploaded_by', None)
        return owner_field and owner_field == request.user


class IsAdminOrReadOnly(BasePermission):
    """
    Custom permission to allow read access to authenticated users,
    but only allow write access to admin users.
    """
    message = "Only admin users can modify this resource."

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.is_staff


class IsVerifiedUser(BasePermission):
    """
    Custom permission to only allow verified users to access the resource.
    """
    message = "Only verified users can access this resource."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            hasattr(request.user, 'is_verified') and 
            request.user.is_verified
        )


class CanPublishPost(BasePermission):
    """
    Custom permission for publishing posts.
    Only verified users or staff can publish posts.
    """
    message = "You do not have permission to publish posts."

    def has_permission(self, request, view):
        if request.method not in ['POST', 'PUT', 'PATCH']:
            return True
            
        # Check if user is trying to publish
        status = request.data.get('status')
        if status == 'published':
            return (
                request.user.is_authenticated and 
                (request.user.is_staff or 
                 (hasattr(request.user, 'is_verified') and request.user.is_verified))
            )
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # For updating existing posts
        status = request.data.get('status', obj.status)
        if status == 'published' and obj.status != 'published':
            return (
                request.user.is_authenticated and 
                (request.user.is_staff or 
                 (hasattr(request.user, 'is_verified') and request.user.is_verified))
            )
        return True


class IsAuthorOrReadOnly(BasePermission):
    """
    Custom permission for post authors.
    Authors can edit their own posts, others can only read published posts.
    """
    message = "You can only edit your own posts."

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Read permissions for published posts
        if request.method in permissions.SAFE_METHODS:
            if hasattr(obj, 'status'):
                return obj.status == 'published' or obj.author == request.user
            return True
        
        # Write permissions only for post author
        return obj.author == request.user


class IsSelfOrReadOnly(BasePermission):
    """
    Custom permission for user profiles.
    Users can only edit their own profile.
    """
    message = "You can only edit your own profile."

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Write permissions only for the user themselves
        return obj == request.user


class CanAccessAttachment(BasePermission):
    """
    Custom permission for attachments.
    Users can access their own attachments and attachments of published content.
    """
    message = "You do not have permission to access this attachment."

    def has_object_permission(self, request, view, obj):
        # Owner can always access their attachments
        if hasattr(obj, 'uploaded_by') and obj.uploaded_by == request.user:
            return True
        
        # Check if attachment is linked to published content
        if hasattr(obj, 'content_object') and obj.content_object:
            content_obj = obj.content_object
            
            # If attached to a post, check if post is published
            if hasattr(content_obj, 'status'):
                return content_obj.status == 'published'
            
            # If attached to a user, allow access
            if isinstance(content_obj, User):
                return True
        
        # Default to deny access
        return False
