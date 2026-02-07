# Feature Specification: Frontend Chat Interface (Floating Widget)

**Feature Branch**: `frontend-chat`
**Created**: 2026-02-05
**Updated**: 2026-02-06 (Floating Widget Architecture)
**Status**: Draft
**Input**: Build a floating overlay ChatKit widget that connects to the AI agent endpoint from Spec 5, accessible from any page.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Opens Chat Widget and Sends a Message (Priority: P1)

An authenticated user sees a floating chat icon in the bottom-right corner of any page. They click the icon, and an elegant ChatKit widget opens as an overlay. They type a natural language message like "Add a task to buy groceries" and send it. The message appears in the chat thread, a loading indicator shows the AI is processing, and the assistant replies with a confirmation that the task was added. The user can continue the conversation or minimize the widget.

**Why this priority**: This is the core feature. Without the ability to open the widget, send messages, and see AI responses, the entire feature has no value. This enables the fundamental conversational task management experience.

**Independent Test**: Can be fully tested by clicking the floating chat icon, sending "Add a task to buy groceries", and verifying the assistant responds with a confirmation and the task appears in the database.

**Acceptance Scenarios**:

1. **Given** an authenticated user on any page, **When** they click the floating chat icon, **Then** the ChatKit widget opens as an overlay (600px × 400px)
2. **Given** the widget is open, **When** they type "Add a task to buy groceries" and send it, **Then** the message appears in the chat thread, a loading state shows, and the assistant replies confirming the task was added
3. **Given** the widget is open, **When** they type "Show my tasks" and send it, **Then** the assistant replies with a formatted list of their tasks
4. **Given** the widget is open, **When** they click the minimize button, **Then** the widget closes instantly and the floating icon reappears
5. **Given** the widget is open, **When** they send an empty message, **Then** the send button is disabled or the system shows a validation message

---

### User Story 2 - User's Conversation Persists Across Sessions (Priority: P1)

A user has a conversation in the chat widget, then closes the widget or refreshes the page. When they reopen the widget, their previous conversation is automatically restored with full message history. They can continue the conversation from where they left off with full context preserved.

**Why this priority**: Conversation continuity is essential for a natural chat experience. Without this, users lose all context every time they close the widget, making the assistant feel broken.

**Independent Test**: Can be fully tested by having a conversation, closing the widget, refreshing the page, reopening the widget, and verifying all messages are displayed and new messages maintain context.

**Acceptance Scenarios**:

1. **Given** a user with an active conversation, **When** they close the widget and reopen it, **Then** the full message history loads automatically
2. **Given** a user with an active conversation, **When** they refresh the page and reopen the widget, **Then** the conversation is restored from localStorage
3. **Given** a user in a restored conversation, **When** they send a new message, **Then** the AI responds with context from the previous messages
4. **Given** a user who wants to start fresh, **When** they clear the conversation (if ChatKit provides this), **Then** a new empty thread is created

---

### User Story 3 - User Switches Between Dark and Light Theme (Priority: P2)

A user can toggle between dark and light themes for the entire application. The theme respects the system preference by default but can be overridden with a toggle. In dark mode, text is white/light on a dark background. In light mode, text is dark/black on a white/light background. The ChatKit widget automatically adapts its colors to match the active theme.

**Why this priority**: Theme support significantly improves usability and accessibility, especially for users who prefer light mode. While not blocking core functionality, it's essential for a premium feel.

**Independent Test**: Can be fully tested by toggling the theme switch and verifying the ChatKit widget colors change appropriately along with the rest of the application.

**Acceptance Scenarios**:

1. **Given** a user with system preference set to dark mode, **When** the page loads, **Then** the application displays in dark theme and the ChatKit widget uses dark colors
2. **Given** a user in dark mode, **When** they click the theme toggle, **Then** the interface switches to light mode and the ChatKit widget adapts to light colors
3. **Given** a user who has set a theme preference, **When** they reload the page, **Then** their chosen theme persists
4. **Given** a user in either theme, **When** the ChatKit widget opens, **Then** its colors match the current theme with no jarring color mismatches

---

### User Story 4 - Unauthenticated User Does Not See Chat Widget (Priority: P2)

A user without a valid session or with an expired token does not see the floating chat icon. If they somehow trigger the widget (e.g., via direct manipulation), the system detects the invalid authentication and redirects them to the login page. After logging in, they return to the page they were on and the chat icon appears.

**Why this priority**: Auth protection is critical for security. Users must not access chat functionality without authentication, as the AI agent operates on their personal tasks.

**Independent Test**: Can be fully tested by clearing the auth token, verifying the chat icon is hidden, logging in, and verifying the icon appears.

**Acceptance Scenarios**:

1. **Given** a user with no authentication token, **When** they view any page, **Then** the floating chat icon does not appear
2. **Given** a user with an expired token, **When** they try to send a message in the widget, **Then** they are redirected to the login page with a friendly error message
3. **Given** a user who just logged in, **When** they return to the application, **Then** the floating chat icon appears
4. **Given** an authenticated user in a chat session, **When** their token expires mid-session, **Then** the next message attempt shows a friendly error prompting re-login

---

### User Story 5 - User Sees Loading States and Error Feedback (Priority: P3)

While the AI is processing a message, the user sees a clear loading indicator in the chat thread. If an error occurs (network failure, service timeout, rate limit), the user sees a friendly error message with guidance on what to do next. Success actions (like task creation) show brief success feedback.

**Why this priority**: Clear feedback makes the chat feel responsive and trustworthy. Without loading states and error messages, the interface feels broken when things take time or go wrong.

**Independent Test**: Can be fully tested by sending a message and observing the loading indicator, then simulating network errors and verifying error messages appear.

**Acceptance Scenarios**:

1. **Given** a user who just sent a message, **When** the AI is processing, **Then** a loading indicator (typing animation or spinner) appears in the chat thread
2. **Given** a network failure occurs, **When** the user sends a message, **Then** a friendly error message appears: "Unable to send message. Please check your connection and try again."
3. **Given** the AI service times out, **When** the user is waiting for a response, **Then** an error message appears: "The request took too long. Please try again."
4. **Given** the user exceeds the rate limit, **When** they try to send another message, **Then** a message appears indicating to wait before sending more messages

---

### User Story 6 - User Highlights Text and Asks AI About It (Priority: P3)

A user highlights any text on the page (more than 3 characters). A context menu appears with an "Ask from AI" button. When clicked, the chat widget opens automatically with the selected text pre-populated in the input field. The user can then send the message or edit it before sending.

**Why this priority**: This enhances the chat experience by allowing users to quickly ask questions about content they're viewing, making the AI assistant more contextually useful.

**Independent Test**: Can be fully tested by highlighting text, clicking "Ask from AI", and verifying the widget opens with the text pre-populated.

**Acceptance Scenarios**:

1. **Given** a user highlights text (>3 chars), **When** the selection is complete, **Then** a context menu appears with "Ask from AI" and "Copy" buttons
2. **Given** the context menu is visible, **When** the user clicks "Ask from AI", **Then** the chat widget opens with the selected text in the input field
3. **Given** the widget opened with pre-populated text, **When** the user sends the message, **Then** the AI responds with context about the selected text
4. **Given** the context menu is visible, **When** the user clicks outside, **Then** the menu disappears

---

### Edge Cases

- **Very long messages**: If a user types more than 4000 characters, the send button should be disabled with a character count warning
- **Rapid message sending**: If a user sends messages very quickly, they should be queued and processed sequentially (not result in race conditions)
- **Page refresh during AI response**: If the user refreshes while the AI is processing, the conversation should be recoverable from localStorage (the user message was already stored)
- **Concurrent sessions**: If a user has the chat open in multiple tabs, each tab should operate independently with its own thread ID
- **Mobile keyboard**: On mobile, the chat widget should remain visible and usable when the virtual keyboard is open
- **Network disconnect mid-conversation**: The interface should detect loss of connectivity and show an offline indicator
- **Widget overlapping content**: The widget should have a high z-index and minimize button to avoid blocking important page content

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a floating chat icon visible to authenticated users on all pages
- **FR-002**: System MUST use OpenAI ChatKit as the primary chat interface component
- **FR-003**: System MUST send user messages to the backend ChatKit endpoint (`POST /chatkit`) using the ChatKit protocol with JWT authentication
- **FR-004**: System MUST display AI assistant responses in the chat thread as they stream from the backend
- **FR-005**: System MUST attach the user's JWT token to all ChatKit API requests via custom fetch with Authorization header
- **FR-006**: System MUST persist the active thread ID to localStorage and restore it when the widget reopens
- **FR-007**: System MUST hide the floating chat icon for unauthenticated users
- **FR-008**: System MUST save all chat messages to Neon Postgres via the backend ChatKitServer
- **FR-009**: System MUST support dark and light theme modes with appropriate text and background color contrasts
- **FR-010**: System MUST detect the user's system color scheme preference and apply it by default
- **FR-011**: System MUST provide a visible toggle to switch between dark and light themes
- **FR-012**: System MUST persist the user's theme preference across page reloads via localStorage
- **FR-013**: System MUST redirect unauthenticated users to the login page when they attempt to use the chat widget
- **FR-014**: System MUST show a loading indicator while the AI agent is processing a response (ChatKit built-in)
- **FR-015**: System MUST display user-friendly error messages for network failures, timeouts, and rate limiting without exposing technical details
- **FR-016**: System MUST be fully responsive and provide a premium experience on mobile devices (phones and tablets)
- **FR-017**: System MUST disable the send action when the message input is empty or exceeds 4000 characters
- **FR-018**: System MUST display tool call results in a meaningful way within the chat (e.g., showing which task was added, listed, completed, deleted, or updated)
- **FR-019**: System MUST provide a minimize button to close the widget and restore the floating icon
- **FR-020**: System MUST configure the ChatKit widget's theme colors to match the application's design system (indigo-500 accent, zinc grays)
- **FR-021**: System MUST provide a text selection context menu with "Ask from AI" button that pre-populates the chat input
- **FR-022**: System MUST keep the widget mounted in the DOM for instant open/close transitions (<300ms)
- **FR-023**: System MUST dynamically import ChatKit to avoid blocking initial page load

### Key Entities

- **ChatKitWidget**: The main floating overlay component containing the ChatKit interface with minimize/maximize controls
- **TextSelectionMenu**: A context menu that appears when text is selected, offering "Ask from AI" and "Copy" actions
- **ChatKitInner**: The inner component that configures and renders the ChatKit interface with theme sync and JWT auth
- **ThemePreference**: The user's chosen theme mode (dark, light, or system) persisted via next-themes to localStorage
- **ThreadState**: The active ChatKit thread ID persisted to localStorage for conversation restoration

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can send a task management message and receive an AI response within 10 seconds (including network round-trip and AI processing)
- **SC-002**: Widget open/close transitions complete within 300 milliseconds with no visible lag
- **SC-003**: Theme switch transitions complete within 300 milliseconds with ChatKit colors adapting instantly
- **SC-004**: Chat widget renders correctly and is fully usable on screens as small as 375px wide (standard mobile)
- **SC-005**: 100% of unauthenticated users see no chat icon with no unprotected chat content exposed
- **SC-006**: All error states (network failure, timeout, rate limit) show user-friendly messages within 2 seconds of detection
- **SC-007**: Thread restoration from localStorage completes within 1 second of widget opening
- **SC-008**: Text selection context menu appears within 200ms of text selection completion

## Assumptions

- The backend AI agent from Spec 5 is fully implemented and running with `run_agent()` function available
- The MCP server from Spec 4 is running and accessible by the backend AI agent
- The existing frontend authentication system (JWT tokens in localStorage, `getToken()`, `isAuthenticated()` functions) is available and working
- The existing frontend design system (Tailwind CSS, shadcn/ui components, Geist fonts) is available
- OpenAI ChatKit React package (@openai/chatkit-react) is available and compatible with the current Next.js 16 and React 19 versions
- ChatKit Python Server SDK (`openai-chatkit` package) is available for backend protocol compliance
- The backend supports streaming responses via Server-Sent Events (SSE) through the ChatKit protocol
- The ChatKit widget can be configured to work with a custom backend API endpoint (not directly with OpenAI's hosted API)
- NEXT_PUBLIC_API_BASE_URL environment variable is configured to point to the backend server
- Neon Postgres database has chat_sessions and chat_messages tables for persistence
- The backend has `chat_history.save_message()` and `chat_history.get_or_create_session_by_thread()` functions available
