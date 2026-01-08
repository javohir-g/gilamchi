from sqlalchemy import String, Uuid, ForeignKey, JSON, DateTime, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import UUIDMixin, TimestampMixin, Base # AuditLog probably shouldn't be soft deleted? Or maybe it should. Let's keep it simple.
import uuid
import enum

class AuditAction(str, enum.Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"

class AuditLog(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "audit_logs"

    user_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"), nullable=True)
    action: Mapped[AuditAction] = mapped_column(SQLEnum(AuditAction))
    entity_type: Mapped[str] = mapped_column(String) # e.g. "product", "sale"
    entity_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
    changes: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String, nullable=True)
    
    # Relationships
    user = relationship("User")
