import uuid
from pydantic import BaseModel, Field
from typing import List, Optional
from pydantic import HttpUrl

class ProductBase(BaseModel):
    name: str
    brand: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    currency: str
    image_url: str
    product_url: str
    category: Optional[str] = None
    is_on_sale: Optional[bool] = False
    description: Optional[str] = None
    sizes: Optional[List[str]] = None
    colors: Optional[List[str]] = None
    material: Optional[str] = None
    gender_tag: str
    source: str

class ProductCreate(ProductBase):
    pass

class ProductRead(ProductBase):
    id: uuid.UUID

    class Config:
        from_attributes = True

class ScrapeRequest(BaseModel):
    urls: List[str]
    limit_per_url: int = 10 