from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api import views

app_name = 'accounts'

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='users')

urlpatterns = [
    # Simple authentication endpoint (main)
    path('api/v1/auth/', views.auth, name='auth'),
    
    # Legacy endpoints for backward compatibility
    path('api/v1/auth/logout/', views.logout, name='logout'),
    
    # User management endpoints
    path('api/v1/users/stats/', views.user_stats, name='user_stats'),
    
    # Include router URLs
    path('api/v1/', include(router.urls)),
]
