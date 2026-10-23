from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class ApprovalDecision(Base):
    """Database model recording human-in-the-loop approval or rejection decisions."""

    __tablename__ = "approval_decisions"

    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)

    decision = Column(String(32), nullable=False)  # approved, rejected
    reviewer = Column(String(128), default="developer", nullable=False)
    notes = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationship
    investigation = relationship("Investigation", back_populates="decisions")
