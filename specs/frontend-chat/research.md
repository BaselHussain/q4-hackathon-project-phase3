# Research: Frontend Chat Interface

**Feature**: Frontend Chat Interface
**Date**: 2026-02-05
**Phase**: 0 (Research)

## 1. Existing Frontend Structure

### Application Pages
- `/` — Landing page
- `/login` — Login page
- `/signup` — Signup page
- `/dashboard` — Dashboard (protected)
- `/tasks` — Task management (protected)
- `/theme-demo` — Theme demo page
- **No existing chat UI** — clean slate

### Authentication System
- JWT tokens stored in `localStorage` via `lib/auth.ts`
- Key functions: `getToken()`, `getUserId()`, `isAuthenticated()`, `decodeToken()`
- Token includes `sub` claim with user UUID
- Axios interceptor in `lib/api.ts` auto-attaches `Authorization: Bearer {token}` header
- 401 response interceptor: clears session, redirects to `/login`
- `ProtectedRoute` component wraps protected pages

### Theme Infrastructure
- **Currently dark-only**: `ThemeProvider` hardcodes `theme: 'dark'` with no-op `toggleTheme`
- Root layout sets `className="dark"` on `<html>` element
- `ThemeToggle` component exists but does nothing (toggle is wired to no-op)
- `ThemeWrapper` component applies theme class to children
- Types define `Theme = 'light' | 'dark'`

### Design System
- **Tailwind CSS 4.0** (PostCSS, not class-based config)
- **Fonts**: Geist Sans + Geist Mono
- **Colors**: zinc-950/900/800 backgrounds, indigo-600/500 accents, purple gradients
- **Borders**: border-zinc-800/60 with transparency
- **Radius**: rounded-xl, rounded-lg
- **Animations**: Framer Motion
- **Toasts**: Sonner
- **Icons**: Lucide React
- **UI Components**: shadcn/ui (button, card, dialog, input, badge, etc.)

### Key Dependencies (package.json)
- `next@16.1.4`, `react@19.2.3`, `react-dom@19.2.3`
- `axios@1.7.7` — HTTP client
- `react-hook-form@7.71.1` + `zod@4.3.6` — Forms/validation
- `framer-motion@12.29.2` — Animations
- `lucide-react@0.563.0` — Icons
- `sonner@2.0.7` — Toasts
- `geist@1.5.1` — Fonts

## 2. Backend Chat API (Spec 5)

### Endpoints Available

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/{user_id}/chat` | POST | Send message, get AI response |
| `/api/{user_id}/conversations` | GET | List user's conversations |
| `/api/{user_id}/conversations/{conversation_id}` | GET | Get conversation with messages |

### POST /api/{user_id}/chat
**Request**: `{ message: string, conversation_id?: UUID }`
**Response**: `{ conversation_id: UUID, response: string, tool_calls: [{ tool_name, arguments, result }] }`
**Auth**: JWT Bearer token, user_id must match token `sub`
**Rate Limit**: 10 req/min per IP
**Errors**: RFC 7807 format (400, 401, 403, 404, 429, 503)

### GET /api/{user_id}/conversations
**Response**: `[{ id, title, created_at, updated_at, message_count }]`

### GET /api/{user_id}/conversations/{conversation_id}
**Response**: `{ id, title, created_at, updated_at, messages: [{ id, role, content, tool_calls, created_at }] }`

### Agent Configuration
- Model: `gpt-4o-mini`
- MCP tools: add_task, list_tasks, complete_task, delete_task, update_task
- Timeout: 45s
- User ID injected into agent instructions

## 3. OpenAI ChatKit Research

### ChatKit React SDK (`@openai/chatkit-react`)

**Core Components**:
- `useChatKit(config)` — Hook that returns `{ control }` object
- `<ChatKit control={control} />` — Renders the full chat interface

**Configuration Options**:
```typescript
useChatKit({
  api: {
    url: "http://localhost:8000/chatkit",  // Backend endpoint
    domainKey: "your-domain-key",           // Auth domain key
  },
  theme: {
    colorScheme: "dark" | "light",
    color: {
      grayscale: { hue: 220, tint: 6, shade: -1 },
      accent: { primary: "#6366f1", level: 1 },  // Indigo
    },
    radius: "round",
  },
  startScreen: {
    greeting: "Welcome message",
    prompts: ["Suggestion 1", "Suggestion 2"],
  },
  onClientTool: async (invocation) => { /* handle client-side tools */ },
  onError: ({ error }) => { /* handle errors */ },
})
```

**Key Finding**: ChatKit React communicates with a specific backend protocol. It does NOT send raw REST calls to `/api/{user_id}/chat`. Instead, it sends to a `/chatkit` endpoint that speaks the ChatKit protocol (SSE streaming, thread management).

### ChatKit Python Server SDK (`chatkit.server`)

**Core Class**: `ChatKitServer` — subclass it to implement custom agent logic

```python
from chatkit.server import ChatKitServer, StreamingResult
from chatkit.types import ThreadMetadata, UserMessageItem, ThreadStreamEvent
from chatkit.agents import AgentContext, stream_agent_response

class TodoChatKitServer(ChatKitServer):
    async def respond(self, thread, item, context):
        # Convert ChatKit thread to agent input
        # Call existing run_agent()
        # Stream response back via ChatKit protocol
```

**FastAPI Integration**:
```python
@app.post("/chatkit")
async def chatkit_endpoint(request: Request):
    server = get_chatkit_server()
    payload = await request.body()
    result = await server.process(payload, {"request": request})
    if isinstance(result, StreamingResult):
        return StreamingResponse(result, media_type="text/event-stream")
    return JSONResponse(result)
```

**Key Insight**: Using `ChatKitServer` means we get streaming for free. The backend wraps our existing `run_agent()` and translates to ChatKit protocol. The existing REST endpoints (`/api/{user_id}/chat`, conversations) are still used for conversation listing/history but NOT for the main chat interaction.

### Theme Support
- ChatKit supports `colorScheme: 'dark' | 'light'` in theme config
- Colors can be customized (grayscale hue/tint/shade, accent primary/level)
- Theme changes can be dynamic by updating the config

## 4. Theme Migration: next-themes

### Why next-themes?
- De-facto standard for Next.js theme management
- Handles SSR hydration mismatch (no FOUC)
- Supports system preference detection
- Auto-persists to localStorage
- Works with Tailwind CSS `dark:` variant

### Integration Pattern
```tsx
// app/layout.tsx
import { ThemeProvider } from 'next-themes'

<html suppressHydrationWarning>
  <body>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  </body>
</html>
```

### Migration from Current Stub
- Remove hardcoded `className="dark"` from `<html>`
- Replace custom `ThemeProvider` with next-themes `ThemeProvider`
- Update `useTheme` imports to use next-themes
- ThemeToggle component uses `useTheme()` from next-themes
- Existing Tailwind `dark:` classes continue working

## 5. Integration Architecture

### Data Flow

```
User → ChatKit React Widget → POST /chatkit (ChatKit protocol)
                                    ↓
                             ChatKitServer.respond()
                                    ↓
                             run_agent(user_id, message, history)
                                    ↓
                             MCPServerStreamableHttp → MCP Server → DB
                                    ↓
                             SSE Stream ← ChatKit React Widget ← User sees response
```

### Conversation History Flow (Separate)

```
User opens chat → useConversations hook → GET /api/{user_id}/conversations
User selects conversation → GET /api/{user_id}/conversations/{id} → Load in sidebar
User starts chatting → ChatKit handles new messages via /chatkit endpoint
```

### Auth Flow

```
ChatKit custom fetch → Reads JWT from localStorage → Adds Authorization header
Backend /chatkit → Extracts JWT → Validates → Passes user_id to agent
```

## 6. Key Findings Summary

| Finding | Impact | Decision |
|---------|--------|----------|
| ChatKit has its own backend protocol (not raw REST) | Need new `/chatkit` endpoint | Use `chatkit.server.ChatKitServer` Python SDK |
| Existing theme is hardcoded dark-only | Must replace with real theme provider | Use `next-themes` package |
| ChatKit supports theming via config | Can match design system | Pass `colorScheme` from next-themes to ChatKit |
| ChatKit doesn't include conversation history UI | Need custom sidebar | Build ConversationList component |
| Backend already has conversation list/detail endpoints | Can reuse for sidebar | Call existing GET endpoints |
| ChatKit handles streaming internally | No manual SSE handling in frontend | ChatKitServer handles streaming |
| JWT auth needs custom fetch for ChatKit | Must override ChatKit's default fetch | Use `api.fetch` config with custom function |
