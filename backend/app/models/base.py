from sqlalchemy import Column, DateTime, Boolean, ForeignKey, Uuid
from sqlalchemy.orm import mapped_column, Mapped
from datetime import datetime, timezone
import uuid
from ..database import Base

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class SoftDeleteMixin:
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # user_id of who deleted it. Using Uuid type.
    # We avoid ForeignKey here to strictly decouple or circular imports, but usually it's fine. 
    # For now, just storing the UUID is enough.
    deleted_by: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True) 

class UUIDMixin:
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
