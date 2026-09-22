# M2-002 — Implement persisted beginner workout vertical slice

## Identity

- Task ID: M2-002
- Task name: Implement persisted beginner workout vertical slice
- Milestone: M2/M3 — Workout domain and first persisted workout flow
- State: VERIFYING
- Owner: Project owner
- Created: 2026-09-22
- Updated: 2026-09-22

## Goal

Replace the M1 browser-local workout progress path with a typed, owner-scoped API and PostgreSQL-backed session flow while preserving the deterministic beginner seed.

## In scope

- Workout session domain transitions and contracts.
- Forward-only workout session migration.
- In-memory and Drizzle repositories with ownership and revision checks.
- Template, session, set-completion, and completion API routes.
- Web dashboard/list/detail/active/completed screens using the API.
- Unit/API tests and available quality checks.

## Out of scope

- Production authentication, real AI, hosted infrastructure, background jobs, richer workout metrics, skip/cancel/abandon, correction history, nutrition/activity web expansion, and mobile changes.

## Acceptance criteria

- [ ] A seeded beginner workout can be listed and retrieved.
- [ ] A user can start one session, complete sets, refresh, resume, and complete it.
- [ ] Ownership, invalid transitions, idempotency, and stale revisions are tested.
- [ ] Existing API/domain tests remain passing.
- [ ] Migration SQL is inspected and PostgreSQL verification is recorded honestly.
- [ ] Web loading/error/empty/success states are explicit.

## Evidence

Evidence on 2026-09-22: `pnpm test` passed with 44 tests; `pnpm typecheck`, `pnpm lint`, and `pnpm format:check` passed; `pnpm --filter @forge/web build` passed; generated migration SQL was inspected. `docker compose ps` showed no running services, so PostgreSQL migration/runtime verification is unavailable. No browser automation connector/test runner is configured, so the real browser journey remains unavailable.
