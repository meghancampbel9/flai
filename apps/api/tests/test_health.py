import pytest
import requests


def test_health_endpoint(base_url: str):
    """Test the health check endpoint"""
    response = requests.get(f"{base_url}/health")
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


def test_health_endpoint_response_time(base_url: str):
    """Test that health endpoint responds quickly"""
    response = requests.get(f"{base_url}/health")
    
    # Health endpoint should respond within 1 second
    assert response.elapsed.total_seconds() < 1.0
    assert response.status_code == 200 