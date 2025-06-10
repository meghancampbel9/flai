from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.services.postgres_service import postgres_service as db_service
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["users"])

# Pydantic models
class CreateUserProfileRequest(BaseModel):
    user_id: str
    username: str
    display_name: Optional[str] = None
    bio: Optional[str] = None
    phone_number: Optional[str] = None

class UserProfile(BaseModel):
    id: str
    username: str
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    phone_number: Optional[str] = None
    onboarding_completed: bool
    pinterest_board_analyzed: Optional[str] = None
    created_at: str
    updated_at: str

class UserServiceResponse(BaseModel):
    success: bool
    message: str
    profile_id: Optional[str] = None

class UsernameCheckResponse(BaseModel):
    username: str
    available: bool

class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class CompleteOnboardingRequest(BaseModel):
    pass  # No fields needed - just marks onboarding as complete

class UpdatePinterestBoardRequest(BaseModel):
    pinterest_board_url: str

class StylePreference(BaseModel):
    id: str
    aesthetic_description: Optional[str] = None
    style_keywords: List[str] = []
    color_palette: List[str] = []
    themes: List[str] = []
    confidence_score: Optional[float] = None
    source_board_url: Optional[str] = None
    images_analyzed: int
    analysis_date: str

@router.post("/check-username/{username}", response_model=UsernameCheckResponse)
async def check_username_availability(username: str):
    """
    Check if a username is available
    """
    try:
        available = await db_service.check_username_availability(username)
        
        return UsernameCheckResponse(
            username=username,
            available=available
        )
        
    except Exception as e:
        logger.error(f"Error checking username availability: {e}")
        raise HTTPException(status_code=500, detail="Failed to check username availability")

@router.post("/profile", response_model=UserServiceResponse)
async def create_user_profile(request: CreateUserProfileRequest):
    """
    Create a new user profile
    """
    try:
        user_data = {
            'user_id': request.user_id,
            'username': request.username,
            'display_name': request.display_name,
            'bio': request.bio,
            'phone_number': request.phone_number
        }
        
        result = await db_service.create_user_profile(user_data)
        return UserServiceResponse(**result)
        
    except ValueError as e:
        # ValueError is used for (user exists, username taken)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating user profile: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create user profile: {str(e)}")

@router.get("/profile/{user_id}", response_model=UserProfile)
async def get_user_profile(user_id: str):
    """
    Get user profile by user_id
    """
    try:
        profile = await db_service.get_user_profile(user_id)
        
        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        return UserProfile(**profile)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user profile")

@router.put("/profile/{user_id}", response_model=UserServiceResponse)
async def update_user_profile(user_id: str, request: UpdateProfileRequest):
    """
    Update user profile
    """
    try:
        updates = {
            'display_name': request.display_name,
            'bio': request.bio,
            'avatar_url': request.avatar_url
        }
        
        result = await db_service.update_user_profile(user_id, updates)
        return UserServiceResponse(**result)
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user profile")

@router.post("/profile/{user_id}/complete-onboarding", response_model=UserServiceResponse)
async def complete_onboarding(user_id: str, request: CompleteOnboardingRequest):
    """
    Mark user onboarding as completed (platform-agnostic)
    """
    try:
        result = await db_service.complete_onboarding(user_id)
        return UserServiceResponse(**result)
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error completing onboarding: {e}")
        raise HTTPException(status_code=500, detail="Failed to complete onboarding")

@router.post("/profile/{user_id}/pinterest-board", response_model=UserServiceResponse)
async def update_pinterest_board(user_id: str, request: UpdatePinterestBoardRequest):
    """
    Update user's Pinterest board URL and trigger re-analysis
    """
    try:
        result = await db_service.update_pinterest_board(user_id, request.pinterest_board_url)
        return UserServiceResponse(**result)
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating Pinterest board: {e}")
        raise HTTPException(status_code=500, detail="Failed to update Pinterest board")

@router.get("/profile/{user_id}/style-preferences", response_model=List[StylePreference])
async def get_user_style_preferences(user_id: str):
    """
    Get user style preferences
    """
    try:
        preferences = await db_service.get_user_style_preferences(user_id)
        return [StylePreference(**pref) for pref in preferences]
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching style preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch style preferences") 