---
id: "0002"
title: "Create AI Chat Implementation Plan"
stage: plan
date: 2026-02-04
surface: agent
model: claude-opus-4-5-20250114
feature: ai-chat-logic
branch: ai-chat-logic
user: BaselHussain
command: /sp.plan
labels: ["openai-agents", "chat-api", "stateless", "mcp-tools", "conversation-history"]
links:
  spec: specs/ai-chat-logic/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/ai-chat-logic/plan.md
  - specs/ai-chat-logic/research.md
  - specs/ai-chat-logic/data-model.md
  - specs/ai-chat-logic/quickstart.md
  - specs/ai-chat-logic/contracts/chat-api.yaml
tests:
  - null
---

## Prompt

AI Agent & Chat Logic (Spec 5)

Follow the approved spec in specs/ai-chat-logic/spec.md exactly.

Create full execution plan:

1. Detailed folder/file structure changes:
   - backend/requirements.txt (add openai-agents)
   - backend/agents/todo_agent.py (agent setup + instructions)
   - backend/routers/chat.py (chat endpoint)
   - backend/models/conversation.py (Conversation + Message models)
   - backend/services/chat_service.py (history fetch/store logic)

2. Step-by-step integration plan:
   - Install OpenAI Agents SDK
   - Create todo agent with MCP tools from Spec 4
   - Define agent instructions (natural language → tool calls → confirmations)
   - Create /api/{user_id}/chat endpoint (async)
   - Implement DB fetch/store for conversation history
   - Run agent with full history + new message
   - Store assistant response + tool results
   - Return structured response (conversation_id, response, tool_calls)
   - Add JWT dependency (from Spec 2) to verify user

3. Decision table:
   - Stateful vs stateless agent (choose stateless — DB handles state)
   - Streaming vs non-streaming response (choose non-streaming for MVP)

4. Testing strategy with exact commands

## Response snapshot

Created comprehensive implementation plan including:
- **plan.md**: Full execution plan with technical context, constitution check, project structure, decision table, implementation phases, file changes summary, and testing strategy
- **research.md**: Research findings on OpenAI Agents SDK, conversation history management, MCP tools integration, response format, authentication, and database schema design
- **data-model.md**: Entity definitions for Conversation and Message tables with SQLModel schemas, business rules, indexes, and state transitions
- **contracts/chat-api.yaml**: OpenAPI 3.1 specification for chat endpoints (POST /api/{user_id}/chat, GET /api/{user_id}/conversations)
- **quickstart.md**: Setup guide with environment variables, installation, migration SQL, and usage examples

Key decisions documented:
- Stateless agent with DB-backed conversation history
- Non-streaming responses for MVP simplicity
- Function tools via @function_tool decorator wrapping MCP operations
- Manual conversation management with to_input_list() pattern

## Outcome

- ✅ Impact: Complete implementation plan ready for /sp.tasks
- 🧪 Tests: Testing strategy defined with curl commands and pytest
- 📁 Files: 5 planning artifacts created
- 🔁 Next prompts: /sp.tasks to generate implementation tasks
- 🧠 Reflection: Plan follows constitution principles; all decisions documented with rationale

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Constitution check PASS (all applicable principles)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
