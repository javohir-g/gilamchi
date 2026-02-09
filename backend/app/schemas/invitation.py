from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime

class InvitationCreate(BaseModel):
    branch_id: Optional[UUID4] = None
    role: str = "seller"
    expires_in_hours: int = 24

class InvitationResponse(BaseModel):
    id: UUID4
    token: str
    branch_id: Optional[UUID4]
    role: str
    is_used: bool
    expires_at: datetime
    url: str

    class Config:
        from_attributes = True
