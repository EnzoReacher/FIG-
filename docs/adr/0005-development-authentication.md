# ADR 0005: Development authentication

Use a seeded development user behind an explicit `AuthAdapter`. This deterministic identity exists only for local development and tests; it is not production authentication and must not be described as security.

Every route obtains identity from `requireCurrentUser(AuthAdapter)`. Missing identity returns `401 unauthorized`, repository methods always receive that authenticated ID, and client payload IDs cannot override it. User-owned profile, food, meal, step, temporary-image, and analysis-review operations are scoped to this ID.

Before production, replace only the adapter with middleware that validates the selected provider's signed credential, resolves an internal user UUID, handles expiry/revocation, and supplies `AuthenticatedUser`. Add session/token transport, account lifecycle, rate limits, audit logging, and provider-specific tests. Never retain the deterministic development adapter in a production deployment.
