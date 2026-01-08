from sqlalchemy import String, Integer, Float, Enum as SQLEnum, ForeignKey, Uuid, DECIMAL, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
import uuid
from datetime import date as date_type
from .base import UUIDMixin, TimestampMixin, SoftDeleteMixin, Base

class DebtStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"

class Debt(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "debts"

    customer_name: Mapped[str] = mapped_column(String)
    customer_phone: Mapped[str | None] = mapped_column(String, nullable=True)
    
    branch_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("branches.id"))
    seller_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"))
    
    total_amount: Mapped[float] = mapped_column(DECIMAL(15, 2))
    remaining_amount: Mapped[float] = mapped_column(DECIMAL(15, 2))
    paid_amount: Mapped[float] = mapped_column(DECIMAL(15, 2), default=0)
    
    payment_deadline: Mapped[date_type] = mapped_column(DateTime) # Using DateTime for simplicity in SQLite usually, checking logic needed
    status: Mapped[DebtStatus] = mapped_column(SQLEnum(DebtStatus), default=DebtStatus.PENDING, index=True)

    # Relationships
    branch = relationship("Branch", back_populates="debts")
    seller = relationship("User")
    payments = relationship("Payment", back_populates="debt", cascade="all, delete-orphan")

class Payment(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "payments"

    debt_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("debts.id"))
    amount: Mapped[float] = mapped_column(DECIMAL(15, 2))
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    payment_date: Mapped[date_type] = mapped_column(DateTime, default=lambda: datetime.utcnow())
    
    recorded_by: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"))
    
    # Relationships
    debt = relationship("Debt", back_populates="payments")
    recorder = relationship("User")
