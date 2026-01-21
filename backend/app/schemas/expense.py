from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional

class ExpenseBase(BaseModel):
    amount: float
    description: str
    branch_id: UUID4
    seller_id: UUID4

class ExpenseCreate(BaseModel):
    amount: float
    description: str

class ExpenseResponse(ExpenseBase):
    id: UUID4
    created_at: datetime
    
    class Config:
        from_attributes = True
