---
name: FIG Project Control
description: Create or update FIG task packets, current state, milestone evidence, blockers, risks, and the exact next task
---

# FIG project control

Use this skill for planning, starting, blocking, verifying, completing, or recovering FIG work.

## Canonical sources

Read `docs/CURRENT_STATE.md`, `docs/ROADMAP.md`, `docs/RISK_REGISTER.md`, and the relevant packet under `docs/tasks/`. Use `docs/TASK_PACKET_TEMPLATE.md` and `docs/MILESTONE_ACCEPTANCE_TEMPLATE.md`; do not invent a second tracker.

## Workflow

1. Check Git branch/status and preserve unrelated user changes.
2. Identify the current milestone and packet. Normally only one packet may be `IN_PROGRESS`.
3. If no packet exists, create one before implementation with every required section and bounded scope.
4. Move state truthfully among `PLANNED`, `IN_PROGRESS`, `BLOCKED`, `VERIFYING`, `COMPLETED`, `DEFERRED`, and `CANCELLED`.
5. Record scope changes, decisions, failed/unavailable checks, blockers, and risks in the packet as they occur.
6. On completion, record actual evidence, update `docs/CURRENT_STATE.md`, update the risk register if exposure changed, and state one exact next action.
7. Prepare milestone acceptance only when all included packets have evidence and known limitations.

Never infer completion from code presence or historical tests. Never keep task state only in chat.
