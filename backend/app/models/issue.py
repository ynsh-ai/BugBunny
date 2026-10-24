import uuid
from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import relationship

from app.core.database import Base


class Issue(Base):
    """Database model representing a tracked software issue."""

    __tablename__ = "issues"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    issue_key = Column(String(64), unique=True, index=True, nullable=False)  # e.g., "PP-101"
    repository_id = Column(Uuid, ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False)
    github_issue_number = Column(Integer, nullable=True)

    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)
    author = Column(String(128), default="developer", nullable=False)
    status = Column(String(64), default="In progress", nullable=False)
    priority = Column(String(32), default="high", nullable=False)
    assigned_agent = Column(String(128), nullable=True)
    branch = Column(String(128), nullable=True)
    target_commit = Column(String(64), nullable=True)
    mode = Column(String(32), default="demo", nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    repository = relationship("Repository", back_populates="issues")
    investigations = relationship("Investigation", back_populates="issue", cascade="all, delete-orphan")


# Backward compatibility alias
GitHubIssue = Issue
