"""
Todo Agent using OpenAI Agents SDK with MCP Server integration.

Connects to the MCP server via MCPServerStreamableHttp to discover
and invoke task management tools. No local @function_tool wrappers —
all tool calls go through the MCP server endpoint.
"""
import os
import logging

from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp
from agents.run import RunResult

logger = logging.getLogger(__name__)

MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "http://localhost:8001/mcp")

# Agent instructions template — {user_id} is injected at runtime
AGENT_INSTRUCTIONS = """You are a helpful Todo Assistant that helps users manage their tasks through natural language.

CRITICAL: The current user's ID is: {user_id}
You MUST pass this user_id in EVERY tool call. Never omit it.

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

Remember: Always include user_id="{user_id}" in every tool call."""


async def run_agent(
    user_id: str,
    message: str,
    history: list[dict] = None
) -> RunResult:
    """
    Run the agent with a user message via MCP server.

    Opens an MCPServerStreamableHttp connection to the MCP server,
    creates an Agent that auto-discovers tools, and runs it.

    Args:
        user_id: User ID to inject into agent instructions
        message: User's message
        history: Optional conversation history

    Returns:
        RunResult with agent response
    """
    logger.info(f"Connecting to MCP server at {MCP_SERVER_URL}")

    async with MCPServerStreamableHttp(
        name="Todo MCP Server",
        params={"url": MCP_SERVER_URL},
        cache_tools_list=True,
        client_session_timeout_seconds=30,
    ) as server:
        agent = Agent(
            name="Todo Assistant",
            instructions=AGENT_INSTRUCTIONS.format(user_id=user_id),
            mcp_servers=[server],
            model="gpt-4o-mini",
        )

        # Build input messages
        input_messages = []
        if history:
            input_messages.extend(history)
        input_messages.append({"role": "user", "content": message})

        result = await Runner.run(agent, input_messages)
        return result
