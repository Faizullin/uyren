from django.urls import path
from .api import views

app_name = 'core'

urlpatterns = [
    path('api/v1/health/', views.health_check, name='health_check'),
]
