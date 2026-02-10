from sqlalchemy import String, Boolean, ForeignKey, Uuid, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timedelta, timezone
import uuid
from .base import UUIDMixin, TimestampMixin, Base

class InvitationLink(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "invitation_links"

    token: Mapped[str] = mapped_column(String, unique=True, index=True)
    branch_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("branches.id"), nullable=True)
    role: Mapped[str] = mapped_column(String, default="seller")
    username_hint: Mapped[str | None] = mapped_column(String, nullable=True)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    # Relationships
    branch = relationship("Branch")

    def is_valid(self):
        return not self.is_used and self.expires_at > datetime.now(timezone.utc)
