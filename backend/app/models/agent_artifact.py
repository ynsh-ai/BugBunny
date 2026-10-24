import uuid
from datetime import UTC, datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, String, Uuid
from sqlalchemy.orm import relationship

from app.core.database import Base


class AgentArtifact(Base):
    """Database model tracking artifacts (diffs, plans, logs, test outputs) created by agents."""

    __tablename__ = "agent_artifacts"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    investigation_id = Column(Uuid, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    agent_run_id = Column(Uuid, ForeignKey("agent_runs.id", ondelete="SET NULL"), nullable=True)

    artifact_type = Column(String(64), nullable=False)  # diff, plan, evidence, test_results, review, doc
    name = Column(String(256), nullable=False)
    content = Column(JSON, nullable=False)
    mode = Column(String(32), default="demo", nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    investigation = relationship("Investigation", back_populates="artifacts")
    agent_run = relationship("AgentRun", back_populates="agent_artifacts")
