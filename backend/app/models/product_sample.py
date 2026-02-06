from sqlalchemy import ForeignKey, Uuid, LargeBinary
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from .base import UUIDMixin, TimestampMixin, Base

class ProductSample(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "product_samples"

    product_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("products.id"), index=True)
    
    # CLIP embedding (512-dimensional float32 vector)
    embedding: Mapped[bytes] = mapped_column(LargeBinary)

    # Relationship to product
    product = relationship("Product", backref="samples")
