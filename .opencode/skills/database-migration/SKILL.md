---
name: Database Migration
description: Inspect FIG schema and create, review, apply, and verify safe forward-only database migrations
---

# Database migration

Use only with an active task packet that states database impact.

## Workflow

1. Inspect `apps/api/src/db/schema.ts`, migration journal/history, repositories, tests, and current database assumptions.
2. Confirm the desired invariant and data-transition strategy. Create an ADR for significant persistence semantics.
3. Add a new migration; never edit an applied migration.
4. Inspect generated SQL for destructive operations, locks, defaults, nullability, ownership, indexes, constraints, and data backfill needs.
5. Run the manifest-defined generation/migration commands against an appropriate local/test database.
6. Verify clean apply and affected repository/API behavior; test representative upgrades when existing data changes.
7. Update schema/architecture/current-state documentation and record exact evidence.

Never run against production or infer permission to drop data. Stop and ask when migration scope, environment, or data-loss risk is unclear.
