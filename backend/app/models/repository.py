from datetime import UTC, datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Repository(Base):
    """Database model representing a tracked code repository."""

    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), unique=True, index=True, nullable=False)
    owner = Column(String(128), nullable=False, default="ynsh-ai")
    github_url = Column(String(512), nullable=False)
    default_branch = Column(String(64), nullable=False, default="main")
    is_active = Column(Boolean, default=True, nullable=False)

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
    issues = relationship("GitHubIssue", back_populates="repository", cascade="all, delete-orphan")
