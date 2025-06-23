"""
Unit tests for CodeExecutionService
"""

import pytest
import json
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime

from app.services.code_execution import CodeExecutionService, code_execution_service
from tests.conftest import (
    MOCK_API_RESPONSES, SAMPLE_CODE, TEST_USER_ID, TEST_EXECUTION_ID,
    AsyncContextManagerMock, MockResponse, create_mock_execution_data
)


class TestCodeExecutionService:
    """Test cases for CodeExecutionService"""
    
    @pytest.fixture
    def service(self):
        """Create service instance for testing"""
        return CodeExecutionService()
    
    @pytest.mark.asyncio
    async def test_submit_code_execution_success(self, service, mock_redis_manager):
        """Test successful code submission"""
        # Mock Redis operations
        mock_redis_manager.set_execution_data.return_value = True
        
        # Mock the async execution method
        with patch.object(service, '_execute_code_async', new_callable=AsyncMock) as mock_execute:
            result = await service.submit_code_execution(
                code=SAMPLE_CODE["python"]["hello_world"],
                language="python",
                input_data="",
                user_id=TEST_USER_ID
            )
            
            # Verify execution ID is returned
            assert isinstance(result, str)
            assert len(result) > 0
            
            # Verify Redis was called to store execution data
            mock_redis_manager.set_execution_data.assert_called_once()
            
            # Verify async execution was called
            mock_execute.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_execute_code_async_success(self, service, mock_redis_manager, mock_httpx_client):
        """Test successful asynchronous code execution"""
        # Setup mocks
        mock_response = MockResponse(MOCK_API_RESPONSES["success"])
        mock_client_instance = MagicMock()
        mock_client_instance.post = AsyncMock(return_value=mock_response)
        mock_httpx_client.return_value = AsyncContextManagerMock(mock_client_instance)
        
        mock_redis_manager.update_execution_status.return_value = True
        
        # Execute the method
        await service._execute_code_async(
            TEST_EXECUTION_ID,
            SAMPLE_CODE["python"]["hello_world"],
            "python",
            ""
        )
        
        # Verify Redis status updates
        calls = mock_redis_manager.update_execution_status.call_args_list
        assert len(calls) >= 2  # At least "running" and "completed" status updates
        
        # Verify "running" status was set
        first_call = calls[0]
        assert first_call[0][1] == "running"
        
        # Verify "completed" status was set with results
        last_call = calls[-1]
        assert last_call[0][1] == "completed"
        assert "output" in last_call[1]
        assert "execution_time" in last_call[1]
    
    @pytest.mark.asyncio
    async def test_execute_code_async_error(self, service, mock_redis_manager, mock_httpx_client):
        """Test code execution with compilation/runtime error"""
        # Setup mocks for error response
        mock_response = MockResponse(MOCK_API_RESPONSES["error"])
        mock_client_instance = MagicMock()
        mock_client_instance.post = AsyncMock(return_value=mock_response)
        mock_httpx_client.return_value = AsyncContextManagerMock(mock_client_instance)
        
        mock_redis_manager.update_execution_status.return_value = True
        
        # Execute the method
        await service._execute_code_async(
            TEST_EXECUTION_ID,
            SAMPLE_CODE["python"]["error"],
            "python",
            ""
        )
        
        # Verify error status was set
        calls = mock_redis_manager.update_execution_status.call_args_list
        last_call = calls[-1]
        assert last_call[0][1] == "completed"
        assert "error_output" in last_call[1]
    
    @pytest.mark.asyncio
    async def test_execute_code_async_api_failure(self, service, mock_redis_manager, mock_httpx_client):
        """Test handling of API failures"""
        # Setup mocks for API failure
        mock_client_instance = MagicMock()
        mock_client_instance.post = AsyncMock(side_effect=Exception("API Error"))
        mock_httpx_client.return_value = AsyncContextManagerMock(mock_client_instance)
        
        mock_redis_manager.update_execution_status.return_value = True
        
        # Execute the method
        await service._execute_code_async(
            TEST_EXECUTION_ID,
            SAMPLE_CODE["python"]["hello_world"],
            "python",
            ""
        )
        
        # Verify error status was set
        calls = mock_redis_manager.update_execution_status.call_args_list
        error_call = next((call for call in calls if call[0][1] == "error"), None)
        assert error_call is not None
        assert "error_output" in error_call[1]
    
    def test_get_compiler_name(self, service):
        """Test language to compiler mapping"""
        test_cases = [
            ("python", "python3"),
            ("javascript", "nodejs"),
            ("java", "java"),
            ("cpp", "gcc"),
            ("c", "gcc"),
            ("csharp", "csharp"),
            ("go", "go"),
            ("rust", "rust"),
            ("unknown", "python3"),  # Default case
        ]
        
        for language, expected_compiler in test_cases:
            result = service._get_compiler_name(language)
            assert result == expected_compiler
    
    def test_parse_execution_result(self, service):
        """Test parsing of execution results from API"""
        # Test successful result
        api_result = MOCK_API_RESPONSES["success"]
        parsed = service._parse_execution_result(api_result)
        
        assert parsed["output"] == api_result["output"]
        assert parsed["error"] == api_result["error"]
        assert parsed["execution_time"] == api_result["cpuTime"]
        assert parsed["memory_usage"] == api_result["memory"]
        
        # Test error result
        api_result = MOCK_API_RESPONSES["error"]
        parsed = service._parse_execution_result(api_result)
        
        assert parsed["output"] == ""
        assert parsed["error"] == api_result["error"]
    
    @pytest.mark.asyncio
    async def test_get_execution_status(self, service, mock_redis_manager):
        """Test retrieving execution status"""
        # Mock successful retrieval
        mock_data = create_mock_execution_data(status="completed")
        mock_redis_manager.get_execution_data.return_value = mock_data
        
        result = await service.get_execution_status(TEST_EXECUTION_ID)
        
        assert result == mock_data
        mock_redis_manager.get_execution_data.assert_called_once_with(TEST_EXECUTION_ID)
        
        # Test non-existent execution
        mock_redis_manager.get_execution_data.return_value = None
        result = await service.get_execution_status("non_existent")
        
        assert result is None


class TestCodeExecutionServiceIntegration:
    """Integration tests for code execution service"""
    
    @pytest.mark.asyncio
    async def test_full_execution_flow_success(self, mock_redis_manager, mock_httpx_client):
        """Test complete execution flow from submission to completion"""
        # Setup mocks
        mock_response = MockResponse(MOCK_API_RESPONSES["success"])
        mock_client_instance = MagicMock()
        mock_client_instance.post = AsyncMock(return_value=mock_response)
        mock_httpx_client.return_value = AsyncContextManagerMock(mock_client_instance)
        
        mock_redis_manager.set_execution_data.return_value = True
        mock_redis_manager.update_execution_status.return_value = True
        
        # Submit code execution
        execution_id = await code_execution_service.submit_code_execution(
            code=SAMPLE_CODE["python"]["hello_world"],
            language="python",
            input_data="",
            user_id=TEST_USER_ID
        )
        
        assert isinstance(execution_id, str)
        
        # Verify the execution data was stored
        mock_redis_manager.set_execution_data.assert_called()
        
        # Verify status updates were made
        assert mock_redis_manager.update_execution_status.call_count >= 2
    
    @pytest.mark.asyncio
    @pytest.mark.parametrize("language,code", [
        ("python", SAMPLE_CODE["python"]["hello_world"]),
        ("javascript", SAMPLE_CODE["javascript"]["hello_world"]),
        ("java", SAMPLE_CODE["java"]["hello_world"]),
        ("cpp", SAMPLE_CODE["cpp"]["hello_world"]),
    ])
    async def test_multiple_languages(self, language, code, mock_redis_manager, mock_httpx_client):
        """Test code execution with different programming languages"""
        # Setup mocks
        mock_response = MockResponse(MOCK_API_RESPONSES["success"])
        mock_client_instance = MagicMock()
        mock_client_instance.post = AsyncMock(return_value=mock_response)
        mock_httpx_client.return_value = AsyncContextManagerMock(mock_client_instance)
        
        mock_redis_manager.set_execution_data.return_value = True
        mock_redis_manager.update_execution_status.return_value = True
        
        # Execute code
        execution_id = await code_execution_service.submit_code_execution(
            code=code,
            language=language,
            input_data="",
            user_id=TEST_USER_ID
        )
        
        assert isinstance(execution_id, str)
        
        # Verify the correct compiler was used
        call_args = mock_client_instance.post.call_args
        request_body = json.loads(call_args[1]['data'])
        expected_compiler = code_execution_service._get_compiler_name(language)
        assert request_body['compiler'] == expected_compiler
    
    @pytest.mark.asyncio
    async def test_execution_with_input_data(self, mock_redis_manager, mock_httpx_client):
        """Test code execution with input data"""
        # Setup mocks
        mock_response = MockResponse({
            "output": "Hello, Test User!\n",
            "error": "",
            "cpuTime": "0.02",
            "memory": "3456"
        })
        mock_client_instance = MagicMock()
        mock_client_instance.post = AsyncMock(return_value=mock_response)
        mock_httpx_client.return_value = AsyncContextManagerMock(mock_client_instance)
        
        mock_redis_manager.set_execution_data.return_value = True
        mock_redis_manager.update_execution_status.return_value = True
        
        # Execute code with input
        execution_id = await code_execution_service.submit_code_execution(
            code=SAMPLE_CODE["python"]["with_input"],
            language="python",
            input_data="Test User",
            user_id=TEST_USER_ID
        )
        
        assert isinstance(execution_id, str)
        
        # Verify input data was passed correctly
        call_args = mock_client_instance.post.call_args
        request_body = json.loads(call_args[1]['data'])
        assert request_body['input'] == "Test User"
