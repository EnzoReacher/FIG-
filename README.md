# Forge Gym Health

FIG is a web-first beginner gym-coach application and the successor to Forge Gym. Workout coaching is the primary product direction. The repository also contains an earlier mobile nutrition, activity, and food-photo prototype whose valid backend/domain work will be preserved and adapted.

## Implemented

- Profile-based calorie and macro targets with optional manual calorie override.
- Reusable foods, fixed-point nutrition values, meal CRUD, item replacement, and profile-timezone daily totals.
- Expo Pedometer foreground/current-day reads with client-sourced, atomic, non-decreasing API sync and manual fallback.
- Camera/gallery selection, temporary byte upload, deterministic mock food analysis, editable review, explicit confirmation, discard, expiry, and idempotent confirmation.

Food-photo values are estimates, not exact measurements or medical advice. The current analysis provider is deterministic test logic, not nutritional intelligence.

## Local development

Requirements: Node.js, pnpm 11.21.0, Docker Compose, and an Android-capable Expo environment for device testing.

```bash
cp .env.example .env
pnpm install --frozen-lockfile
docker compose up -d postgres
pnpm db:generate
pnpm db:migrate
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
```

Run the API with `pnpm dev:api`, the FIG web app with `pnpm dev:web`, and the existing Expo prototype with `pnpm dev:mobile`. A physical Android device must use the development machine's LAN address in `EXPO_PUBLIC_API_URL`, not `localhost`. The web workout slice uses the typed workout API; it stores only the active session ID locally so the server remains canonical after refresh.

## Android verification still required

This environment has not verified a physical device or emulator. On a configured machine:

```bash
adb devices
pnpm dev:api
EXPO_PUBLIC_API_URL=http://<development-machine-lan-ip>:3000 pnpm dev:mobile
```

Verify activity, camera, and gallery permissions; zero and increasing steps; app foreground/resume sync; manual fallback; camera/gallery cancel and retry; editable analysis; discard; and exactly-once confirmation.

## Development-only boundaries

- `DevelopmentAuthAdapter` always supplies a seeded local user. It is not production security.
- Temporary image and analysis-review stores are in process and disappear on restart. There is no production object storage.
- There is no real vision provider, provider key, hosted infrastructure, background step job, Health Connect, HealthKit, iOS support, or deployment configuration.

See `docs/PRODUCT.md`, `docs/CURRENT_STATE.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, and `docs/AI_DEVELOPMENT_SYSTEM.md`.
