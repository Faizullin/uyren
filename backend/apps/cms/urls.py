"""
CMS URLs

Simplified URL routing for CMS using Post and Attachment models.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api.views import PostViewSet, AttachmentViewSet

app_name = 'cms'

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'api/v1/cms/posts', PostViewSet, basename='post')
router.register(r'api/v1/cms/attachments', AttachmentViewSet, basename='attachment')

urlpatterns = [
    # API routes
    path('', include(router.urls)),
]
