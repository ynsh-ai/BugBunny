import uuid
from datetime import UTC, datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import relationship

from app.core.database import Base


class AgentRun(Base):
    """Database model tracking an individual specialist agent execution step."""

    __tablename__ = "agent_runs"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    investigation_id = Column(Uuid, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)

    stage = Column(String(64), nullable=False)  # Requirements Analysis, Bug Investigation, etc.
    agent_name = Column(String(128), nullable=False)
    status = Column(String(64), default="pending", nullable=False)  # pending, in_progress, complete, failed
    model = Column(String(64), default="Gemini 1.5 Pro", nullable=False)
    duration = Column(String(32), nullable=True)
    summary = Column(Text, nullable=True)
    artifacts = Column(JSON, nullable=True)
    mode = Column(String(32), default="demo", nullable=False)

    started_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    investigation = relationship("Investigation", back_populates="agent_runs")
    agent_artifacts = relationship("AgentArtifact", back_populates="agent_run", cascade="all, delete-orphan")
