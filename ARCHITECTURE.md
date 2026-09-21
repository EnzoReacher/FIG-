# Architecture

## Runtime layout

The pnpm monorepo contains an Expo Router mobile app (`apps/mobile`), a Fastify TypeScript API (`apps/api`), PostgreSQL migrations and Drizzle repositories, and shared package placeholders under `packages/`.

## Identity and ownership

Routes derive identity only from `AuthAdapter` through `requireCurrentUser`; missing identity returns 401. Repositories receive the authenticated internal user UUID and scope profiles, foods, meals, steps, temporary images, and analysis reviews to it. The current deterministic development adapter is replaceable and is not production authentication.

## Nutrition and profile

Nutrition values are stored as integer hundredths and converted only at API/display boundaries. Foods are reusable. Meals own one or more item snapshots referencing owner-scoped foods. Meal updates replace items after all replacements are validated. Daily queries use the profile's authoritative IANA timezone, including variable daylight-saving day lengths. Timezone edits do not migrate old records.

## Steps

Expo Pedometer runs only on the phone. The mobile app queries the current local day on launch and foreground/resume, then sends `{ day, steps, source }`. PostgreSQL enforces one row per user/day; an atomic upsert keeps the greater total. The server never claims sensor access or background reliability.

## Food-photo analysis

The mobile app copies selected media to Expo cache, validates a 5 MiB maximum, reads bytes, uploads supported media through the API, then deletes the cache copy. The development temporary store is owner-scoped and in process. Analysis consumes the image before calling `FoodAnalysisProvider`, validates a versioned result, and creates an expiring review. Only explicit confirmation creates a food and meal; replay is idempotent, while failed, discarded, expired, or unconfirmed reviews create nothing.

`MockFoodAnalysisProvider` is deterministic. A future provider remains behind `FoodAnalysisProvider`; credentials must stay server-side. `ProductionTemporaryImageStorage` defines, but does not implement, private durable storage.

## Known non-production boundaries

- Seeded development identity instead of a selected production auth provider.
- In-process image/review storage instead of durable object storage and cleanup jobs.
- Mock analysis instead of external nutritional intelligence.
- No hosted infrastructure, deployment, background processing, Health Connect, HealthKit, or iOS support.
