from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
from typing import List, Optional
import uuid

from app.models.product import Product
from app.config.database import get_db
from app.schemas.product import ProductRead as ProductSchema
from app.services.auth_service import get_current_user_id

router = APIRouter()

@router.get("/recommendations", response_model=List[ProductSchema])
async def get_style_recommendations(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
    match_threshold: float = Query(0.75, ge=0.0, le=1.0),
    match_count: int = Query(20, ge=1, le=100)
):
    """
    Get personalized product recommendations based on user's style profile.
    """
    try:
        # 1. Get the user's average style embedding
        style_embedding_query = text("SELECT get_user_style_embedding(:user_id)")
        result = await db.execute(style_embedding_query, {"user_id": user_id})
        style_embedding = result.scalar_one_or_none()

        if style_embedding is None:
            # No style profile yet, return empty list or fallback recommendations
            return []

        # 2. Find matching products using the embedding
        match_query = text("""
            SELECT * FROM match_products_by_style(
                :embedding,
                :match_threshold,
                :match_count
            )
        """)
        result = await db.execute(
            match_query,
            {
                "embedding": style_embedding,
                "match_threshold": match_threshold,
                "match_count": match_count,
            },
        )
        
        products = result.mappings().all()
        return products
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Could not retrieve recommendations.")

@router.get("", response_model=List[ProductSchema])
async def get_products(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=1000)
):
    """
    Retrieve a list of products from the database.
    """
    try:
        stmt = select(Product).offset(skip).limit(limit).order_by(Product.created_at.desc())
        result = await db.execute(stmt)
        products = result.scalars().all()
        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{product_id}", response_model=ProductSchema)
async def get_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve a single product by its UUID.
    """
    try:
        stmt = select(Product).where(Product.id == product_id)
        result = await db.execute(stmt)
        product = result.scalars().first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 