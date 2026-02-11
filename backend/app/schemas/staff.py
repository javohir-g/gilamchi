from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime

class StaffBase(BaseModel):
    name: str
    branch_id: Optional[UUID4] = None
    is_active: bool = True

class StaffCreate(StaffBase):
    pass

class StaffUpdate(BaseModel):
    name: Optional[str] = None
    branch_id: Optional[UUID4] = None
    is_active: Optional[bool] = None

class StaffResponse(StaffBase):
    id: UUID4
    branch_id: UUID4 | None # Overriding inherited branch_id to make it optional
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
