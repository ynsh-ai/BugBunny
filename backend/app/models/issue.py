from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from app.core.database import Base


class Issue(Base):
    """Placeholder model representing a tracked GitHub issue."""

    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    github_url = Column(String(512), nullable=False, index=True)
    repo_owner = Column(String(128), nullable=False)
    repo_name = Column(String(128), nullable=False)
    issue_number = Column(Integer, nullable=False)
    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(64), default="pending", nullable=False)  # pending, in_progress, resolved, failed

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )
