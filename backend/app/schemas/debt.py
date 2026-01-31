from pydantic import BaseModel, UUID4
from typing import Optional, List
from datetime import datetime, date
from ..models.debt import DebtStatus

class PaymentBase(BaseModel):
    amount: float
    note: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    id: UUID4
    payment_date: datetime
    recorded_by: UUID4
    
    class Config:
        from_attributes = True

class DebtBase(BaseModel):
    debtor_name: str
    phone_number: Optional[str] = None
    order_details: str
    branch_id: UUID4
    total_amount: float
    paid_amount: float = 0
    remaining_amount: float
    payment_deadline: date
    status: DebtStatus = DebtStatus.PENDING

class DebtCreate(BaseModel):
    debtor_name: str
    phone_number: Optional[str] = None
    order_details: str
    total_amount: float
    paid_amount: float = 0
    payment_deadline: date

class DebtResponse(DebtBase):
    id: UUID4
    seller_id: UUID4
    created_at: datetime
    updated_at: datetime
    payments: List[PaymentResponse] = []
    
    class Config:
        from_attributes = True
