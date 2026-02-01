from pydantic import BaseModel, UUID4, field_serializer
from typing import Optional, Union
from datetime import datetime, timezone
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
    admin_profit: float = 0
    seller_profit: float = 0
    is_nasiya: bool = False
    width: Optional[float] = None
    length: Optional[float] = None
    area: Optional[float] = None

class SaleCreate(BaseModel):
    product_id: UUID4
    quantity: float
    payment_type: PaymentType
    amount: Optional[float] = None # Can be calculated, or provided
    order_id: Optional[str] = None
    width: Optional[float] = None
    length: Optional[float] = None
    area: Optional[float] = None
    size: Optional[str] = None
    is_nasiya: bool = False

class SaleResponse(SaleBase):
    id: UUID4
    date: datetime
    created_at: datetime
    order_id: Optional[str] = None
    product: Optional[ProductResponse] = None
    
    @field_serializer('date', 'created_at')
    def serialize_dt(self, dt: datetime, _info):
        return dt.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%fZ')

    class Config:
        from_attributes = True
