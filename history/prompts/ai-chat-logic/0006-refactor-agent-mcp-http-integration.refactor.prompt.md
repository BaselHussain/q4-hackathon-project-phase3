---
id: 0006
title: Refactor Agent to MCP HTTP Integration
stage: refactor
date: 2026-02-05
surface: agent
model: claude-opus-4-5-20251101
feature: ai-chat-logic
branch: bug/refactor-agent-mcp-http
user: CW
command: implement
labels: ["refactor", "mcp", "agent", "architecture"]
links:
  spec: specs/ai-chat-logic/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/ai-chat-logic/spec.md
  - specs/ai-chat-logic/plan.md
  - specs/ai-chat-logic/tasks.md
  - backend/tools/tasks.py
  - backend/tools/task_operations.py (DELETED)
  - backend/src/agents/todo_agent.py
  - backend/src/agents/__init__.py
  - backend/src/api/chat.py
  - backend/.env.example
tests:
  - Manual verification: MCP server → agent → DB flow
---

## Prompt

Implement the following plan:

# Refactor: AI Agent Calls MCP Tools via HTTP (Not Shared Python Imports)

## Problem

The AI agent (`todo_agent.py`) bypasses the MCP server entirely by importing core logic from `task_operations.py` — the same shared module used by MCP tools. The MCP server is never hit by the agent.

**Current (wrong):**
```
chat.py → run_agent() → @function_tool → task_operations.py → DB
MCP Server → @mcp.tool()  → task_operations.py → DB
```

**Target (correct):**
```
chat.py → run_agent() → Agent(mcp_servers=[MCPServerStreamableHttp]) → MCP Server (port 8001) → DB
```

Core logic lives ONLY in MCP tools. Agent calls MCP tools over HTTP.

## Response snapshot

Implemented all 6 steps of the refactoring plan:

1. **Step 0**: Updated spec.md (FR-005 rewritten, FR-017 added, assumption added), plan.md (constitution checks, decision table, phases, key decisions updated), tasks.md (T009 updated)
2. **Step 1**: Rewrote `backend/tools/tasks.py` — inlined all business logic from `task_operations.py` directly into `@mcp.tool()` functions (helpers + full implementations)
3. **Step 2**: Deleted `backend/tools/task_operations.py` — shared layer no longer needed
4. **Step 3**: Complete rewrite of `backend/src/agents/todo_agent.py` — uses `MCPServerStreamableHttp` to connect to MCP server at `MCP_SERVER_URL`, auto-discovers tools, injects `user_id` into agent instructions
5. **Step 4**: Updated `backend/src/agents/__init__.py` — removed `create_todo_agent` export
6. **Step 5**: Changed chat.py timeout from 30s to 45s for MCP HTTP round-trip
7. **Step 6**: Added `MCP_SERVER_URL` to `.env.example`

## Outcome

- Impact: Architecture now correctly routes agent tool calls through MCP server via HTTP, eliminating shared Python imports
- Tests: Manual verification needed (start MCP server on 8001, FastAPI on 8000, test chat endpoint)
- Files: 8 files modified, 1 file deleted
- Next prompts: Test end-to-end flow, verify tool calls go through MCP server
- Reflection: The OpenAI Agents SDK's native `MCPServerStreamableHttp` makes this clean — no wrapper code needed

## Evaluation notes (flywheel)

- Failure modes observed: None during implementation
- Graders run and results (PASS/FAIL): N/A — manual testing required
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Verify with live MCP server that tool discovery and invocation works end-to-end
