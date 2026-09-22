# FIG architecture

## Direction

FIG is a pnpm TypeScript monorepo. The target runtime layout is:

- `apps/web`: web-first browser client (M1 React/Vite slice exists; server-backed data follows in M2/M3);
- `apps/api`: Fastify HTTP adapter and application composition;
- `apps/mobile`: preserved Expo prototype and future M9 native client;
- `packages/domain`: framework-independent domain rules;
- `packages/contracts`: runtime-validated transport contracts shared where appropriate;
- `packages/config`: genuinely shared configuration only.

PostgreSQL and Drizzle remain the current persistence choices. Existing nutrition, activity, profile, and food-analysis infrastructure should be preserved until a task packet and decision justify changing it.

## Dependency direction

```text
apps/web ───────┐
apps/mobile ────┼──> contracts / API
                v
             apps/api (transport and composition)
                v
         application use cases and ports
                v
      framework-independent domain rules
                ^
                |
      database/provider infrastructure adapters
```

Rules:

1. UI code does not query PostgreSQL or import Drizzle schema.
2. Domain code does not import React, Fastify, Drizzle, Expo, browser APIs, or provider SDKs.
3. API request/response shapes do not become domain entities by convenience.
4. Database rows do not become public API contracts by convenience.
5. Application use cases own transaction boundaries and orchestrate ports.
6. Infrastructure adapters implement ports; they do not define business policy.
7. Ownership is derived from trusted authentication context and included in every user-owned repository operation.
8. Significant changes to these boundaries require an ADR.

## Bounded contexts

### Workout

Planned entities include Exercise, Equipment, Beginner Plan, Workout Day, Workout Session, Exercise Occurrence, and Set Log. The domain must remain framework-independent. Before M2 implementation, FIG must explicitly decide active-session multiplicity, finish-with-pending-set semantics, skip/cancel/abandon states, correction history, and supported exercise metrics.

Selected Forge-Gym-V2 patterns to adapt include pure transitions, exercise snapshots, owner-scoped repositories, optimistic concurrency, transactional idempotency, integer load units, and PostgreSQL integration tests. See `LEGACY_PROJECT_AUDIT.md`.

### Nutrition

Preserve integer hundredths for calories/macros, reusable foods, meal item snapshots, ownership, atomic item replacement, and profile-timezone day boundaries. Conversion happens at API/display boundaries. Timezone behavior must have DST tests.

### Activity

The domain stores daily activity independent of sensor vendors. M6 supports manual web entry. M9 adapters may read platform providers. Server code must never imply direct access to a phone sensor.

### Food analysis

Provider calls remain behind `FoodAnalysisProvider`. Images are private, bounded, temporary, owner-scoped, and consumed or deleted according to a documented lifecycle. Estimates are versioned, include confidence and assumptions, remain editable, and create no food or meal until explicit confirmation.

## Web UI architecture rules

- Browser routing and route-level data states are explicit.
- Every asynchronous view defines loading, empty, error, success, and retry behavior as applicable.
- Empty collections and search-with-no-results use different guidance.
- Navigation uses semantic links; dialogs and drawers use accessible primitives with focus management and Escape behavior.
- Use `100dvh`, safe-area handling, and flex/grid overflow controls where appropriate.
- Design tokens are semantic: surface, text, muted text, border, action, success, warning, danger, focus, radius, spacing, and elevation.
- Open WebUI is a read-only behavioral reference. Do not copy branding, product code, root layouts, stores, or client-side authorization patterns.

## API and contract rules

- Runtime schemas validate all external input; TypeScript types alone are insufficient.
- Reject unknown or client-controlled ownership fields.
- Validate identifiers, dates, ranges, and safe integer limits explicitly.
- Errors use stable, documented codes and do not reveal whether another user's record exists.
- Mutations that can be retried after an ambiguous response should define idempotency and concurrency behavior.

## Database and migration rules

- Never edit an applied migration.
- Generate or author a new migration, inspect SQL, apply it to a clean/test database, and verify behavior.
- User-owned relations should enforce ownership in queries and, where practical, database constraints.
- Define unique/multiplicity rules explicitly rather than relying on `takeFirst` behavior.
- Migration evidence applies only to the database and commit actually tested.

## Security and privacy boundaries

- `DevelopmentAuthAdapter` is development-only and is not production security.
- Secrets remain server-side and outside source control.
- Temporary image and review stores are currently in-process and non-production.
- Authorization is enforced by the API, never by browser route guards alone.
- Logs and verification evidence must not expose credentials or private image contents.

## Current implementation reality

The repository has a functioning API, an Expo mobile vertical slice for profile, nutrition, activity, and mock food-photo analysis, and an M1 React/Vite web workout slice. The workout domain currently contains deterministic routine/progress services; server-backed sessions, ownership, and persistence remain M2 work. `packages/config` remains a placeholder; contracts and domain now have active M1 consumers.
