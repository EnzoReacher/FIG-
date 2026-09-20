# Current state

## Completed

- Renamed the stable branch from `master` to `main`.
- Created and switched to `task/m0-foundation`.
- Added the pnpm monorepo foundation and generated `pnpm-lock.yaml`.
- Added Fastify API shell with an independent `/health` endpoint.
- Added Expo Router mobile shell and verified its Expo configuration.
- Added local PostgreSQL Docker Compose configuration.
- Added Drizzle migration tooling and the first application migration for users, profiles, and nutrition goals.
- Added a deterministic seeded development user and development authentication adapter.
- Added authenticated `GET /v1/profile` and `PATCH /v1/profile` routes with Zod-validated profile updates.
- Added `GET /v1/nutrition-goal` and `PATCH /v1/nutrition-goal`, with Mifflin–St Jeor calculations, macro defaults, and manual calorie-target overrides.
- Added nutrition foods, meals, meal items, fixed-point hundredths storage, timezone-aware daily totals, validated CRUD routes, and in-memory repository coverage.
- Added a functional Expo Today dashboard with API-backed meals, calorie/macro totals, manual food entry, delete action, loading, retry, and unavailable API states.
- Added daily steps persistence, StepSource and mock source interfaces, idempotent synchronization routes, permission/unavailable responses, and dashboard step states.
- Added project documentation and ADR decision records.
- Confirmed the database contains exactly the three approved foundation tables after migration.

## Files changed

Added or updated API database schema, migrations, nutrition and step repositories/routes/tests, profile repository/routes, validation, API tests, and the mobile dashboard. No Forge-Gym-V2 files were changed.

## Verification

All commands below passed:

- `pnpm install` — passed after approving local esbuild dependency build scripts; generated the lockfile.
- `pnpm install --frozen-lockfile` — passed.
- `docker compose up -d --wait postgres` — passed; PostgreSQL became healthy.
- `pnpm db:migrate` — passed; empty foundation migration applied.
- `docker compose exec -T postgres psql -U forge -d forge_gym_health -c '\\dt'` — passed; no relations found.
- `pnpm test` — passed; 1 health endpoint test.
- `pnpm typecheck` — passed.
- `pnpm lint` — passed.
- `pnpm format:check` — passed.
- `pnpm --filter @forge/mobile exec expo config --json` — passed; Android package resolved as `com.forgegymhealth.app`.
- API process smoke test with `curl http://localhost:3000/health` — passed with `{\"status\":\"ok\"}`.
- `pnpm --filter @forge/api db:generate` — passed; generated the users/profiles/nutrition-goals migration.
- `pnpm db:migrate` — passed; migration and deterministic development-user seed applied.
- PostgreSQL inspection — passed; exactly `users`, `profiles`, and `nutrition_goals` exist, with one seeded user, profile, and goal.
- `pnpm test` — passed; 6 API tests covering health, valid profile updates, invalid input, calculated/manual goals, and missing users.
- `pnpm typecheck` — passed.
- `pnpm lint` — passed.
- `pnpm format:check` — passed.
- `pnpm install --frozen-lockfile` — passed after adding the Zod dependency.
- `docker compose up -d --wait postgres` — passed.
- `pnpm db:migrate` — passed; nutrition tables migration applied.
- `pnpm test` — passed; 8 API/repository tests.
- `pnpm typecheck` — passed.
- `pnpm lint` — passed.
- `pnpm format:check` — passed.
- `git diff --check` — passed.
- `pnpm --filter @forge/mobile typecheck` — passed.
- `pnpm --filter @forge/mobile lint` — passed.
- `pnpm --filter @forge/api db:generate` — passed for daily steps migration.
- `pnpm db:migrate` — passed.
- `pnpm test` — passed; 9 tests.

## Blockers

- Android SDK, Java, adb, and emulator tooling are not installed in the current environment, so real-device mobile verification is not available yet.

## Risks

- Expo Pedometer behavior and permission handling require Android-device verification in Milestone 3.
- Food-photo nutrition remains an estimate and will require explicit confidence, assumptions, editing, and confirmation in later milestones.

## Next task

Implement Milestone 4 provider-isolated food-photo analysis foundation with explicit confirmation.
