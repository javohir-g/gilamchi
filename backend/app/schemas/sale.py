from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime
from ..models.sale import PaymentType
from .product import ProductResponse

class SaleBase(BaseModel):
    product_id: UUID4
    branch_id: UUID4
    seller_id: UUID4 # Typically set by backend from current user
    quantity: float
    amount: float
    payment_type: PaymentType
    profit: float = 0

class SaleCreate(BaseModel):
    product_id: UUID4
    quantity: float
    payment_type: PaymentType
    amount: Optional[float] = None # Can be calculated, or provided
    order_id: Optional[str] = None

class SaleResponse(SaleBase):
    id: UUID4
    date: datetime
    created_at: datetime
    order_id: Optional[str] = None
    product: Optional[ProductResponse] = None
    
    class Config:
        from_attributes = True
