"""
Stateless MCP tools for task management.

Each tool wraps core operations from task_operations.py.
Tools are registered with the MCP server via register_tools().
"""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables before importing database
from dotenv import load_dotenv
load_dotenv()

# Import core operations
from tools.task_operations import (
    add_task as core_add_task,
    list_tasks as core_list_tasks,
    complete_task as core_complete_task,
    delete_task as core_delete_task,
    update_task as core_update_task,
)


def register_tools(mcp):
    """
    Register all task management tools with the MCP server.

    Args:
        mcp: FastMCP server instance
    """

    @mcp.tool()
    async def add_task(user_id: str, title: str, description: str = None) -> dict:
        """
        Create a new task for the user.

        Args:
            user_id: UUID of the user who owns this task
            title: Title of the task (1-200 characters)
            description: Optional description (max 2000 characters)

        Returns:
            Success response with created task data, or error response
        """
        return await core_add_task(user_id, title, description)

    @mcp.tool()
    async def list_tasks(user_id: str, status: str = "all") -> dict:
        """
        List all tasks for a user with optional status filter.

        Args:
            user_id: UUID of the user
            status: Filter by status - "all", "pending", or "completed" (default: "all")

        Returns:
            Success response with array of tasks, or error response
        """
        return await core_list_tasks(user_id, status)

    @mcp.tool()
    async def complete_task(user_id: str, task_id: str) -> dict:
        """
        Mark a task as completed.

        Args:
            user_id: UUID of the user who owns the task
            task_id: UUID of the task to complete

        Returns:
            Success response with updated task data, or error response
        """
        return await core_complete_task(user_id, task_id)

    @mcp.tool()
    async def delete_task(user_id: str, task_id: str) -> dict:
        """
        Permanently delete a task.

        Args:
            user_id: UUID of the user who owns the task
            task_id: UUID of the task to delete

        Returns:
            Success response with confirmation, or error response
        """
        return await core_delete_task(user_id, task_id)

    @mcp.tool()
    async def update_task(
        user_id: str,
        task_id: str,
        title: str = None,
        description: str = None
    ) -> dict:
        """
        Update a task's title and/or description.

        Args:
            user_id: UUID of the user who owns the task
            task_id: UUID of the task to update
            title: New title for the task (optional, 1-200 characters)
            description: New description for the task (optional, max 2000 characters)

        Returns:
            Success response with updated task data, or error response
        """
        return await core_update_task(user_id, task_id, title, description)
