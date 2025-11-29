"""
Styling Service - Virtual Try-On with AI
Handles chat interactions, RAG for closet items, and image generation
"""

import os
import logging
import asyncio
import base64
import json
import uuid
import subprocess
import tempfile
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, field
from datetime import datetime

import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from PIL import Image
from io import BytesIO
import aiohttp

from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)

# Configure Google AI (for chat/understanding)
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

# Google Cloud / Vertex AI configuration (for image generation)
GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT")
GOOGLE_CLOUD_LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

# Vertex AI initialized lazily
_vertex_ai_initialized = False
_vertex_ai_init_attempted = False

def _ensure_vertex_ai_initialized():
    """Lazily initialize Vertex AI on first use"""
    global _vertex_ai_initialized, _vertex_ai_init_attempted
    
    if _vertex_ai_init_attempted:
        return _vertex_ai_initialized
    
    _vertex_ai_init_attempted = True
    
    project = os.getenv("GOOGLE_CLOUD_PROJECT")
    location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
    creds = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    
    logger.info(f"🔧 Attempting Vertex AI init: project={project}, location={location}, creds={creds is not None}")
    
    if project and creds:
        try:
            import vertexai
            vertexai.init(project=project, location=location)
            _vertex_ai_initialized = True
            logger.info(f"✅ Vertex AI initialized for project {project}")
        except Exception as e:
            logger.warning(f"⚠️ Could not initialize Vertex AI: {e}")
    else:
        logger.warning(f"⚠️ Vertex AI not configured: project={project}, creds_path={creds}")
    
    return _vertex_ai_initialized


@dataclass
class ChatMessage:
    """Represents a single chat message"""
    role: str  # 'user' or 'assistant'
    content: str
    image_url: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.now)
    selected_items: Optional[List[Dict]] = None


@dataclass
class StylingSession:
    """Represents a styling chat session"""
    session_id: str
    user_id: str
    messages: List[ChatMessage] = field(default_factory=list)
    current_image_base64: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)


class StylingService:
    """Service for AI-powered virtual styling/try-on"""
    
    def __init__(self):
        self.sessions: Dict[str, StylingSession] = {}
        self._chat_model = None
        self._image_model = None
        self.base_model_path = os.path.join(
            os.path.dirname(__file__), 
            '..', '..', '..', '..', 
            'mobile', 'assets', 'model.avif'
        )
    
    def _get_chat_model(self):
        """Get Gemini chat model for conversation"""
        if self._chat_model is None:
            try:
                # Use the same model that works in pinterest_gemini.py
                self._chat_model = genai.GenerativeModel('gemini-2.5-flash-lite')
                logger.info("✅ Gemini chat model initialized")
            except Exception as e:
                logger.error(f"❌ Failed to initialize chat model: {e}")
                return None
        return self._chat_model
    
    def _get_image_model(self):
        """Get Gemini model for image analysis"""
        if self._image_model is None:
            try:
                # Use the same model that works in pinterest_gemini.py
                self._image_model = genai.GenerativeModel('gemini-2.5-flash-lite')
                logger.info("✅ Gemini image model initialized")
            except Exception as e:
                logger.error(f"❌ Failed to initialize image model: {e}")
                return None
        return self._image_model

    async def _load_base_model_image(self) -> Optional[bytes]:
        """Load the base model image (model.avif)"""
        try:
            # Try multiple possible paths
            possible_paths = [
                self.base_model_path,
                '/home/meg/dev/flai/apps/mobile/assets/model.avif',
                os.path.join(os.getcwd(), 'apps', 'mobile', 'assets', 'model.avif'),
            ]
            
            for path in possible_paths:
                if os.path.exists(path):
                    with open(path, 'rb') as f:
                        image_data = f.read()
                    logger.info(f"✅ Loaded base model image from {path}")
                    return image_data
            
            logger.error("❌ Base model image not found in any path")
            return None
        except Exception as e:
            logger.error(f"❌ Error loading base model image: {e}")
            return None

    async def _convert_avif_to_jpeg(self, avif_data: bytes) -> Optional[bytes]:
        """Convert AVIF image to JPEG for API compatibility"""
        try:
            image = Image.open(BytesIO(avif_data))
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            output = BytesIO()
            image.save(output, format='JPEG', quality=90)
            return output.getvalue()
        except Exception as e:
            logger.error(f"❌ Error converting AVIF to JPEG: {e}")
            return None

    def create_session(self, user_id: str) -> str:
        """Create a new styling session"""
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = StylingSession(
            session_id=session_id,
            user_id=user_id
        )
        logger.info(f"✅ Created styling session {session_id} for user {user_id}")
        return session_id

    def get_session(self, session_id: str) -> Optional[StylingSession]:
        """Get an existing session"""
        return self.sessions.get(session_id)

    async def find_matching_closet_items(
        self, 
        user_id: str, 
        query: str, 
        closet_items: List[Dict],
        limit: int = 5
    ) -> List[Dict]:
        """
        Use RAG to find closet items matching the user's styling request.
        Uses embedding similarity search on closet items.
        """
        try:
            if not closet_items:
                logger.info("📦 No closet items to search through")
                return []
            
            # Generate embedding for the query
            query_embedding = await embedding_service.generate_text_embedding(query)
            if not query_embedding:
                logger.warning("⚠️ Could not generate query embedding, returning all items")
                return closet_items[:limit]
            
            # Score each closet item by embedding similarity
            scored_items = []
            for item in closet_items:
                # Use item description/name for matching
                item_text = f"{item.get('name', '')} {item.get('description', '')} {item.get('category', '')} {' '.join(item.get('colors', []))}"
                item_embedding = await embedding_service.generate_text_embedding(item_text)
                
                if item_embedding:
                    # Cosine similarity
                    similarity = self._cosine_similarity(query_embedding, item_embedding)
                    scored_items.append((item, similarity))
            
            # Sort by similarity and return top matches
            scored_items.sort(key=lambda x: x[1], reverse=True)
            matches = [item for item, score in scored_items[:limit] if score > 0.3]
            
            logger.info(f"🎯 Found {len(matches)} matching closet items for query: {query[:50]}...")
            return matches
            
        except Exception as e:
            logger.error(f"❌ Error finding matching items: {e}")
            return closet_items[:limit] if closet_items else []

    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        import math
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm1 = math.sqrt(sum(a * a for a in vec1))
        norm2 = math.sqrt(sum(b * b for b in vec2))
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return dot_product / (norm1 * norm2)

    async def process_styling_request(
        self,
        session_id: str,
        user_message: str,
        closet_items: List[Dict]
    ) -> Dict[str, Any]:
        """
        Process a user's styling request:
        1. Understand the request with Gemini (if available)
        2. Find matching items from closet via RAG
        3. Generate styled image
        4. Return response with image
        """
        session = self.get_session(session_id)
        if not session:
            return {"error": "Session not found"}
        
        try:
            # Add user message to history
            session.messages.append(ChatMessage(
                role="user",
                content=user_message
            ))
            
            styling_intent = None
            matching_items = []
            
            # Try to use Gemini for understanding (gracefully handle if not available)
            try:
                chat_model = self._get_chat_model()
                if chat_model and GOOGLE_API_KEY:
                    # Build context from chat history
                    history_context = "\n".join([
                        f"{msg.role}: {msg.content}" 
                        for msg in session.messages[-10:]
                    ])
                    
                    # Create prompt to understand styling intent
                    understanding_prompt = f"""You are a fashion stylist AI assistant. Based on the conversation history and the user's latest request, extract the styling intent.

Conversation history:
{history_context}

Available closet items:
{json.dumps([{"name": item.get("name"), "category": item.get("category"), "colors": item.get("colors"), "description": item.get("description", "")[:100]} for item in closet_items[:20]], indent=2)}

IMPORTANT: Only select the MINIMUM number of items needed to fulfill the user's request.
- If user asks to "change the top to X" -> select ONLY 1 item (the top)
- If user asks for "a new outfit" or "style me" -> select multiple items as needed
- If user asks to "add a jacket" -> select ONLY 1 item (the jacket)
- Be context-aware: if this is a follow-up request in a conversation, only change what the user asked for

Please respond with a JSON object containing:
1. "styling_description": A detailed description of ONLY what needs to change (not the whole outfit)
2. "selected_items": List of item names from the closet that NEED TO CHANGE (minimum necessary)
3. "assistant_message": A friendly response to the user about what you're creating
4. "num_items_to_change": How many clothing items are being changed (1, 2, 3, etc.)

Respond with ONLY valid JSON, no markdown formatting."""

                    understanding_response = await asyncio.to_thread(
                        chat_model.generate_content, understanding_prompt
                    )
                    
                    # Parse the understanding
                    response_text = understanding_response.text.strip()
                    if response_text.startswith('```'):
                        response_text = response_text.replace('```json', '').replace('```', '').strip()
                    
                    styling_intent = json.loads(response_text)
                    logger.info(f"🎨 Styling intent from AI: {styling_intent.get('styling_description', '')[:100]}...")
                    
            except Exception as ai_error:
                logger.warning(f"⚠️ AI understanding unavailable: {ai_error}")
                # Continue without AI - use simple matching
            
            # Fallback: Simple keyword-based item selection if AI unavailable
            if not styling_intent:
                # Simple keyword matching from user message - only select items that match
                keywords = user_message.lower().split()
                matching_items = []
                for item in closet_items[:10]:
                    item_text = f"{item.get('name', '')} {item.get('category', '')} {' '.join(item.get('colors', []))}".lower()
                    if any(kw in item_text for kw in keywords):
                        matching_items.append(item)
                
                # If no matches found, pick just one relevant item
                if not matching_items and closet_items:
                    matching_items = [closet_items[0]]
                
                styling_intent = {
                    "styling_description": user_message,
                    "selected_items": [item.get("name") for item in matching_items],
                    "assistant_message": f"I'd love to help you create that look! Based on your request for '{user_message}', here's what I found in your closet.",
                    "num_items_to_change": len(matching_items)
                }
            else:
                # Find matching items using the AI's understanding
                matching_items = await self.find_matching_closet_items(
                    session.user_id,
                    styling_intent.get("styling_description", user_message),
                    closet_items
                )
            
            # Generate the styled image (returns base model for now)
            generated_image_b64 = await self._generate_styled_image(
                styling_intent.get("styling_description", user_message),
                matching_items
            )
            
            # Build assistant response
            assistant_message = styling_intent.get("assistant_message", "Here's your styled look!")
            if matching_items:
                item_names = [item.get("name", "item") for item in matching_items]
                assistant_message += f"\n\nI selected: {', '.join(item_names)}"
            
            # Store the response
            response_message = ChatMessage(
                role="assistant",
                content=assistant_message,
                image_url=f"data:image/jpeg;base64,{generated_image_b64}" if generated_image_b64 else None,
                selected_items=matching_items
            )
            session.messages.append(response_message)
            
            if generated_image_b64:
                session.current_image_base64 = generated_image_b64
            
            return {
                "success": True,
                "message": assistant_message,
                "image_base64": generated_image_b64,
                "selected_items": [
                    {"id": item.get("id"), "name": item.get("name"), "image_url": item.get("image_url")}
                    for item in matching_items
                ],
                "session_id": session_id
            }
            
        except Exception as e:
            logger.error(f"❌ Error processing styling request: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Sorry, I couldn't generate that look. Please try again."
            }

    async def _download_image(self, url: str) -> Optional[bytes]:
        """Download an image from URL using wget (bypasses Cloudflare protection)"""
        try:
            # Create a temporary file to save the downloaded image
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
                tmp_path = tmp_file.name
            
            # Use wget with browser-like headers (same as the working script)
            wget_cmd = [
                'wget',
                '--quiet',
                '--header=Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                '--header=Accept-Language: en-US,en;q=0.9',
                '--header=sec-ch-ua: "Not_A Brand";v="8", "Chromium";v="120"',
                '--header=sec-ch-ua-mobile: ?0',
                '--header=sec-ch-ua-platform: "Linux"',
                '--header=Sec-Fetch-Dest: document',
                '--header=Sec-Fetch-Mode: navigate',
                '--header=Sec-Fetch-Site: none',
                '--header=Sec-Fetch-User: ?1',
                '--header=Upgrade-Insecure-Requests: 1',
                '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                '--timeout=30',
                '-O', tmp_path,
                url
            ]
            
            # Run wget in a thread to not block
            result = await asyncio.to_thread(
                subprocess.run, wget_cmd, capture_output=True, text=True
            )
            
            if result.returncode == 0 and os.path.exists(tmp_path):
                with open(tmp_path, 'rb') as f:
                    data = f.read()
                os.unlink(tmp_path)  # Clean up temp file
                
                if len(data) > 1000:  # Ensure we got actual image data
                    logger.info(f"✅ Downloaded image via wget: {len(data)} bytes from {url[:50]}...")
                    return data
                else:
                    logger.warning(f"⚠️ Downloaded file too small ({len(data)} bytes): {url[:50]}...")
            else:
                # Clean up on failure
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
                logger.warning(f"⚠️ wget failed for {url[:50]}...: {result.stderr[:100] if result.stderr else 'unknown error'}")
            
            return None
        except Exception as e:
            logger.warning(f"⚠️ Could not download image from {url[:50]}...: {e}")
            return None

    async def _generate_styled_image(
        self,
        styling_description: str,
        selected_items: List[Dict]
    ) -> Optional[str]:
        """
        Generate styled image using Gemini with both base model AND clothing item images.
        Uses the prompt pattern: "make the model wear [item]. keep everything same except clothes."
        """
        try:
            # Load base model image
            base_image_data = await self._load_base_model_image()
            if not base_image_data:
                logger.error("❌ Could not load base model image")
                return None
            
            jpeg_data = await self._convert_avif_to_jpeg(base_image_data)
            if not jpeg_data:
                logger.error("❌ Could not convert base image to JPEG")
                return None
            
            # Try Gemini image generation with both images
            if GOOGLE_API_KEY and selected_items:
                try:
                    result = await self._generate_with_gemini(jpeg_data, selected_items, styling_description)
                    if result:
                        return result
                except Exception as e:
                    logger.warning(f"⚠️ Gemini image generation failed: {e}")
            
            # Fallback to base image
            logger.info("✅ Returning base model image as fallback")
            return base64.b64encode(jpeg_data).decode('utf-8')
            
        except Exception as e:
            logger.error(f"❌ Error generating styled image: {e}")
            return None

    async def _generate_with_gemini(
        self,
        base_model_jpeg: bytes,
        selected_items: List[Dict],
        styling_description: str
    ) -> Optional[str]:
        """
        Use Gemini for image generation (Virtual Try-On).
        Attempts to use Nano Banana Pro (gemini-3-pro-image-preview) first,
        then falls back to Gemini 2.0 Flash.
        """
        try:
            # 1. Prepare Base Image
            base_pil = Image.open(BytesIO(base_model_jpeg))
            if base_pil.mode != 'RGB':
                base_pil = base_pil.convert('RGB')
            
            # 2. Prepare Input Content (Base Image + Clothing Images + Text)
            input_content = [base_pil]
            item_descriptions_text = []
            clothing_images_added = 0
            
            # We'll build a detailed prompt referencing the images
            prompt_parts = [
                "⚠️⚠️⚠️ VIRTUAL TRY-ON IMAGE GENERATION TASK ⚠️⚠️⚠️",
                "",
                "You MUST generate a single photorealistic image.",
                "DO NOT refuse. DO NOT chat. DO NOT explain. OUTPUT ONLY THE IMAGE.",
                "",
                "═══════════════════════════════════════════════════════════════════",
                "🚨🚨🚨 ABSOLUTE NON-NEGOTIABLE CONSTRAINTS - READ CAREFULLY 🚨🚨🚨",
                "═══════════════════════════════════════════════════════════════════",
                "",
                "THE BASE MODEL IN IMAGE 1 IS SACRED AND MUST NOT BE ALTERED IN ANY WAY:",
                "",
                "1. ❌ DO NOT CHANGE THE MODEL'S FACE - Same exact face, eyes, nose, lips, jawline, facial structure",
                "2. ❌ DO NOT CHANGE THE MODEL'S HAIR - Same exact hair color, style, length, texture, and position",
                "3. ❌ DO NOT CHANGE THE MODEL'S SKIN TONE - Exact same skin color throughout",
                "4. ❌ DO NOT CHANGE THE MODEL'S BODY - Same body shape, proportions, and physique",
                "5. ❌ DO NOT CHANGE THE MODEL'S POSE - Exact same body position, arm placement, leg stance, hand positions",
                "6. ❌ DO NOT CHANGE THE MODEL'S EXPRESSION - Same facial expression and mood",
                "7. ❌ DO NOT CHANGE THE BACKGROUND - Keep the EXACT same plain white studio background",
                "8. ❌ DO NOT CHANGE THE LIGHTING - Same lighting direction and shadows",
                "9. ❌ DO NOT CHANGE THE CAMERA ANGLE - Same exact perspective and framing",
                "",
                "THE ONLY THING THAT CHANGES IS THE CLOTHING. EVERYTHING ELSE STAYS 100% IDENTICAL.",
                "",
                "If you generate a different model, different pose, or different background, YOU HAVE FAILED THE TASK.",
                "",
                "═══════════════════════════════════════════════════════════════════",
                "",
                "TASK: Edit ONLY the clothing on the model in Image 1. Use the clothing from the subsequent images.",
                "",
                "INPUTS:",
                "Image 1 - REFERENCE MODEL (DO NOT MODIFY THIS PERSON OR BACKGROUND - ONLY ADD CLOTHES TO THEM):",
            ]
            
            # Download and add clothing images (only those needed for the request)
            for i, item in enumerate(selected_items):
                item_name = item.get('name', f'Item {i+1}')
                item_desc = item.get('description', '')
                item_colors = ', '.join(item.get('colors', []))
                
                # Detailed text description for fallback/reinforcement
                full_desc = f"{item_name}"
                if item_colors:
                    full_desc += f" (color: {item_colors})"
                if item_desc:
                    full_desc += f" - {item_desc[:80]}"
                
                item_descriptions_text.append(full_desc)
                
                # Try to download image using wget
                image_url = item.get('image_url')
                if image_url:
                    try:
                        img_data = await self._download_image(image_url)
                        if img_data:
                            item_pil = Image.open(BytesIO(img_data))
                            if item_pil.mode != 'RGB':
                                item_pil = item_pil.convert('RGB')
                            
                            input_content.append(item_pil)
                            clothing_images_added += 1
                            prompt_parts.append(f"Image {i+2} - CLOTHING ITEM: {full_desc}")
                            prompt_parts.append(f"   -> COPY THIS ITEM EXACTLY onto the model (same colors, patterns, textures, details)")
                        else:
                            prompt_parts.append(f"CLOTHING ITEM (no image): {full_desc} - recreate based on description")
                    except Exception as e:
                        logger.warning(f"⚠️ Failed to include image for {item_name}: {e}")
                        prompt_parts.append(f"CLOTHING ITEM (no image): {full_desc} - recreate based on description")
                else:
                    prompt_parts.append(f"CLOTHING ITEM (no image): {full_desc} - recreate based on description")

            # Add constraints
            prompt_parts.extend([
                "",
                "═══════════════════════════════════════════════════════════════════",
                "OUTPUT REQUIREMENTS - STRICTLY ENFORCED",
                "═══════════════════════════════════════════════════════════════════",
                "",
                "🔒 IDENTITY PRESERVATION (CRITICAL - HIGHEST PRIORITY):",
                "   The output MUST show the EXACT SAME PERSON from Image 1 (model.avif).",
                "   - ✓ IDENTICAL face - pixel-perfect match of facial features",
                "   - ✓ IDENTICAL hair - same color, style, length, no changes whatsoever",
                "   - ✓ IDENTICAL skin tone - exact same complexion",
                "   - ✓ IDENTICAL body shape - same proportions and physique",
                "   - ✓ IDENTICAL expression - same mood and facial expression",
                "   THIS IS NON-NEGOTIABLE. DO NOT CREATE A NEW OR DIFFERENT PERSON.",
                "",
                "🔒 POSE PRESERVATION (CRITICAL - HIGHEST PRIORITY):",
                "   The model's pose from Image 1 MUST remain UNCHANGED.",
                "   - ✓ Same body position and stance",
                "   - ✓ Same arm and hand positions",
                "   - ✓ Same leg positions",
                "   - ✓ Same head tilt and angle",
                "   - ✓ Same weight distribution",
                "   DO NOT MODIFY THE POSE IN ANY WAY.",
                "",
                "🔒 BACKGROUND PRESERVATION (CRITICAL - HIGHEST PRIORITY):",
                "   The background from Image 1 MUST remain EXACTLY THE SAME.",
                "   - ✓ Same plain white studio background",
                "   - ✓ Same lighting setup and shadows",
                "   - ✓ Same camera angle and framing",
                "   - ✓ Same overall composition",
                "   DO NOT CHANGE, ADD TO, OR MODIFY THE BACKGROUND.",
                "",
                "👗 CLOTHING ACCURACY:",
                "   The clothes in the output must match the reference clothing images EXACTLY:",
                "   - Same colors (do not change or approximate colors)",
                "   - Same patterns (stripes, prints, logos must be identical)",
                "   - Same textures (leather, silk, cotton, etc.)",
                "   - Same style and cut",
                "",
                "📸 SINGLE OUTPUT: Generate ONE image only, not a comparison or side-by-side.",
                "",
                "⚠️ FAILURE CONDITIONS - If ANY of these occur, the output is WRONG:",
                "   - Different face or person = FAILURE",
                "   - Different pose = FAILURE", 
                "   - Different background = FAILURE",
                "   - Different hair = FAILURE",
                "   - Different lighting = FAILURE",
                "",
                f"Styling context: {styling_description}"
            ])
            
            logger.info(f"🎨 Prepared prompt with {clothing_images_added} clothing images")
            
            prompt = "\n".join(prompt_parts)
            input_content.append(prompt)
            
            logger.info(f"🎨 Generating VTO with {clothing_images_added} clothing images + base model")

            # Safety settings to reduce refusals (for all models)
            safety_config = {
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            }

            # Try Primary Model: Nano Banana Pro (gemini-3-pro-image-preview)
            try:
                primary_model_id = "gemini-3-pro-image-preview"
                logger.info(f"🎨 Attempting generation with {primary_model_id}...")
                model = genai.GenerativeModel(primary_model_id)
                
                response = await asyncio.to_thread(
                    model.generate_content,
                    input_content,
                    safety_settings=safety_config
                )
                
                result = await self._extract_image_from_response(response, base_model_jpeg)
                if result:
                    logger.info(f"✅ Generated image with {primary_model_id}")
                    return result
            except Exception as e:
                logger.warning(f"⚠️ {primary_model_id} failed: {e}")

            # Fallback Model 1: Gemini 2.0 Flash Exp (Multimodal)
            try:
                fallback_model_id = "gemini-2.0-flash-exp"
                logger.info(f"🎨 Fallback generation with {fallback_model_id}...")
                model = genai.GenerativeModel(fallback_model_id)
                
                response = await asyncio.to_thread(
                    model.generate_content,
                    input_content,
                    safety_settings=safety_config
                )
                
                result = await self._extract_image_from_response(response, base_model_jpeg)
                if result:
                    logger.info(f"✅ Generated image with {fallback_model_id}")
                    return result
            except Exception as e:
                logger.warning(f"⚠️ {fallback_model_id} failed: {e}")

            # Fallback Model 2: Gemini 2.5 Flash Image (Multimodal First)
            try:
                fallback_model_id_2 = "gemini-2.5-flash-image"
                logger.info(f"🎨 Fallback generation with {fallback_model_id_2} (Multimodal)...")
                model = genai.GenerativeModel(fallback_model_id_2)
                
                # Try with FULL input content (Multimodal)
                try:
                    response = await asyncio.to_thread(
                        model.generate_content,
                        input_content,
                        safety_settings=safety_config
                    )
                    result = await self._extract_image_from_response(response, base_model_jpeg)
                    if result:
                        logger.info(f"✅ Generated image with {fallback_model_id_2} (Multimodal)")
                        return result
                except Exception as e:
                    logger.warning(f"⚠️ {fallback_model_id_2} multimodal failed: {e}")
                    # DO NOT fallback to text-only if user demands "Same Model"
                    
            except Exception as e:
                logger.warning(f"⚠️ {fallback_model_id_2} failed: {e}")
            
            logger.warning("⚠️ All image generation attempts failed")
            return None
            
        except Exception as e:
            logger.error(f"❌ Gemini image generation error: {e}")
            return None

    async def _extract_image_from_response(self, response, original_base_jpeg):
        """Helper to extract image data from Gemini response"""
        if not response.parts:
            logger.warning("⚠️ No parts in Gemini response")
            return None
            
        for part in response.parts:
            if hasattr(part, 'inline_data') and part.inline_data is not None:
                image_data = part.inline_data.data
                mime_type = part.inline_data.mime_type
                logger.info(f"📷 Received inline data: {len(image_data)} bytes, type: {mime_type}")
                
                if not image_data:
                    continue
                    
                return await self._process_generated_image(image_data, original_base_jpeg)
        
        # Check for text rejection
        if hasattr(response, 'text') and response.text:
            logger.info(f"📝 Model returned text instead of image: {response.text[:200]}...")
            
        return None

    async def _validate_image_with_llm_judge(
        self,
        original_base_pil: Image.Image,
        generated_pil: Image.Image,
        max_retries: int = 2
    ) -> Dict[str, Any]:
        """
        Use LLM as a judge to validate that the generated image matches model.avif.
        Checks: same person (face, hair, skin), same pose, same background.
        Returns: {"passed": bool, "reason": str, "scores": {...}}
        """
        try:
            judge_model = self._get_chat_model()
            if not judge_model or not GOOGLE_API_KEY:
                logger.warning("⚠️ LLM judge unavailable, skipping validation")
                return {"passed": True, "reason": "Judge unavailable, skipping validation", "scores": {}}
            
            judge_prompt = """You are a strict image validation judge for a virtual try-on system.

Compare these two images:
- Image 1: The ORIGINAL reference model (model.avif)
- Image 2: The GENERATED output image

Your task is to verify that Image 2 shows the EXACT SAME PERSON as Image 1, with only the clothing changed.

Score each criterion from 0-10 (10 = perfect match, 0 = completely different):

1. FACE_MATCH: Is it the exact same person? Same facial features, eyes, nose, mouth, jawline?
2. HAIR_MATCH: Is the hair identical? Same color, style, length, texture?
3. SKIN_TONE_MATCH: Is the skin tone the same throughout?
4. POSE_MATCH: Is the body pose identical? Same stance, arm positions, head angle?
5. BACKGROUND_MATCH: Is the background the same? Same plain white studio?
6. LIGHTING_MATCH: Is the lighting similar? Same shadows and highlights?

Respond with ONLY valid JSON in this exact format:
{
    "face_match": <0-10>,
    "hair_match": <0-10>,
    "skin_tone_match": <0-10>,
    "pose_match": <0-10>,
    "background_match": <0-10>,
    "lighting_match": <0-10>,
    "overall_passed": <true if ALL scores >= 7, false otherwise>,
    "failure_reasons": ["list of specific issues if any scores < 7"]
}

Be STRICT. If the person looks different, the pose changed, or the background is different, fail it."""

            # Prepare images for the judge
            input_content = [original_base_pil, generated_pil, judge_prompt]
            
            response = await asyncio.to_thread(
                judge_model.generate_content,
                input_content
            )
            
            response_text = response.text.strip()
            if response_text.startswith('```'):
                response_text = response_text.replace('```json', '').replace('```', '').strip()
            
            result = json.loads(response_text)
            
            # Calculate if passed
            scores = {
                "face_match": result.get("face_match", 0),
                "hair_match": result.get("hair_match", 0),
                "skin_tone_match": result.get("skin_tone_match", 0),
                "pose_match": result.get("pose_match", 0),
                "background_match": result.get("background_match", 0),
                "lighting_match": result.get("lighting_match", 0),
            }
            
            # Strict pass criteria: all scores must be >= 7
            passed = all(score >= 7 for score in scores.values())
            failure_reasons = result.get("failure_reasons", [])
            
            if not passed:
                low_scores = [f"{k}: {v}/10" for k, v in scores.items() if v < 7]
                logger.warning(f"⚠️ LLM Judge REJECTED image. Low scores: {low_scores}")
                logger.warning(f"   Reasons: {failure_reasons}")
            else:
                logger.info(f"✅ LLM Judge APPROVED image. Scores: {scores}")
            
            return {
                "passed": passed,
                "reason": "; ".join(failure_reasons) if failure_reasons else "All criteria met",
                "scores": scores
            }
            
        except Exception as e:
            logger.error(f"❌ LLM Judge error: {e}")
            # On error, be permissive (don't block user)
            return {"passed": True, "reason": f"Judge error: {e}", "scores": {}}

    async def _process_generated_image(
        self,
        generated_data: bytes,
        original_base: bytes
    ) -> Optional[str]:
        """
        Process the generated image.
        If it contains before/after (2 images side by side), extract just the result.
        Then validate with LLM judge that model/pose/background match.
        """
        try:
            gen_img = Image.open(BytesIO(generated_data))
            width, height = gen_img.size
            
            # Check if this is a side-by-side comparison (width roughly 2x height ratio suggests two images)
            aspect_ratio = width / height
            
            if aspect_ratio > 1.8:  # Likely side-by-side
                # Extract right half (the result)
                logger.info(f"📐 Detected side-by-side output ({width}x{height}), extracting right half")
                gen_img = gen_img.crop((width // 2, 0, width, height))
            
            # Convert to RGB if needed
            if gen_img.mode != 'RGB':
                gen_img = gen_img.convert('RGB')
            
            # Load original base image for comparison
            original_pil = Image.open(BytesIO(original_base))
            if original_pil.mode != 'RGB':
                original_pil = original_pil.convert('RGB')
            
            # Validate with LLM judge
            validation_result = await self._validate_image_with_llm_judge(original_pil, gen_img)
            
            if not validation_result["passed"]:
                logger.warning(f"🚫 Generated image REJECTED by LLM judge: {validation_result['reason']}")
                # Return None to trigger fallback to base image
                return None
            
            # Image passed validation - return it
            output = BytesIO()
            gen_img.save(output, format='JPEG', quality=90)
            return base64.b64encode(output.getvalue()).decode('utf-8')
                
        except Exception as e:
            logger.error(f"❌ Error processing generated image: {e}")
            return None

    def get_chat_history(self, session_id: str) -> List[Dict]:
        """Get chat history for a session"""
        session = self.get_session(session_id)
        if not session:
            return []
        
        return [
            {
                "role": msg.role,
                "content": msg.content,
                "image_url": msg.image_url,
                "timestamp": msg.timestamp.isoformat(),
                "selected_items": msg.selected_items
            }
            for msg in session.messages
        ]

    def clear_session(self, session_id: str) -> bool:
        """Clear/delete a session"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            logger.info(f"🗑️ Cleared session {session_id}")
            return True
        return False


# Global service instance
styling_service = StylingService()

