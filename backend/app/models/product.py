from sqlalchemy import String, Integer, BigInteger, Float, Enum as SQLEnum, ForeignKey, Uuid, JSON, DECIMAL
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
import uuid
from .base import UUIDMixin, TimestampMixin, SoftDeleteMixin, Base

class ProductCategory(str, enum.Enum):
    GILAMLAR = "Gilamlar"
    METRAJLAR = "Metrajlar"
    OVALNIY = "Ovalniy"
    KOVRIK = "Kovrik"

class ProductType(str, enum.Enum):
    UNIT = "unit"
    METER = "meter"

class Product(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String)
    category: Mapped[ProductCategory] = mapped_column(SQLEnum(ProductCategory))
    collection: Mapped[str | None] = mapped_column(String, index=True, nullable=True)
    type: Mapped[ProductType] = mapped_column(SQLEnum(ProductType))
    
    buy_price: Mapped[float] = mapped_column(DECIMAL(15, 2))
    sell_price: Mapped[float] = mapped_column(DECIMAL(15, 2))
    sell_price_per_meter: Mapped[float | None] = mapped_column(DECIMAL(15, 2), nullable=True)
    
    quantity: Mapped[int] = mapped_column(BigInteger, default=0)
    remaining_length: Mapped[float | None] = mapped_column(DECIMAL(10, 2), nullable=True)
    total_length: Mapped[float | None] = mapped_column(DECIMAL(10, 2), nullable=True) # Initial total length
    
    max_quantity: Mapped[int | None] = mapped_column(BigInteger, nullable=True) # For stock tracking visualization (progres bar)
    width: Mapped[float | None] = mapped_column(Float, nullable=True)
    
    available_sizes: Mapped[list[str] | None] = mapped_column(JSON, nullable=True) # e.g. ["2x3", "3x4"]
    photo: Mapped[str | None] = mapped_column(String, nullable=True)
    image_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    
    branch_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("branches.id"))

    # Relationships
    branch = relationship("Branch", back_populates="products")
    # sales = relationship("Sale", back_populates="product")
