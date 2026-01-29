from sqlalchemy import String, ForeignKey, Uuid, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import UUIDMixin, TimestampMixin, SoftDeleteMixin, Base
import uuid

class Staff(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "staff"

    name: Mapped[str] = mapped_column(String, index=True)
    branch_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("branches.id"), index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    branch = relationship("Branch", back_populates="staff_members")
    expenses = relationship("Expense", back_populates="staff_member")
