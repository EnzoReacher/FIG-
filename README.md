# Forge Gym Health

Mobile-first gym, nutrition, and activity app. This repository is separate from `Forge-Gym-V2`.

## Local development

```bash
pnpm install
docker compose up -d postgres
pnpm db:migrate
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
```

Run the API with `pnpm dev:api` and the Expo shell with `pnpm dev:mobile`.

Milestone 0 intentionally contains no nutrition, meal, step, or food-analysis tables.
