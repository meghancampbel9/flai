import uuid
from sqlalchemy import Column, String, Float, Boolean, Text, ARRAY, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector

Base = declarative_base()

class Product(Base):
    __tablename__ = 'products'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    brand = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=True)
    currency = Column(String, nullable=False)
    image_url = Column(String, nullable=False)
    product_url = Column(String, nullable=False, unique=True)
    category = Column(String, nullable=True)
    is_on_sale = Column(Boolean, default=False)
    description = Column(Text, nullable=True)
    sizes = Column(ARRAY(String), nullable=True)
    colors = Column(ARRAY(String), nullable=True)
    material = Column(String, nullable=True)
    gender_tag = Column(String, nullable=True)
    source = Column(String, nullable=False)
    embedding = Column(Vector(768)) # 768 dimensions  
    created_at = Column(DateTime(timezone=True), server_default=func.now()) 