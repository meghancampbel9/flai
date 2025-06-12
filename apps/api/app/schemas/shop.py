from pydantic import BaseModel
import uuid
from datetime import datetime

class CartItemBase(BaseModel):
    product_id: uuid.UUID
    quantity: int = 1

class CartItemCreate(CartItemBase):
    pass

class CartItem(CartItemBase):
    id: uuid.UUID
    user_id: uuid.UUID
    added_at: datetime

    class Config:
        from_attributes = True

class WishlistItemBase(BaseModel):
    product_id: uuid.UUID

class WishlistItemCreate(WishlistItemBase):
    pass

class WishlistItem(WishlistItemBase):
    id: uuid.UUID
    user_id: uuid.UUID
    added_at: datetime

    class Config:
        from_attributes = True

class ClosetItem(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    product_id: uuid.UUID
    added_at: datetime
    purchase_date: datetime

    class Config:
        from_attributes = True

class CheckoutResponse(BaseModel):
    message: str
    closet_item_count: int 