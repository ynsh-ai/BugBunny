from datetime import UTC, datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Investigation(Base):
    """Database model tracking an automated root-cause investigation session."""

    __tablename__ = "investigations"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("github_issues.id", ondelete="CASCADE"), nullable=False)

    status = Column(String(64), default="in_progress", nullable=False)  # in_progress, completed, failed
    root_cause_summary = Column(Text, nullable=True)
    evidence = Column(JSON, nullable=True)
    proposed_plan = Column(JSON, nullable=True)
    code_diff = Column(Text, nullable=True)
    test_results = Column(JSON, nullable=True)
    review_audit = Column(JSON, nullable=True)
    documentation = Column(JSON, nullable=True)

    branch_name = Column(String(128), nullable=True)
    target_commit = Column(String(64), nullable=True)

    started_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    issue = relationship("GitHubIssue", back_populates="investigations")
    agent_runs = relationship("AgentRun", back_populates="investigation", cascade="all, delete-orphan")
    decisions = relationship("ApprovalDecision", back_populates="investigation", cascade="all, delete-orphan")
