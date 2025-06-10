from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, HttpUrl, field_validator
import re
from typing import Optional, List
import logging
import asyncio
import requests
import xml.etree.ElementTree as ET
from urllib.parse import urljoin
import google.generativeai as genai
import os
import uuid
import json
import html
import time
from functools import wraps
from sqlalchemy import text
from app.config.database import get_db, db_config
from app.services.postgres_service import postgres_service
from app.services.embedding_service import embedding_service
from app.services.analyzed_images_service import analyzed_images_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/pinterest", tags=["Pinterest"])

# Configure Google Gemini
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

# Rate limiting configuration
class RateLimiter:
    def __init__(self, max_calls: int, time_window: int):
        self.max_calls = max_calls
        self.time_window = time_window
        self.calls = []
    
    async def acquire(self):
        """Acquire rate limit permission"""
        now = time.time()
        # Remove old calls outside time window
        self.calls = [call_time for call_time in self.calls if now - call_time < self.time_window]
        
        if len(self.calls) >= self.max_calls:
            # Rate limit exceeded, wait
            oldest_call = min(self.calls)
            wait_time = self.time_window - (now - oldest_call)
            if wait_time > 0:
                logger.warning(f"⚠️ Rate limit reached, waiting {wait_time:.1f}s")
                await asyncio.sleep(wait_time)
        
        self.calls.append(now)

# Rate limiters for different services
gemini_rate_limiter = RateLimiter(max_calls=60, time_window=60)  # 60 calls per minute
embedding_rate_limiter = RateLimiter(max_calls=600, time_window=60)  # 600 calls per minute
pinterest_rate_limiter = RateLimiter(max_calls=60, time_window=60)  # 60 RSS fetches per minute

# Request models
class PinterestAnalysisRequest(BaseModel):
    url: HttpUrl
    user_id: str
    
    @field_validator('url')
    @classmethod
    def validate_pinterest_url(cls, v):
        if 'pinterest.com' not in str(v):
            raise ValueError('URL must be a Pinterest board URL')
        return v
    
    @field_validator('user_id')
    @classmethod
    def validate_user_id(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('user_id is required')
        return v.strip()

# Response models  
class StyleAnalysis(BaseModel):
    aesthetic_description: str
    style_keywords: List[str]
    color_palette: List[str]
    themes: List[str]
    confidence_score: float

class PinterestAnalysisResponse(BaseModel):
    success: bool
    style_analysis: Optional[StyleAnalysis] = None
    message: str
    validation_error: Optional[bool] = None

def convert_pinterest_url_to_rss(pinterest_url: str) -> str:
    """Convert Pinterest board URL to RSS feed URL"""
    # Extract username and board name from various Pinterest URL formats
    patterns = [
        r'pinterest\.com[^/]*/([^/]+)/([^/?]+)',  # Standard format
        r'pinterest\.com/([^/]+)/([^/?]+)',       # Direct format
    ]
    
    for pattern in patterns:
        match = re.search(pattern, pinterest_url)
        if match:
            username, board_name = match.groups()
            return f"https://pinterest.com/{username}/{board_name}.rss"
    
    # If no match, try to append .rss to the URL
    return pinterest_url.rstrip('/') + '.rss'

def extract_pinterest_images_from_rss(rss_url: str, max_images: int = 15) -> List[str]:
    """Extract image URLs from Pinterest RSS feed with rate limiting"""
    try:
        logger.info(f"🔍 Fetching RSS feed: {rss_url}")
        
        # Fetch RSS feed
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(rss_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Parse XML
        root = ET.fromstring(response.content)
        
        # Extract images from description tags
        image_urls = []
        
        # Look for item descriptions
        for item in root.findall('.//item'):
            description = item.find('description')
            if description is not None and description.text:
                # HTML decode the description first
                decoded_description = html.unescape(description.text)
                
                # Find Pinterest image URLs using regex
                img_pattern = re.compile(r'https://i\.pinimg\.com/[^"\'>\s]+', re.IGNORECASE)
                matches = img_pattern.findall(decoded_description)
                
                for match in matches:
                    # Convert thumbnail URLs to larger versions
                    if '/236x/' in match:
                        larger_url = match.replace('/236x/', '/736x/')
                        image_urls.append(larger_url)
                    else:
                        image_urls.append(match)
        
        # Remove duplicates and limit
        unique_images = list(dict.fromkeys(image_urls))[:max_images]
        logger.info(f"✅ Extracted {len(unique_images)} images from RSS feed")
        
        return unique_images
        
    except Exception as e:
        logger.error(f"❌ Error extracting images from RSS: {str(e)}")
        return []

async def analyze_images_with_gemini(image_urls: List[str], board_name: str) -> Optional[StyleAnalysis]:
    """Analyze Pinterest board images using Google Gemini Vision API with rate limiting"""
    if not GOOGLE_API_KEY:
        logger.warning("⚠️ GOOGLE_API_KEY not configured.")
        return None
    
    if not image_urls:
        logger.info("ℹ️ No images to analyze")
        return None
    
    try:
        # Apply rate limiting for Gemini API
        await gemini_rate_limiter.acquire()
        
        # Limit to first 5 images for API efficiency
        analysis_images = image_urls[:5]
        logger.info(f"🎨 Analyzing {len(analysis_images)} images with Gemini Vision API")
        
        # Create Gemini model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Prepare images for analysis concurrently
        async def fetch_image(url: str) -> Optional[dict]:
            try:
                response = requests.get(url, timeout=10)
                if response.status_code == 200:
                    return {
                        'mime_type': 'image/jpeg',
                        'data': response.content
                    }
            except Exception as e:
                logger.warning(f"⚠️ Failed to fetch image {url}: {str(e)}")
            return None
        
        # Fetch all images concurrently
        image_tasks = [fetch_image(url) for url in analysis_images]
        image_results = await asyncio.gather(*image_tasks, return_exceptions=True)
        image_parts = [img for img in image_results if img and not isinstance(img, Exception)]
        
        if not image_parts:
            logger.warning("⚠️ No images could be fetched for analysis")
            return None
        
        # Create analysis prompt
        prompt = f"""
        Analyze these Pinterest board images for aesthetic and style patterns. The board is called "{board_name}".
        
        You must respond with ONLY valid JSON in this exact format:
        {{
            "aesthetic_description": "A detailed description of the overall aesthetic (2-3 sentences)",
            "style_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8", "keyword9", "keyword10"],
            "color_palette": ["color1", "color2", "color3", "color4", "color5"],
            "themes": ["theme1", "theme2", "theme3", "theme4", "theme5", "theme6", "theme7", "theme8"],
            "confidence_score": 0.85
        }}
        
        Focus on:
        - Overall aesthetic and design style
        - Recurring visual themes and motifs
        - Dominant color schemes
        - Mood and atmosphere
        - Design elements and patterns
        
        IMPORTANT: Return ONLY the JSON object. No markdown formatting, no additional text, no explanations.
        """
        
        # Generate analysis
        response = model.generate_content([prompt] + image_parts)
        
        if response.text:
            # Parse JSON response
            try:
                # Clean the response text (remove markdown formatting if present)
                response_text = response.text.strip()
                if response_text.startswith('```json'):
                    response_text = response_text.replace('```json', '').replace('```', '').strip()
                elif response_text.startswith('```'):
                    response_text = response_text.replace('```', '').strip()
                
                logger.info(f"🔍 Gemini raw response: {response_text[:200]}...")
                analysis_data = json.loads(response_text)
                
                return StyleAnalysis(
                    aesthetic_description=analysis_data.get('aesthetic_description', ''),
                    style_keywords=analysis_data.get('style_keywords', []),
                    color_palette=analysis_data.get('color_palette', []),
                    themes=analysis_data.get('themes', []),
                    confidence_score=float(analysis_data.get('confidence_score', 0.7))
                )
            except json.JSONDecodeError as e:
                logger.error(f"❌ Failed to parse Gemini response as JSON: {str(e)}")
                logger.error(f"❌ Raw response: {response.text}")
                return None
        
        logger.warning("⚠️ Empty response from Gemini")
        return None
        
    except Exception as e:
        logger.error(f"❌ Gemini analysis failed: {str(e)}")
        return None



@router.post("/analyze-board", response_model=PinterestAnalysisResponse)
async def analyze_pinterest_board(
    request: PinterestAnalysisRequest
):
    """
    Analyze a Pinterest board and extract style preferences using RSS feeds and AI.
    
    This endpoint:
    1. Validates the Pinterest URL format
    2. Converts Pinterest URL to RSS feed
    3. Extracts image URLs from RSS feed
    4. Uses Google Gemini Vision API to analyze images
    5. Generates embeddings for each image
    6. Stores individual image analysis in analyzed_images table
    7. Returns structured style analysis
    """
    try:
        logger.info(f"🎨 Starting Pinterest board analysis for user {request.user_id}")
        logger.info(f"📌 Board URL: {request.url}")
        
        # Extract username and board name from URL
        url_str = str(request.url)
        pinterest_pattern = r'pinterest\.com[^/]*/([^/]+)/([^/?]+)'
        match = re.search(pinterest_pattern, url_str)
        
        if not match:
            logger.warning(f"❌ Invalid Pinterest URL format: {url_str}")
            return PinterestAnalysisResponse(
                success=False,
                message="Invalid Pinterest URL format. Expected format: https://pinterest.com/username/boardname",
                validation_error=True
            )
        
        username, board_name = match.groups()
        logger.info(f"👤 Extracted username: {username}, board: {board_name}")
        
        # Apply rate limiting for Pinterest RSS fetching
        await pinterest_rate_limiter.acquire()
        
        # Convert to RSS URL and extract images
        rss_url = convert_pinterest_url_to_rss(url_str)
        logger.info(f"📡 RSS URL: {rss_url}")
        image_urls = extract_pinterest_images_from_rss(rss_url)
        logger.info(f"🖼️ Found {len(image_urls)} images from RSS")
        
        # Check if the board exists (has any content)
        if not image_urls:
            # Try to verify the board exists by checking if RSS feed returns valid content
            try:
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
                response = requests.get(rss_url, headers=headers, timeout=10)
                if response.status_code == 404:
                    logger.warning(f"❌ Pinterest board not found: {url_str}")
                    return PinterestAnalysisResponse(
                        success=False,
                        message="Pinterest board not found. Please check the URL and make sure the board is public.",
                        validation_error=True
                    )
            except:
                pass
        
        # Require Gemini Vision API for analysis
        if not GOOGLE_API_KEY:
            logger.error("❌ GOOGLE_API_KEY not configured")
            return PinterestAnalysisResponse(
                success=False,
                message="Style analysis service is not available. Please contact support.",
                validation_error=True
            )
        
        if not image_urls:
            logger.warning(f"❌ No images found in Pinterest board: {url_str}")
            return PinterestAnalysisResponse(
                success=False,
                message="No images found in this Pinterest board. Please try a different board with images.",
                validation_error=True
            )
        
        # Analyze images with Gemini Vision API
        style_analysis = await analyze_images_with_gemini(image_urls, board_name)
        
        if not style_analysis:
            logger.error(f"❌ Gemini Vision analysis failed for board: {url_str}")
            return PinterestAnalysisResponse(
                success=False,
                message="Failed to analyze the Pinterest board images. Please try again or choose a different board.",
                validation_error=True
            )
        
        # Store analysis in database and process individual images with embeddings
        style_preference_id = await _store_style_analysis_with_embeddings(
            request.user_id, url_str, style_analysis, image_urls, board_name
        )
        
        logger.info(f"✅ Pinterest analysis completed successfully for user {request.user_id} using Gemini Vision with embeddings")
        
        return PinterestAnalysisResponse(
            success=True,
            style_analysis=style_analysis,
            message="Pinterest board analyzed successfully using AI vision analysis with vector embeddings"
        )
        
    except ValueError as e: # Validation error
        logger.error(f"❌ Validation error: {str(e)}")
        return PinterestAnalysisResponse(
            success=False,
            message=str(e),
            validation_error=True
        )
    except Exception as e:
        logger.error(f"❌ Pinterest analysis failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze Pinterest board: {str(e)}"
        )

async def _store_style_analysis_with_embeddings(
    user_id: str, 
    board_url: str, 
    style_analysis: StyleAnalysis,
    image_urls: List[str],
    board_name: str
) -> Optional[str]:
    """Store style analysis and process individual images with embeddings using concurrent processing"""
    try:
        # First store the overall style analysis (legacy storage)
        await _store_style_analysis(user_id, board_url, style_analysis)
        
        # Generate text embedding for the overall aesthetic description
        await embedding_rate_limiter.acquire()
        style_embedding = await embedding_service.generate_text_embedding(
            style_analysis.aesthetic_description
        )
        
        logger.info(f"🔄 Processing {len(image_urls)} images for embeddings...")
        
        # Process images concurrently (limit to avoid overwhelming the system)
        max_images_to_process = min(len(image_urls), 5)  # Limit to 5 images
        selected_images = image_urls[:max_images_to_process]
        
        async def process_single_image(image_url: str, index: int) -> Optional[dict]:
            """Process a single image with embeddings"""
            try:
                logger.info(f"🖼️ Processing image {index+1}/{max_images_to_process}: {image_url[:50]}...")
                
                # Apply rate limiting for embedding generation
                await embedding_rate_limiter.acquire()
                
                # Generate image embedding and analyze with Gemini concurrently
                embedding_task = embedding_service.generate_image_embedding(image_url)
                analysis_task = embedding_service.analyze_image_with_gemini(image_url)
                
                # Wait for both operations to complete
                image_embedding, image_analysis = await asyncio.gather(
                    embedding_task, analysis_task, return_exceptions=True
                )
                
                # Handle exceptions
                if isinstance(image_embedding, Exception):
                    logger.warning(f"⚠️ Failed to generate embedding for image {index+1}: {image_embedding}")
                    image_embedding = None
                
                if isinstance(image_analysis, Exception):
                    logger.warning(f"⚠️ Failed to analyze image {index+1}: {image_analysis}")
                    image_analysis = None
                
                # Generate text embedding for image description if available
                image_style_embedding = None
                if image_analysis and image_analysis.get('description'):
                    await embedding_rate_limiter.acquire()
                    image_style_embedding = await embedding_service.generate_text_embedding(
                        image_analysis['description']
                    )
                
                # Store the analyzed image with embeddings
                if image_embedding or image_style_embedding:
                    await analyzed_images_service.store_analyzed_image(
                        user_id=user_id,
                        image_url=image_url,
                        image_embedding=image_embedding,
                        style_embedding=image_style_embedding,
                        image_analysis=image_analysis,
                        pinterest_pin_id=f"pinterest_{board_name}_{index}"
                    )
                    logger.info(f"✅ Stored embeddings for image {index+1}")
                    return {"success": True, "index": index}
                else:
                    logger.warning(f"⚠️ Failed to generate embeddings for image {index+1}")
                    return {"success": False, "index": index}
                
            except Exception as e:
                logger.warning(f"⚠️ Failed to process image {index+1}: {e}")
                return {"success": False, "index": index, "error": str(e)}
        
        # Process all images concurrently
        image_tasks = [
            process_single_image(image_url, i) 
            for i, image_url in enumerate(selected_images)
        ]
        
        # Execute all tasks concurrently with a slight delay between starts to avoid overwhelming APIs
        results = []
        for i, task in enumerate(image_tasks):
            if i > 0:
                await asyncio.sleep(0.1)
            results.append(task)
        
        # Wait for all tasks to complete
        processing_results = await asyncio.gather(*results, return_exceptions=True)
        
        successful_count = sum(
            1 for result in processing_results 
            if isinstance(result, dict) and result.get("success", False)
        )
        
        logger.info(f"✅ Successfully processed {successful_count}/{max_images_to_process} images with embeddings using concurrent processing")
        return None
        
    except Exception as e:
        logger.error(f"❌ Failed to store style analysis with embeddings: {e}")
        # Don't fail the whole request if embedding storage fails
        return None

async def _store_style_analysis(
    user_id: str, 
    board_url: str, 
    style_analysis: StyleAnalysis
):
    """Store style analysis in database using efficient upsert operation"""        
    try:
        # Normalize user_id to UUID format
        normalized_user_id = postgres_service._normalize_user_id(user_id)
        user_uuid = uuid.UUID(normalized_user_id)
        
        async with db_config.SessionLocal() as session:
            # Convert arrays to JSON strings for storage
            style_keywords_json = json.dumps(style_analysis.style_keywords)
            color_palette_json = json.dumps(style_analysis.color_palette)
            themes_json = json.dumps(style_analysis.themes)
            
            upsert_query = text("""
                INSERT INTO style_analysis 
                (user_id, aesthetic_description, style_keywords, color_palette, themes, 
                 confidence_score, source_board_url, images_analyzed, analysis_date, created_at, updated_at)
                VALUES (:user_id, :aesthetic_description, :style_keywords, :color_palette, 
                        :themes, :confidence_score, :source_board_url, :images_analyzed, NOW(), NOW(), NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                    aesthetic_description = EXCLUDED.aesthetic_description,
                    style_keywords = EXCLUDED.style_keywords,
                    color_palette = EXCLUDED.color_palette,
                    themes = EXCLUDED.themes,
                    confidence_score = EXCLUDED.confidence_score,
                    source_board_url = EXCLUDED.source_board_url,
                    images_analyzed = EXCLUDED.images_analyzed,
                    analysis_date = EXCLUDED.analysis_date,
                    updated_at = NOW()
            """)
            
            await session.execute(upsert_query, {
                'user_id': str(user_uuid),  # Convert UUID to string
                'aesthetic_description': style_analysis.aesthetic_description,
                'style_keywords': style_keywords_json,
                'color_palette': color_palette_json,
                'themes': themes_json,
                'confidence_score': float(style_analysis.confidence_score),
                'source_board_url': board_url,
                'images_analyzed': 0 
            })
            
            await session.commit()
            logger.info(f"✅ Style analysis stored for user {user_id}")
                
    except Exception as e:
        logger.error(f"❌ Failed to store style analysis: {str(e)}")
        raise Exception(f"Failed to store style analysis: {str(e)}")

@router.get("/analyzed-images/{user_id}")
async def get_analyzed_images(
    user_id: str,
    limit: int = 50
):
    """
    Get analyzed images for a user.
    
    Returns the individual images that were analyzed during Pinterest board processing,
    including their embeddings, style analysis, and metadata.
    """
    try:
        logger.info(f"🖼️ Fetching analyzed images for user {user_id}")
        
        # Validate user_id format
        if not user_id or len(user_id.strip()) == 0:
            raise HTTPException(status_code=400, detail="user_id is required")
        
        # Validate limit
        if limit < 1 or limit > 100:
            raise HTTPException(status_code=400, detail="limit must be between 1 and 100")
        
        # Fetch analyzed images from service
        images = await analyzed_images_service.get_user_analyzed_images(
            user_id=user_id.strip(),
            limit=limit
        )
        
        logger.info(f"✅ Retrieved {len(images)} analyzed images for user {user_id}")
        
        return {
            "success": True,
            "count": len(images),
            "images": images,
            "message": f"Retrieved {len(images)} analyzed images"
        }
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(f"❌ Failed to get analyzed images for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve analyzed images: {str(e)}"
        )

