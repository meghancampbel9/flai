import os
import logging
import asyncio
import aiohttp
import base64
import json
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from PIL import Image
from typing import List, Optional, Union
from io import BytesIO

logger = logging.getLogger(__name__)

class EmbeddingService:
    """Service for generating image and text embeddings using LangChain"""
    
    def __init__(self):
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        if not self.google_api_key:
            logger.warning("⚠️ GOOGLE_API_KEY not found. Embedding features will be limited.")
        
        self._text_embeddings = None
        self._vision_llm = None

    async def _get_text_embeddings(self):
        """Get LangChain Google text embeddings instance"""
        if self._text_embeddings is None:
            try: 
                self._text_embeddings = GoogleGenerativeAIEmbeddings(
                    model="models/text-embedding-004",
                    google_api_key=self.google_api_key,
                    task_type="retrieval_document"
                )
                logger.info("✅ LangChain Google embeddings initialized")
            except Exception as e:
                logger.error(f"❌ Failed to initialize LangChain embeddings: {e}")
                return None
        return self._text_embeddings

    async def _get_vision_llm(self):
        """Get LangChain Google Vision LLM instance"""
        if self._vision_llm is None:
            try:
                self._vision_llm = ChatGoogleGenerativeAI(
                    model="gemini-1.5-flash",
                    google_api_key=self.google_api_key,
                    temperature=0.1
                )
                logger.info("✅ LangChain Google Vision LLM initialized")
            except Exception as e:
                logger.error(f"❌ Failed to initialize LangChain Vision LLM: {e}")
                return None
        return self._vision_llm

    async def _download_and_compress_image(self, image_url: str, max_size_kb: int = 30) -> Optional[str]:
        """Download and compress image to base64, staying under size limit"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(image_url, timeout=30) as response:
                    if response.status != 200:
                        logger.warning(f"⚠️ Failed to download image {image_url}: {response.status}")
                        return None
                    
                    image_data = await response.read()
                    
                    # Use PIL for smart compression
                    image = Image.open(BytesIO(image_data))
                    if image.mode != 'RGB':
                        image = image.convert('RGB')
                    
                    # Start with reasonable dimensions
                    quality = 85
                    max_dimension = 800
                    
                    while True:
                        # Resize if needed
                        if max(image.size) > max_dimension:
                            ratio = max_dimension / max(image.size)
                            new_size = tuple(int(dim * ratio) for dim in image.size)
                            resized_image = image.resize(new_size, Image.Resampling.LANCZOS)
                        else:
                            resized_image = image
                        
                        # Compress to bytes
                        img_byte_arr = BytesIO()
                        resized_image.save(img_byte_arr, format='JPEG', quality=quality, optimize=True)
                        compressed_data = img_byte_arr.getvalue()
                        
                        # Check size
                        if len(compressed_data) <= max_size_kb * 1024:
                            logger.info(f"✅ Compressed image to {len(compressed_data)} bytes (quality={quality}, size={resized_image.size})")
                            return base64.b64encode(compressed_data).decode('utf-8')
                        
                        # Reduce quality or size
                        if quality > 50:
                            quality -= 15
                        elif max_dimension > 400:
                            max_dimension -= 100
                        else:
                            logger.warning(f"⚠️ Cannot compress image under {max_size_kb}KB limit")
                            return None
                            
        except Exception as e:
            logger.error(f"❌ Error processing image {image_url}: {e}")
            return None

    async def generate_text_embedding(self, text: str) -> Optional[List[float]]:
        """Generate text embedding using LangChain Google embeddings"""
        if not self.google_api_key:
            logger.warning("⚠️ Google API key not configured")
            return None
            
        try:
            embeddings = await self._get_text_embeddings()
            if not embeddings:
                return None
            
            # LangChain handles the API call
            embedding = await asyncio.get_event_loop().run_in_executor(
                None, 
                lambda: embeddings.embed_query(text)
            )
            
            logger.info(f"✅ Generated LangChain text embedding with {len(embedding)} dimensions")
            return embedding
            
        except Exception as e:
            logger.error(f"❌ LangChain text embedding generation failed: {e}")
            return None

    async def generate_image_embedding(self, image_url: str) -> Optional[List[float]]:
        """Generate image embedding using LangChain (fallback to description-based)"""
        if not self.google_api_key:
            logger.warning("⚠️ Google API key not configured")
            return None
            
        try:
            # Since Google's embedding API doesn't reliably handle images,
            # we'll analyze the image first and then embed the description
            analysis = await self.analyze_image_with_gemini(image_url)
            if not analysis:
                return None
            
            # Create a comprehensive text description
            description_parts = [
                analysis.get('description', ''),
                f"Visual styles: {', '.join(analysis.get('styles', []))}",
                f"Color palette: {', '.join(analysis.get('colors', []))}",
                f"Aesthetic mood: {analysis.get('mood', '')}",
                f"Design elements: {analysis.get('design_elements', '')}"
            ]
            
            full_description = ". ".join(filter(None, description_parts))
            
            # Generate text embedding for the comprehensive description
            embedding = await self.generate_text_embedding(full_description)
            
            if embedding:
                logger.info(f"✅ Generated image embedding via description analysis")
            
            return embedding
            
        except Exception as e:
            logger.error(f"❌ Image embedding generation failed: {e}")
            return None

    async def analyze_image_with_gemini(self, image_url: str) -> Optional[dict]:
        """Analyze image content using LangChain Google Vision LLM"""
        try:
            if not self.google_api_key:
                logger.warning("⚠️ Google API key not configured")
                return None
            
            # Download and compress image
            image_b64 = await self._download_and_compress_image(image_url)
            if not image_b64:
                return None
            
            llm = await self._get_vision_llm()
            if not llm:
                return None
            
            # Create vision message using LangChain format
            message = HumanMessage(
                content=[
                    {
                        "type": "text",
                        "text": """Analyze this image and provide a detailed description focusing on:
- Overall aesthetic and style (modern, vintage, minimalist, maximalist, etc.)
- Colors and color palette (specific color names and combinations)
- Design elements and patterns (geometric, organic, textural, etc.)
- Mood and atmosphere (calm, energetic, sophisticated, playful, etc.)
- Fashion/interior design style if applicable
- Any distinctive visual characteristics

Respond with ONLY a JSON object in this format:
{
    "description": "Detailed description of the image",
    "styles": ["style1", "style2", "style3"],
    "colors": ["color1", "color2", "color3"],
    "mood": "overall mood/atmosphere",
    "design_elements": "key design elements",
    "aesthetic_score": 0.85
}"""
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_b64}"
                        }
                    }
                ]
            )
            
            # Get response from LangChain
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: llm.invoke([message])
            )
            
            if response.content:
                try:
                    # Clean the response text
                    response_text = response.content.strip()
                    if response_text.startswith('```json'):
                        response_text = response_text.replace('```json', '').replace('```', '').strip()
                    elif response_text.startswith('```'):
                        response_text = response_text.replace('```', '').strip()
                    
                    analysis_data = json.loads(response_text)
                    logger.info(f"✅ Generated image analysis with LangChain Gemini")
                    return analysis_data
                    
                except json.JSONDecodeError as e:
                    logger.error(f"❌ Failed to parse LangChain Gemini response: {e}")
                    logger.error(f"Raw response: {response.content}")
                    return None
            
            return None
            
        except Exception as e:
            logger.error(f"❌ LangChain Gemini image analysis failed: {e}")
            return None

# Global service instance
embedding_service = EmbeddingService() 