# ChatKit Floating Widget - Testing Checklist

**Feature**: Frontend Chat Interface (Floating Widget)
**Date**: 2026-02-06
**Status**: Ready for Testing

## Pre-Testing Setup

- [ ] Backend server running on `http://localhost:8000`
- [ ] Frontend server running on `http://localhost:3000`
- [ ] Valid JWT token available (logged in user)
- [ ] `NEXT_PUBLIC_API_BASE_URL` set in `.env.local`
- [ ] Browser DevTools open for debugging

---

## 1. Widget Visibility & Authentication

### Test 1.1: Unauthenticated User
- [ ] Log out from the application
- [ ] Navigate to any page
- [ ] **Expected**: ChatKit widget icon should NOT be visible
- [ ] **Expected**: No console errors

### Test 1.2: Authenticated User
- [ ] Log in to the application
- [ ] Navigate to dashboard or any authenticated page
- [ ] **Expected**: Floating chat icon visible in bottom-right corner (indigo-500 color)
- [ ] **Expected**: Icon has hover effect (scale + shadow)

---

## 2. Widget Open/Close Behavior

### Test 2.1: Open Widget
- [ ] Click the floating chat icon
- [ ] **Expected**: Widget expands to 400px × 600px (desktop)
- [ ] **Expected**: Minimize button appears in top-left corner
- [ ] **Expected**: ChatKit start screen shows greeting: "Hi! I can help you manage your tasks."
- [ ] **Expected**: Three prompt suggestions visible

### Test 2.2: Close Widget
- [ ] Click the minimize button (top-left)
- [ ] **Expected**: Widget collapses back to floating icon
- [ ] **Expected**: Widget state preserved (thread not lost)

### Test 2.3: Keyboard Navigation
- [ ] Open widget
- [ ] Press `Escape` key
- [ ] **Expected**: Widget closes
- [ ] Tab to floating icon, press `Enter`
- [ ] **Expected**: Widget opens

---

## 3. Chat Functionality

### Test 3.1: Send Message
- [ ] Open widget
- [ ] Type "Add a task to buy groceries" in composer
- [ ] Press Enter or click Send
- [ ] **Expected**: Message appears in chat thread
- [ ] **Expected**: Assistant response streams in (SSE)
- [ ] **Expected**: Response confirms task added

### Test 3.2: Tool Call Execution
- [ ] Send "Show my tasks"
- [ ] **Expected**: Agent calls `list_tasks` MCP tool
- [ ] **Expected**: Response displays task list
- [ ] Verify in backend logs: MCP tool invocation logged

### Test 3.3: Thread Persistence
- [ ] Send 2-3 messages
- [ ] Close widget (minimize)
- [ ] Refresh page
- [ ] Open widget again
- [ ] **Expected**: Previous conversation restored from localStorage
- [ ] **Expected**: Thread ID matches in localStorage (`chatkit_thread_id`)

---

## 4. Theme Synchronization

### Test 4.1: Light Mode
- [ ] Toggle theme to light mode (ThemeToggle button)
- [ ] Open ChatKit widget
- [ ] **Expected**: Widget uses light color scheme
- [ ] **Expected**: Background is white, text is dark

### Test 4.2: Dark Mode
- [ ] Toggle theme to dark mode
- [ ] Open ChatKit widget
- [ ] **Expected**: Widget uses dark color scheme
- [ ] **Expected**: Background is dark, text is light

### Test 4.3: System Theme
- [ ] Set theme to "system"
- [ ] Change OS theme preference
- [ ] **Expected**: Widget theme updates automatically

---

## 5. Text Selection Integration

### Test 5.1: Select Text
- [ ] Navigate to dashboard
- [ ] Highlight any text on the page (>3 characters)
- [ ] **Expected**: Text selection menu appears with "Ask from AI" and "Copy" buttons

### Test 5.2: Ask from AI
- [ ] Select text: "Buy groceries tomorrow"
- [ ] Click "Ask from AI" button
- [ ] **Expected**: ChatKit widget opens automatically
- [ ] **Expected**: Composer pre-populated with selected text
- [ ] **Expected**: Selection menu disappears

### Test 5.3: Copy Button
- [ ] Select text
- [ ] Click "Copy" button
- [ ] Paste in another app
- [ ] **Expected**: Text copied to clipboard
- [ ] **Expected**: Selection menu disappears

### Test 5.4: Mobile Touch Selection
- [ ] Open in mobile viewport (DevTools)
- [ ] Long-press to select text
- [ ] **Expected**: Selection menu appears
- [ ] **Expected**: Touch events work correctly

---

## 6. Error Handling

### Test 6.1: Expired Token
- [ ] Manually expire JWT token (edit localStorage)
- [ ] Send a message in ChatKit
- [ ] **Expected**: Redirect to `/login?error=session_expired`
- [ ] **Expected**: Token removed from localStorage

### Test 6.2: Network Error
- [ ] Stop backend server
- [ ] Send a message in ChatKit
- [ ] **Expected**: Error message: "Network error. Please check your connection and try again."
- [ ] **Expected**: Widget remains functional after backend restarts

### Test 6.3: Server Error (500)
- [ ] Trigger a 500 error from backend (modify endpoint temporarily)
- [ ] Send a message
- [ ] **Expected**: Error message: "Server error. Please try again later."

### Test 6.4: ChatKit Load Failure
- [ ] Block `@openai/chatkit-react` in Network tab
- [ ] Refresh page
- [ ] **Expected**: Red error box appears: "ChatKit Error: Failed to load ChatKit"

---

## 7. Mobile Responsiveness

### Test 7.1: Mobile Viewport (< 768px)
- [ ] Open DevTools, set viewport to iPhone 12 (390px)
- [ ] Open ChatKit widget
- [ ] **Expected**: Widget fills entire screen (100vh × 100vw)
- [ ] **Expected**: Minimize button still accessible

### Test 7.2: Tablet Viewport (768px - 1024px)
- [ ] Set viewport to iPad (768px)
- [ ] Open widget
- [ ] **Expected**: Widget uses desktop size (400px × 600px)

### Test 7.3: Touch Interactions
- [ ] Enable touch simulation in DevTools
- [ ] Tap floating icon
- [ ] **Expected**: Widget opens
- [ ] Tap minimize button
- [ ] **Expected**: Widget closes

---

## 8. Accessibility

### Test 8.1: Screen Reader
- [ ] Enable screen reader (NVDA/JAWS/VoiceOver)
- [ ] Tab to floating icon
- [ ] **Expected**: Announces "Open chat assistant"
- [ ] Press Enter to open
- [ ] Tab to minimize button
- [ ] **Expected**: Announces "Minimize chat assistant"

### Test 8.2: Keyboard Navigation
- [ ] Tab through page elements
- [ ] **Expected**: Floating icon receives focus (visible outline)
- [ ] Press Enter/Space to open
- [ ] **Expected**: Widget opens
- [ ] Press Escape
- [ ] **Expected**: Widget closes

### Test 8.3: ARIA Attributes
- [ ] Inspect floating icon in DevTools
- [ ] **Expected**: `role="button"`, `aria-label="Open chat assistant"`, `tabIndex={0}`
- [ ] Inspect open widget
- [ ] **Expected**: `role="dialog"`, `aria-label="Chat assistant"`

---

## 9. Database Persistence

### Test 9.1: Message Saved to Neon
- [ ] Send a message in ChatKit
- [ ] Check backend logs
- [ ] **Expected**: Log shows "User message saved to database"
- [ ] **Expected**: Log shows "Assistant message saved to database"
- [ ] Query Neon database: `SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 5;`
- [ ] **Expected**: Messages present with correct `session_id`, `role`, `message_text`

### Test 9.2: Thread-to-Session Mapping
- [ ] Open widget, send message
- [ ] Check localStorage: `chatkit_thread_id`
- [ ] Check backend logs: "Using session {session_id} for thread: {thread_id}"
- [ ] Query database: `SELECT * FROM chat_sessions WHERE thread_id = '<thread_id>';`
- [ ] **Expected**: Session exists with matching `thread_id`

---

## 10. Performance

### Test 10.1: Widget Load Time
- [ ] Open DevTools Performance tab
- [ ] Refresh page
- [ ] **Expected**: ChatKit dynamic import completes in < 2 seconds
- [ ] **Expected**: No blocking of main thread

### Test 10.2: Message Streaming
- [ ] Send a message
- [ ] Observe SSE stream in Network tab
- [ ] **Expected**: `text/event-stream` response
- [ ] **Expected**: Events: `thread.item.added`, `thread.item.updated`, `thread.item.done`
- [ ] **Expected**: Smooth streaming (no lag)

### Test 10.3: Memory Leaks
- [ ] Open/close widget 10 times
- [ ] Check DevTools Memory tab
- [ ] **Expected**: No significant memory increase
- [ ] **Expected**: Event listeners cleaned up

---

## 11. Edge Cases

### Test 11.1: Empty Message
- [ ] Open widget
- [ ] Press Enter without typing
- [ ] **Expected**: Nothing happens (composer validation)

### Test 11.2: Very Long Message
- [ ] Type a message > 1000 characters
- [ ] Send message
- [ ] **Expected**: Message sent successfully
- [ ] **Expected**: Response handles long input

### Test 11.3: Rapid Open/Close
- [ ] Click floating icon 5 times rapidly
- [ ] **Expected**: Widget toggles correctly
- [ ] **Expected**: No console errors

### Test 11.4: Multiple Tabs
- [ ] Open app in two browser tabs
- [ ] Send message in Tab 1
- [ ] Switch to Tab 2
- [ ] **Expected**: Each tab has independent thread
- [ ] **Expected**: localStorage `chatkit_thread_id` shared (last write wins)

---

## 12. Integration with Existing Features

### Test 12.1: Theme Toggle Integration
- [ ] Open widget
- [ ] Toggle theme while widget is open
- [ ] **Expected**: Widget theme updates immediately (no flicker)

### Test 12.2: Navigation
- [ ] Open widget
- [ ] Navigate to different page (e.g., dashboard → settings)
- [ ] **Expected**: Widget remains open
- [ ] **Expected**: Thread preserved

### Test 12.3: Logout
- [ ] Open widget with active conversation
- [ ] Log out
- [ ] **Expected**: Widget disappears
- [ ] Log back in
- [ ] **Expected**: Widget reappears
- [ ] **Expected**: Previous thread restored from localStorage

---

## Acceptance Criteria Summary

All tests must pass for feature to be considered complete:

- [ ] Widget visible only for authenticated users
- [ ] Open/close behavior works correctly
- [ ] Chat messages send and receive successfully
- [ ] Theme synchronization works (light/dark/system)
- [ ] Text selection integration functional
- [ ] Error handling graceful (401, 500, network)
- [ ] Mobile responsive (< 768px fullscreen)
- [ ] Accessibility compliant (ARIA, keyboard, screen reader)
- [ ] Database persistence verified (Neon Postgres)
- [ ] Performance acceptable (< 2s load, smooth streaming)
- [ ] Edge cases handled correctly
- [ ] Integration with existing features seamless

---

## Known Issues / Limitations

- [ ] Document any issues found during testing
- [ ] Create GitHub issues for bugs
- [ ] Note any browser-specific quirks

---

## Sign-Off

**Tester**: _______________
**Date**: _______________
**Status**: ☐ Pass | ☐ Fail | ☐ Needs Revision
**Notes**:
