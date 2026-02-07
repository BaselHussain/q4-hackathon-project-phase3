# Tasks: Frontend Chat Interface (Floating Widget)

**Input**: Design documents from `/specs/frontend-chat/` + chatbot-developer skill
**Prerequisites**: plan.md, spec.md, chatbot-developer skill v3.0.0

**Architecture**: Floating overlay ChatKit widget (no dedicated page, no conversation sidebar)

**Tests**: Not explicitly requested - test tasks excluded (can be added later if needed)

**Organization**: Tasks are grouped by implementation layer (Backend, Theme, Widget, Polish)

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Project type**: Web application (frontend/ + backend/)
- **Frontend**: `frontend/app/`, `frontend/components/`, `frontend/lib/`, `frontend/types/`
- **Backend**: `backend/app/`, `backend/src/`, `backend/requirements.txt`
- Existing files referenced where applicable

---

## Phase 1: Setup

**Purpose**: Install dependencies and configure packages

- [x] T001 Install `@openai/chatkit-react` and `next-themes` in frontend/package.json via `npm install @openai/chatkit-react next-themes`
- [x] T002 [P] Install `openai-chatkit` Python package in backend/requirements.txt and run `.venv\Scripts\pip install openai-chatkit`
- [x] T003 [P] Add minimal chat-related TypeScript types to frontend/types/index.ts: `ChatMessage` (id, role, content, toolCalls, createdAt), `ToolCallResult` (toolName, arguments, result) — remove Conversation/ConversationDetail types (no sidebar)

---

## Phase 2: Backend ChatKit Adapter

**Purpose**: Create ChatKit server that wraps existing run_agent()

**⚠️ CRITICAL**: Backend must be complete before frontend widget work

- [x] T004 Create `backend/app/chatkit_store.py`: simple MemoryStore subclass inheriting from `chatkit.store.MemoryStore`
- [x] T005 Create `backend/app/chatkit_server.py`: AppChatKitServer subclass that wraps existing `run_agent()` from `backend/src/agents/todo_agent.py`, extracts user_id from context, saves messages to Neon via `chat_history.save_message()`, implements ID mapping fix for Gemini, uses `stream_agent_response()` for SSE streaming
- [x] T006 Add `/chatkit` POST endpoint to backend/main.py: extract JWT from Authorization header, decode to get user_id, call `chatkit_server.process()` with context, return StreamingResponse for SSE
- [x] T007 [P] Add `/chatkit` OPTIONS endpoint to backend/main.py for CORS preflight: return Response(status_code=200)
- [x] T008 [P] Verify CORS middleware in backend/main.py includes `/chatkit` endpoint in allowed origins

**Checkpoint**: Backend ready — `/chatkit` endpoint accepts JWT, streams agent responses via ChatKit protocol

---

## Phase 3: Theme Infrastructure

**Purpose**: Replace dark-only theme stub with next-themes

- [x] T009 Replace ThemeProvider stub in frontend/lib/context/ThemeContext.tsx: remove custom implementation, re-export `useTheme` from `next-themes`
- [x] T010 Update root layout frontend/app/layout.tsx: remove hardcoded `className="dark"` from `<html>`, add `suppressHydrationWarning`, wrap children with `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>` from `next-themes`
- [x] T011 Update ThemeToggle component in frontend/components/ThemeToggle.tsx: replace no-op with real `useTheme()` from next-themes, toggle between dark/light, use Sun/Moon icons from lucide-react, add smooth rotation animation with framer-motion

**Checkpoint**: Theme system working — toggle switches themes, preference persists, system preference detected

---

## Phase 4: Floating ChatKit Widget

**Purpose**: Create floating overlay widget with JWT auth and theme sync

- [x] T012 Create custom JWT fetch in frontend/lib/chatkit-adapter.ts: read token via `getToken()`, redirect to `/login` if missing, attach `Authorization: Bearer {token}` header to all requests
- [x] T013 Create ChatKitWidget component in frontend/components/ChatKitWidget.tsx: dynamic import of `@openai/chatkit-react`, check `isAuthenticated()` before rendering, manage `isMinimized` state, auto-open when `prePopulatedText` arrives, render minimized floating icon (indigo-500 circle with chat SVG) and full widget (600px height, 400px width), keep widget mounted for instant open/close
- [x] T014 Create ChatKitInner component in frontend/components/ChatKitWidget.tsx: configure `useChatKit` with custom JWT fetch, sync `colorScheme` with `resolvedTheme` from next-themes (dark: shade -1, light: shade -4), set accent to indigo-500, add startScreen with greeting + task prompts, implement `onReady` to set isReady state, implement `onThreadChange` to save thread_id to localStorage, implement `onError` to show error UI
- [x] T015 Add thread restoration in ChatKitInner: useEffect that calls `setThreadId(savedThreadId)` from localStorage when `isReady` is true
- [x] T016 Add pre-populated text handling in ChatKitInner: useEffect that calls `setComposerValue({ text: prePopulatedText })` when `prePopulatedText` and `isReady` are both true, then clears via `onClearPrePopulatedText()`
- [x] T017 Add minimize button to ChatKitInner: position absolute top-left (10px, 10px), semi-transparent background, down-arrow SVG icon, calls `onToggleMinimize()`

**Checkpoint**: Floating widget working — opens/closes instantly, syncs with theme, persists thread, authenticates with JWT

---

## Phase 5: Text Selection Context Menu

**Purpose**: Add "Ask from AI" feature for selected text

- [x] T018 Create TextSelectionMenu component in frontend/components/TextSelectionMenu.tsx: listen for `mouseup`/`touchend` events, show menu when text length > 3 chars, position menu below selection, render "Ask from AI" button (indigo-500) and "Copy" button (gray), call `onAskFromAI(selectedText)` when clicked, hide menu on outside click
- [x] T019 Mount ChatKitWidget + TextSelectionMenu in frontend/app/layout.tsx: add state for `prePopulatedText`, create `handleAskFromAI` callback that sets prePopulatedText, create `handleClearPrePopulatedText` callback that clears it, render `<TextSelectionMenu onAskFromAI={handleAskFromAI} />` and `<ChatKitWidget prePopulatedText={prePopulatedText} onClearPrePopulatedText={handleClearPrePopulatedText} />` inside ThemeProvider

**Checkpoint**: Text selection working — highlight text, click "Ask from AI", widget opens with text pre-populated

---

## Phase 6: Error Handling & Polish

**Purpose**: Handle edge cases, errors, and mobile optimization

- [x] T020 Add expired token handling in frontend/lib/chatkit-adapter.ts: check `isTokenExpired()` before fetch, redirect to `/login` if expired
- [x] T021 Add 401 error handling in ChatKitInner onError callback: detect 401 status, show "Session expired" toast via Sonner, redirect to `/login` after 2s delay
- [x] T022 Add network error detection in ChatKitInner onError callback: distinguish network failure, timeout, rate limit errors, show appropriate user-friendly messages via Sonner toast
- [ ] T023 [P] Add character limit enforcement: if ChatKit exposes input customization, add 4000 char limit with counter; otherwise document as future enhancement
- [ ] T024 [P] Add offline indicator in ChatKitWidget: detect `navigator.onLine` changes, show banner when offline
- [ ] T025 [P] Add mobile keyboard handling in ChatKitWidget: ensure widget remains visible when virtual keyboard opens (use `visualViewport` API or CSS `env(safe-area-inset-bottom)`)
- [x] T026 [P] Optimize mobile widget sizing: on screens <768px, reduce widget width to 100vw - 40px, reduce height to 80vh, ensure minimize button is touch-friendly (44px tap target)

**Checkpoint**: Error handling complete — expired tokens redirect, network errors show friendly messages, mobile experience optimized

---

## Phase 7: Documentation & Testing

**Purpose**: Document setup and verify end-to-end flow

- [x] T027 Update backend/.env.example: add comment for OPENAI_API_KEY or GEMINI_API_KEY (required by agents SDK), document NEON_DATABASE_URL format
- [ ] T028 Create manual testing checklist: (1) Unauthenticated user sees no widget, (2) Authenticated user sees floating icon, (3) Click icon opens widget, (4) Send "Add a task to buy groceries" → AI responds, (5) Refresh page → thread restores, (6) Toggle theme → widget colors adapt, (7) Highlight text → "Ask from AI" appears → widget opens with text, (8) Stop backend → send message → friendly error appears

**Checkpoint**: Documentation complete — setup instructions clear, testing checklist covers all features

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Backend (Phase 2)**: Depends on Setup (T001-T002) — BLOCKS all frontend work
- **Theme (Phase 3)**: Depends on Setup (T001) — can parallel with Backend
- **Widget (Phase 4)**: Depends on Backend + Theme completion
- **Text Selection (Phase 5)**: Depends on Widget completion
- **Polish (Phase 6)**: Depends on Widget completion — can parallel with Text Selection
- **Docs (Phase 7)**: Depends on all phases complete

### Parallel Opportunities

**After Setup (T001-T003)**:
```
Backend (T004-T008) || Theme (T009-T011)
```

**After Backend + Theme**:
```
Widget (T012-T017) → Text Selection (T018-T019) || Polish (T020-T026)
```

**Within Phases**:
- Phase 1: T002, T003 can run in parallel after T001
- Phase 2: T007, T008 can run in parallel after T006
- Phase 6: T023, T024, T025, T026 can all run in parallel

---

## Implementation Strategy

### MVP First (Core Widget)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Backend (T004-T008)
3. Complete Phase 3: Theme (T009-T011)
4. Complete Phase 4: Widget (T012-T017)
5. **STOP and VALIDATE**: Test widget opens, sends messages, receives responses, syncs theme
6. Continue with Phase 5-7 if MVP works

### Full Implementation

7. Phase 5: Text Selection (T018-T019)
8. Phase 6: Polish (T020-T026)
9. Phase 7: Documentation (T027-T028)

---

## Notes

### Files to CREATE
- `backend/app/chatkit_store.py` (T004)
- `backend/app/chatkit_server.py` (T005)
- `frontend/lib/chatkit-adapter.ts` (T012)
- `frontend/components/ChatKitWidget.tsx` (T013-T017)
- `frontend/components/TextSelectionMenu.tsx` (T018)

### Files to UPDATE
- `backend/requirements.txt` (T002)
- `backend/main.py` (T006-T008)
- `frontend/package.json` (T001)
- `frontend/types/index.ts` (T003)
- `frontend/lib/context/ThemeContext.tsx` (T009)
- `frontend/app/layout.tsx` (T010, T019)
- `frontend/components/ThemeToggle.tsx` (T011)
- `backend/.env.example` (T027)

### Removed from Original tasks.md
- Dedicated `/chat` page (no longer needed)
- Conversation sidebar components (ConversationList, ConversationItem, useConversations)
- Conversation API methods (getConversations, getConversationDetail)
- ProtectedRoute layout (auth check in widget itself)
- Chat navigation link (widget always available)
- Conversation-related TypeScript types

### Key Differences from Original Plan
- **Architecture**: Floating overlay widget instead of dedicated page
- **Auth**: Widget checks `isAuthenticated()` instead of ProtectedRoute
- **History**: Thread persistence via localStorage instead of sidebar
- **Navigation**: No navbar link needed (widget always accessible)
- **Simplicity**: 28 tasks instead of 37 (removed 9 sidebar-related tasks)
