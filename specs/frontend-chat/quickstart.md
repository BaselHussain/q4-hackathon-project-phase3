# Quickstart: Frontend Chat Interface (Floating Widget)

**Feature**: Frontend Chat Interface (Floating Widget)
**Date**: 2026-02-05
**Updated**: 2026-02-06 (Floating Widget Architecture)

## Prerequisites

1. **Backend running** (from Spec 5): MCP server + FastAPI with AI agent
2. **Frontend running** (from Phase 2): Next.js dev server
3. **Authenticated user**: At least one user account created via `/signup`
4. **Environment variables**: `NEXT_PUBLIC_API_BASE_URL` set (default: `http://localhost:8000`)

## Setup

### 1. Install New Frontend Dependencies

```bash
cd frontend
npm install @openai/chatkit-react next-themes
```

### 2. Install New Backend Dependencies

```bash
cd backend
.venv\Scripts\pip install openai-chatkit
```

### 3. Start All Services

```bash
# Terminal 1: MCP Server
cd backend
.venv\Scripts\python mcp_server.py

# Terminal 2: Backend API
cd backend
.venv\Scripts\uvicorn main:app --reload --port 8000

# Terminal 3: Frontend
cd frontend
npm run dev
```

## Manual Testing

### Test 1: Unauthenticated State
1. Clear localStorage (DevTools → Application → Local Storage → Clear)
2. Navigate to `http://localhost:3000` (any page)
3. **Expected**: No floating chat icon appears
4. Login at `/login`
5. **Expected**: After login, floating indigo chat icon appears in bottom-right corner

### Test 2: Open Widget and Send Message
1. After logging in, click the floating chat icon (bottom-right)
2. **Expected**: ChatKit widget opens as overlay (600px × 400px)
3. Type: "Add a task to buy groceries"
4. Press Enter or click send
5. **Expected**: Loading indicator → AI responds confirming task added
6. Click the minimize button (top-left of widget)
7. **Expected**: Widget closes instantly, floating icon reappears

### Test 3: Thread Persistence
1. After Test 2, refresh the page (F5)
2. Click the floating chat icon
3. **Expected**: Previous conversation is automatically restored
4. Type: "Show my tasks"
5. **Expected**: AI lists tasks including "buy groceries" (context preserved)

### Test 4: Theme Toggle
1. Click the theme toggle (sun/moon icon in navbar)
2. **Expected**: Interface switches between dark and light themes
3. Open the chat widget
4. **Expected**: ChatKit widget colors adapt to current theme
   - Dark mode: dark background, light text
   - Light mode: white background, dark text
5. **Expected**: Text is readable in both modes
6. Refresh page
7. **Expected**: Chosen theme persists

### Test 5: Text Selection Feature
1. Navigate to any page with text (e.g., dashboard)
2. Highlight any text (more than 3 characters)
3. **Expected**: Context menu appears with "Ask from AI" and "Copy" buttons
4. Click "Ask from AI"
5. **Expected**: Chat widget opens with selected text pre-populated in input
6. Press Enter to send
7. **Expected**: AI responds with context about the selected text

### Test 6: Mobile Responsiveness
1. Open DevTools → Toggle device toolbar
2. Select iPhone SE (375px) or similar
3. Click the floating chat icon
4. **Expected**: Widget is fully usable (responsive sizing)
5. **Expected**: Minimize button is touch-friendly (44px tap target)
6. Type a message
7. **Expected**: Input remains visible when virtual keyboard opens

### Test 7: Error Handling
1. Stop the backend server (Ctrl+C on Terminal 2)
2. Open the chat widget and send a message
3. **Expected**: Friendly error message appears: "Unable to send message. Please check your connection and try again."
4. Restart the backend
5. Send another message
6. **Expected**: Chat works normally again

### Test 8: Widget Always Accessible
1. Navigate to different pages (dashboard, tasks, etc.)
2. **Expected**: Floating chat icon remains visible on all pages
3. Open widget on one page, send message, close widget
4. Navigate to another page, reopen widget
5. **Expected**: Conversation is preserved across page navigation

## Verification Checklist

- [ ] Unauthenticated users see no chat icon
- [ ] Authenticated users see floating indigo chat icon (bottom-right)
- [ ] Click icon → widget opens instantly (<300ms)
- [ ] Send message → AI responds with task confirmation
- [ ] Click minimize → widget closes instantly
- [ ] Refresh → reopen widget → conversation restored from localStorage
- [ ] Theme toggle works (dark ↔ light)
- [ ] ChatKit widget colors adapt to theme instantly
- [ ] Theme persists across page reload
- [ ] System preference detected on first visit
- [ ] ChatKit colors match design system (indigo-500 accent, zinc grays)
- [ ] Highlight text → context menu appears
- [ ] Click "Ask from AI" → widget opens with text pre-populated
- [ ] Mobile viewport (375px) is fully usable
- [ ] Widget remains visible with virtual keyboard
- [ ] Network error shows friendly message
- [ ] Empty message → send button disabled
- [ ] Widget accessible from all pages

## Backend Verification

### Verify ChatKit Endpoint

```bash
# Get a valid JWT token (login first, copy from localStorage)
curl -X POST http://localhost:8000/chatkit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Add a task to buy groceries"}]}'
```

**Expected**: Streaming SSE response with ChatKit protocol events

### Verify Database Persistence

```sql
-- Check chat sessions
SELECT * FROM chat_sessions ORDER BY created_at DESC LIMIT 5;

-- Check chat messages
SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 10;
```

**Expected**: Messages saved with correct user_id, thread_id mapping, and timestamps

## Troubleshooting

### Widget doesn't appear
- Check: User is authenticated (localStorage has `auth_token`)
- Check: `isAuthenticated()` function returns true
- Check: No console errors in DevTools

### Widget opens but can't send messages
- Check: Backend is running on port 8000
- Check: `NEXT_PUBLIC_API_BASE_URL` is set correctly
- Check: JWT token is valid (not expired)
- Check: `/chatkit` endpoint returns 200 (not 401/403)

### Theme doesn't sync with widget
- Check: `next-themes` is installed
- Check: ThemeProvider wraps the app in layout.tsx
- Check: `resolvedTheme` is passed to ChatKit `colorScheme`

### Thread doesn't restore after refresh
- Check: localStorage has `chatkit_thread_id`
- Check: `setThreadId()` is called in useEffect when `isReady` is true
- Check: Backend has session mapping for the thread_id

### Text selection menu doesn't appear
- Check: Text is more than 3 characters
- Check: TextSelectionMenu is mounted in layout.tsx
- Check: No z-index conflicts with other elements

## Performance Benchmarks

- Widget open/close: <300ms
- Theme switch: <300ms
- Thread restoration: <1s
- Message send → response: <10s (depends on AI processing)
- Text selection menu: <200ms
