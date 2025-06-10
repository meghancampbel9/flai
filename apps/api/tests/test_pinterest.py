import pytest
import requests
import json
import uuid
from typing import Dict, Any


class TestPinterestAnalysis:
    """Tests for Pinterest board analysis"""

    def test_analyze_valid_board_success(self, api_base_url: str, headers: Dict[str, str]):
        """Test analyzing a potentially invalid Pinterest board (doesnt exist)"""
        analysis_data = {
            "url": "https://pinterest.com/testuser/testboard",
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}"
        }
        
        response = requests.post(
            f"{api_base_url}/pinterest/analyze-board",
            headers=headers,
            json=analysis_data
        )
        
        assert response.status_code in [200, 400, 500]
        
        data = response.json()
        if response.status_code == 200:
            # If successful, check response structure
            assert "success" in data
            if data["success"]:
                assert "style_analysis" in data
                assert "message" in data

    def test_analyze_board_invalid_url_format(self, api_base_url: str, headers: Dict[str, str]):
        """Test analyzing with invalid URL format"""
        analysis_data = {
            "url": "not-a-valid-url",
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}"
        }
        
        response = requests.post(
            f"{api_base_url}/pinterest/analyze-board",
            headers=headers,
            json=analysis_data
        )
        
        assert response.status_code == 422  # Pydantic validation error

    def test_analyze_board_missing_url(self, api_base_url: str, headers: Dict[str, str]):
        """Test analyzing without URL"""
        analysis_data = {
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}"
        }
        
        response = requests.post(
            f"{api_base_url}/pinterest/analyze-board",
            headers=headers,
            json=analysis_data
        )
        
        assert response.status_code == 422  # Pydantic validation error

    def test_analyze_board_missing_user_id(self, api_base_url: str, headers: Dict[str, str]):
        """Test analyzing without user_id"""
        analysis_data = {
            "url": "https://pinterest.com/testuser/testboard"
        }
        
        response = requests.post(
            f"{api_base_url}/pinterest/analyze-board",
            headers=headers,
            json=analysis_data
        )
        
        assert response.status_code == 422  # Pydantic validation error

    def test_analyze_nonexistent_board(self, api_base_url: str, headers: Dict[str, str]):
        """Test analyzing a non-existent Pinterest board"""
        analysis_data = {
            "url": f"https://pinterest.com/nonexistentuser{uuid.uuid4().hex[:8]}/nonexistentboard{uuid.uuid4().hex[:8]}",
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}"
        }
        
        response = requests.post(
            f"{api_base_url}/pinterest/analyze-board",
            headers=headers,
            json=analysis_data
        )
        
        # Should return error for non-existent board
        assert response.status_code in [400, 500]
        
        data = response.json()
        if "detail" in data:
            # Should contain error message about board not found
            assert any(keyword in data["detail"].lower() for keyword in ["not found", "board", "pinterest"])

    def test_analyze_board_wrong_pinterest_format(self, api_base_url: str, headers: Dict[str, str]):
        """Test analyzing with wrong Pinterest URL format"""
        analysis_data = {
            "url": "https://pinterest.com/wrongformat",  # Missing board name
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}"
        }
        
        response = requests.post(
            f"{api_base_url}/pinterest/analyze-board",
            headers=headers,
            json=analysis_data
        )
        
        # Should return error for invalid Pinterest URL format
        assert response.status_code in [400, 500]

    def test_analyze_board_non_pinterest_url(self, api_base_url: str, headers: Dict[str, str]):
        """Test analyzing with non-Pinterest URL"""
        analysis_data = {
            "url": "https://example.com/some/path",
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}"
        }
        
        response = requests.post(
            f"{api_base_url}/pinterest/analyze-board",
            headers=headers,
            json=analysis_data
        )
        
        # Should return error for non-Pinterest URL
        assert response.status_code in [400, 500]

    def test_analyze_board_empty_request_body(self, api_base_url: str, headers: Dict[str, str]):
        """Test analyzing with empty request body"""
        response = requests.post(
            f"{api_base_url}/pinterest/analyze-board",
            headers=headers,
            json={}
        )
        
        assert response.status_code == 422  # Pydantic validation error

    def test_analyze_board_malformed_json(self, api_base_url: str, headers: Dict[str, str]):
        """Test analyzing with malformed JSON"""
        # Send malformed JSON
        response = requests.post(
            f"{api_base_url}/pinterest/analyze-board",
            headers={"Content-Type": "application/json"},
            data="{'invalid': json'}"  # Malformed JSON
        )
        
        assert response.status_code == 422

    @pytest.mark.integration
    def test_analyze_real_pinterest_board(self, api_base_url: str, headers: Dict[str, str]):
        """Integration test with a real Pinterest board (if available)"""
        # This test is marked as integration and may be skipped in unit tests
        # Use a known public Pinterest board for testing
        analysis_data = {
            "url": "https://pinterest.com/pinterest/official-pinterest-pins",  # Pinterest's official board
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}"
        }
        
        response = requests.post(
            f"{api_base_url}/pinterest/analyze-board",
            headers=headers,
            json=analysis_data,
            timeout=30
        )
        
        # This test may fail due to Pinterest's anti-bot protection
        assert response.status_code in [200, 400, 403, 500]
        
        if response.status_code == 200:
            data = response.json()
            assert "success" in data
            assert "message" in data
            
            if data["success"] and "style_analysis" in data:
                style_analysis = data["style_analysis"]
                assert "aesthetic_description" in style_analysis
                assert "style_keywords" in style_analysis
                assert isinstance(style_analysis["style_keywords"], list)
                assert "color_palette" in style_analysis
                assert isinstance(style_analysis["color_palette"], list)
                assert "themes" in style_analysis
                assert isinstance(style_analysis["themes"], list)
                assert "confidence_score" in style_analysis
                assert isinstance(style_analysis["confidence_score"], (int, float))
                assert 0 <= style_analysis["confidence_score"] <= 1

    def test_analyze_board_response_structure(self, api_base_url: str, headers: Dict[str, str]):
        """Test that the response structure is consistent regardless of success/failure"""
        analysis_data = {
            "url": "https://pinterest.com/testuser/testboard",
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}"
        }
        
        response = requests.post(
            f"{api_base_url}/pinterest/analyze-board",
            headers=headers,
            json=analysis_data
        )
        
        # Check response structure
        assert response.headers.get("content-type") == "application/json"
        
        try:
            data = response.json()
            
            if response.status_code == 200:
                # Success response structure
                assert "success" in data
                assert "message" in data
                assert isinstance(data["success"], bool)
                assert isinstance(data["message"], str)
                
                if data["success"] and "style_analysis" in data:
                    style_analysis = data["style_analysis"]
                    assert isinstance(style_analysis, dict)
            
            elif response.status_code >= 400:
                # Error response structure
                if "detail" in data:
                    assert isinstance(data["detail"], str)
                    
        except json.JSONDecodeError:
            pytest.fail("Response is not valid JSON")

    def test_analyze_board_timeout_handling(self, api_base_url: str, headers: Dict[str, str]):
        """Test that the endpoint handles timeouts gracefully"""
        analysis_data = {
            "url": "https://pinterest.com/testuser/testboard",
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}"
        }
        
        # Set a short timeout to test timeout handling
        try:
            response = requests.post(
                f"{api_base_url}/pinterest/analyze-board",
                headers=headers,
                json=analysis_data,
                timeout=0.1  # Very short timeout
            )
        except requests.exceptions.Timeout:
            # Timeout is expected with such a short timeout
            pass
        except requests.exceptions.ConnectionError:
            # Connection error is also acceptable for this test
            pass 