# Tasks: AI Agent & Chat Logic

**Input**: Design documents from `/specs/ai-chat-logic/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/chat-api.yaml

**Tests**: Not explicitly requested - test tasks excluded (can be added later if needed)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project type**: Web application (backend/)
- **Backend**: `backend/src/`, `backend/tests/`
- Existing files: `backend/src/models/user.py`, `backend/src/models/task.py`, `backend/tools/tasks.py`

---

## Phase 1: Setup

**Purpose**: Dependencies and package initialization

- [x] T001 Add `openai-agents>=0.0.1` to backend/requirements.txt
- [x] T002 [P] Create backend/src/agents/__init__.py package init file
- [x] T003 [P] Verify OPENAI_API_KEY is documented in backend/.env.example

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database models and core infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 [P] Create Conversation model in backend/src/models/conversation.py (per data-model.md)
- [x] T005 [P] Create Message model with MessageRole enum in backend/src/models/message.py (per data-model.md)
- [x] T006 Update backend/src/models/__init__.py to export Conversation, Message, MessageRole
- [x] T007 Create ChatRequest and ChatResponse schemas in backend/src/api/schemas/chat.py (per data-model.md)
- [x] T008 Create chat_service.py in backend/src/services/chat_service.py with conversation CRUD operations
- [x] T009 Create todo_agent.py in backend/src/agents/todo_agent.py with agent configuration using MCPServerStreamableHttp to connect to MCP server (no @function_tool wrappers)
- [x] T010 Run database migration to create conversations and messages tables

**Checkpoint**: Foundation ready - Models, schemas, service, and agent configured. User story implementation can now begin.

---

## Phase 3: User Story 1 - User Sends Chat Message to Manage Tasks (Priority: P1) 🎯 MVP

**Goal**: Users can send natural language messages to manage tasks via the chat endpoint

**Independent Test**: POST /api/{user_id}/chat with "Add a task to buy groceries" → task created + confirmation response

### Implementation for User Story 1

- [x] T011 [US1] Create chat router in backend/src/api/chat.py with POST /api/{user_id}/chat endpoint
- [x] T012 [US1] Implement chat endpoint logic: validate request, create/resume conversation, store user message
- [x] T013 [US1] Implement agent invocation: load history, run agent with message, capture tool calls
- [x] T014 [US1] Implement response handling: store assistant message with tool_calls, return ChatResponse
- [x] T015 [US1] Add rate limiting (10 req/min per user) using slowapi in backend/src/api/chat.py
- [x] T016 [US1] Register chat router in backend/main.py
- [x] T017 [US1] Add RFC 7807 error responses for validation errors (empty message, too long)

**Checkpoint**: User Story 1 complete - Users can chat with AI to add, list, complete, delete, update tasks

---

## Phase 4: User Story 2 - User Resumes Existing Conversation (Priority: P1)

**Goal**: Users can continue previous conversations by providing conversation_id

**Independent Test**: Create conversation → send follow-up with conversation_id → AI has context from history

### Implementation for User Story 2

- [x] T018 [US2] Implement conversation validation in chat_service.py: verify ownership, return 404 for not found/unauthorized
- [x] T019 [US2] Implement history loading in chat_service.py: fetch all messages for conversation_id ordered by created_at
- [x] T020 [US2] Update chat endpoint to handle conversation_id: load history if provided, create new if not
- [x] T021 [US2] Add conversation updated_at refresh when new message added

**Checkpoint**: User Story 2 complete - Conversation continuity works with full context preservation

---

## Phase 5: User Story 3 - Multiple Task Operations in One Message (Priority: P2)

**Goal**: AI agent handles complex messages with multiple task operations

**Independent Test**: Send "Add task A and mark task B as done" → both operations complete and summarized

### Implementation for User Story 3

- [x] T022 [US3] Verify agent instructions in todo_agent.py support multi-tool invocation
- [x] T023 [US3] Ensure tool_calls array captures ALL invocations in message record
- [x] T024 [US3] Update ChatResponse to include complete tool_calls array with results

**Checkpoint**: User Story 3 complete - Multi-action messages processed correctly

---

## Phase 6: User Story 4 - Graceful Error Handling (Priority: P2)

**Goal**: System returns user-friendly errors without exposing technical details

**Independent Test**: Simulate DB unavailable → response is "Service temporarily unavailable"

### Implementation for User Story 4

- [x] T025 [US4] Implement database error handling in chat_service.py with user-friendly messages
- [x] T026 [US4] Implement agent timeout handling (30s) in chat endpoint
- [x] T027 [US4] Implement tool error handling in todo_agent.py to return friendly messages
- [x] T028 [US4] Add catch-all exception handler in chat router to prevent stack trace exposure

**Checkpoint**: User Story 4 complete - All errors return friendly messages

---

## Phase 7: User Story 5 - Conversation History Endpoints (Priority: P3)

**Goal**: Users can list conversations and view message history

**Independent Test**: GET /api/{user_id}/conversations → list of user's conversations with metadata

### Implementation for User Story 5

- [x] T029 [US5] Add GET /api/{user_id}/conversations endpoint in backend/src/api/chat.py
- [x] T030 [US5] Implement list_conversations in chat_service.py with message_count aggregation
- [x] T031 [US5] Add GET /api/{user_id}/conversations/{conversation_id} endpoint in backend/src/api/chat.py
- [x] T032 [US5] Implement get_conversation_messages in chat_service.py
- [x] T033 [US5] Add ConversationSummary and ConversationDetail schemas to backend/src/api/schemas/chat.py

**Checkpoint**: User Story 5 complete - Users can browse and view conversation history

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [x] T034 Validate all endpoints match contracts/chat-api.yaml specification
- [x] T035 [P] Add logging for chat operations (request received, agent invoked, response sent)
- [x] T036 [P] Update backend/.env.example with OPENAI_API_KEY placeholder
- [x] T037 Run quickstart.md manual testing commands to verify end-to-end flow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational completion
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Core chat - depends only on Foundational
- **User Story 2 (P1)**: Conversation resume - depends only on Foundational, can parallel with US1
- **User Story 3 (P2)**: Multi-operations - depends on US1 being functional
- **User Story 4 (P2)**: Error handling - can parallel with US3
- **User Story 5 (P3)**: History endpoints - can parallel with US3/US4

### Within Each Phase

- Tasks marked [P] can run in parallel
- Sequential tasks must complete in order
- Complete checkpoint before next phase

### Parallel Opportunities

**Setup (all parallel)**:
```
T001, T002, T003 can all run simultaneously
```

**Foundational (partial parallel)**:
```
T004, T005 (models) → parallel
T006 (exports) → depends on T004, T005
T007 (schemas) → parallel with models
T008 (service) → depends on models
T009 (agent) → parallel with T008
T010 (migration) → depends on T004, T005
```

**User Stories (after Foundational)**:
```
US1 and US2 can start in parallel
US3, US4, US5 can proceed after US1/US2 core is working
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T010)
3. Complete Phase 3: User Story 1 (T011-T017)
4. Complete Phase 4: User Story 2 (T018-T021)
5. **STOP and VALIDATE**: Test chat with new and resumed conversations
6. Deploy/demo if ready

### Full Implementation

Continue with:
7. Phase 5: User Story 3 (multi-operations)
8. Phase 6: User Story 4 (error handling)
9. Phase 7: User Story 5 (history endpoints)
10. Phase 8: Polish

---

## Notes

- All paths relative to repository root
- Existing files: user.py, task.py, tools/tasks.py (MCP tools)
- Reuse: verify_user_access dependency from backend/src/api/dependencies.py
- Reuse: get_db dependency from backend/database.py
- Agent uses `@function_tool` decorator wrapping existing MCP tool functions
- Rate limit: 10 requests/minute per user (clarified in spec)
