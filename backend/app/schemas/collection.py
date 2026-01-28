from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime

class CollectionBase(BaseModel):
    name: str
    icon: Optional[str] = None
    price_per_sqm: Optional[float] = None

class CollectionCreate(CollectionBase):
    pass

class CollectionResponse(CollectionBase):
    id: UUID4
    created_at: datetime
    
    class Config:
        from_attributes = True

class SizeBase(BaseModel):
    size: str
    collection_id: Optional[UUID4] = None

class SizeCreate(SizeBase):
    pass

class SizeResponse(SizeBase):
    id: UUID4
    created_at: datetime
    
    class Config:
        from_attributes = True
