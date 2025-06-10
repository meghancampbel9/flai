import logging
import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy import text
from app.config.database import db_config
from app.services.postgres_service import postgres_service

logger = logging.getLogger(__name__)

class AnalyzedImagesService:
    """Service for managing analyzed images with embeddings"""
    
    async def store_analyzed_image(
        self,
        user_id: str,
        image_url: str,
        image_embedding: Optional[List[float]] = None,
        style_embedding: Optional[List[float]] = None,
        image_analysis: Optional[Dict[str, Any]] = None,
        pinterest_pin_id: Optional[str] = None
    ) -> Optional[str]:
        """Store an analyzed image with embeddings in the database"""
        try:
            # Normalize user_id to UUID format
            normalized_user_id = postgres_service._normalize_user_id(user_id)
            user_uuid = uuid.UUID(normalized_user_id)
            
            async with db_config.SessionLocal() as session:
                # Prepare the insert query
                query = text("""
                    INSERT INTO analyzed_images (
                        user_id, image_url, image_source,
                        image_embedding, style_embedding, image_description,
                        detected_styles, detected_colors, dominant_mood,
                        aesthetic_score, analysis_confidence, pinterest_pin_id,
                        created_at
                    ) VALUES (
                        :user_id, :image_url, :image_source,
                        :image_embedding, :style_embedding, :image_description,
                        :detected_styles, :detected_colors, :dominant_mood,
                        :aesthetic_score, :analysis_confidence, :pinterest_pin_id,
                        NOW()
                    ) RETURNING id
                """)
                
                # Prepare parameters
                params = {
                    'user_id': str(user_uuid),
                    'image_url': image_url,
                    'image_source': 'pinterest',
                    'image_embedding': f"[{','.join(map(str, image_embedding))}]" if image_embedding else None,
                    'style_embedding': f"[{','.join(map(str, style_embedding))}]" if style_embedding else None,
                    'image_description': image_analysis.get('description') if image_analysis else None,
                    'detected_styles': image_analysis.get('styles', []) if image_analysis else [],
                    'detected_colors': image_analysis.get('colors', []) if image_analysis else [],
                    'dominant_mood': image_analysis.get('mood') if image_analysis else None,
                    'aesthetic_score': float(image_analysis.get('aesthetic_score', 0.0)) if image_analysis else None,
                    'analysis_confidence': float(image_analysis.get('aesthetic_score', 0.7)) if image_analysis else 0.7,
                    'pinterest_pin_id': pinterest_pin_id
                }
                
                result = await session.execute(query, params)
                image_id = result.fetchone()[0]
                await session.commit()
                
                logger.info(f"✅ Stored analyzed image {image_id} for user {user_id}")
                return str(image_id)
                
        except Exception as e:
            logger.error(f"❌ Failed to store analyzed image: {e}")
            return None
    
    async def get_user_analyzed_images(
        self,
        user_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get analyzed images for a user"""
        try:
            # Normalize user_id to UUID format
            normalized_user_id = postgres_service._normalize_user_id(user_id)
            user_uuid = uuid.UUID(normalized_user_id)
            
            async with db_config.SessionLocal() as session:
                query = text("""
                    SELECT id, image_url, image_description, detected_styles,
                           detected_colors, dominant_mood, aesthetic_score,
                           analysis_confidence, pinterest_pin_id, created_at
                    FROM analyzed_images
                    WHERE user_id = :user_id
                    ORDER BY created_at DESC LIMIT :limit
                """)
                
                params = {'user_id': str(user_uuid), 'limit': limit}  # Convert UUID to string
                
                result = await session.execute(query, params)
                rows = result.fetchall()
                
                images = []
                for row in rows:
                    images.append({
                        'id': str(row.id),
                        'image_url': row.image_url,
                        'image_description': row.image_description,
                        'detected_styles': row.detected_styles or [],
                        'detected_colors': row.detected_colors or [],
                        'dominant_mood': row.dominant_mood,
                        'aesthetic_score': float(row.aesthetic_score) if row.aesthetic_score else None,
                        'analysis_confidence': float(row.analysis_confidence) if row.analysis_confidence else None,
                        'pinterest_pin_id': row.pinterest_pin_id,
                        'created_at': row.created_at.isoformat() if row.created_at else None
                    })
                
                logger.info(f"✅ Retrieved {len(images)} analyzed images for user {user_id}")
                return images
                
        except Exception as e:
            logger.error(f"❌ Failed to get analyzed images: {e}")
            return []

# Global service instance
analyzed_images_service = AnalyzedImagesService() 