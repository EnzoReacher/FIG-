# Current state

## Completed

- Monorepo foundation, Fastify API, Expo Router app, local PostgreSQL, Drizzle, and development authentication.
- Profile and nutrition-goal endpoints with validation and fixed-point hundredths storage.
- Nutrition food creation/listing and meal CRUD with ownership checks, timezone-aware daily totals, and meal-item replacement in database and in-memory repositories.
- Mobile profile editing covers timezone, age, sex, height, weight, activity, goal, estimated targets, and a visible manual calorie override. Today supports full macro entry, quantity and meal-time editing, deletion confirmation, reusable foods, and immediate target progress refresh.
- Daily steps table with a unique `(user_id, day)` constraint and atomic non-decreasing upsert. The API accepts validated client totals and source metadata; it does not attempt to read a phone sensor.
- Mobile foreground/resume synchronization through the Expo SDK 52-compatible `expo-sensors` Pedometer API, with device-local permission handling, daily totals, and manual fallback. The API does not read a server-side sensor.
- Camera/gallery capture uses Expo ImagePicker with permission, cancel, retry, preview, and unavailable-device states. The mobile app copies selected media to cache, uploads bounded image bytes rather than a device-only URI, and deletes the cache copy.
- Deterministic mock food analysis uses versioned provider input/output schemas with provider/model metadata, detected items, portion estimates, confidence, assumptions, normalized failures, and single-food, mixed-meal, and low-confidence fixtures. Results remain editable and require explicit confirmation.
- Temporary image records are owner-scoped, expire after 15 minutes, and are consumed before provider analysis. Review records expire, support discard, and make repeated confirmation idempotent so one analysis creates at most one meal.
- No real AI provider, provider secret, or Forge-Gym-V2 file has been added or changed.

## Actual database tables

`users`, `profiles`, `nutrition_goals`, `foods`, `meals`, `meal_items`, and `daily_steps`.

## Verification

The latest audit covers route, repository, confirmation idempotency, non-decreasing step totals, fixed-point nutrition, ownership, not-found behavior, meal replacement, DST day bounds, confirmation/discard, expiry, cleanup, temporary byte uploads, and API client-sync behavior.

## Blockers and limitations

- Android SDK, Java, adb, and an emulator/device are not installed here, so real-device Expo camera, gallery, Pedometer, and permission behavior cannot be verified.
- Temporary image and review stores are in-process and development-only; process restarts discard pending work, and production object storage with durable deletion is still required.
- Food analysis remains deterministic mock estimation. Production authentication and a real analysis provider remain out of scope.

## Exact next milestone

Complete provider-independent privacy, authentication-boundary, test, mobile-state, documentation, and release audits. Then stop at the documented vision-provider decision gate; do not select or call a provider automatically.
