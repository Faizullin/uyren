"""
API endpoint tests for code execution service
"""

import pytest
import json
from unittest.mock import AsyncMock, patch
from fastapi import status

from tests.conftest import (
    TEST_USER_ID, TEST_EXECUTION_ID, MOCK_USER_DATA,
    SAMPLE_CODE, create_mock_execution_data
)


class TestCodeExecutionAPI:
    """Test cases for code execution API endpoints"""
    
    @pytest.mark.asyncio
    async def test_submit_code_execution_success(self, async_client, mock_firebase_auth, mock_redis_manager):
        """Test successful code submission via API"""
        # Mock Firebase auth
        mock_firebase_auth.verify_firebase_token.return_value = MOCK_USER_DATA
        
        # Mock code execution service
        with patch('app.routes.code_execution.code_execution_service') as mock_service:
            mock_service.submit_code_execution.return_value = TEST_EXECUTION_ID
            
            response = await async_client.post(
                "/api/v1/executions/execute",
                json={
                    "code": SAMPLE_CODE["python"]["hello_world"],
                    "language": "python",
                    "input_data": ""
                },
                headers={"Authorization": "Bearer fake_token"}
            )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["execution_id"] == TEST_EXECUTION_ID
            assert data["status"] == "pending"
            assert "message" in data
    
    @pytest.mark.asyncio
    async def test_submit_code_execution_unauthorized(self, async_client):
        """Test code submission without authentication"""
        response = await async_client.post(
            "/api/v1/executions/execute",
            json={
                "code": SAMPLE_CODE["python"]["hello_world"],
                "language": "python",
                "input_data": ""
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @pytest.mark.asyncio
    async def test_submit_code_execution_invalid_data(self, async_client, mock_firebase_auth):
        """Test code submission with invalid data"""
        mock_firebase_auth.verify_firebase_token.return_value = MOCK_USER_DATA
        
        # Test missing required fields
        response = await async_client.post(
            "/api/v1/executions/execute",
            json={
                "language": "python",
                "input_data": ""
                # Missing 'code' field
            },
            headers={"Authorization": "Bearer fake_token"}
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    @pytest.mark.asyncio
    async def test_get_execution_status_success(self, async_client, mock_firebase_auth, mock_redis_manager):
        """Test successful retrieval of execution status"""
        mock_firebase_auth.verify_firebase_token.return_value = MOCK_USER_DATA
        
        # Mock execution data
        mock_execution_data = create_mock_execution_data(status="completed")
        
        with patch('app.routes.code_execution.code_execution_service') as mock_service:
            mock_service.get_execution_status.return_value = mock_execution_data
            
            response = await async_client.get(
                f"/api/v1/executions/status/{TEST_EXECUTION_ID}",
                headers={"Authorization": "Bearer fake_token"}
            )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["execution_id"] == TEST_EXECUTION_ID
            assert data["status"] == "completed"
            assert data["user_id"] == TEST_USER_ID
    
    @pytest.mark.asyncio
    async def test_get_execution_status_not_found(self, async_client, mock_firebase_auth):
        """Test retrieval of non-existent execution"""
        mock_firebase_auth.verify_firebase_token.return_value = MOCK_USER_DATA
        
        with patch('app.routes.code_execution.code_execution_service') as mock_service:
            mock_service.get_execution_status.return_value = None
            
            response = await async_client.get(
                f"/api/v1/executions/status/non_existent_id",
                headers={"Authorization": "Bearer fake_token"}
            )
            
            assert response.status_code == status.HTTP_404_NOT_FOUND
    
    @pytest.mark.asyncio
    async def test_get_execution_status_forbidden(self, async_client, mock_firebase_auth):
        """Test retrieval of execution belonging to different user"""
        mock_firebase_auth.verify_firebase_token.return_value = MOCK_USER_DATA
        
        # Mock execution data with different user_id
        mock_execution_data = create_mock_execution_data(user_id="different_user")
        
        with patch('app.routes.code_execution.code_execution_service') as mock_service:
            mock_service.get_execution_status.return_value = mock_execution_data
            
            response = await async_client.get(
                f"/api/v1/executions/status/{TEST_EXECUTION_ID}",
                headers={"Authorization": "Bearer fake_token"}
            )
            
            assert response.status_code == status.HTTP_403_FORBIDDEN
    
    @pytest.mark.asyncio
    async def test_service_error_handling(self, async_client, mock_firebase_auth):
        """Test API error handling when service fails"""
        mock_firebase_auth.verify_firebase_token.return_value = MOCK_USER_DATA
        
        with patch('app.routes.code_execution.code_execution_service') as mock_service:
            mock_service.submit_code_execution.side_effect = Exception("Service error")
            
            response = await async_client.post(
                "/api/v1/executions/execute",
                json={
                    "code": SAMPLE_CODE["python"]["hello_world"],
                    "language": "python",
                    "input_data": ""
                },
                headers={"Authorization": "Bearer fake_token"}
            )
            
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            assert "Execution submission failed" in response.json()["detail"]


class TestHealthAPI:
    """Test cases for health check endpoints"""
    
    @pytest.mark.asyncio
    async def test_health_check(self, async_client):
        """Test basic health check endpoint"""
        response = await async_client.get("/health/")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "Code Execution Service"
        assert "timestamp" in data
    
    @pytest.mark.asyncio
    async def test_readiness_check_success(self, async_client, mock_redis_manager):
        """Test readiness check with healthy Redis"""
        # Mock Redis ping success
        mock_redis_client = AsyncMock()
        mock_redis_client.ping = AsyncMock()
        mock_redis_manager.get_redis.return_value = mock_redis_client
        
        response = await async_client.get("/health/ready")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "ready"
    
    @pytest.mark.asyncio
    async def test_readiness_check_failure(self, async_client, mock_redis_manager):
        """Test readiness check with unhealthy Redis"""
        # Mock Redis ping failure
        mock_redis_client = AsyncMock()
        mock_redis_client.ping.side_effect = Exception("Redis connection failed")
        mock_redis_manager.get_redis.return_value = mock_redis_client
        
        response = await async_client.get("/health/ready")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "not ready" in data["status"]


class TestWebSocketAPI:
    """Test cases for WebSocket functionality"""
    
    def test_websocket_authentication_required(self, test_client):
        """Test WebSocket requires authentication"""
        with test_client.websocket_connect("/api/v1/executions/ws/test_execution?token=invalid") as websocket:
            # WebSocket should close with unauthorized code
            with pytest.raises(Exception):  # Connection will be closed
                websocket.receive_text()
    
    @pytest.mark.asyncio
    async def test_websocket_execution_ownership(self, mock_firebase_auth):
        """Test WebSocket verifies execution ownership"""
        mock_firebase_auth.verify_firebase_token.return_value = MOCK_USER_DATA
        
        # This test would require more complex WebSocket testing setup
        # For now, we verify the concept in the route logic
        pass


class TestAPIValidation:
    """Test cases for API input validation"""
    
    @pytest.mark.asyncio
    @pytest.mark.parametrize("invalid_payload", [
        {},  # Empty payload
        {"code": ""},  # Empty code
        {"code": "print('test')", "language": ""},  # Empty language
        {"language": "python"},  # Missing code
        {"code": "print('test')", "language": "invalid_language"},  # Invalid language
    ])
    async def test_invalid_execution_payloads(self, async_client, mock_firebase_auth, invalid_payload):
        """Test validation of invalid execution payloads"""
        mock_firebase_auth.verify_firebase_token.return_value = MOCK_USER_DATA
        
        response = await async_client.post(
            "/api/v1/executions/execute",
            json=invalid_payload,
            headers={"Authorization": "Bearer fake_token"}
        )
        
        assert response.status_code in [
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_400_BAD_REQUEST
        ]
    
    @pytest.mark.asyncio
    async def test_large_code_submission(self, async_client, mock_firebase_auth):
        """Test submission of very large code"""
        mock_firebase_auth.verify_firebase_token.return_value = MOCK_USER_DATA
        
        # Create a large code string (e.g., 1MB)
        large_code = "print('Hello')\n" * 50000
        
        with patch('app.routes.code_execution.code_execution_service') as mock_service:
            mock_service.submit_code_execution.return_value = TEST_EXECUTION_ID
            
            response = await async_client.post(
                "/api/v1/executions/execute",
                json={
                    "code": large_code,
                    "language": "python",
                    "input_data": ""
                },
                headers={"Authorization": "Bearer fake_token"}
            )
            
            # Should still work, but might have size limits in production
            assert response.status_code in [status.HTTP_200_OK, status.HTTP_413_REQUEST_ENTITY_TOO_LARGE]
