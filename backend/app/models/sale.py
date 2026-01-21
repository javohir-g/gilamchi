from sqlalchemy import String, Integer, Float, Enum as SQLEnum, ForeignKey, Uuid, DECIMAL, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
import uuid
from datetime import datetime, timezone
from .base import UUIDMixin, TimestampMixin, SoftDeleteMixin, Base

class PaymentType(str, enum.Enum):
    CASH = "cash"
    CARD = "card"
    TRANSFER = "transfer"

class Sale(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "sales"

    product_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("products.id"))
    branch_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("branches.id"))
    seller_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"))
    
    quantity: Mapped[float] = mapped_column(DECIMAL(10, 2)) # Can be length for metraj
    amount: Mapped[float] = mapped_column(DECIMAL(15, 2)) # Total Sale Amount
    
    # New fields for square meter calculations
    width: Mapped[float | None] = mapped_column(DECIMAL(10, 2), nullable=True)
    length: Mapped[float | None] = mapped_column(DECIMAL(10, 2), nullable=True)
    area: Mapped[float | None] = mapped_column(DECIMAL(10, 2), nullable=True) # width * length * quantity
    
    payment_type: Mapped[PaymentType] = mapped_column(SQLEnum(PaymentType))
    profit: Mapped[float] = mapped_column(DECIMAL(15, 2), default=0) # Extra profit
    
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    order_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)

    # Relationships
    product = relationship("Product") # back_populates="sales" if defined there
    branch = relationship("Branch", back_populates="sales")
    seller = relationship("User") # back_populates="sales" if defined there
