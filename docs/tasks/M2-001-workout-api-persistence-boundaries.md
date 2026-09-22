# M2-001 — Define workout API and persistence boundaries

## Identity

- Task ID: M2-001
- Task name: Define workout API and persistence boundaries
- Milestone: M2 — Workout domain
- State: COMPLETED
- Owner: Project owner
- Created: 2026-09-21
- Updated: 2026-09-22

## Goal

Define the server-backed workout contract and persistence boundaries needed to replace M1 browser-local state without weakening ownership, validation, or migration safety.

## Context

- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/LEGACY_PROJECT_AUDIT.md`
- `docs/WEB_WORKOUT_SEED.md`
- `docs/adr/0009-web-first-delivery.md`
- `docs/adr/0010-web-framework.md`
- Existing `apps/api`, Drizzle schema, and `packages/domain` workout services.

## In scope

- Decide workout session multiplicity and lifecycle semantics.
- Define typed API contracts, ownership behavior, persistence shape, concurrency, and retry/idempotency requirements.
- Produce an ADR and bounded implementation plan before creating migrations or routes.

## Out of scope

- Production authentication.
- Editing applied migrations.
- Native clients, real AI providers, hosted infrastructure, or broad web features.
- Implementing all workout history, analytics, or social features.

## Expected files

- `docs/adr/0011-workout-persistence-boundaries.md`
- `docs/tasks/M2-001-workout-api-persistence-boundaries.md`
- Potentially typed contracts and API design documents; no migration unless explicitly added to the packet after decision review.

## Architecture constraints

- Domain services remain framework-independent.
- Web uses API contracts and never imports database code.
- Ownership comes from trusted auth context, not request payloads.
- Existing nutrition/activity/photo APIs and migrations remain intact.
- Use forward-only migrations and inspect generated SQL if schema work becomes necessary.

## API impact

Design only in this task; no route implementation until the decision is accepted.

## Database impact

Design only. Do not modify applied migrations.

## UI impact

Document the transition from browser-local persistence to server-backed workout state and the recovery behavior expected after API errors or refresh.

## Security considerations

- Cross-owner reads must not enumerate records.
- Validate all external input at runtime.
- Do not treat browser route state as authorization.
- Define idempotency retention and stale-write behavior before mutation routes exist.

## Acceptance criteria

- [x] Active-session and same-day multiplicity are explicitly decided.
- [x] Finish, skip/cancel/abandon, correction, and supported metrics are explicitly decided.
- [x] API contracts, ownership, errors, concurrency, and idempotency are documented.
- [x] Database invariants and migration strategy are documented without editing applied migrations.
- [x] The next implementation packet is bounded in M2-002.

## Automated tests

- [x] Existing baseline tests remain passing.
- [x] Contract/domain test additions are identified in M2-002.

## Manual verification

- [x] Persistence decisions are recorded in ADR 0011 and implementation is bounded in M2-002.

## Risks

- Premature schema design may lock in incomplete workout semantics.
  - Mitigation: decide lifecycle and metric rules before migration work.
- Local-storage behavior may diverge from server recovery.
  - Mitigation: preserve M1 behavior tests and define canonical API recovery before replacing it.

## Definition of done

- [x] All decisions and alternatives are documented.
- [x] No migration was rewritten.
- [x] Evidence and exact next implementation task are recorded.
- [x] `docs/CURRENT_STATE.md` points to the implementation packet.

## Evidence

ADR 0011 records the accepted lifecycle, ownership, concurrency, idempotency, and migration decisions. No applied migration was changed.

## Completion summary

Design complete. Execute `docs/tasks/M2-002-workout-persisted-vertical-slice.md` as the next bounded implementation task.
