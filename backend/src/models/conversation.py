"""
Conversation model for AI Chat functionality.

Represents a chat session between a user and the AI assistant.
"""
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.sql import func
from sqlmodel import Field, SQLModel


class Conversation(SQLModel, table=True):
    """
    Represents a chat conversation session.

    Attributes:
        id: Unique conversation identifier (UUID)
        user_id: Owner of the conversation (foreign key to users.id)
        title: Optional title for the conversation
        created_at: When the conversation was created
        updated_at: When the conversation was last updated
    """
    __tablename__ = "conversations"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(
        sa_column=Column(
            "user_id",
            ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True
        )
    )
    title: Optional[str] = Field(default=None, max_length=200)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now()
        )
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
            onupdate=func.now()
        )
    )
