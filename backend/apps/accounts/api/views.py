from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from ..models import User
from .serializers import UserSerializer, FirebaseAuthSerializer, UserUpdateSerializer
from apps.core.permissions import IsAuthenticated, IsSelfOrReadOnly, IsAdminOrReadOnly


class UserViewSet(ModelViewSet):
    """
    ViewSet for managing user accounts
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'username', 'email']
    ordering = ['-created_at']
    filterset_fields = ['is_verified', 'is_active']

    def get_permissions(self):
        """
        Instantiate and return the list of permissions required for this view.
        """
        if self.action == 'list':
            permission_classes = [IsAdminOrReadOnly]
        elif self.action in ['retrieve', 'update', 'partial_update']:
            permission_classes = [IsSelfOrReadOnly]
        elif self.action == 'destroy':
            permission_classes = [IsAuthenticated]  # Users can delete their own account
        else:
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Filter queryset based on user permissions
        """
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(is_active=True)

    def get_serializer_class(self):
        """
        Return the appropriate serializer based on action
        """
        if self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Get current user's profile
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['put', 'patch'], permission_classes=[IsAuthenticated])
    def update_profile(self, request):
        """
        Update current user's profile
        """
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        """
        Soft delete user account (deactivate)
        """
        instance = self.get_object()
        if instance != request.user and not request.user.is_staff:
            return Response(
                {'error': 'You can only delete your own account.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Soft delete by deactivating the account
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def auth(request):
    """
    Simple Firebase authentication endpoint that returns JWT access token
    
    POST /api/v1/accounts/auth/
    {
        "firebase_token": "firebase_id_token_here"
    }
    
    Returns:
    {
        "access_token": "jwt_access_token",
        "user": {...user_data...},
        "is_new_user": false,
        "message": "Authentication successful"
    }
    """
    from ..auth_service import SimpleAuthService
    from .serializers import SimpleAuthResponseSerializer
    
    serializer = FirebaseAuthSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    firebase_token = serializer.validated_data['firebase_token']
    
    # Authenticate with Firebase
    auth_service = SimpleAuthService()
    result = auth_service.authenticate_with_firebase(firebase_token)
    
    if not result.get('success', False):
        return Response(
            {'error': result.get('error', 'Authentication failed')}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Prepare response data
    response_data = {
        'access_token': result['access_token'],
        'user': UserSerializer(result['user']).data,
        'is_new_user': result['is_new_user'],
        'message': result['message']
    }
    
    return Response(response_data, status=status.HTTP_200_OK)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Logout user (mainly for token invalidation)
    """
    # TODO: Implement token invalidation if using JWT
    return Response({'message': 'Successfully logged out'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_stats(request):
    """
    Get user statistics
    """
    user = request.user
    stats = {
        'posts_count': getattr(user, 'posts', None).count() if hasattr(user, 'posts') else 0,
        'is_verified': user.is_verified,
        'member_since': user.created_at,
        'last_login': user.last_login_firebase or user.last_login,
    }
    return Response(stats)
