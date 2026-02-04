# Feature Specification: AI Agent & Chat Logic

**Feature Branch**: `ai-chat-logic`
**Created**: 2026-02-04
**Status**: Draft
**Input**: Build stateless AI chat logic using OpenAI Agents SDK, integrate with MCP tools from Spec 4, and create a persistent conversation endpoint.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Sends Chat Message to Manage Tasks (Priority: P1)

A user sends a natural language message through the chat endpoint to manage their tasks. The system processes the message using the AI agent, which understands the intent and invokes the appropriate MCP tools. The response confirms the action taken and provides relevant task information.

**Why this priority**: This is the core feature - without the ability to process chat messages and invoke tools, no task management via natural language is possible. This enables the fundamental "chat with AI to manage todos" experience.

**Independent Test**: Can be fully tested by sending a POST request to the chat endpoint with a message like "Add a task to buy groceries" and verifying the response contains a confirmation and the task was created in the database.

**Acceptance Scenarios**:

1. **Given** an authenticated user with valid JWT, **When** they send "Add a task to buy groceries", **Then** the system creates a new task, stores the conversation, and returns a response confirming the task was added with task details
2. **Given** an authenticated user, **When** they send "Show my tasks", **Then** the system retrieves their tasks via MCP tools and returns a formatted list of tasks
3. **Given** an authenticated user, **When** they send "Mark buy groceries as done", **Then** the system identifies the task, marks it complete, and confirms the action
4. **Given** an authenticated user, **When** they send an ambiguous message, **Then** the AI agent asks clarifying questions before taking action

---

### User Story 2 - User Resumes Existing Conversation (Priority: P1)

A user wants to continue a previous conversation rather than starting fresh. By providing a conversation_id, the system loads the full conversation history and maintains context for the new message.

**Why this priority**: Conversation continuity is essential for a natural chat experience. Users expect the AI to remember what was discussed earlier in the same conversation.

**Independent Test**: Can be fully tested by creating a conversation, then sending a follow-up message with the same conversation_id and verifying the AI has context from the previous messages.

**Acceptance Scenarios**:

1. **Given** an existing conversation with history, **When** user sends a new message with that conversation_id, **Then** the AI agent receives the full conversation history and responds with appropriate context
2. **Given** a conversation_id that doesn't exist, **When** user sends a message, **Then** the system returns an error "Conversation not found"
3. **Given** a conversation_id belonging to another user, **When** user sends a message, **Then** the system returns an error "Conversation not found" (same error to prevent enumeration)
4. **Given** no conversation_id provided, **When** user sends a message, **Then** a new conversation is created and the new conversation_id is returned

---

### User Story 3 - User Performs Multiple Task Operations in One Message (Priority: P2)

A user sends a complex message that requires multiple tool invocations. The AI agent processes each action sequentially and confirms all completed operations.

**Why this priority**: Users naturally batch requests in conversation. Supporting multi-action messages improves the user experience and reduces back-and-forth.

**Independent Test**: Can be fully tested by sending "Add a task to call mom and mark the groceries task as done" and verifying both operations complete successfully.

**Acceptance Scenarios**:

1. **Given** a message with multiple task operations, **When** processed by the AI agent, **Then** all relevant MCP tools are invoked and the response summarizes all actions taken
2. **Given** a message where one operation fails, **When** processed by the AI agent, **Then** successful operations complete and the response indicates which failed and why
3. **Given** a complex message, **When** the AI agent processes it, **Then** all tool calls are recorded in the database message record

---

### User Story 4 - System Handles Errors Gracefully (Priority: P2)

When errors occur (database unavailable, invalid requests, tool failures), the system responds with user-friendly messages without exposing technical details.

**Why this priority**: Error handling is critical for a production-ready system. Users should receive helpful feedback when things go wrong.

**Independent Test**: Can be fully tested by simulating various error conditions and verifying user-friendly responses are returned.

**Acceptance Scenarios**:

1. **Given** the database is temporarily unavailable, **When** user sends a message, **Then** the system returns "Service temporarily unavailable, please try again"
2. **Given** an invalid JWT token, **When** user sends a message, **Then** the system returns 401 Unauthorized
3. **Given** an expired JWT token, **When** user sends a message, **Then** the system returns 401 Unauthorized with message to re-authenticate
4. **Given** an MCP tool returns an error, **When** the AI agent processes it, **Then** the response explains the issue in user-friendly terms

---

### User Story 5 - User Queries Conversation History (Priority: P3)

A user wants to retrieve their past conversations or messages within a conversation for reference.

**Why this priority**: While not essential for core functionality, viewing history enhances the user experience and debugging capability.

**Independent Test**: Can be fully tested by creating conversations, then retrieving them via the history endpoint and verifying all messages are returned.

**Acceptance Scenarios**:

1. **Given** a user with past conversations, **When** they request conversation list, **Then** all their conversations are returned with metadata (id, created_at, message_count)
2. **Given** a specific conversation_id, **When** user requests messages, **Then** all messages in that conversation are returned in chronological order
3. **Given** a user with no conversations, **When** they request conversation list, **Then** an empty array is returned

---

### Edge Cases

- **Empty message**: If user sends empty or whitespace-only message, return friendly error "Please enter a message"
- **Very long message**: If message exceeds 4000 characters, return friendly error "Message too long. Please keep under 4000 characters"
- **Concurrent requests**: If user sends multiple messages simultaneously to same conversation, process sequentially to maintain consistency
- **Rate limiting**: If user exceeds 10 requests/minute, return 429 Too Many Requests with retry guidance
- **Agent timeout**: If AI agent takes longer than 30 seconds, return timeout error with suggestion to retry
- **Invalid conversation_id format**: If conversation_id is not a valid UUID, return friendly error "Invalid conversation ID format"

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a stateless POST endpoint at `/api/{user_id}/chat` that accepts user messages and returns AI responses
- **FR-002**: System MUST authenticate requests using existing JWT authentication from Phase 2
- **FR-003**: System MUST verify that the user_id in the URL matches the authenticated user's ID from the JWT token
- **FR-004**: System MUST use OpenAI Agents SDK to create an AI agent that understands natural language task management commands
- **FR-005**: System MUST integrate all 5 MCP tools from Spec 4 (add_task, list_tasks, complete_task, delete_task, update_task) into the AI agent
- **FR-006**: System MUST store all conversations in a `conversations` table with user ownership
- **FR-007**: System MUST store all messages (user and assistant) in a `messages` table linked to conversations
- **FR-008**: System MUST fetch full conversation history from database before processing each new message
- **FR-009**: System MUST store the user's message in the database before invoking the AI agent
- **FR-010**: System MUST store the assistant's response and any tool calls in the database after processing
- **FR-011**: System MUST support creating new conversations when no conversation_id is provided
- **FR-012**: System MUST support resuming existing conversations when a valid conversation_id is provided
- **FR-013**: System MUST return a structured response containing conversation_id, response text, and tool_calls array
- **FR-014**: System MUST maintain zero in-memory conversation state (fully stateless for horizontal scaling)
- **FR-015**: System MUST configure the AI agent with clear instructions for task management, confirmation of actions, and graceful error handling
- **FR-016**: System MUST record tool call details (tool name, arguments, result) in the message record

### Key Entities

- **Conversation**: Represents a chat session with id (UUID), user_id (UUID, foreign key to users), title (auto-generated or first message summary), created_at (timestamp), updated_at (timestamp)
- **Message**: Represents a single message with id (UUID), conversation_id (UUID, foreign key), role (enum: user/assistant/system), content (text), tool_calls (JSON array, nullable), created_at (timestamp)
- **ChatRequest**: Input payload with message (string, required), conversation_id (UUID, optional)
- **ChatResponse**: Output payload with conversation_id (UUID), response (string), tool_calls (array of objects with tool_name, arguments, result)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete common task operations (add, list, complete, delete, update) through natural language in under 5 seconds per request
- **SC-002**: System correctly identifies user intent and invokes appropriate MCP tools in 95% of clear requests
- **SC-003**: Conversation context is maintained across messages - follow-up questions like "delete it" correctly reference previous context
- **SC-004**: All conversation data persists correctly - server restart has zero impact on conversation history
- **SC-005**: System handles 100 concurrent users without degradation (stateless design enables horizontal scaling)
- **SC-006**: Error responses are user-friendly with no technical jargon or stack traces exposed
- **SC-007**: 100% of requests enforce user ownership - users can only access their own conversations

## Clarifications

### Session 2026-02-04

- Q: What rate limit should apply to the chat endpoint? → A: 10 requests/minute per user (conservative for AI calls)

## Assumptions

- OpenAI Agents SDK is available and configured with valid API credentials (OPENAI_API_KEY in .env)
- The existing MCP tools from Spec 4 are fully implemented and tested
- The existing User model and JWT authentication from Phase 2 are available
- DATABASE_URL environment variable is configured with valid Neon PostgreSQL connection string
- The AI agent will use GPT-4 or equivalent model capable of function calling
- Rate limiting will use the same approach as existing auth endpoints (slowapi)
- Message content is plain text (no file uploads or rich media in this spec)
