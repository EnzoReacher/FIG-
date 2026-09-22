# FIG current state

<!-- project-status:begin -->

Current milestone: M2/M3 — Persisted beginner workout vertical slice
Current task: M2-002 — Implement persisted beginner workout vertical slice (VERIFYING)
Last completed task: M2-001 — Define workout API persistence boundaries
In-progress task: M2-002 — Implement persisted beginner workout vertical slice
Verification status: API/domain in-memory slice verified — 44 tests, typecheck, configured lint, formatting, web build, and migration SQL inspection passed on 2026-09-22; PostgreSQL runtime and browser automation unavailable
Next action: Start PostgreSQL, apply migration 0005, run database-backed workout checks, then configure/run a browser journey check before accepting M2-002.
<!-- project-status:end -->

## Product direction

FIG is now explicitly web-first, with workout coaching as the core priority. The existing Expo application is preserved as a working prototype and future M9 input, not the primary architecture for M1–M8.

## Implemented and preserved

- pnpm TypeScript monorepo, Fastify API, PostgreSQL, Drizzle, and strict TypeScript configuration.
- Replaceable `AuthAdapter` with deterministic development identity; it is not production authentication.
- Profile and nutrition goals; reusable foods; meal CRUD; owner checks; fixed-point hundredths; profile-timezone daily totals and DST-aware behavior.
- Daily steps with one row per user/day and atomic non-decreasing synchronization.
- Temporary food-photo upload, deterministic provider fixture, confidence/assumptions, editable review, explicit confirmation, expiry, cleanup, and idempotent confirmation.
- Expo mobile vertical slice for profile, nutrition, steps, camera/gallery, review, and confirmation.
- React/Vite `apps/web` slice with FIG shell/navigation, onboarding, deterministic routine generation, exercise guidance, set completion, progress, and browser-local refresh persistence.
- Typed workout contracts in `packages/contracts` and framework-independent routine/progress services in `packages/domain`.
- Existing database tables: `users`, `profiles`, `nutrition_goals`, `foods`, `meals`, `meal_items`, and `daily_steps`.

## Not implemented

- PostgreSQL-backed workout runtime verification and browser automation acceptance.
- Production authentication and multi-device synchronization.
- Production authentication, hosted infrastructure, durable private image storage, real food-analysis provider, observability, deployment, or native iOS support.
- Active use of `packages/domain` and `packages/contracts` for the M1 workout slice; `packages/config` remains a placeholder.

## Active blockers

- PostgreSQL verification is blocked in this environment because `docker compose ps` reports no running services.
- Browser automation and interactive manual review are unavailable because no browser test runner/desktop connector is configured; domain/API behavior is covered by Vitest and the production build succeeds.
- Real food-provider work remains blocked on provider/model, retention/training terms, processing region, cost, latency, secret storage, and private object-storage decisions.
- Physical native verification remains blocked in this environment by missing Android tooling/device setup.

## Highest risks

- Treating in-memory/API tests as PostgreSQL migration/runtime evidence.
- Treating historical release evidence as current verification.
- Importing Forge-Gym-V2 workout code without resolving FIG lifecycle rules.
- Letting shared-package placeholders or the monolithic mobile screen create false confidence in architecture boundaries.
- Editing applied migrations or weakening ownership during domain expansion.

See `RISK_REGISTER.md` for owners and mitigations.

## Verification evidence

Historical evidence from 2026-09-21 is preserved in `RELEASE_AUDIT.md`. Current 2026-09-22 evidence is recorded in `docs/tasks/M2-002-workout-persisted-vertical-slice.md`: 44 tests, typecheck, lint, formatting, web build, and migration SQL generation/inspection passed; PostgreSQL/browser checks remain unavailable.

M0 evidence is recorded in `docs/tasks/M0-001-project-intelligence.md` and `docs/milestones/M0-project-intelligence-acceptance.md`. M1 evidence is recorded in `docs/tasks/M1-001-select-web-framework.md` with 39 tests; deterministic seed content is documented in `docs/WEB_WORKOUT_SEED.md`.

## Working-tree note

At the start of M0-001, user changes already existed in `apps/mobile/package.json` and `pnpm-lock.yaml`. They are preserved and are outside this task's edits.
