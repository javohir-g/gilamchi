from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime
from ..models.user import UserRole
import uuid

class UserBase(BaseModel):
    username: str
    role: UserRole = UserRole.SELLER
    branch_id: Optional[UUID4] = None
    can_add_products: bool = False

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    password: Optional[str] = None
    role: Optional[UserRole] = None
    branch_id: Optional[UUID4] = None
    can_add_products: Optional[bool] = None

class UserResponse(UserBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
