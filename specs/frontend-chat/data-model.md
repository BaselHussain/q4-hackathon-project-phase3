# Data Model: Frontend Chat Interface (Floating Widget)

**Feature**: Frontend Chat Interface (Floating Widget)
**Date**: 2026-02-05
**Updated**: 2026-02-06 (Floating Widget Architecture)
**Phase**: 1 (Design)

## Frontend Types

### Chat Message Types

```typescript
/** A single message in a chat thread */
interface ChatMessage {
  id: string;                      // UUID
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls: ToolCallResult[] | null;
  createdAt: string;               // ISO 8601 datetime
}

/** Result of a tool invocation by the AI agent */
interface ToolCallResult {
  toolName: string;    // e.g., "add_task", "list_tasks"
  arguments: Record<string, unknown>;
  result: Record<string, unknown>;
}
```

### ChatKit Configuration Types

```typescript
/** ChatKit API configuration */
interface ChatKitApiConfig {
  url: string;                  // Backend /chatkit endpoint URL
  fetch?: typeof globalThis.fetch; // Custom fetch with JWT
}

/** ChatKit theme configuration */
interface ChatKitThemeConfig {
  colorScheme: 'dark' | 'light';
  color: {
    grayscale: { hue: number; tint: number; shade: number };
    accent: { primary: string; level: number };
  };
  radius: 'round' | 'square';
}

/** ChatKit start screen configuration */
interface ChatKitStartScreen {
  greeting: string;
  prompts: string[];
}
```

### Widget State Types

```typescript
/** ChatKitWidget component props */
interface ChatKitWidgetProps {
  prePopulatedText?: string;
  onClearPrePopulatedText?: () => void;
}

/** ChatKitInner component props */
interface ChatKitInnerProps {
  ChatKit: any;
  useChatKit: any;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  prePopulatedText?: string;
  onClearPrePopulatedText?: () => void;
}

/** TextSelectionMenu component props */
interface TextSelectionMenuProps {
  onAskFromAI: (selectedText: string) => void;
}
```

## Backend Data (Existing - Reference Only)

These models already exist in the backend from Spec 5. The frontend consumes them via ChatKit protocol.

### ChatSession (backend/app/database.py)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | FK to users.id |
| thread_id | string | ChatKit thread ID (maps to session) |
| created_at | datetime | UTC |
| updated_at | datetime | UTC |

### ChatMessage (backend/app/database.py)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| session_id | UUID | FK to chat_sessions.id |
| role | enum | user / assistant / system |
| message_text | text | Message content |
| source_references | JSON | Nullable, array of source objects |
| created_at | datetime | UTC |

## State Management

### Widget State

```
ChatKitWidget (Root Layout)
├── isMinimized: boolean                     (local state)
├── prePopulatedText: string | undefined     (from TextSelectionMenu)
├── ChatKitComponents: any                   (dynamic import)
└── error: string | null                     (load error)

ChatKitInner (Inner Component)
├── isReady: boolean                         (ChatKit onReady)
├── error: string | null                     (ChatKit onError)
├── control: ChatKitControl                  (from useChatKit)
├── setThreadId: function                    (from useChatKit)
├── setComposerValue: function               (from useChatKit)
└── resolvedTheme: 'light' | 'dark'         (from next-themes)

TextSelectionMenu
├── menuVisible: boolean                     (local state)
├── menuPosition: { x: number; y: number }  (local state)
└── selectedText: string                     (local state)
```

### Persistence

```
localStorage
├── chatkit_thread_id: string               (ChatKit thread ID)
└── theme: 'light' | 'dark' | 'system'     (next-themes)

Neon Postgres (via backend)
├── chat_sessions (thread_id → session_id mapping)
└── chat_messages (full message history)
```

### Data Flow

```
User Action                    Frontend State               Backend
───────────                    ──────────────               ───────
Click chat icon        ──→  isMinimized = false
Send message           ──→  ChatKit.control.send()    ──→  POST /chatkit (SSE)
                                                       ←──  Stream response
Receive response       ←──  ChatKit displays          ←──  SSE events
Close widget           ──→  isMinimized = true
Thread change          ──→  localStorage.setItem()
Reopen widget          ──→  setThreadId(saved)        ──→  Restore from DB
Toggle theme           ──→  next-themes.setTheme()    ──→  ChatKit colorScheme updates
Highlight text         ──→  TextSelectionMenu shows
Click "Ask from AI"    ──→  prePopulatedText set      ──→  Widget opens + composer fills
```

## ChatKit Protocol

### Request Format (POST /chatkit)

```typescript
// ChatKit sends this format (handled by ChatKit SDK)
{
  thread_id?: string;           // Optional, for resuming
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}
```

### Response Format (SSE Stream)

```typescript
// ChatKit expects these event types (handled by ChatKit SDK)
event: thread.item.added
data: { item: { id, role, content, ... } }

event: thread.item.updated
data: { item_id, ... }

event: thread.item.done
data: { item: { id, role, content, ... } }
```

## Naming Conventions

| Backend (snake_case) | Frontend (camelCase) | Notes |
|---------------------|---------------------|-------|
| thread_id | threadId | ChatKit thread identifier |
| user_id | userId | From JWT token |
| session_id | sessionId | Backend session mapping |
| created_at | createdAt | Timestamps |
| message_text | content | Message content field |
| tool_calls | toolCalls | JSON array |
| tool_name | toolName | In tool_calls items |

Transform functions handled by ChatKit SDK for protocol compliance.

## Component Hierarchy

```
RootLayout (app/layout.tsx)
├── ThemeProvider (next-themes)
│   ├── {children} (page content)
│   ├── TextSelectionMenu
│   │   └── Context menu (Ask from AI, Copy)
│   └── ChatKitWidget
│       ├── Floating icon (minimized state)
│       └── ChatKitInner (expanded state)
│           ├── Minimize button
│           └── ChatKit component
│               ├── Start screen
│               ├── Message thread
│               └── Input composer
```

## Key Differences from Original Plan

**Removed**:
- `Conversation` type (no sidebar)
- `ConversationDetail` type (no sidebar)
- `UseConversationsReturn` type (no sidebar hook)
- Conversation list/detail API calls (thread persistence via localStorage)

**Added**:
- `ChatKitWidgetProps` (widget component props)
- `ChatKitInnerProps` (inner component props)
- `TextSelectionMenuProps` (text selection props)
- Widget state types (isMinimized, prePopulatedText, etc.)
- localStorage persistence for thread_id
- ChatKit protocol types (request/response format)

**Simplified**:
- State management (no conversation list state)
- Data flow (direct ChatKit ↔ backend, no intermediate conversation API)
- Component hierarchy (floating widget instead of page + sidebar)
