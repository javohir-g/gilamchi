from sqlalchemy import String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import UUIDMixin, TimestampMixin, SoftDeleteMixin, Base
import uuid

class Branch(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "branches"

    name: Mapped[str] = mapped_column(String, unique=True)
    address: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)

    # Relationships
    users = relationship("User", back_populates="branch")
    products = relationship("Product", back_populates="branch")
    sales = relationship("Sale", back_populates="branch")
    debts = relationship("Debt", back_populates="branch")
