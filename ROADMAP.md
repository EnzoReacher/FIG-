# Roadmap

## Completed provider-independent work

1. Workspace, API, PostgreSQL/Drizzle, migrations, development identity, and project controls.
2. Profile, calculated/manual nutrition goals, fixed-point foods, meal CRUD/replacement, timezone totals, and mobile nutrition UI.
3. Android-first Expo Pedometer states, launch/foreground sync, manual fallback, and atomic non-decreasing daily storage.
4. Camera/gallery selection, temporary byte upload, deterministic mock analysis, editable review, explicit confirmation, cleanup, expiry, and idempotency.
5. Privacy boundaries, auth transition seam, API quality expansion, mobile state handling, and documentation/release audit.

## Decision gate

6. **Owner decision required:** select whether and which real server-side vision provider to evaluate under `docs/VISION_PROVIDER_DECISION.md`. No provider or credentials are currently selected.

## Work after explicit decisions

7. Production authentication selection and adapter implementation.
8. Private production object storage, durable cleanup, hosted PostgreSQL/API, secrets management, observability, and deployment.
9. Physical Android verification and fixes discovered through real-device testing.
10. Only after those gates: limited real-user pilot and release criteria.

Health Connect, HealthKit, iOS, background jobs, social/workout/payment/notification features, and wearables remain deferred.
