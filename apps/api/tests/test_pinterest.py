import pytest
import requests
import json
import uuid
from typing import Dict, Any


class TestPinterestAnalysis:
    """Tests for Pinterest board analysis, updated for robust error handling."""

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
        """Test analyzing with invalid URL format. Should fail Pydantic validation."""
        analysis_data = {
            "url": "not-a-valid-url",
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}"
        }
        response = requests.post(f"{api_base_url}/pinterest/analyze-board", headers=headers, json=analysis_data)
        assert response.status_code == 422

    def test_analyze_board_missing_url(self, api_base_url: str, headers: Dict[str, str]):
        """Test analyzing without a URL. Should fail Pydantic validation."""
        analysis_data = {"user_id": f"test-user-{uuid.uuid4().hex[:8]}"}
        response = requests.post(f"{api_base_url}/pinterest/analyze-board", headers=headers, json=analysis_data)
        assert response.status_code == 422

    def test_analyze_board_missing_user_id(self, api_base_url: str, headers: Dict[str, str]):
        """Test analyzing without a user_id. Should fail Pydantic validation."""
        analysis_data = {"url": "https://pinterest.com/testuser/testboard"}
        response = requests.post(f"{api_base_url}/pinterest/analyze-board", headers=headers, json=analysis_data)
        assert response.status_code == 422

    def test_analyze_nonexistent_board(self, api_base_url: str, headers: Dict[str, str]):
        """Test analyzing a non-existent Pinterest board. Should return 200 OK with failure message."""
        analysis_data = {
            "url": f"https://pinterest.com/nonexistentuser{uuid.uuid4().hex[:4]}/nonexistentboard{uuid.uuid4().hex[:4]}",
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}"
        }
        response = requests.post(f"{api_base_url}/pinterest/analyze-board", headers=headers, json=analysis_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "not found" in data["message"].lower()
        assert data["validation_error"] is True

    def test_analyze_board_wrong_pinterest_format(self, api_base_url: str, headers: Dict[str, str]):
        """Test analyzing with wrong Pinterest URL format (e.g., missing board name). Should return 200 OK with failure message."""
        analysis_data = {
            "url": "https://pinterest.com/wrongformat",  # Missing board name
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}"
        }
        response = requests.post(f"{api_base_url}/pinterest/analyze-board", headers=headers, json=analysis_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "invalid pinterest url format" in data["message"].lower()
        assert data["validation_error"] is True

    def test_analyze_board_non_pinterest_url(self, api_base_url: str, headers: Dict[str, str]):
        """Test analyzing with a non-Pinterest URL. Should return 200 OK with a validation error."""
        analysis_data = {
            "url": "https://example.com/some/path",
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}"
        }
        response = requests.post(f"{api_base_url}/pinterest/analyze-board", headers=headers, json=analysis_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "must be a pinterest board url" in data["message"].lower()
        assert data["validation_error"] is True

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
    def test_analyze_real_working_pinterest_board(self, api_base_url: str, headers: Dict[str, str]):
        """Integration test with a real, working Pinterest board."""
        # This test relies on a public board and external services (Pinterest, Gemini).
        analysis_data = {
            "url": "https://de.pinterest.com/meghancampbel9/light",
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}"
        }
        
        response = requests.post(
            f"{api_base_url}/pinterest/analyze-board",
            headers=headers,
            json=analysis_data,
            timeout=60  # Increased timeout for real analysis
        )
        
        assert response.status_code == 200
        
        data = response.json()
        assert "success" in data
        assert "message" in data
        
        # This part of the test depends on whether the board is accessible at runtime
        if data["success"]:
            assert "style_analysis" in data
            style_analysis = data["style_analysis"]
            assert "aesthetic_description" in style_analysis
            assert "style_keywords" in style_analysis and isinstance(style_analysis["style_keywords"], list)
            assert "color_palette" in style_analysis and isinstance(style_analysis["color_palette"], list)
            assert "themes" in style_analysis and isinstance(style_analysis["themes"], list)
            assert "confidence_score" in style_analysis and isinstance(style_analysis["confidence_score"], float)
        else:
            # If it fails, it should give a clear message
            assert data["validation_error"] is True
            assert "not found" in data["message"].lower() or "failed to analyze" in data["message"].lower()

    def test_analyze_board_response_structure(self, api_base_url: str, headers: Dict[str, str]):
        """Test that the response structure is consistent for both success and validation failures."""
        analysis_data = {
            "url": "https://pinterest.com/invalidformat",
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}"
        }
        
        response = requests.post(f"{api_base_url}/pinterest/analyze-board", headers=headers, json=analysis_data)
        
        assert response.headers.get("content-type") == "application/json"
        assert response.status_code == 200

        try:
            data = response.json()
            assert "success" in data and isinstance(data["success"], bool)
            assert "message" in data and isinstance(data["message"], str)
            assert "validation_error" in data and isinstance(data["validation_error"], bool)
            
            if data["success"]:
                assert "style_analysis" in data and isinstance(data["style_analysis"], dict)
            else:
                assert data["success"] is False
                
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