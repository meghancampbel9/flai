import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.config.database import get_db
from app.schemas.shop import CartItem, CartItemCreate, WishlistItem, WishlistItemCreate, ClosetItem, CheckoutResponse
from app.schemas.product import ProductRead as Product

router = APIRouter(tags=["shop"])

@router.post("/cart/{user_id}/items", status_code=status.HTTP_201_CREATED, response_model=CartItem)
async def add_item_to_cart(user_id: str, cart_item: CartItemCreate, db: AsyncSession = Depends(get_db)):
    async with db.begin():
        query = text("""
            INSERT INTO cart_items (user_id, product_id, quantity)
            VALUES (:user_id, :product_id, :quantity)
            ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = cart_items.quantity + :quantity
            RETURNING id, user_id, product_id, quantity, added_at;
        """)
        result = await db.execute(query, {"user_id": user_id, "product_id": cart_item.product_id, "quantity": cart_item.quantity})
        new_item = result.fetchone()
    
    if not new_item:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not add item to cart")
    return new_item

@router.get("/cart/{user_id}/items", response_model=List[Product])
async def get_cart_items(user_id: str, db: AsyncSession = Depends(get_db)):
    query = text("""
        SELECT p.* FROM products p
        JOIN cart_items ci ON p.id = ci.product_id
        WHERE ci.user_id = :user_id;
    """)
    result = await db.execute(query, {"user_id": user_id})
    items = result.fetchall()
    if not items:
        return []
    return items

@router.delete("/cart/{user_id}/items/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_item_from_cart(user_id: str, product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    async with db.begin():
        query = text("DELETE FROM cart_items WHERE user_id = :user_id AND product_id = :product_id RETURNING id;")
        result = await db.execute(query, {"user_id": user_id, "product_id": product_id})
        if not result.fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found in cart")
    return

@router.post("/cart/{user_id}/checkout", status_code=200)
async def checkout(user_id: str, db: AsyncSession = Depends(get_db)):
    async with db.begin():
        # 1. Get product IDs already in the user's closet
        existing_closet_query = text("SELECT product_id FROM closet_items WHERE user_id = :user_id")
        existing_closet_result = await db.execute(existing_closet_query, {"user_id": user_id})
        existing_product_ids = {row[0] for row in existing_closet_result.fetchall()}

        # 2. Get all items from the user's cart
        cart_items_query = text("SELECT product_id FROM cart_items WHERE user_id = :user_id")
        cart_items_result = await db.execute(cart_items_query, {"user_id": user_id})
        cart_items = cart_items_result.fetchall()

        if not cart_items:
            return {"message": "Cart is empty."}

        # 3. Filter out items that are already in the closet
        new_items_to_add = [
            item for item in cart_items if item[0] not in existing_product_ids
        ]

        # 4. Insert only the new items into the closet
        if new_items_to_add:
            insert_values = [{"user_id": user_id, "product_id": item[0]} for item in new_items_to_add]
            await db.execute(
                text("INSERT INTO closet_items (user_id, product_id) VALUES (:user_id, :product_id)"),
                insert_values
            )

        # 5. Clear the entire cart
        delete_query = text("DELETE FROM cart_items WHERE user_id = :user_id")
        await db.execute(delete_query, {"user_id": user_id})
        
    return {"message": "Checkout successful"}

@router.post("/wishlist/{user_id}/items", status_code=status.HTTP_201_CREATED, response_model=WishlistItem)
async def add_item_to_wishlist(user_id: str, wishlist_item: WishlistItemCreate, db: AsyncSession = Depends(get_db)):
    async with db.begin():
        query = text("""
            INSERT INTO wishlist_items (user_id, product_id)
            VALUES (:user_id, :product_id)
            ON CONFLICT (user_id, product_id) DO NOTHING
            RETURNING id, user_id, product_id, added_at;
        """)
        result = await db.execute(query, {"user_id": user_id, "product_id": wishlist_item.product_id})
        new_item = result.fetchone()

    if new_item:
        return new_item

    select_query = text("SELECT * FROM wishlist_items WHERE user_id = :user_id AND product_id = :product_id;")
    result = await db.execute(select_query, {"user_id": user_id, "product_id": wishlist_item.product_id})
    existing_item = result.fetchone()

    if not existing_item:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to add or find item in wishlist.")
    
    return existing_item

@router.get("/wishlist/{user_id}/items", response_model=List[Product])
async def get_wishlist_items(user_id: str, db: AsyncSession = Depends(get_db)):
    query = text("""
        SELECT p.* FROM products p
        JOIN wishlist_items wi ON p.id = wi.product_id
        WHERE wi.user_id = :user_id;
    """)
    result = await db.execute(query, {"user_id": user_id})
    items = result.fetchall()
    if not items:
        return []
    return items

@router.delete("/wishlist/{user_id}/items/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_item_from_wishlist(user_id: str, product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    async with db.begin():
        query = text("DELETE FROM wishlist_items WHERE user_id = :user_id AND product_id = :product_id RETURNING id;")
        result = await db.execute(query, {"user_id": user_id, "product_id": product_id})
        if not result.fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found in wishlist")
    return

@router.get("/closet/{user_id}/items", response_model=List[Product])
async def get_closet_items(user_id: str, db: AsyncSession = Depends(get_db)):
    query = text("""
        SELECT p.* FROM products p
        JOIN closet_items ci ON p.id = ci.product_id
        WHERE ci.user_id = :user_id;
    """)
    result = await db.execute(query, {"user_id": user_id})
    items = result.fetchall()
    if not items:
        return []
    return items

@router.get("/wishlist/{user_id}/ids", response_model=List[uuid.UUID])
async def get_wishlist_item_ids(user_id: str, db: AsyncSession = Depends(get_db)):
    query = text("SELECT product_id FROM wishlist_items WHERE user_id = :user_id;")
    result = await db.execute(query, {"user_id": user_id})
    return [row[0] for row in result.fetchall()] 