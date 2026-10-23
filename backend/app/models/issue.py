from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class GitHubIssue(Base):
    """Database model representing an ingested GitHub issue."""

    __tablename__ = "github_issues"

    id = Column(Integer, primary_key=True, index=True)
    issue_key = Column(String(64), unique=True, index=True, nullable=False)  # e.g., "PP-101"
    repository_id = Column(Integer, ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False)
    github_issue_number = Column(Integer, nullable=True)  # e.g., 101

    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)
    author = Column(String(128), default="developer", nullable=False)
    status = Column(String(64), default="open", nullable=False)  # open, investigating, completed, closed
    priority = Column(String(32), default="high", nullable=False)  # critical, high, medium, low

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
