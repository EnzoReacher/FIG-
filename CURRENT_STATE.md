# Current state

## Completed

- Monorepo foundation, Fastify API, Expo Router app, local PostgreSQL, Drizzle, and development authentication.
- Profile and nutrition-goal endpoints with validation and fixed-point hundredths storage.
- Nutrition food creation/listing and meal CRUD with ownership checks, timezone-aware daily totals, and meal-item replacement in database and in-memory repositories.
- Mobile Today meal editing supports renaming meals, changing quantities, removing items, and adding saved foods; the Today screen displays the current calorie target when available.
- Daily steps table with a unique `(user_id, day)` constraint and atomic non-decreasing upsert. The API accepts validated client totals and source metadata; it does not attempt to read a phone sensor.
- Mobile foreground/resume synchronization through the Expo SDK 52-compatible `expo-sensors` Pedometer API, with device-local permission handling, daily totals, and manual fallback. The API does not read a server-side sensor.
- Camera/gallery capture through Expo ImagePicker with permission, cancel, retry, and unavailable-device states. Selected media is copied to a temporary cache file, uploaded through the temporary contract, and removed after analysis; confirmation remains explicit.
- Deterministic mock food analysis with visible confidence and assumptions, editable review, and unconfirmed results excluded from meal totals.
- Temporary image records expire after 15 minutes, are deleted after analysis or confirmation, can be explicitly discarded, and are cleaned up when analysis fails.
- No real AI provider, provider secret, or Forge-Gym-V2 file has been added or changed.

## Actual database tables

`users`, `profiles`, `nutrition_goals`, `foods`, `meals`, `meal_items`, and `daily_steps`.

## Verification

The latest audit covers route, repository, idempotency, non-decreasing-total, fixed-point, ownership, not-found, meal editing, confirmation/discard, expiry, cleanup, temporary-analysis, and API client-sync behavior.

## Blockers and limitations

- Android SDK, Java, adb, and an emulator/device are not installed here, so real-device Expo camera, gallery, Pedometer, and permission behavior cannot be verified.
- The temporary upload store is in-process and development-only; production object storage, authentication, and durable deletion are still required.
- Food analysis remains deterministic mock estimation. Production authentication and a real analysis provider remain out of scope.

## Exact next milestone

Milestone 4: define and implement a server-side vision-provider integration only after an explicit provider decision, with secrets supplied through deployment configuration. Until then, continue device validation and productionize temporary image storage without adding a real provider here.
