from sqlalchemy import Column, String, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, timezone
from .base import Base, UUIDMixin, TimestampMixin
import uuid

class Expense(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "expenses"
    
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False, default="branch") # "branch" or "staff"
    branch_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("branches.id"), nullable=False)
    seller_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
