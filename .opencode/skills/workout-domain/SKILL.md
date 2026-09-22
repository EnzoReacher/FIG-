---
name: Workout Domain
description: Implement and test FIG workout entities, lifecycle rules, ownership, plans, sessions, and set behavior
---

# Workout domain

Read `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/LEGACY_PROJECT_AUDIT.md`, and the active M2/M3 packet.

## Before implementation

Confirm decisions for active-session multiplicity, same-day sessions, finish with unperformed sets, skip/cancel/abandon, correction history, supported metrics, units, and retry/concurrency semantics. Create ADRs where needed.

## Implementation rules

- Keep entities and transitions framework-independent and deterministic.
- Preserve stable occurrence/set identity and snapshots needed for trustworthy history.
- Derive ownership from trusted context and scope repositories by owner.
- Use explicit value objects/types for dates, timestamps, units, versions, and metrics.
- Define invalid transitions with stable domain outcomes.
- Use optimistic concurrency/idempotency where retries or multiple clients can conflict.

## Tests

Cover happy paths, every invalid transition, multiple exercises/sets, immutability, ownership isolation, stale versions, duplicate concurrent requests, persistence hydration/order, and the M3 refresh/resume journey.
