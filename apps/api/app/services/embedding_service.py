import os
import logging
import asyncio
import aiohttp
import base64
import json
import google.generativeai as genai

from PIL import Image, ImageChops
from typing import List, Optional, Union
from io import BytesIO

logger = logging.getLogger(__name__)

class EmbeddingService:
    """Service for generating embeddings and analyzing images using the native Google AI SDK"""
    
    def __init__(self):
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        if not self.google_api_key:
            logger.warning("⚠️ GOOGLE_API_KEY not found. Embedding features will be limited.")
        else:
            genai.configure(api_key=self.google_api_key)
        
        self._vision_model = None

    def _get_vision_model(self):
        """Get native Google AI vision model instance"""
        if self._vision_model is None:
            try:
                self._vision_model = genai.GenerativeModel('gemini-1.5-flash')
                logger.info("✅ Native Google Vision model initialized")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Google Vision model: {e}")
                return None
        return self._vision_model

    async def _crop_image_borders(self, image: Image.Image) -> Image.Image:
        """Crops black or white borders from an image by finding the bounding box of the content."""
        try:
            bg = Image.new(image.mode, image.size, image.getpixel((0, 0)))
            diff = ImageChops.difference(image, bg)
            diff = ImageChops.add(diff, diff, 2.0, -20)
            bbox = diff.getbbox()
            if bbox:
                logger.info(f"Cropping image from {image.size} to bounding box: {bbox}")
                return image.crop(bbox)
        except Exception as e:
            logger.warning(f"⚠️ Could not auto-crop image, using original. Error: {e}")
        return image

    async def _download_and_compress_image(self, image_url: str, max_size_kb: int = 30) -> Optional[str]:
        """Download and compress image to base64, staying under size limit"""
        try:
            # Add a browser-like User-Agent to avoid 403 Forbidden errors
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            async with aiohttp.ClientSession() as session:
                async with session.get(image_url, timeout=30, headers=headers) as response:
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

    async def _compress_b64_image(self, image_b64: str, max_size_kb: int = 30) -> Optional[str]:
        """Compress an existing base64 image to stay under size limit"""
        try:
            image_data = base64.b64decode(image_b64)
            image = Image.open(BytesIO(image_data))
            image = await self._crop_image_borders(image)

            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            quality = 85
            max_dimension = 800
            
            while True:
                if max(image.size) > max_dimension:
                    ratio = max_dimension / max(image.size)
                    new_size = tuple(int(dim * ratio) for dim in image.size)
                    resized_image = image.resize(new_size, Image.Resampling.LANCZOS)
                else:
                    resized_image = image
                
                img_byte_arr = BytesIO()
                resized_image.save(img_byte_arr, format='JPEG', quality=quality, optimize=True)
                compressed_data = img_byte_arr.getvalue()
                
                if len(compressed_data) <= max_size_kb * 1024:
                    logger.info(f"✅ Compressed base64 image to {len(compressed_data)} bytes")
                    return base64.b64encode(compressed_data).decode('utf-8')
                
                if quality > 50:
                    quality -= 15
                elif max_dimension > 400:
                    max_dimension -= 100
                else:
                    logger.warning(f"⚠️ Cannot compress base64 image under {max_size_kb}KB limit")
                    return None
        except Exception as e:
            logger.error(f"❌ Error compressing base64 image: {e}")
            return None

    async def generate_text_embedding(self, text: str) -> Optional[List[float]]:
        """Generate text embedding using the native Google AI SDK"""
        if not self.google_api_key:
            logger.warning("⚠️ Google API key not configured")
            return None
        try:
            result = await asyncio.to_thread(
                genai.embed_content,
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document"
            )
            embedding = result['embedding']
            logger.info(f"✅ Generated text embedding with {len(embedding)} dimensions")
            return embedding
        except Exception as e:
            logger.error(f"❌ Text embedding generation failed: {e}")
            return None

    async def generate_image_embedding(self, image_url: str = None, image_b64: str = None) -> Optional[List[float]]:
        """
        Generates an embedding vector by first analyzing the image with Gemini Vision
        to get a text description, and then generating an embedding from that text.
        """
        logger.info("Starting image embedding generation process...")
        if not self.google_api_key:
            logger.warning("⚠️ Google API key not configured, cannot generate embedding.")
            return None

        # 1. Analyze the image to get a structured text description.
        try:
            logger.info("Step 1: Analyzing image with Gemini Vision...")
            analysis_data = await self.analyze_image_with_gemini(
                image_url=image_url, image_b64=image_b64
            )
            if not analysis_data:
                logger.warning("Image analysis returned no data. Cannot generate embedding.")
                return None
            logger.info("✅ Image analysis successful.")
        except Exception as e:
            logger.error(f"❌ Error during image analysis step: {e}", exc_info=True)
            return None

        # 2. Combine the analysis results into a single comprehensive text block.
        try:
            logger.info("Step 2: Compiling text from analysis for embedding.")
            description = analysis_data.get("description", "")
            styles = ", ".join(analysis_data.get("styles", []))
            colors = ", ".join(analysis_data.get("colors", []))
            mood = analysis_data.get("mood", "")
            elements = analysis_data.get("design_elements", "")

            comprehensive_text = (
                f"Style analysis of product image. "
                f"Description: {description}. "
                f"Identified Styles: {styles}. "
                f"Color Palette: {colors}. "
                f"Overall Mood: {mood}. "
                f"Design Elements: {elements}."
            )
            logger.info(f"-> Compiled text for embedding: '{comprehensive_text[:150]}...'")
        except Exception as e:
            logger.error(f"❌ Error compiling text from analysis data: {e}", exc_info=True)
            return None

        # 3. Generate an embedding from the comprehensive text.
        try:
            logger.info("Step 3: Generating embedding from compiled text.")
            embedding = await self.generate_text_embedding(text=comprehensive_text)
            if not embedding:
                logger.warning("Text embedding generation failed.")
                return None
            
            logger.info(f"✅ Successfully generated image-to-text embedding.")
            return embedding
        except Exception as e:
            logger.error(f"❌ Error during text embedding generation step: {e}", exc_info=True)
            return None
    
    async def analyze_image_with_gemini(self, image_url: str = None, image_b64: str = None) -> Optional[dict]:
        """Analyze image content using the native Google AI SDK, preserving the original interface."""
        if not self.google_api_key:
            logger.warning("⚠️ Google API key not configured")
            return None
        try:
            final_image_b64 = None
            if image_b64:
                final_image_b64 = await self._compress_b64_image(image_b64)
            elif image_url:
                final_image_b64 = await self._download_and_compress_image(image_url)

            if not final_image_b64:
                return None

            llm = self._get_vision_model()
            if not llm:
                return None
            
            image_data = base64.b64decode(final_image_b64)
            img = Image.open(BytesIO(image_data))

            prompt = """Analyze this image and provide a detailed description focusing on:
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
            
            response = await llm.generate_content_async([prompt, img])
            
            if response.text:
                try:
                    response_text = response.text.strip()
                    if response_text.startswith('```json'):
                        response_text = response_text.replace('```json', '').replace('```', '').strip()
                    elif response_text.startswith('```'):
                        response_text = response_text.replace('```', '').strip()
                    analysis_data = json.loads(response_text)
                    logger.info(f"✅ Generated image analysis with native Gemini")
                    return analysis_data
                except json.JSONDecodeError as e:
                    logger.error(f"❌ Failed to parse Gemini response: {e}")
                    logger.error(f"Raw response: {response.text}")
                    return None
            return None
        except Exception as e:
            logger.error(f"❌ Native Gemini image analysis failed: {e}")
            return None

# Global service instance
embedding_service = EmbeddingService() 