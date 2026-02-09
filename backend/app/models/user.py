from sqlalchemy import String, Boolean, Enum as SQLEnum, ForeignKey, Uuid, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from .base import UUIDMixin, TimestampMixin, SoftDeleteMixin, Base
import uuid

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    SELLER = "seller"

class User(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=True)
    telegram_id: Mapped[int | None] = mapped_column(BigInteger, unique=True, index=True, nullable=True)
    full_name: Mapped[str | None] = mapped_column(String, nullable=True)
    role: Mapped[UserRole] = mapped_column(SQLEnum(UserRole))
    branch_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("branches.id"), nullable=True)
    can_add_products: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationships
    branch = relationship("Branch", back_populates="users")
    # sales = relationship("Sale", back_populates="seller")
    # debts = relationship("Debt", back_populates="seller")
