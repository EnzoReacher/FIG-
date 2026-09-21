# Vision provider decision gate

No real provider is selected or called by this repository. The owner must make an explicit decision before implementation.

## Required capabilities

- Accept JPEG, PNG, or WebP food images up to the product's configured maximum.
- Identify one or more plausible foods and estimate portions.
- Return calories, protein, carbohydrates, and fat as estimates.
- Return confidence values in `[0, 1]` plus human-readable assumptions.
- Support predictable timeouts, retry classification, and schema validation.

## Privacy and retention requirements

- Images must be sent only from the server, never directly from the mobile app with a provider secret.
- Transport encryption and private server-side access are mandatory.
- Prefer no provider training and zero/minimal retention; document any abuse-monitoring retention, region, subprocessors, and deletion controls.
- Original images remain temporary and are deleted after analysis by default. Provider terms must permit that lifecycle.
- Do not send user identity, filenames, local paths, or unrelated metadata when image bytes are sufficient.

## Expected contract

Input remains the existing `FoodAnalysisProvider` input: media type, validated bytes, and size metadata. Output must map to schema version `1`: provider/model metadata, reviewed display name, portion description, detected items, calories/macros, confidence, and assumptions. Provider-native output must be translated and validated server-side; it must not leak directly to mobile clients.

## Reliability and failure behavior

- Define a server-side timeout and distinguish timeout, provider failure, malformed output, and unsupported input.
- Retrying analysis must be safe and must never insert a meal.
- Low confidence stays editable and visible; it is not silently rejected or treated as exact.
- Failed or empty output returns a safe normalized error and preserves manual entry.
- Confirmation remains separate and idempotent; provider completion alone never changes daily totals.

## Cost and latency evaluation

Before selection, compare approximate cost per analyzed image, minimum commitments, image/token pricing, retry cost, rate limits, and expected monthly volume. Measure median and tail latency on representative single-food, mixed-meal, low-light, and ambiguous images. Establish a budget and acceptable timeout before enabling paid traffic.

## Secrets and integration

Credentials must live in server deployment secret storage and enter only through server environment/configuration. Never commit keys, place them in Expo configuration, log them, or return them in API responses. The selected implementation must remain behind `FoodAnalysisProvider` so the deterministic mock and tests remain provider-free.

## Owner decision required

The owner must explicitly approve: (1) whether to integrate a real provider now, (2) the provider and model to evaluate, (3) acceptable retention/training terms and processing region, (4) monthly cost ceiling and latency target, and (5) the production secrets/storage platform. Until then, keep `MockFoodAnalysisProvider` and make no external calls.
