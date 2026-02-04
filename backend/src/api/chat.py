"""
Chat API endpoints for AI-powered task management.

Provides endpoints for sending chat messages and managing conversations.
"""
import asyncio
import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from src.api.dependencies import verify_user_access
from src.api.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ConversationDetail,
    ConversationSummary,
    MessageResponse,
    ToolCall,
)
from src.models.message import MessageRole
from src.services.chat_service import (
    ChatServiceError,
    ConversationNotFoundError,
    DatabaseError,
    add_message,
    create_conversation,
    get_conversation,
    get_conversation_history_for_agent,
    get_conversation_messages,
    list_conversations,
)
from src.agents.todo_agent import run_agent

logger = logging.getLogger(__name__)

# Rate limiter: 10 requests per minute per user
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api", tags=["chat"])


def create_problem_response(
    status_code: int,
    error_type: str,
    title: str,
    detail: str,
    instance: str
) -> JSONResponse:
    """Create RFC 7807 Problem Details response."""
    return JSONResponse(
        status_code=status_code,
        content={
            "type": error_type,
            "title": title,
            "status": status_code,
            "detail": detail,
            "instance": instance
        },
        headers={"Content-Type": "application/problem+json"}
    )


@router.post("/{user_id}/chat", response_model=ChatResponse)
@limiter.limit("10/minute")
async def send_chat_message(
    request: Request,
    user_id: UUID,
    chat_request: ChatRequest,
    verified_user_id: Annotated[UUID, Depends(verify_user_access)],
    db: AsyncSession = Depends(get_db)
) -> ChatResponse:
    """
    Send a chat message to the AI assistant.

    Process a natural language message through the AI agent.
    Creates a new conversation or continues an existing one.
    Returns AI response with any tool invocations.

    Args:
        request: FastAPI request object
        user_id: User UUID from path
        chat_request: Chat message payload
        verified_user_id: Verified user ID from JWT
        db: Database session

    Returns:
        ChatResponse with conversation_id, response text, and tool_calls

    Raises:
        HTTPException: Various error codes for validation/auth/not found
    """
    logger.info(f"Chat request received for user {user_id}")

    try:
        # Get or create conversation
        conversation = None
        history = []

        if chat_request.conversation_id:
            # Resume existing conversation
            try:
                conversation = await get_conversation(
                    db, chat_request.conversation_id, user_id
                )
                # Load conversation history for agent
                history = await get_conversation_history_for_agent(
                    db, conversation.id
                )
                logger.info(f"Resuming conversation {conversation.id}")
            except ConversationNotFoundError:
                return create_problem_response(
                    status_code=404,
                    error_type="conversation-not-found",
                    title="Conversation Not Found",
                    detail="Conversation not found",
                    instance=str(request.url.path)
                )
        else:
            # Create new conversation
            conversation = await create_conversation(db, user_id)
            logger.info(f"Created new conversation {conversation.id}")

        # Store user message
        await add_message(
            db,
            conversation.id,
            MessageRole.USER,
            chat_request.message
        )

        # Run agent with timeout
        try:
            result = await asyncio.wait_for(
                run_agent(
                    user_id=str(user_id),
                    message=chat_request.message,
                    history=history
                ),
                timeout=45.0  # 45 second timeout (MCP HTTP round-trip adds latency)
            )
        except asyncio.TimeoutError:
            logger.error(f"Agent timeout for user {user_id}")
            return create_problem_response(
                status_code=503,
                error_type="service-timeout",
                title="Service Timeout",
                detail="The request took too long to process. Please try again.",
                instance=str(request.url.path)
            )

        # Extract response and tool calls
        response_text = result.final_output if result.final_output else ""
        tool_calls_data = []

        # Extract tool calls from the result using SDK item types
        import json
        for item in result.new_items:
            # Check item type using SDK's documented pattern
            if item.type == "tool_call_item":
                # Parse arguments if it's a string (OpenAI returns JSON string)
                args = item.raw_item.arguments if hasattr(item.raw_item, 'arguments') else {}
                if isinstance(args, str):
                    try:
                        args = json.loads(args)
                    except (json.JSONDecodeError, TypeError):
                        args = {"raw": args}
                tool_call = ToolCall(
                    tool_name=item.raw_item.name if hasattr(item.raw_item, 'name') else "unknown",
                    arguments=args,
                    result={}
                )
                tool_calls_data.append(tool_call)
            elif item.type == "tool_call_output_item":
                # Match output to the last tool call
                if tool_calls_data:
                    output = item.output if hasattr(item, 'output') else "{}"
                    try:
                        tool_calls_data[-1].result = json.loads(output) if isinstance(output, str) else output
                    except (json.JSONDecodeError, TypeError):
                        tool_calls_data[-1].result = {"raw": str(output)}

        # Store assistant message with tool calls
        await add_message(
            db,
            conversation.id,
            MessageRole.ASSISTANT,
            response_text,
            tool_calls=[tc.model_dump() for tc in tool_calls_data] if tool_calls_data else None
        )

        logger.info(f"Chat response sent for conversation {conversation.id}")

        return ChatResponse(
            conversation_id=conversation.id,
            response=response_text,
            tool_calls=tool_calls_data
        )

    except DatabaseError as e:
        logger.error(f"Database error in chat: {e}")
        return create_problem_response(
            status_code=503,
            error_type="service-unavailable",
            title="Service Unavailable",
            detail="Service temporarily unavailable. Please try again later.",
            instance=str(request.url.path)
        )
    except Exception as e:
        logger.exception(f"Unexpected error in chat: {e}")
        return create_problem_response(
            status_code=500,
            error_type="internal-error",
            title="Internal Error",
            detail="An unexpected error occurred. Please try again later.",
            instance=str(request.url.path)
        )


@router.get("/{user_id}/conversations", response_model=list[ConversationSummary])
async def list_user_conversations(
    user_id: UUID,
    verified_user_id: Annotated[UUID, Depends(verify_user_access)],
    db: AsyncSession = Depends(get_db)
) -> list[ConversationSummary]:
    """
    List all conversations for the authenticated user.

    Args:
        user_id: User UUID from path
        verified_user_id: Verified user ID from JWT
        db: Database session

    Returns:
        List of conversation summaries with message counts
    """
    try:
        conversations = await list_conversations(db, user_id)
        return [
            ConversationSummary(
                id=conv["id"],
                title=conv["title"],
                created_at=conv["created_at"],
                updated_at=conv["updated_at"],
                message_count=conv["message_count"]
            )
            for conv in conversations
        ]
    except DatabaseError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "type": "service-unavailable",
                "title": "Service Unavailable",
                "status": 503,
                "detail": "Service temporarily unavailable. Please try again later."
            }
        )


@router.get(
    "/{user_id}/conversations/{conversation_id}",
    response_model=ConversationDetail
)
async def get_conversation_detail(
    user_id: UUID,
    conversation_id: UUID,
    verified_user_id: Annotated[UUID, Depends(verify_user_access)],
    db: AsyncSession = Depends(get_db)
) -> ConversationDetail:
    """
    Get a specific conversation with all its messages.

    Args:
        user_id: User UUID from path
        conversation_id: Conversation UUID from path
        verified_user_id: Verified user ID from JWT
        db: Database session

    Returns:
        Conversation details with all messages

    Raises:
        HTTPException: 404 if conversation not found
    """
    try:
        conversation = await get_conversation(db, conversation_id, user_id)
        messages = await get_conversation_messages(db, conversation_id, user_id)

        return ConversationDetail(
            id=conversation.id,
            title=conversation.title,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            messages=[
                MessageResponse(
                    id=msg.id,
                    role=msg.role.value,
                    content=msg.content,
                    tool_calls=[
                        ToolCall(**tc) for tc in msg.tool_calls
                    ] if msg.tool_calls else None,
                    created_at=msg.created_at
                )
                for msg in messages
            ]
        )
    except ConversationNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "type": "conversation-not-found",
                "title": "Conversation Not Found",
                "status": 404,
                "detail": "Conversation not found"
            }
        )
    except DatabaseError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "type": "service-unavailable",
                "title": "Service Unavailable",
                "status": 503,
                "detail": "Service temporarily unavailable. Please try again later."
            }
        )
