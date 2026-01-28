from pydantic import BaseModel, UUID4, Field
from typing import Optional, List, Any, Union
from datetime import datetime
from ..models.product import ProductCategory, ProductType

class ProductBase(BaseModel):
    code: str
    category: ProductCategory
    collection: Optional[str] = None
    type: ProductType
    
    buy_price: float
    buy_price_usd: Optional[float] = None
    is_usd_priced: bool = False
    sell_price: float
    sell_price_per_meter: Optional[float] = None
    
    quantity: int = 0
    remaining_length: Optional[float] = None
    total_length: Optional[float] = None
    
    max_quantity: Optional[int] = None
    width: Optional[float] = None
    
    available_sizes: Optional[List[dict]] = None
    photo: Optional[str] = None
    
    branch_id: UUID4

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    code: Optional[str] = None
    category: Optional[ProductCategory] = None
    collection: Optional[str] = None
    type: Optional[ProductType] = None
    buy_price: Optional[float] = None
    buy_price_usd: Optional[float] = None
    is_usd_priced: Optional[bool] = None
    sell_price: Optional[float] = None
    sell_price_per_meter: Optional[float] = None
    quantity: Optional[int] = None
    remaining_length: Optional[float] = None
    total_length: Optional[float] = None
    max_quantity: Optional[int] = None
    width: Optional[float] = None
    available_sizes: Optional[List[dict]] = None
    photo: Optional[str] = None
    branch_id: Optional[UUID4] = None

class ProductResponse(ProductBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ProductSearchResult(ProductResponse):
    """
    Расширенная схема для результатов поиска по изображению.
    Включает процент похожести.
    """
    similarity_percentage: float = Field(
        ..., 
        description="Процент похожести (0-100%), где 100% - идентичное изображение"
    )
    hamming_distance: int = Field(
        ...,
        description="Hamming distance между хешами (чем меньше, тем лучше)"
    )
