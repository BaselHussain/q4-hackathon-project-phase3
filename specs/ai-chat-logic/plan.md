# Implementation Plan: AI Agent & Chat Logic

**Branch**: `ai-chat-logic` | **Date**: 2026-02-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/ai-chat-logic/spec.md`

## Summary

Build a stateless AI chat endpoint using OpenAI Agents SDK that integrates with existing MCP tools from Spec 4. The endpoint persists conversation history in Neon PostgreSQL, enabling natural language task management. Users interact via `POST /api/{user_id}/chat` with JWT authentication.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: FastAPI 0.109+, OpenAI Agents SDK (`openai-agents`), SQLModel 0.0.14+, asyncpg 0.29+
**Storage**: Neon Serverless PostgreSQL (existing DATABASE_URL)
**Testing**: pytest with httpx for async endpoint testing
**Target Platform**: Linux server (Render deployment)
**Project Type**: Web application (backend API)
**Performance Goals**: <5 seconds per chat request (includes AI response time)
**Constraints**: Stateless endpoint (no in-memory state), horizontal scaling ready
**Scale/Scope**: 100 concurrent users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Spec-Driven Development | ✅ PASS | Following approved spec.md |
| II. AI-First Stateless Architecture | ✅ PASS | OpenAI Agents SDK + stateless endpoint design |
| III. Secure Authentication | ✅ PASS | Reusing Phase 2 JWT auth via `verify_user_access` dependency |
| IV. Persistent Data & Conversation State | ✅ PASS | Conversations + Messages tables in Neon PostgreSQL |
| V. OpenAI Agents SDK Integration | ✅ PASS | Using official `openai-agents` package with `MCPServerStreamableHttp` — agent discovers tools from MCP server via HTTP |
| VI. Stateless Tool Design | ✅ PASS | MCP tools already stateless (Spec 4), agent uses DB for state |
| VII. Conversational UI Experience | N/A | Frontend is separate spec |
| VIII. MCP Server Protocol | ✅ PASS | Agent connects to MCP server via HTTP endpoint; core logic lives only in MCP tools |

**Gate Result**: ✅ PASS - All applicable principles satisfied

## Project Structure

### Documentation (this feature)

```text
specs/ai-chat-logic/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI)
│   └── chat-api.yaml
└── tasks.md             # Phase 2 output (/sp.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   ├── user.py           # Existing (Phase 2)
│   │   ├── task.py           # Existing (Phase 1)
│   │   ├── conversation.py   # NEW: Conversation model
│   │   └── message.py        # NEW: Message model
│   ├── services/
│   │   ├── chat_service.py   # NEW: Conversation history logic
│   │   └── ...
│   ├── api/
│   │   ├── auth.py           # Existing (Phase 2)
│   │   ├── dependencies.py   # Existing (Phase 2) - verify_user_access
│   │   ├── chat.py           # NEW: Chat endpoint router
│   │   └── schemas/
│   │       ├── auth.py       # Existing
│   │       └── chat.py       # NEW: ChatRequest, ChatResponse schemas
│   └── agents/
│       └── todo_agent.py     # NEW: Agent setup + MCP server connection
├── tools/
│   └── tasks.py              # Existing (Spec 4) - MCP tools
├── requirements.txt          # UPDATE: Add openai-agents
└── tests/
    └── integration/
        └── test_chat_endpoint.py  # NEW: Chat endpoint tests
```

**Structure Decision**: Web application structure (Option 2) - extending existing backend with new modules for chat functionality.

## Decision Table

| Decision | Choice | Rationale | Alternatives Rejected |
|----------|--------|-----------|----------------------|
| Agent State Management | Stateless (DB-backed) | Constitution requires stateless for scaling; DB is source of truth | In-memory sessions (violates stateless requirement) |
| Response Mode | Non-streaming (sync) | Simpler implementation; <5s acceptable for MVP | Streaming (adds complexity, not required by spec) |
| Tool Integration | MCP Server via `MCPServerStreamableHttp` | Agent discovers tools from MCP server over HTTP; core logic lives only in MCP tools; single source of truth | `@function_tool` wrappers (duplicates logic, bypasses MCP server) |
| Conversation History | Manual with `to_input_list()` pattern | Full control over DB persistence; matches spec FR-008/009/010 | SQLiteSession (not compatible with Neon PostgreSQL) |
| Message Storage | JSON column for tool_calls | Flexible schema for varying tool responses | Separate tool_calls table (over-engineering) |

## Implementation Phases

### Phase 0: Research (Complete)

See [research.md](./research.md) for detailed findings.

**Key Decisions**:
1. Use `openai-agents` package with `MCPServerStreamableHttp` for MCP integration
2. Agent connects to MCP server at `MCP_SERVER_URL` — no local function tool wrappers
3. Use manual conversation management with `to_input_list()` pattern
4. Store conversation in PostgreSQL, not SQLite sessions
5. Pass user_id via agent instructions so LLM includes it in every MCP tool call

### Phase 1: Design & Contracts

**1.1 Data Models** (see [data-model.md](./data-model.md))
- Conversation entity (id, user_id, title, created_at, updated_at)
- Message entity (id, conversation_id, role, content, tool_calls, created_at)

**1.2 API Contracts** (see [contracts/chat-api.yaml](./contracts/chat-api.yaml))
- POST `/api/{user_id}/chat` - Send message, get AI response
- GET `/api/{user_id}/conversations` - List user's conversations
- GET `/api/{user_id}/conversations/{conversation_id}` - Get conversation messages

**1.3 Agent Design**
- Agent name: "Todo Assistant"
- Instructions: Natural language task management with confirmation
- Tools: 5 MCP tools discovered from MCP server via HTTP (add, list, complete, delete, update)

### Phase 2: Implementation Tasks

Tasks will be generated by `/sp.tasks` command covering:

1. **Database Layer**
   - Create Conversation model
   - Create Message model
   - Add database migrations

2. **Service Layer**
   - Create chat_service.py with conversation CRUD
   - Implement history fetch/store logic

3. **Agent Layer**
   - Create todo_agent.py with agent configuration
   - Connect to MCP server via MCPServerStreamableHttp (no @function_tool wrappers)
   - Configure agent instructions with user_id injection

4. **API Layer**
   - Create chat.py router with POST endpoint
   - Add request/response schemas
   - Integrate JWT authentication
   - Add rate limiting

5. **Testing**
   - Integration tests for chat endpoint
   - Tool invocation verification

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `backend/requirements.txt` | UPDATE | Add `openai-agents>=0.0.1` |
| `backend/src/models/conversation.py` | CREATE | Conversation SQLModel |
| `backend/src/models/message.py` | CREATE | Message SQLModel |
| `backend/src/models/__init__.py` | UPDATE | Export new models |
| `backend/src/services/chat_service.py` | CREATE | Conversation history logic |
| `backend/src/agents/todo_agent.py` | CREATE | Agent setup + MCPServerStreamableHttp connection |
| `backend/src/agents/__init__.py` | CREATE | Package init |
| `backend/src/api/chat.py` | CREATE | Chat endpoint router |
| `backend/src/api/schemas/chat.py` | CREATE | Request/Response schemas |
| `backend/main.py` | UPDATE | Register chat router |
| `backend/tests/integration/test_chat_endpoint.py` | CREATE | Endpoint tests |

## Testing Strategy

### Manual Testing Commands

```bash
# 1. Start backend server
cd backend && uvicorn main:app --reload

# 2. Login to get JWT token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "TestPass123!"}'
# Save the access_token from response

# 3. Send chat message (new conversation)
curl -X POST http://localhost:8000/api/{user_id}/chat \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add a task to buy groceries"}'

# 4. Continue conversation
curl -X POST http://localhost:8000/api/{user_id}/chat \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"message": "Show my tasks", "conversation_id": "{id_from_step_3}"}'

# 5. List conversations
curl -X GET http://localhost:8000/api/{user_id}/conversations \
  -H "Authorization: Bearer {token}"
```

### Automated Testing

```bash
# Run integration tests
cd backend && pytest tests/integration/test_chat_endpoint.py -v
```

## Complexity Tracking

> No violations requiring justification. Design follows constitution principles.

## Next Steps

1. Run `/sp.tasks` to generate implementation tasks
2. Implement in order: Models → Service → Agent → API → Tests
3. Test with curl commands above
4. Create PR for review
