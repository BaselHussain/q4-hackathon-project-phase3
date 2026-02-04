"""
Message model for AI Chat functionality.

Represents a single message within a conversation.
"""
import enum
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, Enum, ForeignKey, JSON, Text
from sqlalchemy.sql import func
from sqlmodel import Field, SQLModel


class MessageRole(str, enum.Enum):
    """Enum for message author roles."""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class Message(SQLModel, table=True):
    """
    Represents a single message in a conversation.

    Attributes:
        id: Unique message identifier (UUID)
        conversation_id: Parent conversation (foreign key)
        role: Message author role (user/assistant/system)
        content: Message text content
        tool_calls: Array of tool invocations (assistant messages only)
        created_at: When the message was created
    """
    __tablename__ = "messages"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    conversation_id: UUID = Field(
        sa_column=Column(
            "conversation_id",
            ForeignKey("conversations.id", ondelete="CASCADE"),
            nullable=False,
            index=True
        )
    )
    role: MessageRole = Field(
        sa_column=Column(
            Enum(MessageRole, name="message_role", create_type=True),
            nullable=False
        )
    )
    content: str = Field(sa_column=Column(Text, nullable=False))
    tool_calls: Optional[list] = Field(
        default=None,
        sa_column=Column(JSON, nullable=True)
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now()
        )
    )
