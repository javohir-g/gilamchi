from sqlalchemy import String, Float, ForeignKey, DECIMAL, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from .base import UUIDMixin, TimestampMixin
from ..database import Base
import uuid

class Expense(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "expenses"
    
    amount: Mapped[float] = mapped_column(DECIMAL(18, 6), nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False, default="branch") # "branch" or "staff"
    branch_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("branches.id"), nullable=False)
    seller_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    staff_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"), nullable=True)
    exchange_rate: Mapped[float] = mapped_column(DECIMAL(18, 6), default=12200.0)
    is_usd: Mapped[bool] = mapped_column(default=False)
    
    # Relationships
    staff_member = relationship("User", foreign_keys=[staff_id])
    seller = relationship("User", foreign_keys=[seller_id])
