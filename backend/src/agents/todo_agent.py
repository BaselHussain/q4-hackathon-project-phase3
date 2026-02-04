"""
Todo Agent using OpenAI Agents SDK.

Configures the AI agent with function tools for task management.
"""
import os
from typing import Optional
from uuid import UUID

from agents import Agent, Runner, function_tool
from agents.run import RunResult

from src.models.task import Task, TaskStatus
from database import AsyncSessionLocal
from sqlmodel import select
from sqlalchemy.exc import OperationalError
from datetime import datetime, timezone


# Agent instructions for natural language task management
AGENT_INSTRUCTIONS = """You are a helpful Todo Assistant that helps users manage their tasks through natural language.

Your capabilities:
- Add new tasks for the user
- List existing tasks (all, pending, or completed)
- Mark tasks as completed
- Delete tasks
- Update task titles and descriptions

Guidelines:
1. Always confirm actions you take (e.g., "I've added 'Buy groceries' to your tasks")
2. When listing tasks, format them clearly
3. If a user's request is ambiguous, ask for clarification
4. Be concise but friendly in your responses
5. If an operation fails, explain what went wrong in user-friendly terms
6. You can handle multiple operations in a single message (e.g., "Add task A and mark task B as done")

Remember: You can only manage tasks for the current user. The user_id is provided automatically."""


def serialize_task(task: Task) -> dict:
    """Convert Task model to dictionary."""
    return {
        "task_id": str(task.id),
        "title": task.title,
        "description": task.description,
        "status": task.status.value,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "updated_at": task.updated_at.isoformat() if task.updated_at else None,
    }


def success_response(data) -> dict:
    """Create success response structure."""
    return {"success": True, "data": data}


def error_response(message: str) -> dict:
    """Create error response structure."""
    return {"success": False, "error": message}


# Store user_id for tool context (set before running agent)
_current_user_id: Optional[str] = None


def set_current_user(user_id: str):
    """Set the current user ID for tool context."""
    global _current_user_id
    _current_user_id = user_id


def get_current_user() -> str:
    """Get the current user ID."""
    if not _current_user_id:
        raise ValueError("User ID not set")
    return _current_user_id


@function_tool
async def add_task(title: str, description: str = None) -> dict:
    """
    Create a new task for the user.

    Args:
        title: Title of the task (1-200 characters)
        description: Optional description (max 2000 characters)

    Returns:
        Success response with created task data, or error response
    """
    user_id = get_current_user()

    # Validate title
    if not title or not title.strip():
        return error_response("Task title is required")

    title = title.strip()
    if len(title) > 200:
        return error_response("Task title must be 200 characters or less")

    # Validate description
    if description is not None:
        description = description.strip() if description else None
        if description and len(description) > 2000:
            return error_response("Task description must be 2000 characters or less")

    try:
        async with AsyncSessionLocal() as session:
            new_task = Task(
                user_id=UUID(user_id),
                title=title,
                description=description,
                status=TaskStatus.PENDING
            )
            session.add(new_task)
            await session.commit()
            await session.refresh(new_task)
            return success_response(serialize_task(new_task))
    except OperationalError:
        return error_response("Service temporarily unavailable, please try again")
    except Exception:
        return error_response("Service temporarily unavailable, please try again")


@function_tool
async def list_tasks(status: str = "all") -> dict:
    """
    List all tasks for the user with optional status filter.

    Args:
        status: Filter by status - "all", "pending", or "completed" (default: "all")

    Returns:
        Success response with array of tasks, or error response
    """
    user_id = get_current_user()

    # Validate status
    valid_statuses = ["all", "pending", "completed"]
    status = status.lower() if status else "all"
    if status not in valid_statuses:
        return error_response(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

    try:
        async with AsyncSessionLocal() as session:
            query = select(Task).where(Task.user_id == UUID(user_id))

            if status == "pending":
                query = query.where(Task.status == TaskStatus.PENDING)
            elif status == "completed":
                query = query.where(Task.status == TaskStatus.COMPLETED)

            query = query.order_by(Task.created_at.desc())
            result = await session.execute(query)
            tasks = result.scalars().all()
            task_list = [serialize_task(task) for task in tasks]
            return success_response(task_list)
    except OperationalError:
        return error_response("Service temporarily unavailable, please try again")
    except Exception:
        return error_response("Service temporarily unavailable, please try again")


@function_tool
async def complete_task(task_id: str) -> dict:
    """
    Mark a task as completed.

    Args:
        task_id: UUID of the task to complete

    Returns:
        Success response with updated task data, or error response
    """
    user_id = get_current_user()

    # Validate task_id
    try:
        task_uuid = UUID(task_id)
    except (ValueError, TypeError):
        return error_response("Invalid task ID format")

    try:
        async with AsyncSessionLocal() as session:
            task = await session.get(Task, task_uuid)

            if not task or str(task.user_id) != user_id:
                return error_response("Task not found or access denied")

            task.status = TaskStatus.COMPLETED
            task.updated_at = datetime.now(timezone.utc)
            await session.commit()
            await session.refresh(task)
            return success_response(serialize_task(task))
    except OperationalError:
        return error_response("Service temporarily unavailable, please try again")
    except Exception:
        return error_response("Service temporarily unavailable, please try again")


@function_tool
async def delete_task(task_id: str) -> dict:
    """
    Permanently delete a task.

    Args:
        task_id: UUID of the task to delete

    Returns:
        Success response with confirmation, or error response
    """
    user_id = get_current_user()

    # Validate task_id
    try:
        task_uuid = UUID(task_id)
    except (ValueError, TypeError):
        return error_response("Invalid task ID format")

    try:
        async with AsyncSessionLocal() as session:
            task = await session.get(Task, task_uuid)

            if not task or str(task.user_id) != user_id:
                return error_response("Task not found or access denied")

            deleted_task_id = str(task.id)
            await session.delete(task)
            await session.commit()
            return success_response({
                "task_id": deleted_task_id,
                "message": "Task deleted successfully"
            })
    except OperationalError:
        return error_response("Service temporarily unavailable, please try again")
    except Exception:
        return error_response("Service temporarily unavailable, please try again")


@function_tool
async def update_task(task_id: str, title: str = None, description: str = None) -> dict:
    """
    Update a task's title and/or description.

    Args:
        task_id: UUID of the task to update
        title: New title for the task (optional, 1-200 characters)
        description: New description for the task (optional, max 2000 characters)

    Returns:
        Success response with updated task data, or error response
    """
    user_id = get_current_user()

    # Validate task_id
    try:
        task_uuid = UUID(task_id)
    except (ValueError, TypeError):
        return error_response("Invalid task ID format")

    # Validate at least one field provided
    has_title = title is not None and title.strip() != ""
    has_description = description is not None

    if not has_title and not has_description:
        return error_response("At least one field (title or description) must be provided")

    # Validate title
    if has_title:
        title = title.strip()
        if len(title) > 200:
            return error_response("Task title must be 200 characters or less")
        if len(title) < 1:
            return error_response("Task title must be at least 1 character")

    # Validate description
    if has_description and description:
        description = description.strip()
        if len(description) > 2000:
            return error_response("Task description must be 2000 characters or less")

    try:
        async with AsyncSessionLocal() as session:
            task = await session.get(Task, task_uuid)

            if not task or str(task.user_id) != user_id:
                return error_response("Task not found or access denied")

            if has_title:
                task.title = title
            if has_description:
                task.description = description if description else None

            task.updated_at = datetime.now(timezone.utc)
            await session.commit()
            await session.refresh(task)
            return success_response(serialize_task(task))
    except OperationalError:
        return error_response("Service temporarily unavailable, please try again")
    except Exception:
        return error_response("Service temporarily unavailable, please try again")


def create_todo_agent() -> Agent:
    """
    Create and configure the Todo Agent.

    Returns:
        Configured Agent instance with all task management tools
    """
    return Agent(
        name="Todo Assistant",
        instructions=AGENT_INSTRUCTIONS,
        tools=[add_task, list_tasks, complete_task, delete_task, update_task],
        model="gpt-4o-mini"  # Cost-effective model for task management
    )


async def run_agent(
    user_id: str,
    message: str,
    history: list[dict] = None
) -> RunResult:
    """
    Run the agent with a user message.

    Args:
        user_id: User ID for tool context
        message: User's message
        history: Optional conversation history

    Returns:
        RunResult with agent response
    """
    # Set user context for tools
    set_current_user(user_id)

    # Create agent
    agent = create_todo_agent()

    # Build input messages
    input_messages = []
    if history:
        input_messages.extend(history)
    input_messages.append({"role": "user", "content": message})

    # Run agent
    result = await Runner.run(agent, input_messages)
    return result
