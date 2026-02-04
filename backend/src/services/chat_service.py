"""
Chat service for conversation and message management.

Provides CRUD operations for conversations and messages.
"""
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import OperationalError

from src.models.conversation import Conversation
from src.models.message import Message, MessageRole


class ChatServiceError(Exception):
    """Base exception for chat service errors."""
    pass


class ConversationNotFoundError(ChatServiceError):
    """Raised when conversation is not found or access denied."""
    pass


class DatabaseError(ChatServiceError):
    """Raised when database operation fails."""
    pass


async def create_conversation(
    db: AsyncSession,
    user_id: UUID,
    title: Optional[str] = None
) -> Conversation:
    """
    Create a new conversation for a user.

    Args:
        db: Database session
        user_id: Owner of the conversation
        title: Optional title for the conversation

    Returns:
        Created conversation

    Raises:
        DatabaseError: If database operation fails
    """
    try:
        conversation = Conversation(
            user_id=user_id,
            title=title
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        return conversation
    except OperationalError as e:
        await db.rollback()
        raise DatabaseError("Service temporarily unavailable") from e


async def get_conversation(
    db: AsyncSession,
    conversation_id: UUID,
    user_id: UUID
) -> Conversation:
    """
    Get a conversation by ID, verifying ownership.

    Args:
        db: Database session
        conversation_id: Conversation to retrieve
        user_id: Expected owner

    Returns:
        Conversation if found and owned by user

    Raises:
        ConversationNotFoundError: If not found or not owned by user
        DatabaseError: If database operation fails
    """
    try:
        conversation = await db.get(Conversation, conversation_id)
        if not conversation or conversation.user_id != user_id:
            raise ConversationNotFoundError("Conversation not found")
        return conversation
    except OperationalError as e:
        raise DatabaseError("Service temporarily unavailable") from e


async def list_conversations(
    db: AsyncSession,
    user_id: UUID
) -> list[dict]:
    """
    List all conversations for a user with message counts.

    Args:
        db: Database session
        user_id: User whose conversations to list

    Returns:
        List of conversation summaries with message_count

    Raises:
        DatabaseError: If database operation fails
    """
    try:
        # Query conversations with message count
        query = (
            select(
                Conversation,
                func.count(Message.id).label("message_count")
            )
            .outerjoin(Message, Conversation.id == Message.conversation_id)
            .where(Conversation.user_id == user_id)
            .group_by(Conversation.id)
            .order_by(Conversation.updated_at.desc())
        )

        result = await db.execute(query)
        rows = result.all()

        return [
            {
                "id": row.Conversation.id,
                "title": row.Conversation.title,
                "created_at": row.Conversation.created_at,
                "updated_at": row.Conversation.updated_at,
                "message_count": row.message_count
            }
            for row in rows
        ]
    except OperationalError as e:
        raise DatabaseError("Service temporarily unavailable") from e


async def add_message(
    db: AsyncSession,
    conversation_id: UUID,
    role: MessageRole,
    content: str,
    tool_calls: Optional[list] = None
) -> Message:
    """
    Add a message to a conversation.

    Args:
        db: Database session
        conversation_id: Conversation to add message to
        role: Message role (user/assistant/system)
        content: Message text
        tool_calls: Optional list of tool invocations

    Returns:
        Created message

    Raises:
        DatabaseError: If database operation fails
    """
    try:
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            tool_calls=tool_calls
        )
        db.add(message)

        # Update conversation updated_at
        conversation = await db.get(Conversation, conversation_id)
        if conversation:
            conversation.updated_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(message)
        return message
    except OperationalError as e:
        await db.rollback()
        raise DatabaseError("Service temporarily unavailable") from e


async def get_conversation_messages(
    db: AsyncSession,
    conversation_id: UUID,
    user_id: UUID
) -> list[Message]:
    """
    Get all messages for a conversation, verifying ownership.

    Args:
        db: Database session
        conversation_id: Conversation to get messages for
        user_id: Expected owner

    Returns:
        List of messages ordered by created_at

    Raises:
        ConversationNotFoundError: If not found or not owned by user
        DatabaseError: If database operation fails
    """
    try:
        # First verify ownership
        conversation = await db.get(Conversation, conversation_id)
        if not conversation or conversation.user_id != user_id:
            raise ConversationNotFoundError("Conversation not found")

        # Get messages ordered by created_at
        query = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
        )
        result = await db.execute(query)
        return list(result.scalars().all())
    except OperationalError as e:
        raise DatabaseError("Service temporarily unavailable") from e


async def get_conversation_history_for_agent(
    db: AsyncSession,
    conversation_id: UUID
) -> list[dict]:
    """
    Get conversation history formatted for the OpenAI agent.

    Args:
        db: Database session
        conversation_id: Conversation to get history for

    Returns:
        List of message dicts with 'role' and 'content' keys

    Raises:
        DatabaseError: If database operation fails
    """
    try:
        query = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
        )
        result = await db.execute(query)
        messages = result.scalars().all()

        return [
            {"role": msg.role.value, "content": msg.content}
            for msg in messages
        ]
    except OperationalError as e:
        raise DatabaseError("Service temporarily unavailable") from e
