# Quickstart: AI Agent & Chat Logic

**Feature**: AI Agent & Chat Logic
**Date**: 2026-02-04
**Branch**: `ai-chat-logic`

## Prerequisites

- Python 3.11+
- Existing backend setup from Phase 1 & 2
- Neon PostgreSQL database (DATABASE_URL configured)
- OpenAI API key

## Environment Setup

Add to your `.env` file:

```bash
# Existing from Phase 1 & 2
DATABASE_URL=postgresql+asyncpg://user:pass@host/db
BETTER_AUTH_SECRET=your-jwt-secret

# NEW for Phase 3
OPENAI_API_KEY=sk-your-openai-api-key
```

## Installation

```bash
cd backend

# Activate virtual environment
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install new dependency
pip install openai-agents

# Or update all dependencies
pip install -r requirements.txt
```

## Database Migration

The following tables will be created:

```sql
-- Run these migrations (or use SQLModel create_all)

-- 1. Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);

-- 2. Messages table
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

## Running the Server

```bash
cd backend
uvicorn main:app --reload
```

Server runs at: http://localhost:8000

## API Usage

### 1. Login to get JWT token

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com", "password": "YourPassword123!"}'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "your@email.com"
}
```

### 2. Send a chat message (new conversation)

```bash
export TOKEN="your-access-token"
export USER_ID="your-user-id"

curl -X POST "http://localhost:8000/api/${USER_ID}/chat" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add a task to buy groceries"}'
```

Response:
```json
{
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "response": "I've added 'Buy groceries' to your task list.",
  "tool_calls": [
    {
      "tool_name": "add_task",
      "arguments": {"user_id": "123e...", "title": "Buy groceries"},
      "result": {"success": true, "data": {"task_id": "789e...", "title": "Buy groceries", "status": "pending"}}
    }
  ]
}
```

### 3. Continue the conversation

```bash
export CONV_ID="550e8400-e29b-41d4-a716-446655440000"

curl -X POST "http://localhost:8000/api/${USER_ID}/chat" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"Show my tasks\", \"conversation_id\": \"${CONV_ID}\"}"
```

### 4. List your conversations

```bash
curl -X GET "http://localhost:8000/api/${USER_ID}/conversations" \
  -H "Authorization: Bearer ${TOKEN}"
```

### 5. Get conversation history

```bash
curl -X GET "http://localhost:8000/api/${USER_ID}/conversations/${CONV_ID}" \
  -H "Authorization: Bearer ${TOKEN}"
```

## Example Interactions

| User Message | AI Response | Tools Used |
|--------------|-------------|------------|
| "Add a task to buy groceries" | "I've added 'Buy groceries' to your task list." | add_task |
| "Show my tasks" | "Here are your tasks: 1. Buy groceries (pending)" | list_tasks |
| "Mark buy groceries as done" | "Done! I've marked 'Buy groceries' as completed." | complete_task |
| "Delete it" | "I've deleted the 'Buy groceries' task." | delete_task |
| "Add two tasks: call mom and pay bills" | "I've added both tasks to your list." | add_task (x2) |

## Troubleshooting

### "Invalid or expired token"
- Re-login to get a new JWT token
- Check that BETTER_AUTH_SECRET matches your login configuration

### "Conversation not found"
- Verify the conversation_id is correct
- Ensure you own the conversation (created with your user_id)

### "Service temporarily unavailable"
- Check DATABASE_URL is correct
- Verify Neon database is accessible
- Check OPENAI_API_KEY is valid

### Agent timeout
- OpenAI API may be slow; retry the request
- Check your OpenAI API quota/rate limits

## File Structure After Implementation

```
backend/
├── src/
│   ├── models/
│   │   ├── conversation.py   # Conversation model
│   │   └── message.py        # Message model
│   ├── services/
│   │   └── chat_service.py   # Conversation CRUD
│   ├── api/
│   │   ├── chat.py           # Chat endpoints
│   │   └── schemas/
│   │       └── chat.py       # Request/Response DTOs
│   └── agents/
│       └── todo_agent.py     # AI agent configuration
└── requirements.txt          # Updated with openai-agents
```
