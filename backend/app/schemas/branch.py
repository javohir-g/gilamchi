from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime

class BranchBase(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None

class BranchCreate(BranchBase):
    pass

class BranchUpdate(BranchBase):
    pass

class BranchResponse(BranchBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
