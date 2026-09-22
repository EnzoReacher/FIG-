# ADR 0011: Workout persistence boundaries

- Status: Accepted for M2/M3 implementation
- Date: 2026-09-22
- Deciders: Project owner
- Related tasks: M2-001, M2-002

## Context

The M1 browser slice generates a deterministic beginner routine and stores progress in local storage. The first persisted web journey needs server-backed sessions without weakening FIG's ownership, domain, or migration boundaries.

## Decisions

- A user may have at most one active workout session at a time. Starting the same template while an active session exists resumes that session rather than creating a duplicate.
- A user may have multiple completed sessions on the same local date. The first slice does not expose date-based scheduling rules.
- Completing a workout requires every prescribed set to be complete. Leaving the browser leaves the session active and resumable; pause/abandon/cancel states are deferred.
- Set completion is monotonic and idempotent. Repeating an equivalent request returns the canonical session without creating another completion.
- Mutations carry the session revision observed by the client and a request key. A mismatched revision returns `workout_session_conflict`; repeated request keys return the original canonical result.
- Session exercises and sets retain snapshots of the seeded exercise name, order, instructions, safety notes, prescription, and equipment. Catalog changes cannot rewrite workout history.
- This slice supports prescribed repetitions as text and completed-set state. Load, distance, RPE/RIR, correction history, and skipped sets are deferred.
- Ownership is always derived from the authenticated user. Repository operations include the owner ID and return not-found for records belonging to another owner.

## Persistence shape

The new forward-only migration adds `workout_sessions`, `workout_session_exercises`, and `workout_session_sets`. Child rows carry owner IDs and composite foreign keys where practical. A partial unique index prevents two active sessions for one owner. The application still enforces the same invariant for in-memory tests.

## Consequences

The web client can refresh and resume from the API, while the domain remains framework-independent. The first implementation is intentionally narrower than a complete workout history system; later tasks must decide correction, cancellation, richer metrics, and idempotency retention before expanding the schema.
