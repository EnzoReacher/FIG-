# Project

Forge-Gym-Health is an independent Android-first health-tracking prototype and must not modify `Forge-Gym-V2`.

## Product proof

1. Manual calories and macros through reusable foods and editable meals.
2. Phone step display through Expo Pedometer with client-sourced API synchronization and manual fallback.
3. Temporary food-photo analysis with an editable estimate and explicit confirmation before log insertion.

The app is a health and fitness aid, not a medical diagnostic tool. Nutrition estimates and calculated goals must be presented as estimates.

## Project control

- Stable branch: `main`
- Current task branch: `task/m0-api-database`
- Current phase at this document update: provider-independent release audit and vision-provider decision gate
- Package manager: pnpm
- API: Fastify + TypeScript + Zod
- Database: PostgreSQL + Drizzle
- Mobile: Expo React Native, Android first

Production authentication, a real analysis provider, iOS, HealthKit, Health Connect, background jobs, hosting, object storage, deployment, payments, notifications, social/workout features, and wearables remain deferred.
