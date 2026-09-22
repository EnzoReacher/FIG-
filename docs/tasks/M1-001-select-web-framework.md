# M1-001 — Select the FIG web framework

## Identity

- Task ID: M1-001
- Task name: Select the FIG web framework
- Milestone: M1 — Web foundation
- State: COMPLETED
- Owner: Project owner
- Created: 2026-09-21
- Updated: 2026-09-21

## Goal

Choose and record the smallest suitable strict-TypeScript web framework/toolchain for FIG's browser-first application and use it for the first bounded workout vertical slice.

## Context

- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/LEGACY_PROJECT_AUDIT.md`
- Existing pnpm workspace and API contracts.

## In scope

- Evaluate a small set of viable browser frameworks against FIG requirements.
- Decide routing/rendering mode, test approach, API proxy, and accessible component strategy at an architectural level.
- Record the accepted decision in a new ADR.
- Scaffold the first deterministic workout vertical slice.

## Out of scope

- Future web features beyond the onboarding/workout slice.
- Workout API/database persistence.
- Changing API, database, mobile app, or deployment.

## Expected files

- `docs/adr/0010-web-framework.md`
- `apps/web/**`
- `apps/web/src/storage.test.ts`
- `packages/contracts/src/workout.ts`
- `packages/domain/src/workout.ts`
- `docs/tasks/M1-001-select-web-framework.md`
- `docs/CURRENT_STATE.md`
- `docs/RISK_REGISTER.md` only if the decision changes risk exposure.

## Architecture constraints

- Web remains an API client and cannot access Drizzle/database code.
- Strict TypeScript, pnpm workspace compatibility, browser routing, accessibility, responsive behavior, and testability are required.
- Do not choose SPA/SSR/SSG behavior by copying Open WebUI; decide from FIG needs.

## API impact

None.

## Database impact

None.

## UI impact

The decision and implementation establish the first route/shell/component testing platform and bounded workout UI.

## Security considerations

- Client route guards are not authorization.
- Development proxy/configuration must not expose server secrets.
- Dependency footprint and maintenance posture are decision criteria.

## Acceptance criteria

- [x] At least two viable options and a minimal no-framework alternative are evaluated.
- [x] Decision drivers include routing, accessibility, responsive UI, data loading, testing, deployment flexibility, maintenance, and pnpm compatibility.
- [x] The accepted ADR 0010 records the framework/toolchain and tradeoffs.
- [x] A deterministic onboarding-to-workout browser slice exists.
- [x] Routine generation and progress behavior have unit tests.
- [x] Browser-local progress survives refresh when storage is available and is covered by storage unit tests.

## Automated tests

`pnpm install --frozen-lockfile`, `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, and `pnpm --filter @forge/web build`.

## Manual verification

- [x] The selected minimal React/Vite approach is recorded in ADR 0010.

## Risks

- Premature framework choice creates unnecessary complexity.
  - Mitigation: compare against FIG's actual M1–M3 needs and prefer the smallest sufficient option.

## Definition of done

- [x] ADR is accepted by the owner through the fixed project direction and current task execution.
- [x] Evidence and known limitations are recorded.
- [x] `docs/CURRENT_STATE.md` is updated.

## Evidence

Initial framework decision was recorded as React 18 + Vite 5.4 with browser-local persistence.

Verification evidence:

- `pnpm install --frozen-lockfile`: passed after workspace manifests and lockfile were updated.
- `pnpm test`: passed, 8 files and 39 tests.
- `pnpm typecheck`: passed for all six configured TypeScript workspaces.
- `pnpm lint`: passed; configured lint scripts run TypeScript checks.
- `pnpm --filter @forge/web build`: passed, Vite production build generated `apps/web/dist`.
- `pnpm format:check`: passed.
- `git diff --check`: passed.
- Browser automation and interactive manual review were unavailable because no browser test runner is configured and the desktop browser connector was not connected in this session. The production build completed successfully; domain behavior and full repository checks passed.

## Completion summary

The M1 web slice is complete for this bounded scope. Workout API/database persistence, real browser automation, and web nutrition routes remain future slices.
