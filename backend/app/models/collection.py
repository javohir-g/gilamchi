from sqlalchemy import String, Uuid, ForeignKey, DECIMAL
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import UUIDMixin, TimestampMixin, SoftDeleteMixin, Base
import uuid

class Collection(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "collections"

    name: Mapped[str] = mapped_column(String, unique=True, index=True)
    icon: Mapped[str | None] = mapped_column(String, nullable=True) # Emoji or text
    price_per_sqm: Mapped[float | None] = mapped_column(DECIMAL(15, 2), nullable=True) # This is effectively Sell Price
    buy_price_per_sqm: Mapped[float | None] = mapped_column(DECIMAL(15, 2), nullable=True)
    price_usd_per_sqm: Mapped[float | None] = mapped_column(DECIMAL(10, 2), nullable=True) # Price in USD per m²

class Size(UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "sizes"

    size: Mapped[str] = mapped_column(String) # e.g. "2x3"
    collection_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("collections.id"), nullable=True) # Null means global
    
    # Relationships
    collection = relationship("Collection")
