"""
Styling Router - Virtual Try-On API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import logging

from app.config.database import get_db
from app.services.auth_service import get_current_user_id
from app.services.styling_service import styling_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Styling"])


# Request/Response Models
class CreateSessionRequest(BaseModel):
    """Request to create a new styling session"""
    pass  # User ID comes from auth


class CreateSessionResponse(BaseModel):
    """Response with new session info"""
    session_id: str
    message: str


class ChatRequest(BaseModel):
    """Request to send a chat message"""
    session_id: str
    message: str


class SelectedItem(BaseModel):
    """A selected closet item"""
    id: str
    name: str
    image_url: Optional[str] = None


class ChatResponse(BaseModel):
    """Response from chat with optional generated image"""
    success: bool
    message: str
    image_base64: Optional[str] = None
    selected_items: List[SelectedItem] = []
    session_id: str
    error: Optional[str] = None


class ChatHistoryMessage(BaseModel):
    """A message in chat history"""
    role: str
    content: str
    image_url: Optional[str] = None
    timestamp: str
    selected_items: Optional[List[Dict]] = None


class ChatHistoryResponse(BaseModel):
    """Chat history response"""
    session_id: str
    messages: List[ChatHistoryMessage]


# Endpoints

@router.post("/session", response_model=CreateSessionResponse)
async def create_styling_session(
    user_id: str = Depends(get_current_user_id)
):
    """
    Create a new styling session.
    Each session maintains its own chat history and generated images.
    Sessions are not persisted - they reset when the app is closed.
    """
    try:
        session_id = styling_service.create_session(user_id)
        logger.info(f"✅ Created styling session {session_id} for user {user_id}")
        
        return CreateSessionResponse(
            session_id=session_id,
            message="Welcome to your personal styling session! Tell me what look you'd like to create."
        )
    except Exception as e:
        logger.error(f"❌ Failed to create session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create styling session"
        )


@router.post("/chat", response_model=ChatResponse)
async def send_chat_message(
    request: ChatRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Send a message in the styling chat.
    
    The AI will:
    1. Understand your styling request
    2. Find matching items from your closet (RAG)
    3. Generate a styled image with those items
    
    Example messages:
    - "Style me for a New Year's Eve party"
    - "Create a casual summer outfit"
    - "Change the top to something more formal"
    - "Make the pants black instead"
    """
    try:
        # Verify session exists and belongs to user
        session = styling_service.get_session(request.session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found. Please create a new session."
            )
        
        if session.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this session"
            )
        
        # Fetch user's closet items for RAG
        closet_query = text("""
            SELECT p.id, p.name, p.brand, p.description, p.image_url, 
                   p.category, p.colors, p.material, p.sizes
            FROM products p
            JOIN closet_items ci ON p.id = ci.product_id
            WHERE ci.user_id = :user_id
        """)
        result = await db.execute(closet_query, {"user_id": user_id})
        closet_rows = result.fetchall()
        
        # Convert to list of dicts
        closet_items = []
        for row in closet_rows:
            closet_items.append({
                "id": str(row.id),
                "name": row.name,
                "brand": row.brand,
                "description": row.description,
                "image_url": row.image_url,
                "category": row.category,
                "colors": row.colors or [],
                "material": row.material,
                "sizes": row.sizes or []
            })
        
        logger.info(f"📦 Found {len(closet_items)} items in user's closet")
        
        # Process the styling request
        response = await styling_service.process_styling_request(
            session_id=request.session_id,
            user_message=request.message,
            closet_items=closet_items
        )
        
        if response.get("error"):
            return ChatResponse(
                success=False,
                message=response.get("message", "An error occurred"),
                session_id=request.session_id,
                error=response.get("error")
            )
        
        return ChatResponse(
            success=True,
            message=response.get("message", ""),
            image_base64=response.get("image_base64"),
            selected_items=[
                SelectedItem(**item) for item in response.get("selected_items", [])
            ],
            session_id=request.session_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Chat error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process message: {str(e)}"
        )


@router.get("/history/{session_id}", response_model=ChatHistoryResponse)
async def get_chat_history(
    session_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get the chat history for a session.
    """
    try:
        session = styling_service.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        if session.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this session"
            )
        
        history = styling_service.get_chat_history(session_id)
        
        return ChatHistoryResponse(
            session_id=session_id,
            messages=[ChatHistoryMessage(**msg) for msg in history]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get chat history"
        )


@router.delete("/session/{session_id}")
async def delete_session(
    session_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Delete/clear a styling session.
    """
    try:
        session = styling_service.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        if session.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this session"
            )
        
        styling_service.clear_session(session_id)
        
        return {"success": True, "message": "Session cleared"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete session"
        )


@router.get("/base-image")
async def get_base_model_image():
    """
    Get the base model image (model.avif) as base64.
    Used by the frontend to display the initial model.
    """
    try:
        base_image = await styling_service._load_base_model_image()
        if not base_image:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Base model image not found"
            )
        
        # Convert to JPEG for better compatibility
        jpeg_data = await styling_service._convert_avif_to_jpeg(base_image)
        if not jpeg_data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process base image"
            )
        
        import base64
        image_b64 = base64.b64encode(jpeg_data).decode('utf-8')
        
        return {
            "success": True,
            "image_base64": image_b64
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting base image: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get base image"
        )

