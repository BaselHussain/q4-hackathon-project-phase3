"""
Agents package for AI Chat functionality.

This package contains the OpenAI Agents SDK configuration
using MCPServerStreamableHttp for MCP server integration.
"""
from .todo_agent import run_agent

__all__ = ["run_agent"]
