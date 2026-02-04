from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID

class SettingsBase(BaseModel):
    exchange_rate: float

class SettingsUpdate(BaseModel):
    exchange_rate: float

class SettingsResponse(SettingsBase):
    id: UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
