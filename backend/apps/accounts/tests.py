from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch, MagicMock

User = get_user_model()


class UserModelTest(TestCase):
    def test_create_user(self):
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            firebase_uid='test_firebase_uid',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.firebase_uid, 'test_firebase_uid')
        self.assertEqual(user.full_name, 'Test User')


class FirebaseAuthTest(APITestCase):
    @patch('apps.accounts.firebase_service.FirebaseService.verify_firebase_token')
    @patch('apps.accounts.firebase_service.FirebaseService.get_user_by_uid')
    def test_firebase_auth_new_user(self, mock_get_user, mock_verify_token):
        # Mock Firebase responses
        mock_verify_token.return_value = {
            'uid': 'test_firebase_uid',
            'email': 'test@example.com'
        }
        
        mock_firebase_user = MagicMock()
        mock_firebase_user.email = 'test@example.com'
        mock_firebase_user.display_name = 'Test User'
        mock_firebase_user.photo_url = 'https://example.com/photo.jpg'
        mock_firebase_user.email_verified = True
        mock_get_user.return_value = mock_firebase_user
        
        data = {'firebase_token': 'valid_token'}
        response = self.client.post('/api/auth/firebase-auth/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('tokens' in response.data)
        self.assertTrue('user' in response.data)
        
        # Check if user was created
        user = User.objects.get(firebase_uid='test_firebase_uid')
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.first_name, 'Test')
        self.assertEqual(user.last_name, 'User')
        
    @patch('apps.accounts.firebase_service.FirebaseService.verify_firebase_token')
    def test_firebase_auth_invalid_token(self, mock_verify_token):
        mock_verify_token.return_value = None
        
        data = {'firebase_token': 'invalid_token'}
        response = self.client.post('/api/auth/firebase-auth/', data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
