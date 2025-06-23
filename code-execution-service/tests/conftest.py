"""
Test configuration and fixtures for code execution service
"""

import pytest
import asyncio
from httpx import AsyncClient
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch
from typing import Dict, Any

from app.main import app
from app.config import settings


# Test configuration
TEST_USER_ID = "test_user_123"
TEST_EXECUTION_ID = "test_exec_456"

# Mock user data for Firebase authentication
MOCK_USER_DATA = {
    "uid": TEST_USER_ID,
    "email": "test@example.com",
    "email_verified": True,
    "name": "Test User"
}

# Sample code snippets for testing different languages
SAMPLE_CODE = {
    "python": {
        "hello_world": 'print("Hello, World!")',
        "with_input": 'name = input("Enter your name: ")\nprint(f"Hello, {name}!")',
        "math": 'result = 2 + 2\nprint(f"2 + 2 = {result}")',
        "error": 'print(undefined_variable)',
        "infinite_loop": 'while True:\n    print("Infinite")',
    },
    "javascript": {
        "hello_world": 'console.log("Hello, World!");',
        "with_input": 'const readline = require("readline");\nconst rl = readline.createInterface({input: process.stdin, output: process.stdout});\nrl.question("Enter your name: ", (name) => {\n    console.log(`Hello, ${name}!`);\n    rl.close();\n});',
        "math": 'const result = 2 + 2;\nconsole.log(`2 + 2 = ${result}`);',
        "error": 'console.log(undefinedVariable);',
    },
    "java": {
        "hello_world": 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
        "math": 'public class Main {\n    public static void main(String[] args) {\n        int result = 2 + 2;\n        System.out.println("2 + 2 = " + result);\n    }\n}',
    },
    "cpp": {
        "hello_world": '#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}',
        "math": '#include <iostream>\nusing namespace std;\nint main() {\n    int result = 2 + 2;\n    cout << "2 + 2 = " << result << endl;\n    return 0;\n}',
    }
}

# Sample expected outputs
EXPECTED_OUTPUTS = {
    "hello_world": "Hello, World!",
    "math": "2 + 2 = 4",
    "with_input_output": "Hello, Test User!",
}

# Mock API responses from online compiler
MOCK_API_RESPONSES = {
    "success": {
        "output": "Hello, World!\n",
        "error": "",
        "cpuTime": "0.02",
        "memory": "3456"
    },
    "error": {
        "output": "",
        "error": "NameError: name 'undefined_variable' is not defined",
        "cpuTime": "0.01",
        "memory": "3200"
    },
    "timeout": {
        "output": "",
        "error": "Time limit exceeded",
        "cpuTime": "30.0",
        "memory": "4000"
    }
}


@pytest.fixture
def test_client():
    """Create test client for FastAPI app"""
    return TestClient(app)


@pytest.fixture
async def async_client():
    """Create async client for FastAPI app"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture
def mock_redis_manager():
    """Mock Redis manager for testing"""
    with patch('app.database.redis_manager') as mock:
        # Setup mock methods
        mock.set_execution_data = AsyncMock(return_value=True)
        mock.get_execution_data = AsyncMock(return_value=None)
        mock.update_execution_status = AsyncMock(return_value=True)
        mock.delete_execution_data = AsyncMock(return_value=True)
        mock.get_redis = AsyncMock()
        mock.close = AsyncMock()
        yield mock


@pytest.fixture
def mock_firebase_auth():
    """Mock Firebase authentication"""
    with patch('app.services.firebase_auth.firebase_auth_service') as mock:
        mock.verify_firebase_token = AsyncMock(return_value=MOCK_USER_DATA)
        yield mock


@pytest.fixture
def mock_httpx_client():
    """Mock httpx client for external API calls"""
    with patch('httpx.AsyncClient') as mock:
        yield mock


@pytest.fixture
def mock_successful_execution():
    """Mock successful code execution"""
    return {
        "execution_id": TEST_EXECUTION_ID,
        "user_id": TEST_USER_ID,
        "code": SAMPLE_CODE["python"]["hello_world"],
        "language": "python",
        "input_data": "",
        "status": "completed",
        "output": "Hello, World!\n",
        "error_output": "",
        "execution_time": "0.02",
        "memory_usage": "3456",
        "created_at": "2025-06-23T10:00:00",
        "updated_at": "2025-06-23T10:00:02",
        "completed_at": "2025-06-23T10:00:02"
    }


@pytest.fixture
def mock_error_execution():
    """Mock error code execution"""
    return {
        "execution_id": TEST_EXECUTION_ID,
        "user_id": TEST_USER_ID,
        "code": SAMPLE_CODE["python"]["error"],
        "language": "python",
        "input_data": "",
        "status": "error",
        "output": "",
        "error_output": "NameError: name 'undefined_variable' is not defined",
        "execution_time": "",
        "memory_usage": "",
        "created_at": "2025-06-23T10:00:00",
        "updated_at": "2025-06-23T10:00:01",
        "completed_at": "2025-06-23T10:00:01"
    }


class AsyncContextManagerMock:
    """Mock for async context manager"""
    def __init__(self, return_value):
        self.return_value = return_value
    
    async def __aenter__(self):
        return self.return_value
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass


class MockResponse:
    """Mock HTTP response"""
    def __init__(self, json_data, status_code=200):
        self.json_data = json_data
        self.status_code = status_code
    
    def json(self):
        return self.json_data
    
    def raise_for_status(self):
        if self.status_code >= 400:
            raise Exception(f"HTTP {self.status_code}")


# Test data generators
def generate_test_cases():
    """Generate test cases for different languages and scenarios"""
    test_cases = []
    
    for language, code_samples in SAMPLE_CODE.items():
        for scenario, code in code_samples.items():
            test_cases.append({
                "language": language,
                "scenario": scenario,
                "code": code,
                "input_data": "Test User" if "with_input" in scenario else "",
                "expected_success": scenario != "error" and scenario != "infinite_loop"
            })
    
    return test_cases


# Utility functions for tests
def create_mock_execution_data(
    execution_id: str = TEST_EXECUTION_ID,
    user_id: str = TEST_USER_ID,
    status: str = "pending",
    **kwargs
):
    """Create mock execution data"""
    return {
        "execution_id": execution_id,
        "user_id": user_id,
        "code": kwargs.get("code", SAMPLE_CODE["python"]["hello_world"]),
        "language": kwargs.get("language", "python"),
        "input_data": kwargs.get("input_data", ""),
        "status": status,
        "output": kwargs.get("output"),
        "error_output": kwargs.get("error_output"),
        "execution_time": kwargs.get("execution_time"),
        "memory_usage": kwargs.get("memory_usage"),
        "created_at": "2025-06-23T10:00:00",
        "updated_at": kwargs.get("updated_at"),
        "completed_at": kwargs.get("completed_at"),
        **kwargs
    }
