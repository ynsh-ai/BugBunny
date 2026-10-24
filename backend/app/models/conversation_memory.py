import uuid
from datetime import UTC, datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import relationship

from app.core.database import Base


class ConversationMemory(Base):
    """Database model storing multi-agent conversational turns and memory context."""

    __tablename__ = "conversation_memories"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    investigation_id = Column(Uuid, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)

    role = Column(String(32), nullable=False)  # user, assistant, system, agent
    agent_name = Column(String(128), nullable=True)
    content = Column(Text, nullable=False)
    metadata_json = Column(JSON, nullable=True)
    mode = Column(String(32), default="demo", nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    investigation = relationship("Investigation", back_populates="memories")
