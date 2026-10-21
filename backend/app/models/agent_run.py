from datetime import UTC, datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text

from app.core.database import Base


class AgentRun(Base):
    """Placeholder model tracking an autonomous agent pipeline orchestration run."""

    __tablename__ = "agent_runs"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id", ondelete="CASCADE"), nullable=True)

    status = Column(String(64), default="initialized", nullable=False)  # initialized, analyzing, planning, patching, testing, reviewing, completed, failed
    current_stage = Column(String(64), default="requirements_analysis", nullable=False)

    requirements_spec = Column(JSON, nullable=True)
    codebase_context = Column(JSON, nullable=True)
    implementation_plan = Column(Text, nullable=True)
    unified_patch = Column(Text, nullable=True)
    test_run_results = Column(JSON, nullable=True)
    review_feedback = Column(Text, nullable=True)

    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
