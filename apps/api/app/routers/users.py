from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, model_validator
from typing import List, Optional
from app.services.postgres_service import postgres_service as db_service
from app.services.auth_service import get_current_user_id
from app.config.database import get_db
import logging
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

logger = logging.getLogger(__name__)

router = APIRouter(tags=["users"])

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
    shopping_preference: Optional[str] = None
    onboarding_completed: bool
    pinterest_board_analyzed: Optional[str] = None
    followers_count: int = 0
    following_count: int = 0
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
    shopping_preference: Optional[str] = None

    @model_validator(mode='before')
    def check_at_least_one_field(cls, values):
        if not values:
            raise ValueError("At least one field must be provided for update")
        return values

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
    Create a new user profile. This is one of the few endpoints
    that relies on the user_id from the request body, as it's
    used during the initial signup process.
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

@router.get("/profile", response_model=UserProfile)
async def get_my_user_profile(user_id: str = Depends(get_current_user_id)):
    """
    Get the current authenticated user's profile
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

@router.put("/profile", response_model=UserServiceResponse)
async def update_my_user_profile(
    request: UpdateProfileRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Update the current authenticated user's profile
    """
    try:
        updates = request.model_dump(exclude_unset=True)
        
        result = await db_service.update_user_profile(user_id, updates)
        return UserServiceResponse(**result)
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user profile")

@router.post("/profile/complete-onboarding", response_model=UserServiceResponse)
async def complete_my_onboarding(
    user_id: str = Depends(get_current_user_id)
):
    """
    Mark the current user's onboarding as completed
    """
    try:
        result = await db_service.complete_onboarding(user_id)
        return UserServiceResponse(**result)
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error completing onboarding: {e}")
        raise HTTPException(status_code=500, detail="Failed to complete onboarding")

@router.post("/profile/pinterest-board", response_model=UserServiceResponse)
async def update_my_pinterest_board(
    request: UpdatePinterestBoardRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Update the current user's Pinterest board URL
    """
    try:
        result = await db_service.update_pinterest_board(user_id, request.pinterest_board_url)
        return UserServiceResponse(**result)
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating Pinterest board: {e}")
        raise HTTPException(status_code=500, detail="Failed to update Pinterest board")

@router.get("/profile/style-preferences", response_model=List[StylePreference])
async def get_my_style_preferences(user_id: str = Depends(get_current_user_id)):
    """
    Get the current user's style preferences
    """
    try:
        preferences = await db_service.get_user_style_preferences(user_id)
        return [StylePreference(**pref) for pref in preferences]
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching style preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch style preferences")

@router.get("/profile/debug", response_model=dict)
async def debug_user_auth(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Debug endpoint to check user authentication status"""
    # Check if user exists in auth.users
    auth_user_query = text("SELECT id, email, phone FROM auth.users WHERE id = :user_id")
    auth_user_result = await db.execute(auth_user_query, {"user_id": user_id})
    auth_user = auth_user_result.fetchone()
    
    # Check if user has a profile
    profile_query = text("SELECT id, username, created_at FROM user_profiles WHERE id = :user_id")
    profile_result = await db.execute(profile_query, {"user_id": user_id})
    profile = profile_result.fetchone()
    
    return {
        "user_id": user_id,
        "exists_in_auth_users": auth_user is not None,
        "auth_user_details": {
            "email": auth_user.email if auth_user else None,
            "phone": auth_user.phone if auth_user else None
        } if auth_user else None,
        "has_profile": profile is not None,
        "profile_details": {
            "username": profile.username if profile else None,
            "created_at": profile.created_at.isoformat() if profile and profile.created_at else None
        } if profile else None
    } 