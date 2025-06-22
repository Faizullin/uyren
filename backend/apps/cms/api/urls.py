"""
CMS API URLs

Simplified URL routing for CMS API using Post and Attachment models.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, AttachmentViewSet

app_name = 'cms'

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='post')
router.register(r'attachments', AttachmentViewSet, basename='attachment')

urlpatterns = [
    # API v1 routes
    path('v1/', include(router.urls)),
]
