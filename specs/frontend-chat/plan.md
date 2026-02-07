# Implementation Plan: Frontend Chat Interface (Floating Widget)

**Branch**: `frontend-chat` | **Date**: 2026-02-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/frontend-chat/spec.md` + chatbot-developer skill v3.0.0

## Summary

Build a floating overlay ChatKit widget connected to the AI agent backend from Spec 5. The frontend integrates ChatKit's `useChatKit` hook and `<ChatKit>` component with a ChatKit-compatible backend endpoint (ChatKit Python Server SDK on FastAPI), supports dark/light theming synced with `next-themes`, text selection context menu ("Ask from AI"), thread persistence via localStorage, and JWT-protected access. All chat responses come from the Spec 5 AI agent via MCP tools.

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 16.1.4 (App Router), React 19.2.3
**Primary Dependencies**: `@openai/chatkit-react` (ChatKit UI), `next-themes` (theme management), `openai-chatkit` (Python backend SDK)
**Storage**: Thread ID in localStorage (frontend), chat history in Neon Postgres (backend)
**Testing**: Manual testing via browser + backend verification
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge), mobile responsive (375px+)
**Project Type**: Web application (floating overlay widget)
**Performance Goals**: Widget open/close <300ms, theme switch <300ms, thread restore <1s
**Constraints**: JWT auth required, mobile-responsive, ChatKit widget must match design system
**Scale/Scope**: Single-user experience, floating widget accessible from any page

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Spec-Driven Development | ✅ PASS | Following approved specs/frontend-chat/spec.md + chatbot-developer skill |
| II. AI-First Stateless Architecture | ✅ PASS | Frontend delegates all AI logic to backend; no AI processing client-side |
| III. Secure Authentication | ✅ PASS | JWT auth via custom fetch; widget hidden for unauthenticated users |
| IV. Persistent Data & Conversation State | ✅ PASS | Thread persistence via localStorage + Neon Postgres backend |
| V. OpenAI Agents SDK Integration | N/A | Backend concern (Spec 5) |
| VI. Stateless Tool Design | N/A | Backend concern (Spec 4) |
| VII. Conversational UI Experience | ✅ PASS | ChatKit provides premium chat interface with streaming |
| VIII. MCP Server Protocol | N/A | Backend concern (Spec 4) |

**Gate Result**: ✅ PASS - All applicable principles satisfied

## Project Structure

### Documentation (this feature)

```text
specs/frontend-chat/
├── plan.md              # This file (updated for floating widget)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal types, no sidebar)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── chatkit-adapter.md  # ChatKit ↔ Backend translation contract
├── checklists/
│   └── requirements.md  # Spec quality checklist (from /sp.specify)
└── tasks.md             # Phase 2 output (updated for floating widget)
```

### Source Code (repository root)

```text
frontend/
├── app/
│   └── layout.tsx                # UPDATE: Add next-themes + mount widget
├── components/
│   ├── ChatKitWidget.tsx         # NEW: Floating overlay widget
│   ├── TextSelectionMenu.tsx     # NEW: Text selection context menu
│   └── ThemeToggle.tsx           # UPDATE: Wire to real next-themes toggle
├── lib/
│   ├── context/
│   │   └── ThemeContext.tsx      # UPDATE: Replace stub with next-themes
│   └── chatkit-adapter.ts        # NEW: Custom JWT fetch for ChatKit
├── types/
│   └── index.ts                  # UPDATE: Add minimal chat types
└── package.json                  # UPDATE: Add @openai/chatkit-react, next-themes

backend/
├── app/
│   ├── chatkit_store.py          # NEW: ChatKit MemoryStore
│   └── chatkit_server.py         # NEW: ChatKitServer wrapping run_agent()
├── main.py                       # UPDATE: Add /chatkit endpoint
└── requirements.txt              # UPDATE: Add openai-chatkit
```

**Structure Decision**: Floating overlay widget (Option 3) - minimal footprint, always accessible, no dedicated page needed.

## Decision Table

| Decision | Choice | Rationale | Alternatives Rejected |
|----------|--------|-----------|----------------------|
| Chat UI Library | OpenAI ChatKit (`@openai/chatkit-react`) | Mandated by spec FR-002; purpose-built for AI chat; handles streaming, message rendering, input | Custom chat components (more work, less polished) |
| ChatKit Backend Integration | ChatKit Python Server SDK (`chatkit.server`) with FastAPI endpoint | Native ChatKit protocol; handles streaming SSE, thread management, agent coordination; ChatKit React expects this protocol | Custom translation layer (fragile, must reverse-engineer ChatKit protocol); Direct REST adapter (no streaming support) |
| Theme Management | `next-themes` package | De-facto standard for Next.js; handles SSR, localStorage, system preference detection; avoids FOUC | Custom ThemeContext (already exists but is a stub); CSS-only (no system preference detection) |
| Thread Persistence | localStorage + Neon Postgres | Thread ID saved to localStorage for instant restore; full history in Neon via ChatKitServer | Session-only (loses history on refresh); Cookies (unnecessary complexity) |
| Widget Architecture | Floating overlay (always mounted, CSS toggle) | Instant open/close (<300ms); accessible from any page; no routing needed | Dedicated page (requires navigation); Modal (blocks page interaction) |
| Theme Persistence | localStorage via next-themes | Built-in next-themes feature; persists across sessions; respects system preference | Cookie-based (unnecessary complexity); Server-side (overkill) |
| State Management | React hooks + context | Existing pattern in codebase; sufficient for widget state; no global store needed | Redux/Zustand (over-engineering for single feature) |
| Backend Adapter Approach | New `/chatkit` endpoint using `chatkit.server.ChatKitServer` | ChatKit React SDK communicates via its own protocol (not raw REST); `ChatKitServer` handles all protocol details + streaming | Modify existing `/api/{user_id}/chat` (breaks existing contract); Client-side translation (complex, unreliable) |
| Agent Integration | `ChatKitServer` delegates to existing `run_agent()` from Spec 5 | Reuses proven agent logic; ChatKitServer wraps the agent call with ChatKit protocol | Duplicate agent setup (violates DRY); New agent instance (unnecessary) |
| Text Selection Feature | Context menu with "Ask from AI" button | Enhances UX; pre-populates widget with selected text; uses native browser selection API | Browser extension (requires installation); Keyboard shortcut only (poor discoverability) |

## Implementation Phases

### Phase 0: Research (Complete)

See [research.md](./research.md) for detailed findings.

**Key Decisions**:
1. Use `@openai/chatkit-react` for the chat UI component
2. Use ChatKit Python Server SDK (`chatkit.server`) for backend protocol compliance
3. Use `next-themes` for dark/light theme switching (replacing the current stub)
4. Floating overlay widget instead of dedicated page (always accessible, instant open/close)
5. Thread persistence via localStorage (thread_id saved on `onThreadChange`)
6. Text selection context menu ("Ask from AI") pre-populates widget composer
7. The ChatKit endpoint will wrap the existing `run_agent()` from Spec 5
8. User ID passed to ChatKit via JWT extraction in backend endpoint
9. ChatKit `colorScheme` prop synced with the active next-themes theme

### Phase 1: Design & Contracts

**1.1 Data Models** (see [data-model.md](./data-model.md))
- Frontend types: `ChatMessage`, `ToolCallResult` (minimal, no sidebar types)
- Widget state: `isMinimized`, `prePopulatedText`, `isReady`
- ChatKit configuration types

**1.2 API Contracts** (see [contracts/chatkit-adapter.md](./contracts/chatkit-adapter.md))
- POST `/chatkit` - ChatKit protocol endpoint (streaming SSE)
- No conversation list endpoints needed (thread persistence via localStorage)

**1.3 ChatKit Integration Design**
- `ChatKitServer` subclass connects to existing `run_agent()` from `backend/src/agents/todo_agent.py`
- Frontend ChatKit configured with `api.url` pointing to `/chatkit` endpoint
- JWT token passed via custom fetch with Authorization header
- Theme colorScheme dynamically set from next-themes `resolvedTheme`
- Thread ID saved to localStorage on `onThreadChange`, restored on `onReady`

### Phase 2: Implementation Tasks

Tasks generated in [tasks.md](./tasks.md) covering:

1. **Setup (Phase 1)**
   - Install `@openai/chatkit-react` + `next-themes` (frontend)
   - Install `openai-chatkit` (backend)
   - Add minimal TypeScript types

2. **Backend ChatKit Adapter (Phase 2)**
   - Create `chatkit_store.py` (MemoryStore)
   - Create `chatkit_server.py` (AppChatKitServer wrapping `run_agent()`)
   - Add `/chatkit` POST endpoint with JWT extraction
   - Add CORS OPTIONS handler

3. **Theme Infrastructure (Phase 3)**
   - Replace ThemeContext stub with `next-themes`
   - Update root layout with ThemeProvider
   - Wire ThemeToggle to real functionality

4. **Floating ChatKit Widget (Phase 4)**
   - Create custom JWT fetch adapter
   - Create ChatKitWidget component (dynamic import, minimize/maximize)
   - Create ChatKitInner component (useChatKit config, theme sync, thread restore)
   - Add pre-populated text handling

5. **Text Selection Context Menu (Phase 5)**
   - Create TextSelectionMenu component
   - Mount widget + menu in root layout

6. **Error Handling & Polish (Phase 6)**
   - Expired token handling
   - Network error detection
   - Character limit enforcement
   - Offline indicator
   - Mobile optimizations

7. **Documentation & Testing (Phase 7)**
   - Update .env.example
   - Create manual testing checklist

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `frontend/package.json` | UPDATE | Add `@openai/chatkit-react`, `next-themes` |
| `frontend/app/layout.tsx` | UPDATE | Add next-themes ThemeProvider + mount widget + text selection menu |
| `frontend/components/ChatKitWidget.tsx` | CREATE | Floating overlay widget with minimize/maximize |
| `frontend/components/TextSelectionMenu.tsx` | CREATE | Text selection context menu |
| `frontend/components/ThemeToggle.tsx` | UPDATE | Wire to next-themes toggle |
| `frontend/lib/context/ThemeContext.tsx` | UPDATE | Replace stub with next-themes |
| `frontend/lib/chatkit-adapter.ts` | CREATE | Custom JWT fetch for ChatKit |
| `frontend/types/index.ts` | UPDATE | Add ChatMessage, ToolCallResult types |
| `backend/requirements.txt` | UPDATE | Add `openai-chatkit` package |
| `backend/app/chatkit_store.py` | CREATE | ChatKit MemoryStore |
| `backend/app/chatkit_server.py` | CREATE | ChatKitServer wrapping run_agent() |
| `backend/main.py` | UPDATE | Add /chatkit endpoint + CORS handler |
| `backend/.env.example` | UPDATE | Document OPENAI_API_KEY / GEMINI_API_KEY |

**Removed from Original Plan**:
- Dedicated `/chat` page (no longer needed)
- Conversation sidebar components (ConversationList, ConversationItem, useConversations)
- Conversation API methods (getConversations, getConversationDetail)
- ProtectedRoute layout (auth check in widget itself)
- Chat navigation link (widget always available)

## Testing Strategy

### Manual Testing Commands

```bash
# 1. Start MCP server
cd backend && .venv\Scripts\python mcp_server.py

# 2. Start backend
cd backend && .venv\Scripts\uvicorn main:app --reload --port 8000

# 3. Start frontend
cd frontend && npm run dev

# 4. Test unauthenticated state
# - Open browser to http://localhost:3000
# - Verify no floating chat icon appears
# - Login via /login

# 5. Test authenticated widget
# - After login, verify floating indigo chat icon appears (bottom-right)
# - Click icon → widget opens (600px × 400px)
# - Send "Add a task to buy groceries"
# - Verify AI responds with confirmation
# - Click minimize button → widget closes instantly

# 6. Test thread persistence
# - Refresh page (F5)
# - Click chat icon → widget opens
# - Verify previous conversation is restored
# - Send follow-up message → verify context preserved

# 7. Test theme toggle
# - Click theme toggle (sun/moon icon)
# - Verify ChatKit widget colors adapt (dark: dark bg, light: white bg)
# - Verify text readability in both modes
# - Refresh → verify theme persists

# 8. Test text selection
# - Highlight any text on the page (>3 chars)
# - Verify context menu appears with "Ask from AI" button
# - Click "Ask from AI"
# - Verify widget opens with selected text pre-populated
# - Send message → verify AI responds with context

# 9. Test mobile
# - Open DevTools → mobile viewport (375px)
# - Verify widget is usable (responsive sizing)
# - Verify minimize button is touch-friendly

# 10. Test error handling
# - Stop backend server
# - Send message in widget
# - Verify friendly error message appears
# - Restart backend → verify widget recovers
```

### Backend ChatKit Endpoint Testing

```bash
# Test ChatKit endpoint directly (requires valid JWT)
curl -X POST http://localhost:8000/chatkit \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"thread_id": "test-thread", "messages": [{"role": "user", "content": "Add a task to buy groceries"}]}'
# Should return streaming SSE response
```

## Complexity Tracking

> No violations requiring justification. Design follows constitution principles. Floating widget architecture is simpler than dedicated page (28 tasks vs 37 tasks).

## Risks

| Risk | Mitigation |
|------|------------|
| ChatKit React SDK version incompatibility with React 19 | Check npm peer deps before install; fallback to pinned version |
| ChatKit protocol mismatch with custom backend | Using official `chatkit.server` Python SDK ensures protocol compliance |
| next-themes FOUC on page load | Use `suppressHydrationWarning` on html element + next-themes script injection |
| ChatKit styling conflicts with existing Tailwind | Scope ChatKit within fixed-position container; use ChatKit theme API for colors |
| Widget overlaps page content | Fixed position bottom-right with high z-index (9999); minimize button for user control |
| Thread ID collision across users | Thread ID is client-generated UUID; backend maps to user_id via JWT |

## Next Steps

1. ✅ Tasks generated in [tasks.md](./tasks.md) (28 tasks, 7 phases)
2. Implement in order: Setup → Backend → Theme → Widget → Text Selection → Polish → Docs
3. Test with manual testing commands above
4. Create PR for review

## Architecture Benefits

**Floating Widget vs Dedicated Page**:
- ✅ Always accessible (no navigation needed)
- ✅ Instant open/close (<300ms)
- ✅ Simpler implementation (9 fewer tasks)
- ✅ Better mobile UX (overlay vs full page)
- ✅ Thread persistence via localStorage (no sidebar needed)
- ✅ Text selection integration (enhances any page)
