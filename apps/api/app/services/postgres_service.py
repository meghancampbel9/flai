"""
PostgreSQL service for user operations
"""
import logging
from typing import Dict, List, Optional, Any, Tuple
import os
import uuid
import hashlib
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.config.database import db_config

logger = logging.getLogger(__name__)

class PostgresService:
    """Service for PostgreSQL operations"""
    
    def __init__(self):
        """Initialize the service"""
        self.initialized = False
    
    def _is_valid_uuid(self, value: str) -> bool:
        """Check if a string is a valid UUID format"""
        try:
            uuid.UUID(value)
            return True
        except ValueError:
            return False
    
    def _get_dev_user_uuid(self, dev_user_id: str) -> str:
        """Convert development user ID to a consistent UUID"""
        if dev_user_id == 'dev-user-id':
            # Use a consistent UUID for the dev user
            return '12345678-1234-5678-9012-123456789012'
        elif dev_user_id.startswith('test-user-'):
            # For test users, generate a deterministic UUID based on the ID
            hash_bytes = hashlib.md5(dev_user_id.encode()).digest()
            # Convert to UUID format
            return str(uuid.UUID(bytes=hash_bytes))
        else:
            # For other cases, try to generate a valid UUID
            return str(uuid.uuid4())
    
    def _normalize_user_id(self, user_id: str) -> str:
        """Normalize user ID to valid UUID format for database operations"""
        # If it's already a valid UUID, use it as-is
        if self._is_valid_uuid(user_id):
            return user_id
        
        # Check if we're in development mode
        is_debug = os.getenv('DEBUG', '').lower() == 'true'
        
        if is_debug:
            # In development, convert non-UUID IDs to consistent UUIDs
            return self._get_dev_user_uuid(user_id)
        else:
            # In production, raise an error for invalid UUIDs
            raise ValueError(f"Invalid user ID format: {user_id}. Must be a valid UUID.")

    def _prepare_user_uuid(self, user_id: str) -> uuid.UUID:
        """Helper to normalize and convert user_id to UUID object"""
        normalized_user_id = self._normalize_user_id(user_id)
        return uuid.UUID(normalized_user_id)

    async def _user_exists(self, session, user_uuid: uuid.UUID) -> bool:
        """Helper to check if user exists"""
        query = text("SELECT 1 FROM user_profiles WHERE id = :user_id LIMIT 1")
        result = await session.execute(query, {"user_id": user_uuid})
        return result.fetchone() is not None

    async def check_username_availability(self, username: str) -> bool:
        """Check if a username is available"""
        try:
            async with db_config.SessionLocal() as session:
                # Check if username exists
                query = text("SELECT 1 FROM user_profiles WHERE username = :username LIMIT 1")
                result = await session.execute(query, {"username": username})
                exists = result.fetchone() is not None
                
                # Available if it doesn't exist
                return not exists
                
        except Exception as e:
            logger.error(f"Error checking username availability: {e}")
            
            # In development, be more permissive when database is unavailable
            # This allows frontend development to continue
            if os.getenv('DEBUG', '').lower() == 'true':
                logger.warning(f"⚠️ Database unavailable in development mode - allowing username '{username}'")
                return True  # Allow username in development when DB is down
            
            # In production, default to unavailable for safety
            return False
    
    async def create_user_profile(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new user profile"""
        try:
            user_uuid = self._prepare_user_uuid(user_data['user_id'])
            
            async with db_config.SessionLocal() as session:
                insert_query = text("""
                    INSERT INTO user_profiles (
                        id, user_id, username, display_name, bio, phone_number, 
                        onboarding_completed, created_at, updated_at
                    ) VALUES (
                        :id, :user_id, :username, :display_name, :bio, :phone_number, 
                        FALSE, NOW(), NOW()
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        username = EXCLUDED.username,
                        display_name = EXCLUDED.display_name,
                        bio = EXCLUDED.bio,
                        phone_number = EXCLUDED.phone_number,
                        updated_at = NOW()
                    WHERE user_profiles.id = EXCLUDED.id
                """)
                
                await session.execute(insert_query, {
                    'id': user_uuid,
                    'user_id': str(user_uuid),
                    'username': user_data['username'],
                    'display_name': user_data.get('display_name'),
                    'bio': user_data.get('bio'),
                    'phone_number': user_data.get('phone_number')
                })
                
                await session.commit()
                
                return {
                    'success': True,
                    'message': 'User profile created successfully',
                    'profile_id': str(user_uuid)
                }
                    
        except IntegrityError as e:
            if 'username' in str(e).lower():
                raise ValueError("Username is already taken")
            else:
                logger.error(f"Database integrity error: {e}")
                raise ValueError("Failed to create user profile due to data constraint")
        except ValueError as e:
            # Re-raise ValueError (business logic errors)
            raise e
        except Exception as e:
            logger.error(f"Unexpected error creating user profile: {e}")
            raise Exception(f"Failed to create user profile: {str(e)}")
    
    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile by user_id"""
        try:
            user_uuid = self._prepare_user_uuid(user_id)
            
            async with db_config.SessionLocal() as session:
                query = text("""
                    SELECT id, username, display_name, bio, avatar_url, phone_number,
                           onboarding_completed, pinterest_board_analyzed, 
                           created_at, updated_at
                    FROM user_profiles 
                    WHERE id = :user_id
                """)
                
                result = await session.execute(query, {"user_id": user_uuid})
                row = result.fetchone()
                
                if not row:
                    return None
                
                return {
                    'id': str(row.id),
                    'username': row.username,
                    'display_name': row.display_name,
                    'bio': row.bio,
                    'avatar_url': row.avatar_url,
                    'phone_number': row.phone_number,
                    'onboarding_completed': row.onboarding_completed,
                    'pinterest_board_analyzed': row.pinterest_board_analyzed,
                    'created_at': row.created_at.isoformat() if row.created_at else None,
                    'updated_at': row.updated_at.isoformat() if row.updated_at else None
                }
                
        except Exception as e:
            logger.error(f"Error fetching user profile: {e}")
            raise Exception(f"Failed to fetch user profile: {str(e)}")
    
    async def update_user_profile(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update user profile with secure field validation"""
        try:
            user_uuid = self._prepare_user_uuid(user_id)
            
            # Define allowed fields for security
            ALLOWED_FIELDS = {'display_name', 'bio', 'avatar_url', 'username', 'phone_number'}
            
            # Filter and validate updates
            safe_updates = {
                field: value for field, value in updates.items() 
                if field in ALLOWED_FIELDS and value is not None
            }
            
            if not safe_updates:
                return {
                    'success': True,
                    'message': 'No valid updates to apply'
                }
            
            async with db_config.SessionLocal() as session:
                # Handle username update first (needs uniqueness check)
                if 'username' in safe_updates:
                    # Check if username is already taken by another user
                    username_check = text("""
                        SELECT 1 FROM user_profiles 
                        WHERE username = :username AND id != :user_id 
                        LIMIT 1
                    """)
                    check_result = await session.execute(username_check, {
                        'username': safe_updates['username'],
                        'user_id': user_uuid
                    })
                    
                    if check_result.fetchone():
                        raise ValueError("Username is already taken")
                    
                    update_query = text("""
                        UPDATE user_profiles 
                        SET username = :username, updated_at = NOW()
                        WHERE id = :user_id
                    """)
                    result = await session.execute(update_query, {
                        'user_id': user_uuid,
                        'username': safe_updates['username']
                    })

                if 'display_name' in safe_updates:
                    update_query = text("""
                        UPDATE user_profiles 
                        SET display_name = :display_name, updated_at = NOW()
                        WHERE id = :user_id
                    """)
                    result = await session.execute(update_query, {
                        'user_id': user_uuid,
                        'display_name': safe_updates['display_name']
                    })
                
                if 'bio' in safe_updates:
                    update_query = text("""
                        UPDATE user_profiles 
                        SET bio = :bio, updated_at = NOW()
                        WHERE id = :user_id
                    """)
                    result = await session.execute(update_query, {
                        'user_id': user_uuid,
                        'bio': safe_updates['bio']
                    })
                
                if 'avatar_url' in safe_updates:
                    update_query = text("""
                        UPDATE user_profiles 
                        SET avatar_url = :avatar_url, updated_at = NOW()
                        WHERE id = :user_id
                    """)
                    result = await session.execute(update_query, {
                        'user_id': user_uuid,
                        'avatar_url': safe_updates['avatar_url']
                    })

                if 'phone_number' in safe_updates:
                    update_query = text("""
                        UPDATE user_profiles 
                        SET phone_number = :phone_number, updated_at = NOW()
                        WHERE id = :user_id
                    """)
                    result = await session.execute(update_query, {
                        'user_id': user_uuid,
                        'phone_number': safe_updates['phone_number']
                    })
                
                # Check if user exists (using the last executed result)
                if result.rowcount == 0:
                    raise ValueError("User profile not found")
                
                await session.commit()
                
                return {
                    'success': True,
                    'message': 'User profile updated successfully'
                }
                
        except ValueError:
            raise  # Re-raise validation errors
        except Exception as e:
            logger.error(f"Error updating user profile: {e}")
            raise Exception(f"Failed to update user profile: {str(e)}")
    
    async def complete_onboarding(self, user_id: str) -> Dict[str, Any]:
        """Mark user onboarding as completed"""
        try:
            user_uuid = self._prepare_user_uuid(user_id)
            
            async with db_config.SessionLocal() as session:
                update_query = text("""
                    UPDATE user_profiles 
                    SET onboarding_completed = TRUE, updated_at = NOW()
                    WHERE id = :user_id
                """)
                
                result = await session.execute(update_query, {'user_id': user_uuid})
                
                if result.rowcount == 0:
                    raise ValueError("User profile not found")
                
                await session.commit()
                
                return {
                    'success': True,
                    'message': 'Onboarding completed successfully'
                }
                
        except ValueError:
            raise  # Re-raise validation errors
        except Exception as e:
            logger.error(f"Error completing onboarding: {e}")
            raise Exception(f"Failed to complete onboarding: {str(e)}")
    
    async def update_pinterest_board(self, user_id: str, pinterest_board_url: str) -> Dict[str, Any]:
        """Update user's Pinterest board URL"""
        try:
            user_uuid = self._prepare_user_uuid(user_id)
            
            async with db_config.SessionLocal() as session:
                update_query = text("""
                    UPDATE user_profiles 
                    SET pinterest_board_analyzed = :pinterest_board_url, updated_at = NOW()
                    WHERE id = :user_id
                """)
                
                result = await session.execute(update_query, {
                    'user_id': user_uuid,
                    'pinterest_board_url': pinterest_board_url
                })
                
                if result.rowcount == 0:
                    raise ValueError("User profile not found")
                
                await session.commit()
                
                return {
                    'success': True,
                    'message': 'Pinterest board updated successfully'
                }
                
        except ValueError:
            raise  # Re-raise validation errors
        except Exception as e:
            logger.error(f"Error updating Pinterest board: {e}")
            raise Exception(f"Failed to update Pinterest board: {str(e)}")

    async def get_user_style_preferences(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user style preferences"""
        try:
            user_uuid = self._prepare_user_uuid(user_id)
            
            async with db_config.SessionLocal() as session:
                query = text("""
                    SELECT 
                        sa.id, sa.aesthetic_description, sa.style_keywords, 
                        sa.color_palette, sa.themes, sa.confidence_score, 
                        sa.source_board_url, sa.images_analyzed, sa.analysis_date,
                        up.id as user_exists
                    FROM style_analysis sa
                    LEFT JOIN user_profiles up ON up.id = sa.user_id
                    WHERE sa.user_id = :user_id
                    ORDER BY sa.analysis_date DESC
                """)
                
                result = await session.execute(query, {"user_id": user_uuid})
                rows = result.fetchall()
                
                if not rows:
                    if not await self._user_exists(session, user_uuid):
                        raise ValueError("User profile not found")
                    return []  # User exists but has no preferences
                
                preferences = []
                for row in rows:
                    preferences.append({
                        'id': str(row.id),
                        'aesthetic_description': row.aesthetic_description,
                        'style_keywords': row.style_keywords or [],
                        'color_palette': row.color_palette or [],
                        'themes': row.themes or [],
                        'confidence_score': float(row.confidence_score) if row.confidence_score else None,
                        'source_board_url': row.source_board_url,
                        'images_analyzed': row.images_analyzed or 0,
                        'analysis_date': row.analysis_date.isoformat() if row.analysis_date else None
                    })
                
                return preferences
                
        except ValueError:
            raise  # Re-raise validation errors
        except Exception as e:
            logger.error(f"Error fetching style preferences: {e}")
            raise Exception(f"Failed to fetch style preferences: {str(e)}")

# Global service instance
postgres_service = PostgresService() 