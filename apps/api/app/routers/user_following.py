from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Optional
import logging
import uuid
from sqlalchemy import text
from app.config.database import get_db, db_config
from app.services.auth_service import get_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter(tags=["User Following"])

# Request/Response models
class FollowUserRequest(BaseModel):
    user_id: str

class FollowUserResponse(BaseModel):
    success: bool
    message: str
    is_following: bool

class UserSearchResult(BaseModel):
    user_id: str
    username: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    bio: Optional[str]
    followers_count: int
    following_count: int
    is_following: bool

class UserProfile(BaseModel):
    user_id: str
    username: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    bio: Optional[str]
    followers_count: int
    following_count: int
    is_following: bool = False

class FollowersResponse(BaseModel):
    followers: List[UserProfile]
    total_count: int
    has_more: bool

class FollowingResponse(BaseModel):
    following: List[UserProfile]
    total_count: int
    has_more: bool

@router.post("/follow", response_model=FollowUserResponse)
async def follow_user(
    request: FollowUserRequest,
    current_user_id: str = Depends(get_current_user_id),
    db = Depends(get_db)
):
    """Follow another user"""
    try:
        target_user_id = request.user_id
        
        # Check if user is trying to follow themselves
        if current_user_id == target_user_id:
            raise HTTPException(
                status_code=400,
                detail="Cannot follow yourself"
            )
        
        # Check if target user exists
        check_user_query = text("""
            SELECT user_id FROM user_profiles WHERE user_id = :target_user_id
        """)
        result = await db.execute(check_user_query, {"target_user_id": target_user_id})
        if not result.fetchone():
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        # Check if already following
        check_follow_query = text("""
            SELECT id FROM user_follows 
            WHERE follower_id = CAST(:current_user_id AS uuid) AND following_id = CAST(:target_user_id AS uuid)
        """)
        result = await db.execute(check_follow_query, {
            "current_user_id": current_user_id,
            "target_user_id": target_user_id
        })
        if result.fetchone():
            return FollowUserResponse(
                success=True,
                message="Already following this user",
                is_following=True
            )
        
        # Create follow relationship
        follow_query = text("""
            INSERT INTO user_follows (follower_id, following_id)
            VALUES (CAST(:current_user_id AS uuid), CAST(:target_user_id AS uuid))
        """)
        await db.execute(follow_query, {
            "current_user_id": current_user_id,
            "target_user_id": target_user_id
        })
        await db.commit()
        
        logger.info(f"User {current_user_id} followed user {target_user_id}")
        
        return FollowUserResponse(
            success=True,
            message="Successfully followed user",
            is_following=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error following user: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to follow user: {str(e)}"
        )

@router.delete("/follow/{user_id}", response_model=FollowUserResponse)
async def unfollow_user(
    user_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db = Depends(get_db)
):
    """Unfollow a user"""
    try:
        # Delete follow relationship
        unfollow_query = text("""
            DELETE FROM user_follows 
            WHERE follower_id = CAST(:current_user_id AS uuid) AND following_id = CAST(:user_id AS uuid)
        """)
        result = await db.execute(unfollow_query, {
            "current_user_id": current_user_id,
            "user_id": user_id
        })
        
        if result.rowcount == 0:
            return FollowUserResponse(
                success=True,
                message="Not following this user",
                is_following=False
            )
        
        await db.commit()
        
        logger.info(f"User {current_user_id} unfollowed user {user_id}")
        
        return FollowUserResponse(
            success=True,
            message="Successfully unfollowed user",
            is_following=False
        )
        
    except Exception as e:
        logger.error(f"Error unfollowing user: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to unfollow user"
        )

@router.get("/search", response_model=List[UserSearchResult])
async def search_users(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(20, ge=1, le=50, description="Number of results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    current_user_id: str = Depends(get_current_user_id),
    db = Depends(get_db)
):
    """Search for users by username or display name"""
    try:
        search_query = text("""
            SELECT 
                up.user_id,
                up.username,
                up.display_name,
                up.avatar_url,
                up.bio,
                up.followers_count,
                up.following_count,
                CASE 
                    WHEN uf.id IS NOT NULL THEN true 
                    ELSE false 
                END as is_following
            FROM user_profiles up
            LEFT JOIN user_follows uf ON up.user_id::text = uf.following_id::text AND uf.follower_id::text = :current_user_id
            WHERE 
                up.username ILIKE :search_pattern OR
                up.display_name ILIKE :search_pattern
            ORDER BY 
                CASE 
                    WHEN up.username ILIKE :exact_pattern THEN 1
                    WHEN up.display_name ILIKE :exact_pattern THEN 2
                    ELSE 3
                END,
                up.followers_count DESC
            LIMIT :limit OFFSET :offset
        """)
        
        search_pattern = f"%{q}%"
        exact_pattern = f"{q}%"
        
        result = await db.execute(search_query, {
            "search_pattern": search_pattern,
            "exact_pattern": exact_pattern,
            "current_user_id": current_user_id,
            "limit": limit,
            "offset": offset
        })
        
        users = []
        for row in result.fetchall():
            users.append(UserSearchResult(
                user_id=str(row.user_id),
                username=row.username,
                display_name=row.display_name,
                avatar_url=row.avatar_url,
                bio=row.bio,
                followers_count=row.followers_count,
                following_count=row.following_count,
                is_following=row.is_following
            ))
        
        return users
        
    except Exception as e:
        logger.error(f"Error searching users: {e}")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error details: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to search users: {str(e)}"
        )

@router.get("/profile/{user_id}", response_model=UserProfile)
async def get_user_profile(
    user_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db = Depends(get_db)
):
    """Get a user's public profile"""
    try:
        profile_query = text("""
            SELECT 
                up.user_id,
                up.username,
                up.display_name,
                up.avatar_url,
                up.bio,
                up.followers_count,
                up.following_count,
                CASE 
                    WHEN uf.id IS NOT NULL THEN true 
                    ELSE false 
                END as is_following
            FROM user_profiles up
            LEFT JOIN user_follows uf ON up.user_id::text = uf.following_id::text AND uf.follower_id::text = :current_user_id
            WHERE up.user_id::text = :user_id
        """)
        
        result = await db.execute(profile_query, {
            "user_id": user_id,
            "current_user_id": current_user_id
        })
        
        row = result.fetchone()
        if not row:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        return UserProfile(
            user_id=str(row.user_id),
            username=row.username,
            display_name=row.display_name,
            avatar_url=row.avatar_url,
            bio=row.bio,
            followers_count=row.followers_count,
            following_count=row.following_count,
            is_following=row.is_following
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get user profile"
        )

@router.get("/followers/{user_id}", response_model=FollowersResponse)
async def get_user_followers(
    user_id: str,
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    current_user_id: str = Depends(get_current_user_id),
    db = Depends(get_db)
):
    """Get a user's followers"""
    try:
        followers_query = text("""
            SELECT 
                uf.follower_id,
                up.username,
                up.display_name,
                up.avatar_url,
                up.bio,
                up.followers_count,
                up.following_count,
                uf.created_at as followed_at,
                CASE 
                    WHEN uf2.id IS NOT NULL THEN true 
                    ELSE false 
                END as is_following
            FROM user_follows uf
            JOIN user_profiles up ON uf.follower_id::text = up.user_id::text
            LEFT JOIN user_follows uf2 ON up.user_id::text = uf2.following_id::text AND uf2.follower_id::text = :current_user_id
            WHERE uf.following_id::text = :user_id
            ORDER BY uf.created_at DESC
            LIMIT :limit OFFSET :offset
        """)
        
        count_query = text("""
            SELECT COUNT(*) as total_count
            FROM user_follows uf
            WHERE uf.following_id::text = :user_id
        """)
        
        result = await db.execute(followers_query, {
            "user_id": user_id,
            "current_user_id": current_user_id,
            "limit": limit,
            "offset": offset
        })
        
        count_result = await db.execute(count_query, {"user_id": user_id})
        total_count = count_result.fetchone().total_count
        
        followers = []
        for row in result.fetchall():
            followers.append(UserProfile(
                user_id=str(row.follower_id),
                username=row.username,
                display_name=row.display_name,
                avatar_url=row.avatar_url,
                bio=row.bio,
                followers_count=row.followers_count,
                following_count=row.following_count,
                is_following=row.is_following
            ))
        
        return FollowersResponse(
            followers=followers,
            total_count=total_count,
            has_more=(offset + len(followers)) < total_count
        )
        
    except Exception as e:
        logger.error(f"Error getting followers: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get followers"
        )

@router.get("/following/{user_id}", response_model=FollowingResponse)
async def get_user_following(
    user_id: str,
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    current_user_id: str = Depends(get_current_user_id),
    db = Depends(get_db)
):
    """Get users that a user is following"""
    try:
        following_query = text("""
            SELECT 
                uf.following_id,
                up.username,
                up.display_name,
                up.avatar_url,
                up.bio,
                up.followers_count,
                up.following_count,
                uf.created_at as followed_at,
                CASE 
                    WHEN uf2.id IS NOT NULL THEN true 
                    ELSE false 
                END as is_following
            FROM user_follows uf
            JOIN user_profiles up ON uf.following_id::text = up.user_id::text
            LEFT JOIN user_follows uf2 ON up.user_id::text = uf2.following_id::text AND uf2.follower_id::text = :current_user_id
            WHERE uf.follower_id::text = :user_id
            ORDER BY uf.created_at DESC
            LIMIT :limit OFFSET :offset
        """)
        
        count_query = text("""
            SELECT COUNT(*) as total_count
            FROM user_follows uf
            WHERE uf.follower_id::text = :user_id
        """)
        
        result = await db.execute(following_query, {
            "user_id": user_id,
            "current_user_id": current_user_id,
            "limit": limit,
            "offset": offset
        })
        
        count_result = await db.execute(count_query, {"user_id": user_id})
        total_count = count_result.fetchone().total_count
        
        following = []
        for row in result.fetchall():
            following.append(UserProfile(
                user_id=str(row.following_id),
                username=row.username,
                display_name=row.display_name,
                avatar_url=row.avatar_url,
                bio=row.bio,
                followers_count=row.followers_count,
                following_count=row.following_count,
                is_following=row.is_following
            ))
        
        return FollowingResponse(
            following=following,
            total_count=total_count,
            has_more=(offset + len(following)) < total_count
        )
        
    except Exception as e:
        logger.error(f"Error getting following: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get following"
        )
