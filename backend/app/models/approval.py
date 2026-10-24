import uuid
from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import relationship

from app.core.database import Base


class ApprovalDecision(Base):
    """Database model recording human-in-the-loop approval or rejection decisions."""

    __tablename__ = "approval_decisions"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    investigation_id = Column(Uuid, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)

    decision = Column(String(32), nullable=False)  # approved, rejected, comment
    reviewer = Column(String(128), default="developer", nullable=False)
    notes = Column(Text, nullable=True)
    mode = Column(String(32), default="demo", nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    investigation = relationship("Investigation", back_populates="decisions")
