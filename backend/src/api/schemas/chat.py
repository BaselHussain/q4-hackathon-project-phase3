"""
Pydantic schemas for AI Chat endpoints.

Contains request/response models for the chat API.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class ToolCall(BaseModel):
    """Represents a single tool invocation by the AI agent."""
    tool_name: str
    arguments: dict
    result: dict


class ChatRequest(BaseModel):
    """Request payload for the chat endpoint."""
    message: str = Field(..., min_length=1, max_length=4000)
    conversation_id: Optional[UUID] = None

    @field_validator('message')
    @classmethod
    def message_not_blank(cls, v: str) -> str:
        """Ensure message is not empty or whitespace-only."""
        if not v.strip():
            raise ValueError('Message cannot be empty')
        return v.strip()


class ChatResponse(BaseModel):
    """Response payload for the chat endpoint."""
    conversation_id: UUID
    response: str
    tool_calls: list[ToolCall] = []


class MessageResponse(BaseModel):
    """Single message in a conversation."""
    id: UUID
    role: str
    content: str
    tool_calls: Optional[list[ToolCall]] = None
    created_at: datetime


class ConversationSummary(BaseModel):
    """Summary of a conversation for listing."""
    id: UUID
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    message_count: int


class ConversationDetail(BaseModel):
    """Detailed conversation with all messages."""
    id: UUID
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse]
