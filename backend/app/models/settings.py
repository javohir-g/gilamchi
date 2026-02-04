from sqlalchemy import Float, DECIMAL
from sqlalchemy.orm import Mapped, mapped_column
from .base import UUIDMixin, TimestampMixin, Base

class Settings(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "settings"

    exchange_rate: Mapped[float] = mapped_column(DECIMAL(15, 2), default=12200.0)
    # Future settings can be added here
