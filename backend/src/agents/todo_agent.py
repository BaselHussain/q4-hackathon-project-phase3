"""
Todo Agent using OpenAI Agents SDK.

Configures the AI agent with function tools that wrap the existing
MCP task operations from Spec 4.
"""
import sys
import os
from typing import Optional

# Add backend directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from agents import Agent, Runner, function_tool
from agents.run import RunResult

# Import core task operations from Spec 4
from tools.task_operations import (
    add_task as core_add_task,
    list_tasks as core_list_tasks,
    complete_task as core_complete_task,
    delete_task as core_delete_task,
    update_task as core_update_task,
)


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


# =============================================================================
# Function Tools wrapping MCP Task Operations from Spec 4
# =============================================================================

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
    return await core_add_task(get_current_user(), title, description)


@function_tool
async def list_tasks(status: str = "all") -> dict:
    """
    List all tasks for the user with optional status filter.

    Args:
        status: Filter by status - "all", "pending", or "completed" (default: "all")

    Returns:
        Success response with array of tasks, or error response
    """
    return await core_list_tasks(get_current_user(), status)


@function_tool
async def complete_task(task_id: str) -> dict:
    """
    Mark a task as completed.

    Args:
        task_id: UUID of the task to complete

    Returns:
        Success response with updated task data, or error response
    """
    return await core_complete_task(get_current_user(), task_id)


@function_tool
async def delete_task(task_id: str) -> dict:
    """
    Permanently delete a task.

    Args:
        task_id: UUID of the task to delete

    Returns:
        Success response with confirmation, or error response
    """
    return await core_delete_task(get_current_user(), task_id)


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
    return await core_update_task(get_current_user(), task_id, title, description)


# =============================================================================
# Agent Configuration
# =============================================================================

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
