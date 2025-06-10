import pytest
import requests
import json
import uuid
from typing import Dict, Any


class TestUsernameCheck:
    """Tests for username availability checking"""

    def test_check_available_username(self, api_base_url: str, headers: Dict[str, str]):
        """Test checking an available username"""
        unique_username = f"available_user_{uuid.uuid4().hex[:8]}"
        
        response = requests.post(
            f"{api_base_url}/users/check-username/{unique_username}",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == unique_username
        assert data["available"] is True

    def test_check_taken_username(self, api_base_url: str, headers: Dict[str, str]):
        """Test checking a taken username (if any exist in DB)"""
        # First create a user
        username = f"taken_user_{uuid.uuid4().hex[:8]}"
        user_data = {
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}",
            "username": username,
            "display_name": username
        }
        
        # Create the user
        create_response = requests.post(
            f"{api_base_url}/users/profile",
            headers=headers,
            json=user_data
        )
        assert create_response.status_code == 200
        
        # Now check if username is available (should be false)
        response = requests.post(
            f"{api_base_url}/users/check-username/{username}",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == username
        assert data["available"] is False

    def test_check_username_case_insensitive(self, api_base_url: str, headers: Dict[str, str]):
        """Test that username checking is case insensitive"""
        username = f"CaseTest_{uuid.uuid4().hex[:8]}"
        user_data = {
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}",
            "username": username.lower(),  # Create with lowercase
            "display_name": username
        }
        
        # Create the user with lowercase
        create_response = requests.post(
            f"{api_base_url}/users/profile",
            headers=headers,
            json=user_data
        )
        assert create_response.status_code == 200
        
        # Check with uppercase - should be unavailable
        response = requests.post(
            f"{api_base_url}/users/check-username/{username.upper()}",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["available"] is False


class TestUserProfile:
    """Tests for user profile management"""

    def test_create_user_profile_success(self, api_base_url: str, headers: Dict[str, str]):
        """Test successful user profile creation"""
        user_data = {
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}",
            "username": f"newuser_{uuid.uuid4().hex[:8]}",
            "display_name": "Test User",
            "bio": "Test bio",
            "phone_number": "+1234567890"
        }
        
        response = requests.post(
            f"{api_base_url}/users/profile",
            headers=headers,
            json=user_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "User profile created successfully"
        assert "profile_id" in data
        assert data["profile_id"] is not None

    def test_create_user_profile_minimal_data(self, api_base_url: str, headers: Dict[str, str]):
        """Test user profile creation with minimal required data"""
        user_data = {
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}",
            "username": f"minimal_{uuid.uuid4().hex[:8]}"
        }
        
        response = requests.post(
            f"{api_base_url}/users/profile",
            headers=headers,
            json=user_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_create_duplicate_user_profile(self, api_base_url: str, headers: Dict[str, str]):
        """Test creating duplicate user profile should fail"""
        user_id = f"test-user-{uuid.uuid4().hex[:8]}"
        user_data = {
            "user_id": user_id,
            "username": f"duplicate_{uuid.uuid4().hex[:8]}"
        }
        
        # Create first profile
        response1 = requests.post(
            f"{api_base_url}/users/profile",
            headers=headers,
            json=user_data
        )
        assert response1.status_code == 200
        
        # Try to create duplicate
        response2 = requests.post(
            f"{api_base_url}/users/profile",
            headers=headers,
            json=user_data
        )
        assert response2.status_code == 400
        assert "already exists" in response2.json()["detail"]

    def test_create_duplicate_username(self, api_base_url: str, headers: Dict[str, str]):
        """Test creating profile with duplicate username should fail"""
        username = f"sameusername_{uuid.uuid4().hex[:8]}"
        
        user_data1 = {
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}",
            "username": username
        }
        user_data2 = {
            "user_id": f"test-user-{uuid.uuid4().hex[:8]}",
            "username": username
        }
        
        # Create first profile
        response1 = requests.post(
            f"{api_base_url}/users/profile",
            headers=headers,
            json=user_data1
        )
        assert response1.status_code == 200
        
        # Try to create with same username
        response2 = requests.post(
            f"{api_base_url}/users/profile",
            headers=headers,
            json=user_data2
        )
        assert response2.status_code == 400
        assert "already taken" in response2.json()["detail"]

    def test_get_user_profile_success(self, api_base_url: str, headers: Dict[str, str]):
        """Test getting user profile successfully"""
        # Create a user first
        user_id = f"test-user-{uuid.uuid4().hex[:8]}"
        username = f"getuser_{uuid.uuid4().hex[:8]}"
        user_data = {
            "user_id": user_id,
            "username": username,
            "display_name": "Get Test User",
            "bio": "Get test bio"
        }
        
        create_response = requests.post(
            f"{api_base_url}/users/profile",
            headers=headers,
            json=user_data
        )
        assert create_response.status_code == 200
        
        # Get the profile
        response = requests.get(
            f"{api_base_url}/users/profile/{user_id}",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == username
        assert data["display_name"] == "Get Test User"
        assert data["bio"] == "Get test bio"
        assert data["onboarding_completed"] is False

    def test_get_nonexistent_user_profile(self, api_base_url: str, headers: Dict[str, str]):
        """Test getting non-existent user profile"""
        fake_user_id = f"fake-user-{uuid.uuid4().hex[:8]}"
        
        response = requests.get(
            f"{api_base_url}/users/profile/{fake_user_id}",
            headers=headers
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]

    def test_update_user_profile_success(self, api_base_url: str, headers: Dict[str, str]):
        """Test updating user profile successfully"""
        # Create a user first
        user_id = f"test-user-{uuid.uuid4().hex[:8]}"
        user_data = {
            "user_id": user_id,
            "username": f"updateuser_{uuid.uuid4().hex[:8]}"
        }
        
        create_response = requests.post(
            f"{api_base_url}/users/profile",
            headers=headers,
            json=user_data
        )
        assert create_response.status_code == 200
        
        # Update the profile
        update_data = {
            "display_name": "Updated Name",
            "bio": "Updated bio",
            "avatar_url": "https://example.com/avatar.jpg"
        }
        
        response = requests.put(
            f"{api_base_url}/users/profile/{user_id}",
            headers=headers,
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "User profile updated successfully"
        
        # Verify the updates
        get_response = requests.get(
            f"{api_base_url}/users/profile/{user_id}",
            headers=headers
        )
        assert get_response.status_code == 200
        profile = get_response.json()
        assert profile["display_name"] == "Updated Name"
        assert profile["bio"] == "Updated bio"
        assert profile["avatar_url"] == "https://example.com/avatar.jpg"

    def test_update_nonexistent_user_profile(self, api_base_url: str, headers: Dict[str, str]):
        """Test updating non-existent user profile"""
        fake_user_id = f"fake-user-{uuid.uuid4().hex[:8]}"
        update_data = {"display_name": "Should fail"}
        
        response = requests.put(
            f"{api_base_url}/users/profile/{fake_user_id}",
            headers=headers,
            json=update_data
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]


class TestOnboarding:
    """Tests for onboarding completion"""

    def test_complete_onboarding_success(self, api_base_url: str, headers: Dict[str, str]):
        """Test completing onboarding successfully"""
        # Create a user first
        user_id = f"test-user-{uuid.uuid4().hex[:8]}"
        user_data = {
            "user_id": user_id,
            "username": f"onboarduser_{uuid.uuid4().hex[:8]}"
        }
        
        create_response = requests.post(
            f"{api_base_url}/users/profile",
            headers=headers,
            json=user_data
        )
        assert create_response.status_code == 200
        
        # Complete onboarding
        onboarding_data = {
            "pinterest_board_url": "https://pinterest.com/user/board"
        }
        
        response = requests.post(
            f"{api_base_url}/users/profile/{user_id}/complete-onboarding",
            headers=headers,
            json=onboarding_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "Onboarding completed successfully"
        
        # Verify onboarding status
        get_response = requests.get(
            f"{api_base_url}/users/profile/{user_id}",
            headers=headers
        )
        profile = get_response.json()
        assert profile["onboarding_completed"] is True
        assert profile["pinterest_board_analyzed"] == "https://pinterest.com/user/board"

    def test_complete_onboarding_without_pinterest_url(self, api_base_url: str, headers: Dict[str, str]):
        """Test completing onboarding without Pinterest URL"""
        # Create a user first
        user_id = f"test-user-{uuid.uuid4().hex[:8]}"
        user_data = {
            "user_id": user_id,
            "username": f"onboarduser2_{uuid.uuid4().hex[:8]}"
        }
        
        create_response = requests.post(
            f"{api_base_url}/users/profile",
            headers=headers,
            json=user_data
        )
        assert create_response.status_code == 200
        
        # Complete onboarding without Pinterest URL
        response = requests.post(
            f"{api_base_url}/users/profile/{user_id}/complete-onboarding",
            headers=headers,
            json={}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_complete_onboarding_nonexistent_user(self, api_base_url: str, headers: Dict[str, str]):
        """Test completing onboarding for non-existent user"""
        fake_user_id = f"fake-user-{uuid.uuid4().hex[:8]}"
        
        response = requests.post(
            f"{api_base_url}/users/profile/{fake_user_id}/complete-onboarding",
            headers=headers,
            json={}
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]


class TestStylePreferences:
    """Tests for style preferences"""

    def test_get_style_preferences_empty(self, api_base_url: str, headers: Dict[str, str]):
        """Test getting style preferences for user with no preferences"""
        # Create a user first
        user_id = f"test-user-{uuid.uuid4().hex[:8]}"
        user_data = {
            "user_id": user_id,
            "username": f"styleuser_{uuid.uuid4().hex[:8]}"
        }
        
        create_response = requests.post(
            f"{api_base_url}/users/profile",
            headers=headers,
            json=user_data
        )
        assert create_response.status_code == 200
        
        # Get style preferences
        response = requests.get(
            f"{api_base_url}/users/profile/{user_id}/style-preferences",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_get_style_preferences_nonexistent_user(self, api_base_url: str, headers: Dict[str, str]):
        """Test getting style preferences for non-existent user"""
        fake_user_id = f"fake-user-{uuid.uuid4().hex[:8]}"
        
        response = requests.get(
            f"{api_base_url}/users/profile/{fake_user_id}/style-preferences",
            headers=headers
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"] 