---
id: 0002
title: Create Frontend Chat Implementation Plan
stage: plan
date: 2026-02-05
surface: agent
model: claude-opus-4-5-20251101
feature: frontend-chat
branch: frontend-chat
user: CW
command: /sp.plan
labels: ["plan", "frontend", "chatkit", "chat-ui", "architecture"]
links:
  spec: specs/frontend-chat/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/frontend-chat/plan.md
  - specs/frontend-chat/research.md
  - specs/frontend-chat/data-model.md
  - specs/frontend-chat/contracts/chatkit-adapter.md
  - specs/frontend-chat/quickstart.md
tests:
  - Constitution check: all applicable principles PASS
---

## Prompt

/sp.plan Frontend Chat Interface (Spec 6)

Follow the approved spec in specs/frontend-chat/spec.md exactly.

Create full execution plan with:
- Phase 0: Research (ChatKit docs, existing frontend structure, backend API contracts)
- Phase 1: Design (data models, API contracts, quickstart)
- Decision table with rationale
- Constitution check
- File changes summary

Output in specs/frontend-chat/PLAN.md Go.

## Response snapshot

Created comprehensive implementation plan for Frontend Chat Interface with:
- Constitution check: all 4 applicable principles PASS (SDD, Auth, Data Persistence, Conversational UI)
- 8 architectural decisions documented (ChatKit UI, ChatKitServer backend, next-themes, custom sidebar, React hooks state)
- 5 implementation phases planned (Backend adapter → Theme upgrade → Chat page → Sidebar → Polish)
- 18 file changes identified (10 CREATE, 8 UPDATE)
- 4 risks identified with mitigations

Research performed:
- Explored existing frontend structure (no chat UI exists, dark-only theme stub, JWT auth in localStorage)
- Analyzed backend chat API contracts (3 endpoints, RFC 7807 errors, rate limiting)
- Researched OpenAI ChatKit React SDK via Context7 (useChatKit hook, ChatKit component, theme config, custom fetch)
- Researched ChatKit Python Server SDK (ChatKitServer class, StreamingResult, SSE streaming)
- Investigated next-themes for theme management

Key architectural decision: ChatKit React communicates via its own protocol (not raw REST), requiring a new `/chatkit` backend endpoint using `chatkit.server.ChatKitServer` that wraps the existing `run_agent()` from Spec 5.

## Outcome

- Impact: Full implementation plan with all Phase 0 and Phase 1 artifacts ready
- Tests: Constitution check all applicable principles PASS
- Files: 5 files created (plan.md, research.md, data-model.md, contracts/chatkit-adapter.md, quickstart.md)
- Next prompts: /sp.tasks to generate implementation tasks
- Reflection: ChatKit's requirement for its own backend protocol was the key finding; plan correctly identifies the need for a backend adapter layer using ChatKitServer Python SDK rather than trying to force ChatKit to talk directly to the existing REST endpoints

## Evaluation notes (flywheel)

- Failure modes observed: setup-plan.sh script failed due to non-numbered branch format (worked around manually)
- Graders run and results (PASS/FAIL): Constitution check PASS (all applicable)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Proceed to /sp.tasks to generate implementation tasks
