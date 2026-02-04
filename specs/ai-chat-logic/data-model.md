# Data Model: AI Agent & Chat Logic

**Feature**: AI Agent & Chat Logic
**Date**: 2026-02-04
**Branch**: `ai-chat-logic`

## Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    users     │       │  conversations   │       │   messages   │
├──────────────┤       ├──────────────────┤       ├──────────────┤
│ id (PK)      │──────<│ id (PK)          │──────<│ id (PK)      │
│ email        │       │ user_id (FK)     │       │ conv_id (FK) │
│ password_hash│       │ title            │       │ role         │
│ created_at   │       │ created_at       │       │ content      │
│ last_login_at│       │ updated_at       │       │ tool_calls   │
└──────────────┘       └──────────────────┘       │ created_at   │
     (existing)                                    └──────────────┘
```

## Entities

### 1. Conversation (NEW)

Represents a chat session between a user and the AI assistant.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, NOT NULL, DEFAULT uuid4() | Unique conversation identifier |
| `user_id` | UUID | FK → users.id, NOT NULL, INDEX | Owner of the conversation |
| `title` | VARCHAR(200) | NULLABLE | Auto-generated from first message or user-defined |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Conversation creation time |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW(), ON UPDATE NOW() | Last activity time |

**Business Rules**:
- Every conversation must have an owner (user_id NOT NULL)
- User isolation: users can only access their own conversations
- When user is deleted, all their conversations are deleted (CASCADE)
- Title defaults to NULL, can be auto-generated from first message
- updated_at refreshes on any new message

**SQLModel Definition**:
```python
class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", nullable=False, index=True)
    title: Optional[str] = Field(default=None, max_length=200)
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    )
    updated_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    )
```

---

### 2. Message (NEW)

Represents a single message within a conversation.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, NOT NULL, DEFAULT uuid4() | Unique message identifier |
| `conversation_id` | UUID | FK → conversations.id, NOT NULL, INDEX | Parent conversation |
| `role` | ENUM | NOT NULL, CHECK (user/assistant/system) | Message author role |
| `content` | TEXT | NOT NULL | Message text content |
| `tool_calls` | JSONB | NULLABLE | Array of tool invocations (assistant only) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Message creation time |

**Business Rules**:
- Every message must belong to a conversation
- Role must be one of: 'user', 'assistant', 'system'
- tool_calls only populated for assistant messages that invoked tools
- Messages are immutable after creation (no updates)
- When conversation is deleted, all messages are deleted (CASCADE)
- Messages ordered by created_at for history reconstruction

**tool_calls JSON Schema**:
```json
[
  {
    "tool_name": "add_task",
    "arguments": {
      "user_id": "uuid-string",
      "title": "Buy groceries",
      "description": null
    },
    "result": {
      "success": true,
      "data": {
        "task_id": "uuid-string",
        "title": "Buy groceries",
        "status": "pending"
      }
    }
  }
]
```

**SQLModel Definition**:
```python
class MessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    conversation_id: UUID = Field(foreign_key="conversations.id", nullable=False, index=True)
    role: MessageRole = Field(nullable=False)
    content: str = Field(sa_column=Column(Text, nullable=False))
    tool_calls: Optional[list] = Field(default=None, sa_column=Column(JSON, nullable=True))
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    )
```

---

### 3. ChatRequest (DTO - Not persisted)

Input payload for chat endpoint.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `message` | str | Required, 1-4000 chars | User's message text |
| `conversation_id` | UUID | Optional | Resume existing conversation |

**Validation Rules**:
- message cannot be empty or whitespace-only
- message max length 4000 characters
- conversation_id must be valid UUID format if provided

**Pydantic Schema**:
```python
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    conversation_id: Optional[UUID] = None

    @field_validator('message')
    def message_not_blank(cls, v):
        if not v.strip():
            raise ValueError('Message cannot be empty')
        return v.strip()
```

---

### 4. ChatResponse (DTO - Not persisted)

Output payload for chat endpoint.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `conversation_id` | UUID | Required | Conversation identifier |
| `response` | str | Required | AI assistant's response text |
| `tool_calls` | list[ToolCall] | Required (may be empty) | Tools invoked during response |

**ToolCall Structure**:
```python
class ToolCall(BaseModel):
    tool_name: str
    arguments: dict
    result: dict

class ChatResponse(BaseModel):
    conversation_id: UUID
    response: str
    tool_calls: list[ToolCall] = []
```

---

## Indexes

| Table | Index Name | Columns | Purpose |
|-------|------------|---------|---------|
| conversations | idx_conversations_user_id | user_id | Fast lookup by user |
| messages | idx_messages_conversation_id | conversation_id | Fast message retrieval |
| messages | idx_messages_created_at | created_at | Chronological ordering |

---

## State Transitions

### Conversation Lifecycle

```
[Not Exists] ──(first message)──> [Active]
                                     │
                                     ├──(new message)──> [Active] (updated_at refreshed)
                                     │
                                     └──(user deleted)──> [Deleted] (CASCADE)
```

### Message Lifecycle

```
[Not Exists] ──(created)──> [Persisted]
                                │
                                └──(conversation deleted)──> [Deleted] (CASCADE)
```

Messages are immutable - no state changes after creation.

---

## Migration Notes

**New Tables** (create in order):
1. `conversations` - depends on `users`
2. `messages` - depends on `conversations`

**Rollback**:
1. Drop `messages` table
2. Drop `conversations` table

No changes to existing tables (`users`, `tasks`).
