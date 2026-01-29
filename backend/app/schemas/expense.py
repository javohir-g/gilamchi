from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional

class ExpenseBase(BaseModel):
    amount: float
    description: str
    category: str = "branch"
    branch_id: Optional[UUID4] = None
    staff_id: Optional[UUID4] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    id: UUID4
    created_at: datetime
    
    class Config:
        from_attributes = True
