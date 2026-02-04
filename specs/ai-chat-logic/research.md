# Research: AI Agent & Chat Logic

**Feature**: AI Agent & Chat Logic
**Date**: 2026-02-04
**Branch**: `ai-chat-logic`

## Research Topics

### 1. OpenAI Agents SDK Integration

**Decision**: Use `openai-agents` Python package with `@function_tool` decorator

**Rationale**:
- Official OpenAI SDK for building agentic applications
- Native support for function tools via `@function_tool` decorator
- Built-in conversation management patterns
- High-quality documentation and active maintenance
- Compatible with GPT-4 and other OpenAI models

**Installation**:
```bash
pip install openai-agents
```

**Key Patterns**:
```python
from agents import Agent, Runner, function_tool

@function_tool
async def my_tool(param: str) -> str:
    """Tool description for the agent."""
    return result

agent = Agent(
    name="Assistant",
    instructions="Your instructions here",
    tools=[my_tool],
)

result = await Runner.run(agent, input="User message")
print(result.final_output)
```

**Alternatives Considered**:
- LangChain: More complex, unnecessary abstraction for this use case
- Raw OpenAI API: Would require manual tool handling and conversation management
- Anthropic Claude SDK: Not compatible with MCP tools pattern established in Spec 4

---

### 2. Conversation History Management

**Decision**: Use manual conversation management with `to_input_list()` pattern

**Rationale**:
- Full control over database persistence (Neon PostgreSQL)
- Matches spec requirements FR-008, FR-009, FR-010 exactly
- Enables stateless endpoint design (no in-memory sessions)
- Compatible with existing SQLModel/asyncpg stack

**Pattern**:
```python
# First message - create conversation
result = await Runner.run(agent, input="User message")

# Subsequent messages - load history from DB, append new message
history = load_conversation_from_db(conversation_id)
new_input = history + [{"role": "user", "content": "New message"}]
result = await Runner.run(agent, new_input)

# Store response
save_message_to_db(conversation_id, role="assistant", content=result.final_output)
```

**Alternatives Considered**:
- SQLiteSession: Built into SDK but uses SQLite, not compatible with Neon PostgreSQL
- RedisSession: Requires additional Redis infrastructure
- In-memory sessions: Violates stateless requirement, breaks horizontal scaling

---

### 3. MCP Tools Integration

**Decision**: Wrap existing MCP tool functions as `@function_tool` decorated functions

**Rationale**:
- Reuses existing Spec 4 implementation
- Maintains stateless tool design
- Single source of truth for tool logic
- No need for separate MCP server process

**Pattern**:
```python
from agents import function_tool
from backend.tools.tasks import add_task as mcp_add_task

@function_tool
async def add_task(user_id: str, title: str, description: str = None) -> str:
    """Create a new task for the user.

    Args:
        user_id: UUID of the task owner
        title: Task title (1-200 characters)
        description: Optional task description
    """
    result = await mcp_add_task(user_id, title, description)
    return json.dumps(result)
```

**Alternatives Considered**:
- Direct MCP protocol calls: Unnecessary complexity, tools already implemented as functions
- Duplicate tool implementations: Violates DRY principle
- Import entire MCP server: Over-engineering for this use case

---

### 4. Response Format

**Decision**: Non-streaming synchronous responses

**Rationale**:
- Simpler implementation for MVP
- <5 second response time acceptable per spec SC-001
- Reduces frontend complexity
- Can add streaming later if needed

**Response Structure** (per spec FR-013):
```json
{
  "conversation_id": "uuid",
  "response": "AI response text",
  "tool_calls": [
    {
      "tool_name": "add_task",
      "arguments": {"title": "Buy groceries"},
      "result": {"success": true, "data": {...}}
    }
  ]
}
```

**Alternatives Considered**:
- Streaming (SSE): Adds complexity, not required by spec
- WebSocket: Over-engineering for request/response pattern

---

### 5. Authentication Integration

**Decision**: Reuse existing `verify_user_access` dependency from Phase 2

**Rationale**:
- Already implemented and tested
- Handles JWT validation and user_id verification
- Consistent error responses (RFC 7807)
- Security logging already in place

**Usage**:
```python
from src.api.dependencies import verify_user_access

@router.post("/api/{user_id}/chat")
async def chat(
    user_id: UUID,
    request: ChatRequest,
    verified_user: Annotated[UUID, Depends(verify_user_access)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    # verified_user is guaranteed to match user_id
    ...
```

**Alternatives Considered**:
- New auth middleware: Duplicates existing functionality
- Skip verification: Security violation

---

### 6. Database Schema Design

**Decision**: Two new tables - `conversations` and `messages`

**Rationale**:
- Clean separation of concerns
- Efficient querying by conversation
- Supports conversation metadata (title, timestamps)
- JSON column for flexible tool_calls storage

**Schema**:
```sql
-- conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);

-- messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tool_calls JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
```

**Alternatives Considered**:
- Single table with parent_id: Complex queries, harder to maintain
- Separate tool_calls table: Over-normalized for this use case
- NoSQL (MongoDB): Inconsistent with existing PostgreSQL stack

---

## Environment Variables

New variables required:
```bash
# Already exists from Phase 2
BETTER_AUTH_SECRET=your-jwt-secret
DATABASE_URL=postgresql://...

# New for Phase 3
OPENAI_API_KEY=sk-...
```

## Dependencies Summary

Add to `backend/requirements.txt`:
```
openai-agents>=0.0.1
```

No other new dependencies required - leverages existing FastAPI, SQLModel, asyncpg stack.
