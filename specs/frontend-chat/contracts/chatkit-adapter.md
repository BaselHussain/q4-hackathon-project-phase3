# Contract: ChatKit Backend Adapter (Floating Widget)

**Feature**: Frontend Chat Interface (Floating Widget)
**Date**: 2026-02-05
**Updated**: 2026-02-06 (Floating Widget Architecture)
**Phase**: 1 (Design)

## Overview

The ChatKit React SDK communicates with a backend endpoint using the ChatKit protocol (SSE streaming, thread management). This contract defines the adapter layer that bridges ChatKit protocol with our existing AI agent from Spec 5. The floating widget architecture uses localStorage for thread persistence, eliminating the need for conversation list endpoints.

## Endpoint: POST /chatkit

### Purpose
ChatKit-compatible endpoint that receives ChatKit protocol requests and returns streaming SSE responses. This is the primary (and only) communication channel between the ChatKit React widget and the backend AI agent.

### Request
- **URL**: `POST /chatkit`
- **Content-Type**: `application/json` (ChatKit protocol payload)
- **Authorization**: `Bearer {jwt-token}` (via custom fetch)

The request body is a ChatKit protocol payload managed by the SDK. It contains thread metadata, messages, and tool configurations. The `ChatKitServer.process()` method handles parsing.

**Example Request Body** (managed by ChatKit SDK):
```json
{
  "thread_id": "uuid-or-null",
  "messages": [
    {
      "role": "user",
      "content": "Add a task to buy groceries"
    }
  ]
}
```

### Response
- **Content-Type**: `text/event-stream` (SSE streaming)
- **Format**: ChatKit protocol events

Events include:
- `thread.item.added` — New message item added to thread
- `thread.item.updated` — Message item updated (streaming)
- `thread.item.done` — Message item completed
- Tool call events — When agent invokes MCP tools

**Example SSE Stream**:
```
event: thread.item.added
data: {"item":{"id":"msg-123","role":"assistant","content":"","status":"in_progress"}}

event: thread.item.updated
data: {"item_id":"msg-123","content":"I've added"}

event: thread.item.updated
data: {"item_id":"msg-123","content":"I've added the task"}

event: thread.item.done
data: {"item":{"id":"msg-123","role":"assistant","content":"I've added the task 'buy groceries' to your list.","status":"completed"}}
```

### Authentication
JWT token is attached via the ChatKit custom fetch function on the frontend:

```typescript
// Frontend: Custom fetch that adds JWT (frontend/lib/chatkit-adapter.ts)
export const customFetch: typeof fetch = async (url, init) => {
  const token = getToken();
  if (!token) {
    window.location.href = '/login';
    throw new Error('Not authenticated');
  }
  return fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },
  });
};
```

Backend extracts and validates JWT from the request:

```python
# Backend: Extract user_id from JWT in ChatKit endpoint (backend/main.py)
@app.post("/chatkit")
async def chatkit_endpoint(request: Request):
    # Extract user_id from JWT
    user_id = "anonymous"
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
        try:
            from src.auth.jwt import decode_access_token
            payload = decode_access_token(token)
            user_id = payload.get("sub", "anonymous")
        except Exception as e:
            logger.warning(f"JWT decode failed: {e}")

    # Process ChatKit request
    payload = await request.body()
    result = await chatkit_server.process(
        payload,
        {"request": request, "user_id": user_id}
    )

    if isinstance(result, StreamingResult):
        return StreamingResponse(result, media_type="text/event-stream")

    return result
```

### Error Handling

| Condition | Response |
|-----------|----------|
| Missing/invalid JWT | 401 Unauthorized (redirects to /login) |
| Agent timeout (45s) | 503 with friendly message in SSE stream |
| MCP server unavailable | 503 with friendly message in SSE stream |
| Rate limit exceeded | 429 Too Many Requests |
| Empty request body | 400 Bad Request |

### CORS Configuration

```python
# Backend: CORS middleware must include /chatkit endpoint
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OPTIONS handler for preflight
@app.options("/chatkit")
async def chatkit_options():
    return Response(status_code=200)
```

## Thread Persistence

### Frontend (localStorage)
Thread ID is saved to localStorage when ChatKit creates or updates a thread:

```typescript
// Frontend: Thread persistence (frontend/components/ChatKitWidget.tsx)
const chatkit = useChatKit({
  // ... other config
  onThreadChange: ({ threadId }: any) => {
    if (threadId) {
      localStorage.setItem('chatkit_thread_id', threadId);
    } else {
      localStorage.removeItem('chatkit_thread_id');
    }
  },
});

// Restore thread when widget opens
useEffect(() => {
  if (isReady && setThreadId) {
    const savedThreadId = localStorage.getItem('chatkit_thread_id');
    if (savedThreadId) {
      setThreadId(savedThreadId).catch((err: any) => {
        console.error('Failed to restore thread:', err);
      });
    }
  }
}, [isReady, setThreadId]);
```

### Backend (Neon Postgres)
Backend maps ChatKit thread_id to database session_id and saves all messages:

```python
# Backend: Thread-to-session mapping (backend/app/chatkit_server.py)
async def respond(self, thread: ThreadMetadata, input: UserMessageItem | None, context: Any):
    user_id = context.get("user_id", "anonymous")
    thread_id = thread.id if thread and hasattr(thread, 'id') else 'default_thread'

    # Get or create session for this thread
    session_id = await chat_history.get_or_create_session_by_thread(thread_id)

    # Save user message
    if user_input_text and session_id:
        await chat_history.save_message(
            session_id=session_id,
            message_text=user_input_text,
            role="user",
            source_references=[]
        )

    # Call agent and stream response
    result = Runner.run_streamed(
        await run_agent(user_id, user_input_text, []),
        input=user_input_text
    )

    async for event in stream_agent_response(agent_context, result):
        yield event

    # Save assistant message after streaming completes
    if assistant_message_text and session_id:
        await chat_history.save_message(
            session_id=session_id,
            message_text=assistant_message_text,
            role="assistant",
            source_references=[]
        )
```

## Backend Adapter Architecture

```
POST /chatkit
     │
     ▼
FastAPI endpoint (backend/main.py)
     │
     ▼
Extract JWT → Validate → Get user_id
     │
     ▼
ChatKitServer.process(payload, context={request, user_id})
     │
     ▼
ChatKitServer.respond(thread, item, context)
     │
     ▼
Get or create session by thread_id
     │
     ▼
Save user message to Neon Postgres
     │
     ▼
Convert ChatKit thread → agent input messages
     │
     ▼
run_agent(user_id, message, history)  ← Existing from Spec 5
     │
     ▼
Agent → MCPServerStreamableHttp → MCP Server → DB
     │
     ▼
stream_agent_response() → SSE events → ChatKit React Widget
     │
     ▼
Save assistant message to Neon Postgres
```

## Frontend ChatKit Configuration

```typescript
// Frontend: ChatKit widget configuration (frontend/components/ChatKitWidget.tsx)
const { control, setThreadId, setComposerValue } = useChatKit({
  api: {
    url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/chatkit`,
    fetch: customFetch,  // JWT-enriched fetch
  },
  theme: {
    colorScheme: resolvedTheme === 'dark' ? 'dark' : 'light',
    color: {
      grayscale: {
        hue: 240,
        tint: 6,
        shade: resolvedTheme === 'dark' ? -1 : -4,
      },
      accent: { primary: '#6366f1', level: 1 },  // Indigo-500
    },
    radius: 'round',
  },
  startScreen: {
    greeting: 'Hi! I can help you manage your tasks.',
    prompts: [
      'Add a task to buy groceries',
      'Show my tasks',
      'Mark my first task as done',
    ],
  },
  onReady: () => {
    setIsReady(true);
  },
  onThreadChange: ({ threadId }: any) => {
    if (threadId) {
      localStorage.setItem('chatkit_thread_id', threadId);
    } else {
      localStorage.removeItem('chatkit_thread_id');
    }
  },
  onError: ({ error }: any) => {
    console.error('ChatKit error:', error);
    setError(error?.message || 'ChatKit failed to initialize');
  },
});
```

## Text Selection Integration

The floating widget supports pre-populating the composer with selected text:

```typescript
// Frontend: Text selection → widget integration (frontend/app/layout.tsx)
const [prePopulatedText, setPrePopulatedText] = useState<string | undefined>(undefined);

const handleAskFromAI = useCallback((selectedText: string) => {
  setPrePopulatedText(selectedText);
}, []);

// In ChatKitWidget component
useEffect(() => {
  if (prePopulatedText && isReady && setComposerValue) {
    setComposerValue({ text: prePopulatedText })
      .then(() => {
        if (onClearPrePopulatedText) {
          onClearPrePopulatedText();
        }
      })
      .catch((err: any) => {
        console.error('Failed to set composer value:', err);
      });
  }
}, [prePopulatedText, isReady, setComposerValue, onClearPrePopulatedText]);
```

## Key Differences from Original Plan

**Removed Endpoints**:
- `GET /api/{user_id}/conversations` (no conversation list)
- `GET /api/{user_id}/conversations/{conversation_id}` (no conversation detail)

**Simplified Architecture**:
- Single endpoint: `POST /chatkit`
- Thread persistence via localStorage (frontend) + Neon Postgres (backend)
- No conversation sidebar or list UI
- Direct ChatKit ↔ backend communication

**Added Features**:
- Thread restoration from localStorage on widget open
- Text selection pre-population via `setComposerValue`
- Dynamic theme sync via `colorScheme` prop
- Floating widget always accessible (no routing needed)
