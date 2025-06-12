from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
import uuid

from app.models.product import Product
from app.config.database import get_db
from app.schemas.product import ProductRead as ProductSchema

router = APIRouter()

@router.get("", response_model=List[ProductSchema])
async def get_products(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100)
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