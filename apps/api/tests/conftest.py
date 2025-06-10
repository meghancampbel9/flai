import pytest
import requests
import os
from typing import Generator

# Test configuration
BASE_URL = "http://localhost:8000"
API_BASE_URL = f"{BASE_URL}/api/v1"

@pytest.fixture(scope="session")
def api_base_url() -> str:
    """Base URL for API endpoints"""
    return API_BASE_URL

@pytest.fixture(scope="session")
def base_url() -> str:
    """Base URL for the application"""
    return BASE_URL

@pytest.fixture
def test_user_id() -> str:
    """Test user ID for dev mode"""
    return "test-user-id"

@pytest.fixture
def test_username() -> str:
    """Test username"""
    return "testuser123"

@pytest.fixture
def test_pinterest_url() -> str:
    """Test Pinterest URL"""
    return "https://pinterest.com/testuser/testboard"

@pytest.fixture
def cleanup_test_user(api_base_url: str, test_user_id: str) -> Generator[None, None, None]:
    """Cleanup test user after test completion"""
    yield
    # Cleanup code should go here
    pass

@pytest.fixture
def headers() -> dict:
    """Common headers for API requests"""
    return {
        "Content-Type": "application/json",
        "Accept": "application/json"
    } 